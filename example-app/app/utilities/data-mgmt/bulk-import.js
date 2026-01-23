import { morphemesAPI } from '../../../lib/api-client.js';

const API_BASE_URL = process.env.NEXT_PUBLIC_TMK_API_URL || 'http://localhost:3000';

/**
 * Bulk import utility for morphemes (client-side)
 * Loads morpheme data from API and creates them via the TMK API
 */
export const bulkImport = {
  /**
   * Load morphemes from the server-side API endpoint
   * @returns {Promise<Array>} Array of morpheme objects
   */
  async loadMorphemesFromFile() {
    try {
      const response = await fetch('/api/morphemes/import');

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to load morphemes (status: ${response.status})`);
      }

      const data = await response.json();

      if (!data.morphemes || !Array.isArray(data.morphemes)) {
        throw new Error('API response must contain a "morphemes" array');
      }

      console.log(`✓ Loaded ${data.morphemes.length} morphemes from server`);
      return data.morphemes;
    } catch (error) {
      console.error('Failed to load morphemes from file:', error.message);
      throw error;
    }
  },

  /**
   * Create a single morpheme via the API
   * @param {Object} morphemeData - Morpheme object to create
   * @returns {Promise<Object>} Created morpheme response from API
   */
  async createSingleMorpheme(morphemeData) {
    try {
      const result = await morphemesAPI.create(morphemeData);
      return result;
    } catch (error) {
      console.error(`✗ Failed to create morpheme "${morphemeData.name}":`, error.message);
      throw error;
    }
  },

  /**
   * Create multiple morphemes via the API
   * @param {Array} morphemes - Array of morpheme objects to create
   * @param {Object} options - Options for import (e.g., stopOnError)
   * @returns {Promise<Object>} Import results with success/failure counts
   */
  async createMorphemes(morphemes, options = {}) {
    const { stopOnError = false, verbose = true } = options;

    console.log(`\n📚 Starting bulk morpheme import (${morphemes.length} morphemes)...`);

    const results = {
      total: morphemes.length,
      created: 0,
      failed: 0,
      errors: [],
      createdMorphemes: [],
    };

    for (let i = 0; i < morphemes.length; i++) {
      const morpheme = morphemes[i];
      try {
        if (verbose) {
          console.log(`[${i + 1}/${morphemes.length}] Creating: ${morpheme.name}...`);
        }

        const result = await this.createSingleMorpheme(morpheme);
        results.created++;
        results.createdMorphemes.push(result);

        if (verbose) {
          console.log(`  ✓ Created successfully`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          morpheme: morpheme.name,
          error: error.message,
          index: i,
        });

        console.error(`  ✗ Failed: ${error.message}`);

        if (stopOnError) {
          console.error('\n⚠️  Stopping import due to error (stopOnError=true)');
          break;
        }
      }
    }

    console.log(
      `\n✅ Import complete: ${results.created} created, ${results.failed} failed`
    );
    return results;
  },

  /**
   * Main entry point: Load and import morphemes
   * @param {Object} options - Import options
   * @returns {Promise<Object>} Import results
   */
  async importMorphemes(options = {}) {
    try {
      const morphemes = await this.loadMorphemesFromFile();
      const results = await this.createMorphemes(morphemes, options);
      return results;
    } catch (error) {
      console.error('✗ Import failed:', error.message);
      return { success: false, error: error.message };
    }
  },
};