'use client';

import { useEffect, useState } from 'react';
import { useDiyAccess } from '../components/useDiyAccess';
import { useRouter } from 'next/navigation';
import {
    buildTeachableLogoutUrl,
    fetchWithTmkToken,
    resolveTmkApiOrigin,
} from '../components/authHelpers';
import {
    Alert,
    Container,
    Box,
    Chip,
    Typography,
    Button,
    Paper,
    Snackbar,
    Stack,
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
import LessonActivitySelector from '../components/LessonActivitySelector';
import TmkLogo from '../components/TmkLogo';

export default function LessonActivitiesPage() {

    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);
    const [standaloneActivities, setStandaloneActivities] = useState([]);
    const [standaloneLoading, setStandaloneLoading] = useState(false);
    const [notice, setNotice] = useState({ open: false, severity: 'success', message: '' });
    const { hasDiyAccess, authUser: user } = useDiyAccess();

    const showNotice = (severity, message) => {
        setNotice({ open: true, severity, message });
    };

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // No redirect for lack of DIY access; page still renders with disabled actions.

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
                const projectResponse = await fetchWithTmkToken(DIY_PROJECTS_ENDPOINT, { method: 'GET' });
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
        window.location.href = buildTeachableLogoutUrl('/login?next=/lesson-activities');
    };

    if (!isMounted || !user) {
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

    const isAuthenticated = Boolean(user);

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
            component="main"
            sx={{
                minHeight: '100vh',
                py: { xs: 2, md: 4 },
                px: 1,
                background: 'linear-gradient(135deg, #edf2ff 0%, #f8faff 100%)',
            }}
        >
            <Container maxWidth="xl">
                <Box sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-start' }, alignItems: 'flex-end', pr: { xs: 0, md: 5 } }}>
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
                        <TmkLogo sx={{ mb: 2 }} />
                        <Typography sx={{ fontSize: '3rem', textTransform: 'uppercase', color: '#000', fontWeight: 700, mb: 1, pl: 2 }}>
                            Lesson Activities
                        </Typography>
                    </Stack>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} sx={{ mb: 1, ml: 'auto' }}>
                        <Button variant="outlined" onClick={() => router.push('/dashboard')} sx={{ textTransform: 'none' }}>
                            Back to Dashboard
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => {
                                if (isAuthenticated) {
                                    handleLogout();
                                    return;
                                }
                                window.location.href = '/login?next=/lesson-activities';
                            }}
                            sx={{ textTransform: 'none' }}
                        >
                            {isAuthenticated ? 'Logout' : 'Login'}
                        </Button>
                    </Stack>
                </Box>

                {!hasDiyAccess && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Active enrollment in the DIY course is required to access Lesson Activities and Lesson Projects.
                    </Alert>
                )}

                <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2.5, mb: 2 }}>
                    <Typography sx={{ fontSize: '1.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#000', mb: 0.5 }}>
                        Create a Lesson Activity
                    </Typography>
                    <Typography sx={{ color: '#151618', fontSize: '0.95rem', mb: 2, maxWidth: 800 }}>
                        Choose a lesson activity type to create and manage standalone activities.
                    </Typography>
                    {hasDiyAccess ? (
                        <LessonActivitySelector activities={lessonActivities} onOpen={handleCreateNewActivity} />
                    ) : (
                        <Button variant="contained" disabled>
                            Enrollment Required
                        </Button>
                    )}
                </Paper>

                <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2.5, mb: 2 }}>
                    <Typography sx={{ fontSize: '2rem', textTransform: 'uppercase', color: '#000', fontWeight: 700, mb: 0 }}>
                        Your Standalone Lesson Activities
                    </Typography>
                    <Typography sx={{ color: '#151618', fontSize: '0.95rem', mb: 4 }}>
                        Open or remove your standalone lesson activities.
                    </Typography>
                    {!hasDiyAccess ? (
                        <Typography sx={{ color: '#666', fontSize: '0.95rem' }}>Active DIY enrollment required.</Typography>
                    ) : standaloneLoading ? (
                        <Typography sx={{ color: '#999', fontSize: '0.83rem', mt: 1 }}>Loading lesson activities...</Typography>
                    ) : standaloneActivities.length === 0 ? (
                        <Typography sx={{ color: '#bbb', fontSize: '1.2rem', textAlign: 'center', py: 2 }}>
                            No standalone lesson activities found.
                        </Typography>
                    ) : (
                        <Stack spacing={3} sx={{ width: '100%', minWidth: 0 }}>
                            {standaloneActivities.map((activity, index) => {
                                const route = getActivityPath(activity);
                                const activityName = String(activity?.['lesson-name'] || 'Untitled Lesson Activity');
                                const activityType = String(activity?.['tmk-template'] || activity?.formName || 'unknown-template');
                                return (
                                    <Box
                                        key={String(activity?.id || `${activityName}-${index}`)}
                                        sx={{
                                            border: '1px solid',
                                            borderColor: '#060279',
                                            borderRadius: 2,
                                            p: 1.5,
                                            backgroundColor: '#eeeff9',
                                        }}
                                    >
                                        <Stack direction="row" alignItems="center" spacing={0.8}>
                                            <Stack direction="column" spacing={0.2} sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, fontStyle: 'italic' }} noWrap title={activityName}>
                                                    ACTIVITY: {activityName}
                                                </Typography>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <Chip
                                                        label={activityType}
                                                        size="small"
                                                        sx={{
                                                            height: 18,
                                                            fontSize: '0.79rem',
                                                            backgroundColor: '#e8e8e8',
                                                            color: '#3f37c9',
                                                        }}
                                                    />
                                                </Stack>
                                            </Stack>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                disabled={!route}
                                                onClick={() => handleManageStandalone(activity)}
                                                sx={{
                                                    textTransform: 'none',
                                                    color: '#3f37c9',
                                                    borderColor: '#3f37c9',
                                                    backgroundColor: '#fff',
                                                    '&:hover': {
                                                        color: '#fff',
                                                        borderColor: '#2f2a99',
                                                        backgroundColor: '#3f37c9',
                                                    },
                                                }}
                                            >
                                                Manage
                                            </Button>
                                            <Button
                                                size="small"
                                                color="error"
                                                variant="contained"
                                                onClick={() => handleDeleteStandalone(activity)}
                                                sx={{ textTransform: 'none' }}
                                            >
                                                Delete
                                            </Button>
                                        </Stack>
                                    </Box>
                                );
                            })}
                        </Stack>
                    )}
                </Paper>
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