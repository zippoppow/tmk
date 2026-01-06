# 🎯 TMK API Integration - Visual Overview

## What's Been Set Up

```
┌─────────────────────────────────────────────────────────────┐
│         TMK API Integration Complete Setup                   │
└─────────────────────────────────────────────────────────────┘

Your example-app now communicates with tmk-api:

    localhost:3000 (tmk-api)          localhost:3000/3001 (Next.js)
           │                                    │
           │  GET /api/morphemes               │
           │  GET /api/words         ────────→ │
           │  GET /api/wordlists     ←─────── │
           │  GET /api/wordfamilies            │
           │                                    │
           └────────────────────────────────────┘
```

## 📂 New Files Created

### Core Integration Files

```
example-app/
│
├── lib/
│   ├── api-client.js ..................... API client with all methods
│   ├── api-types.ts ...................... TypeScript types (optional)
│   └── api-test.js ....................... Testing utilities
│
├── app/
│   └── tmk-api-demo/
│       └── page.js ....................... Interactive demo page
│
├── .env.local ............................ API configuration
│
└── Documentation/
    ├── README_API_INTEGRATION.md ......... Overview (START HERE)
    ├── TMK_API_INTEGRATION.md ............ Complete guide
    ├── TMK_API_QUICK_REFERENCE.md ....... Code snippets & patterns
    ├── API_INTEGRATION_SETUP.md ......... Architecture notes
    └── TESTING_API_INTEGRATION.md ....... Testing & debugging
```

## 🚀 Quick Start (3 Steps)

### 1️⃣ Start tmk-api (in Terminal 1)
```bash
cd /path/to/tmk-api
npm run dev
→ API running at http://localhost:3000
```

### 2️⃣ Start example-app (in Terminal 2)
```bash
cd example-app
yarn dev
→ Next.js app running
```

### 3️⃣ Test the integration
Visit: **http://localhost:3000/tmk-api-demo**

Click "Load" buttons to fetch data!

## 📊 Available APIs

```javascript
import { tmkAPI } from '@/lib/api-client';

// ═══════════════════════════════════════════════════════
// MORPHEMES - Linguistic building blocks
// ═══════════════════════════════════════════════════════
tmkAPI.morphemes.getAll()           // Get all morphemes
tmkAPI.morphemes.getById(id)        // Get one morpheme
tmkAPI.morphemes.search('re')       // Search morphemes

// ═══════════════════════════════════════════════════════
// WORDS - Complete words made of morphemes
// ═══════════════════════════════════════════════════════
tmkAPI.words.getAll()               // Get all words
tmkAPI.words.getById(id)            // Get one word
tmkAPI.words.search('teach')        // Search words
tmkAPI.words.getByMorpheme(id)      // Words with a morpheme

// ═══════════════════════════════════════════════════════
// WORDLISTS - Collections of words by theme/lesson
// ═══════════════════════════════════════════════════════
tmkAPI.wordlists.getAll()           // Get all wordlists
tmkAPI.wordlists.getById(id)        // Get one wordlist
tmkAPI.wordlists.getWords(id)       // Get words in wordlist
tmkAPI.wordlists.search('animals')  // Search wordlists

// ═══════════════════════════════════════════════════════
// WORDFAMILIES - Words sharing a root morpheme
// ═══════════════════════════════════════════════════════
tmkAPI.wordfamilies.getAll()        // Get all families
tmkAPI.wordfamilies.getById(id)     // Get one family
tmkAPI.wordfamilies.getWords(id)    // Get words in family
tmkAPI.wordfamilies.getMorphemes(id)// Get morphemes in family
tmkAPI.wordfamilies.search('port')  // Search families
```

## 💻 Usage Example

```javascript
'use client';
import { useEffect, useState } from 'react';
import { tmkAPI } from '@/lib/api-client';

export default function WordLesson() {
  const [words, setWords] = useState([]);

  useEffect(() => {
    // Fetch words related to 'teach'
    tmkAPI.words.search('teach').then(setWords);
  }, []);

  return (
    <div>
      <h2>Words with 'teach'</h2>
      <ul>
        {words.map(w => <li key={w.id}>{w.text}</li>)}
      </ul>
    </div>
  );
}
```

## 🧪 Verify Integration

### Method 1: Demo Page
Visit: **http://localhost:3000/tmk-api-demo**
- Tabbed interface for each model
- Click "Load" to test endpoints
- See errors in real-time

### Method 2: Browser Console
```javascript
import { testAPI } from '@/lib/api-test';
await testAPI.testAllEndpoints();
// Shows: ✓ PASS - all endpoints working
```

### Method 3: Network Tab
1. Open DevTools (F12)
2. Click Console tab
3. Run: `tmkAPI.words.getAll()`
4. Switch to Network tab
5. See the API request/response

## 📚 Documentation Map

```
START HERE
    ↓
README_API_INTEGRATION.md ........... Overview & quick start
    ↓
    ├─→ TMK_API_QUICK_REFERENCE.md .. Code examples & patterns
    ├─→ TESTING_API_INTEGRATION.md .. Verify it's working
    ├─→ TMK_API_INTEGRATION.md ...... Detailed guide
    └─→ API_INTEGRATION_SETUP.md ... Architecture notes
```

## ⚡ Common Tasks

### Get all words
```javascript
const words = await tmkAPI.words.getAll({ limit: 10 });
```

### Search for words
```javascript
const results = await tmkAPI.words.search('teach');
```

### Get words in a wordlist
```javascript
const words = await tmkAPI.wordlists.getWords(listId);
```

### Get morphemes in a word family
```javascript
const morphemes = await tmkAPI.wordfamilies.getMorphemes(familyId);
```

### Use in React component
```javascript
'use client';
import { useEffect, useState } from 'react';
import { tmkAPI } from '@/lib/api-client';

export default function Component() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    tmkAPI.words.getAll({ limit: 5 }).then(setData);
  }, []);
  
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
```

## ⚙️ Configuration

### Change API URL
Edit `.env.local`:
```
NEXT_PUBLIC_TMK_API_URL=http://localhost:3000
```

### Update Endpoint Paths
If tmk-api uses different routes, edit `lib/api-client.js`:
```javascript
// Find lines like:
fetchFromAPI(`/api/morphemes?${params}`)
// Change to match your API:
fetchFromAPI(`/morphemes?${params}`)
```

## 🔍 Troubleshooting

| Problem | Fix |
|---------|-----|
| "Failed to fetch" | Make sure tmk-api is running: `npm run dev` |
| CORS error | Check tmk-api has CORS enabled |
| 404 errors | Endpoint paths may differ - update `api-client.js` |
| Empty results | Check if API has data or if response format differs |

→ Detailed guide: [TESTING_API_INTEGRATION.md](TESTING_API_INTEGRATION.md)

## ✅ Integration Checklist

- [ ] tmk-api is running (`npm run dev`)
- [ ] Example app is running (`yarn dev`)
- [ ] Demo page loads: `http://localhost:3000/tmk-api-demo`
- [ ] "Load" buttons work and show data
- [ ] Console tests pass: `testAPI.testAllEndpoints()`
- [ ] Can import: `import { tmkAPI } from '@/lib/api-client'`
- [ ] Data structure matches your API's response format

## 🎓 Next Steps

1. **Test the demo page** ← Do this first!
2. **Review response structure** - Check what fields are returned
3. **Update as needed** - If field names differ (e.g., `label` vs `text`)
4. **Integrate into lessons** - Add API calls to your lesson pages
5. **Build features** - Create filters, searches, related content

## 📞 Help

- Read: [README_API_INTEGRATION.md](README_API_INTEGRATION.md)
- Test: [TESTING_API_INTEGRATION.md](TESTING_API_INTEGRATION.md)
- Reference: [TMK_API_QUICK_REFERENCE.md](TMK_API_QUICK_REFERENCE.md)
- Details: [TMK_API_INTEGRATION.md](TMK_API_INTEGRATION.md)

---

**You're all set! Visit the demo page and click "Load" to test.** 🚀
