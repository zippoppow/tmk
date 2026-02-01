'use client';

import { useState, useEffect } from 'react';
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
import { bulkImport } from './bulk-import.js';

const theme = createTheme();

export default function DataManagementPage() {
  const [morphemes, setMorphemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Load morphemes from JSON file on component mount
  useEffect(() => {
    const loadMorphemes = async () => {
      setLoading(true);
      try {
        const data = await bulkImport.loadMorphemesFromFile();
        setMorphemes(data);
        setError(null);
      } catch (err) {
        setError(`Failed to load morphemes: ${err.message}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadMorphemes();
  }, []);

  const handleImportClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmImport = async () => {
    setShowConfirm(false);
    setImporting(true);
    setImportResults(null);
    setError(null);

    try {
      const results = await bulkImport.createMorphemes(morphemes, {
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

  const getRoleColor = (roleId) => {
    const colors = {
      14: 'info',    // Root/Base
      13: 'primary', // Prefix
      15: 'success', // Suffix
    };
    return colors[roleId] || 'default';
  };

  const getRoleLabel = (roleId) => {
    const labels = {
      14: 'Base Element',
      13: 'Prefix',
      15: 'Suffix',
    };
    return labels[roleId] || 'Unknown';
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
                Data Management
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#666',
                  mb: 3,
                }}
              >
                Import morpheme data into the TMK database. Review the data below before importing.
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
                          • {err.morpheme}: {err.error}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Alert>
              )}

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleImportClick}
                  disabled={loading || importing || morphemes.length === 0}
                >
                  {importing ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Importing...
                    </>
                  ) : (
                    `Import ${morphemes.length} Morphemes`
                  )}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => window.location.reload()}
                  disabled={importing}
                >
                  Refresh Data
                </Button>
              </Box>

              {/* Data Summary */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Card sx={{ flex: 1, minWidth: 150 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography color="textSecondary" gutterBottom>
                      Total Morphemes
                    </Typography>
                    <Typography variant="h4">{morphemes.length}</Typography>
                  </CardContent>
                </Card>
                <Card sx={{ flex: 1, minWidth: 150 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography color="textSecondary" gutterBottom>
                      Prefixes
                    </Typography>
                    <Typography variant="h4">
                      {morphemes.filter((m) => m.morphemeWordRoleId === 13).length}
                    </Typography>
                  </CardContent>
                </Card>
                <Card sx={{ flex: 1, minWidth: 150 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography color="textSecondary" gutterBottom>
                      Base Elements
                    </Typography>
                    <Typography variant="h4">
                      {morphemes.filter((m) => m.morphemeWordRoleId === 14).length}
                    </Typography>
                  </CardContent>
                </Card>
                <Card sx={{ flex: 1, minWidth: 150 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography color="textSecondary" gutterBottom>
                      Suffixes
                    </Typography>
                    <Typography variant="h4">
                      {morphemes.filter((m) => m.morphemeWordRoleId === 15).length}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </CardContent>
          </Card>

          {/* Morphemes Table */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#004a99' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                      Morpheme
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                      Role
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                      Sense of Meaning
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                      Variants
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                      Origin
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {morphemes.map((morpheme) => (
                    <TableRow
                      key={morpheme.id}
                      sx={{
                        '&:nth-of-type(odd)': { bgcolor: '#f5f5f5' },
                        '&:hover': { bgcolor: '#e8f0f8' },
                      }}
                    >
                      <TableCell sx={{ fontWeight: 'bold', color: '#004a99' }}>
                        {morpheme.name}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getRoleLabel(morpheme.morphemeWordRoleId)}
                          color={getRoleColor(morpheme.morphemeWordRoleId)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{morpheme.senseOfMeaning}</TableCell>
                      <TableCell>
                        {morpheme.variants && morpheme.variants.length > 0
                          ? morpheme.variants.join(', ')
                          : '—'}
                      </TableCell>
                      <TableCell>{morpheme.morphemeOrigin?.name || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Container>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onClose={handleCancelImport}>
        <DialogTitle>Confirm Import</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to import {morphemes.length} morphemes into the database?
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