'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import GetAppIcon from '@mui/icons-material/GetApp';

export default function WordConstructorGenerator() {
  const [csvFile, setCsvFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [words, setWords] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedWord, setSelectedWord] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  /**
   * Handle CSV file selection
   */
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setCsvFile(file);
    setError('');
    setSuccessMessage('');

    // Parse CSV to preview words
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        const lines = content.split('\n').filter((line) => line.trim());
        
        // Parse CSV - handle simple format with words in first column
        const parsedWords = lines
          .slice(1) // Skip header
          .map((line) => {
            const parts = line.split(',');
            return parts[0].trim();
          })
          .filter((word) => word.length > 0);

        setWords(parsedWords);
        setResults([]);
      } catch (err) {
        setError('Failed to parse CSV file. Please ensure it has words in the first column.');
        setWords([]);
      }
    };
    reader.readAsText(file);
  };

  /**
   * Generate wordConstructors for all words
   */
  const handleGenerateConstructors = async () => {
    if (words.length === 0) {
      setError('Please upload a CSV file with words first.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');
    setResults([]);

    try {
      const response = await fetch(
        '/api/utilities/word-constructor/generate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ words }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || 'Failed to generate wordConstructors'
        );
      }

      const data = await response.json();
      setResults(data.results || []);
      setSuccessMessage(
        `Successfully generated wordConstructors for ${data.results?.length || 0} words!`
      );
    } catch (err) {
      setError(err.message || 'An error occurred while generating wordConstructors.');
      console.error('Generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Export results as CSV
   */
  const handleExportResults = () => {
    if (results.length === 0) {
      setError('No results to export. Generate wordConstructors first.');
      return;
    }

    const headers = ['Word', 'WordConstructor', 'Morphemes'];
    const rows = results.map((result) => [
      result.word,
      result.wordConstructor || 'N/A',
      (result.morphemes || []).join(' + '),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${cell}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wordConstructors_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  /**
   * Show morpheme details
   */
  const handleShowDetails = (result) => {
    setSelectedWord(result);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedWord(null);
  };

  return (
    <Box sx={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <Typography variant="h1" sx={{ marginBottom: '2rem' }}>
        WordConstructor Generator
      </Typography>

      {/* Upload Section */}
      <Card sx={{ marginBottom: '2rem' }}>
        <CardContent>
          <Typography variant="h2" sx={{ marginBottom: '1rem', fontSize: '1.5rem' }}>
            Step 1: Upload Word List
          </Typography>
          <Typography variant="body2" sx={{ marginBottom: '1.5rem', color: 'text.secondary' }}>
            Upload a CSV file with words in the first column. Example format:
          </Typography>
          <Box
            sx={{
              backgroundColor: '#f5f5f5',
              padding: '1rem',
              borderRadius: '4px',
              marginBottom: '1.5rem',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
            }}
          >
            word<br />
            intercontinental<br />
            metropolitan<br />
            revolutionary<br />
          </Box>

          <Box sx={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="csv-input"
            />
            <label htmlFor="csv-input">
              <Button
                variant="contained"
                component="span"
                startIcon={<CloudUploadIcon />}
              >
                Select CSV File
              </Button>
            </label>
            {fileName && (
              <Typography variant="body2" sx={{ color: 'success.main' }}>
                ✓ {fileName} ({words.length} words)
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Generate Section */}
      <Card sx={{ marginBottom: '2rem' }}>
        <CardContent>
          <Typography variant="h2" sx={{ marginBottom: '1rem', fontSize: '1.5rem' }}>
            Step 2: Generate WordConstructors
          </Typography>
          <Typography variant="body2" sx={{ marginBottom: '1.5rem', color: 'text.secondary' }}>
            Click the button below to analyze each word and generate its wordConstructor using
            the TMK API morpheme database. This may take a moment depending on the number of
            words.
          </Typography>

          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerateConstructors}
            disabled={words.length === 0 || loading}
            sx={{ minWidth: '200px' }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ marginRight: '0.5rem' }} />
                Generating...
              </>
            ) : (
              'Generate WordConstructors'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Messages */}
      {error && <Alert severity="error" sx={{ marginBottom: '2rem' }}>{error}</Alert>}
      {successMessage && (
        <Alert severity="success" sx={{ marginBottom: '2rem' }}>
          {successMessage}
        </Alert>
      )}

      {/* Results Section */}
      {results.length > 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <Typography variant="h2" sx={{ fontSize: '1.5rem' }}>
                Results ({results.length})
              </Typography>
              <Button
                variant="outlined"
                startIcon={<GetAppIcon />}
                onClick={handleExportResults}
              >
                Export CSV
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Word</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>WordConstructor</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">
                      Morphemes
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>{result.word}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                        {result.wordConstructor || '—'}
                      </TableCell>
                      <TableCell align="center">
                        {(result.morphemes || []).length} found
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          onClick={() => handleShowDetails(result)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={handleCloseDetails} maxWidth="sm" fullWidth>
        <DialogTitle>WordConstructor Details</DialogTitle>
        <DialogContent>
          {selectedWord && (
            <Box sx={{ marginTop: '1rem' }}>
              <Typography variant="h6" sx={{ marginBottom: '1rem' }}>
                {selectedWord.word}
              </Typography>
              <Typography variant="subtitle2" sx={{ marginBottom: '1rem', color: 'text.secondary' }}>
                WordConstructor:
              </Typography>
              <Typography
                variant="body1"
                sx={{ marginBottom: '1.5rem', fontFamily: 'monospace', fontWeight: 500 }}
              >
                {selectedWord.wordConstructor || 'Could not generate'}
              </Typography>

              <Typography variant="subtitle2" sx={{ marginBottom: '0.5rem', color: 'text.secondary' }}>
                Morphemes Found:
              </Typography>
              <Box sx={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {(selectedWord.morphemes || []).map((morpheme, idx) => (
                  <Chip key={idx} label={morpheme} variant="outlined" />
                ))}
              </Box>

              {selectedWord.notes && (
                <>
                  <Typography variant="subtitle2" sx={{ marginBottom: '0.5rem', color: 'text.secondary' }}>
                    Notes:
                  </Typography>
                  <Typography variant="body2">{selectedWord.notes}</Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
