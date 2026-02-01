# Activity Implementation Patterns - Template Guide

## Overview
This guide provides templates and patterns for implementing the remaining TMK activity pages based on the structure from the XML source and the patterns established in the updated pages.

---

## Pattern 1: SORTING/CATEGORIZATION Activities

**Pages to implement with this pattern:**
- part-of-speech-sort
- parts-of-speech
- morph-sort

### Activity Structure
```jsx
// 2-4 columns/categories
// Words or items to categorize
// Drag-and-drop OR text input per category
```

### Template Code Structure
```javascript
const [categories, setCategories] = useState({
  category1: '',
  category2: '',
  category3: '',
  category4: '', // optional
});

const itemsToSort = [/* array of words */];

// Display items as clickable/draggable chips
// Input areas below or beside each category
```

### XML Reference
- **PART OF SPEECH SORT** (LinkTarget_3587)
  - 4 categories: Noun, Verb, Adjective, Adverb
  - Match words to part of speech
  - Fill in correct form of word

- **MORPH SORT** (LinkTarget_3654)
  - 2 columns based on related meanings
  - Find word families

---

## Pattern 2: MATCHING Activities (Word → Definition)

**Pages to implement with this pattern:**
- word-meaning
- morph-match-definitions

### Activity Structure
```jsx
// Left column: Words/terms
// Right column: Definitions/meanings
// Match one-to-one or one-to-many
```

### Key Differences from Current morph-match
- Uses **definitions/meanings** instead of related words
- Likely uses **lines/connections** or **numbered list** format
- May have more items (10-12 items)

### XML Reference
- **WORD MEANING** (LinkTarget_2094)
  - Morpheme → "is the state or act of" → definition pairs
  - Visual formula structure
  - 8+ example pairs

- **MORPH MATCH -- definitions** (LinkTarget_3272)
  - 12 morphology words to match with definitions
  - Numbered items

---

## Pattern 3: FILL-IN/BLANK Activities (Paragraph version)

**Pages to implement with this pattern:**
- fill-in-the-morph--paragraph

### Differences from Sentences Version
```javascript
// Instead of individual sentences (1-10 lines)
// Single or multiple paragraphs with blanks
// Longer reading passage context
// Same word bank concept
```

### Template Approach
```javascript
// Read paragraph text and extract blank locations
// Create TextField for each blank
// Display word bank at top
// Optional: Show paragraph context around each blank
```

---

## Pattern 4: CONSTRUCTION/DECONSTRUCTION Activities

**Pages to implement with this pattern:**
- constructor-deconstructor (combined view with two sections)
- constructor-2

### Dual-Section Layout (constructor-deconstructor)
```jsx
{/* CONSTRUCTOR section */}
<Paper>Create words from parts</Paper>

{/* DECONSTRUCTOR section */}
<Paper>Break words into parts</Paper>
```

### XML Reference (LinkTarget_1612)
- **CONSTRUCTOR**: Create words from [prefix] + [base] + [suffix]
- **DECONSTRUCTOR**: Break existing words into their parts
- Each has separate input areas and instructions

---

## Pattern 5: BUILD/CREATE Activities

**Pages to implement with this pattern:**
- word-builder (ALREADY DONE - reference implementation)
- suffix-completer
- suffix-transformer

### Key Features
- Free-form word building
- Multiple morpheme types to combine
- Track created words
- Display valid/invalid options

### Variants
- **SUFFIX COMPLETER** (LinkTarget_2334): Add one of two suffixes to words
- **SUFFIX TRANSFORMER** (LinkTarget_2415): Add suffix to verbs to turn into nouns

---

## Pattern 6: UNSCRAMBLE Activities

**Pages to implement with this pattern:**
- unscramble

### Activity Structure
```jsx
// Item 1-5 with scrambled letters
// Display: [ q ] [ u ] [ e ] [ s ] [ t ]
// User reorders to create correct word
// Input field for answer
```

### Implementation Options
1. **Drag-and-drop** letter tiles (requires draggable library)
2. **Text input** with hint showing available letters
3. **Inline letter buttons** user clicks in order

### XML Reference (LinkTarget_4292)
- 5 unscramble items
- Likely word-scramble with word parts

---

## Pattern 7: PRONUNCIATION/VARIANT Activities

**Pages to implement with this pattern:**
- how-do-you-say

### Activity Structure
```jsx
// Morpheme pronunciation varies
// Show 4-5 pronunciation variants
// Questions like: "Which word means..."
// Multiple choice or matching
```

### XML Reference (LinkTarget_2189)
- "The pronunciation of the [[morph type]], [[morph]], varies"
- 5 meaning-based questions
- Multiple word options per question

---

## Pattern 8: CHAINING Activities (Spoken/Spelling)

**Pages to implement with this pattern:**
- spoken-chaining
- spoken-chaining--instructor-only
- spelling-chaining
- spelling-chaining--instructor-only

### Characteristics
- **SPOKEN**: Visual display of morpheme combinations spoken aloud
- **SPELLING**: Students spell words as morphemes are called out
- **INSTRUCTOR**: Shows answers/guidance for teacher use

### XML Reference
- **SPOKEN CHAINING** (LinkTarget_4400):
  - Displays: PREFIXES | BASE ELEMENT | SUFFIXES
  - Step-by-step word building shown
  - Instructor view shows example flow

- **SPELLING CHAINING** (LinkTarget_4535):
  - Students write words while instructor calls them
  - Instructor view shows: "Write...", "Change to...", etc.

### Implementation Approach
```javascript
// Instructor & Student views
// Display morpheme manipulation steps
// Show/hide answers based on view type
// Visual representation of chaining process
```

---

## Pattern 9: REVIEW/ASSESSMENT Activities

**Pages to implement with this pattern:**
- review (general)
- spelling-review

### Activity Structure
```jsx
// List of morphemes to review
// SAY AND SPELL format
// Visual display of target words
// Multiple steps (say it, spell it, think of related words)
```

### XML Reference (LinkTarget_1254)
- SPELLING REVIEW: Say and Spell format
- 4 items with images
- Step-by-step guidance

---

## Pattern 10: CONSTRUCT AND MATCH Activities

**Pages to implement with this pattern:**
- construct-and-match

### Activity Structure
```jsx
// Construct words from parts (like constructor)
// Then match constructed words to sentences
// Two-phase activity
// Visual explanation of suffix rule
```

### XML Reference (LinkTarget_3970)
- Instructions about suffix turning adjectives to adverbs
- Create words + match to sentences
- 10 sentence items

---

## Implementation Checklist for Each Activity

Use this checklist when implementing new activity pages:

### Structure
- [ ] Page title (LATIN PROGRESSION)
- [ ] Activity name (h2 style)
- [ ] Morpheme(s) info box
- [ ] Instructions paper
- [ ] Main activity content
- [ ] Submit/Clear buttons
- [ ] Footer note

### Functionality
- [ ] State management for answers
- [ ] Input handling
- [ ] Submit handler (logs to console)
- [ ] Clear handler
- [ ] Visual feedback on selections/inputs

### Responsiveness
- [ ] Mobile layout (stacked)
- [ ] Tablet layout (partial columns)
- [ ] Desktop layout (full width columns)
- [ ] Use Grid component appropriately

### Styling
- [ ] Information box: yellow background
- [ ] Morpheme boxes: color-coded
- [ ] Input areas: clear visual distinction
- [ ] Buttons: centered, with padding
- [ ] Footer note: green background

### Testing
- [ ] Fill form → Submit → Check console log
- [ ] Click Clear → Verify all inputs reset
- [ ] Test on different screen sizes
- [ ] Test keyboard shortcuts (Enter key)

---

## Color Scheme Reference

```javascript
// Component styling colors
const colors = {
  instructionBox: '#fff9e6',      // Yellow
  instructionBorder: '#ffd966',   // Yellow-gold
  infoBox: '#f0f8ff',             // Light blue
  infoBorder: '#ccc',             // Gray
  noteBox: '#e8f5e9',             // Light green
  noteBorder: '#81c784',          // Green
  prefix: '#fff3e0',              // Orange
  prefixBorder: '#ff9800',        // Orange
  base: '#e3f2fd',                // Blue
  baseBorder: '#2196f3',          // Blue
  suffix: '#f3e5f5',              // Purple
  suffixBorder: '#9c27b0',        // Purple
  background: '#f5f5f5',          // Light gray
  surface: '#ffffff',             // White
};
```

---

## Common Imports Pattern

```javascript
'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
  Container,
  Paper,
  Button,
  Grid,
  // Add as needed:
  // Table, TableHead, TableBody, TableCell, TableContainer,
  // Chip, Radio, RadioGroup, FormControlLabel,
  // Select, MenuItem, Checkbox, FormGroup,
  // Dialog, DialogTitle, DialogContent, DialogActions,
  // Stepper, Step, StepLabel,
  // Tabs, Tab,
  // etc.
} from '@mui/material';

export default function ActivityPage() {
  // [implementation]
}
```

---

## Notes for Implementation

1. **Data Structure**: Keep state simple. Use objects for form-like activities, arrays for lists.

2. **Accessibility**: Ensure all inputs have proper labels via Typography components above them.

3. **Error Handling**: Log errors to console in development; could add validation in future.

4. **Performance**: Current implementations should handle 10-50 items without issues.

5. **Future Enhancement**: 
   - Add drag-and-drop libraries for matching/sorting
   - Add image display (currently placeholder in XML)
   - Add sound/pronunciation (if multimedia content added)
   - Add answer validation and scoring

6. **Morpheme Content**: Replace `[morpheme to be inserted]` with actual data from API or props

7. **Word Banks**: Can be imported from a centralized data file or API endpoint

---

## Quick Reference: Activity Name → Implementation Pattern

| Activity Page | Pattern Type | Complexity |
|---|---|---|
| common-base-word | Sorting/Table | ⭐⭐ |
| morph-match | Matching | ⭐⭐ |
| morph-match-2 | Matching | ⭐⭐ |
| morph-match--chameleons | Matching Variant | ⭐⭐ |
| morph-match-definitions | Matching (Definition) | ⭐⭐ |
| constructor | Construction | ⭐⭐ |
| constructor-2 | Construction Variant | ⭐⭐ |
| constructor-deconstructor | Dual-section | ⭐⭐⭐ |
| construct-and-match | Two-phase | ⭐⭐⭐ |
| word-builder | Freeform Build | ⭐⭐ |
| word-meaning | Matching (Definition) | ⭐⭐ |
| how-do-you-say | Multiple Choice | ⭐⭐ |
| fill-in-the-morph--sentences | Fill-in Blanks | ⭐⭐ |
| fill-in-the-morph--paragraph | Fill-in (Paragraph) | ⭐⭐ |
| morph-sort | Sorting (2 columns) | ⭐⭐ |
| part-of-speech-sort | Sorting (4 categories) | ⭐⭐ |
| parts-of-speech | Categorization | ⭐⭐ |
| unscramble | Rearrange/Unscramble | ⭐⭐ |
| suffix-completer | Build with Constraints | ⭐⭐ |
| suffix-transformer | Build with Constraints | ⭐⭐ |
| morph-spell | Spelling Exercise | ⭐⭐ |
| morph-which | Multiple Choice | ⭐⭐ |
| morph-morph-match | Matching | ⭐⭐ |
| morph-morph-match-2 | Matching | ⭐⭐ |
| morph-morph-match-3 | Matching | ⭐⭐ |
| spoken-chaining | Visual Display | ⭐⭐ |
| spoken-chaining--instructor-only | Instructor Guide | ⭐⭐ |
| spelling-chaining | Spelling Exercise | ⭐⭐ |
| spelling-chaining--instructor-only | Instructor Guide | ⭐⭐ |
| spelling-review | Review Format | ⭐⭐ |
| review | General Review | ⭐⭐ |
| primer-1 | Interactive Content | ⭐⭐ |
| primer-2 | Interactive Content | ⭐⭐ |
| latin-progression-primer--chameleon-roots | Specialized | ⭐⭐ |

---

## Additional Resources

- [XML Structure Reference](template-source/TMK® Latin Progression.xml)
- [PDF Design Guide](template-source/TMK® Latin Progression.pdf)
- [Pegasus Component Library](../index.d.ts)
- [Material-UI Documentation](https://mui.com/)
