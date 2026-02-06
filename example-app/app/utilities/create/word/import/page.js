'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ThemeProvider,
  createTheme,
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  CssBaseline,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { bulkImport } from './bulk-import.js';

const theme = createTheme();
const TMK_API_URL = process.env.NEXT_PUBLIC_TMK_API_URL || 'http://localhost:3000';

export default function ImportWordsPage() {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [lookupTables, setLookupTables] = useState(null);
  const fileInputRef = useRef(null);

  // Load lookup tables on component mount
  useEffect(() => {
    const fetchLookupTables = async () => {
      try {
        const [posRes, vtRes, ilRes] = await Promise.all([
          fetch(`${TMK_API_URL}/api/parts-of-speech`),
          fetch(`${TMK_API_URL}/api/vocabulary-tiers`),
          fetch(`${TMK_API_URL}/api/instructional-levels`),
        ]);

        if (!posRes.ok || !vtRes.ok || !ilRes.ok) {
          throw new Error('Failed to fetch lookup tables');
        }

        const posData = await posRes.json();
        const vtData = await vtRes.json();
        const ilData = await ilRes.json();

        setLookupTables({
          partsOfSpeech: posData.data || posData || [],
          vocabularyTiers: vtData.data || vtData || [],
          instructionalLevels: ilData.data || ilData || [],
        });
      } catch (err) {
        console.error('Failed to load lookup tables:', err);
      }
    };

    fetchLookupTables();
  }, []);

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setLoading(true);
    setError(null);
    setWords([]);

    try {
      const text = await file.text();
      const result = await bulkImport.parseCSVAndMapIds(text, lookupTables);
      
      if (result.errors.length > 0) {
        setError(`Parsing completed with ${result.errors.length} error(s):\n${result.errors.join('\n')}`);
      }
      
      setWords(result.words);
    } catch (err) {
      setError(`Failed to parse CSV: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImportClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmImport = async () => {
    setShowConfirm(false);
    setImporting(true);
    setImportResults(null);
    setError(null);

    try {
      const results = await bulkImport.createWords(words, {
        stopOnError: false,
        verbose: false,
      });
      setImportResults(results);
    } catch (err) {
      setError(`Import failed: ${err.message}`);
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  const handleCancelImport = () => {
    setShowConfirm(false);
  };

  const downloadSampleCSV = () => {
    const headers = ['name', 'wordConstructor', 'totalSyllables', 'partOfSpeech', 'vocabularyTier', 'instructionalLevel', 'dictionaryRef', 'prefixes', 'suffixes'];
    const sampleRows = [
      ['audible', 'aud|ible', '3', 'Adjective', 'Tier 1', 'Level 2', '', 'aud', 'ible'],
      ['scribe', 'script', '2', 'Noun', 'Tier 1', 'Level 1', '', '', ''],
      ['transmission', 'trans|script|ion', '4', 'Noun', 'Tier 2', 'Level 3', '', 'trans', 'ion'],
    ];

    const csvContent = [
      headers.join(','),
      ...sampleRows.map(row => row.map(cell => (cell.includes(',') ? `"${cell}"` : cell)).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'word-import-sample.csv';
    a.click();
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box component="main" sx={{ py: 4, bgcolor: '#f9f9f9', minHeight: '100vh' }}>
        <Container maxWidth="lg">
          <Card sx={{ boxShadow: 3, mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  mb: 2,
                  fontWeight: 'bold',
                  color: '#004a99',
                }}
              >
                Import Words from CSV
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#666',
                  mb: 3,
                }}
              >
                Upload a CSV file with word data. Use text values (e.g., "Noun", "Tier 1") instead of IDs—they will be automatically mapped to database values.
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {importResults && (
                <Alert
                  severity={importResults.failed === 0 ? 'success' : 'warning'}
                  sx={{ mb: 2 }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    Import Complete
                  </Typography>
                  <Typography variant="body2">
                    ✓ Created: {importResults.created} | ✗ Failed: {importResults.failed} of{' '}
                    {importResults.total}
                  </Typography>
                  {importResults.errors.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                        Errors:
                      </Typography>
                      {importResults.errors.map((err, idx) => (
                        <Typography key={idx} variant="caption" sx={{ display: 'block' }}>
                          • Row {err.index + 1}: {err.error}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Alert>
              )}

              {/* CSV Upload Section */}
              <Card sx={{ bgcolor: '#f0f8ff', p: 2, mb: 3, border: '2px dashed #004a99' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CloudUploadIcon sx={{ fontSize: 40, color: '#004a99' }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Choose CSV File
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      CSV should have columns: name, wordConstructor, totalSyllables, partOfSpeech, vocabularyTier, instructionalLevel, dictionaryRef, prefixes, suffixes
                    </Typography>
                  </Box>
                </Box>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  style={{ marginTop: 12 }}
                />
              </Card>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={downloadSampleCSV}
                >
                  Download Sample CSV
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleImportClick}
                  disabled={loading || importing || words.length === 0}
                >
                  {importing ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Importing...
                    </>
                  ) : (
                    `Import ${words.length} Words`
                  )}
                </Button>
              </Box>

              {/* Data Summary */}
              {words.length > 0 && (
                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                  <Card sx={{ flex: 1, minWidth: 150 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography color="textSecondary" gutterBottom>
                        Total Words
                      </Typography>
                      <Typography variant="h4">{words.length}</Typography>
                    </CardContent>
                  </Card>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Words Table */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : words.length > 0 ? (
            <TableContainer component={Paper} sx={{ boxShadow: 3, overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#004a99' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                      Name
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                      Constructor
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                      Syllables
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                      Part of Speech
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                      Vocabulary Tier
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                      Instructional Level
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {words.map((word, idx) => (
                    <TableRow
                      key={idx}
                      sx={{
                        '&:nth-of-type(odd)': { bgcolor: '#f5f5f5' },
                        '&:hover': { bgcolor: '#e8f0f8' },
                      }}
                    >
                      <TableCell sx={{ fontWeight: 'bold', color: '#004a99' }}>
                        {word.name}
                      </TableCell>
                      <TableCell>{word.wordConstructor || '—'}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        {word.totalSyllables || '—'}
                      </TableCell>
                      <TableCell>
                        {lookupTables?.partsOfSpeech.find(p => p.id === word.partOfSpeechId)?.name || '—'}
                      </TableCell>
                      <TableCell>
                        {lookupTables?.vocabularyTiers.find(v => v.id === word.vocabularyTierId)?.name || '—'}
                      </TableCell>
                      <TableCell>
                        {lookupTables?.instructionalLevels.find(i => i.id === word.instructionalLevelId)?.name || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : null}
        </Container>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onClose={handleCancelImport}>
        <DialogTitle>Confirm Import</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to import {words.length} words into the database?
          </Typography>
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            This operation cannot be undone if duplicates are created.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelImport}>Cancel</Button>
          <Button onClick={handleConfirmImport} variant="contained" color="primary">
            Confirm Import
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
