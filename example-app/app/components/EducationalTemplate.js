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
  Button,
} from '@mui/material';

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
      <Box component="main" sx={{ py: 4, bgcolor: 'background.default', minHeight: '100vh' }}>
        <Container maxWidth="md">
          <Card sx={{ boxShadow: 3 }}>
            <CardContent sx={{ p: 4 }}>
              {/* Title */}
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  textAlign: 'center',
                  color: 'primary.main',
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
                    bgcolor: 'blue.50',
                    border: '1px solid',
                    borderColor: 'grey.200',
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
                    bgcolor: 'grey.100',
                    border: '1px solid',
                    borderColor: 'grey.200',
                  }}
                >
                  <Typography variant="body2">{note}</Typography>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Container>
      </Box>
  );
}
