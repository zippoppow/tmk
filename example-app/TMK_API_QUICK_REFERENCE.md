# TMK API Integration - Quick Reference

## Setup (One-time)

1. **Ensure tmk-api is running:**
   ```bash
   # In a separate terminal, from tmk-api repo
   npm run dev  # or yarn dev
   ```
   API should be at `http://localhost:3000`

2. **Verify `.env.local` exists in `example-app/`:**
   ```
   NEXT_PUBLIC_TMK_API_URL=http://localhost:3000
   ```
   (Already created - no action needed)

3. **Start the example app:**
   ```bash
   cd example-app
   yarn dev
   ```

## Test the Integration

Visit: `http://localhost:3000/tmk-api-demo`

This interactive demo page lets you:
- Click buttons to load data from each model
- View raw JSON responses in card components
- Check for API errors in real-time

## Import in Your Components

```javascript
// Option 1: Import specific API
import { morphemesAPI, wordsAPI, wordlistsAPI, wordfamiliesAPI } from '@/lib/api-client';

// Option 2: Import consolidated API
import { tmkAPI } from '@/lib/api-client';
```

## Common Patterns

### Fetch data on component load
```javascript
'use client';
import { useEffect, useState } from 'react';
import { wordsAPI } from '@/lib/api-client';

export default function MyComponent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    wordsAPI.getAll({ limit: 20 })
      .then(setData)
      .finally(() => setLoading(false));
  }, []);
  
  if (loading) return <p>Loading...</p>;
  return <div>{JSON.stringify(data, null, 2)}</div>;
}
```

### Search for data
```javascript
const results = await tmkAPI.words.search('teach');
const results = await tmkAPI.morphemes.search('re');
const results = await tmkAPI.wordlists.search('animals');
const results = await tmkAPI.wordfamilies.search('port');
```

### Get related data
```javascript
// Words by morpheme
const words = await tmkAPI.words.getByMorpheme('morpheme-id');

// Words in a wordlist
const words = await tmkAPI.wordlists.getWords('wordlist-id');

// Words and morphemes in a wordfamily
const words = await tmkAPI.wordfamilies.getWords('family-id');
const morphemes = await tmkAPI.wordfamilies.getMorphemes('family-id');
```

## API Methods Available

### Morphemes
- `getAll(options)` - Get all morphemes with optional limit/skip
- `getById(id)` - Get a specific morpheme
- `search(query)` - Search morphemes by query

### Words
- `getAll(options)` - Get all words with optional limit/skip
- `getById(id)` - Get a specific word
- `search(query)` - Search words by query
- `getByMorpheme(morphemeId)` - Get words containing a morpheme

### Wordlists
- `getAll(options)` - Get all wordlists with optional limit/skip
- `getById(id)` - Get a specific wordlist
- `getWords(id)` - Get words in a wordlist
- `search(query)` - Search wordlists by query

### Wordfamilies
- `getAll(options)` - Get all wordfamilies with optional limit/skip
- `getById(id)` - Get a specific wordfamily
- `getWords(id)` - Get words in a wordfamily
- `getMorphemes(id)` - Get morphemes in a wordfamily
- `search(query)` - Search wordfamilies by query

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Failed to fetch` | Ensure tmk-api is running on port 3000 |
| `CORS error` | Check tmk-api CORS configuration |
| `Cannot find module` | Verify file paths use `@/lib/api-client` alias |
| `404 errors` | Endpoint may not match tmk-api's actual routes |
| Empty data | Check API response format matches expectations |

## Updating Endpoints

If tmk-api endpoints differ, edit `lib/api-client.js`:
- Each method has the endpoint path in the `fetchFromAPI()` call
- E.g., to change from `/api/words` to `/words`, update the string in `getAll()`

## Next Steps

1. Test the demo page to verify API connectivity
2. Examine actual API responses in network tab
3. Update client methods if endpoints differ
4. Integrate specific data into your lesson pages
