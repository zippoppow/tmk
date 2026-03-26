'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check authentication status
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/auth/me');
                if (!response.ok) {
                    router.push('/login');
                    return;
                }
                const userData = await response.json();
                setUser(userData);
            } catch (error) {
                console.error('Auth check failed:', error);
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
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
                <Typography variant="body2" color="textSecondary">
                    Project management coming soon...
                </Typography>
            </Box>
        </Container>
    );
}