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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Grid,
} from '@mui/material';

export default function CommonBaseWordPage() {
  // Sample data - words to be sorted into columns based on shared base word
  const [words] = useState([
    'dict',
    'dictate',
    'diction',
    'predict',
    'predicts',
    'prediction',
    'dict',
    'indict',
    'indictment',
    'diction',
    'dictionary',
    'edict',
    'verdict',
  ]);

  const [userAnswers, setUserAnswers] = useState({
    column1: '',
    column2: '',
    column3: '',
  });

  const handleInputChange = (column, value) => {
    setUserAnswers({
      ...userAnswers,
      [column]: value,
    });
  };

  const handleSubmit = () => {
    console.log('Submitted answers:', userAnswers);
    alert('Answers submitted! Check the console for details.');
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
              COMMON BASE WORD
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
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Instructions:</strong> Sort the words into three different columns based on a shared base word.
              </Typography>
            </Paper>

            {/* Word List Display */}
            <Paper
              sx={{
                p: 3,
                mb: 4,
                bgcolor: '#f5f5f5',
                border: '1px solid #ddd',
              }}
            >
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                Words to Sort:
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                {words.map((word, index) => (
                  <Paper
                    key={index}
                    sx={{
                      p: 1.5,
                      bgcolor: '#e3f2fd',
                      border: '1px solid #90caf9',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2">{word}</Typography>
                  </Paper>
                ))}
              </Box>
            </Paper>

            {/* Sorting Table */}
            <TableContainer component={Paper} sx={{ mb: 4 }}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ bgcolor: '#e3f2fd' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', width: '33.33%' }}>
                      Base Word 1
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: '33.33%' }}>
                      Base Word 2
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: '33.33%' }}>
                      Base Word 3
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <TextField
                        multiline
                        rows={6}
                        fullWidth
                        placeholder="Enter words with this base word..."
                        value={userAnswers.column1}
                        onChange={(e) =>
                          handleInputChange('column1', e.target.value)
                        }
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        multiline
                        rows={6}
                        fullWidth
                        placeholder="Enter words with this base word..."
                        value={userAnswers.column2}
                        onChange={(e) =>
                          handleInputChange('column2', e.target.value)
                        }
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        multiline
                        rows={6}
                        fullWidth
                        placeholder="Enter words with this base word..."
                        value={userAnswers.column3}
                        onChange={(e) =>
                          handleInputChange('column3', e.target.value)
                        }
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

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
                onClick={() =>
                  setUserAnswers({
                    column1: '',
                    column2: '',
                    column3: '',
                  })
                }
              >
                Clear
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
                <strong>Note:</strong> Review your sorting to ensure words share
                the same base word (root).
              </Typography>
            </Paper>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}