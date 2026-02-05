'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Container,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';

const TMK_API_URL = process.env.NEXT_PUBLIC_TMK_API_URL || 'http://localhost:3000';

export default function ImportLessonTypesPage() {
  const [lessonTypes, setLessonTypes] = useState([]);
  const [importStatus, setImportStatus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loadingFiles, setLoadingFiles] = useState(true);

  // Load all lesson activity JSON files on mount
  useEffect(() => {
    const loadLessonTypes = async () => {
      try {
        setLoadingFiles(true);
        const filenames = [
          'constructor',
          'morph-match',
          'deconstructor',
          'constructor-deconstructor',
          'common-base-word',
          'construct-and-match',
          'morph-match--chameleons',
          'morph-match-2',
          'morph-match-definitions',
          'morph-morph-match',
          'morph-morph-match2',
          'morph-morph-match-3',
          'morph-sort',
          'morph-spell',
          'morph-which',
          'part-of-speech-sort',
          'parts-of-speech',
          'how-do-you-say',
          'fill-in-the-morph--paragraph',
          'fill-in-the-morph--sentences',
          'primer-1',
          'primer-2',
          'latin-progression-primer--chameleon-roots',
          'spelling-chaining',
          'spelling-chaining--instructor-only',
          'spoken-chaining',
          'spoken-chaining--instructor-only',
          'spelling-review',
          'sort-and-spell',
          'suffix-completer',
          'suffix-transformer',
          'unscramble',
          'word-builder',
          'word-meaning',
          'review',
        ];

        const types = new Set();
        const details = [];

        for (const filename of filenames) {
          try {
            const response = await fetch(`/lesson-activities/${filename}.json`);
            if (!response.ok) {
              console.warn(`Failed to fetch ${filename}: ${response.status}`);
              continue;
            }

            const data = await response.json();
            const lessonType = data.LessonActivity?.LessonType;

            if (lessonType) {
              if (!types.has(lessonType)) {
                types.add(lessonType);
                details.push({
                  name: lessonType,
                  file: filename,
                  status: 'pending',
                });
              }
            }
          } catch (error) {
            console.error(`Error loading ${filename}:`, error);
          }
        }

        console.log('Loaded lesson types:', details);
        setLessonTypes(details);
        setImportStatus(new Array(details.length).fill({ status: 'pending', message: '' }));
      } finally {
        setLoadingFiles(false);
      }
    };

    loadLessonTypes();
  }, []);

  const handleImportAll = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    const newStatus = [...importStatus];
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < lessonTypes.length; i++) {
      const lessonType = lessonTypes[i];

      try {
        const payload = {
          name: lessonType.name,
        };

        console.log(`Creating lesson type: ${lessonType.name}`);

        const response = await fetch(`${TMK_API_URL}/api/lesson-types`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || `HTTP ${response.status}`);
        }

        newStatus[i] = { status: 'success', message: 'Created successfully' };
        successCount++;
      } catch (error) {
        console.error(`Error creating ${lessonType.name}:`, error);
        newStatus[i] = { status: 'error', message: error.message };
        failureCount++;
      }
    }

    setImportStatus(newStatus);
    setLoading(false);
    setMessage({
      type: failureCount === 0 ? 'success' : 'warning',
      text: `Import complete! Created: ${successCount}, Failed: ${failureCount}`,
    });
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'success':
        return <Chip label="Created" color="success" size="small" />;
      case 'error':
        return <Chip label="Failed" color="error" size="small" />;
      default:
        return <Chip label="Pending" variant="outlined" size="small" />;
    }
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
                mb: 3,
                textTransform: 'uppercase',
              }}
            >
              Import Lesson Activity Types
            </Typography>

            {/* Message Alert */}
            {message.text && (
              <Alert severity={message.type} sx={{ mb: 3 }}>
                {message.text}
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
                <strong>Instructions:</strong> This tool will read all lesson activity JSON files
                and create lesson activity types in the TMK API database for each unique lesson
                type found. Click "Import All" to begin the import process.
              </Typography>
            </Paper>

            {/* Loading Indicator */}
            {loadingFiles && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading lesson activity files...</Typography>
              </Box>
            )}

            {!loadingFiles && (
              <>
                {/* Lesson Types Table */}
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 'bold', mb: 2, mt: 3 }}
                >
                  Found {lessonTypes.length} Unique Lesson Activity Types
                </Typography>

                <TableContainer component={Paper} sx={{ mb: 3 }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Lesson Type</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Sample File</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Message</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lessonTypes.map((type, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{type.name}</TableCell>
                          <TableCell sx={{ fontSize: '0.875rem', color: '#666' }}>
                            {type.file}.json
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            {getStatusChip(importStatus[idx]?.status || 'pending')}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.875rem', color: '#999' }}>
                            {importStatus[idx]?.message || ''}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Import Button */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={handleImportAll}
                    disabled={loading}
                  >
                    {loading ? 'Importing...' : 'Import All Lesson Types'}
                  </Button>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
