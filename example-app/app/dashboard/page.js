'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { buildTeachableLogoutUrl, fetchAuthenticatedUser, resolveTmkApiOrigin } from '../components/lessonActivityHelpers';
import {
    Container,
    Box,
    Typography,
    Button,
    CircularProgress,
} from '@mui/material';
import AuthDebugPanel from '../components/AuthDebugPanel';
import LessonActivitySelector from '../components/LessonActivitySelector';

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check authentication status
        const checkAuth = async () => {
            try {
                const userData = await fetchAuthenticatedUser(resolveTmkApiOrigin());
                if (!userData) {
                    router.push('/login?next=/dashboard');
                    return;
                }
                setUser(userData);
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
        window.location.href = buildTeachableLogoutUrl('/login?next=/dashboard', resolveTmkApiOrigin());
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
        {
            name: 'Chameleon Prefixes',
            path: '/lesson-activities/chameleon-prefixes',
            description: 'Practice prefix transformations and word building',
        },
        { name: 'Common Base Word', path: '/lesson-activities/common-base-word', description: 'Identify and group common base words' },
        { name: 'Constructor / Deconstructor', path: '/lesson-activities/constructor-deconstructor', description: 'Build and break apart words using morph parts' },
        { name: 'Fill In The Morph - Paragraphs', path: '/lesson-activities/fill-in-the-morph-paragraphs', description: 'Complete morph pairs and paragraph contexts' },
        { name: 'Morph Match - Definitions', path: '/lesson-activities/morph-match-definitions', description: 'Match morph words to numbered definitions' },
        { name: 'Morph Match - Related Words', path: '/lesson-activities/morph-match-related-words', description: 'Pair focus words with related words' },
        { name: 'Morph Morph Match', path: '/lesson-activities/morph-morph-match', description: 'Compare morph patterns and complete pair matches' },
        { name: 'Morph Sort', path: '/lesson-activities/morph-sort', description: 'Sort words into morph-based categories' },
        { name: 'Morph Which', path: '/lesson-activities/morph-which', description: 'Select and compare best morph options per prompt' },
        { name: 'Part Of Speech', path: '/lesson-activities/part-of-speech', description: 'Sort morph words by part of speech' },
        { name: 'Word Builder', path: '/lesson-activities/word-builder', description: 'Combine prefixes, bases, and suffixes to build words' },
        { name: 'Word Meaning', path: '/lesson-activities/word-meaning', description: 'Infer and record meanings from morph clues' },
    ];

    const displayName = user?.profile?.name || user?.name || user?.profile?.email || user?.email || 'User';

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <AuthDebugPanel />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" component="h1">
                   DIY Dashboard
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Typography variant="body1">
                        Welcome, {displayName}
                    </Typography>
                    <Button variant="outlined" onClick={handleLogout}>
                        Logout
                    </Button>
                </Box>
            </Box>

            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                    Projects
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    Create and manage projects of lesson sequences and activities.
                </Typography>
                <Button variant="contained" onClick={() => router.push('/lesson-projects')}>
                    Go to Projects
                </Button>
            </Box>

            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                    Lesson Activities
                </Typography>
                <LessonActivitySelector
                    activities={lessonActivities}
                    onOpen={(activity) => router.push(activity.path)}
                />
            </Box>

        </Container>
    );
}