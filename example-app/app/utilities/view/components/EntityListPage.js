'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { fetchWithTmkToken } from '@/app/utilities/components/authHelpers';

function normalizeList(payload) {
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && Array.isArray(payload.items)) {
    return payload.items;
  }
  return [];
}

function getPathValue(record, path) {
  if (!record || typeof record !== 'object' || !path) {
    return '';
  }

  return String(path)
    .split('.')
    .reduce((acc, segment) => (acc == null ? undefined : acc[segment]), record);
}

function defaultFormatValue(value) {
  if (value == null || value === '') {
    return '—';
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '—';
    }
    return value
      .map((entry) => {
        if (entry == null) {
          return '';
        }
        if (typeof entry === 'object') {
          return entry.name || entry.value || JSON.stringify(entry);
        }
        return String(entry);
      })
      .filter(Boolean)
      .join(', ');
  }

  if (typeof value === 'object') {
    return value.name || value.value || JSON.stringify(value);
  }

  return String(value);
}

export default function EntityListPage({
  title,
  entityLabel,
  endpoint,
  createPath,
  searchPlaceholder,
  instructions,
  columns,
  searchFields,
}) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetchWithTmkToken(endpoint);
      if (!response.ok) {
        throw new Error(`Failed to load ${entityLabel}: HTTP ${response.status}`);
      }

      const payload = await response.json();
      setRecords(normalizeList(payload));
    } catch (fetchError) {
      setError(fetchError?.message || `Failed to load ${entityLabel}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const filteredRecords = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return records;
    }

    return records.filter((record) => {
      const values =
        Array.isArray(searchFields) && searchFields.length > 0
          ? searchFields.map((path) => getPathValue(record, path))
          : Object.values(record || {});

      return values.some((value) => defaultFormatValue(value).toLowerCase().includes(term));
    });
  }, [records, searchFields, searchTerm]);

  return (
    <Box component="main" sx={{ py: 4, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl">
        <Card sx={{ boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
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
              {title}
            </Typography>

            {createPath && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Button component={Link} href={createPath} variant="outlined" size="small">
                  Go to Create Form
                </Button>
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Paper
              sx={{
                p: 2,
                mb: 4,
                bgcolor: '#fff9e6',
                border: '1px solid #ffd966',
              }}
            >
              <Typography variant="body2">
                <strong>Instructions:</strong> {instructions}
              </Typography>
            </Paper>

            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading {entityLabel}...</Typography>
              </Box>
            )}

            {!loading && (
              <>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={7} md={8}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Search"
                      placeholder={searchPlaceholder}
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={5} md={4} sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Button variant="outlined" size="small" onClick={fetchRecords}>
                      Refresh
                    </Button>
                    <Typography variant="body2" sx={{ color: '#666', ml: 'auto' }}>
                      {filteredRecords.length} of {records.length} {entityLabel}
                    </Typography>
                  </Grid>
                </Grid>

                <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                        {columns.map((column) => (
                          <TableCell key={column.key} sx={{ fontWeight: 'bold' }}>
                            {column.label}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredRecords.length > 0 ? (
                      filteredRecords.map((record, recordIndex) => (
                        <TableRow key={record.id || `${record.name || 'row'}-${recordIndex}`} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                            {columns.map((column) => {
                              const rawValue = getPathValue(record, column.key);
                              const displayValue = column.render
                                ? column.render(record, rawValue)
                                : defaultFormatValue(rawValue);

                              return <TableCell key={`${record.id || record.name || 'row'}-${column.key}`}>{displayValue}</TableCell>;
                            })}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={columns.length} sx={{ textAlign: 'center', py: 3, color: '#999' }}>
                            {searchTerm ? `No ${entityLabel} match your search` : `No ${entityLabel} found`}
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
