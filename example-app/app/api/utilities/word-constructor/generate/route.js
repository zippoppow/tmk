/**
 * WordConstructor Generation API Route
 * 
 * POST /api/utilities/word-constructor/generate
 * 
 * This route accepts a list of words and uses AI + TMK API morpheme database
 * to generate wordConstructors (morpheme breakdowns) for each word.
 * 
 * Example request:
 * {
 *   "words": ["intercontinental", "metropolitan", "revolutionary"]
 * }
 * 
 * Example response:
 * {
 *   "results": [
 *     {
 *       "word": "intercontinental",
 *       "wordConstructor": "inter- + con- + tine + -ent + -al",
 *       "morphemes": ["inter-", "con-", "tine", "-ent", "-al"],
 *       "notes": "Analysis based on TMK morpheme database"
 *     }
 *   ]
 * }
 */

const TMK_API_URL = process.env.NEXT_PUBLIC_TMK_API_URL || 'http://localhost:3000';

/**
 * Fetch all available morphemes from TMK API
 */
async function fetchAllMorphemes() {
  try {
    const response = await fetch(`${TMK_API_URL}/api/morphemes?limit=10000`);
    if (!response.ok) {
      throw new Error(`Failed to fetch morphemes: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching morphemes:', error);
    return [];
  }
}

/**
 * Find morpheme matches in a word
 * Uses a greedy algorithm to identify the best morpheme decomposition
 * 
 * Algorithm:
 * 1. Build a list of all matchable morpheme forms (name + all variants)
 * 2. Strip hyphens from morpheme text for matching
 * 3. Sort by length (longest first)
 * 4. Starting from position 0, try to match the longest morpheme at the current position
 * 5. If a match is found, add it to results and move position forward
 * 6. If no match, keep a single unmatched character and move forward by 1
 * 7. Repeat until end of word
 */
function findMorphemeMatches(word, morphemesDb) {
  const word_lower = word.toLowerCase();
  const matches = [];

  // Build a list of all matchable morpheme forms (main name + variants)
  const matchableMorphemes = [];
  
  (morphemesDb || []).forEach((m) => {
    // Determine the type from wordRole
    let type = 'base';
    if (m.wordRole && m.wordRole.name) {
      const roleName = m.wordRole.name.toLowerCase();
      if (roleName === 'prefix') type = 'prefix';
      else if (roleName === 'suffix') type = 'suffix';
      else if (roleName === 'base element') type = 'base';
    }

    // Process main name
    const mainName = (m.name || '').toLowerCase().trim();
    if (mainName) {
      // Strip hyphens for matching purposes
      const matchText = mainName.replace(/^-+|-+$/g, '');
      if (matchText) {
        matchableMorphemes.push({
          matchText,
          displayText: mainName,
          originalMorpheme: m,
          type,
        });
      }
    }

    // Process variants
    if (Array.isArray(m.variants) && m.variants.length > 0) {
      m.variants.forEach((variant) => {
        const variantText = (variant || '').toLowerCase().trim();
        if (variantText) {
          // Strip hyphens for matching purposes
          const matchText = variantText.replace(/^-+|-+$/g, '');
          if (matchText) {
            matchableMorphemes.push({
              matchText,
              displayText: variantText,
              originalMorpheme: m,
              type,
            });
          }
        }
      });
    }
  });

  // Sort morphemes by length (longest first) for greedy matching
  const sortedMorphemes = matchableMorphemes.sort(
    (a, b) => b.matchText.length - a.matchText.length
  );

  let position = 0;

  while (position < word.length) {
    const remaining = word_lower.substring(position);
    let found = false;

    // Try to match the longest morpheme first (greedy approach)
    for (const morphemeForm of sortedMorphemes) {
      if (remaining.startsWith(morphemeForm.matchText)) {
        const matchLength = morphemeForm.matchText.length;
        matches.push({
          text: word.substring(position, position + matchLength),
          morpheme: {
            ...morphemeForm.originalMorpheme,
            type: morphemeForm.type,
          },
        });
        position += matchLength;
        found = true;
        break;
      }
    }

    // If no morpheme matched, keep the single character as unmatched
    if (!found) {
      matches.push({
        text: word.substring(position, position + 1),
        morpheme: null,
      });
      position += 1;
    }
  }

  return matches;
}

/**
 * Generate wordConstructor from matched morphemes
 */
function generateWordConstructor(matches) {
  return matches
    .map((m) => {
      const text = m.text;
      const type = m.morpheme?.type;

      if (type === 'prefix' && !text.endsWith('-')) {
        return text + '-';
      } else if (type === 'suffix' && !text.startsWith('-')) {
        return '-' + text;
      }
      return text;
    })
    .join(' + ');
}

/**
 * Process a single word to generate its wordConstructor
 */
async function processWord(word, morphemesDb) {
  try {
    const matches = findMorphemeMatches(word, morphemesDb);
    const wordConstructor = generateWordConstructor(matches);
    const morphemes = matches.map((m) => m.text);

    return {
      word,
      wordConstructor,
      morphemes,
      notes: `Analyzed using ${morphemesDb.length} morphemes from TMK database`,
    };
  } catch (error) {
    console.error(`Error processing word "${word}":`, error);
    return {
      word,
      wordConstructor: null,
      morphemes: [],
      notes: `Error: ${error.message}`,
    };
  }
}

/**
 * POST handler for generating wordConstructors
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { words } = body;

    // Validate input
    if (!Array.isArray(words) || words.length === 0) {
      return Response.json(
        { error: 'Please provide an array of words' },
        { status: 400 }
      );
    }

    if (words.length > 1000) {
      return Response.json(
        { error: 'Maximum 1000 words per request' },
        { status: 400 }
      );
    }

    // Fetch morpheme database
    const morphemesDb = await fetchAllMorphemes();
    if (morphemesDb.length === 0) {
      return Response.json(
        {
          error: 'Could not load morpheme database. Ensure tmk-api is running at ' +
            TMK_API_URL,
        },
        { status: 503 }
      );
    }

    // Process each word
    const results = await Promise.all(
      words.map((word) => processWord(word, morphemesDb))
    );

    return Response.json({
      success: true,
      results,
      totalWords: words.length,
      morphemesDatabaseSize: morphemesDb.length,
    });
  } catch (error) {
    console.error('WordConstructor generation error:', error);
    return Response.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
