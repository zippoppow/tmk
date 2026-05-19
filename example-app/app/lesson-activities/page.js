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
    const [isDeletingSelectedStaged, setIsDeletingSelectedStaged] = useState(false);
    const [isDeletingSelectedSaved, setIsDeletingSelectedSaved] = useState(false);
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

            const optimisticSavedRecords = localDraftRecords.filter((record) => {
                const template = String(record?.['tmk-template'] || record?.formName || '').trim();
                if (!template || template === 'lesson-activities-project') {
                    return false;
                }

                const linkedId = String(record?.id || '').trim();
                if (!linkedId) {
                    return false;
                }

                if (savedById.has(linkedId)) {
                    return false;
                }

                if (!Boolean(record?.savedToApi)) {
                    return false;
                }

                return true;
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
                    return !Boolean(record?.savedToApi);
                }

                return dirtyLinkedIds.has(linkedId);
            });

            setSavedStandaloneActivities(
                [
                    ...savedRecords.filter((record) => !dirtyLinkedIds.has(String(record?.id || '').trim())),
                    ...optimisticSavedRecords,
                ]
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

    useEffect(() => {
        const validSavedIds = new Set(
            savedStandaloneActivities
                .map((activity) => String(activity?.id || '').trim())
                .filter(Boolean)
        );
        setSelectedSavedActivityIds((prev) => prev.filter((id) => validSavedIds.has(String(id || '').trim())));

        const validStagedDraftIds = new Set(
            stagedStandaloneActivities
                .map((activity) => String(activity?.localDraftId || '').trim())
                .filter(Boolean)
        );
        setSelectedStagedLocalDraftIds((prev) => prev.filter((id) => validStagedDraftIds.has(String(id || '').trim())));
    }, [savedStandaloneActivities, stagedStandaloneActivities]);

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
                    backgroundColor: 'rgba(76, 76, 76, 0.09)',
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

    const handleDeleteStagedStandalone = (activityRecord) => {
        const localDraftId = String(activityRecord?.localDraftId || '').trim();
        if (!localDraftId) {
            return;
        }

        setSelectedStagedLocalDraftIds([localDraftId]);
        void handleDeleteSelectedStagedActivities([localDraftId]);
    };

    const handleDeleteSelectedStagedActivities = async (draftIdsOverride = null) => {
        if (!hasDiyAccess) {
            showNotice('warning', 'Active DIY course enrollment is required to delete lesson activities.');
            return;
        }

        const selectedDraftIds = [...new Set(
            Array.isArray(draftIdsOverride) ? draftIdsOverride : selectedStagedLocalDraftIds
        )]
            .map((id) => String(id || '').trim())
            .filter(Boolean);

        if (selectedDraftIds.length === 0) {
            showNotice('info', 'Select at least one staged activity to delete.');
            return;
        }

        const shouldDelete = window.confirm(
            `Delete ${selectedDraftIds.length} staged activit${selectedDraftIds.length === 1 ? 'y' : 'ies'} from local storage?`
        );
        if (!shouldDelete) {
            return;
        }

        setIsDeletingSelectedStaged(true);
        try {
            const selectedIdSet = new Set(selectedDraftIds);
            const selectedRecords = stagedStandaloneActivities.filter((record) => selectedIdSet.has(String(record?.localDraftId || '').trim()));
            const templateNames = new Set(
                selectedRecords
                    .map((record) => String(record?.['tmk-template'] || record?.formName || '').trim())
                    .filter(Boolean)
            );

            selectedDraftIds.forEach((localDraftId) => {
                deleteStandaloneDraftByLocalId(localDraftId);
            });

            templateNames.forEach((templateName) => {
                clearFormSessionData(templateName);
            });

            setStagedStandaloneActivities((prev) => prev.filter((activity) => !selectedIdSet.has(String(activity?.localDraftId || '').trim())));
            setSelectedStagedLocalDraftIds((prev) => prev.filter((id) => !selectedIdSet.has(String(id || '').trim())));
            showNotice('success', `Deleted ${selectedDraftIds.length} staged activit${selectedDraftIds.length === 1 ? 'y' : 'ies'}.`);
        } finally {
            setIsDeletingSelectedStaged(false);
        }
    };

    const handleDeleteSelectedSavedActivities = async (activityIdsOverride = null) => {
        if (!hasDiyAccess) {
            showNotice('warning', 'Active DIY course enrollment is required to delete lesson activities.');
            return;
        }

        if (!isAuthenticated) {
            showNotice('error', 'Login with Teachable to delete saved lesson activities.');
            return;
        }

        const selectedIds = [...new Set(
            Array.isArray(activityIdsOverride) ? activityIdsOverride : selectedSavedActivityIds
        )]
            .map((id) => String(id || '').trim())
            .filter(Boolean);

        if (selectedIds.length === 0) {
            showNotice('info', 'Select at least one saved activity to delete.');
            return;
        }

        const shouldDelete = window.confirm(
            `Delete ${selectedIds.length} saved activit${selectedIds.length === 1 ? 'y' : 'ies'}? This cannot be undone.`
        );
        if (!shouldDelete) {
            return;
        }

        setIsDeletingSelectedSaved(true);
        const selectedIdSet = new Set(selectedIds);
        const selectedRecords = savedStandaloneActivities.filter((record) => selectedIdSet.has(String(record?.id || '').trim()));
        const templateNames = new Set(
            selectedRecords
                .map((record) => String(record?.['tmk-template'] || record?.formName || '').trim())
                .filter(Boolean)
        );

        try {
            const apiOrigin = resolveTmkApiOrigin();
            const deletedIds = new Set();
            let failureCount = 0;

            for (const activityId of selectedIds) {
                try {
                    const response = await deleteLessonActivityById(apiOrigin, activityId);
                    if (!response.ok) {
                        failureCount += 1;
                        continue;
                    }
                    deletedIds.add(activityId);
                    deleteStandaloneDraftByActivityId(activityId);
                } catch {
                    failureCount += 1;
                }
            }

            if (deletedIds.size > 0) {
                templateNames.forEach((templateName) => {
                    clearFormSessionData(templateName);
                });
                setSavedStandaloneActivities((prev) => prev.filter((activity) => !deletedIds.has(String(activity?.id || '').trim())));
                setStagedStandaloneActivities((prev) => prev.filter((activity) => !deletedIds.has(String(activity?.id || '').trim())));
                setSelectedSavedActivityIds((prev) => prev.filter((id) => !deletedIds.has(String(id || '').trim())));
            }

            if (failureCount === 0) {
                showNotice('success', `Deleted ${deletedIds.size} saved activit${deletedIds.size === 1 ? 'y' : 'ies'}.`);
            } else if (deletedIds.size > 0) {
                showNotice('warning', `Deleted ${deletedIds.size} saved activit${deletedIds.size === 1 ? 'y' : 'ies'}, but ${failureCount} failed.`);
            } else {
                showNotice('error', 'Could not delete selected saved activities. Please try again.');
            }
        } finally {
            setIsDeletingSelectedSaved(false);
        }
    };

    const handleDeleteStandalone = (activityRecord) => {
        const activityId = String(activityRecord?.id || '').trim();
        if (!activityId) {
            return;
        }

        setSelectedSavedActivityIds([activityId]);
        void handleDeleteSelectedSavedActivities([activityId]);
    };

    const handleLaunchStagedSlideshow = () => {
        if (!hasDiyAccess) {
            showNotice('warning', 'Active DIY course enrollment is required to present lesson activities.');
            return;
        }

        const selectedLocalDraftIds = [...new Set(selectedStagedLocalDraftIds)]
            .map((id) => String(id || '').trim())
            .filter(Boolean);

        if (selectedLocalDraftIds.length === 0) {
            showNotice('error', 'Select at least one staged lesson activity to start a slideshow.');
            return;
        }

        const params = new URLSearchParams();
        params.set('localDraftIds', selectedLocalDraftIds.join(','));
        router.push(`/lesson-activities/slideshow?${params.toString()}`);
    };

    const handleLaunchSavedSlideshow = () => {
        if (!hasDiyAccess) {
            showNotice('warning', 'Active DIY course enrollment is required to present lesson activities.');
            return;
        }

        const selectedIds = [...new Set(selectedSavedActivityIds)]
            .map((id) => String(id || '').trim())
            .filter(Boolean);

        if (selectedIds.length === 0) {
            showNotice('error', 'Select at least one saved lesson activity to start a slideshow.');
            return;
        }

        const params = new URLSearchParams();
        params.set('standaloneIds', selectedIds.join(','));
        router.push(`/lesson-activities/slideshow?${params.toString()}`);
    };

    const handleSaveSelectedActivities = async () => {
        if (!hasDiyAccess) {
            showNotice('warning', 'Active DIY course enrollment is required to save lesson activities.');
            return;
        }

        if (!isAuthenticated) {
            showNotice('error', 'Login with Teachable to save staged lesson activities.');
            return;
        }

        const selectedDraftIds = new Set(
            selectedStagedLocalDraftIds
                .map((id) => String(id || '').trim())
                .filter(Boolean)
        );

        const recordsToSave = stagedStandaloneActivities.filter((record) => {
            const template = String(record?.['tmk-template'] || record?.formName || '').trim();
            const localDraftId = String(record?.localDraftId || '').trim();
            return Boolean(template)
                && template !== 'lesson-activities-project'
                && Boolean(localDraftId)
                && selectedDraftIds.has(localDraftId);
        });

        if (recordsToSave.length === 0) {
            showNotice('info', 'Select at least one staged activity to save.');
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
                showNotice('success', `Saved ${successCount} selected staged activit${successCount === 1 ? 'y' : 'ies'} to the backend.`);
            } else if (successCount > 0) {
                showNotice('warning', `Saved ${successCount} selected staged activit${successCount === 1 ? 'y' : 'ies'}, but ${failureCount} failed.`);
            } else {
                showNotice('error', 'Could not save selected staged activities. Please try again.');
            }
        } catch (error) {
            console.error('Failed to save selected staged activities:', error);
            showNotice('error', 'Could not save selected staged activities. Please try again.');
        } finally {
            setIsSavingAllStaged(false);
        }
    };

    const selectableStagedLocalDraftIds = stagedStandaloneActivities
        .map((activity) => String(activity?.localDraftId || '').trim())
        .filter(Boolean);
    const selectableSavedIds = savedStandaloneActivities
        .map((activity) => String(activity?.id || '').trim())
        .filter(Boolean);
    const isAllStagedSelected = selectableStagedLocalDraftIds.length > 0 && selectedStagedLocalDraftIds.length === selectableStagedLocalDraftIds.length;
    const isStagedPartiallySelected = selectedStagedLocalDraftIds.length > 0 && selectedStagedLocalDraftIds.length < selectableStagedLocalDraftIds.length;
    const isAllSavedSelected = selectableSavedIds.length > 0 && selectedSavedActivityIds.length === selectableSavedIds.length;
    const isSavedPartiallySelected = selectedSavedActivityIds.length > 0 && selectedSavedActivityIds.length < selectableSavedIds.length;

    const handleToggleSelectAllStagedActivities = (event) => {
        const checked = Boolean(event.target.checked);
        if (checked) {
            setSelectedStagedLocalDraftIds(selectableStagedLocalDraftIds);
            return;
        }
        setSelectedStagedLocalDraftIds([]);
    };

    const handleToggleSelectAllSavedActivities = (event) => {
        const checked = Boolean(event.target.checked);
        if (checked) {
            setSelectedSavedActivityIds(selectableSavedIds);
            return;
        }
        setSelectedSavedActivityIds([]);
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
                            <Typography sx={{ fontSize: '1.15rem', fontWeight: 700, color: '#2f3a4a' }}>
                                Staged Locally
                            </Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="flex-end" alignItems={{ xs: 'stretch', sm: 'center' }}>
                                <Stack direction="row" spacing={0.4} alignItems="center" sx={{ mr: { xs: 0, sm: 1 } }}>
                                    <Checkbox
                                        size="small"
                                        checked={isAllStagedSelected}
                                        indeterminate={isStagedPartiallySelected}
                                        onChange={handleToggleSelectAllStagedActivities}
                                        disabled={selectableStagedLocalDraftIds.length === 0}
                                        inputProps={{ 'aria-label': 'Select all staged activities' }}
                                    />
                                    <Typography sx={{ fontSize: '0.88rem', color: '#374151' }}>Select All Staged</Typography>
                                </Stack>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={handleLaunchStagedSlideshow}
                                    disabled={selectedStagedLocalDraftIds.length === 0}
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
                                    Present Selected Staged
                                </Button>
                                <Button
                                    size="small"
                                    variant="contained"
                                    color="success"
                                    disabled={isSavingAllStaged || selectedStagedLocalDraftIds.length === 0}
                                    onClick={handleSaveSelectedActivities}
                                    sx={{ textTransform: 'none' }}
                                >
                                    {isSavingAllStaged ? 'Saving Selected...' : 'Save Selected Activities'}
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    disabled={isDeletingSelectedStaged || selectedStagedLocalDraftIds.length === 0}
                                    onClick={handleDeleteSelectedStagedActivities}
                                    sx={{ textTransform: 'none' }}
                                >
                                    {isDeletingSelectedStaged ? 'Deleting Selected...' : 'Delete Selected'}
                                </Button>
                            </Stack>
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
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="flex-end" alignItems={{ xs: 'stretch', sm: 'center' }}>
                                <Stack direction="row" spacing={0.4} alignItems="center" sx={{ mr: { xs: 0, sm: 1 } }}>
                                    <Checkbox
                                        size="small"
                                        checked={isAllSavedSelected}
                                        indeterminate={isSavedPartiallySelected}
                                        onChange={handleToggleSelectAllSavedActivities}
                                        disabled={selectableSavedIds.length === 0}
                                        inputProps={{ 'aria-label': 'Select all saved activities' }}
                                    />
                                    <Typography sx={{ fontSize: '0.88rem', color: '#374151' }}>Select All Saved</Typography>
                                </Stack>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={handleLaunchSavedSlideshow}
                                    disabled={selectedSavedActivityIds.length === 0}
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
                                    Present Selected Saved
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    onClick={handleDeleteSelectedSavedActivities}
                                    disabled={isDeletingSelectedSaved || selectedSavedActivityIds.length === 0}
                                    sx={{ textTransform: 'none' }}
                                >
                                    {isDeletingSelectedSaved ? 'Deleting Selected...' : 'Delete Selected'}
                                </Button>
                            </Stack>
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