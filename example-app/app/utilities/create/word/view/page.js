'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Container,
  Paper,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Grid,
  Chip,
  Button,
} from '@mui/material';
import { findBestMorphemeVariant } from './morpheme-utils.js';

const TMK_API_URL = process.env.NEXT_PUBLIC_TMK_API_URL || 'http://localhost:3000';

export default function ViewWordsPage() {
  const [words, setWords] = useState([]);
  const [filteredWords, setFilteredWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [morphemes, setMorphemes] = useState([]);

  // Fetch words and morphemes on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [wordsRes, morphemesRes] = await Promise.all([
          fetch(`${TMK_API_URL}/api/words`),
          fetch(`${TMK_API_URL}/api/morphemes`),
        ]);

        if (!wordsRes.ok || !morphemesRes.ok) {
          throw new Error(`Failed to fetch data: ${wordsRes.status} / ${morphemesRes.status}`);
        }

        const wordsData = await wordsRes.json();
        const morphemesData = await morphemesRes.json();
        console.log('Words data:', wordsData);
        console.log('Morphemes data:', morphemesData);

        const wordsList = wordsData.data || wordsData || [];
        const morphemesList = morphemesData.data || morphemesData || [];
        
        setWords(wordsList);
        setFilteredWords(wordsList);
        setMorphemes(morphemesList);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(`Failed to load data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle search filtering
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredWords(words);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = words.filter((w) => {
        const baseMorphemeName = morphemes.find(m => m.id === w.baseMorphemeId)?.name || '';
        return (
          w.name?.toLowerCase().includes(term) ||
          w.wordConstructor?.toLowerCase().includes(term) ||
          w.partOfSpeech?.name?.toLowerCase().includes(term) ||
          w.vocabularyTier?.name?.toLowerCase().includes(term) ||
          baseMorphemeName?.toLowerCase().includes(term)
        );
      });
      setFilteredWords(filtered);
    }
  }, [searchTerm, words, morphemes]);

  // Helper function to get the best matching base morpheme variant with display text
  const getBaseMorphemeVariant = (word) => {
    if (!word.baseMorphemeId || morphemes.length === 0) {
      return '';
    }
    
    const baseMorpheme = morphemes.find(m => m.id === word.baseMorphemeId);
    if (!baseMorpheme) {
      return '';
    }

    // Use the utility function to find the best matching variant
    const variant = findBestMorphemeVariant(word.wordConstructor, baseMorpheme);
    
    // If variant differs from base name, show variant with note
    if (variant && variant !== baseMorpheme.name) {
      return `${variant} (variant of ${baseMorpheme.name})`;
    }
    
    return variant;
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError('');
    try {
      const [wordsRes, morphemesRes] = await Promise.all([
        fetch(`${TMK_API_URL}/api/words`),
        fetch(`${TMK_API_URL}/api/morphemes`),
      ]);
      if (!wordsRes.ok || !morphemesRes.ok) throw new Error(`HTTP ${wordsRes.status} / ${morphemesRes.status}`);
      
      const wordsData = await wordsRes.json();
      const morphemesData = await morphemesRes.json();
      
      const wordsList = wordsData.data || wordsData || [];
      const morphemesList = morphemesData.data || morphemesData || [];
      
      setWords(wordsList);
      setFilteredWords(wordsList);
      setMorphemes(morphemesList);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError(`Failed to refresh: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredWords.length === 0) {
      setError('No words to export');
      return;
    }

    try {
      const headers = ['name', 'wordConstructor', 'totalSyllables', 'baseElement', 'partOfSpeech', 'vocabularyTier', 'instructionalLevel', 'dictionaryRef', 'prefixes', 'suffixes'];
      
      const rows = filteredWords.map((word) => [
        word.name,
        word.wordConstructor || '',
        word.totalSyllables || '',
        getBaseMorphemeVariant(word),
        word.partOfSpeech?.name || '',
        word.vocabularyTier?.name || '',
        word.instructionalLevel?.name || '',
        word.dictionaryRef || '',
        word.prefixes?.map(p => p.morpheme?.name || p.name || '').filter(Boolean).join('|') || '',
        word.suffixes?.map(s => s.morpheme?.name || s.name || '').filter(Boolean).join('|') || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => (typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell)).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `words-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      setError(`Failed to export: ${error.message}`);
    }
  };

  return (
    <Box component="main" sx={{ py: 4, bgcolor: '#f9f9f9', minHeight: '100vh' }}>
      <Container maxWidth="xl">
        <Card sx={{ boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Typography
              variant="h4"
              component="h1"
              sx={{
                textAlign: 'center',
                fontWeight: 'bold',
                mb: 3,
                textTransform: 'uppercase',
              }}
            >
              View Words
            </Typography>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Instructions */}
            <Paper
              sx={{
                p: 2,
                mb: 4,
                bgcolor: '#fff9e6',
                border: '1px solid #ffd966',
              }}
            >
              <Typography variant="body2">
                <strong>Instructions:</strong> Below is a list of all words in the TMK-API
                database. Use the search box to filter by name, constructor, part of speech, base element, or vocabulary tier. Click Refresh
                to reload the list.
              </Typography>
            </Paper>

            {/* Loading Indicator */}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading words...</Typography>
              </Box>
            )}

            {!loading && (
              <>
                {/* Search and Controls */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Search"
                      placeholder="Search by name, constructor, part of speech, base element, or tier..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Button variant="outlined" size="small" onClick={handleRefresh}>
                      Refresh
                    </Button>
                    <Button variant="contained" color="success" size="small" onClick={handleExportCSV}>
                      Export CSV
                    </Button>
                    <Typography
                      variant="body2"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        color: '#666',
                        ml: 'auto',
                      }}
                    >
                      {filteredWords.length} of {words.length} words
                    </Typography>
                  </Grid>
                </Grid>

                {/* Words Table */}
                <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Constructor</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Syllables</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Base Element</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Part of Speech</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Vocabulary Tier</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Instructional Level</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Prefixes</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Suffixes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredWords.length > 0 ? (
                        filteredWords.map((word) => (
                          <TableRow key={word.id} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                            <TableCell sx={{ fontWeight: '500' }}>{word.name}</TableCell>
                            <TableCell sx={{ maxWidth: 200, wordBreak: 'break-word' }}>
                              {word.wordConstructor || '—'}
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              {word.totalSyllables || '—'}
                            </TableCell>
                            <TableCell>
                              {getBaseMorphemeVariant(word) || '—'}
                            </TableCell>
                            <TableCell>
                              {word.partOfSpeech?.name || '—'}
                            </TableCell>
                            <TableCell>
                              {word.vocabularyTier?.name || '—'}
                            </TableCell>
                            <TableCell>
                              {word.instructionalLevel?.name || '—'}
                            </TableCell>
                            <TableCell>
                              {word.prefixes && word.prefixes.length > 0 ? (
                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                  {word.prefixes.map((prefix, idx) => (
                                    <Chip
                                      key={idx}
                                      label={prefix.morpheme?.name || prefix.name || 'Unknown'}
                                      size="small"
                                      variant="outlined"
                                      color="primary"
                                    />
                                  ))}
                                </Box>
                              ) : (
                                <Typography variant="caption" sx={{ color: '#999' }}>
                                  None
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {word.suffixes && word.suffixes.length > 0 ? (
                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                  {word.suffixes.map((suffix, idx) => (
                                    <Chip
                                      key={idx}
                                      label={suffix.morpheme?.name || suffix.name || 'Unknown'}
                                      size="small"
                                      variant="outlined"
                                      color="secondary"
                                    />
                                  ))}
                                </Box>
                              ) : (
                                <Typography variant="caption" sx={{ color: '#999' }}>
                                  None
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} sx={{ textAlign: 'center', py: 3, color: '#999' }}>
                            {searchTerm ? 'No words match your search' : 'No words found'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
