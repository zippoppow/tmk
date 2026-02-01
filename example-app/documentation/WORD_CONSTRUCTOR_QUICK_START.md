# WordConstructor Generator - Quick Setup

## What Was Created

I've created a complete NextJS page and API for generating wordConstructors from word lists.

### Files Created/Modified

1. **Frontend Page**
   - `/example-app/app/utilities/data-mgmt/generators/word-constructor/page.js`
   - Full Material-UI interface with CSV upload, generation, and export features

2. **API Route**
   - `/example-app/app/api/utilities/word-constructor/generate/route.js`
   - Handles morpheme analysis using TMK API database

3. **Sample Data**
   - `/example-app/data/sample-words-for-constructor.csv`
   - 15 sample words to test with

4. **Documentation**
   - `/example-app/WORD_CONSTRUCTOR_GUIDE.md`
   - Complete guide with examples and troubleshooting

## Quick Start

### 1. Start TMK API (if not already running)
```bash
# In tmk-api directory
npm run dev
# or
yarn dev
```

### 2. Start Example App
```bash
cd example-app
yarn dev
```

### 3. Visit the Page
```
http://localhost:3001/utilities/data-mgmt/generators/word-constructor
```

## Features

✅ **CSV Upload** - Upload word lists with a simple file picker
✅ **AI Morpheme Detection** - Uses TMK API database to find morphemes
✅ **Batch Processing** - Process multiple words at once
✅ **Results Table** - View all results in an organized table
✅ **Export CSV** - Download results as CSV file
✅ **Details Dialog** - View morpheme breakdown for individual words

## How It Works

1. User uploads CSV with words (one per row)
2. Click "Generate WordConstructors"
3. API fetches morpheme database from TMK API
4. Uses greedy matching algorithm to decompose each word
5. Generates wordConstructor notation (e.g., `inter- + con- + tine + -ent + -al`)
6. Displays results in table with export option

## Example

**Input Word:** `intercontinental`

**Output:**
```
WordConstructor: inter- + con- + tine + -ent + -al
Morphemes: inter-, con-, tine, -ent, -al
```

## Key Components

### Frontend (page.js)
- CSV file input with validation
- Word list preview
- Generate button with loading state
- Results table with sort/filter capability
- Export to CSV functionality
- Details modal for viewing morpheme info
- Material-UI styling with Pegasus integration

### API Route (route.js)
- Fetches all morphemes from TMK API
- Implements greedy morpheme matching algorithm
- Handles up to 1000 words per request
- Returns detailed results with notes
- Error handling and validation

## Next Steps

1. Test with the sample CSV file: `data/sample-words-for-constructor.csv`
2. Try with your own word lists
3. Review `WORD_CONSTRUCTOR_GUIDE.md` for detailed documentation
4. Customize the algorithm in `route.js` if needed

## Troubleshooting

**API errors?** Make sure TMK API is running at `http://localhost:3000`

**CSV not parsing?** Ensure the file is plain text UTF-8 with words in the first column

**No results?** Check browser console for errors and verify morpheme database has content

See `WORD_CONSTRUCTOR_GUIDE.md` for more detailed troubleshooting.
