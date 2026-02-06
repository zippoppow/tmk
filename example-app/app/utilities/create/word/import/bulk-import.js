const API_BASE_URL = process.env.NEXT_PUBLIC_TMK_API_URL || 'http://localhost:3000';

/**
 * Bulk import utility for words from CSV (client-side)
 * Parses CSV, maps text values to IDs, and creates words via the TMK API
 */
export const bulkImport = {
  /**
   * Parse CSV text and map text values to database IDs using lookup tables
   * @param {string} csvText - Raw CSV text
   * @param {Object} lookupTables - { partsOfSpeech, vocabularyTiers, instructionalLevels } arrays
   * @returns {Promise<Object>} { words, errors }
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
      const requiredHeaders = ['name'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
      }

      // Parse data rows
      const words = [];
      const errors = [];

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
          const mappedWord = this.mapRowToWord(row, lookupTables);
          words.push(mappedWord);
        } catch (err) {
          errors.push(`Row ${i}: ${err.message}`);
        }
      }

      if (words.length === 0) {
        throw new Error('No valid words parsed from CSV');
      }

      console.log(`✓ Parsed ${words.length} words from CSV (${errors.length} errors)`);
      return { words, errors };
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
   * Map CSV row to word object with IDs
   * @param {Object} row - { name, wordconstructor, totalsyllables, partofspeech, vocabularytier, instructionallevel, dictionaryref, prefixes, suffixes }
   * @param {Object} lookupTables - Lookup tables
   * @returns {Object} Word object ready for API
   */
  mapRowToWord(row, lookupTables) {
    const word = {
      name: row.name,
      wordConstructor: row.wordconstructor || '',
      totalSyllables: row.totalsyllables ? parseInt(row.totalsyllables, 10) : null,
      dictionaryRef: row.dictionaryref || '',
    };

    // Validate required fields
    if (!word.name) {
      throw new Error('Missing required field: name');
    }

    // Map partOfSpeech text to ID
    if (row.partofspeech) {
      const posMatch = lookupTables.partsOfSpeech.find(
        p => p.name.toLowerCase() === row.partofspeech.toLowerCase()
      );
      if (!posMatch) {
        throw new Error(`Part of speech "${row.partofspeech}" not found in database`);
      }
      word.partOfSpeechId = posMatch.id;
    }

    // Map vocabularyTier text to ID
    if (row.vocabularytier) {
      const tierMatch = lookupTables.vocabularyTiers.find(
        t => t.name.toLowerCase() === row.vocabularytier.toLowerCase()
      );
      if (!tierMatch) {
        throw new Error(`Vocabulary tier "${row.vocabularytier}" not found in database`);
      }
      word.vocabularyTierId = tierMatch.id;
    }

    // Map instructionalLevel text to ID
    if (row.instructionallevel) {
      const levelMatch = lookupTables.instructionalLevels.find(
        l => l.name.toLowerCase() === row.instructionallevel.toLowerCase()
      );
      if (!levelMatch) {
        throw new Error(`Instructional level "${row.instructionallevel}" not found in database`);
      }
      word.instructionalLevelId = levelMatch.id;
    }

    return word;
  },

  /**
   * Create a single word via the API
   * @param {Object} wordData - Word object to create
   * @returns {Promise<Object>} Created word response from API
   */
  async createSingleWord(wordData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/words`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wordData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`✗ Failed to create word "${wordData.name}":`, error.message);
      throw error;
    }
  },

  /**
   * Create multiple words via the API
   * @param {Array} words - Array of word objects to create
   * @param {Object} options - Options for import (e.g., stopOnError)
   * @returns {Promise<Object>} Import results with success/failure counts
   */
  async createWords(words, options = {}) {
    const { stopOnError = false, verbose = true } = options;

    console.log(`\n📚 Starting bulk word import (${words.length} words)...`);

    const results = {
      total: words.length,
      created: 0,
      failed: 0,
      errors: [],
      createdWords: [],
    };

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      try {
        if (verbose) {
          console.log(`[${i + 1}/${words.length}] Creating: ${word.name}...`);
        }

        const result = await this.createSingleWord(word);
        results.created++;
        results.createdWords.push(result);

        if (verbose) {
          console.log(`  ✓ Created successfully`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          word: word.name,
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
