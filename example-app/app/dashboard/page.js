'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { buildTeachableLogoutUrl, fetchAuthenticatedUser, fetchWithUserToken, resolveTmkApiOrigin } from '../components/authHelpers';
import {
    Alert,
    Container,
    Box,
    Typography,
    Button,
    Paper,
    Snackbar,
    Stack,
    CircularProgress,
} from '@mui/material';
import {
    clearFormSessionData,
    DIY_PROJECTS_ENDPOINT,
    deleteLessonActivityById,
    extractDiyProjectsFromResponse,
    isStandaloneLessonActivity,
    listLessonActivities,
} from '../components/lessonActivityHelpers';
import AuthDebugPanel from '../components/AuthDebugPanel';
import LessonActivitySelector from '../components/LessonActivitySelector';

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [standaloneActivities, setStandaloneActivities] = useState([]);
    const [standaloneLoading, setStandaloneLoading] = useState(false);
    const [notice, setNotice] = useState({ open: false, severity: 'success', message: '' });

    const showNotice = (severity, message) => {
        setNotice({ open: true, severity, message });
    };

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

    const loadStandaloneActivities = async () => {
        if (!user) {
            return;
        }

        setStandaloneLoading(true);
        try {
            const apiOrigin = resolveTmkApiOrigin();
            const records = await listLessonActivities(apiOrigin);

            let projectActivityIds = new Set();
            let projectActivityKeys = new Set();
            try {
                const projectResponse = await fetchWithUserToken(apiOrigin, DIY_PROJECTS_ENDPOINT, { method: 'GET' });
                if (projectResponse.ok) {
                    const projectPayload = await projectResponse.json().catch(() => ({}));
                    const projects = extractDiyProjectsFromResponse(projectPayload);
                    const ids = new Set();
                    const keys = new Set();

                    projects.forEach((project) => {
                        const activities = Array.isArray(project?.['lesson-activities']) ? project['lesson-activities'] : [];
                        activities.forEach((activity) => {
                            const id = String(activity?.id || '').trim();
                            if (id) {
                                ids.add(id);
                            }

                            const template = String(activity?.['tmk-template'] || activity?.formName || '').trim();
                            const name = String(activity?.['lesson-name'] || '').trim();
                            if (template && name) {
                                keys.add(`${template}::${name}`);
                            }
                        });
                    });

                    projectActivityIds = ids;
                    projectActivityKeys = keys;
                }
            } catch (projectError) {
                console.error('Failed to load diy-project associations for standalone filter:', projectError);
            }

            const nonProjectRecords = records.filter((record) => {
                if (!isStandaloneLessonActivity(record)) {
                    return false;
                }

                const id = String(record?.id || '').trim();
                if (id && projectActivityIds.has(id)) {
                    return false;
                }

                const template = String(record?.['tmk-template'] || record?.formName || '').trim();
                const name = String(record?.['lesson-name'] || '').trim();
                if (template && name && projectActivityKeys.has(`${template}::${name}`)) {
                    return false;
                }

                return true;
            });

            if (process.env.NODE_ENV !== 'production') {
                console.log('[Dashboard] Lesson activity association summary', {
                    total: records.length,
                    standalone: nonProjectRecords.length,
                    associated: records.length - nonProjectRecords.length,
                    projectActivityIds: projectActivityIds.size,
                    projectActivityKeys: projectActivityKeys.size,
                });
            }
            setStandaloneActivities(nonProjectRecords);
        } catch (error) {
            console.error('Failed to load standalone lesson activities:', error);
            setStandaloneActivities([]);
        } finally {
            setStandaloneLoading(false);
        }
    };

    useEffect(() => {
        loadStandaloneActivities();
    }, [user]);

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

    const getActivityPath = (activityRecord) => {
        const templateName = String(activityRecord?.['tmk-template'] || activityRecord?.formName || '').trim();
        const match = lessonActivities.find((activity) => activity.path.endsWith(`/${templateName}`));
        return match?.path || null;
    };

    const handleManageStandalone = (activityRecord) => {
        const path = getActivityPath(activityRecord);
        if (!path) {
            showNotice('error', 'No page is implemented yet for this activity type.');
            return;
        }

        const activityId = String(activityRecord?.id || '').trim();
        if (!activityId) {
            router.push(path);
            return;
        }

        router.push(`${path}?activityId=${encodeURIComponent(activityId)}`);
    };

    const handleDeleteStandalone = async (activityRecord) => {
        const activityId = String(activityRecord?.id || '').trim();
        if (!activityId) {
            return;
        }

        const shouldDelete = window.confirm(`Delete "${activityRecord?.['lesson-name'] || 'Untitled Lesson Activity'}"?`);
        if (!shouldDelete) {
            return;
        }

        try {
            const response = await deleteLessonActivityById(resolveTmkApiOrigin(), activityId);
            if (!response.ok) {
                showNotice('error', 'Delete failed. Please try again.');
                return;
            }

            setStandaloneActivities((prev) => prev.filter((activity) => String(activity?.id || '') !== activityId));
            showNotice('success', `"${activityRecord?.['lesson-name'] || 'Lesson Activity'}" deleted.`);
        } catch (error) {
            console.error('Failed to delete standalone lesson activity:', error);
            showNotice('error', 'Delete failed. Please try again.');
        }
    };

    const handleCreateNewActivity = (activity) => {
        const formName = String(activity?.path || '').split('/').filter(Boolean).pop();
        if (formName) {
            clearFormSessionData(formName);
        }
        router.push(activity.path);
    };

    return (
        <>
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
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'flex-start' }}>
                    {/* Selector — left column on desktop */}
                    <Box sx={{ width: { xs: '100%', md: '50%' }, flexShrink: 0 }}>
                        <LessonActivitySelector
                            activities={lessonActivities}
                            onOpen={handleCreateNewActivity}
                        />
                    </Box>

                    {/* Standalone activities list — right column on desktop */}
                    <Box sx={{ flex: 1, width: { xs: '100%', md: 'auto' } }}>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                            Your Standalone Lesson Activities
                        </Typography>
                        {standaloneLoading ? (
                            <Typography variant="body2" color="textSecondary">Loading lesson activities...</Typography>
                        ) : standaloneActivities.length === 0 ? (
                            <Typography variant="body2" color="textSecondary">No standalone lesson activities found.</Typography>
                        ) : (
                            <Stack spacing={1}>
                                {standaloneActivities.map((activity, index) => {
                                    const route = getActivityPath(activity);
                                    return (
                                        <Paper
                                            key={String(activity?.id || `${activity?.['lesson-name'] || 'activity'}-${index}`)}
                                            sx={{ p: 1.25, border: '1px solid #e6ebf2', borderRadius: 1.5 }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                                                <Box>
                                                    <Typography sx={{ fontWeight: 600 }}>
                                                        {String(activity?.['lesson-name'] || 'Untitled Lesson Activity')}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        {String(activity?.['tmk-template'] || activity?.formName || 'unknown-template')}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        disabled={!route}
                                                        onClick={() => handleManageStandalone(activity)}
                                                    >
                                                        Manage
                                                    </Button>
                                                    <Button size="small" color="error" variant="outlined" onClick={() => handleDeleteStandalone(activity)}>
                                                        Delete
                                                    </Button>
                                                </Box>
                                            </Box>
                                        </Paper>
                                    );
                                })}
                            </Stack>
                        )}
                    </Box>
                </Box>
            </Box>

        </Container>

        <Snackbar
            open={notice.open}
            autoHideDuration={3000}
            onClose={() => setNotice((prev) => ({ ...prev, open: false }))}
        >
            <Alert
                severity={notice.severity}
                variant="filled"
                onClose={() => setNotice((prev) => ({ ...prev, open: false }))}
            >
                {notice.message}
            </Alert>
        </Snackbar>
        </>
    );
}