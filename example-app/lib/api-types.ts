/**
 * TypeScript type definitions for TMK API models
 * Provides type hints for better IDE support and type safety
 */

/**
 * Morpheme model - A meaningful linguistic unit
 */
export interface Morpheme {
  id?: string;
  _id?: string;
  text: string;
  name?: string;
  meaning?: string;
  type?: string;
  [key: string]: any;
}

/**
 * Word model - A complete word composed of morphemes
 */
export interface Word {
  id?: string;
  _id?: string;
  text: string;
  name?: string;
  definition?: string;
  morphemes?: string[] | Morpheme[];
  partOfSpeech?: string;
  [key: string]: any;
}

/**
 * Wordlist model - A collection of words grouped by theme or lesson
 */
export interface Wordlist {
  id?: string;
  _id?: string;
  name: string;
  text?: string;
  description?: string;
  words?: string[] | Word[];
  category?: string;
  [key: string]: any;
}

/**
 * Wordfamily model - Words that share a common root morpheme
 */
export interface Wordfamily {
  id?: string;
  _id?: string;
  name: string;
  text?: string;
  description?: string;
  rootMorpheme?: string | Morpheme;
  words?: string[] | Word[];
  morphemes?: string[] | Morpheme[];
  [key: string]: any;
}

/**
 * Generic API response wrapper
 */
export interface APIResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  [key: string]: any;
}

/**
 * Generic paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/**
 * Query options for list endpoints
 */
export interface QueryOptions {
  limit?: number;
  skip?: number;
  offset?: number;
  page?: number;
  sort?: string;
  [key: string]: any;
}

/**
 * Type for API error responses
 */
export class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}
