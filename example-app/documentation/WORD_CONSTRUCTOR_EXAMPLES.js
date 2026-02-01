/**
 * Example: Using WordConstructor Generator Output in Lesson Activities
 * 
 * This example shows how to:
 * 1. Generate wordConstructors for a word list
 * 2. Use the output to create lesson activity JSON
 * 3. Render the wordConstructor in a template
 */

// ============================================================================
// STEP 1: Generate WordConstructors
// ============================================================================
// 
// Use the WordConstructor Generator page to create wordConstructors
// URL: http://localhost:3001/utilities/data-mgmt/generators/word-constructor
//
// Upload CSV with words:
// word
// intercontinental
// metropolitan
// revolutionary
//
// Click "Generate WordConstructors" and export the CSV results

// ============================================================================
// STEP 2: Example Output from Generator
// ============================================================================

const generatorOutput = {
  success: true,
  results: [
    {
      word: 'intercontinental',
      wordConstructor: 'inter- + con- + tine + -ent + -al',
      morphemes: ['inter-', 'con-', 'tine', '-ent', '-al'],
      notes: 'Analysis based on TMK morpheme database',
    },
    {
      word: 'metropolitan',
      wordConstructor: 'metro- + politan',
      morphemes: ['metro-', 'politan'],
      notes: 'Analysis based on TMK morpheme database',
    },
    {
      word: 'revolutionary',
      wordConstructor: 'revolution + -ary',
      morphemes: ['revolution', '-ary'],
      notes: 'Analysis based on TMK morpheme database',
    },
  ],
};

// ============================================================================
// STEP 3: Create Lesson Activity JSON from Results
// ============================================================================

// Helper function to create a lesson activity from wordConstructor results
function createWordConstructorLessonActivity(
  generatorResults,
  lessonName = 'Word Constructor Activity',
  instructions = 'Break down the following words into their morpheme components.'
) {
  return {
    LessonName: lessonName,
    LessonType: 'WORD CONSTRUCTOR',
    LessonTitle: lessonName,
    Instructions: instructions,
    WordBank: generatorResults.map((r) => r.word),
    WordConstructors: generatorResults.reduce((acc, result) => {
      acc[result.word] = {
        constructor: result.wordConstructor,
        morphemes: result.morphemes,
      };
      return acc;
    }, {}),
    Metadata: {
      generatedAt: new Date().toISOString(),
      morphemeCount: generatorResults.length,
      totalMorphemes: generatorResults.reduce((sum, r) => sum + r.morphemes.length, 0),
    },
  };
}

// Create example activity
const lessonActivity = createWordConstructorLessonActivity(
  generatorOutput.results,
  'Latin Roots: Continental Words',
  'Identify the morphemes in each word by breaking it down into its component parts.'
);

console.log('Generated Lesson Activity:', lessonActivity);

// ============================================================================
// STEP 4: Using WordConstructors in a React Component
// ============================================================================

// Example React component to display wordConstructor in a lesson
import React from 'react';
import { Box, Typography, Chip } from '@mui/material';

function WordConstructorDisplay({ word, wordConstructor, morphemes }) {
  return (
    <Box sx={{ marginY: 2, padding: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
      <Typography variant="h6" sx={{ marginBottom: 1 }}>
        {word}
      </Typography>

      <Typography variant="body2" sx={{ marginBottom: 1, color: 'text.secondary' }}>
        WordConstructor:
      </Typography>
      <Typography
        variant="body1"
        sx={{
          fontFamily: 'monospace',
          fontWeight: 500,
          marginBottom: 2,
          padding: 1,
          backgroundColor: 'white',
          borderRadius: 1,
          border: '1px solid #ddd',
        }}
      >
        {wordConstructor}
      </Typography>

      <Typography variant="body2" sx={{ marginBottom: 0.5, color: 'text.secondary' }}>
        Morphemes:
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {morphemes.map((morpheme, idx) => (
          <Chip
            key={idx}
            label={morpheme}
            variant="outlined"
            size="small"
            color={
              morpheme.endsWith('-') || morpheme.startsWith('-')
                ? 'primary'
                : 'default'
            }
          />
        ))}
      </Box>
    </Box>
  );
}

// Usage:
// <WordConstructorDisplay
//   word="intercontinental"
//   wordConstructor="inter- + con- + tine + -ent + -al"
//   morphemes={['inter-', 'con-', 'tine', '-ent', '-al']}
// />

// ============================================================================
// STEP 5: Integration with Lesson Template
// ============================================================================

// Example showing how to use in an existing lesson template HTML
const lessonTemplateExample = `
<!-- In your lesson template HTML -->
<div class="word-constructor-activity">
  <h2>Break Down the Word</h2>
  <p>Each word below has been broken into its morpheme components. Try to identify each part:</p>

  <!-- Generated from WordConstructor output -->
  <div class="word-list">
    <div class="word-item">
      <h3>intercontinental</h3>
      <div class="word-constructor">inter- + con- + tine + -ent + -al</div>
      <div class="morphemes">
        <span class="prefix">inter-</span> (prefix)
        <span class="prefix">con-</span> (prefix)
        <span class="root">tine</span> (root)
        <span class="suffix">-ent</span> (suffix)
        <span class="suffix">-al</span> (suffix)
      </div>
    </div>
    <!-- More words... -->
  </div>
</div>
`;

// ============================================================================
// STEP 6: Export Generated Activity to CSV/JSON
// ============================================================================

function exportActivityAsJSON(activity) {
  const dataStr = JSON.stringify(activity, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `word-constructor-activity-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
}

function exportActivityAsCSV(activity) {
  const rows = [['Word', 'WordConstructor', 'Morphemes']];

  Object.entries(activity.WordConstructors).forEach(([word, data]) => {
    rows.push([
      word,
      data.constructor,
      data.morphemes.join(' + '),
    ]);
  });

  const csvContent = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `word-constructor-activity-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

// ============================================================================
// STEP 7: Workflow Summary
// ============================================================================

/*
WORKFLOW TO CREATE WORD CONSTRUCTOR LESSONS:

1. GENERATE WORDCONSTRUCTORS
   ↓
   Open: http://localhost:3001/utilities/data-mgmt/generators/word-constructor
   Upload: CSV file with words
   Action: Click "Generate WordConstructors"
   Export: Download CSV of results

2. TRANSFORM TO LESSON FORMAT
   ↓
   Use: createWordConstructorLessonActivity()
   Input: Results from generator
   Output: Lesson activity JSON

3. CREATE LESSON CONTENT
   ↓
   Method 1: Save JSON to use in API
   Method 2: Embed in HTML template
   Method 3: Use React component with data

4. TEACH THE LESSON
   ↓
   Students see wordConstructors in template
   They identify morphemes
   They learn word structure through morpheme analysis

5. TRACK RESULTS
   ↓
   Record which morphemes students understand
   Identify problem areas
   Adjust future lessons based on mastery

EXAMPLE FILES CREATED:
- /utilities/data-mgmt/generators/word-constructor/page.js (Generator UI)
- /api/utilities/word-constructor/generate/route.js (Generator API)
- /data/sample-words-for-constructor.csv (Sample input)
- WORD_CONSTRUCTOR_GUIDE.md (Full documentation)
- WORD_CONSTRUCTOR_QUICK_START.md (Quick start)
*/
