'use client';

import {
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
  Container,
  Paper,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useState, useEffect } from 'react';

const theme = createTheme();

export default function FillInTheMorphSentencesPage() {
  const [lessonData, setLessonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [morpheme, setMorpheme] = useState('');
  const [answers, setAnswers] = useState(Array(10).fill(''));

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/lessons/fill-in-the-morph-an');
        if (!response.ok) {
          throw new Error('Failed to load lesson data');
        }
        const data = await response.json();
        setLessonData(data);
        setMorpheme(data.Morpheme || '');
        setAnswers(Array(data.Sentences?.length || 10).fill(''));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, []);

  const handleAnswerChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          component="main"
          sx={{
            py: 4,
            bgcolor: '#f8f8f8',
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  if (error || !lessonData) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box component="main" sx={{ py: 4, bgcolor: '#f8f8f8', minHeight: '100vh' }}>
          <Container maxWidth="lg">
            <Alert severity="error">
              {error || 'Failed to load lesson data'}
            </Alert>
          </Container>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box component="main" sx={{ py: 4, bgcolor: '#f8f8f8', minHeight: '100vh' }}>
        <Container maxWidth="lg">
          <Card sx={{ boxShadow: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  textAlign: 'center',
                  color: '#333',
                  fontWeight: 'bold',
                  mb: 3,
                  textTransform: 'uppercase',
                  fontSize: '2.5rem',
                }}
              >
                {lessonData.LessonTitle || 'LATIN PROGRESSION'}
              </Typography>

              {/* Morpheme Input */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Morpheme(s):</strong>
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Enter morpheme(s)"
                  value={morpheme}
                  onChange={(e) => setMorpheme(e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Box>

              {/* Instructions */}
              <Paper
                sx={{
                  p: 2,
                  mb: 3,
                  bgcolor: '#e0e0e0',
                  border: '1px solid #ccc',
                  borderRadius: '5px',
                }}
              >
                <Typography variant="body1">
                  {lessonData.Instructions}
                </Typography>
              </Paper>

              {/* Two-Column Layout: Word Bank and Fill in the Blanks */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 3,
                  justifyContent: 'space-between',
                  '@media (max-width: 768px)': {
                    flexDirection: 'column',
                  },
                }}
              >
                {/* Word Bank */}
                <Box
                  sx={{
                    flex: 1,
                    bgcolor: '#fff',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    p: 2,
                    height: 'fit-content',
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ mb: 2, fontWeight: 'bold' }}
                  >
                    Word Bank
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                    }}
                  >
                    {lessonData.WordBank?.map((word, index) => (
                      <Typography
                        key={index}
                        sx={{
                          p: 1,
                          bgcolor: '#f9f9f9',
                          border: '1px solid #e0e0e0',
                          borderRadius: '3px',
                          fontFamily: 'monospace',
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: '#f0f0f0',
                          },
                        }}
                      >
                        {word}
                      </Typography>
                    ))}
                  </Box>
                </Box>

                {/* Fill in the Blanks */}
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 'bold', mb: 1 }}
                  >
                    Fill in the Blanks
                  </Typography>
                  {lessonData.Sentences?.map((sentence, i) => (
                    <Box
                      key={i}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 2,
                        bgcolor: i % 2 === 0 ? '#f9f9f9' : '#e0f7fa',
                        p: 1.5,
                        border: '1px solid #ccc',
                        borderRadius: '5px',
                      }}
                    >
                      <Typography sx={{ minWidth: '30px', fontWeight: 'bold', pt: 1 }}>
                        {i + 1}.
                      </Typography>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {sentence}
                        </Typography>
                        <TextField
                          fullWidth
                          placeholder="Enter answer"
                          value={answers[i]}
                          onChange={(e) => handleAnswerChange(i, e.target.value)}
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Submit Button */}
              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  sx={{
                    textTransform: 'none',
                    fontSize: '1rem',
                    px: 4,
                  }}
                >
                  Submit Exercise
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </ThemeProvider>
  );
}