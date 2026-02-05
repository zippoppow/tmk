'use client';

import Link from 'next/link';
import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
  Button,
  Paper,
} from '@mui/material';

const createPages = [
  { label: 'Word', path: '/utilities/create/word' },
  { label: 'Morpheme', path: '/utilities/create/morpheme' },
  { label: 'Instructional Level', path: '/utilities/create/instructional-level' },
  { label: 'Part of Speech', path: '/utilities/create/part-of-speech' },
  { label: 'Vocabulary Tier', path: '/utilities/create/vocabulary-tier' },
  { label: 'Word Family', path: '/utilities/create/word-family' },
  { label: 'Word List', path: '/utilities/create/word-list' },
  { label: 'Lesson Activity Type', path: '/utilities/create/lesson-activity-type' },
];

export default function CreatePage() {
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
              Create New Content
            </Typography>
            <Typography
              variant="body1"
              sx={{
                textAlign: 'center',
                color: '#666',
                mb: 4,
              }}
            >
              Add new items to the TMK-API database
            </Typography>

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
                <strong>Choose what you'd like to create:</strong> Select one of the options below
                to add a new item to the TMK API database. Each form is pre-configured to submit
                to the appropriate API endpoint.
              </Typography>
            </Paper>

            {/* Grid of Create Options */}
            <Grid container spacing={3}>
              {createPages.map((page) => (
                <Grid item xs={12} sm={6} md={4} key={page.path}>
                  <Link href={page.path} style={{ textDecoration: 'none' }}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        p: 3,
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                        border: '2px solid transparent',
                        cursor: 'pointer',
                        '&:hover': {
                          boxShadow: 6,
                          border: '2px solid #1976d2',
                          transform: 'translateY(-4px)',
                        },
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 'bold',
                          color: '#333',
                          mb: 1,
                        }}
                      >
                        {page.label}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#999',
                          fontSize: '0.85rem',
                        }}
                      >
                        Add a new {page.label.toLowerCase()}
                      </Typography>
                    </Card>
                  </Link>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}