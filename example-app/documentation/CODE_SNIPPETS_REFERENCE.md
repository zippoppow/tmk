# Code Snippets for Quick Implementation

## Standard Page Shell (Copy & Customize)

### Basic Activity Template
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
} from '@mui/material';

export default function ActivityNamePage() {
  const [answers, setAnswers] = useState({
    // Initialize your state here
  });

  const handleSubmit = () => {
    console.log('Activity answers:', answers);
    alert('Submitted! Check console for details.');
  };

  const handleClear = () => {
    setAnswers({
      // Reset state
    });
  };

  return (
    <Box component="main" sx={{ py: 4, bgcolor: '#f9f9f9', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        <Card sx={{ boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
            {/* HEADER */}
            <Typography
              variant="h4"
              component="h1"
              sx={{
                textAlign: 'center',
                fontWeight: 'bold',
                mb: 1,
                textTransform: 'uppercase',
              }}
            >
              LATIN PROGRESSION
            </Typography>

            <Typography
              variant="h5"
              component="h2"
              sx={{
                textAlign: 'center',
                fontWeight: 'bold',
                mb: 3,
                textTransform: 'uppercase',
              }}
            >
              ACTIVITY NAME HERE
            </Typography>

            {/* MORPHEME INFO */}
            <Paper
              sx={{
                p: 2,
                mb: 3,
                bgcolor: '#f0f8ff',
                border: '1px solid #ccc',
              }}
            >
              <Typography variant="body2">
                <strong>Morpheme(s):</strong> [morpheme to be inserted]
              </Typography>
            </Paper>

            {/* INSTRUCTIONS */}
            <Paper
              sx={{
                p: 2,
                mb: 4,
                bgcolor: '#fff9e6',
                border: '1px solid #ffd966',
              }}
            >
              <Typography variant="body1">
                <strong>Instructions:</strong> Activity-specific instructions here.
              </Typography>
            </Paper>

            {/* MAIN CONTENT AREA */}
            <Paper
              sx={{
                p: 3,
                mb: 4,
                bgcolor: '#f5f5f5',
                border: '1px solid #ddd',
              }}
            >
              {/* Put your activity content here */}
            </Paper>

            {/* BUTTONS */}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleSubmit}
              >
                Submit
              </Button>
              <Button
                variant="outlined"
                color="primary"
                size="large"
                onClick={handleClear}
              >
                Clear All
              </Button>
            </Box>

            {/* FOOTER NOTE */}
            <Paper
              sx={{
                p: 2,
                mt: 4,
                bgcolor: '#e8f5e9',
                border: '1px solid #81c784',
              }}
            >
              <Typography variant="body2">
                <strong>Note:</strong> Important information about the activity.
              </Typography>
            </Paper>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
```

---

## Common Content Components

### Simple Text Input
```javascript
<TextField
  fullWidth
  placeholder="Enter text here..."
  value={answers.fieldName}
  onChange={(e) =>
    setAnswers({ ...answers, fieldName: e.target.value })
  }
  variant="outlined"
  size="small"
/>
```

### Multiline Text Input
```javascript
<TextField
  fullWidth
  multiline
  rows={4}
  placeholder="Enter text here..."
  value={answers.fieldName}
  onChange={(e) =>
    setAnswers({ ...answers, fieldName: e.target.value })
  }
  variant="outlined"
  size="small"
/>
```

### Word/Item Display Chip
```javascript
<Chip
  label="word"
  sx={{
    bgcolor: '#e3f2fd',
    border: '1px solid #90caf9',
  }}
/>
```

### Clickable Word Card
```javascript
<Paper
  sx={{
    p: 2,
    bgcolor: '#e3f2fd',
    border: '1px solid #90caf9',
    cursor: 'pointer',
    transition: 'all 0.3s',
    '&:hover': { bgcolor: '#bbdefb' },
  }}
  onClick={() => handleWordClick('word')}
>
  <Typography variant="body2">word</Typography>
</Paper>
```

### Color-Coded Morpheme Parts
```javascript
// Prefix (Orange)
<Paper
  sx={{
    p: 1.5,
    textAlign: 'center',
    bgcolor: '#fff3e0',
    border: '2px solid #ff9800',
  }}
>
  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
    prefix
  </Typography>
</Paper>

// Base (Blue)
<Paper
  sx={{
    p: 1.5,
    textAlign: 'center',
    bgcolor: '#e3f2fd',
    border: '2px solid #2196f3',
  }}
>
  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
    base
  </Typography>
</Paper>

// Suffix (Purple)
<Paper
  sx={{
    p: 1.5,
    textAlign: 'center',
    bgcolor: '#f3e5f5',
    border: '2px solid #9c27b0',
  }}
>
  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
    suffix
  </Typography>
</Paper>
```

---

## Specific Activity Snippets

### Matching Layout (2-Column)
```javascript
<Grid container spacing={4}>
  {/* Left Column */}
  <Grid item xs={12} sm={5}>
    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
      Focus Words
    </Typography>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {focusWords.map((word, idx) => (
        <Paper
          key={idx}
          sx={{
            p: 2,
            bgcolor: '#e3f2fd',
            border: '1px solid #90caf9',
            cursor: 'pointer',
            transition: 'all 0.3s',
            '&:hover': { bgcolor: '#bbdefb' },
          }}
          onClick={() => handleSelection(word)}
        >
          <Typography variant="body2">{word}</Typography>
        </Paper>
      ))}
    </Box>
  </Grid>

  {/* Connector */}
  <Grid item xs={12} sm={2}>
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <Typography variant="body2" sx={{ color: '#999' }}>→</Typography>
    </Box>
  </Grid>

  {/* Right Column */}
  <Grid item xs={12} sm={5}>
    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
      Related Words
    </Typography>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {relatedWords.map((word, idx) => (
        <Paper
          key={idx}
          sx={{
            p: 2,
            bgcolor: '#f3e5f5',
            border: '1px solid #ce93d8',
            cursor: 'pointer',
            transition: 'all 0.3s',
            '&:hover': { bgcolor: '#ede7f6' },
          }}
          onClick={() => handleMatch(word)}
        >
          <Typography variant="body2">{word}</Typography>
        </Paper>
      ))}
    </Box>
  </Grid>
</Grid>
```

### Morpheme Parts Grid (Constructor Style)
```javascript
{wordParts.map((parts, idx) => (
  <Box
    key={idx}
    sx={{
      mb: 3,
      p: 2,
      bgcolor: '#f5f5f5',
      border: '1px solid #ddd',
      borderRadius: 1,
    }}
  >
    <Grid container spacing={2} alignItems="flex-end">
      {/* Prefix */}
      <Grid item xs={3} sm={2}>
        <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#fff3e0', border: '2px solid #ff9800' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {parts.prefix || '—'}
          </Typography>
        </Paper>
      </Grid>

      {/* Base */}
      <Grid item xs={3} sm={2}>
        <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#e3f2fd', border: '2px solid #2196f3' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {parts.base}
          </Typography>
        </Paper>
      </Grid>

      {/* Suffix */}
      <Grid item xs={3} sm={2}>
        <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f3e5f5', border: '2px solid #9c27b0' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {parts.suffix || '—'}
          </Typography>
        </Paper>
      </Grid>

      {/* Equals */}
      <Grid item xs={1} sx={{ textAlign: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>=</Typography>
      </Grid>

      {/* Answer */}
      <Grid item xs={10} sm={4}>
        <TextField
          fullWidth
          placeholder="Type the word..."
          value={answers[idx]}
          onChange={(e) => handleInputChange(idx, e.target.value)}
          variant="outlined"
          size="small"
          sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#ffffff' } }}
        />
      </Grid>
    </Grid>
  </Box>
))}
```

### Three-Column Sorting Table
```javascript
<TableContainer component={Paper} sx={{ mb: 4 }}>
  <Table sx={{ minWidth: 650 }}>
    <TableHead sx={{ bgcolor: '#e3f2fd' }}>
      <TableRow>
        <TableCell sx={{ fontWeight: 'bold', width: '33.33%' }}>Column 1</TableCell>
        <TableCell sx={{ fontWeight: 'bold', width: '33.33%' }}>Column 2</TableCell>
        <TableCell sx={{ fontWeight: 'bold', width: '33.33%' }}>Column 3</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      <TableRow>
        <TableCell>
          <TextField
            multiline
            rows={6}
            fullWidth
            placeholder="Enter items..."
            value={answers.column1}
            onChange={(e) => setAnswers({ ...answers, column1: e.target.value })}
            variant="outlined"
            size="small"
          />
        </TableCell>
        <TableCell>
          <TextField
            multiline
            rows={6}
            fullWidth
            placeholder="Enter items..."
            value={answers.column2}
            onChange={(e) => setAnswers({ ...answers, column2: e.target.value })}
            variant="outlined"
            size="small"
          />
        </TableCell>
        <TableCell>
          <TextField
            multiline
            rows={6}
            fullWidth
            placeholder="Enter items..."
            value={answers.column3}
            onChange={(e) => setAnswers({ ...answers, column3: e.target.value })}
            variant="outlined"
            size="small"
          />
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</TableContainer>
```

### Word Bank Display
```javascript
<Paper
  sx={{
    p: 3,
    mb: 4,
    bgcolor: '#f5f5f5',
    border: '1px solid #ddd',
  }}
>
  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
    Word Bank:
  </Typography>
  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
    {wordBank.map((word, idx) => (
      <Chip
        key={idx}
        label={word}
        sx={{
          bgcolor: '#e3f2fd',
          border: '1px solid #90caf9',
          cursor: 'pointer',
        }}
      />
    ))}
  </Box>
</Paper>
```

### Sentence-Filling Pattern
```javascript
{sentences.map((sentence, idx) => (
  <Box key={sentence.id} sx={{ mb: 3 }}>
    <Typography variant="body1" sx={{ mb: 1 }}>
      <strong>{idx + 1}.</strong> {sentence.text}
    </Typography>
    <TextField
      fullWidth
      placeholder="Type the correct word..."
      value={answers[sentence.id]}
      onChange={(e) =>
        setAnswers({ ...answers, [sentence.id]: e.target.value })
      }
      variant="outlined"
      size="small"
      sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#f9f9f9' } }}
    />
  </Box>
))}
```

### Results/Tracking Display
```javascript
<Paper
  sx={{
    p: 3,
    mb: 4,
    bgcolor: '#f5f5f5',
    border: '1px solid #ddd',
  }}
>
  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
    Your Selections:
  </Typography>
  {Object.entries(selections).length > 0 ? (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {Object.entries(selections).map(([key, value]) => (
        <Typography key={key} variant="body2">
          {key} → {value}
        </Typography>
      ))}
    </Box>
  ) : (
    <Typography variant="body2" sx={{ color: '#999' }}>
      No selections made yet
    </Typography>
  )}
</Paper>
```

---

## State Management Patterns

### Form-Like State (Object)
```javascript
const [answers, setAnswers] = useState({
  field1: '',
  field2: '',
  field3: '',
});

const handleChange = (field, value) => {
  setAnswers({ ...answers, [field]: value });
};
```

### List-Like State (Array)
```javascript
const [answers, setAnswers] = useState(Array(10).fill(''));

const handleChange = (index, value) => {
  const newAnswers = [...answers];
  newAnswers[index] = value;
  setAnswers(newAnswers);
};
```

### Selection State (Object)
```javascript
const [selections, setSelections] = useState({});

const handleSelection = (key, value) => {
  setSelections({
    ...selections,
    [key]: value,
  });
};
```

### Multi-Value State (Array of Objects)
```javascript
const [items, setItems] = useState([
  { id: 1, value: '' },
  { id: 2, value: '' },
]);

const handleItemChange = (id, value) => {
  setItems(items.map(item =>
    item.id === id ? { ...item, value } : item
  ));
};
```

---

## Common Handler Patterns

### Submit Handler
```javascript
const handleSubmit = () => {
  console.log('Activity answers:', answers);
  // Future: Validation, API call, scoring, etc.
  alert('Submitted! Check console for details.');
};
```

### Clear Handler (Object)
```javascript
const handleClear = () => {
  setAnswers({
    field1: '',
    field2: '',
    field3: '',
  });
};
```

### Clear Handler (Array)
```javascript
const handleClear = () => {
  setAnswers(Array(10).fill(''));
};
```

### Toggle Selection Handler
```javascript
const handleToggle = (item) => {
  setSelections({
    ...selections,
    [item]: !selections[item],
  });
};
```

### Add/Remove Item Handler
```javascript
const handleAddItem = (item) => {
  if (item.trim()) {
    setItems([...items, item]);
  }
};

const handleRemoveItem = (index) => {
  setItems(items.filter((_, idx) => idx !== index));
};
```

---

## Styling Shortcuts

### Card Container
```javascript
sx={{
  boxShadow: 3,
}}
```

### Paper Container
```javascript
sx={{
  p: 2,
  mb: 3,
  bgcolor: '#f0f8ff',
  border: '1px solid #ccc',
}}
```

### Button Layout
```javascript
sx={{
  display: 'flex',
  gap: 2,
  justifyContent: 'center',
  flexWrap: 'wrap',
}}
```

### Responsive Text
```javascript
sx={{
  textAlign: 'center',
  fontWeight: 'bold',
  mb: 2,
  textTransform: 'uppercase',
}}
```

### Flex Column Layout
```javascript
sx={{
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
}}
```

### Flex Row Layout with Wrap
```javascript
sx={{
  display: 'flex',
  flexWrap: 'wrap',
  gap: 1,
}}
```

---

## Quick Copy-Paste Sections

### Import Block
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
```

### Page Wrapper
```javascript
<Box component="main" sx={{ py: 4, bgcolor: '#f9f9f9', minHeight: '100vh' }}>
  <Container maxWidth="lg">
    <Card sx={{ boxShadow: 3 }}>
      <CardContent sx={{ p: 4 }}>
        {/* Content goes here */}
      </CardContent>
    </Card>
  </Container>
</Box>
```

### Header Pair
```javascript
<Typography variant="h4" component="h1" sx={{ textAlign: 'center', fontWeight: 'bold', mb: 1, textTransform: 'uppercase' }}>
  LATIN PROGRESSION
</Typography>

<Typography variant="h5" component="h2" sx={{ textAlign: 'center', fontWeight: 'bold', mb: 3, textTransform: 'uppercase' }}>
  ACTIVITY NAME
</Typography>
```

### Button Pair
```javascript
<Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
  <Button variant="contained" color="primary" size="large" onClick={handleSubmit}>
    Submit
  </Button>
  <Button variant="outlined" color="primary" size="large" onClick={handleClear}>
    Clear All
  </Button>
</Box>
```

---

This should provide everything needed for quick implementation of remaining activities!
