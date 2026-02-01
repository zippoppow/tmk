# WordConstructor Generator

## Overview

The WordConstructor Generator is a NextJS page that helps create morpheme-based word breakdowns (wordConstructors) for any list of words. For example, the word "intercontinental" becomes `inter- + con- + tine + -ent + -al`.

This tool uses the **TMK API morpheme database** to intelligently match morphemes within words and generate accurate wordConstructor representations.

## Features

- **CSV Upload**: Upload a CSV file containing a list of words
- **AI-Powered Analysis**: Uses the TMK API morpheme database to identify morphemes
- **Batch Processing**: Generate wordConstructors for entire word lists at once
- **Export Results**: Download results as a CSV file
- **Visual Details**: View morpheme breakdowns with an interactive details dialog

## Getting Started

### Prerequisites

1. **TMK API must be running** at `http://localhost:3000`
   ```bash
   # In a separate terminal, from the tmk-api repo
   npm run dev
   # or
   yarn dev
   ```

2. **Example app running**
   ```bash
   cd example-app
   yarn dev
   ```

### Accessing the Page

Navigate to:
```
http://localhost:3001/utilities/data-mgmt/generators/word-constructor
```

(Port may vary based on your NextJS setup)

## How to Use

### Step 1: Prepare Your Word List

Create a CSV file with words in the first column:

```csv
word
intercontinental
metropolitan
revolutionary
astronaut
microscope
biography
```

Or download the sample file: [sample-words-for-constructor.csv](../data/sample-words-for-constructor.csv)

### Step 2: Upload the CSV

1. Click "Select CSV File" button
2. Choose your CSV file
3. The preview shows how many words were detected

### Step 3: Generate WordConstructors

1. Click "Generate WordConstructors"
2. The system will analyze each word using the TMK API morpheme database
3. Results will display in a table showing:
   - **Word**: Original word
   - **WordConstructor**: Morpheme-based breakdown (e.g., `inter- + con- + tine + -ent + -al`)
   - **Morphemes**: Number of morphemes found
   - **View Details**: Button to see detailed morpheme information

### Step 4: Review and Export

- Click "View Details" on any row to see:
  - The complete morpheme breakdown
  - Individual morphemes as chips
  - Analysis notes
- Click "Export CSV" to download results as a CSV file

## CSV Input Format

**Minimum format** (header + words):
```csv
word
intercontinental
metropolitan
```

**Extended format** (if you have additional columns):
```csv
word,definition,frequency
intercontinental,spanning multiple continents,high
metropolitan,relating to a metropolis,medium
```

Only the first column (word) is used for generation.

## Output Format

The generated CSV includes:
```csv
Word,WordConstructor,Morphemes
intercontinental,inter- + con- + tine + -ent + -al,inter- + con- + tine + -ent + -al
metropolitan,metro- + politan,metro- + politan
```

## API Endpoint

The page uses this internal API endpoint:

**POST** `/api/utilities/word-constructor/generate`

### Request Body
```json
{
  "words": ["intercontinental", "metropolitan", "revolutionary"]
}
```

### Response
```json
{
  "success": true,
  "results": [
    {
      "word": "intercontinental",
      "wordConstructor": "inter- + con- + tine + -ent + -al",
      "morphemes": ["inter-", "con-", "tine", "-ent", "-al"],
      "notes": "Analysis based on TMK morpheme database"
    }
  ],
  "totalWords": 3,
  "morphemesDatabaseSize": 1250
}
```

## How It Works

### Algorithm

1. **Morpheme Database Load**: Fetches all morphemes from TMK API
2. **Greedy Matching**: For each word, attempts to match the longest available morphemes first
3. **Position Tracking**: Moves through the word character-by-character, matching available morphemes
4. **WordConstructor Generation**: Builds the final representation with proper prefix/suffix notation:
   - Prefixes are marked with trailing hyphen: `inter-`
   - Suffixes are marked with leading hyphen: `-al`
   - Root/stem words have no hyphens: `continental`

### Limitations

- **Greedy Algorithm**: Uses longest-first matching, which works well for most English words but may not always produce linguistically perfect decompositions
- **Database Dependent**: Accuracy depends on completeness of the TMK API morpheme database
- **Unmatched Segments**: Single characters that don't match any morpheme are kept as-is

## Troubleshooting

### "Failed to fetch" or API errors
- **Cause**: TMK API not running
- **Solution**: Start tmk-api in a separate terminal with `npm run dev`
- **Check**: Verify `NEXT_PUBLIC_TMK_API_URL=http://localhost:3000` in `example-app/.env.local`

### No morphemes found for a word
- **Cause**: Word segments don't match morphemes in database
- **Solution**: This word may not have morphemes in the current TMK database
- **Next step**: Consider adding missing morphemes to the TMK API database

### CSV parsing errors
- **Cause**: Unexpected CSV format or encoding
- **Solution**: Ensure file is plain UTF-8 text with Unix line endings (LF)
- **Check**: First column should contain words, subsequent columns are ignored

## Sample Data

A sample word list is included at: [sample-words-for-constructor.csv](../data/sample-words-for-constructor.csv)

Try it with these words:
- intercontinental
- metropolitan
- revolutionary
- astronaut
- microscope
- biography
- telephone
- document
- celebrate
- spectacular

## Future Enhancements

Potential improvements:
- [ ] Support for multiple decomposition options (e.g., "pre-order" vs "preorder")
- [ ] Morpheme confidence scoring
- [ ] Language support beyond English
- [ ] Manual morpheme correction UI
- [ ] Integration with lesson activities (e.g., using wordConstructors in templates)

## Related Files

- **Page Component**: [page.js](./page.js)
- **API Route**: [/api/utilities/word-constructor/generate/route.js](/api/utilities/word-constructor/generate/route.js)
- **Sample Data**: [data/sample-words-for-constructor.csv](../data/sample-words-for-constructor.csv)
- **API Client**: [lib/api-client.js](/lib/api-client.js)

## Notes for Developers

### Using the API Route Directly

You can call this API from other components or scripts:

```javascript
const response = await fetch(
  '/api/utilities/word-constructor/generate',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      words: ['intercontinental', 'metropolitan']
    })
  }
);

const data = await response.json();
console.log(data.results);
```

### Customizing the Algorithm

The morpheme matching algorithm is in `/api/utilities/word-constructor/generate/route.js`:
- Modify `findMorphemeMatches()` for different matching strategies
- Adjust morpheme sorting in `processWord()` for priority handling
- Update prefix/suffix detection logic in `generateWordConstructor()`
