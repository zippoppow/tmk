'use client';

import { useEffect, useState } from 'react';
import { useDiyAccess } from '../components/useDiyAccess';
import { useRouter } from 'next/navigation';
import {
    buildTeachableLogoutUrl,
    fetchWithUserToken,
    resolveTmkApiOrigin,
} from '../components/authHelpers';
import {
    Alert,
    Container,
    Box,
    Grid,
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
    getAllStoredProjects,
    isStandaloneLessonActivity,
    listLessonActivities,
} from '../components/lessonActivityHelpers';
import AuthDebugPanel from '../components/AuthDebugPanel';
import LessonActivitySelector from '../components/LessonActivitySelector';
import TmkLogo from '../components/TmkLogo';

export default function DashboardPage() {

    const router = useRouter();
    const [user, setUser] = useState(null);
    const [standaloneActivities, setStandaloneActivities] = useState([]);
    const [standaloneLoading, setStandaloneLoading] = useState(false);
    const [notice, setNotice] = useState({ open: false, severity: 'success', message: '' });
    const { hasDiyAccess, loading: diyLoading, authUser } = useDiyAccess();

    const showNotice = (severity, message) => {
        setNotice({ open: true, severity, message });
    };

    useEffect(() => {
        if (authUser) {
            setUser(authUser);
        }
    }, [authUser]);

    // No redirect for lack of DIY access; dashboard always renders

    const loadStandaloneActivities = async () => {
        if (!user || !hasDiyAccess) {
            setStandaloneActivities([]);
            return;
        }

        setStandaloneLoading(true);
        try {
            const apiOrigin = resolveTmkApiOrigin();
            const records = await listLessonActivities(apiOrigin);

            let projectActivityIds = new Set();
            let projectActivityKeys = new Set();

            const localProjects = getAllStoredProjects().filter(
                (project) => String(project?.formName || '').trim() === 'lesson-activities-project'
            );
            localProjects.forEach((project) => {
                const activities = Array.isArray(project?.lessonActivities) ? project.lessonActivities : [];
                activities.forEach((activity) => {
                    const id = String(activity?.id || '').trim();
                    if (id) {
                        projectActivityIds.add(id);
                    }

                    const template = String(activity?.['tmk-template'] || activity?.formName || '').trim();
                    const name = String(activity?.['lesson-name'] || '').trim();
                    if (template && name) {
                        projectActivityKeys.add(`${template}::${name}`);
                    }
                });
            });
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

                    projectActivityIds = new Set([...projectActivityIds, ...ids]);
                    projectActivityKeys = new Set([...projectActivityKeys, ...keys]);
                }
            } catch (projectError) {
                // eslint-disable-next-line no-console
                console.error('Failed to load diy-project associations for standalone filter:', projectError);
            }

            const nonProjectRecords = records.filter((record) => {
                const template = String(record?.['tmk-template'] || record?.formName || '').trim();

                // Guard against project-container pseudo records accidentally returned by sync flows.
                if (template === 'lesson-activities-project') {
                    return false;
                }

                if (!isStandaloneLessonActivity(record)) {
                    return false;
                }

                const id = String(record?.id || '').trim();
                if (id && projectActivityIds.has(id)) {
                    return false;
                }

                const name = String(record?.['lesson-name'] || '').trim();
                if (template && name && projectActivityKeys.has(`${template}::${name}`)) {
                    return false;
                }

                return true;
            });
            setStandaloneActivities(nonProjectRecords);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to load standalone lesson activities:', error);
            setStandaloneActivities([]);
        } finally {
            setStandaloneLoading(false);
        }
    };

    useEffect(() => {
        loadStandaloneActivities();
    }, [user, hasDiyAccess]);

    const handleLogout = () => {
        window.location.href = buildTeachableLogoutUrl('/login?next=/dashboard');
    };

    if (diyLoading) {
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
        if (!hasDiyAccess) {
            showNotice('warning', 'Active DIY course enrollment is required to access lesson activities.');
            return;
        }

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
        if (!hasDiyAccess) {
            showNotice('warning', 'Active DIY course enrollment is required to access lesson activities.');
            return;
        }

        const formName = String(activity?.path || '').split('/').filter(Boolean).pop();
        if (formName) {
            clearFormSessionData(formName);
        }
        router.push(activity.path);
    };

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
            <AuthDebugPanel />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <TmkLogo sx={{ mb: 2 }} priority />
                <Typography variant="h4" component="h1">
                   DASHBOARD
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

            <Grid container spacing={{ xs: 2, md: 3 }} alignItems="flex-start" sx={{ mb: 4 }}>
                {/* Left column: Lesson Activities + Standalone */}
                <Grid item xs={12} md={8} sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                        {hasDiyAccess ? (
                            <LessonActivitySelector
                                activities={lessonActivities}
                                onOpen={handleCreateNewActivity}
                            />
                        ) : (
                            <Button variant="contained" disabled>
                                Enrollment Required
                            </Button>
                        )}
                    </Paper>

                    <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid #224c88' }}>
                        <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
                            Your Standalone Lesson Activities
                        </Typography>
                            {!hasDiyAccess ? (
                                <Typography variant="body2" color="textSecondary">Active DIY enrollment required.</Typography>
                            ) : standaloneLoading ? (
                                <Typography variant="body2" color="textSecondary">Loading lesson activities...</Typography>
                            ) : standaloneActivities.length === 0 ? (
                                <Typography variant="body2" color="textSecondary">No standalone lesson activities found.</Typography>
                            ) : (
                                <Stack spacing={1} sx={{ width: '100%', minWidth: 0 }}>
                                    {standaloneActivities.map((activity, index) => {
                                        const route = getActivityPath(activity);
                                        return (
                                            <Paper
                                                key={String(activity?.id || `${activity?.['lesson-name'] || 'activity'}-${index}`)}
                                                sx={{ p: 1.5, border: '1px solid #e6ebf2', borderRadius: 1.5, width: '100%', minWidth: 0 }}
                                            >
                                                <Box
                                                    sx={{
                                                        display: 'grid',
                                                        gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) auto' },
                                                        alignItems: { xs: 'flex-start', lg: 'center' },
                                                        gap: 1.5,
                                                        width: '100%',
                                                        minWidth: 0,
                                                    }}
                                                >
                                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                                        <Typography sx={{ fontWeight: 600, lineHeight: 1.3, wordBreak: 'break-word' }}>
                                                            {String(activity?.['lesson-name'] || 'Untitled Lesson Activity')}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary" sx={{ wordBreak: 'break-word' }}>
                                                            {String(activity?.['tmk-template'] || activity?.formName || 'unknown-template')}
                                                        </Typography>
                                                    </Box>
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            gap: 1,
                                                            flexWrap: 'wrap',
                                                            justifyContent: { xs: 'flex-start', lg: 'flex-end' },
                                                            maxWidth: '100%',
                                                        }}
                                                    >
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
                    </Paper>
                </Grid>

                {/* Right column: Projects */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid #224c88' }}>
                        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                            Projects
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
        </Box>
    );
}