# TMK API Integration - Complete Setup

## 🎯 What Has Been Created

Your example app now has complete integration with the tmk-api. Here's what was set up:

### Core Files

| File | Purpose |
|------|---------|
| `lib/api-client.js` | Main API client with methods for all 4 models |
| `lib/api-types.ts` | TypeScript type definitions (optional) |
| `lib/api-test.js` | Testing utilities for verifying the integration |
| `.env.local` | Environment configuration pointing to tmk-api |

### Demo & Pages

| File | Purpose |
|------|---------|
| `app/tmk-api-demo/page.js` | Interactive demo page with tabbed interface |

### Documentation

| File | Purpose |
|------|---------|
| `TMK_API_INTEGRATION.md` | Comprehensive setup and usage guide |
| `TMK_API_QUICK_REFERENCE.md` | Quick reference with code snippets |
| `API_INTEGRATION_SETUP.md` | Setup overview and architecture notes |
| `TESTING_API_INTEGRATION.md` | Testing guide and debugging tips |
| `README.md` (this file) | Overview and getting started |

---

## 🚀 Getting Started (5 minutes)

### Step 1: Start the tmk-api
```bash
cd /path/to/tmk-api
npm run dev
# API running at http://localhost:3000
```

### Step 2: Start the example app
```bash
cd /Users/elcorando/dev/tmk/example-app
yarn dev
# Next.js app running (usually http://localhost:3000 or :3001)
```

### Step 3: Test the integration
Visit: **`http://localhost:3000/tmk-api-demo`** (or adjust port)

Click the "Load" buttons to fetch data from each API model.

---

## 📚 API Client Usage

### Import Options

```javascript
// Option 1: Use consolidated object (recommended)
import { tmkAPI } from '@/lib/api-client';

// Option 2: Import specific APIs
import { wordsAPI, morphemesAPI, wordlistsAPI, wordfamiliesAPI } from '@/lib/api-client';
```

### Basic Examples

```javascript
// Get all records
const words = await tmkAPI.words.getAll({ limit: 10 });
const morphemes = await tmkAPI.morphemes.getAll();

// Get by ID
const word = await tmkAPI.words.getById('some-id');

// Search
const results = await tmkAPI.words.search('teach');

// Get relationships
const wordsInFamily = await tmkAPI.wordfamilies.getWords('family-id');
const morphemesInFamily = await tmkAPI.wordfamilies.getMorphemes('family-id');
```

### In React Components

```javascript
'use client';
import { useEffect, useState } from 'react';
import { tmkAPI } from '@/lib/api-client';

export default function MyComponent() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    tmkAPI.words.search('teach').then(setData);
  }, []);
  
  return <div>{JSON.stringify(data, null, 2)}</div>;
}
```

---

## 🔍 Testing the Integration

### Quick Test in Browser Console

1. Open the demo page: `http://localhost:3000/tmk-api-demo`
2. Press F12 to open DevTools → Console tab
3. Run:
   ```javascript
   import { testAPI } from '@/lib/api-test';
   await testAPI.testAllEndpoints();
   ```

### Expected Output

```
✓ PASS - morphemes
✓ PASS - words
✓ PASS - wordlists
✓ PASS - wordfamilies
✓ PASS - wordSearch
✓ PASS - morphemeSearch

Total: 6/6 tests passed
```

If tests fail, see [TESTING_API_INTEGRATION.md](TESTING_API_INTEGRATION.md) for debugging steps.

---

## 📋 Available Methods

### Morphemes
- `getAll(options)` - Get all morphemes
- `getById(id)` - Get one morpheme
- `search(query)` - Search morphemes

### Words
- `getAll(options)` - Get all words
- `getById(id)` - Get one word
- `search(query)` - Search words
- `getByMorpheme(morphemeId)` - Get words by morpheme

### Wordlists
- `getAll(options)` - Get all wordlists
- `getById(id)` - Get one wordlist
- `getWords(id)` - Get words in wordlist
- `search(query)` - Search wordlists

### Wordfamilies
- `getAll(options)` - Get all wordfamilies
- `getById(id)` - Get one wordfamily
- `getWords(id)` - Get words in family
- `getMorphemes(id)` - Get morphemes in family
- `search(query)` - Search wordfamilies

---

## ⚙️ Configuration

### API URL
Edit `.env.local`:
```
NEXT_PUBLIC_TMK_API_URL=http://localhost:3000
```

### Endpoint Paths
If tmk-api uses different routes, edit `lib/api-client.js`:
- Find the `fetchFromAPI()` calls
- Update endpoint strings to match your API
- Example: Change `/api/words` to `/words`

---

## 📁 File Structure

```
example-app/
├── lib/
│   ├── api-client.js              ← API client (main file)
│   ├── api-types.ts               ← Type definitions
│   └── api-test.js                ← Test utilities
├── app/
│   └── tmk-api-demo/
│       └── page.js                ← Demo page
├── .env.local                     ← Config (API URL)
├── TMK_API_INTEGRATION.md         ← Full guide
├── TMK_API_QUICK_REFERENCE.md     ← Quick reference
├── API_INTEGRATION_SETUP.md       ← Setup notes
├── TESTING_API_INTEGRATION.md     ← Testing guide
└── README.md                      ← This file
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| `Failed to fetch` / `Connection refused` | Ensure tmk-api is running: `npm run dev` |
| `CORS error` | Check tmk-api has CORS enabled for localhost |
| `404 endpoints` | Update endpoint paths in `lib/api-client.js` |
| Empty results | Check if API has data; see debugging guide |
| Type errors | Make sure `lib/api-types.ts` matches your data structure |

For detailed debugging: See [TESTING_API_INTEGRATION.md](TESTING_API_INTEGRATION.md)

---

## 📖 Documentation Files

- **TMK_API_INTEGRATION.md** - Complete setup guide with detailed examples
- **TMK_API_QUICK_REFERENCE.md** - Common patterns and quick lookups
- **API_INTEGRATION_SETUP.md** - Architecture overview and customization
- **TESTING_API_INTEGRATION.md** - Testing procedures and debugging
- **This file** - Quick overview and getting started

---

## ✅ Checklist

- [ ] tmk-api is running on localhost:3000
- [ ] Example app is running
- [ ] `.env.local` exists with correct API URL
- [ ] Demo page loads at `/tmk-api-demo`
- [ ] Tests pass in browser console
- [ ] Can import `tmkAPI` in components
- [ ] Can fetch data successfully

---

## 🎓 Next Steps

1. **Review the demo page** at `http://localhost:3000/tmk-api-demo`
2. **Test the API** using the test utility in browser console
3. **Read the guides** to understand the API structure
4. **Integrate into your pages** - Use the examples to add API calls to lesson pages
5. **Customize** as needed based on actual tmk-api structure

---

## 📞 Support

For issues:
1. Check the documentation files above
2. Run `testAPI.testAllEndpoints()` to verify connectivity
3. Inspect network requests in DevTools
4. Review [TESTING_API_INTEGRATION.md](TESTING_API_INTEGRATION.md)

Happy coding! 🚀
