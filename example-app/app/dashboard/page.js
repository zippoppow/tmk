'use client';

import { useEffect, useState } from 'react';
import { useDiyAccess } from '../components/useDiyAccess';
import { useRouter } from 'next/navigation';
import {
    buildTeachableLogoutUrl,
} from '../components/authHelpers';
import {
    Alert,
    Container,
    Box,
    Grid,
    Typography,
    Button,
    Paper,
} from '@mui/material';
import TmkLogo from '../components/TmkLogo';

export default function DashboardPage() {

    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);
    const { hasDiyAccess, authUser: user } = useDiyAccess();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // No redirect for lack of DIY access; dashboard always renders

    const handleLogout = () => {
        window.location.href = buildTeachableLogoutUrl('/login?next=/dashboard');
    };

    if (!isMounted || !user) {
        return null;
    }

    const displayName = user?.profile?.name || user?.name || user?.profile?.email || user?.email || 'User';

    return (
        <Box
            sx={{
                minHeight: '100vh',
                backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.80), rgba(255,255,255,0.86)), url('/branding/tmk_diy_cat.png')",
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
                       DASHBOARD
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography variant="body1">
                        Welcome, {displayName}
                    </Typography>
                    <Button variant="outlined" onClick={handleLogout}>
                        Logout
                    </Button>
                </Box>
                
            </Box>

            <Grid container spacing={{ xs: 2, md: 3 }} alignItems="flex-start" sx={{ mb: 4 }}>
                {/* Left column: Lesson Activities + Standalone */}
                <Grid item xs={12} md={6} sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3, order: { xs: 2, md: 1 } }}>
                    {!hasDiyAccess && (
                        <Alert severity="warning" sx={{ mb: 1 }}>
                            Active enrollment in the DIY course is required to access Lesson Activities and Lesson Projects.
                        </Alert>
                    )}

                    <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid #224c88' }}>
                        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                            Lesson Activities
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                            {hasDiyAccess
                                ? 'Create and manage single, standalone lesson activities.'
                                : 'Available after active DIY course enrollment is verified.'}
                        </Typography>
                        <Button variant="contained" onClick={() => router.push('/lesson-activities')} disabled={!hasDiyAccess}>
                            Go to Lesson Activities
                        </Button>
                    </Paper>

                </Grid>

                {/* Right column: Projects */}
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
                </Grid>
            </Grid>

        </Container>

        </Box>
    );
}