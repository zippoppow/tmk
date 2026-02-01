# TMK API Integration

This example app is configured to integrate with the tmk-api running locally at `http://localhost:3000`.

## Setup

### 1. Environment Configuration

Create a `.env.local` file in the `example-app/` directory (this file is already in `.gitignore`):

```bash
NEXT_PUBLIC_TMK_API_URL=http://localhost:3000
```

The `NEXT_PUBLIC_` prefix makes this variable available to the browser.

### 2. Start the TMK API

Ensure the tmk-api is running in dev mode:

```bash
# In a separate terminal
cd /path/to/tmk-api
npm run dev  # or yarn dev
```

The API should be accessible at `http://localhost:3000`.

## Usage

The API client is located in `lib/api-client.js` and provides utilities for the following models:

### Morphemes

```javascript
import { morphemesAPI } from '@/lib/api-client';

// Get all morphemes
const morphemes = await morphemesAPI.getAll({ limit: 10 });

// Get a single morpheme
const morpheme = await morphemesAPI.getById('some-id');

// Search morphemes
const results = await morphemesAPI.search('re');
```

### Words

```javascript
import { wordsAPI } from '@/lib/api-client';

// Get all words
const words = await wordsAPI.getAll({ limit: 10 });

// Get a single word
const word = await wordsAPI.getById('some-id');

// Search words
const results = await wordsAPI.search('teacher');

// Get words containing a specific morpheme
const wordsWithMorpheme = await wordsAPI.getByMorpheme('morpheme-id');
```

### Wordlists

```javascript
import { wordlistsAPI } from '@/lib/api-client';

// Get all wordlists
const wordlists = await wordlistsAPI.getAll();

// Get a single wordlist
const wordlist = await wordlistsAPI.getById('wordlist-id');

// Get words in a wordlist
const words = await wordlistsAPI.getWords('wordlist-id');

// Search wordlists
const results = await wordlistsAPI.search('animals');
```

### Wordfamilies

```javascript
import { wordfamiliesAPI } from '@/lib/api-client';

// Get all wordfamilies
const wordfamilies = await wordfamiliesAPI.getAll();

// Get a single wordfamily
const wordfamily = await wordfamiliesAPI.getById('family-id');

// Get words in a wordfamily
const words = await wordfamiliesAPI.getWords('family-id');

// Get morphemes in a wordfamily
const morphemes = await wordfamiliesAPI.getMorphemes('family-id');

// Search wordfamilies
const results = await wordfamiliesAPI.search('port');
```

### All APIs Together

```javascript
import { tmkAPI } from '@/lib/api-client';

// Access any API through the consolidated object
const morphemes = await tmkAPI.morphemes.getAll();
const words = await tmkAPI.words.search('teach');
const wordlists = await tmkAPI.wordlists.getById('id');
const wordfamilies = await tmkAPI.wordfamilies.getMorphemes('id');
```

## In React Components

Example usage in a client component:

```javascript
'use client';

import { useEffect, useState } from 'react';
import { wordsAPI } from '@/lib/api-client';

export default function WordSearch() {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    wordsAPI.search('teach')
      .then(data => {
        setWords(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Words containing 'teach'</h2>
      <ul>
        {words.map(word => (
          <li key={word.id}>{word.text}</li>
        ))}
      </ul>
    </div>
  );
}
```

## API Endpoints Reference

The client makes requests to the following endpoints (adjust based on your actual tmk-api structure):

- `GET /api/morphemes` - List all morphemes
- `GET /api/morphemes/:id` - Get a specific morpheme
- `GET /api/morphemes/search?search=:query` - Search morphemes

- `GET /api/words` - List all words
- `GET /api/words/:id` - Get a specific word
- `GET /api/words/search?search=:query` - Search words
- `GET /api/words/morpheme/:morphemeId` - Get words by morpheme

- `GET /api/wordlists` - List all wordlists
- `GET /api/wordlists/:id` - Get a specific wordlist
- `GET /api/wordlists/:id/words` - Get words in a wordlist
- `GET /api/wordlists/search?search=:query` - Search wordlists

- `GET /api/wordfamilies` - List all wordfamilies
- `GET /api/wordfamilies/:id` - Get a specific wordfamily
- `GET /api/wordfamilies/:id/words` - Get words in a wordfamily
- `GET /api/wordfamilies/:id/morphemes` - Get morphemes in a wordfamily
- `GET /api/wordfamilies/search?search=:query` - Search wordfamilies

## Troubleshooting

### Connection refused at localhost:3000

- Verify the tmk-api is running and started on port 3000
- Check that `NEXT_PUBLIC_TMK_API_URL` is correctly set in `.env.local`

### CORS errors

- The tmk-api should have CORS enabled for localhost:3000
- If you see CORS errors, check the tmk-api configuration

### API responses don't match expected structure

- Review the actual API responses to understand the data shape
- Adjust the client methods as needed to match your API's actual response format
