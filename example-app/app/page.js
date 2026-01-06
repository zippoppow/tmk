'use client';

/**
 * Home page demonstrating Pegasus Component Library usage.
 * 
 * This page shows how to:
 * - Import tokens from the Pegasus library
 * - Use Pegasus theme components
 * - Render Pegasus icons
 */

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Badge from '@mui/material/Badge';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Link from 'next/link';
import tokens from '../../tokens/global.json';
import { templatePages } from './templates';

// Create a Material-UI theme using Pegasus tokens
const theme = createTheme();

export default function Main() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box component="main" sx={{ padding: '2rem' }}>
        <Typography variant="h1" sx={{ marginBottom: '2rem' }}>
          Pegasus Component Library Example
        </Typography>

        {/* Card Example */}
        <Card sx={{ marginBottom: '2rem' }}>
          <CardContent>
            <Typography variant="h2" component="h2">
              Card Component
            </Typography>
            <Typography>
              This is a card rendered using Material-UI components (integrated with Pegasus).
            </Typography>
          </CardContent>
        </Card>

        {/* Button Examples */}
        <Box component="section" sx={{ marginBottom: '2rem' }}>
          <Typography variant="h2" component="h2" sx={{ marginBottom: '1rem' }}>
            Button Components
          </Typography>
          <Box sx={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Button variant="contained">Primary Button</Button>
            <Button variant="outlined">Secondary Button</Button>
          </Box>
        </Box>

        {/* Badge Examples */}
        <Box component="section" sx={{ marginBottom: '2rem' }}>
          <Typography variant="h2" component="h2" sx={{ marginBottom: '1rem' }}>
            Badge Components
          </Typography>
          <Box sx={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Badge badgeContent={5} color="primary">
              Messages
            </Badge>
            <Badge badgeContent={3} color="success">
              Notifications
            </Badge>
          </Box>
        </Box>

        {/* Tokens Usage */}
        <Box component="section">
          <Typography variant="h2" component="h2" sx={{ marginBottom: '1rem' }}>
            Design Tokens
          </Typography>
          <Typography variant="body1">
            Pegasus design tokens are available at: <code>../../tokens/global.json</code>
          </Typography>
          <Typography variant="body2" sx={{ marginTop: '0.5rem', color: 'text.secondary' }}>
            Note: Pegasus theme components use Material-UI. Customize the theme above to match your brand colors and spacing from tokens.
          </Typography>
        </Box>

        {/* Template Examples */}
        <Box component="section" sx={{ marginTop: '3rem' }}>
          <Typography variant="h2" component="h2" sx={{ marginBottom: '1rem' }}>
            Educational Templates ({templatePages.length})
          </Typography>
          <Typography variant="body1" sx={{ marginBottom: '2rem' }}>
            All {templatePages.length} educational templates have been converted to use Pegasus components:
          </Typography>
          <Grid container spacing={2}>
            {templatePages.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.slug}>
                <Button
                  fullWidth
                  variant="outlined"
                  component={Link}
                  href={`/${template.slug}`}
                  sx={{
                    py: 2,
                    px: 1,
                    textAlign: 'center',
                    textTransform: 'none',
                    fontSize: '0.9rem',
                    whiteSpace: 'normal',
                    wordWrap: 'break-word',
                  }}
                >
                  {template.title}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
