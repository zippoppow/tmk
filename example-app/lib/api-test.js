/**
 * API Client Test Utility
 * 
 * This file contains helper functions for testing the tmk-api integration.
 * Use in browser console or in test files.
 * 
 * Example usage in browser console:
 * 
 *   import { testAPI } from '@/lib/api-test';
 *   await testAPI.testAllEndpoints();
 */

import { tmkAPI } from './api-client';

/**
 * Test utilities for API integration
 */
export const testAPI = {
  /**
   * Test morphemes endpoint
   */
  async testMorphemes() {
    console.log('Testing Morphemes API...');
    try {
      const data = await tmkAPI.morphemes.getAll({ limit: 5 });
      console.log('✓ Morphemes API working', data);
      return { success: true, data };
    } catch (error) {
      console.error('✗ Morphemes API failed', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Test words endpoint
   */
  async testWords() {
    console.log('Testing Words API...');
    try {
      const data = await tmkAPI.words.getAll({ limit: 5 });
      console.log('✓ Words API working', data);
      return { success: true, data };
    } catch (error) {
      console.error('✗ Words API failed', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Test wordlists endpoint
   */
  async testWordlists() {
    console.log('Testing Wordlists API...');
    try {
      const data = await tmkAPI.wordlists.getAll({ limit: 5 });
      console.log('✓ Wordlists API working', data);
      return { success: true, data };
    } catch (error) {
      console.error('✗ Wordlists API failed', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Test wordfamilies endpoint
   */
  async testWordfamilies() {
    console.log('Testing Wordfamilies API...');
    try {
      const data = await tmkAPI.wordfamilies.getAll({ limit: 5 });
      console.log('✓ Wordfamilies API working', data);
      return { success: true, data };
    } catch (error) {
      console.error('✗ Wordfamilies API failed', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Test word search
   */
  async testWordSearch(query = 'test') {
    console.log(`Testing Words Search API with query: "${query}"...`);
    try {
      const data = await tmkAPI.words.search(query);
      console.log(`✓ Words Search API working`, data);
      return { success: true, data };
    } catch (error) {
      console.error('✗ Words Search API failed', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Test morpheme search
   */
  async testMorphemeSearch(query = 'test') {
    console.log(`Testing Morpheme Search API with query: "${query}"...`);
    try {
      const data = await tmkAPI.morphemes.search(query);
      console.log(`✓ Morpheme Search API working`, data);
      return { success: true, data };
    } catch (error) {
      console.error('✗ Morpheme Search API failed', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Test parts of speech lookup table
   */
  async testPartsOfSpeech() {
    console.log('Testing Parts of Speech API...');
    try {
      const data = await tmkAPI.lookupTables.getPartsOfSpeech();
      console.log('✓ Parts of Speech API working', data);
      return { success: true, data };
    } catch (error) {
      console.error('✗ Parts of Speech API failed', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Test creating a morpheme
   */
  async testCreateMorpheme() {
    console.log('Testing Morpheme Creation...');
    try {
      // Example morpheme data. In a real scenario, you might want to randomize this
      // or clean it up after the test.
      const morphemeData = {
        name: `test-morpheme-${Date.now()}`,
        type: 'root',
        meaning: 'A test morpheme',
        etymology: 'From a test case',
      };
      const data = await tmkAPI.morphemes.create(morphemeData);
      console.log('✓ Morpheme creation working', data);
      return { success: true, data };
    } catch (error) {
      console.error('✗ Morpheme creation failed', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Run all tests and provide a summary
   */
  async testAllEndpoints() {
    console.log('='.repeat(50));
    console.log('Running TMK API Integration Tests');
    console.log('='.repeat(50));

    const results = {
      morphemes: await this.testMorphemes(),
      words: await this.testWords(),
      wordlists: await this.testWordlists(),
      wordfamilies: await this.testWordfamilies(),
      wordSearch: await this.testWordSearch(),
      morphemeSearch: await this.testMorphemeSearch(),
      partsOfSpeech: await this.testPartsOfSpeech(),
      createMorpheme: await this.testCreateMorpheme(),
    };

    console.log('\n' + '='.repeat(50));
    console.log('Test Results Summary:');
    console.log('='.repeat(50));

    const passed = Object.values(results).filter((r) => r.success).length;
    const total = Object.values(results).length;

    Object.entries(results).forEach(([name, result]) => {
      const status = result.success ? '✓ PASS' : '✗ FAIL';
      console.log(`${status} - ${name}`);
      if (!result.success) {
        console.log(`  Error: ${result.error}`);
      }
    });

    console.log('\n' + `Total: ${passed}/${total} tests passed`);
    console.log('='.repeat(50));

    return results;
  },

  /**
   * Pretty print API responses
   */
  print(data) {
    console.log(JSON.stringify(data, null, 2));
  },

  /**
   * Test API with custom endpoint
   * (for debugging if endpoints differ from defaults)
   */
  async testCustom(endpoint) {
    console.log(`Testing custom endpoint: ${endpoint}`);
    try {
      const response = await fetch(`http://localhost:3000${endpoint}`);
      const data = await response.json();
      console.log('Response:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error:', error);
      return { success: false, error: error.message };
    }
  },
};

// Export for use in Node.js test files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testAPI };
}
