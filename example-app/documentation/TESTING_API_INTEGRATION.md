# Testing the TMK API Integration

## Using the API Test Utility

A test utility has been created at `lib/api-test.js` that helps verify the API integration is working correctly.

### Option 1: Test in Browser Console (Easiest)

1. Visit the demo page: `http://localhost:3000/tmk-api-demo`
2. Open Browser DevTools (F12 or right-click → Inspect)
3. Go to the Console tab
4. Paste and run:

```javascript
import { testAPI } from '@/lib/api-test';
await testAPI.testAllEndpoints();
```

This will run all tests and show a summary in the console.

### Option 2: Use Individual Test Functions

```javascript
// Test a specific endpoint
import { testAPI } from '@/lib/api-test';

await testAPI.testMorphemes();
await testAPI.testWords();
await testAPI.testWordlists();
await testAPI.testWordfamilies();
```

### Option 3: Test Search Functions

```javascript
import { testAPI } from '@/lib/api-test';

// Search with custom queries
await testAPI.testWordSearch('teach');
await testAPI.testMorphemeSearch('re');
```

### Option 4: Test Custom Endpoints

If your tmk-api uses different endpoint paths, test them directly:

```javascript
import { testAPI } from '@/lib/api-test';

// Test a custom endpoint
await testAPI.testCustom('/api/custom-path');
```

## Interpreting Results

### Success Response
```
✓ PASS - morphemes
✓ PASS - words
✓ PASS - wordlists
✓ PASS - wordfamilies

Total: 4/4 tests passed
```

### Failure Response
```
✗ FAIL - morphemes
  Error: Failed to fetch /api/morphemes: 404 Not Found
```

Common errors:
- **404 Not Found** - The endpoint path is wrong (check tmk-api routes)
- **Connection refused** - The tmk-api isn't running
- **CORS error** - The tmk-api doesn't allow requests from this origin

## Expected Data Structure

After running tests, inspect the returned data to understand the API response format:

```javascript
import { testAPI } from '@/lib/api-test';
const result = await testAPI.testWords();
console.log('Raw data:', result.data);

// This helps you understand the structure:
// Do records have: id, _id, text, name, etc.?
// Are arrays flat or nested?
```

Then update the demo page or your components to correctly display the data based on the actual structure.

## Debugging Steps

1. **Verify tmk-api is running:**
   - Visit `http://localhost:3000` directly
   - Check the terminal where you started the API

2. **Check network requests:**
   - Open DevTools → Network tab
   - Click "Load" buttons on the demo page
   - Look for failed requests (red ones)
   - Click on each request to see details and response body

3. **Inspect the response:**
   - In DevTools Network tab, click on a request
   - Go to Response tab
   - Look at the JSON structure
   - Compare to what the client expects

4. **Test specific endpoints:**
   - Use `testAPI.testCustom()` to test specific paths
   - Example: `await testAPI.testCustom('/api/morphemes')`
   - Try variations like `/morphemes`, `/api/v1/morphemes`, etc.

5. **Print detailed responses:**
   ```javascript
   import { testAPI } from '@/lib/api-test';
   const result = await testAPI.testWords();
   testAPI.print(result.data);  // Pretty-print the response
   ```

## If Tests Fail

### API returns 404
The endpoint paths don't match. Check:
- What does your tmk-api actually expose?
- Edit `lib/api-client.js` to match actual routes
- Example: If API uses `/words` instead of `/api/words`, update the fetch paths

### API returns empty array `[]`
The endpoint works but has no data. This could mean:
- The database is empty
- You need to seed data first
- Check the tmk-api documentation for setup

### CORS errors
The tmk-api might be blocking requests:
- Check tmk-api's CORS configuration
- Add `http://localhost:3000` (or your actual Next.js port) to allowed origins
- Ensure tmk-api has `Access-Control-Allow-Origin` headers

### Connection refused / timeout
The tmk-api isn't running:
```bash
# Make sure it's started in another terminal
cd /path/to/tmk-api
npm run dev
```

## Helpful Console Commands

```javascript
import { testAPI } from '@/lib/api-test';

// Test everything
await testAPI.testAllEndpoints();

// Test a specific endpoint
await testAPI.testWords();

// Pretty print a response
const data = await tmkAPI.words.getAll({ limit: 3 });
testAPI.print(data);

// Count results
const data = await tmkAPI.words.getAll({ limit: 10 });
console.log(`Got ${data.length} words`);

// Inspect first record
const data = await tmkAPI.words.getAll({ limit: 1 });
console.log('First record:', data[0]);
```

## Next Steps

Once tests pass:
1. Review the response structure
2. Update the demo page if needed to display data correctly
3. Integrate the API into your lesson pages
4. Add more specific queries and filters as needed
