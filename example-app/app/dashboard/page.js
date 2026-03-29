'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { buildTeachableLogoutUrl } from '../components/lessonActivityHelpers';
import {
    Container,
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    CircularProgress,
} from '@mui/material';

const AUTH_BYPASS_ENABLED = true;
const AUTH_BYPASS_USER = {
    name: 'Development User',
    email: 'dev@example.com',
};

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (AUTH_BYPASS_ENABLED) {
            setUser(AUTH_BYPASS_USER);
            setLoading(false);
            return;
        }

        // Check authentication status
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/auth/teachable/me', {
                    method: 'GET',
                    credentials: 'include',
                });
                if (!response.ok) {
                    router.push('/login?next=/dashboard');
                    return;
                }
                const userData = await response.json();
                if (!userData?.authenticated) {
                    router.push('/login?next=/dashboard');
                    return;
                }
                setUser(userData.user || null);
            } catch (error) {
                console.error('Auth check failed:', error);
                router.push('/login?next=/dashboard');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    const handleLogout = () => {
        if (AUTH_BYPASS_ENABLED) {
            router.push('/');
            return;
        }

        window.location.href = buildTeachableLogoutUrl('/login?next=/dashboard');
    };

    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (!user) {
        return null;
    }

    const lessonActivities = [
        { name: 'Intro', path: '/lesson-activities/intro', description: 'Create and manage intro lesson activities' },
    ];

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" component="h1">
                    Dashboard
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Typography variant="body1">
                        Welcome, {user.name || user.email}
                    </Typography>
                    <Button variant="outlined" onClick={handleLogout}>
                        Logout
                    </Button>
                </Box>
            </Box>

            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                    Lesson Activities
                </Typography>
                <Grid container spacing={2}>
                    {lessonActivities.map((activity) => (
                        <Grid item xs={12} sm={6} md={4} key={activity.path}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
                                        {activity.name}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                        {activity.description}
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        onClick={() => router.push(activity.path)}
                                    >
                                        Open
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            <Box>
                <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                    Projects
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    Create and manage project records outside individual lesson pages.
                </Typography>
                <Button variant="contained" onClick={() => router.push('/lesson-projects')}>
                    Open Create Project
                </Button>
            </Box>
        </Container>
    );
}