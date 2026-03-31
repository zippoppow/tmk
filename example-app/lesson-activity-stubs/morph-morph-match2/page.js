'use client';

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

export default function MorphMorphMatch2Page() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box component="main" sx={{ py: 4, bgcolor: '#f9f9f9', minHeight: '100vh' }}>
        <Container maxWidth="md">
          <Card sx={{ boxShadow: 3 }}>
            <CardContent sx={{ p: 4 }}>
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
                LATIN PROGRESSION
              </Typography>

              <Paper
                sx={{
                  p: 2,
                  mb: 3,
                  bgcolor: '#f0f8ff',
                  border: '1px solid #ccc',
                }}
              >
                <Typography variant="body1">
                  <strong>Instructions:</strong> Complete this educational exercise.
                </Typography>
              </Paper>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body1">
                  This educational exercise has been converted to use Pegasus components.
                </Typography>
                <Button variant="contained" sx={{ mt: 2 }}>
                  Submit Exercise
                </Button>
              </Box>

              <Paper
                sx={{
                  p: 2,
                  bgcolor: '#e8f4f8',
                  border: '1px solid #ccc',
                }}
              >
                <Typography variant="body2">
                  <strong>Note:</strong> Please review your answers before submitting.
                </Typography>
              </Paper>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </ThemeProvider>
  );
}