# 🎯 TMK API Integration - Master Index

## Quick Navigation

### 🚀 Getting Started (Pick One)
- **[GETTING_STARTED_API.md](GETTING_STARTED_API.md)** - Visual overview with diagrams
- **[README_API_INTEGRATION.md](README_API_INTEGRATION.md)** - Overview & checklist

### 💻 While Coding
- **[TMK_API_QUICK_REFERENCE.md](TMK_API_QUICK_REFERENCE.md)** - Code snippets & patterns
- **[lib/api-client.js](lib/api-client.js)** - Main API client (imports go here)

### 📖 Deep Dive
- **[TMK_API_INTEGRATION.md](TMK_API_INTEGRATION.md)** - Complete guide with examples
- **[API_INTEGRATION_SETUP.md](API_INTEGRATION_SETUP.md)** - Architecture & customization
- **[FILE_REFERENCE.md](FILE_REFERENCE.md)** - File listing & dependencies

### 🧪 Testing & Debugging
- **[TESTING_API_INTEGRATION.md](TESTING_API_INTEGRATION.md)** - How to verify & debug
- **[lib/api-test.js](lib/api-test.js)** - Test utilities
- **[app/tmk-api-demo/page.js](app/tmk-api-demo/page.js)** - Interactive demo page

---

## File Structure

```
example-app/
├── lib/
│   ├── api-client.js ........................ ⭐ Main API client
│   ├── api-types.ts ........................ Type definitions
│   └── api-test.js ......................... Testing utilities
│
├── app/
│   └── tmk-api-demo/
│       └── page.js ......................... Interactive demo page
│
├── .env.local .............................. Configuration
│
└── Documentation/
    ├── GETTING_STARTED_API.md .............. Visual overview (START HERE)
    ├── README_API_INTEGRATION.md ........... Checklist & overview
    ├── TMK_API_QUICK_REFERENCE.md ......... Code snippets
    ├── TMK_API_INTEGRATION.md ............. Complete guide
    ├── API_INTEGRATION_SETUP.md ........... Architecture notes
    ├── TESTING_API_INTEGRATION.md ......... Debugging guide
    ├── FILE_REFERENCE.md .................. File listing
    └── INDEX.md (this file) ............... Navigation

```

---

## Supported Models

| Model | Methods | Use For |
|-------|---------|---------|
| **Morphemes** | `getAll()`, `getById()`, `search()` | Linguistic building blocks (re-, -ing, -tion) |
| **Words** | `getAll()`, `getById()`, `search()`, `getByMorpheme()` | Complete words like "teacher", "teaching" |
| **Wordlists** | `getAll()`, `getById()`, `getWords()`, `search()` | Collections by theme (e.g., "Animals", "Verbs") |
| **Wordfamilies** | `getAll()`, `getById()`, `getWords()`, `getMorphemes()`, `search()` | Words sharing roots (e.g., port family) |

---

## Quick Start

### 1. Start Services
```bash
# Terminal 1 - tmk-api
cd /path/to/tmk-api
npm run dev

# Terminal 2 - example-app
cd example-app
yarn dev
```

### 2. Test Integration
Visit: `http://localhost:3000/tmk-api-demo`

Click "Load" buttons to see data from each model.

### 3. Verify with Console
```javascript
import { testAPI } from '@/lib/api-test';
await testAPI.testAllEndpoints();
// Should show: Total: 6/6 tests passed
```

---

## Common Tasks

### Import in Components
```javascript
import { tmkAPI } from '@/lib/api-client';
// or
import { wordsAPI, morphemesAPI } from '@/lib/api-client';
```

### Get All Records
```javascript
const morphemes = await tmkAPI.morphemes.getAll({ limit: 10 });
const words = await tmkAPI.words.getAll();
const wordlists = await tmkAPI.wordlists.getAll();
const families = await tmkAPI.wordfamilies.getAll();
```

### Search Records
```javascript
const results = await tmkAPI.words.search('teach');
const results = await tmkAPI.morphemes.search('re');
```

### Get Related Data
```javascript
const words = await tmkAPI.wordfamilies.getWords(familyId);
const morphemes = await tmkAPI.wordfamilies.getMorphemes(familyId);
const words = await tmkAPI.wordlists.getWords(listId);
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
  
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
```

---

## Documentation Map by Purpose

### I want to...

**...get started quickly**
→ Read [GETTING_STARTED_API.md](GETTING_STARTED_API.md)

**...see code examples**
→ Read [TMK_API_QUICK_REFERENCE.md](TMK_API_QUICK_REFERENCE.md)

**...understand the setup**
→ Read [README_API_INTEGRATION.md](README_API_INTEGRATION.md)

**...learn all the details**
→ Read [TMK_API_INTEGRATION.md](TMK_API_INTEGRATION.md)

**...verify it's working**
→ Read [TESTING_API_INTEGRATION.md](TESTING_API_INTEGRATION.md)

**...debug an issue**
→ Read [TESTING_API_INTEGRATION.md](TESTING_API_INTEGRATION.md#troubleshooting) (Troubleshooting section)

**...understand the architecture**
→ Read [API_INTEGRATION_SETUP.md](API_INTEGRATION_SETUP.md)

**...know what files exist**
→ Read [FILE_REFERENCE.md](FILE_REFERENCE.md)

**...change the API URL**
→ Edit [.env.local](.env.local)

**...change endpoint paths**
→ Edit [lib/api-client.js](lib/api-client.js)

**...see a working example**
→ Visit `/tmk-api-demo` or view [app/tmk-api-demo/page.js](app/tmk-api-demo/page.js)

---

## Checklist

- [ ] tmk-api is running on localhost:3000
- [ ] Example app is running (yarn dev)
- [ ] Can visit /tmk-api-demo
- [ ] Demo page "Load" buttons work
- [ ] testAPI.testAllEndpoints() passes
- [ ] Read GETTING_STARTED_API.md
- [ ] Can import tmkAPI in components
- [ ] Ready to build features

---

## Configuration

### Change API URL
Edit `.env.local`:
```
NEXT_PUBLIC_TMK_API_URL=http://your-host:port
```

### Change Endpoints
Edit `lib/api-client.js` and update the endpoint paths in `fetchFromAPI()` calls.

### Add Type Safety
Use types from `lib/api-types.ts` in TypeScript files.

---

## Testing

### Quick Test
```javascript
import { testAPI } from '@/lib/api-test';
await testAPI.testAllEndpoints();
```

### Specific Tests
```javascript
await testAPI.testWords();
await testAPI.testMorphemes();
await testAPI.testWordSearch('teach');
```

### Custom Endpoint
```javascript
await testAPI.testCustom('/api/custom-path');
```

See [TESTING_API_INTEGRATION.md](TESTING_API_INTEGRATION.md) for details.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| API not found | Ensure tmk-api is running on port 3000 |
| CORS errors | Check tmk-api CORS configuration |
| 404 endpoints | Update endpoint paths in `lib/api-client.js` |
| Empty data | Check if API has data or response format differs |
| Import errors | Use correct path: `@/lib/api-client` |

Full debugging guide: [TESTING_API_INTEGRATION.md](TESTING_API_INTEGRATION.md)

---

## Next Steps

1. **Test the demo page** - Visit /tmk-api-demo
2. **Run console tests** - Execute testAPI.testAllEndpoints()
3. **Review response data** - Check DevTools Network tab
4. **Read the guides** - Start with GETTING_STARTED_API.md
5. **Build features** - Integrate API calls into your lesson pages
6. **Customize** - Adjust based on actual API structure

---

## Files at a Glance

| File | Lines | Purpose |
|------|-------|---------|
| api-client.js | ~200 | Main API client (import this!) |
| api-test.js | ~180 | Testing utilities |
| api-types.ts | ~65 | TypeScript types |
| tmk-api-demo page | ~310 | Interactive demo |
| .env.local | 2 | Configuration |
| Docs | ~4000 | Complete guides |

---

## External Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Material-UI Docs**: https://mui.com/
- **Fetch API**: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API

---

## Support

**Need help?**

1. Check relevant documentation above
2. Try the test utility: `testAPI.testAllEndpoints()`
3. Review [TESTING_API_INTEGRATION.md](TESTING_API_INTEGRATION.md)
4. Check browser DevTools Network tab for actual responses

---

**Last updated:** January 6, 2026

**Status:** ✅ Complete and ready to use
