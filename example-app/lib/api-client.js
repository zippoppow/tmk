import { TMK_API_BASE_URL } from './tmkApiOrigin.js';

/**
 * TMK API Client
 * 
 * Utility for interacting with the TMK API backend using environment-configured base URLs
 * Provides methods to fetch and manage:
 * - Morphemes
 * - Words
 * - Wordlists
 * - Wordfamilies
 */

const API_BASE_URL = TMK_API_BASE_URL;
const AUTH_TOKEN_ENDPOINT = '/api/auth/token';
const AUTH_GRANT_TYPE = process.env.NEXT_PUBLIC_TMK_API_AUTH_GRANT_TYPE || 'client_credentials';
const STATIC_ACCESS_TOKEN = (process.env.NEXT_PUBLIC_TMK_API_ACCESS_TOKEN || '').trim();
const API_KEY_FALLBACK = (process.env.NEXT_PUBLIC_TMK_API_KEY || process.env.NEXT_PUBLIC_API_AUTH_KEY || '').trim();
const AUTH_CLIENT_ID = (process.env.NEXT_PUBLIC_TMK_API_AUTH_CLIENT_ID || '').trim();
const AUTH_CLIENT_SECRET = (process.env.NEXT_PUBLIC_TMK_API_AUTH_CLIENT_SECRET || '').trim();

let cachedAccessToken = '';
let cachedAccessTokenExpiresAt = 0;
let pendingTokenRequest = null;
const authDebugState = {
  authGrantType: AUTH_GRANT_TYPE,
  hasApiKeyFallback: Boolean(API_KEY_FALLBACK),
  usingStaticAccessToken: Boolean(STATIC_ACCESS_TOKEN),
  hasCachedToken: false,
  cacheExpiresAt: 0,
  lastAuthMode: 'none',
  lastTokenError: '',
  lastRequestEndpoint: '',
  lastRequestAt: '',
  lastResponseStatus: null,
};

function updateAuthCacheDebugState() {
  authDebugState.hasCachedToken = Boolean(cachedAccessToken);
  authDebugState.cacheExpiresAt = cachedAccessTokenExpiresAt;
}

function markAuthDebugState(partial) {
  Object.assign(authDebugState, partial);
  updateAuthCacheDebugState();
}

function clearAccessTokenCache() {
  cachedAccessToken = '';
  cachedAccessTokenExpiresAt = 0;
  updateAuthCacheDebugState();
}

function getAccessTokenFromPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  if (typeof payload.access_token === 'string' && payload.access_token.trim()) {
    return payload.access_token.trim();
  }

  if (payload.data && typeof payload.data === 'object') {
    const nested = payload.data;
    if (typeof nested.access_token === 'string' && nested.access_token.trim()) {
      return nested.access_token.trim();
    }
  }

  return '';
}

function getExpiresInSecondsFromPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return 0;
  }

  const candidates = [
    payload.expires_in,
    payload.expiresIn,
    payload?.data?.expires_in,
    payload?.data?.expiresIn,
  ];

  for (const value of candidates) {
    const seconds = Number(value);
    if (Number.isFinite(seconds) && seconds > 0) {
      return seconds;
    }
  }

  return 0;
}

async function requestAccessToken(forceRefresh = false) {
  if (STATIC_ACCESS_TOKEN) {
    return STATIC_ACCESS_TOKEN;
  }

  const now = Date.now();
  const tokenStillValid = cachedAccessToken && now < cachedAccessTokenExpiresAt - 30000;
  if (!forceRefresh && tokenStillValid) {
    return cachedAccessToken;
  }

  if (!forceRefresh && pendingTokenRequest) {
    return pendingTokenRequest;
  }

  pendingTokenRequest = (async () => {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (API_KEY_FALLBACK) {
      headers['x-api-key'] = API_KEY_FALLBACK;
    }

    const body = {
      grant_type: AUTH_GRANT_TYPE,
    };

    if (AUTH_CLIENT_ID) {
      body.client_id = AUTH_CLIENT_ID;
    }

    if (AUTH_CLIENT_SECRET) {
      body.client_secret = AUTH_CLIENT_SECRET;
    }

    const response = await fetch(`${API_BASE_URL}${AUTH_TOKEN_ENDPOINT}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(
        `Token request failed: ${response.status} ${response.statusText}${errorBody ? ` - ${errorBody}` : ''}`
      );
    }

    const payload = await response.json().catch(() => ({}));
    const accessToken = getAccessTokenFromPayload(payload);
    if (!accessToken) {
      throw new Error('Token request succeeded but no access_token was returned');
    }

    const expiresIn = getExpiresInSecondsFromPayload(payload);
    cachedAccessToken = accessToken;
    cachedAccessTokenExpiresAt = expiresIn > 0 ? Date.now() + expiresIn * 1000 : Date.now() + 5 * 60 * 1000;

    return accessToken;
  })();

  try {
    return await pendingTokenRequest;
  } finally {
    pendingTokenRequest = null;
  }
}

async function authenticatedFetch(endpoint, init = {}) {
  const headers = new Headers(init.headers || {});
  let token = '';

  markAuthDebugState({
    lastRequestEndpoint: endpoint,
    lastRequestAt: new Date().toISOString(),
    lastResponseStatus: null,
  });

  try {
    token = await requestAccessToken();
    markAuthDebugState({ lastTokenError: '' });
  } catch (error) {
    markAuthDebugState({ lastTokenError: error?.message || 'Unknown token exchange error' });
    if (process.env.NODE_ENV !== 'production') {
      console.warn('TMK token exchange failed; falling back to x-api-key when available.', error);
    }
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
    markAuthDebugState({
      lastAuthMode: STATIC_ACCESS_TOKEN ? 'bearer-static' : 'bearer-token-endpoint',
    });
  } else if (API_KEY_FALLBACK) {
    headers.set('x-api-key', API_KEY_FALLBACK);
    markAuthDebugState({ lastAuthMode: 'x-api-key' });
  } else {
    markAuthDebugState({ lastAuthMode: 'none' });
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...init,
    headers,
  });
  markAuthDebugState({ lastResponseStatus: response.status });

  if (response.status === 401 && token) {
    clearAccessTokenCache();
    const refreshedToken = await requestAccessToken(true).catch((error) => {
      markAuthDebugState({ lastTokenError: error?.message || 'Token refresh failed' });
      return '';
    });
    if (refreshedToken) {
      headers.set('Authorization', `Bearer ${refreshedToken}`);
      markAuthDebugState({
        lastAuthMode: 'bearer-token-refreshed',
        lastTokenError: '',
      });
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...init,
        headers,
      });
      markAuthDebugState({ lastResponseStatus: response.status });
    }
  }

  return response;
}

export function getApiAuthDebugInfo() {
  updateAuthCacheDebugState();
  return {
    ...authDebugState,
  };
}


/**
 * Generic fetch wrapper with error handling
 */
async function fetchFromAPI(endpoint) {
  try {
    const response = await authenticatedFetch(endpoint);
    
    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(`API Error: ${response.status} ${response.statusText}${errorBody ? ` - ${errorBody}` : ''}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Generic fetch wrapper with error handling for POST requests
 */
async function postToAPI(endpoint, data) {
  try {
    const response = await authenticatedFetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`API Error Body: ${errorBody}`);
      throw new Error(`API Error: ${response.status} ${response.statusText}${errorBody ? ` - ${errorBody}` : ''}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to post to ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Morphemes API
 */
export const morphemesAPI = {
  /**
   * Get all morphemes
   * @param {Object} options - Query options (limit, skip, etc.)
   * @returns {Promise<Array>}
   */
  async getAll(options = {}) {
    const params = new URLSearchParams(options);
    return fetchFromAPI(`/api/morphemes?${params}`);
  },

  /**
   * Get a single morpheme by ID
   * @param {string} id - Morpheme ID
   * @returns {Promise<Object>}
   */
  async getById(id) {
    return fetchFromAPI(`/api/morphemes/${id}`);
  },

  /**
   * Search morphemes
   * @param {string} query - Search query
   * @returns {Promise<Array>}
   */
  async search(query) {
    const params = new URLSearchParams({ search: query });
    return fetchFromAPI(`/api/morphemes/search?${params}`);
  },

  /**
   * Create a new morpheme
   * @param {Object} morphemeData - Data for the new morpheme
   * @returns {Promise<Object>}
   */
  async create(morphemeData) {
    return postToAPI('/api/morphemes', morphemeData);
  },
};

/**
 * Words API
 */
export const wordsAPI = {
  /**
   * Get all words
   * @param {Object} options - Query options (limit, skip, etc.)
   * @returns {Promise<Array>}
   */
  async getAll(options = {}) {
    const params = new URLSearchParams(options);
    return fetchFromAPI(`/api/words?${params}`);
  },

  /**
   * Get a single word by ID
   * @param {string} id - Word ID
   * @returns {Promise<Object>}
   */
  async getById(id) {
    return fetchFromAPI(`/api/words/${id}`);
  },

  /**
   * Search words
   * @param {string} query - Search query
   * @returns {Promise<Array>}
   */
  async search(query) {
    const params = new URLSearchParams({ search: query });
    return fetchFromAPI(`/api/words/search?${params}`);
  },

  /**
   * Get words by morpheme
   * @param {string} morphemeId - Morpheme ID
   * @returns {Promise<Array>}
   */
  async getByMorpheme(morphemeId) {
    return fetchFromAPI(`/api/words/morpheme/${morphemeId}`);
  },
};

/**
 * Wordlists API
 */
export const wordlistsAPI = {
  /**
   * Get all wordlists
   * @param {Object} options - Query options (limit, skip, etc.)
   * @returns {Promise<Array>}
   */
  async getAll(options = {}) {
    const params = new URLSearchParams(options);
    return fetchFromAPI(`/api/wordlists?${params}`);
  },

  /**
   * Get a single wordlist by ID
   * @param {string} id - Wordlist ID
   * @returns {Promise<Object>}
   */
  async getById(id) {
    return fetchFromAPI(`/api/wordlists/${id}`);
  },

  /**
   * Get words in a wordlist
   * @param {string} id - Wordlist ID
   * @returns {Promise<Array>}
   */
  async getWords(id) {
    return fetchFromAPI(`/api/wordlists/${id}/words`);
  },

  /**
   * Search wordlists
   * @param {string} query - Search query
   * @returns {Promise<Array>}
   */
  async search(query) {
    const params = new URLSearchParams({ search: query });
    return fetchFromAPI(`/api/wordlists/search?${params}`);
  },
};

/**
 * Wordfamilies API
 */
export const wordfamiliesAPI = {
  /**
   * Get all wordfamilies
   * @param {Object} options - Query options (limit, skip, etc.)
   * @returns {Promise<Array>}
   */
  async getAll(options = {}) {
    const params = new URLSearchParams(options);
    return fetchFromAPI(`/api/wordfamilies?${params}`);
  },

  /**
   * Get a single wordfamily by ID
   * @param {string} id - Wordfamily ID
   * @returns {Promise<Object>}
   */
  async getById(id) {
    return fetchFromAPI(`/api/wordfamilies/${id}`);
  },

  /**
   * Get words in a wordfamily
   * @param {string} id - Wordfamily ID
   * @returns {Promise<Array>}
   */
  async getWords(id) {
    return fetchFromAPI(`/api/wordfamilies/${id}/words`);
  },

  /**
   * Get morphemes in a wordfamily
   * @param {string} id - Wordfamily ID
   * @returns {Promise<Array>}
   */
  async getMorphemes(id) {
    return fetchFromAPI(`/api/wordfamilies/${id}/morphemes`);
  },

  /**
   * Search wordfamilies
   * @param {string} query - Search query
   * @returns {Promise<Array>}
   */
  async search(query) {
    const params = new URLSearchParams({ search: query });
    return fetchFromAPI(`/api/wordfamilies/search?${params}`);
  },
};

/**
 * Lookup Tables API
 */
export const lookupTablesAPI = {
  /**
   * Get all parts of speech
   * @returns {Promise<Array>}
   */
  async getPartsOfSpeech() {
    return fetchFromAPI('/api/parts-of-speech');
  },

  /**
   * Get a specific part of speech by ID
   * @param {string} id - Part of speech ID
   * @returns {Promise<Object>}
   */
  async getPartOfSpeechById(id) {
    return fetchFromAPI(`/api/parts-of-speech/${id}`);
  },

  /**
   * Get part of speech by code/abbreviation
   * @param {string} code - Part of speech code (e.g., 'n', 'v', 'adj')
   * @returns {Promise<Object>}
   */
  async getPartOfSpeechByCode(code) {
    const params = new URLSearchParams({ code });
    return fetchFromAPI(`/api/parts-of-speech/code?${params}`);
  },
};

/**
 * Export all APIs as a single object for convenience
 */
export const tmkAPI = {
  morphemes: morphemesAPI,
  words: wordsAPI,
  wordlists: wordlistsAPI,
  wordfamilies: wordfamiliesAPI,
  lookupTables: lookupTablesAPI,
};
