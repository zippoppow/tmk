'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Alert,
	Box,
	Button,
	Checkbox,
	Chip,
	CircularProgress,
	Container,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	IconButton,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Snackbar,
	Stack,
	Tooltip,
	Typography,
} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import {
	createLessonActivityId,
	DIY_PROJECTS_ENDPOINT,
	deleteLessonActivityById,
	formatActivityDate,
	formatProjectDate,
	getLessonActivityProjectAssociation,
	getAllStoredProjects,
	hardDeleteLessonActivityById,
	listLessonActivities,
	saveStoredProjects,
} from '../components/lessonActivityHelpers';
import {
	buildTeachableLogoutUrl,
	fetchWithTmkToken,
	fetchWithUserToken,
	resolveTmkApiOrigin,
} from '../components/authHelpers';
import { useDiyAccess } from '../components/useDiyAccess';
import {
	buildDiyProjectsPayload,
	createLessonActivitySnapshot,
	createLocalProjectRecord,
	getProjectLessonActivities,
	getUniqueLessonActivityName,
	normalizeCloudProjects,
} from '../components/projectManagerModel';
import TmkLogo from '../components/TmkLogo';


//Note: TBD - consider implementing pagination or lazy loading if users have many projects/activities, 
// to avoid UI and performance issues with very large data sets. For now we assume users will have a 
// manageable number of projects and activities stored locally and in the cloud.

//Note: TBD - consider moving these lesson-activity-types to a JSON or database-driven config 
// if we expect them to change frequently or if there will be many types. 
// For now we hardcode them in the component for simplicity.

const PROJECT_FORM_NAME = 'lesson-activities-project';
const LESSON_ACTIVITY_TYPES = [
	{ value: 'intro', label: 'Intro', path: '/lesson-activities/intro' },
	{ value: 'chameleon-prefixes', label: 'Chameleon Prefixes', path: '/lesson-activities/chameleon-prefixes' },
	{ value: 'common-base-word', label: 'Common Base Word', path: '/lesson-activities/common-base-word' },
	{ value: 'constructor-deconstructor', label: 'Constructor / Deconstructor', path: '/lesson-activities/constructor-deconstructor' },
	{ value: 'fill-in-the-morph-paragraphs', label: 'Fill In The Morph - Connected Text', path: '/lesson-activities/fill-in-the-morph-paragraphs' },
	{ value: 'morph-match-definitions', label: 'Morph Match - Definitions', path: '/lesson-activities/morph-match-definitions' },
	{ value: 'morph-match-related-words', label: 'Morph Match - Related Words', path: '/lesson-activities/morph-match-related-words' },
	{ value: 'morph-morph-match', label: 'Morph Morph Match', path: '/lesson-activities/morph-morph-match' },
	{ value: 'morph-sort', label: 'Morph Sort', path: '/lesson-activities/morph-sort' },
	{ value: 'morph-which', label: 'Morph Which', path: '/lesson-activities/morph-which' },
	{ value: 'part-of-speech', label: 'Part of Speech Sort', path: '/lesson-activities/part-of-speech' },
	{ value: 'word-builder', label: 'Word Builder', path: '/lesson-activities/word-builder' },
	{ value: 'word-meaning', label: 'Word Meaning', path: '/lesson-activities/word-meaning' },
];

function normalizeLessonInputData(rawData) {
	if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
		return {};
	}
	return rawData;
}

function getLessonActivityRoute(activityType) {
	const found = LESSON_ACTIVITY_TYPES.find((type) => type.value === activityType);
	return found?.path || null;
}

function getLessonActivityLabel(activityType) {
	const found = LESSON_ACTIVITY_TYPES.find((type) => type.value === activityType);
	return found?.label || String(activityType || 'unknown');
}

function isValidLessonActivityType(activityType) {
	return LESSON_ACTIVITY_TYPES.some((type) => type.value === activityType);
}

export default function LessonProjectsPage() {
	const router = useRouter();
	const { user: authUser, hasDiyAccess, loading: authLoading } = useDiyAccess();
	const [localProjects, setLocalProjects] = useState([]);
	const [editingProjectId, setEditingProjectId] = useState(null);
	const [editingProjectName, setEditingProjectName] = useState('');

		// Inline edit handlers
		const handleStartEditProjectName = (project) => {
			setEditingProjectId(project.id);
			setEditingProjectName(project.name || '');
		};

		const handleEditProjectNameChange = (e) => {
			setEditingProjectName(e.target.value);
		};

		const handleEditProjectNameCancel = () => {
			setEditingProjectId(null);
			setEditingProjectName('');
		};

		const handleEditProjectNameSave = async (project) => {
			const trimmed = editingProjectName.trim();
			if (!trimmed || trimmed === project.name) {
				handleEditProjectNameCancel();
				return;
			}
			const projects = getAllStoredProjects();
			const idx = projects.findIndex((p) => p.id === project.id);
			if (idx === -1) {
				handleEditProjectNameCancel();
				return;
			}
			// Prevent duplicate names
			if (projects.some((p) => p.formName === PROJECT_FORM_NAME && p.id !== project.id && (p.name || '').trim() === trimmed)) {
				showNotice('error', 'A project with that name already exists.');
				handleEditProjectNameCancel();
				return;
			}
			projects[idx].name = trimmed;
			projects[idx].modifiedAtMs = Date.now();
			saveStoredProjects(projects);
			loadLocalProjects();
			handleEditProjectNameCancel();
			if (isAuthenticated) {
				await syncProjectToApi(projects[idx]);
			}
			showNotice('success', 'Project name updated.');
		};
	const [isLoadingCloudProjects, setIsLoadingCloudProjects] = useState(false);
	const [cloudMessage, setCloudMessage] = useState('');
	const [cloudMessageSeverity, setCloudMessageSeverity] = useState('error');
	const [projectNameInput, setProjectNameInput] = useState('');
	const [reconcileDialogOpen, setReconcileDialogOpen] = useState(false);
	const [initialLocalProjects, setInitialLocalProjects] = useState([]);
	const [initialCloudProjects, setInitialCloudProjects] = useState([]);
	const [isApplyingInitialSync, setIsApplyingInitialSync] = useState(false);

	const [newActivityTypeByProjectId, setNewActivityTypeByProjectId] = useState({});
	const [defaultActivityType, setDefaultActivityType] = useState(LESSON_ACTIVITY_TYPES[0].value);
	const [selectedForSlideshowByProjectId, setSelectedForSlideshowByProjectId] = useState({});
	const [draggingActivityIndexByProjectId, setDraggingActivityIndexByProjectId] = useState({});
	const [dragOverActivityIndexByProjectId, setDragOverActivityIndexByProjectId] = useState({});
	const [notice, setNotice] = useState({ open: false, severity: 'success', message: '' });
	const hasAppliedRequestedActivityType = useRef(false);
	const hasCheckedInitialReconcile = useRef(false);

	const apiOrigin = useMemo(() => resolveTmkApiOrigin(), []);
	const isAuthenticated = Boolean(authUser);

	const showNotice = (severity, message) => {
		setNotice({ open: true, severity, message });
	};

	const setCloudStatus = (message, severity = 'error') => {
		setCloudMessage(message || '');
		setCloudMessageSeverity(severity);
	};

	const loadLocalProjects = () => {
		if (typeof window === 'undefined') {
			return;
		}
		setLocalProjects(getAllStoredProjects().filter((project) => project.formName === PROJECT_FORM_NAME));
	};

	const getLocalProjectById = (projectId) => {
		return getAllStoredProjects().find((project) => project.id === projectId && project.formName === PROJECT_FORM_NAME) || null;
	};

	const getStoredLessonProjects = () => {
		return getAllStoredProjects().filter((project) => project.formName === PROJECT_FORM_NAME);
	};

	const projectToDiffKey = (project) => {
		const projectName = String(project?.name || project?.['project-name'] || '').trim().toLowerCase();
		const activities = Array.isArray(project?.lessonActivities)
			? project.lessonActivities
			: Array.isArray(project?.['lesson-activities'])
				? project['lesson-activities']
				: [];

		const activityFingerprint = activities
			.map((activity) => {
				const activityName = String(activity?.['lesson-name'] || '').trim().toLowerCase();
				const template = String(activity?.['tmk-template'] || '').trim().toLowerCase();
				const inputData = JSON.stringify(normalizeLessonInputData(activity?.['lesson-input-data'] || {}));
				return `${template}|${activityName}|${inputData}`;
			})
			.sort()
			.join('||');

		return `${projectName}::${activityFingerprint}`;
	};

	const hasLocalCloudDifference = (local, cloud) => {
		const localKeys = local.map(projectToDiffKey).sort();
		const cloudKeys = cloud.map(projectToDiffKey).sort();
		if (localKeys.length !== cloudKeys.length) {
			return true;
		}
		return localKeys.some((key, index) => key !== cloudKeys[index]);
	};

	const buildDiyProjectsCollectionPayload = (projects) => {
		return {
			'diy-projects': projects.map((project) => {
				const now = Date.now();
				const createdAtMs = Number.isFinite(project?.createdAtMs) ? project.createdAtMs : now;
				const modifiedAtMs = Number.isFinite(project?.modifiedAtMs) ? project.modifiedAtMs : now;
				const projectName = String(project?.name || '').trim() || 'Untitled Project';
				const lessonActivities = getProjectLessonActivities(project, PROJECT_FORM_NAME, normalizeLessonInputData);

				return {
					'project-name': projectName,
					'created-at': createdAtMs,
					'modified-at': modifiedAtMs,
					'lesson-activities': lessonActivities.map((activity) => ({
						'tmk-template': String(activity?.['tmk-template'] || PROJECT_FORM_NAME),
						'lesson-name': String(activity?.['lesson-name'] || projectName),
						'created-at': Number.isFinite(Number(activity?.['created-at']))
							? Number(activity['created-at'])
							: createdAtMs,
						'modified-at': Number.isFinite(Number(activity?.['modified-at']))
							? Number(activity['modified-at'])
							: modifiedAtMs,
						'lesson-input-data': normalizeLessonInputData(activity?.['lesson-input-data'] || {}),
					})),
				};
			}),
		};
	};

	const fetchCloudLessonProjects = async () => {
		const response = await fetchWithTmkToken(DIY_PROJECTS_ENDPOINT, {
			method: 'GET',
		});

		if (response.status === 404) {
			return [];
		}

		if (!response.ok) {
			throw new Error(`Cloud fetch failed: ${response.status}`);
		}

		const payload = await response.json().catch(() => ({}));
		return normalizeCloudProjects(payload, PROJECT_FORM_NAME, normalizeLessonInputData);
	};

	const syncCloudProjectsToLocal = (projectsFromCloud) => {
		if (!Array.isArray(projectsFromCloud) || projectsFromCloud.length === 0) {
			return;
		}

		const normalizeNameKey = (value) => String(value || '').trim().toLowerCase();
		const normalizeRemoteId = (value) => {
			const id = String(value || '').trim();
			if (!id || id.startsWith('cloud_')) {
				return '';
			}
			return id;
		};
		const getActivityIds = (project) => {
			const activities = Array.isArray(project?.lessonActivities) ? project.lessonActivities : [];
			return new Set(
				activities
					.map((activity) => String(activity?.id || '').trim())
					.filter(Boolean)
			);
		};
		const buildActivityFingerprint = (project) => {
			const activities = Array.isArray(project?.lessonActivities) ? project.lessonActivities : [];
			return activities
				.map((activity) => {
					const type = String(activity?.['tmk-template'] || '').trim();
					const name = String(activity?.['lesson-name'] || '').trim();
					const modifiedAt = String(activity?.['modified-at'] || '').trim();
					const inputData = JSON.stringify(normalizeLessonInputData(activity?.['lesson-input-data'] || {}));
					return `${type}|${name}|${modifiedAt}|${inputData}`;
				})
				.sort()
				.join('||');
		};

		const allStoredProjects = getAllStoredProjects();
		const nonLessonProjects = allStoredProjects.filter((project) => project.formName !== PROJECT_FORM_NAME);
		const lessonProjects = allStoredProjects
			.filter((project) => project.formName === PROJECT_FORM_NAME)
			.map((project) => ({ ...project }));

		const byRemoteId = new Map();
		const byName = new Map();
		lessonProjects.forEach((project) => {
			const remoteIdKey = normalizeRemoteId(project?.remoteId || project?.id);
			if (remoteIdKey) {
				byRemoteId.set(remoteIdKey, project);
			}

			const key = normalizeNameKey(project.name);
			if (key) {
				byName.set(key, project);
			}
		});

		projectsFromCloud.forEach((cloudProject) => {
			const name = String(cloudProject?.name || '').trim();
			const key = normalizeNameKey(name);
			if (!key) {
				return;
			}

			const cloudRemoteId = normalizeRemoteId(cloudProject?.remoteId || cloudProject?.id);

			const cloudActivities = Array.isArray(cloudProject.lessonActivities) ? cloudProject.lessonActivities : [];
			const cloudCreatedAtMs = Number.isFinite(Number(cloudProject.createdAtMs))
				? Number(cloudProject.createdAtMs)
				: Date.now();
			const cloudModifiedAtMs = Number.isFinite(Number(cloudProject.modifiedAtMs))
				? Number(cloudProject.modifiedAtMs)
				: Date.now();

			const cloudActivityIds = getActivityIds(cloudProject);
			const cloudFingerprint = buildActivityFingerprint(cloudProject);

			let existing = cloudRemoteId ? byRemoteId.get(cloudRemoteId) : null;
			if (!existing) {
				existing = lessonProjects.find((localProject) => {
					const localIds = getActivityIds(localProject);
					if (localIds.size === 0 || cloudActivityIds.size === 0) {
						return false;
					}
					for (const id of cloudActivityIds) {
						if (localIds.has(id)) {
							return true;
						}
					}
					return false;
				});
			}
			if (!existing && cloudFingerprint) {
				existing = lessonProjects.find((localProject) => buildActivityFingerprint(localProject) === cloudFingerprint);
			}
			if (!existing) {
				existing = byName.get(key);
			}

			if (existing) {
				existing.name = name || existing.name;
				existing.lessonActivities = cloudActivities;
				if (cloudRemoteId) {
					existing.remoteId = cloudRemoteId;
					byRemoteId.set(cloudRemoteId, existing);
				}
				existing.createdAtMs = Number.isFinite(Number(existing.createdAtMs))
					? Number(existing.createdAtMs)
					: cloudCreatedAtMs;
				existing.createdAt = existing.createdAt || new Date(existing.createdAtMs).toISOString();
				existing.modifiedAtMs = cloudModifiedAtMs;
				existing.syncedAt = cloudProject.syncedAt || new Date(cloudModifiedAtMs).toISOString();
				return;
			}

			const created = createLocalProjectRecord(name, PROJECT_FORM_NAME);
			created.lessonActivities = cloudActivities;
			if (cloudRemoteId) {
				created.remoteId = cloudRemoteId;
			}
			created.createdAtMs = cloudCreatedAtMs;
			created.createdAt = new Date(cloudCreatedAtMs).toISOString();
			created.modifiedAtMs = cloudModifiedAtMs;
			created.syncedAt = cloudProject.syncedAt || new Date(cloudModifiedAtMs).toISOString();
			lessonProjects.unshift(created);
			byName.set(key, created);
			if (cloudRemoteId) {
				byRemoteId.set(cloudRemoteId, created);
			}
		});

		saveStoredProjects([...nonLessonProjects, ...lessonProjects]);
		loadLocalProjects();
	};

	const loadCloudProjects = async () => {
		if (!isAuthenticated || !hasDiyAccess) {
			setCloudStatus('');
			return;
		}

		setIsLoadingCloudProjects(true);
		setCloudStatus('');

		try {
			const response = await fetchWithTmkToken(DIY_PROJECTS_ENDPOINT, {
				method: 'GET',
			});

			if (!response.ok) {
				if (response.status === 404) {
					syncCloudProjectsToLocal([]);
					setCloudStatus('No cloud projects yet.');
					return;
				}
				setCloudStatus('Cloud load failed. Please try Refresh Cloud.');
				return;
			}

			const payload = await response.json();
			const normalizedProjects = normalizeCloudProjects(payload, PROJECT_FORM_NAME, normalizeLessonInputData);
			const activityRecords = await listLessonActivities(apiOrigin);
			const recordsByProjectId = new Map();
			const recordsByProjectName = new Map();
			activityRecords.forEach((record) => {
				const { projectIds, projectNames } = getLessonActivityProjectAssociation(record);
				if (!projectIds.length && !projectNames.length) {
					return;
				}

				projectIds.forEach((projectId) => {
					const list = recordsByProjectId.get(projectId) || [];
					list.push(record);
					recordsByProjectId.set(projectId, list);
				});

				projectNames.forEach((projectName) => {
					const nameList = recordsByProjectName.get(projectName) || [];
					nameList.push(record);
					recordsByProjectName.set(projectName, nameList);
				});
			});

			const enrichedProjects = normalizedProjects.map((project) => {
				const candidatesById = recordsByProjectId.get(String(project.id || '').trim()) || [];
				const candidatesByName = recordsByProjectName.get(String(project.name || '').trim()) || [];
				const candidates = [...candidatesById, ...candidatesByName];
				if (!candidates.length) {
					return project;
				}

				const lessonActivities = project.lessonActivities.map((activity) => {
					if (activity?.id) {
						return activity;
					}

					const match = candidates.find((record) => {
						const sameTemplate = String(record?.['tmk-template'] || record?.formName || '') === String(activity?.['tmk-template'] || '');
						const sameName = String(record?.['lesson-name'] || '') === String(activity?.['lesson-name'] || '');
						return sameTemplate && sameName;
					});

					if (!match?.id) {
						return activity;
					}

					return {
						...activity,
						id: String(match.id),
					};
				});

				return {
					...project,
					lessonActivities,
				};
			});

			syncCloudProjectsToLocal(enrichedProjects);
		} catch (error) {
			console.error('Failed to load cloud projects:', error);
			setCloudStatus('Cloud load failed. Please try Refresh Cloud.');
		} finally {
			setIsLoadingCloudProjects(false);
		}
	};

	const syncProjectToApi = async (project) => {
		if (!isAuthenticated || !hasDiyAccess) {
			return null;
		}

		try {
			const payload = buildDiyProjectsPayload({
				project,
				formName: PROJECT_FORM_NAME,
				normalizeLessonInputData,
			});
			const response = await fetchWithTmkToken(DIY_PROJECTS_ENDPOINT, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const errorText = await response.text().catch(() => '');
				console.warn('DIY project sync failed', {
					status: response.status,
					body: errorText.slice(0, 500),
				});
				return null;
			}

			const result = await response.json();
			const projects = getAllStoredProjects();
			const index = projects.findIndex((item) => item.id === project.id);
			if (index !== -1) {
				projects[index].syncedAt = new Date().toISOString();
				projects[index].modifiedAtMs = Date.now();
				if (result?.id) {
					projects[index].remoteId = result.id;
				}
				saveStoredProjects(projects);
				loadLocalProjects();
			}

			return result;
		} catch (error) {
			console.error('Project sync failed:', error);
			return null;
		}
	};

	const displayProjects = useMemo(() => {
		return localProjects.map((project) => {
			const lessonActivities = getProjectLessonActivities(project, PROJECT_FORM_NAME, normalizeLessonInputData);
			return {
				...project,
				lessonActivities,
			};
		});
	}, [localProjects]);



	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}
		if (hasAppliedRequestedActivityType.current) {
			return;
		}

		const url = new URL(window.location.href);
		const requestedType = (url.searchParams.get('activityType') || '').trim();
		if (!isValidLessonActivityType(requestedType)) {
			hasAppliedRequestedActivityType.current = true;
			return;
		}

		hasAppliedRequestedActivityType.current = true;
		setDefaultActivityType(requestedType);
		setNewActivityTypeByProjectId((prev) => {
			let didChange = false;
			const next = { ...prev };
			localProjects.forEach((project) => {
				if (next[project.id] !== requestedType) {
					next[project.id] = requestedType;
					didChange = true;
				}
			});
			return didChange ? next : prev;
		});
	}, [localProjects]);

	const handleCreateProject = async () => {
		if (!hasDiyAccess) {
			showNotice('warning', 'Active DIY course enrollment is required to create lesson projects.');
			return;
		}

		const trimmedName = projectNameInput.trim();
		if (!trimmedName) {
			return;
		}

		const projects = getAllStoredProjects();
		const existing = projects.find(
			(project) => project.formName === PROJECT_FORM_NAME && (project.name || '').trim() === trimmedName
		);
		if (existing) {
			setProjectNameInput('');
			loadLocalProjects();
			showNotice('info', 'Project already exists.');
			return;
		}

		const created = createLocalProjectRecord(trimmedName, PROJECT_FORM_NAME);
		projects.unshift(created);
		saveStoredProjects(projects);
		setProjectNameInput('');
		setNewActivityTypeByProjectId((prev) => ({ ...prev, [created.id]: defaultActivityType }));
		loadLocalProjects();

		if (isAuthenticated) {
			const result = await syncProjectToApi(created);
			if (result) {
				showNotice('success', `"${trimmedName}" created and synced to cloud.`);
			} else {
				showNotice('warning', `"${trimmedName}" saved locally but could not sync to cloud.`);
			}
		}
	};

	const handleDuplicateProject = (projectId) => {
		if (!hasDiyAccess) {
			showNotice('warning', 'Active DIY course enrollment is required to duplicate lesson projects.');
			return;
		}

		const projects = getAllStoredProjects();
		const sourceProject = projects.find((item) => item.id === projectId && item.formName === PROJECT_FORM_NAME);
		if (!sourceProject) {
			showNotice('error', 'Project not found.');
			return;
		}

		const existingNames = new Set(
			projects
				.filter((item) => item.formName === PROJECT_FORM_NAME)
				.map((item) => String(item.name || '').trim())
				.filter(Boolean)
		);

		const baseName = `${String(sourceProject.name || 'Untitled Project').trim() || 'Untitled Project'} Copy`;
		let duplicateName = baseName;
		let copyIndex = 2;
		while (existingNames.has(duplicateName)) {
			duplicateName = `${baseName} ${copyIndex}`;
			copyIndex += 1;
		}

		const now = Date.now();
		const duplicatedProject = createLocalProjectRecord(duplicateName, PROJECT_FORM_NAME);
		const sourceActivities = getProjectLessonActivities(sourceProject, PROJECT_FORM_NAME, normalizeLessonInputData);
		duplicatedProject.lessonActivities = sourceActivities.map((activity) => ({
			...activity,
			id: createLessonActivityId(),
			'created-at': now,
			'modified-at': now,
			'lesson-input-data': normalizeLessonInputData(activity?.['lesson-input-data'] || {}),
		}));
		duplicatedProject.createdAtMs = now;
		duplicatedProject.createdAt = new Date(now).toISOString();
		duplicatedProject.modifiedAtMs = now;
		duplicatedProject.syncedAt = null;
		delete duplicatedProject.remoteId;

		projects.unshift(duplicatedProject);
		saveStoredProjects(projects);
		setNewActivityTypeByProjectId((prev) => ({
			...prev,
			[duplicatedProject.id]: newActivityTypeByProjectId[projectId] || defaultActivityType,
		}));
		loadLocalProjects();
		showNotice('success', `"${sourceProject.name}" duplicated as "${duplicateName}".`);
	};

	const handleDeleteProject = async (projectId) => {
		if (!hasDiyAccess) {
			showNotice('warning', 'Active DIY course enrollment is required to manage lesson projects.');
			return;
		}

		const project = getLocalProjectById(projectId);
		if (!project) {
			return;
		}

		const shouldDelete = window.confirm(`Delete "${project.name}"? This cannot be undone.`);
		if (!shouldDelete) {
			return;
		}

		if (isAuthenticated) {
			const associatedIds = new Set();

			const activities = getProjectLessonActivities(project, PROJECT_FORM_NAME, normalizeLessonInputData);
			activities.forEach((activity) => {
				const id = String(activity?.id || '').trim();
				if (id) {
					associatedIds.add(id);
				}
			});

			try {
				const cloudRecords = await listLessonActivities(apiOrigin);
				cloudRecords.forEach((record) => {
					const { projectIds, projectNames } = getLessonActivityProjectAssociation(record);
					const matchesProject = projectIds.includes(String(project.id || '').trim())
						|| projectNames.includes(String(project.name || '').trim());
					if (!matchesProject) {
						return;
					}

					const id = String(record?.id || '').trim();
					if (id) {
						associatedIds.add(id);
					}
				});
			} catch (error) {
				console.error('Failed to list lesson activities during project delete:', error);
			}

			if (associatedIds.size > 0) {
				const results = await Promise.allSettled(
					[...associatedIds].map((id) => hardDeleteLessonActivityById(apiOrigin, id))
				);
				const failedDeletes = results.filter(
					(result) => result.status !== 'fulfilled' || result.value?.ok !== true
				).length;
				if (failedDeletes > 0) {
					showNotice('warning', `Project deleted locally, but ${failedDeletes} associated lesson activit${failedDeletes === 1 ? 'y' : 'ies'} failed to delete in cloud.`);
				}
			}
		}

		saveStoredProjects(getAllStoredProjects().filter((item) => item.id !== projectId));
		setNewActivityTypeByProjectId((prev) => {
			const next = { ...prev };
			delete next[projectId];
			return next;
		});
		loadLocalProjects();
		if (isAuthenticated) {
			await loadCloudProjects();
		}
	};

	const handleNewActivity = (projectId) => {
		if (!hasDiyAccess) {
			showNotice('warning', 'Active DIY course enrollment is required to add lesson activities.');
			return;
		}

		const projects = getAllStoredProjects();
		const project = projects.find((item) => item.id === projectId);
		if (!project) {
			return;
		}

		const requestedType = newActivityTypeByProjectId[projectId] || defaultActivityType;
		const requestedName = String(window.prompt('Lesson activity name:', '') || '').trim();
		const uniqueName = getUniqueLessonActivityName({
			project,
			requestedName: requestedName || `${project.name} ${requestedType}`,
			formName: PROJECT_FORM_NAME,
			normalizeLessonInputData,
		});
		const snapshot = createLessonActivitySnapshot({
			formName: requestedType,
			projectName: project.name,
			lessonName: uniqueName,
			lessonInputData: {},
			normalizeLessonInputData,
			currentLessonInputData: {},
		});
		const activities = getProjectLessonActivities(project, PROJECT_FORM_NAME, normalizeLessonInputData);

		project.lessonActivities = [...activities, snapshot];
		project.modifiedAtMs = Date.now();
		project.syncedAt = null;

		saveStoredProjects(projects);
		loadLocalProjects();
		showNotice('success', `${requestedType} lesson activity added.`);
	};

	const handleOpenActivity = (project, activity, activityIndex) => {
		if (!hasDiyAccess) {
			showNotice('warning', 'Active DIY course enrollment is required to open lesson activities.');
			return;
		}

		const activityType = String(activity['tmk-template'] || '');
		const route = getLessonActivityRoute(activityType);
		if (!route) {
			showNotice('error', `No page is implemented yet for activity type "${activityType || 'unknown'}".`);
			return;
		}

		const params = new URLSearchParams({
			projectId: String(project.id || ''),
			activityIndex: String(activityIndex),
			activityType,
		});
		if (activity?.id) {
			params.set('activityId', String(activity.id));
		}
		router.push(`${route}?${params.toString()}`);
	};

	const handleLaunchSlideshow = (projectId) => {
		if (!hasDiyAccess) {
			showNotice('warning', 'Active DIY course enrollment is required to present lesson activities.');
			return;
		}

		const selected = Array.isArray(selectedForSlideshowByProjectId[projectId])
			? selectedForSlideshowByProjectId[projectId]
			: [];
		const uniqueSorted = [...new Set(selected)]
			.filter((index) => Number.isInteger(index) && index >= 0)
			.sort((a, b) => a - b);

		if (uniqueSorted.length === 0) {
			showNotice('error', 'Select at least one lesson activity to start a slideshow.');
			return;
		}

		const params = new URLSearchParams({
			projectId: String(projectId),
			indices: uniqueSorted.join(','),
		});
		router.push(`/lesson-activities/slideshow?${params.toString()}`);
	};

	const remapSelectedIndicesAfterMove = (selectedIndices, fromIndex, toIndex) => {
		if (!Array.isArray(selectedIndices)) {
			return [];
		}

		const remapped = selectedIndices
			.map((index) => {
				if (!Number.isInteger(index) || index < 0) {
					return null;
				}
				if (index === fromIndex) {
					return toIndex;
				}
				if (fromIndex < toIndex && index > fromIndex && index <= toIndex) {
					return index - 1;
				}
				if (toIndex < fromIndex && index >= toIndex && index < fromIndex) {
					return index + 1;
				}
				return index;
			})
			.filter((index) => Number.isInteger(index) && index >= 0);

		return [...new Set(remapped)].sort((a, b) => a - b);
	};

	const remapSelectedIndicesAfterDelete = (selectedIndices, deletedIndex) => {
		if (!Array.isArray(selectedIndices)) {
			return [];
		}

		const remapped = selectedIndices
			.map((index) => {
				if (!Number.isInteger(index) || index < 0 || index === deletedIndex) {
					return null;
				}
				return index > deletedIndex ? index - 1 : index;
			})
			.filter((index) => Number.isInteger(index) && index >= 0);

		return [...new Set(remapped)].sort((a, b) => a - b);
	};

	const handleMoveActivity = (projectId, fromIndex, toIndex) => {
		if (!hasDiyAccess) {
			showNotice('warning', 'Active DIY course enrollment is required to reorder lesson activities.');
			return;
		}

		if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex) || fromIndex === toIndex) {
			return;
		}

		const projects = getAllStoredProjects();
		const projectIndex = projects.findIndex((item) => item.id === projectId);
		if (projectIndex === -1) {
			return;
		}

		const project = projects[projectIndex];
		const activities = getProjectLessonActivities(project, PROJECT_FORM_NAME, normalizeLessonInputData);
		if (activities.length < 2) {
			return;
		}
		if (fromIndex < 0 || fromIndex >= activities.length || toIndex < 0 || toIndex >= activities.length) {
			return;
		}

		const reordered = [...activities];
		const [moved] = reordered.splice(fromIndex, 1);
		reordered.splice(toIndex, 0, moved);

		project.lessonActivities = reordered;
		project.modifiedAtMs = Date.now();
		project.syncedAt = null;

		saveStoredProjects(projects);
		loadLocalProjects();

		setSelectedForSlideshowByProjectId((prev) => {
			const current = Array.isArray(prev[projectId]) ? prev[projectId] : [];
			return {
				...prev,
				[projectId]: remapSelectedIndicesAfterMove(current, fromIndex, toIndex),
			};
		});
	};

	const handleMoveActivityUp = (projectId, activityIndex) => {
		handleMoveActivity(projectId, activityIndex, activityIndex - 1);
	};

	const handleMoveActivityDown = (projectId, activityIndex) => {
		handleMoveActivity(projectId, activityIndex, activityIndex + 1);
	};

	const handleActivityDragStart = (projectId, activityIndex, event) => {
		setDraggingActivityIndexByProjectId((prev) => ({ ...prev, [projectId]: activityIndex }));
		setDragOverActivityIndexByProjectId((prev) => ({ ...prev, [projectId]: activityIndex }));
		event.dataTransfer.effectAllowed = 'move';
		event.dataTransfer.setData('text/plain', String(activityIndex));
	};

	const handleActivityDragOver = (projectId, targetIndex, event) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';
		setDragOverActivityIndexByProjectId((prev) => ({ ...prev, [projectId]: targetIndex }));
	};

	const handleActivityDrop = (projectId, targetIndex, event) => {
		event.preventDefault();
		const payload = event.dataTransfer.getData('text/plain');
		const fallbackSourceIndex = draggingActivityIndexByProjectId[projectId];
		const sourceIndex = Number.parseInt(payload, 10);
		const resolvedSource = Number.isInteger(sourceIndex) ? sourceIndex : fallbackSourceIndex;
		if (Number.isInteger(resolvedSource)) {
			handleMoveActivity(projectId, resolvedSource, targetIndex);
		}
		setDragOverActivityIndexByProjectId((prev) => ({ ...prev, [projectId]: -1 }));
		setDraggingActivityIndexByProjectId((prev) => ({ ...prev, [projectId]: -1 }));
	};

	const handleActivityDragEnd = (projectId) => {
		setDragOverActivityIndexByProjectId((prev) => ({ ...prev, [projectId]: -1 }));
		setDraggingActivityIndexByProjectId((prev) => ({ ...prev, [projectId]: -1 }));
	};

	const handleActivityRowKeyDown = (projectId, activityIndex, event) => {
		if (!hasDiyAccess || !event.altKey) {
			return;
		}

		if (event.key === 'ArrowUp') {
			event.preventDefault();
			handleMoveActivityUp(projectId, activityIndex);
			return;
		}

		if (event.key === 'ArrowDown') {
			event.preventDefault();
			handleMoveActivityDown(projectId, activityIndex);
		}
	};



	const handleDeleteActivity = async (projectId, activityIndex) => {
		if (!hasDiyAccess) {
			showNotice('warning', 'Active DIY course enrollment is required to manage lesson activities.');
			return;
		}

		const projects = getAllStoredProjects();
		const projectIndex = projects.findIndex((item) => item.id === projectId);
		if (projectIndex === -1) {
			return;
		}

		const project = projects[projectIndex];
		const activities = getProjectLessonActivities(project, PROJECT_FORM_NAME, normalizeLessonInputData);
		const activity = activities[activityIndex];
		if (!activity) {
			return;
		}

		const shouldDelete = window.confirm(
			`Delete lesson activity "${activity['lesson-name'] || 'Unnamed'}" from "${project.name}"?`
		);
		if (!shouldDelete) {
			return;
		}

		const nextActivities = activities.filter((_, idx) => idx !== activityIndex);
		if (isAuthenticated && activity?.id) {
			await hardDeleteLessonActivityById(apiOrigin, String(activity.id));
		}
		if (nextActivities.length === 0) {
			project.lessonActivities = [];
		} else {
			project.lessonActivities = nextActivities;
		}
		project.modifiedAtMs = Date.now();
		project.syncedAt = null;

		saveStoredProjects(projects);
		loadLocalProjects();
		setSelectedForSlideshowByProjectId((prev) => {
			const current = Array.isArray(prev[projectId]) ? prev[projectId] : [];
			return {
				...prev,
				[projectId]: remapSelectedIndicesAfterDelete(current, activityIndex),
			};
		});
	};

	const handleSyncProject = async (projectId) => {
		if (!hasDiyAccess) {
			showNotice('warning', 'Active DIY course enrollment is required to sync projects.');
			return;
		}

		if (!isAuthenticated) {
			showNotice('error', 'Login with Teachable to sync this project.');
			return;
		}

		const project = getLocalProjectById(projectId);
		if (!project) {
			showNotice('error', 'Project not found.');
			return;
		}

		const result = await syncProjectToApi(project);
		if (result) {
			showNotice('success', `"${project.name}" synced to cloud.`);
			await loadCloudProjects();
			return;
		}

		showNotice('error', `Could not sync "${project.name}".`);
	};

	const handleApplyLocalToCloud = async () => {
		if (!isAuthenticated || !hasDiyAccess) {
			setReconcileDialogOpen(false);
			return;
		}

		setIsApplyingInitialSync(true);
		try {
			const localProjects = getStoredLessonProjects();

			if (localProjects.length === 0) {
				const deleteResponse = await fetchWithTmkToken(DIY_PROJECTS_ENDPOINT, {
					method: 'DELETE',
				});
				if (!deleteResponse.ok && deleteResponse.status !== 404) {
					showNotice('error', 'Could not clear cloud projects to match local storage.');
					return;
				}
				setCloudStatus('Cloud projects cleared to match local storage.', 'success');
			} else {
				const payload = buildDiyProjectsCollectionPayload(localProjects);
				const response = await fetchWithTmkToken(DIY_PROJECTS_ENDPOINT, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload),
				});

				if (!response.ok) {
					const errorText = await response.text().catch(() => '');
					console.warn('Initial local-to-cloud sync failed', {
						status: response.status,
						body: errorText.slice(0, 500),
					});
					showNotice('error', 'Could not sync local projects to cloud.');
					return;
				}

				setCloudStatus('Cloud updated to match your local browser projects.', 'success');
			}

			setReconcileDialogOpen(false);
			await loadCloudProjects();
			showNotice('success', 'Project sync preference applied.');
		} catch (error) {
			console.error('Failed applying local-to-cloud sync:', error);
			showNotice('error', 'Could not complete initial sync choice.');
		} finally {
			setIsApplyingInitialSync(false);
		}
	};

	const handleKeepLocalOnly = () => {
		setReconcileDialogOpen(false);
		setCloudStatus('Using local browser projects only. Cloud data was left unchanged.', 'success');
		showNotice('info', 'Using local projects without updating cloud.');
	};

	const handleApplyCloudToLocal = () => {
		if (initialCloudProjects.length > 0) {
			syncCloudProjectsToLocal(initialCloudProjects);
			setCloudStatus('Local storage updated to match cloud projects.', 'success');
			showNotice('success', 'Local browser projects updated from cloud.');
		} else {
			const allProjects = getAllStoredProjects();
			const nonLesson = allProjects.filter((p) => p.formName !== PROJECT_FORM_NAME);
			saveStoredProjects(nonLesson);
			loadLocalProjects();
			setCloudStatus('Local lesson projects cleared to match empty cloud.', 'success');
			showNotice('success', 'Local lesson projects cleared to match cloud.');
		}
		setReconcileDialogOpen(false);
	};

	const runLocalCloudCompare = async ({ forcePromptWhenSame = false } = {}) => {
		if (!isAuthenticated || !hasDiyAccess) {
			return;
		}

		try {
			const local = getStoredLessonProjects();
			const cloud = await fetchCloudLessonProjects();

			setInitialLocalProjects(local);
			setInitialCloudProjects(cloud);

			const hasDifference = hasLocalCloudDifference(local, cloud);
			if (hasDifference || forcePromptWhenSame) {
				setReconcileDialogOpen(true);
				return;
			}

			setCloudStatus('Local and cloud projects are already in sync.', 'success');
			syncCloudProjectsToLocal(cloud);
		} catch (error) {
			console.error('Failed project reconciliation:', error);
			setCloudStatus('Could not compare local and cloud projects. You can still continue with local projects.');
		}
	};

	useEffect(() => {
		loadLocalProjects();
	}, []);

	useEffect(() => {
		if (isAuthenticated && hasDiyAccess) {
			// No automatic compare on page load; dialog is only shown on button events
			if (hasCheckedInitialReconcile.current) {
				return;
			}
			hasCheckedInitialReconcile.current = true;
			// runLocalCloudCompare(); // Removed: Only trigger compare on button events
		} else {
			setCloudStatus('');
		}
	}, [isAuthenticated, hasDiyAccess]);

	useEffect(() => {
		if (!authLoading && isAuthenticated && !hasDiyAccess) {
			router.replace('/');
		}
	}, [authLoading, isAuthenticated, hasDiyAccess, router]);

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
							Projects
						</Typography>
					</Stack>
					<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} sx={{ mb: 1, ml: 'auto' }}>
						<Button variant="outlined" onClick={() => router.push('/')} sx={{ textTransform: 'none' }}>
							Back to Home
						</Button>
						<Button
							variant="contained"
							onClick={() => {
								if (isAuthenticated) {
									window.location.href = buildTeachableLogoutUrl('/');
									return;
								}
								window.location.href = '/login?next=/lesson-projects';
							}}
							sx={{ textTransform: 'none' }}
						>
							{isAuthenticated ? 'Logout' : 'Login'}
						</Button>
					</Stack>
				</Box>
				<Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2.5, mb: 2 }}>
					<Box>
							<Typography sx={{ fontSize: '1.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#000', mb: 0.5 }}>Create a Project</Typography>
							<Typography sx={{ color: '#151618', fontSize: '0.95rem', mb: 2, maxWidth: 800 }}>
								First create a project to organize your lesson activities. Each project can contain one or more lesson activities, and you can have multiple projects for different courses or topics.
							</Typography>
							<Stack
								direction={{ xs: 'column', sm: 'row' }}
								spacing={1}
								sx={{
									mb: 1.2,
									width: '100%',
									maxWidth: { xs: '100%', md: 800 },
									backgroundColor: '#fff',
								}}
							>
								<Box
									component="input"
									placeholder="Lesson Activities Project name..."
									value={projectNameInput}
									onChange={(event) => setProjectNameInput(event.target.value)}
									onKeyDown={(event) => {
										if (event.key === 'Enter') {
											event.preventDefault();
											handleCreateProject();
										}
									}}
									sx={{
										mb: 1.2,
										flex: 1,
										minWidth: 0,
										height: 40,
										border: '1px solid #9aa4b2',
										borderRadius: 1,
										backgroundColor: '#f6f9ff',
										fontSize: '1.25rem',
										textAlign: 'left',
										px: 1.2,
										outline: 'none',
										'&:focus': {
											borderColor: '#3f37c9',
											boxShadow: '0 0 0 2px rgba(63,55,201,0.2)',
										},
									}}
								/>
								<Button
									variant="contained"
									color="success"
									onClick={handleCreateProject}
									sx={{
										textTransform: 'none',
										width: { xs: '100%', sm: 180 },
										minWidth: { xs: '100%', sm: 180 },
									}}
								>
									Create Project
								</Button>
							</Stack>
					</Box>
				</Paper>
				<Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2.5, mb: 2 }}>
					<Typography sx={{ fontSize: '2rem', textTransform: 'uppercase', color: '#000', fontWeight: 700, mb: 0 }}>
						Lesson Activity Projects/Sequences
					</Typography>
					<Typography sx={{ color: '#151618', fontSize: '0.95rem', mb: 4 }}>
						Now that you've created a project, add one or more lesson activities to that project.
					</Typography>
					{displayProjects.length === 0 && (
						<Typography sx={{ color: '#bbb', fontSize: '1.2rem', textAlign: 'center', py: 2 }}>
							No lesson activity projects yet.
						</Typography>
					)}
					<Box sx={{ pt: 1, mt: 1, pb: 2, mb: 1 }}>
						{isAuthenticated ? (
							<Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end" flexWrap="wrap">
									<Stack direction="row" spacing={0.6}>
										<Tooltip title="Compare your local browser projects with the cloud and choose which version to keep when they differ.">
											<span>
												<Button
													size="small"
													variant="outlined"
													disabled={isLoadingCloudProjects || isApplyingInitialSync}
													onClick={async () => {
														await runLocalCloudCompare({ forcePromptWhenSame: true });
													}}
													sx={{ textTransform: 'none' }}
												>
													Compare Local & Cloud
												</Button>
											</span>
										</Tooltip>
										<Tooltip title="Pull projects from the cloud into this browser. This does not push local changes to the cloud. But, local content will be updated with what you have previously saved to the cloud.">
											<span>
												<Button
													size="small"
													variant="contained"
													color="info"
													disabled={isLoadingCloudProjects}
													onClick={async () => {
														await loadCloudProjects();
														if (!cloudMessage) {
															setCloudStatus('Local browser projects refreshed from cloud.', 'success');
														}
													}}
													sx={{ textTransform: 'none' }}
												>
													{isLoadingCloudProjects ? 'Refreshing...' : 'Pull Cloud to Browser'}
												</Button>
											</span>
										</Tooltip>
									</Stack>
							</Stack>
						) : (
							<Typography sx={{ fontSize: '0.82rem', color: '#666' }}>
								Login with Teachable to sync projects.
							</Typography>
						)}
					</Box>
					<Stack spacing={3}>
								{displayProjects.map((project) => {
									const lessonActivities = Array.isArray(project.lessonActivities) ? project.lessonActivities : [];

									return (
										<Box
											key={project.id}
											sx={{
												border: '1px solid',
												borderColor: '#060279',
												borderRadius: 2,
												p: 1.5,
												backgroundColor: '#eeeff9',
											}}
										>
											<Stack spacing={0.8}>
												<Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.8} flexWrap="wrap">
													{lessonActivities.length > 0 && (
														<Button
															size="small"
															variant="outlined"
															onClick={() => handleLaunchSlideshow(project.id)}
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
															Present Lesson Activities
														</Button>
													)}
													{isAuthenticated && (
														<Tooltip title="Save this project's current browser changes to the cloud.">
															<Button size="small" variant="contained" color="info" onClick={() => handleSyncProject(project.id)} sx={{ textTransform: 'none' }}>
																Save Project Changes
															</Button>
														</Tooltip>
													)}
													{hasDiyAccess && (
														<Tooltip title='Create a local copy of this project with duplicated activities. Use "Save Project Changes" if you also want to save the copy to the cloud.'>
															<Button size="small" variant="outlined" onClick={() => handleDuplicateProject(project.id)} sx={{ textTransform: 'none' }}>
																Duplicate Project
															</Button>
														</Tooltip>
													)}
													{isAuthenticated && (
														<Button size="small" variant="contained" color="error" onClick={() => handleDeleteProject(project.id)} sx={{ textTransform: 'none' }}>
															Delete Project
														</Button>
													)}
												</Stack>

												<Stack direction="row" alignItems="center" spacing={0.8}>
													<Stack direction="column" spacing={0.2} sx={{ flex: 1, minWidth: 0 }}>
														{editingProjectId === project.id ? (
															<Box
																component="input"
																value={editingProjectName}
																autoFocus
																onChange={handleEditProjectNameChange}
																onBlur={() => handleEditProjectNameSave(project)}
																onKeyDown={(e) => {
																	if (e.key === 'Enter') {
																		e.preventDefault();
																		handleEditProjectNameSave(project);
																	} else if (e.key === 'Escape') {
																		handleEditProjectNameCancel();
																	}
																}}
																sx={{
																	fontSize: '1.7rem',
																	fontWeight: 700,
																	fontStyle: 'italic',
																	minWidth: 120,
																	maxWidth: 340,
																	px: 1,
																	py: 0.5,
																	border: '1.5px solid #3f37c9',
																	borderRadius: 1,
																	background: '#fff',
																}}
															/>
														) : (
															<Typography
																sx={{ fontSize: '1.7rem', fontWeight: 700, fontStyle: 'italic', cursor: 'pointer' }}
																noWrap
																title={project.name}
																onClick={() => handleStartEditProjectName(project)}
															>
																PROJECT: {project.name}
															</Typography>
														)}
														<Stack direction="row" alignItems="center" spacing={1}>
															<Typography sx={{ fontSize: '0.75rem', color: '#888' }}>
																Created: {formatProjectDate(project.createdAt)}
															</Typography>
															<Chip
																label={`Total Activities: ${lessonActivities.length}`}
																size="small"
																sx={{
																	height: 18,
																	fontSize: '0.89rem',
																	backgroundColor: '#e8e8e8',
																	color: '#3f37c9',
																}}
															/>
														</Stack>
													</Stack>
												</Stack>
											</Stack>
											<Stack direction="row" spacing={0.6} sx={{ mt: 1, mb: lessonActivities.length ? 0.8 : 0 }}>
											<Box
												component="select"
												value={newActivityTypeByProjectId[project.id] || defaultActivityType}
												onChange={(event) => {
													const nextType = event.target.value;
													setNewActivityTypeByProjectId((prev) => ({ ...prev, [project.id]: nextType }));
												}}
												sx={{
													minWidth: 160,
													height: 32,
													border: '1px solid #9aa4b2',
													borderRadius: 1,
													backgroundColor: '#fff',
													fontSize: '0.9rem',
													px: 1,
												}}
											>
												{LESSON_ACTIVITY_TYPES.map((option) => (
													<option key={option.value} value={option.value}>
														{option.label}
													</option>
												))}
											</Box>
											<Stack direction="column" spacing={0.6}>
												<Button size="small" variant="contained" color="success" onClick={() => handleNewActivity(project.id)} sx={{ textTransform: 'none' }}>
													Add Activity
												</Button>
											</Stack>
											</Stack>

											{lessonActivities.length > 0 && (
												<>
													<Typography sx={{ fontSize: '0.78rem', color: '#4b5563', mt: 0.4, mb: 0.7 }}>
														Tip: Use drag handle or focus a row and press Alt+Up / Alt+Down to reorder.
													</Typography>
													<TableContainer component={Paper} variant="outlined" sx={{ mt: 1, borderRadius: 1.5 }}>
													<Table size="small">
														<TableHead>
															<TableRow>
																<TableCell sx={{ fontWeight: 700, color: '#374151' }}>Order</TableCell>
																<TableCell sx={{ fontWeight: 700, color: '#374151' }}>Select</TableCell>
																<TableCell sx={{ fontWeight: 700, color: '#374151' }}>Activity</TableCell>
																<TableCell sx={{ fontWeight: 700, color: '#374151' }}>Type</TableCell>
																<TableCell sx={{ fontWeight: 700, color: '#374151' }}>Modified</TableCell>
																<TableCell align="right" sx={{ fontWeight: 700, color: '#374151' }}>Actions</TableCell>
															</TableRow>
														</TableHead>
														<TableBody>
															{lessonActivities.map((activity, activityIndex) => {
																const draftKey = `${project.id}:${activityIndex}`;
																const activityType = String(activity['tmk-template'] || 'unknown');
																const activityTypeLabel = getLessonActivityLabel(activityType);
																const canOpenType = Boolean(getLessonActivityRoute(activityType));
																const isSelectedForSlideshow = Array.isArray(selectedForSlideshowByProjectId[project.id]) && selectedForSlideshowByProjectId[project.id].includes(activityIndex);
																const baseRowColor = activityIndex % 2 === 0 ? '#ffffff' : '#f3f4f6';

																return (
																	<TableRow
																		key={draftKey}
																		hover
																		tabIndex={0}
																		onKeyDown={(event) => handleActivityRowKeyDown(project.id, activityIndex, event)}
																		onDragOver={(event) => handleActivityDragOver(project.id, activityIndex, event)}
																		onDrop={(event) => handleActivityDrop(project.id, activityIndex, event)}
																		sx={{
																			backgroundColor: dragOverActivityIndexByProjectId[project.id] === activityIndex ? '#eff6ff' : baseRowColor,
																			opacity: draggingActivityIndexByProjectId[project.id] === activityIndex ? 0.7 : 1,
																			'&:focus-visible': {
																				outline: '2px solid #3f37c9',
																				outlineOffset: '-2px',
																			},
																		}}
																	>
																		<TableCell>
																			<Stack direction="row" spacing={0.5} alignItems="center">
																				<IconButton
																					size="small"
																					draggable={hasDiyAccess}
																					onDragStart={(event) => handleActivityDragStart(project.id, activityIndex, event)}
																					onDragEnd={() => handleActivityDragEnd(project.id)}
																					disabled={!hasDiyAccess}
																					aria-label={`Drag to reorder ${activity['lesson-name'] || 'activity'}`}
																					sx={{
																						border: '1px solid #cbd5e1',
																						borderRadius: 1,
																						backgroundColor: '#fff',
																						cursor: hasDiyAccess ? 'grab' : 'not-allowed',
																				}}
																				>
																					<DragIndicatorIcon fontSize="small" />
																				</IconButton>
																				<IconButton
																					size="small"
																					disabled={!hasDiyAccess || activityIndex === 0}
																					onClick={() => handleMoveActivityUp(project.id, activityIndex)}
																					aria-label={`Move ${activity['lesson-name'] || 'activity'} up`}
																				>
																					<KeyboardArrowUpIcon fontSize="small" />
																				</IconButton>
																				<IconButton
																					size="small"
																					disabled={!hasDiyAccess || activityIndex === lessonActivities.length - 1}
																					onClick={() => handleMoveActivityDown(project.id, activityIndex)}
																					aria-label={`Move ${activity['lesson-name'] || 'activity'} down`}
																				>
																					<KeyboardArrowDownIcon fontSize="small" />
																				</IconButton>
																			</Stack>
																		</TableCell>
																		<TableCell align="right">
																			<Stack direction="row" spacing={0.5} justifyContent="flex-start" alignItems="center">
																				{isAuthenticated && (
																					<>
																						<Checkbox
																							size="small"
																							checked={isSelectedForSlideshow}
																							onChange={(event) => {
																								setSelectedForSlideshowByProjectId((prev) => {
																									const current = Array.isArray(prev[project.id]) ? prev[project.id] : [];
																									const next = event.target.checked
																										? [...new Set([...current, activityIndex])]
																										: current.filter((idx) => idx !== activityIndex);
																									return { ...prev, [project.id]: next };
																								});
																							}}
																							inputProps={{ 'aria-label': `Add ${activity['lesson-name'] || 'activity'} to slideshow` }}
																						/>
																					</>
																				)}
																			</Stack>
																		</TableCell>
																		<TableCell>
																			<Typography sx={{ fontSize: '0.92rem', fontWeight: 600, color: '#1f2937' }} noWrap title={activity['lesson-name'] || project.name}>
																				{activity['lesson-name'] || project.name}
																			</Typography>
																		</TableCell>
																		<TableCell>
																			<Chip
																				label={activityTypeLabel}
																				size="small"
																				sx={{ fontSize: '0.75rem', backgroundColor: '#eef2ff', color: '#3f37c9' }}
																			/>
																		</TableCell>
																		<TableCell>
																			<Typography sx={{ fontSize: '0.78rem', color: '#6b7280' }}>
																				{formatActivityDate(activity['modified-at']) || '--'}
																			</Typography>
																		</TableCell>
																		<TableCell align="right">
																			<Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
																				{isAuthenticated && (
																					<>
																						<Button
																							size="small"
																							variant="contained"
																							disabled={!canOpenType}
																							onClick={() => handleOpenActivity(project, activity, activityIndex)}
																							sx={{ textTransform: 'none' }}
																						>
																							Manage
																						</Button>
																						<Button
																							size="small"
																							variant="contained"
																							color="error"
																							onClick={() => handleDeleteActivity(project.id, activityIndex)}
																							sx={{ textTransform: 'none' }}
																						>
																							Delete
																						</Button>
																					</>
																				)}
																			</Stack>
																		</TableCell>
																	</TableRow>
																);
															})}
														</TableBody>
													</Table>
													</TableContainer>
												</>
											)}
										</Box>
									);
								})}
							</Stack>
						<Box sx={{ borderTop: '1px solid #eee', pt: 1.5, mt: 2 }}>
							<Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end" flexWrap="wrap">
								<Typography sx={{ fontSize: '0.82rem', color: '#555' }}>
									Licensed for use to {authUser?.email ? ` - ${authUser.email}` : ''}
								</Typography>
							</Stack>
						</Box>
					{isLoadingCloudProjects && (
						<Typography sx={{ color: '#999', fontSize: '0.83rem', mt: 1 }}>Loading projects from cloud...</Typography>
					)}

					{cloudMessage && (
						<Typography
							sx={{
								color: cloudMessageSeverity === 'success' ? '#1f7a3e' : '#b02a37',
								fontSize: '0.78rem',
								mt: 1,
							}}
						>
							{cloudMessage}
						</Typography>
					)}

				</Paper>
			</Container>

			<Snackbar
				open={notice.open}
				autoHideDuration={2600}
				onClose={() => setNotice((prev) => ({ ...prev, open: false }))}
			>
				<Alert severity={notice.severity} variant="filled" onClose={() => setNotice((prev) => ({ ...prev, open: false }))}>
					{notice.message}
				</Alert>
			</Snackbar>

			<Dialog
				open={reconcileDialogOpen}
				onClose={isApplyingInitialSync ? undefined : handleKeepLocalOnly}
				fullWidth
				maxWidth="md"
			>
				<DialogTitle>Local vs Cloud Project Differences Found</DialogTitle>
				<DialogContent dividers>
					<Typography sx={{ fontSize: '0.95rem', mb: 1.5 }}>
						We found differences between your browser's local projects and your projects stored on the cloud server.
						Would you like to sync local projects to cloud now?
						Or, you may choose to keep using local projects without syncing, or apply cloud projects to overwrite local storage.
					</Typography>

					<Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
						<Box sx={{ flex: 1, border: '1px solid #dbe2ea', borderRadius: 1.5, p: 1.25, backgroundColor: '#f8fbff' }}>
							<Typography sx={{ fontWeight: 700, mb: 1 }}>Local Browser Storage ({initialLocalProjects.length})</Typography>
							{initialLocalProjects.length === 0 ? (
								<Typography sx={{ color: '#6b7280', fontSize: '0.9rem' }}>No local projects.</Typography>
							) : (
								<Stack spacing={0.6}>
									{initialLocalProjects.map((project, projectIndex) => {
										const activities = getProjectLessonActivities(project, PROJECT_FORM_NAME, normalizeLessonInputData);
										return (
											<Typography key={`local-${project.id || projectIndex}`} sx={{ fontSize: '0.88rem', color: '#1f2937' }}>
												- {project.name || 'Untitled Project'} ({activities.length} activities)
											</Typography>
										);
									})}
								</Stack>
							)}
						</Box>

						<Box sx={{ flex: 1, border: '1px solid #dbe2ea', borderRadius: 1.5, p: 1.25, backgroundColor: '#fffaf3' }}>
							<Typography sx={{ fontWeight: 700, mb: 1 }}>Cloud Server ({initialCloudProjects.length})</Typography>
							{initialCloudProjects.length === 0 ? (
								<Typography sx={{ color: '#6b7280', fontSize: '0.9rem' }}>No cloud projects.</Typography>
							) : (
								<Stack spacing={0.6}>
									{initialCloudProjects.map((project, projectIndex) => {
										const activities = Array.isArray(project.lessonActivities) ? project.lessonActivities : [];
										const projectKey = String(project.remoteId || project.id || project.name || projectIndex);
										return (
											<Typography key={`cloud-${projectKey}`} sx={{ fontSize: '0.88rem', color: '#1f2937' }}>
												- {project.name || 'Untitled Project'} ({activities.length} activities)
											</Typography>
										);
									})}
								</Stack>
							)}
						</Box>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleKeepLocalOnly} disabled={isApplyingInitialSync} variant="outlined">
						Keep local only
					</Button>
					<Button
						onClick={handleApplyLocalToCloud}
						variant="contained"
						disabled={isApplyingInitialSync}
					>
						{isApplyingInitialSync ? 'Syncing...' : 'Sync local to cloud'}
					</Button>
					<Button
						onClick={handleApplyCloudToLocal}
						variant="outlined"
						color="warning"
						disabled={isApplyingInitialSync}
					>
						Sync cloud to local
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
