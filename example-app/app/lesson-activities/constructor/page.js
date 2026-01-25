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

export default function ConstructorPage() {
  const [answers, setAnswers] = useState(
    Array(12).fill('') // 12 items based on XML structure
  );

  const wordParts = [
    { prefix: 'pre', base: 'dict', suffix: 'ed' },
    { prefix: 'un', base: 'dict', suffix: 'able' },
    { prefix: 're', base: 'dict', suffix: 'ion' },
    { prefix: 'mis', base: 'dict', suffix: 'ate' },
    { prefix: 'con', base: 'dict', suffix: '' },
    { prefix: '', base: 'dict', suffix: 'or' },
  ];

  const handleInputChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    console.log('Constructor answers:', answers);
    alert('Answers submitted! Check the console for details.');
  };

  const handleClear = () => {
    setAnswers(Array(12).fill(''));
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
              CONSTRUCTOR
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
                <strong>Morpheme(s):</strong> dict (to say)
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
                <strong>Instructions:</strong> Create words from the word parts
                by combining the prefix, base element, and suffix.
              </Typography>
            </Paper>

            {/* Word Construction Grid */}
            <Box sx={{ mb: 4 }}>
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
                      <Paper
                        sx={{
                          p: 1.5,
                          textAlign: 'center',
                          bgcolor: '#fff3e0',
                          border: '2px solid #ff9800',
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {parts.prefix || '—'}
                        </Typography>
                      </Paper>
                    </Grid>

                    {/* Base */}
                    <Grid item xs={3} sm={2}>
                      <Paper
                        sx={{
                          p: 1.5,
                          textAlign: 'center',
                          bgcolor: '#e3f2fd',
                          border: '2px solid #2196f3',
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {parts.base}
                        </Typography>
                      </Paper>
                    </Grid>

                    {/* Suffix */}
                    <Grid item xs={3} sm={2}>
                      <Paper
                        sx={{
                          p: 1.5,
                          textAlign: 'center',
                          bgcolor: '#f3e5f5',
                          border: '2px solid #9c27b0',
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {parts.suffix || '—'}
                        </Typography>
                      </Paper>
                    </Grid>

                    {/* Equals */}
                    <Grid item xs={1} sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        =
                      </Typography>
                    </Grid>

                    {/* Answer Input */}
                    <Grid item xs={10} sm={4}>
                      <TextField
                        fullWidth
                        placeholder="Type the word..."
                        value={answers[idx]}
                        onChange={(e) => handleInputChange(idx, e.target.value)}
                        variant="outlined"
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#ffffff',
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Box>

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
                <strong>Note:</strong> Each morpheme part contributes to the
                meaning of the final word.
              </Typography>
            </Paper>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}