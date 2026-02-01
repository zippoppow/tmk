# TMK API Integration - Setup Summary

## What's Been Created

### 1. **API Client Library** (`lib/api-client.js`)
A complete JavaScript API client that provides methods to interact with:
- **Morphemes** - `morphemesAPI`
- **Words** - `wordsAPI`
- **Wordlists** - `wordlistsAPI`
- **Wordfamilies** - `wordfamiliesAPI`

All methods support:
- `getAll(options)` - List all records
- `getById(id)` - Get a single record
- `search(query)` - Search records
- Additional methods for relationships (e.g., `getByMorpheme`, `getWords`)

### 2. **Environment Configuration** (`.env.local`)
Set to connect to the tmk-api at `http://localhost:3000`
```
NEXT_PUBLIC_TMK_API_URL=http://localhost:3000
```

### 3. **TypeScript Types** (`lib/api-types.ts`)
Optional TypeScript definitions for:
- `Morpheme`
- `Word`
- `Wordlist`
- `Wordfamily`
- Generic API response types
- Query options interface

### 4. **Interactive Demo Page** (`app/tmk-api-demo/page.js`)
A full-featured demo page at `/tmk-api-demo` that demonstrates:
- Tabbed interface for each model
- "Load" buttons to fetch data from the API
- Error handling and loading states
- Data display in Material-UI cards
- Real-time API testing

### 5. **Documentation**
Two comprehensive guides:
- **TMK_API_INTEGRATION.md** - Detailed setup and usage guide
- **TMK_API_QUICK_REFERENCE.md** - Quick reference with common patterns

## How to Use

### Start the Services

**Terminal 1 - Start tmk-api:**
```bash
cd /path/to/tmk-api
npm run dev
# API will be at http://localhost:3000
```

**Terminal 2 - Start example-app:**
```bash
cd /Users/elcorando/dev/tmk/example-app
yarn dev
# App will be at http://localhost:3000 (or next available port)
```

### Test the Integration

Visit: `http://localhost:3000/tmk-api-demo` (or adjust port if needed)

Click "Load" buttons to test each API endpoint.

### Use in Your Components

```javascript
'use client';
import { tmkAPI } from '@/lib/api-client';

export default function MyComponent() {
  const loadWords = async () => {
    const words = await tmkAPI.words.search('teach');
    console.log(words);
  };

  return <button onClick={loadWords}>Search Words</button>;
}
```

## File Locations

```
example-app/
├── lib/
│   ├── api-client.js          ← Main API client
│   └── api-types.ts           ← TypeScript types (optional)
├── app/
│   └── tmk-api-demo/
│       └── page.js            ← Interactive demo
├── .env.local                 ← API URL config
├── TMK_API_INTEGRATION.md     ← Full guide
└── TMK_API_QUICK_REFERENCE.md ← Quick reference
```

## Next Steps

1. **Verify tmk-api is running** at http://localhost:3000
2. **Visit the demo page** at http://localhost:3000/tmk-api-demo
3. **Test each model** by clicking the load buttons
4. **Check browser console** for any errors
5. **Review actual API responses** in browser DevTools Network tab
6. **Adjust api-client.js** if endpoints differ from tmk-api's actual routes
7. **Integrate into lesson pages** as needed

## Customization Points

### Change API Base URL
Edit `.env.local`:
```
NEXT_PUBLIC_TMK_API_URL=http://your-api-host:port
```

### Adjust Endpoints
If tmk-api uses different endpoint paths, edit `lib/api-client.js`:
- Find the `fetchFromAPI()` calls
- Update endpoint strings to match your API
- Example: Change `/api/words` to `/words`

### Add More Methods
Extend the APIs in `lib/api-client.js` by adding new async methods following the existing pattern.

### Handle Different Response Formats
The demo page shows one way to handle responses. If your API returns different field names (e.g., `label` instead of `text`), update the demo component's rendering logic.

## Common Issues & Fixes

### Issue: API connection refused
**Fix:** Ensure tmk-api is running on port 3000

### Issue: CORS errors
**Fix:** Verify tmk-api has CORS enabled for localhost

### Issue: 404 endpoints
**Fix:** The actual tmk-api may use different endpoint paths. Check the API documentation and update `api-client.js`

### Issue: Empty results
**Fix:** The data might be structured differently. Inspect the API response in DevTools and verify the demo page is accessing the right properties.

## Architecture Notes

- **api-client.js**: Thin wrapper around fetch with error handling
- **Environment variable**: Allows switching API URLs without code changes
- **Exports multiple patterns**: Both individual exports and consolidated `tmkAPI` object for flexibility
- **Browser-compatible**: Uses `fetch()` API with NEXT_PUBLIC_ prefix for client-side use
- **Type-safe**: Optional TypeScript types available in `api-types.ts`

## Support

For issues or questions:
1. Check the documentation files
2. Review the demo page implementation
3. Inspect network requests in browser DevTools
4. Verify tmk-api is running and accessible
5. Check endpoint paths in your tmk-api implementation
