'use client';

import { useState, useRef } from 'react';
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
import html2pdf from 'html2pdf.js';

export default function ConstructorPage() {
  const [wordParts] = useState([
    { prefix: 'pre-', base: 'dict', suffix: '-ed' },
    { prefix: 'pre-', base: 'dict', suffix: '-able' },
    { prefix: 'pre-', base: 'dict', suffix: '-ion' },
    { prefix: 'pre-', base: 'dict', suffix: '-or' },
    { prefix: 'contra-', base: 'dict', suffix: '-ion' },
    { prefix: 'ab-', base: 'dice', suffix: '-ate' },
  ]);
  const [constructors, setConstructors] = useState(
    Array(12).fill('')
  );
  const [answers, setAnswers] = useState(
    Array(12).fill('') // 12 items based on XML structure
  );
  const contentRef = useRef(null);


  const handleInputChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleConstructorChange = (index, value) => {
    const newConstructors = [...constructors];
    newConstructors[index] = value;
    setConstructors(newConstructors);
  };

  const generatePDF = () => {
    if (!contentRef.current) return;

    const element = contentRef.current;
    const opt = {
      margin: 10,
      filename: 'constructor-activity.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
    };

    html2pdf().set(opt).from(element).save();
  };

  const handleSubmit = () => {
    console.log('Constructor answers:', answers);
    generatePDF();
  };

  const handleClear = () => {
    setAnswers(Array(12).fill(''));
  };

  return (
    <Box component="main" sx={{ py: 4, bgcolor: '#f9f9f9', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        <Card sx={{ boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }} ref={contentRef}>
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
              {wordParts.map((parts, idx) => {
                const defaultConstructor = `${parts.prefix} + ${parts.base} + ${parts.suffix}`;
                return (
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
                      <Grid item xs={12} sm={5}>
                        <TextField
                          fullWidth
                          placeholder={defaultConstructor}
                          value={constructors[idx]}
                          onChange={(e) => handleConstructorChange(idx, e.target.value)}
                          variant="outlined"
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: '#e8f4f8',
                            },
                            '& .MuiOutlinedInput-input::placeholder': {
                              color: '#000000',
                              opacity: 1,
                            },
                          }}
                        />
                      </Grid>

                      {/* Equals */}
                      <Grid item xs={1} sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          =
                        </Typography>
                      </Grid>

                      {/* Answer Input */}
                      <Grid item xs={12} sm={5}>
                        <TextField
                          fullWidth
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
                );
              })}
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