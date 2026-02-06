import { morphemesAPI } from '/lib/api-client.js';

const API_BASE_URL = process.env.NEXT_PUBLIC_TMK_API_URL || 'http://localhost:3000';

/**
 * Bulk import utility for morphemes from CSV (client-side)
 * Parses CSV, maps text values to IDs, and creates morphemes via the TMK API
 */
export const bulkImport = {
  /**
   * Parse CSV text and map text values to database IDs using lookup tables
   * @param {string} csvText - Raw CSV text
   * @param {Object} lookupTables - { roles, origins, conventions } arrays
   * @returns {Promise<Object>} { morphemes, rows, errors }
   */
  async parseCSVAndMapIds(csvText, lookupTables) {
    try {
      if (!lookupTables) {
        throw new Error('Lookup tables not loaded');
      }

      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('CSV must contain at least a header row and one data row');
      }

      // Parse header
      const headers = this.parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
      
      // Validate required headers
      const requiredHeaders = ['name', 'senseofmeaning'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
      }

      // Parse data rows
      const morphemes = [];
      const errors = [];
      const rows = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines

        try {
          const values = this.parseCSVLine(line);
          
          // Create row object with header mapping
          const row = {};
          headers.forEach((header, idx) => {
            row[header] = values[idx]?.trim() || '';
          });

          // Map text values to IDs
          const mappedMorpheme = this.mapRowToMorpheme(row, lookupTables);
          morphemes.push(mappedMorpheme);
          rows.push(row);
        } catch (err) {
          errors.push(`Row ${i}: ${err.message}`);
        }
      }

      if (morphemes.length === 0) {
        throw new Error('No valid morphemes parsed from CSV');
      }

      console.log(`✓ Parsed ${morphemes.length} morphemes from CSV (${errors.length} errors)`);
      return { morphemes, rows, errors };
    } catch (error) {
      console.error('CSV parsing failed:', error.message);
      throw error;
    }
  },

  /**
   * Parse a single CSV line, respecting quoted fields
   * @param {string} line - CSV line
   * @returns {Array<string>} Parsed values
   */
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  },

  /**
   * Map CSV row to morpheme object with IDs
   * @param {Object} row - { name, senseofmeaning, variants, pronunciations, wordrole, wordorigin, wordformationconvention }
   * @param {Object} lookupTables - Lookup tables
   * @returns {Object} Morpheme object ready for API
   */
  mapRowToMorpheme(row, lookupTables) {
    const morpheme = {
      name: row.name,
      senseOfMeaning: row.senseofmeaning,
      variants: this.parseArray(row.variants),
      pronunciations: this.parseArray(row.pronunciations),
    };

    // Validate required fields
    if (!morpheme.name) {
      throw new Error('Missing required field: name');
    }
    if (!morpheme.senseOfMeaning) {
      throw new Error('Missing required field: senseOfMeaning');
    }

    // Map wordRole text to ID
    if (row.wordrole) {
      const roleMatch = lookupTables.roles.find(
        r => r.name.toLowerCase() === row.wordrole.toLowerCase()
      );
      if (!roleMatch) {
        throw new Error(`Word role "${row.wordrole}" not found in database`);
      }
      morpheme.morphemeWordRoleId = roleMatch.id;
    }

    // Map wordOrigin text to ID
    if (row.wordorigin) {
      const originMatch = lookupTables.origins.find(
        o => o.name.toLowerCase() === row.wordorigin.toLowerCase()
      );
      if (!originMatch) {
        throw new Error(`Word origin "${row.wordorigin}" not found in database`);
      }
      morpheme.morphemeWordOriginId = originMatch.id;
    }

    // Map wordFormationConvention text to ID
    if (row.wordformationconvention) {
      const conventionMatch = lookupTables.conventions.find(
        c => c.name.toLowerCase() === row.wordformationconvention.toLowerCase()
      );
      if (!conventionMatch) {
        throw new Error(`Word formation convention "${row.wordformationconvention}" not found in database`);
      }
      morpheme.wordFormationConventionId = conventionMatch.id;
    }

    return morpheme;
  },

  /**
   * Parse comma or pipe-separated array from string
   * @param {string} str - Comma or pipe-separated values
   * @returns {Array<string>} Parsed array
   */
  parseArray(str) {
    if (!str || str.trim() === '') return [];
    
    // Determine delimiter (comma or pipe)
    const delimiter = str.includes('|') ? '|' : ',';
    return str
      .split(delimiter)
      .map(item => item.trim())
      .filter(item => item.length > 0);
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
};