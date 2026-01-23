'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Container,
  Paper,
  Button,
  Grid,
} from '@mui/material';

export default function MorphMatchPage() {
  const [selections, setSelections] = useState({});

  const focusWords = [
    'dict',
    'diction',
    'predict',
    'edict',
    'verdict',
    'indict',
  ];

  const relatedWords = [
    'dictate',
    'diction',
    'prediction',
    'edicts',
    'verdicts',
    'indictment',
  ];

  const handleSelection = (focusWord, relatedWord) => {
    setSelections({
      ...selections,
      [focusWord]: relatedWord,
    });
  };

  const handleSubmit = () => {
    console.log('Match selections:', selections);
    alert('Matches submitted! Check the console for details.');
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
              MORPH MATCH
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
                <strong>Instructions:</strong> Match the "focus" word to its
                "related" word.
              </Typography>
            </Paper>

            {/* Matching Grid */}
            <Grid container spacing={4} sx={{ mb: 4 }}>
              {/* Focus Words Column */}
              <Grid item xs={12} sm={5}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 'bold', mb: 2 }}
                >
                  Focus Word
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
                        borderLeft:
                          selections[word] === word
                            ? '4px solid #1976d2'
                            : '4px solid transparent',
                      }}
                    >
                      <Typography variant="body2">{word}</Typography>
                    </Paper>
                  ))}
                </Box>
              </Grid>

              {/* Connector/Spacer */}
              <Grid item xs={12} sm={2}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                  }}
                >
                  <Typography variant="body2" sx={{ color: '#999' }}>
                    →
                  </Typography>
                </Box>
              </Grid>

              {/* Related Words Column */}
              <Grid item xs={12} sm={5}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 'bold', mb: 2 }}
                >
                  Related Word
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
                      onClick={() =>
                        handleSelection(focusWords[idx], word)
                      }
                    >
                      <Typography variant="body2">{word}</Typography>
                    </Paper>
                  ))}
                </Box>
              </Grid>
            </Grid>

            {/* Selected Matches Display */}
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
                Your Matches:
              </Typography>
              {Object.entries(selections).length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {Object.entries(selections).map(([focus, related]) => (
                    <Typography key={focus} variant="body2">
                      {focus} → {related}
                    </Typography>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: '#999' }}>
                  No matches made yet
                </Typography>
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
                onClick={() => setSelections({})}
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
                <strong>Note:</strong> Match words that share the same morpheme
                or root.
              </Typography>
            </Paper>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}