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
 */
function findMorphemeMatches(word, morphemesDb) {
  const word_lower = word.toLowerCase();
  const matches = [];

  // Build a map of morpheme text -> morpheme object for quick lookup
  const morphemeMap = {};
  (morphemesDb || []).forEach((m) => {
    const text = (m.text || m.morpheme || '').toLowerCase();
    if (text) {
      morphemeMap[text] = m;
    }
  });

  // Sort morphemes by length (longest first) to match longer morphemes first
  const sortedMorphemeTexts = Object.keys(morphemeMap).sort(
    (a, b) => b.length - a.length
  );

  let remaining = word_lower;
  let position = 0;

  while (remaining.length > 0 && position < word.length) {
    let found = false;

    // Try to match from the start of remaining word
    for (const morphemeText of sortedMorphemeTexts) {
      if (remaining.startsWith(morphemeText)) {
        matches.push({
          text: word.substring(position, position + morphemeText.length),
          morpheme: morphemeMap[morphemeText],
        });
        position += morphemeText.length;
        remaining = remaining.substring(morphemeText.length);
        found = true;
        break;
      }
    }

    // If no match found, move forward one character
    if (!found) {
      // Try to find the longest prefix that matches
      let matched = false;
      for (let i = remaining.length - 1; i > 0; i--) {
        const prefix = remaining.substring(0, i);
        if (morphemeMap[prefix]) {
          matches.push({
            text: word.substring(position, position + prefix.length),
            morpheme: morphemeMap[prefix],
          });
          position += prefix.length;
          remaining = remaining.substring(prefix.length);
          matched = true;
          break;
        }
      }

      // No morpheme found, keep as unmatched segment
      if (!matched) {
        matches.push({
          text: word.substring(position, position + 1),
          morpheme: null,
        });
        position += 1;
        remaining = remaining.substring(1);
      }
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
      const isPrefix = m.morpheme?.type === 'prefix';
      const isSuffix = m.morpheme?.type === 'suffix';

      if (isPrefix && !text.endsWith('-')) {
        return text + '-';
      } else if (isSuffix && !text.startsWith('-')) {
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
