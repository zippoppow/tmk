'use client';

/**
 * Home page demonstrating Pegasus Component Library usage.
 * 
 * This page shows how to:
 * - Import tokens from the Pegasus library
 * - Use Pegasus theme components
 * - Render Pegasus icons
 */
import { useRouter } from 'next/navigation';
import {
    Alert,
    Container,
    Box,
    Collapse,
    Grid,
    Typography,
    Button,
    Paper,
    IconButton,
} from '@mui/material';
import TmkLogo from './components/TmkLogo';

export default function Main() {
   const router = useRouter();

  return (
      <Box sx={{
                minHeight: '100vh',
                backgroundImage:
                    "linear-gradient(rgba(255, 255, 255, 0.8), rgba(255,255,255,0.86)), url('/branding/tmk_diy_cat.png')",
                backgroundSize: '65% auto',
                backgroundPosition: 'center calc(10%)',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: { xs: 'scroll', md: 'fixed' },
            }}
        >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <TmkLogo sx={{ mb: 0 }} priority />
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography variant="h2" component="h1">
                       D.I.Y. HOME
                    </Typography>
                </Box>    
          </Box>

          <Grid container spacing={{ xs: 2, md: 3 }} alignItems="flex-start" sx={{ mb: 4 }}>
                {/* Left column: DIY Dashboard */}
                <Grid item xs={12} md={6} sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3, order: { xs: 2, md: 1 } }}>

                    <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid #224c88' }}>
                        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                            DIY Dashboard
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                            Create and manage lesson activities.
                            You will gain access after active DIY course enrollment is verified.
                        </Typography>
                        <Button variant="contained" onClick={() => router.push('/dashboard')}>
                            Go to Dashboard
                        </Button>
                    </Paper>

                </Grid>

                {/* Right column: Projects
                <Grid item xs={12} md={6} sx={{ order: { xs: 1, md: 2 } }}>
                    <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid #224c88' }}>
                        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                            Projects (Sequences of Activities)
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                            {hasDiyAccess
                                ? 'Create and manage sequences of lesson activities.'
                                : 'Available after active DIY course enrollment is verified.'}
                        </Typography>
                        <Button variant="contained" onClick={() => router.push('/lesson-projects')} disabled={!hasDiyAccess}>
                            Go to Projects
                        </Button>
                    </Paper>
                </Grid> */}
            </Grid>
        </Container>

      </Box>
  );
}
