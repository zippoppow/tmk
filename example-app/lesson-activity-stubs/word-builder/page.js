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
  Chip,
} from '@mui/material';

export default function WordBuilderPage() {
  const [builtWords, setBuiltWords] = useState([]);
  const [currentWord, setCurrentWord] = useState('');

  const prefixes = ['pre', 'un', 're', 'mis', 'con', 'dis'];
  const baseElements = ['dict', 'script', 'port', 'flex'];
  const suffixes = ['ed', 'ing', 'ion', 'able', 'tion', 'ity'];

  const handleAddWord = () => {
    if (currentWord.trim()) {
      setBuiltWords([...builtWords, currentWord]);
      setCurrentWord('');
    }
  };

  const handleRemoveWord = (index) => {
    setBuiltWords(builtWords.filter((_, idx) => idx !== index));
  };

  const handleSubmit = () => {
    console.log('Built words:', builtWords);
    alert(`You built ${builtWords.length} words! Check the console for details.`);
  };

  const handleClear = () => {
    setBuiltWords([]);
    setCurrentWord('');
  };

  return (
    <Box component="main" sx={{ py: 4, bgcolor: '#f9f9f9', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        <Card sx={{ boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
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
              WORD BUILDER
            </Typography>

            {/* Morpheme Info */}
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

            {/* Instructions */}
            <Paper
              sx={{
                p: 2,
                mb: 4,
                bgcolor: '#fff9e6',
                border: '1px solid #ffd966',
              }}
            >
              <Typography variant="body1">
                <strong>Instructions:</strong> Build as many words as you can
                from the following morphemes.
              </Typography>
            </Paper>

            {/* Morpheme Boxes */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Prefixes */}
              <Grid item xs={12}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 'bold', mb: 1 }}
                >
                  PREFIXES
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {prefixes.map((prefix, idx) => (
                    <Chip
                      key={idx}
                      label={prefix}
                      sx={{
                        bgcolor: '#fff3e0',
                        border: '2px solid #ff9800',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </Box>
              </Grid>

              {/* Base Elements */}
              <Grid item xs={12}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 'bold', mb: 1 }}
                >
                  BASE ELEMENT
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {baseElements.map((base, idx) => (
                    <Chip
                      key={idx}
                      label={base}
                      sx={{
                        bgcolor: '#e3f2fd',
                        border: '2px solid #2196f3',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </Box>
              </Grid>

              {/* Suffixes */}
              <Grid item xs={12}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 'bold', mb: 1 }}
                >
                  SUFFIXES
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {suffixes.map((suffix, idx) => (
                    <Chip
                      key={idx}
                      label={suffix}
                      sx={{
                        bgcolor: '#f3e5f5',
                        border: '2px solid #9c27b0',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>

            {/* Input and Action */}
            <Paper
              sx={{
                p: 3,
                mb: 4,
                bgcolor: '#f5f5f5',
                border: '1px solid #ddd',
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 'bold', mb: 2 }}
              >
                Build Your Words:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  placeholder="Type a word you can build..."
                  value={currentWord}
                  onChange={(e) => setCurrentWord(e.target.value)}
                  variant="outlined"
                  size="small"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddWord();
                    }
                  }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAddWord}
                  sx={{ minWidth: '120px' }}
                >
                  Add Word
                </Button>
              </Box>

              {/* Built Words Display */}
              {builtWords.length > 0 && (
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ mb: 1, color: '#666' }}
                  >
                    Words built: {builtWords.length}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {builtWords.map((word, idx) => (
                      <Chip
                        key={idx}
                        label={word}
                        onDelete={() => handleRemoveWord(idx)}
                        sx={{
                          bgcolor: '#c8e6c9',
                          border: '1px solid #81c784',
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>

            {/* Action Buttons */}
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

            {/* Footer Note */}
            <Paper
              sx={{
                p: 2,
                mt: 4,
                bgcolor: '#e8f5e9',
                border: '1px solid #81c784',
              }}
            >
              <Typography variant="body2">
                <strong>Note:</strong> Combine the morpheme parts in different
                ways to create new words.
              </Typography>
            </Paper>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}