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
    Checkbox,
    Chip,
    CircularProgress,
    Typography,
    Button,
    Paper,
    Snackbar,
    Stack,
} from '@mui/material';
import {
    buildLessonActivityUpsertPayload,
    clearFormSessionData,
    createLessonActivityId,
    deleteStandaloneDraftByActivityId,
    deleteStandaloneDraftByLocalId,
    DIY_PROJECTS_ENDPOINT,
    deleteLessonActivityById,
    extractDiyProjectsFromResponse,
    getAllStoredProjects,
    isStandaloneLessonActivity,
    listStandaloneDrafts,
    listLessonActivities,
    upsertLessonActivity,
    upsertStandaloneDraft,
} from '../components/lessonActivityHelpers';
import LessonActivitySelector from '../components/LessonActivitySelector';
import TmkLogo from '../components/TmkLogo';

export default function LessonActivitiesPage() {

    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);
    const [savedStandaloneActivities, setSavedStandaloneActivities] = useState([]);
    const [stagedStandaloneActivities, setStagedStandaloneActivities] = useState([]);
    const [standaloneLoading, setStandaloneLoading] = useState(false);
    const [selectedSavedActivityIds, setSelectedSavedActivityIds] = useState([]);
    const [selectedStagedLocalDraftIds, setSelectedStagedLocalDraftIds] = useState([]);
    const [isSavingAllStaged, setIsSavingAllStaged] = useState(false);
    const [notice, setNotice] = useState({ open: false, severity: 'success', message: '' });
    const { hasDiyAccess, authUser: user, loading: authLoading } = useDiyAccess();

    const showNotice = (severity, message) => {
        setNotice({ open: true, severity, message });
    };

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const isAuthenticated = Boolean(user);

    const normalizeActivityInputData = (value) => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            return {};
        }
        return value;
    };

    const hasLocalStandaloneChanges = (draftRecord, savedRecord) => {
        const draftName = String(draftRecord?.['lesson-name'] || '').trim();
        const savedName = String(savedRecord?.['lesson-name'] || '').trim();
        if (draftName !== savedName) {
            return true;
        }

        const draftTemplate = String(draftRecord?.['tmk-template'] || draftRecord?.formName || '').trim();
        const savedTemplate = String(savedRecord?.['tmk-template'] || savedRecord?.formName || '').trim();
        if (draftTemplate !== savedTemplate) {
            return true;
        }

        const draftInputData = JSON.stringify(normalizeActivityInputData(draftRecord?.['lesson-input-data'] || {}));
        const savedInputData = JSON.stringify(normalizeActivityInputData(savedRecord?.['lesson-input-data'] || {}));
        return draftInputData !== savedInputData;
    };

    useEffect(() => {
        if (!authLoading && isAuthenticated && !hasDiyAccess) {
            router.replace('/dashboard');
        }
    }, [authLoading, isAuthenticated, hasDiyAccess, router]);

    const loadStandaloneActivities = async () => {
        const localDraftRecords = listStandaloneDrafts().filter((record) => {
            const template = String(record?.['tmk-template'] || record?.formName || '').trim();
            return Boolean(template) && template !== 'lesson-activities-project';
        });

        if (!user || !hasDiyAccess) {
            setSavedStandaloneActivities([]);
            setStagedStandaloneActivities(localDraftRecords.filter((record) => !String(record?.id || '').trim()));
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

            const savedRecords = records.filter((record) => {
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

            const savedById = new Set(
                savedRecords
                    .map((record) => String(record?.id || '').trim())
                    .filter(Boolean)
            );

            const savedRecordById = new Map(
                savedRecords
                    .map((record) => [String(record?.id || '').trim(), record])
                    .filter(([id]) => Boolean(id))
            );

            const dirtyLinkedIds = new Set();
            localDraftRecords.forEach((record) => {
                const linkedId = String(record?.id || '').trim();
                if (!linkedId) {
                    return;
                }

                const savedRecord = savedRecordById.get(linkedId);
                if (!savedRecord) {
                    return;
                }

                if (hasLocalStandaloneChanges(record, savedRecord)) {
                    dirtyLinkedIds.add(linkedId);
                }
            });

            const stagedRecords = localDraftRecords.filter((record) => {
                const template = String(record?.['tmk-template'] || record?.formName || '').trim();
                if (!template || template === 'lesson-activities-project') {
                    return false;
                }

                const linkedId = String(record?.id || '').trim();
                if (!linkedId) {
                    return true;
                }

                if (!savedById.has(linkedId)) {
                    return true;
                }

                return dirtyLinkedIds.has(linkedId);
            });

            setSavedStandaloneActivities(
                savedRecords.filter((record) => !dirtyLinkedIds.has(String(record?.id || '').trim()))
            );
            setStagedStandaloneActivities(stagedRecords);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to load standalone lesson activities:', error);
            setSavedStandaloneActivities([]);
            setStagedStandaloneActivities(localDraftRecords.filter((record) => !String(record?.id || '').trim()));
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

    if (!isMounted) {
        return null;
    }

    if (authLoading) {
        return (
            <Box
                sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(76, 76, 76, 0.2)',
                    zIndex: 9999,
                }}
            >
                <Stack alignItems="center" spacing={2}>
                    <CircularProgress size={60} />
                    <Typography sx={{ color: '#aa34e5', fontSize: '1.1rem' }}>Checking login...</Typography>
                </Stack>
            </Box>
        );
    }

    const lessonActivities = [
        { name: 'Intro', path: '/lesson-activities/intro', description: 'Create and manage intro lesson activities', previewImage: '/lesson-activities/preview-images/Intro.png' },
        {
            name: 'Chameleon Prefixes',
            path: '/lesson-activities/chameleon-prefixes',
            description: 'Practice prefix transformations and word building',
            previewImage: '/lesson-activities/preview-images/ChameleonPrefixes.png',
        },
        { name: 'Common Base Word', path: '/lesson-activities/common-base-word', description: 'Identify and group common base words', previewImage: '/lesson-activities/preview-images/CommonBaseWord.png' },
        { name: 'Constructor / Deconstructor', path: '/lesson-activities/constructor-deconstructor', description: 'Build and break apart words using morph parts', previewImage: '/lesson-activities/preview-images/ConstructorDeconstructor.png' },
        { name: 'Fill In The Morph - Connected Text', path: '/lesson-activities/fill-in-the-morph-paragraphs', description: 'Fill in the blank spots in the connected text with the correct word from the word list.', previewImage: '/lesson-activities/preview-images/FillInTheMorphParagraphsSentences.png' },
        { name: 'Morph Match - Definitions', path: '/lesson-activities/morph-match-definitions', description: 'Match morph words to numbered definitions', previewImage: '/lesson-activities/preview-images/MorphMatchDefinitions.png' },
        { name: 'Morph Match - Related Words', path: '/lesson-activities/morph-match-related-words', description: 'Pair focus words with related words', previewImage: '/lesson-activities/preview-images/MorphMatchRelatedWords.png' },
        { name: 'Morph Morph Match', path: '/lesson-activities/morph-morph-match', description: 'Compare morph patterns and complete pair matches', previewImage: '/lesson-activities/preview-images/MorphMorphMatch.png' },
        { name: 'Morph Sort', path: '/lesson-activities/morph-sort', description: 'Sort words into morph-based categories', previewImage: '/lesson-activities/preview-images/MorphSort.png' },
        { name: 'Morph Which', path: '/lesson-activities/morph-which', description: 'Select and compare best morph options per prompt', previewImage: '/lesson-activities/preview-images/MorphWhich.png' },
        { name: 'Part of Speech Sort', path: '/lesson-activities/part-of-speech', description: 'Sort morph words by part of speech', previewImage: '/lesson-activities/preview-images/PartOfSpeechSort.png' },
        { name: 'Word Builder', path: '/lesson-activities/word-builder', description: 'Combine prefixes, bases, and suffixes to build words', previewImage: '/lesson-activities/preview-images/WordBuilder.png' },
        { name: 'Word Meaning', path: '/lesson-activities/word-meaning', description: 'Infer and record meanings from morph clues', previewImage: '/lesson-activities/preview-images/WordMeaning.png' },
    ];

    const formatLastModifiedTimestamp = (value) => {
        const numeric = Number(value);
        if (!Number.isFinite(numeric) || numeric <= 0) {
            return 'Unknown';
        }

        try {
            return new Date(numeric).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
            });
        } catch {
            return 'Unknown';
        }
    };

    const getActivityPath = (activityRecord) => {
        const templateName = String(activityRecord?.['tmk-template'] || activityRecord?.formName || '').trim();
        const match = lessonActivities.find((activity) => activity.path.endsWith(`/${templateName}`));
        return match?.path || null;
    };

    const getActivityTypeLabel = (templateName) => {
        const normalizedTemplate = String(templateName || '').trim();
        const match = lessonActivities.find((activity) => activity.path.endsWith(`/${normalizedTemplate}`));
        return match?.name || normalizedTemplate || 'Unknown';
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
        const localDraftId = String(activityRecord?.localDraftId || '').trim();
        const params = new URLSearchParams();

        if (activityId) {
            params.set('activityId', activityId);
        }
        if (localDraftId) {
            params.set('localDraftId', localDraftId);
        }

        const suffix = params.toString();
        router.push(suffix ? `${path}?${suffix}` : path);
    };

    const handleDeleteStandalone = async (activityRecord) => {
        const activityId = String(activityRecord?.id || '').trim();
        if (!activityId) {
            return;
        }

        const templateName = String(activityRecord?.['tmk-template'] || activityRecord?.formName || '').trim();

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

            deleteStandaloneDraftByActivityId(activityId);
            if (templateName) {
                clearFormSessionData(templateName);
            }
            setSavedStandaloneActivities((prev) => prev.filter((activity) => String(activity?.id || '') !== activityId));
            setStagedStandaloneActivities((prev) => prev.filter((activity) => String(activity?.id || '') !== activityId));
            setSelectedSavedActivityIds((prev) => prev.filter((id) => id !== activityId));
            showNotice('success', `"${activityRecord?.['lesson-name'] || 'Lesson Activity'}" deleted.`);
        } catch (error) {
            console.error('Failed to delete standalone lesson activity:', error);
            showNotice('error', 'Delete failed. Please try again.');
        }
    };

    const handleDeleteStagedStandalone = (activityRecord) => {
        const localDraftId = String(activityRecord?.localDraftId || '').trim();
        if (!localDraftId) {
            return;
        }

        const templateName = String(activityRecord?.['tmk-template'] || activityRecord?.formName || '').trim();

        const shouldDelete = window.confirm(`Delete local draft "${activityRecord?.['lesson-name'] || 'Untitled Lesson Activity'}"?`);
        if (!shouldDelete) {
            return;
        }

        deleteStandaloneDraftByLocalId(localDraftId);
        if (templateName) {
            clearFormSessionData(templateName);
        }
        setStagedStandaloneActivities((prev) => prev.filter((activity) => String(activity?.localDraftId || '') !== localDraftId));
        setSelectedStagedLocalDraftIds((prev) => prev.filter((id) => id !== localDraftId));
        showNotice('success', 'Staged local activity deleted.');
    };

    const handleLaunchStandaloneSlideshow = () => {
        if (!hasDiyAccess) {
            showNotice('warning', 'Active DIY course enrollment is required to present lesson activities.');
            return;
        }

        const selectedIds = [...new Set(selectedSavedActivityIds)]
            .map((id) => String(id || '').trim())
            .filter(Boolean);

        const selectedLocalDraftIds = [...new Set(selectedStagedLocalDraftIds)]
            .map((id) => String(id || '').trim())
            .filter(Boolean);

        if (selectedIds.length === 0 && selectedLocalDraftIds.length === 0) {
            showNotice('error', 'Select at least one staged or saved lesson activity to start a slideshow.');
            return;
        }

        const params = new URLSearchParams();
        if (selectedIds.length > 0) {
            params.set('standaloneIds', selectedIds.join(','));
        }
        if (selectedLocalDraftIds.length > 0) {
            params.set('localDraftIds', selectedLocalDraftIds.join(','));
        }
        router.push(`/lesson-activities/slideshow?${params.toString()}`);
    };

    const handleSaveAllStagedActivities = async () => {
        if (!hasDiyAccess) {
            showNotice('warning', 'Active DIY course enrollment is required to save lesson activities.');
            return;
        }

        if (!isAuthenticated) {
            showNotice('error', 'Login with Teachable to save staged lesson activities.');
            return;
        }

        const recordsToSave = stagedStandaloneActivities.filter((record) => {
            const template = String(record?.['tmk-template'] || record?.formName || '').trim();
            return Boolean(template) && template !== 'lesson-activities-project';
        });

        if (recordsToSave.length === 0) {
            showNotice('info', 'No staged activities to save.');
            return;
        }

        setIsSavingAllStaged(true);
        const apiOrigin = resolveTmkApiOrigin();
        let successCount = 0;
        let failureCount = 0;

        try {
            for (const record of recordsToSave) {
                const template = String(record?.['tmk-template'] || record?.formName || '').trim();
                const activityId = String(record?.id || createLessonActivityId()).trim();
                const lessonName = String(record?.['lesson-name'] || 'Untitled Lesson Activity').trim() || 'Untitled Lesson Activity';
                const lessonInputData = normalizeActivityInputData(record?.['lesson-input-data'] || {});
                const createdAt = Number(record?.['created-at']) || Date.now();

                const payload = buildLessonActivityUpsertPayload({
                    id: activityId,
                    template,
                    lessonName,
                    lessonInputData,
                    createdAt,
                    modifiedAt: Date.now(),
                    extra: {
                        formName: template,
                    },
                });

                const response = await upsertLessonActivity(apiOrigin, payload);
                if (!response.ok) {
                    failureCount += 1;
                    continue;
                }

                upsertStandaloneDraft({
                    ...record,
                    id: activityId,
                    formName: template,
                    'tmk-template': template,
                    'lesson-name': lessonName,
                    'lesson-input-data': lessonInputData,
                    'created-at': createdAt,
                    'modified-at': Date.now(),
                    savedToApi: true,
                });
                successCount += 1;
            }

            await loadStandaloneActivities();

            if (failureCount === 0) {
                showNotice('success', `Saved ${successCount} staged activit${successCount === 1 ? 'y' : 'ies'} to the backend.`);
            } else if (successCount > 0) {
                showNotice('warning', `Saved ${successCount} staged activit${successCount === 1 ? 'y' : 'ies'}, but ${failureCount} failed.`);
            } else {
                showNotice('error', 'Could not save staged activities. Please try again.');
            }
        } catch (error) {
            console.error('Failed to save staged activities:', error);
            showNotice('error', 'Could not save staged activities. Please try again.');
        } finally {
            setIsSavingAllStaged(false);
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
                        Select, open, present, or remove your standalone lesson activities. Staged activities are local-only drafts. Saved activities are synced to the API.
                    </Typography>
                    {!hasDiyAccess ? (
                        <Typography sx={{ color: '#666', fontSize: '0.95rem' }}>Active DIY enrollment required.</Typography>
                    ) : standaloneLoading ? (
                        <Typography sx={{ color: '#999', fontSize: '0.83rem', mt: 1 }}>Loading lesson activities...</Typography>
                    ) : stagedStandaloneActivities.length === 0 && savedStandaloneActivities.length === 0 ? (
                        <Typography sx={{ color: '#bbb', fontSize: '1.2rem', textAlign: 'center', py: 2 }}>
                            No standalone lesson activities found.
                        </Typography>
                    ) : (
                        <Stack spacing={3} sx={{ width: '100%', minWidth: 0 }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="flex-end" alignItems={{ xs: 'stretch', sm: 'center' }}>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={handleLaunchStandaloneSlideshow}
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
                                    Present Selected Activities
                                </Button>
                                <Button
                                    size="small"
                                    variant="contained"
                                    color="success"
                                    disabled={isSavingAllStaged || stagedStandaloneActivities.length === 0}
                                    onClick={handleSaveAllStagedActivities}
                                    sx={{ textTransform: 'none' }}
                                >
                                    {isSavingAllStaged ? 'Saving Staged...' : 'Save All Staged Activities'}
                                </Button>
                            </Stack>
                            <Typography sx={{ fontSize: '1.15rem', fontWeight: 700, color: '#2f3a4a' }}>
                                Staged Locally
                            </Typography>
                            {stagedStandaloneActivities.length === 0 && (
                                <Typography sx={{ color: '#7a8190', fontSize: '0.92rem' }}>
                                    No staged local activities.
                                </Typography>
                            )}
                            {stagedStandaloneActivities.map((activity, index) => {
                                const route = getActivityPath(activity);
                                const activityName = String(activity?.['lesson-name'] || 'Untitled Lesson Activity');
                                const activityType = String(activity?.['tmk-template'] || activity?.formName || 'unknown-template');
                                const activityTypeLabel = getActivityTypeLabel(activityType);
                                const localDraftId = String(activity?.localDraftId || '').trim();
                                const modifiedAtLabel = formatLastModifiedTimestamp(activity?.['modified-at'] || activity?.timestamp);
                                const isSelectedForSlideshow = localDraftId ? selectedStagedLocalDraftIds.includes(localDraftId) : false;
                                return (
                                    <Box
                                        key={String(localDraftId || `${activityName}-${index}`)}
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
                                                <Typography sx={{ fontSize: '0.74rem', color: '#64748b' }}>
                                                    Last modified: {modifiedAtLabel}
                                                </Typography>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <Chip
                                                        label={activityTypeLabel}
                                                        size="small"
                                                        sx={{
                                                            height: 18,
                                                            fontSize: '0.79rem',
                                                            backgroundColor: '#e8e8e8',
                                                            color: '#3f37c9',
                                                        }}
                                                    />
                                                    <Chip
                                                        label="Staged locally"
                                                        size="small"
                                                        sx={{
                                                            height: 18,
                                                            fontSize: '0.72rem',
                                                            backgroundColor: '#fef3c7',
                                                            color: '#92400e',
                                                        }}
                                                    />
                                                </Stack>
                                            </Stack>
                                            <Checkbox
                                                size="small"
                                                disabled={!localDraftId}
                                                checked={isSelectedForSlideshow}
                                                onChange={(event) => {
                                                    if (!localDraftId) {
                                                        return;
                                                    }
                                                    setSelectedStagedLocalDraftIds((prev) => {
                                                        if (event.target.checked) {
                                                            return [...new Set([...prev, localDraftId])];
                                                        }
                                                        return prev.filter((id) => id !== localDraftId);
                                                    });
                                                }}
                                                inputProps={{ 'aria-label': `Add ${activityName} to slideshow` }}
                                            />
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
                                                variant="outlined"
                                                onClick={() => handleDeleteStagedStandalone(activity)}
                                                sx={{ textTransform: 'none' }}
                                            >
                                                Delete Local
                                            </Button>
                                        </Stack>
                                    </Box>
                                );
                            })}

                            <Typography sx={{ fontSize: '1.15rem', fontWeight: 700, color: '#2f3a4a', pt: 1 }}>
                                Saved
                            </Typography>
                            {savedStandaloneActivities.length === 0 && (
                                <Typography sx={{ color: '#7a8190', fontSize: '0.92rem' }}>
                                    No saved standalone activities.
                                </Typography>
                            )}
                            {savedStandaloneActivities.map((activity, index) => {
                                const route = getActivityPath(activity);
                                const activityName = String(activity?.['lesson-name'] || 'Untitled Lesson Activity');
                                const activityType = String(activity?.['tmk-template'] || activity?.formName || 'unknown-template');
                                const activityTypeLabel = getActivityTypeLabel(activityType);
                                const activityId = String(activity?.id || '').trim();
                                const modifiedAtLabel = formatLastModifiedTimestamp(activity?.['modified-at'] || activity?.timestamp);
                                const isSelectedForSlideshow = activityId ? selectedSavedActivityIds.includes(activityId) : false;
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
                                                <Typography sx={{ fontSize: '0.74rem', color: '#64748b' }}>
                                                    Last modified: {modifiedAtLabel}
                                                </Typography>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <Chip
                                                        label={activityTypeLabel}
                                                        size="small"
                                                        sx={{
                                                            height: 18,
                                                            fontSize: '0.79rem',
                                                            backgroundColor: '#e8e8e8',
                                                            color: '#3f37c9',
                                                        }}
                                                    />
                                                    <Chip
                                                        label="Saved"
                                                        size="small"
                                                        sx={{
                                                            height: 18,
                                                            fontSize: '0.72rem',
                                                            backgroundColor: '#dcfce7',
                                                            color: '#166534',
                                                        }}
                                                    />
                                                </Stack>
                                            </Stack>
                                            <Checkbox
                                                size="small"
                                                disabled={!activityId}
                                                checked={isSelectedForSlideshow}
                                                onChange={(event) => {
                                                    if (!activityId) {
                                                        return;
                                                    }
                                                    setSelectedSavedActivityIds((prev) => {
                                                        if (event.target.checked) {
                                                            return [...new Set([...prev, activityId])];
                                                        }
                                                        return prev.filter((id) => id !== activityId);
                                                    });
                                                }}
                                                inputProps={{ 'aria-label': `Add ${activityName} to slideshow` }}
                                            />
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