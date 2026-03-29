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
  ThemeProvider,
  createTheme,
  CssBaseline,
  Button,
} from '@mui/material';

const theme = createTheme();

/**
 * Generic educational template wrapper component
 * Provides consistent styling and layout for educational exercises
 */
export default function EducationalTemplate({
  title,
  instructions,
  note,
  children,
}) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box component="main" sx={{ py: 4, bgcolor: '#f9f9f9', minHeight: '100vh' }}>
        <Container maxWidth="md">
          <Card sx={{ boxShadow: 3 }}>
            <CardContent sx={{ p: 4 }}>
              {/* Title */}
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  textAlign: 'center',
                  color: '#004a99',
                  fontWeight: 'bold',
                  mb: 3,
                  textTransform: 'uppercase',
                }}
              >
                {title}
              </Typography>

              {/* Instructions */}
              {instructions && (
                <Paper
                  sx={{
                    p: 2,
                    mb: 3,
                    bgcolor: '#f0f8ff',
                    border: '1px solid #ccc',
                  }}
                >
                  <Typography variant="body1">{instructions}</Typography>
                </Paper>
              )}

              {/* Main Content */}
              <Box sx={{ mb: 3 }}>{children}</Box>

              {/* Note */}
              {note && (
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: '#e8f4f8',
                    border: '1px solid #ccc',
                  }}
                >
                  <Typography variant="body2">{note}</Typography>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
