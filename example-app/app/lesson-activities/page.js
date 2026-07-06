'use client';

import { useEffect, useRef, useState } from 'react';
import { useDiyAccess } from '../components/useDiyAccess';
import { useRouter } from 'next/navigation';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import {
    buildTeachableLogoutUrl,
    fetchWithTmkToken,
    resolveTmkApiOrigin,
} from '../components/authHelpers';
import AppTopNav from '../components/AppTopNav';
import {
    Alert,
    Container,
    Box,
    Checkbox,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
    Button,
    Paper,
    Snackbar,
    Stack,
} from '@mui/material';
import {
    buildLessonActivityUpsertPayload,
    clearFormSessionData,
    createLessonActivity,
    createLessonActivityId,
    deleteStandaloneDraftByActivityId,
    deleteStandaloneDraftByLocalId,
    DIY_PROJECTS_ENDPOINT,
    deleteLessonActivityById,
    extractLessonActivityFromResponsePayload,
    extractDiyProjectsFromResponse,
    getAllStoredProjects,
    isStandaloneLessonActivity,
    isTemporaryLocalLessonActivityId,
    listStandaloneDrafts,
    listLessonActivities,
    updateLessonActivityById,
    upsertStandaloneDraft,
} from '../components/lessonActivityHelpers';
import { DIY_LESSON_ACTIVITY_TYPES } from '../../data/diy/diy-lesson-activity-types';
import LessonActivitySelector from '../components/LessonActivitySelector';

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
    const [reconcileDialogOpen, setReconcileDialogOpen] = useState(false);
    const [confirmDeleteLocalOpen, setConfirmDeleteLocalOpen] = useState(false);
    const [pendingDeleteLocalActivity, setPendingDeleteLocalActivity] = useState(null);
    const [confirmActionDialogOpen, setConfirmActionDialogOpen] = useState(false);
    const [confirmActionDialogTitle, setConfirmActionDialogTitle] = useState('Confirm Action');
    const [confirmActionDialogMessage, setConfirmActionDialogMessage] = useState('Are you sure you want to continue?');
    const [confirmActionDialogConfirmLabel, setConfirmActionDialogConfirmLabel] = useState('Confirm');
    const [isConfirmActionSubmitting, setIsConfirmActionSubmitting] = useState(false);
    const pendingConfirmActionRef = useRef(null);
    const [initialLocalStandaloneActivities, setInitialLocalStandaloneActivities] = useState([]);
    const [initialCloudStandaloneActivities, setInitialCloudStandaloneActivities] = useState([]);
    const [isApplyingStandaloneSync, setIsApplyingStandaloneSync] = useState(false);
    const [notice, setNotice] = useState({ open: false, severity: 'success', message: '' });
    const [activitySortBy, setActivitySortBy] = useState('date-modified');
    const [draggingSavedIndex, setDraggingSavedIndex] = useState(-1);
    const [dragOverSavedIndex, setDragOverSavedIndex] = useState(-1);
    const { hasDiyAccess, authUser: user, loading: authLoading } = useDiyAccess();

    const showNotice = (severity, message) => {
        setNotice({ open: true, severity, message });
    };

    const openConfirmActionDialog = ({ title, message, confirmLabel, onConfirm }) => {
        pendingConfirmActionRef.current = typeof onConfirm === 'function' ? onConfirm : null;
        setConfirmActionDialogTitle(title || 'Confirm Action');
        setConfirmActionDialogMessage(message || 'Are you sure you want to continue?');
        setConfirmActionDialogConfirmLabel(confirmLabel || 'Confirm');
        setConfirmActionDialogOpen(true);
    };

    const closeConfirmActionDialog = () => {
        if (isConfirmActionSubmitting) {
            return;
        }
        setConfirmActionDialogOpen(false);
        pendingConfirmActionRef.current = null;
    };

    const handleConfirmActionDialog = async () => {
        const action = pendingConfirmActionRef.current;
        setConfirmActionDialogOpen(false);
        pendingConfirmActionRef.current = null;

        if (typeof action !== 'function') {
            return;
        }

        setIsConfirmActionSubmitting(true);
        try {
            await action();
        } finally {
            setIsConfirmActionSubmitting(false);
        }
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

    const stableStringify = (value) => {
        const seen = new WeakSet();

        const normalize = (input) => {
            if (!input || typeof input !== 'object') {
                return input;
            }

            if (seen.has(input)) {
                return null;
            }
            seen.add(input);

            if (Array.isArray(input)) {
                return input.map((item) => normalize(item));
            }

            return Object.keys(input)
                .sort()
                .reduce((accumulator, key) => {
                    accumulator[key] = normalize(input[key]);
                    return accumulator;
                }, {});
        };

        return JSON.stringify(normalize(value));
    };

    const hasLocalStandaloneChanges = (draftRecord, savedRecord) => {
        const draftModifiedAt = Number(draftRecord?.['modified-at'] || draftRecord?.timestamp || 0);
        const savedModifiedAt = Number(savedRecord?.['modified-at'] || savedRecord?.timestamp || 0);
        if (Number.isFinite(draftModifiedAt) && Number.isFinite(savedModifiedAt) && savedModifiedAt > 0) {
            // Only treat local as staged when local edits are newer than the saved snapshot.
            if (draftModifiedAt <= savedModifiedAt) {
                return false;
            }
        }

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

        const draftInputData = stableStringify(normalizeActivityInputData(draftRecord?.['lesson-input-data'] || {}));
        const savedInputData = stableStringify(normalizeActivityInputData(savedRecord?.['lesson-input-data'] || {}));
        return draftInputData !== savedInputData;
    };

    const getLocalStandaloneDraftRecords = () => {
        return listStandaloneDrafts().filter((record) => {
            const template = String(record?.['tmk-template'] || record?.formName || '').trim();
            return Boolean(template) && template !== 'lesson-activities-project';
        });
    };

    const getStandaloneProjectAssociationSets = async () => {
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
            const projectResponse = await fetchWithTmkToken(DIY_PROJECTS_ENDPOINT, { method: 'GET', headers: {} });
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

        return { projectActivityIds, projectActivityKeys };
    };

    const filterProjectAssociatedLocalDrafts = (localDraftRecords, associationSets) => {
        const ids = associationSets?.projectActivityIds instanceof Set
            ? associationSets.projectActivityIds
            : new Set();
        const keys = associationSets?.projectActivityKeys instanceof Set
            ? associationSets.projectActivityKeys
            : new Set();

        return localDraftRecords.filter((record) => {
            const linkedId = String(record?.id || '').trim();
            if (linkedId && ids.has(linkedId)) {
                return false;
            }

            const template = String(record?.['tmk-template'] || record?.formName || '').trim();
            const name = String(record?.['lesson-name'] || '').trim();
            if (template && name && keys.has(`${template}::${name}`)) {
                return false;
            }

            return true;
        });
    };

    const purgeProjectAssociatedStandaloneDrafts = (localDraftRecords, associationSets) => {
        const retainedRecords = filterProjectAssociatedLocalDrafts(localDraftRecords, associationSets);
        if (retainedRecords.length === localDraftRecords.length) {
            return retainedRecords;
        }

        const retainedDraftIds = new Set(
            retainedRecords
                .map((record) => String(record?.localDraftId || '').trim())
                .filter(Boolean)
        );

        localDraftRecords.forEach((record) => {
            const localDraftId = String(record?.localDraftId || '').trim();
            if (localDraftId && !retainedDraftIds.has(localDraftId)) {
                deleteStandaloneDraftByLocalId(localDraftId);
            }
        });

        return retainedRecords;
    };

    const fetchCloudStandaloneActivities = async (apiOrigin) => {
        const records = await listLessonActivities(apiOrigin);
        const { projectActivityIds, projectActivityKeys } = await getStandaloneProjectAssociationSets();

        return records.filter((record) => {
            const template = String(record?.['tmk-template'] || record?.formName || '').trim();

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
    };

    const classifyStandaloneActivities = (localDraftRecords, savedRecords) => {
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

        return {
            saved: [
                ...savedRecords.filter((record) => !dirtyLinkedIds.has(String(record?.id || '').trim())),
                ...optimisticSavedRecords,
            ],
            staged: stagedRecords,
        };
    };

    const toStandaloneDiffKey = (record) => {
        const id = String(record?.id || '').trim();
        const template = String(record?.['tmk-template'] || record?.formName || '').trim();
        const lessonName = String(record?.['lesson-name'] || '').trim();
        const input = stableStringify(normalizeActivityInputData(record?.['lesson-input-data'] || {}));
        return `${id}|${template}|${lessonName}|${input}`;
    };

    const hasStandaloneLocalCloudDifference = (localDraftRecords, cloudRecords) => {
        const localKeys = localDraftRecords.map(toStandaloneDiffKey).sort();
        const cloudKeys = cloudRecords.map(toStandaloneDiffKey).sort();

        if (localKeys.length !== cloudKeys.length) {
            return true;
        }

        return localKeys.some((key, index) => key !== cloudKeys[index]);
    };

    const runStandaloneLocalCloudCompare = async ({ forcePromptWhenSame = false } = {}) => {
        if (!isAuthenticated || !hasDiyAccess) {
            return;
        }

        try {
            const apiOrigin = resolveTmkApiOrigin();
            const associationSets = await getStandaloneProjectAssociationSets();
            const localDraftRecords = purgeProjectAssociatedStandaloneDrafts(
                getLocalStandaloneDraftRecords(),
                associationSets
            );
            const cloudRecords = await fetchCloudStandaloneActivities(apiOrigin);

            setInitialLocalStandaloneActivities(localDraftRecords);
            setInitialCloudStandaloneActivities(cloudRecords);

            const hasDifference = hasStandaloneLocalCloudDifference(localDraftRecords, cloudRecords);
            if (hasDifference || forcePromptWhenSame) {
                setReconcileDialogOpen(true);
                return;
            }

            showNotice('success', 'Local and cloud standalone activities are already in sync.');
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed standalone reconciliation:', error);
            showNotice('error', 'Could not compare local and cloud standalone activities.');
        }
    };

    const handleKeepStandaloneLocalOnly = () => {
        setReconcileDialogOpen(false);
        showNotice('info', 'Using local standalone activities without updating cloud.');
    };

    const handleApplyStandaloneLocalToCloud = async () => {
        if (!isAuthenticated || !hasDiyAccess) {
            setReconcileDialogOpen(false);
            return;
        }

        setIsApplyingStandaloneSync(true);
        try {
            const apiOrigin = resolveTmkApiOrigin();
            const localRecords = initialLocalStandaloneActivities;
            const cloudRecords = initialCloudStandaloneActivities;
            const cloudRecordIds = new Set(
                cloudRecords
                    .map((record) => String(record?.id || '').trim())
                    .filter(Boolean)
            );
            const syncedIds = new Set();

            for (const record of localRecords) {
                const template = String(record?.['tmk-template'] || record?.formName || '').trim();
                if (!template || template === 'lesson-activities-project') {
                    continue;
                }

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

                const hasCanonicalId = Boolean(activityId) && !isTemporaryLocalLessonActivityId(activityId);
                const shouldUpdate = hasCanonicalId && cloudRecordIds.has(activityId);
                const response = shouldUpdate
                    ? await updateLessonActivityById(apiOrigin, activityId, {
                        ...payload,
                        id: undefined,
                        client_ref: undefined,
                    })
                    : await createLessonActivity(apiOrigin, {
                        ...payload,
                        client_ref: activityId,
                        id: undefined,
                    });
                if (!response.ok) {
                    throw new Error(`Failed to save standalone activity: ${activityId}`);
                }

                let resolvedActivityId = activityId;
                if (!shouldUpdate) {
                    const responsePayload = await response.json().catch(() => ({}));
                    const savedRecord = extractLessonActivityFromResponsePayload(responsePayload);
                    const canonicalId = String(savedRecord?.id || '').trim();
                    if (canonicalId && !isTemporaryLocalLessonActivityId(canonicalId)) {
                        resolvedActivityId = canonicalId;
                    } else {
                        throw new Error(`Create succeeded without canonical lesson activity id: ${activityId}`);
                    }
                }

                upsertStandaloneDraft({
                    ...record,
                    id: resolvedActivityId,
                    formName: template,
                    'tmk-template': template,
                    'lesson-name': lessonName,
                    'lesson-input-data': lessonInputData,
                    'created-at': createdAt,
                    'modified-at': Date.now(),
                    savedToApi: true,
                });

                syncedIds.add(resolvedActivityId);
            }

            for (const record of cloudRecords) {
                const cloudId = String(record?.id || '').trim();
                if (!cloudId || syncedIds.has(cloudId)) {
                    continue;
                }

                const deleteResponse = await deleteLessonActivityById(apiOrigin, cloudId);
                if (!deleteResponse.ok && deleteResponse.status !== 404) {
                    throw new Error(`Failed to delete cloud standalone activity: ${cloudId}`);
                }
            }

            setReconcileDialogOpen(false);
            await loadStandaloneActivities();
            showNotice('success', 'Cloud standalone activities updated to match local.');
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed applying standalone local-to-cloud sync:', error);
            showNotice('error', 'Could not sync local standalone activities to cloud.');
        } finally {
            setIsApplyingStandaloneSync(false);
        }
    };

    const handleApplyStandaloneCloudToLocal = async () => {
        setIsApplyingStandaloneSync(true);
        try {
            const localRecords = getLocalStandaloneDraftRecords();
            localRecords.forEach((record) => {
                const localDraftId = String(record?.localDraftId || '').trim();
                if (localDraftId) {
                    deleteStandaloneDraftByLocalId(localDraftId);
                }
            });

            initialCloudStandaloneActivities.forEach((record) => {
                const template = String(record?.['tmk-template'] || record?.formName || '').trim();
                if (!template || template === 'lesson-activities-project') {
                    return;
                }

                upsertStandaloneDraft({
                    localDraftId: createLessonActivityId(),
                    id: String(record?.id || '').trim(),
                    formName: template,
                    'tmk-template': template,
                    'lesson-name': String(record?.['lesson-name'] || 'Untitled Lesson Activity').trim() || 'Untitled Lesson Activity',
                    'lesson-input-data': normalizeActivityInputData(record?.['lesson-input-data'] || {}),
                    'created-at': Number(record?.['created-at']) || Date.now(),
                    'modified-at': Number(record?.['modified-at']) || Date.now(),
                    savedToApi: true,
                });
            });

            setReconcileDialogOpen(false);
            await loadStandaloneActivities();
            showNotice('success', 'Local standalone activities updated from cloud.');
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed applying standalone cloud-to-local sync:', error);
            showNotice('error', 'Could not apply cloud standalone activities to local.');
        } finally {
            setIsApplyingStandaloneSync(false);
        }
    };

    useEffect(() => {
        if (!authLoading && isAuthenticated && !hasDiyAccess) {
            router.replace('/');
        }
    }, [authLoading, isAuthenticated, hasDiyAccess, router]);

    const loadStandaloneActivities = async () => {
        setStandaloneLoading(true);
        try {
            const associationSets = await getStandaloneProjectAssociationSets();
            const localDraftRecords = purgeProjectAssociatedStandaloneDrafts(
                getLocalStandaloneDraftRecords(),
                associationSets
            );

            if (!user || !hasDiyAccess) {
                setSavedStandaloneActivities([]);
                setStagedStandaloneActivities(localDraftRecords.filter((record) => !String(record?.id || '').trim()));
                return;
            }

            const apiOrigin = resolveTmkApiOrigin();
            const savedRecords = await fetchCloudStandaloneActivities(apiOrigin);
            const classified = classifyStandaloneActivities(localDraftRecords, savedRecords);
            setSavedStandaloneActivities(sortStandaloneRecords(classified.saved, activitySortBy));
            setStagedStandaloneActivities(classified.staged);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to load standalone lesson activities:', error);
            const localDraftRecords = getLocalStandaloneDraftRecords();
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
        window.location.href = buildTeachableLogoutUrl('/');
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

    const lessonActivities = DIY_LESSON_ACTIVITY_TYPES;

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
        return match?.label || normalizedTemplate || 'Unknown';
    };

    const sortStandaloneRecords = (records, sortBy) => {
        const normalizedRecords = Array.isArray(records) ? [...records] : [];

        if (sortBy === 'alphabetical') {
            return normalizedRecords.sort((left, right) => {
                const leftName = String(left?.['lesson-name'] || '').trim().toLowerCase();
                const rightName = String(right?.['lesson-name'] || '').trim().toLowerCase();
                return leftName.localeCompare(rightName);
            });
        }

        if (sortBy === 'activity-type') {
            return normalizedRecords.sort((left, right) => {
                const leftTypeLabel = getActivityTypeLabel(String(left?.['tmk-template'] || left?.formName || '')).toLowerCase();
                const rightTypeLabel = getActivityTypeLabel(String(right?.['tmk-template'] || right?.formName || '')).toLowerCase();
                const typeCompare = leftTypeLabel.localeCompare(rightTypeLabel);
                if (typeCompare !== 0) {
                    return typeCompare;
                }
                const leftName = String(left?.['lesson-name'] || '').trim().toLowerCase();
                const rightName = String(right?.['lesson-name'] || '').trim().toLowerCase();
                return leftName.localeCompare(rightName);
            });
        }

        if (sortBy === 'date-modified') {
            return normalizedRecords.sort((left, right) => {
                const leftModified = Number(left?.['modified-at'] || left?.timestamp || 0);
                const rightModified = Number(right?.['modified-at'] || right?.timestamp || 0);
                return rightModified - leftModified;
            });
        }

        return normalizedRecords;
    };

    const applySortToSavedStandaloneActivities = (nextSortBy) => {
        setActivitySortBy(nextSortBy);
        setSavedStandaloneActivities((prev) => sortStandaloneRecords(prev, nextSortBy));
    };

    const handleMoveSavedStandaloneActivity = (fromIndex, toIndex) => {
        if (fromIndex < 0 || fromIndex >= savedStandaloneActivities.length || toIndex < 0 || toIndex >= savedStandaloneActivities.length || fromIndex === toIndex) {
            return;
        }

        const reordered = [...savedStandaloneActivities];
        const [moved] = reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, moved);

        setSavedStandaloneActivities(reordered);
        setDragOverSavedIndex(-1);
        setDraggingSavedIndex(-1);

        setActivitySortBy('manual');
    };

    const handleSavedStandaloneDragStart = (index, event) => {
        if (!hasDiyAccess) {
            return;
        }

        setDraggingSavedIndex(index);
        setDragOverSavedIndex(index);

        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(index));
    };

    const handleSavedStandaloneDragOver = (targetIndex, event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setDragOverSavedIndex(targetIndex);
    };

    const handleSavedStandaloneDrop = (targetIndex, event) => {
        event.preventDefault();
        const payload = event.dataTransfer.getData('text/plain');
        const sourceIndex = Number.parseInt(payload, 10);
        const resolvedSourceIndex = Number.isInteger(sourceIndex) ? sourceIndex : draggingSavedIndex;
        if (Number.isInteger(resolvedSourceIndex)) {
            handleMoveSavedStandaloneActivity(resolvedSourceIndex, targetIndex);
            return;
        }
        setDragOverSavedIndex(-1);
        setDraggingSavedIndex(-1);
    };

    const handleSavedStandaloneDragEnd = () => {
        setDragOverSavedIndex(-1);
        setDraggingSavedIndex(-1);
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

    const handleDeleteSelectedStagedActivities = async (draftIdsOverride = null, confirmed = false) => {
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

        if (!confirmed) {
            openConfirmActionDialog({
                title: 'Confirm Delete',
                message: `Are you sure you want to delete ${selectedDraftIds.length} staged activit${selectedDraftIds.length === 1 ? 'y' : 'ies'} from local storage?`,
                confirmLabel: 'Delete',
                onConfirm: () => handleDeleteSelectedStagedActivities(selectedDraftIds, true),
            });
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

    const handleDeleteSelectedSavedActivities = async (activityIdsOverride = null, confirmed = false) => {
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

        if (!confirmed) {
            openConfirmActionDialog({
                title: 'Confirm Delete',
                message: `Are you sure you want to delete ${selectedIds.length} saved activit${selectedIds.length === 1 ? 'y' : 'ies'}? This cannot be undone.`,
                confirmLabel: 'Delete',
                onConfirm: () => handleDeleteSelectedSavedActivities(selectedIds, true),
            });
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

                const hasCanonicalId = Boolean(activityId) && !isTemporaryLocalLessonActivityId(activityId);
                const shouldUpdate = hasCanonicalId;
                const response = shouldUpdate
                    ? await updateLessonActivityById(apiOrigin, activityId, {
                        ...payload,
                        id: undefined,
                        client_ref: undefined,
                    })
                    : await createLessonActivity(apiOrigin, {
                        ...payload,
                        client_ref: activityId,
                        id: undefined,
                    });
                if (!response.ok) {
                    failureCount += 1;
                    continue;
                }

                let resolvedActivityId = activityId;
                if (!shouldUpdate) {
                    const responsePayload = await response.json().catch(() => ({}));
                    const savedRecord = extractLessonActivityFromResponsePayload(responsePayload);
                    const canonicalId = String(savedRecord?.id || '').trim();
                    if (canonicalId && !isTemporaryLocalLessonActivityId(canonicalId)) {
                        resolvedActivityId = canonicalId;
                    } else {
                        failureCount += 1;
                        continue;
                    }
                }

                if (resolvedActivityId !== activityId) {
                    deleteStandaloneDraftByActivityId(activityId);
                }
                deleteStandaloneDraftByActivityId(resolvedActivityId);
                if (record?.localDraftId) {
                    deleteStandaloneDraftByLocalId(String(record.localDraftId));
                }
                successCount += 1;
            }

            await loadStandaloneActivities();

            if (failureCount === 0) {
                showNotice('success', `Saved ${successCount} selected staged activit${successCount === 1 ? 'y' : 'ies'} to the cloud server.`);
            } else if (successCount > 0) {
                showNotice('warning', `Saved ${successCount} selected staged activit${successCount === 1 ? 'y' : 'ies'} to the cloud server, but ${failureCount} failed.`);
            } else {
                showNotice('error', 'Could not save selected staged activities to the cloud server. Please try again.');
            }
        } catch (error) {
            console.error('Failed to save selected staged activities to the cloud server:', error);
            showNotice('error', 'Could not save selected staged activities to the cloud server. Please try again.');
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
                <AppTopNav
                    title="Lesson Activities"
                    currentSection="lesson-activities"
                    onAuthAction={() => {
                        if (isAuthenticated) {
                            handleLogout();
                            return;
                        }
                        window.location.href = '/login?next=/lesson-activities';
                    }}
                    authButtonLabel={isAuthenticated ? 'Logout' : 'Login'}
                    containerSx={{ pr: { xs: 0, md: 5 } }}
                    logoSx={{ mb: 2 }}
                    titleSx={{ mb: 1 }}
                />

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
                            <Typography sx={{ fontSize: '1.6rem', fontWeight: 700, color: '#2f3a4a' }}>
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
                                                onClick={() => {
                                                    setPendingDeleteLocalActivity(activity);
                                                    setConfirmDeleteLocalOpen(true);
                                                }}
                                                sx={{ textTransform: 'none' }}
                                            >
                                                Delete Local
                                            </Button>
                                        </Stack>
                                    </Box>
                                );
                            })}

                            {isAuthenticated && hasDiyAccess && (
                                <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center" flexWrap="wrap" sx={{ pt: 1 }}>
                                    <Typography sx={{ fontSize: '0.88rem', color: '#374151' }}>
                                        Sort saved by:
                                    </Typography>
                                    <Button
                                        size="small"
                                        variant={activitySortBy === 'alphabetical' ? 'contained' : 'outlined'}
                                        onClick={() => applySortToSavedStandaloneActivities('alphabetical')}
                                        sx={{ textTransform: 'none' }}
                                    >
                                        Alphabetical
                                    </Button>
                                    <Button
                                        size="small"
                                        variant={activitySortBy === 'date-modified' ? 'contained' : 'outlined'}
                                        onClick={() => applySortToSavedStandaloneActivities('date-modified')}
                                        sx={{ textTransform: 'none' }}
                                    >
                                        Date Modified
                                    </Button>
                                    <Button
                                        size="small"
                                        variant={activitySortBy === 'activity-type' ? 'contained' : 'outlined'}
                                        onClick={() => applySortToSavedStandaloneActivities('activity-type')}
                                        sx={{ textTransform: 'none' }}
                                    >
                                        Activity Type
                                    </Button>
                                    {activitySortBy === 'manual' && (
                                        <>
                                            <Chip
                                                size="small"
                                                label="Manual order"
                                                sx={{ height: 24, fontSize: '0.74rem', bgcolor: '#eef2ff', color: '#3730a3' }}
                                            />
                                            <Button
                                                size="small"
                                                variant="text"
                                                onClick={() => applySortToSavedStandaloneActivities('date-modified')}
                                                sx={{ textTransform: 'none' }}
                                            >
                                                Reset to Date Modified
                                            </Button>
                                        </>
                                    )}
                                </Stack>
                            )}

                            <Typography sx={{ fontSize: '1.6rem', fontWeight: 700, color: '#2f3a4a', pt: 1 }}>
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
                                        onDragOver={(event) => handleSavedStandaloneDragOver(index, event)}
                                        onDrop={(event) => handleSavedStandaloneDrop(index, event)}
                                        sx={{
                                            border: '1px solid',
                                            borderColor: '#060279',
                                            borderRadius: 2,
                                            p: 1.5,
                                            backgroundColor: dragOverSavedIndex === index ? '#dbeafe' : '#eeeff9',
                                            opacity: draggingSavedIndex === index ? 0.7 : 1,
                                        }}
                                    >
                                        <Stack direction="row" alignItems="center" spacing={0.8}>
                                            <Button
                                                size="small"
                                                draggable={hasDiyAccess}
                                                onDragStart={(event) => handleSavedStandaloneDragStart(index, event)}
                                                onDragEnd={handleSavedStandaloneDragEnd}
                                                disabled={!hasDiyAccess}
                                                aria-label={`Drag to reorder ${activityName}`}
                                                sx={{
                                                    minWidth: 32,
                                                    width: 32,
                                                    height: 32,
                                                    p: 0,
                                                    border: '1px solid #cbd5e1',
                                                    borderRadius: 1,
                                                    backgroundColor: '#fff',
                                                    color: '#334155',
                                                    cursor: hasDiyAccess ? 'grab' : 'not-allowed',
                                                }}
                                            >
                                                <DragIndicatorIcon fontSize="small" />
                                            </Button>
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

        <Dialog
            open={confirmDeleteLocalOpen}
            onClose={() => setConfirmDeleteLocalOpen(false)}
            PaperProps={{
                sx: {
                    minWidth: { xs: '90vw', sm: 400 },
                },
            }}
        >
            <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem' }}>Confirm Delete</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 1 }}>Are you sure you want to delete this local activity? This cannot be undone.</Box>
            </DialogContent>
            <DialogActions sx={{ gap: 1, p: 2 }}>
                <Button
                    variant="outlined"
                    onClick={() => setConfirmDeleteLocalOpen(false)}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    color="error"
                    onClick={() => {
                        setConfirmDeleteLocalOpen(false);
                        if (pendingDeleteLocalActivity) {
                            handleDeleteStagedStandalone(pendingDeleteLocalActivity);
                            setPendingDeleteLocalActivity(null);
                        }
                    }}
                >
                    Delete
                </Button>
            </DialogActions>
        </Dialog>

        <Dialog
            open={confirmActionDialogOpen}
            onClose={closeConfirmActionDialog}
            PaperProps={{
                sx: {
                    minWidth: { xs: '90vw', sm: 400 },
                },
            }}
        >
            <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem' }}>{confirmActionDialogTitle}</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 1 }}>{confirmActionDialogMessage}</Box>
            </DialogContent>
            <DialogActions sx={{ gap: 1, p: 2 }}>
                <Button
                    variant="outlined"
                    onClick={closeConfirmActionDialog}
                    disabled={isConfirmActionSubmitting}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    color="error"
                    onClick={handleConfirmActionDialog}
                    disabled={isConfirmActionSubmitting}
                >
                    {isConfirmActionSubmitting ? 'Working...' : confirmActionDialogConfirmLabel}
                </Button>
            </DialogActions>
        </Dialog>

        <Dialog
            open={reconcileDialogOpen}
            onClose={isApplyingStandaloneSync ? undefined : handleKeepStandaloneLocalOnly}
            fullWidth
            maxWidth="md"
            PaperProps={{
                sx: {
                    minWidth: { xs: '90vw', sm: 400 },
                },
            }}
        >
            <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem' }}>Local vs Cloud Standalone Differences Found</DialogTitle>
            <DialogContent dividers>
                <Typography sx={{ fontSize: '0.95rem', mb: 1.5 }}>
                    We found differences between your browser's standalone lesson activities and cloud standalone lesson activities.
                    Would you like to sync local standalone activities to cloud, keep local only, or apply cloud activities to local?
                </Typography>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <Box sx={{ flex: 1, border: '1px solid #dbe2ea', borderRadius: 1.5, p: 1.25, backgroundColor: '#f8fbff' }}>
                        <Typography sx={{ fontWeight: 700, mb: 1 }}>
                            Local Browser Storage ({initialLocalStandaloneActivities.length})
                        </Typography>
                        {initialLocalStandaloneActivities.length === 0 ? (
                            <Typography sx={{ color: '#6b7280', fontSize: '0.9rem' }}>No local standalone activities.</Typography>
                        ) : (
                            <Stack spacing={0.6}>
                                {initialLocalStandaloneActivities.map((activity, index) => {
                                    const name = String(activity?.['lesson-name'] || 'Untitled Lesson Activity');
                                    const type = getActivityTypeLabel(String(activity?.['tmk-template'] || activity?.formName || ''));
                                    const key = String(activity?.localDraftId || activity?.id || `${name}-${index}`);
                                    return (
                                        <Typography key={`local-${key}`} sx={{ fontSize: '0.88rem', color: '#1f2937' }}>
                                            - {name} ({type})
                                        </Typography>
                                    );
                                })}
                            </Stack>
                        )}
                    </Box>

                    <Box sx={{ flex: 1, border: '1px solid #dbe2ea', borderRadius: 1.5, p: 1.25, backgroundColor: '#fffaf3' }}>
                        <Typography sx={{ fontWeight: 700, mb: 1 }}>
                            Cloud Server ({initialCloudStandaloneActivities.length})
                        </Typography>
                        {initialCloudStandaloneActivities.length === 0 ? (
                            <Typography sx={{ color: '#6b7280', fontSize: '0.9rem' }}>No cloud standalone activities.</Typography>
                        ) : (
                            <Stack spacing={0.6}>
                                {initialCloudStandaloneActivities.map((activity, index) => {
                                    const name = String(activity?.['lesson-name'] || 'Untitled Lesson Activity');
                                    const type = getActivityTypeLabel(String(activity?.['tmk-template'] || activity?.formName || ''));
                                    const key = String(activity?.id || `${name}-${index}`);
                                    return (
                                        <Typography key={`cloud-${key}`} sx={{ fontSize: '0.88rem', color: '#1f2937' }}>
                                            - {name} ({type})
                                        </Typography>
                                    );
                                })}
                            </Stack>
                        )}
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ gap: 1, p: 2 }}>
                <Button onClick={handleKeepStandaloneLocalOnly} disabled={isApplyingStandaloneSync} variant="outlined" sx={{ textTransform: 'none' }}>
                    Keep local only
                </Button>
                <Button
                    onClick={handleApplyStandaloneLocalToCloud}
                    variant="contained"
                    disabled={isApplyingStandaloneSync}
                    sx={{ textTransform: 'none' }}
                >
                    {isApplyingStandaloneSync ? 'Syncing...' : 'Sync local to cloud'}
                </Button>
                <Button
                    onClick={handleApplyStandaloneCloudToLocal}
                    variant="outlined"
                    color="warning"
                    disabled={isApplyingStandaloneSync}
                    sx={{ textTransform: 'none' }}
                >
                    Apply cloud to local
                </Button>
            </DialogActions>
        </Dialog>
        </Box>
    );
}