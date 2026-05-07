'use client';

import Link from 'next/link';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Paper,
  Typography,
} from '@mui/material';

const viewPages = [
  { label: 'Word', path: '/utilities/view/word' },
  { label: 'Morpheme', path: '/utilities/view/morpheme' },
  { label: 'Instructional Level', path: '/utilities/view/instructional-level' },
  { label: 'Part of Speech', path: '/utilities/view/part-of-speech' },
  { label: 'Vocabulary Tier', path: '/utilities/view/vocabulary-tier' },
  { label: 'Word Family', path: '/utilities/view/word-family' },
  { label: 'Word List', path: '/utilities/view/word-list' },
  { label: 'Lesson Activity Type', path: '/utilities/view/lesson-activity-type' },
];

export default function ViewPage() {
  return (
    <Box component="main" sx={{ py: 4, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        <Card sx={{ boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
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
              View Existing Content
            </Typography>
            <Typography
              variant="body1"
              sx={{
                textAlign: 'center',
                color: '#666',
                mb: 4,
              }}
            >
              Browse records from the TMK-API database
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Button component={Link} href="/utilities/create" variant="outlined" size="small">
                Switch to Create Pages
              </Button>
            </Box>

            <Paper
              sx={{
                p: 2,
                mb: 4,
                bgcolor: '#fff9e6',
                border: '1px solid #ffd966',
              }}
            >
              <Typography variant="body2">
                <strong>Choose what you'd like to view:</strong> Select one of the options below
                to browse existing records from the TMK API endpoint for that resource.
              </Typography>
            </Paper>

            <Grid container spacing={3}>
              {viewPages.map((page) => (
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
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333', mb: 1 }}>
                        {page.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#999', fontSize: '0.85rem' }}>
                        View {page.label.toLowerCase()} records
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
