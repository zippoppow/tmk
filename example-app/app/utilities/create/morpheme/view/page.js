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

const TMK_API_URL = process.env.NEXT_PUBLIC_TMK_API_URL || 'http://localhost:3000';
//TODO: Add the ability to update each morpheme

export default function ViewMorphemesPage() {
  const [morphemes, setMorphemes] = useState([]);
  const [filteredMorphemes, setFilteredMorphemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch morphemes on mount
  useEffect(() => {
    const fetchMorphemes = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`${TMK_API_URL}/api/morphemes`);

        if (!response.ok) {
          throw new Error(`Failed to fetch morphemes: ${response.status}`);
        }

        const data = await response.json();
        console.log('Morphemes data:', data);

        const morphemesList = data.data || data || [];
        setMorphemes(morphemesList);
        setFilteredMorphemes(morphemesList);
      } catch (error) {
        console.error('Error fetching morphemes:', error);
        setError(`Failed to load morphemes: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchMorphemes();
  }, []);

  // Handle search filtering
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMorphemes(morphemes);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = morphemes.filter((m) => {
        return (
          m.name?.toLowerCase().includes(term) ||
          m.senseOfMeaning?.toLowerCase().includes(term) ||
          m.variants?.some((v) => v.toLowerCase().includes(term))
        );
      });
      setFilteredMorphemes(filtered);
    }
  }, [searchTerm, morphemes]);

  const handleRefresh = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${TMK_API_URL}/api/morphemes`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const morphemesList = data.data || data || [];
      setMorphemes(morphemesList);
      setFilteredMorphemes(morphemesList);
    } catch (error) {
      console.error('Error refreshing morphemes:', error);
      setError(`Failed to refresh: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredMorphemes.length === 0) {
      setError('No morphemes to export');
      return;
    }

    try {
      const headers = ['name', 'senseOfMeaning', 'variants', 'pronunciations', 'wordRole', 'wordOrigin', 'wordFormationConvention'];
      
      const rows = filteredMorphemes.map((morpheme) => [
        morpheme.name,
        morpheme.senseOfMeaning,
        morpheme.variants?.join('|') || '',
        morpheme.pronunciations?.join('|') || '',
        morpheme.wordRole?.name || '',
        morpheme.morphemeOrigin?.name || '',
        morpheme.wordFormationConvention?.name || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => (typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell)).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `morphemes-${new Date().toISOString().split('T')[0]}.csv`);
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
              View Morphemes
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
                <strong>Instructions:</strong> Below is a list of all morphemes in the TMK-API
                database. Use the search box to filter by name, meaning, or variants. Click Refresh
                to reload the list.
              </Typography>
            </Paper>

            {/* Loading Indicator */}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading morphemes...</Typography>
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
                      placeholder="Search by name, meaning, or variant..."
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
                      {filteredMorphemes.length} of {morphemes.length} morphemes
                    </Typography>
                  </Grid>
                </Grid>

                {/* Morphemes Table */}
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Sense of Meaning</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Variants</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Word Role</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Origin</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Pronunciations</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredMorphemes.length > 0 ? (
                        filteredMorphemes.map((morpheme) => (
                          <TableRow key={morpheme.id} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                            <TableCell sx={{ fontWeight: '500' }}>{morpheme.name}</TableCell>
                            <TableCell sx={{ maxWidth: 250 }}>{morpheme.senseOfMeaning}</TableCell>
                            <TableCell>
                              {morpheme.variants && morpheme.variants.length > 0 ? (
                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                  {morpheme.variants.map((variant, idx) => (
                                    <Chip
                                      key={idx}
                                      label={variant}
                                      size="small"
                                      variant="outlined"
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
                              {morpheme.wordRole?.name || morpheme.morphemeWordRoleId || '—'}
                            </TableCell>
                            <TableCell>
                              {morpheme.morphemeOrigin?.name || morpheme.morphemeWordOriginId || '—'}
                            </TableCell>
                            <TableCell>
                              {morpheme.pronunciations && morpheme.pronunciations.length > 0 ? (
                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                  {morpheme.pronunciations.map((pron, idx) => (
                                    <Chip
                                      key={idx}
                                      label={pron}
                                      size="small"
                                      variant="outlined"
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
                          <TableCell colSpan={6} sx={{ textAlign: 'center', py: 3, color: '#999' }}>
                            {searchTerm ? 'No morphemes match your search' : 'No morphemes found'}
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
