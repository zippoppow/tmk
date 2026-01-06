/**
 * TMK API Client
 * 
 * Utility for interacting with the tmk-api backend running at http://localhost:3000
 * Provides methods to fetch and manage:
 * - Morphemes
 * - Words
 * - Wordlists
 * - Wordfamilies
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_TMK_API_URL || 'http://localhost:3000';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchFromAPI(endpoint) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
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
 * Export all APIs as a single object for convenience
 */
export const tmkAPI = {
  morphemes: morphemesAPI,
  words: wordsAPI,
  wordlists: wordlistsAPI,
  wordfamilies: wordfamiliesAPI,
};
