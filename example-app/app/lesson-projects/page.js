'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Alert,
	Box,
	Button,
	Checkbox,
	Chip,
	Container,
	Divider,
	MenuItem,
	Paper,
	Snackbar,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from '@mui/material';
import {
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
import AuthDebugPanel from '../components/AuthDebugPanel';
import TmkLogo from '../components/TmkLogo';

const PROJECT_FORM_NAME = 'lesson-activities-project';
const LESSON_ACTIVITY_TYPES = [
	{ value: 'intro', label: 'Intro', path: '/lesson-activities/intro' },
	{ value: 'chameleon-prefixes', label: 'Chameleon Prefixes', path: '/lesson-activities/chameleon-prefixes' },
	{ value: 'common-base-word', label: 'Common Base Word', path: '/lesson-activities/common-base-word' },
	{ value: 'constructor-deconstructor', label: 'Constructor / Deconstructor', path: '/lesson-activities/constructor-deconstructor' },
	{ value: 'fill-in-the-morph-paragraphs', label: 'Fill In The Morph - Paragraphs', path: '/lesson-activities/fill-in-the-morph-paragraphs' },
	{ value: 'morph-match-definitions', label: 'Morph Match - Definitions', path: '/lesson-activities/morph-match-definitions' },
	{ value: 'morph-match-related-words', label: 'Morph Match - Related Words', path: '/lesson-activities/morph-match-related-words' },
	{ value: 'morph-morph-match', label: 'Morph Morph Match', path: '/lesson-activities/morph-morph-match' },
	{ value: 'morph-sort', label: 'Morph Sort', path: '/lesson-activities/morph-sort' },
	{ value: 'morph-which', label: 'Morph Which', path: '/lesson-activities/morph-which' },
	{ value: 'part-of-speech', label: 'Part Of Speech', path: '/lesson-activities/part-of-speech' },
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

function isValidLessonActivityType(activityType) {
	return LESSON_ACTIVITY_TYPES.some((type) => type.value === activityType);
}

export default function LessonProjectsPage() {
	const router = useRouter();
	const { user: authUser, hasDiyAccess, loading: authLoading } = useDiyAccess();
	const [localProjects, setLocalProjects] = useState([]);
	const [isLoadingCloudProjects, setIsLoadingCloudProjects] = useState(false);
	const [cloudMessage, setCloudMessage] = useState('');
	const [cloudMessageSeverity, setCloudMessageSeverity] = useState('error');
	const [projectNameInput, setProjectNameInput] = useState('');

	const [newActivityTypeByProjectId, setNewActivityTypeByProjectId] = useState({});
	const [defaultActivityType, setDefaultActivityType] = useState(LESSON_ACTIVITY_TYPES[0].value);
	const [selectedForSlideshowByProjectId, setSelectedForSlideshowByProjectId] = useState({});
	const [notice, setNotice] = useState({ open: false, severity: 'success', message: '' });
	const hasAppliedRequestedActivityType = useRef(false);

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
			const response = await fetch(DIY_PROJECTS_ENDPOINT, {
				method: 'GET',
			});

			if (!response.ok) {
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
			const response = await fetch(DIY_PROJECTS_ENDPOINT, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
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
			const next = { ...prev };
			localProjects.forEach((project) => {
				next[project.id] = requestedType;
			});
			return next;
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

	useEffect(() => {
		loadLocalProjects();
	}, []);

	useEffect(() => {
		if (isAuthenticated && hasDiyAccess) {
			loadCloudProjects();
		} else {
			setCloudStatus('');
		}
	}, [isAuthenticated, hasDiyAccess]);

	useEffect(() => {
		if (!authLoading && isAuthenticated && !hasDiyAccess) {
			router.replace('/dashboard');
		}
	}, [authLoading, isAuthenticated, hasDiyAccess, router]);

	if (authLoading) {
		return (
			<Container maxWidth="md" sx={{ py: 6 }}>
				<Typography>Checking login...</Typography>
			</Container>
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
				<AuthDebugPanel />
				<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} sx={{ mb: 2 }}>
					<Button variant="outlined" onClick={() => router.push('/dashboard')} sx={{ textTransform: 'none' }}>
						Back to Dashboard
					</Button>
					<Button
						variant="contained"
						onClick={() => {
							if (isAuthenticated) {
								window.location.href = buildTeachableLogoutUrl('/lesson-projects');
								return;
							}
							window.location.href = '/login?next=/lesson-projects';
						}}
						sx={{ textTransform: 'none' }}
					>
						{isAuthenticated ? 'Logout from Teachable' : 'Login with Teachable'}
					</Button>
				</Stack>

				<Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2.5, mb: 2 }}>
					<Box sx={{ display: 'grid', gridTemplateColumns: '75% 25%', gap: 2 }}>
						{/* Left Column */}
						<Box>
							<Typography sx={{ fontSize: '1.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#000', mb: 0.5 }}>Create a Project</Typography>
							<Typography sx={{ color: '#151618', fontSize: '0.95rem', mb: 2 }}>
								Clicking "Create Project" will add a new project to the "SAVED PROJECTS" section below.
							</Typography>
							<Typography sx={{ color: '#151618', fontSize: '0.95rem', mb: 2 }}>
								You can create as many projects as you want, and they will be saved for you to access later.
							</Typography>
							<Stack direction="row" spacing={1} sx={{ mb: 1.2, width: 500, minWidth: 500, maxWidth: 800, backgroundColor: '#fff' }}>
								<TextField
									placeholder="Lesson Activities Project name..."
									sx={{
										mb: 1.2,
										width: 500,
										minWidth: 500,
										maxWidth: 800,
										'& .MuiOutlinedInput-root': {
											backgroundColor: '#ABC3F7',
										},
										'& .MuiOutlinedInput-input': {
											backgroundColor: '#ABC3F7',
											fontSize: '1.25rem',
											textAlign: 'center',
										},
									}}
									value={projectNameInput}
									onChange={(event) => setProjectNameInput(event.target.value)}
									onKeyDown={(event) => {
										if (event.key === 'Enter') {
											event.preventDefault();
											handleCreateProject();
										}
									}}
								/>
								<Button variant="contained" color="success" onClick={handleCreateProject} sx={{ textTransform: 'none', width: 180, minWidth: 180, maxWidth: 180 }}>
									Create Project
								</Button>
							</Stack>
						</Box>

						{/* Right Column */}
						<Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', mr: 5 }}>
							<Stack direction="column" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
								<TmkLogo sx={{ mb: 2 }} />
								<Typography sx={{ fontSize: '3rem', textTransform: 'uppercase', color: '#000', fontWeight: 700, mb: 1 }}>
									Projects
								</Typography>
							</Stack>
						</Box>
					</Box>
				</Paper>
				<Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2.5, mb: 2 }}>
					<Typography sx={{ fontSize: '2rem', textTransform: 'uppercase', color: '#000', fontWeight: 700, mb: 1 }}>
						Saved Projects
					</Typography>
					<Typography sx={{ color: '#151618', fontSize: '0.95rem', mb: 2 }}>
						Now that you've created a project, add one or more lesson activities to that project.
					</Typography>
					{displayProjects.length === 0 && (
						<Typography sx={{ color: '#bbb', fontSize: '1.2rem', textAlign: 'center', py: 2 }}>
							No saved projects yet.
						</Typography>
					)}

					<Stack spacing={1}>
								{displayProjects.map((project) => {
									const lessonActivities = Array.isArray(project.lessonActivities) ? project.lessonActivities : [];

									return (
										<Box
											key={project.id}
											sx={{
												border: '1px solid',
											borderColor: '#e0e0e0',
												borderRadius: 1,
												p: 1.2,
											backgroundColor: '#fafafa',
											}}
										>
											<Stack direction="row" alignItems="center" spacing={0.8}>
												<Typography sx={{ fontSize: '1.4rem', fontWeight: 700, flex: 1 }} noWrap title={project.name}>
													{project.name}
												</Typography>
												{isAuthenticated && (
													<Button size="small" variant="contained" color="info" onClick={() => handleSyncProject(project.id)} sx={{ textTransform: 'none' }}>
														Sync Changes
													</Button>
												)}
												{isAuthenticated && (
													<Button size="small" variant="contained" color="error" onClick={() => handleDeleteProject(project.id)} sx={{ textTransform: 'none' }}>
														Delete Project
													</Button>
												)}
												<Chip
													label={lessonActivities.length}
													size="small"
													sx={{
														height: 18,
														fontSize: '0.89rem',
														backgroundColor: '#eef2ff',
														color: '#3f37c9',
													}}
												/>
											</Stack>

											<Typography sx={{ fontSize: '0.75rem', color: '#888', mt: 0.2 }}>
												{formatProjectDate(project.createdAt)}
												{' · '}
												{project.syncedAt ? 'Synced' : 'Saved'}
											</Typography>

											<Stack direction={{ xs: 'column', md: 'row' }} spacing={0.6} sx={{ mt: 1, mb: lessonActivities.length ? 0.8 : 0 }}>
											{(
												<TextField
													select
													size="small"
													label="Type"
													value={newActivityTypeByProjectId[project.id] || defaultActivityType}
													onChange={(event) => {
														const nextType = event.target.value;
														setNewActivityTypeByProjectId((prev) => ({ ...prev, [project.id]: nextType }));
													}}
													sx={{ minWidth: 130 }}
												>
													{LESSON_ACTIVITY_TYPES.map((option) => (
														<MenuItem key={option.value} value={option.value}>
															{option.label}
														</MenuItem>
													))}
												</TextField>
											)}
											{(
												<Button size="small" variant="contained" color="success" onClick={() => handleNewActivity(project.id)} sx={{ textTransform: 'none' }}>
													Add Activity
												</Button>
											)}
											{lessonActivities.length > 0 && (
												<Button size="small" variant="outlined" onClick={() => handleLaunchSlideshow(project.id)} sx={{ textTransform: 'none' }}>
													Present Lesson Activities
												</Button>
											)}
											</Stack>

											{lessonActivities.length > 0 && (
												<Table
													size="small"
													sx={{
														borderCollapse: 'separate',
														borderSpacing: '0 6px',
														tableLayout: 'fixed',
														'& .MuiTableCell-root': {
															borderBottom: 'none',
														},
													}}
												>
													<TableHead>
														<TableRow sx={{ backgroundColor: '#eef2ff' }}>
															<TableCell sx={{ width: 290, py: 0.9, pl: 1.2, pr: 1, borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }}>
																<Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: '#374151', textAlign: 'left' }}>
																	Activity
																</Typography>
															</TableCell>
															<TableCell sx={{ width: 220, py: 0.9, px: 1 }}>
																<Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: '#374151', textAlign: 'left' }}>
																	Activity Template
																</Typography>
															</TableCell>
															<TableCell sx={{ width: '100%', py: 0.9, px: 0 }} />
															<TableCell sx={{ width: 170, py: 0.9, px: 1, textAlign: 'right' }}>
																<Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: '#374151', textAlign: 'left', display: 'inline-block', width: '100%', maxWidth: 170 }}>
																	Date Synced
																</Typography>
															</TableCell>
															<TableCell sx={{ width: 180, py: 0.9, pl: 1, pr: 1.2, textAlign: 'right', borderTopRightRadius: 6, borderBottomRightRadius: 6 }}>
																<Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: '#374151', textAlign: 'left', display: 'inline-block', width: '100%', maxWidth: 180 }}>
																	Manage
																</Typography>
															</TableCell>
														</TableRow>
													</TableHead>
													<TableBody>
														{lessonActivities.map((activity, activityIndex) => {
															const draftKey = `${project.id}:${activityIndex}`;
															const activityType = String(activity['tmk-template'] || 'unknown');
															const canOpenType = Boolean(getLessonActivityRoute(activityType));

															return (
																<TableRow
																	key={draftKey}
																	sx={{
																		backgroundColor: activityIndex % 2 === 0 ? '#ffffff' : '#f8fafc',
																	}}
																>
																	<TableCell sx={{ py: 0.9, pl: 1.2, pr: 1, borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }}>
																		<Stack direction="row" spacing={0.4} alignItems="center" sx={{ minWidth: 0 }}>
																			<Checkbox
																				size="small"
																				checked={Array.isArray(selectedForSlideshowByProjectId[project.id]) && selectedForSlideshowByProjectId[project.id].includes(activityIndex)}
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
																			<Typography sx={{ fontSize: '1rem', color: '#555', textAlign: 'left' }} noWrap>
																				{activity['lesson-name'] || project.name}
																			</Typography>
																		</Stack>
																	</TableCell>
																	<TableCell sx={{ py: 0.9, px: 1 }}>
																		<Typography sx={{ fontSize: '0.95rem', color: '#6b7280', textAlign: 'left' }} noWrap>
																			{activityType}
																		</Typography>
																	</TableCell>
																	<TableCell sx={{ py: 0.9, px: 0 }} />
																	<TableCell sx={{ py: 0.9, px: 1, textAlign: 'right' }}>
																		<Typography sx={{ fontSize: '0.95rem', color: '#888', textAlign: 'left', display: 'inline-block', width: '100%', maxWidth: 170 }}>
																			{formatActivityDate(activity['modified-at']) || '--'}
																		</Typography>
																	</TableCell>
																	<TableCell sx={{ py: 0.9, pl: 1, pr: 1.2, textAlign: 'right', borderTopRightRadius: 6, borderBottomRightRadius: 6 }}>
																		<Stack direction="row" spacing={0.5} justifyContent="flex-end" sx={{ display: 'inline-flex', width: '100%', maxWidth: 180 }}>
																			{isAuthenticated && (
																				<Button
																					size="small"
																					variant="contained"
																					disabled={!canOpenType}
																					onClick={() => handleOpenActivity(project, activity, activityIndex)}
																					sx={{ textTransform: 'none', minWidth: 60 }}
																				>
																					Open
																				</Button>
																			)}
																			{isAuthenticated && (
																				<Button
																					size="small"
																					variant="contained"
																					color="error"
																					onClick={() => handleDeleteActivity(project.id, activityIndex)}
																					sx={{ textTransform: 'none', minWidth: 52 }}
																				>
																					Delete
																				</Button>
																			)}
																		</Stack>
																	</TableCell>
																</TableRow>
															);
														})}
													</TableBody>
												</Table>
											)}
										</Box>
									);
								})}
							</Stack>

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

					<Box sx={{ borderTop: '1px solid #eee', pt: 1.5, mt: 2 }}>
						{isAuthenticated ? (
							<Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" flexWrap="wrap">
								<Typography sx={{ fontSize: '0.82rem', color: '#555' }}>
									Sync each project individually using its `Sync Changes` button.
									Licensed for use by {authUser?.email ? ` - ${authUser.email}` : ''}
								</Typography>
								<Stack direction="row" spacing={0.6}>
									<Button
										size="small"
										variant="contained"
										color="info"
										disabled={isLoadingCloudProjects}
										onClick={async () => {
											await loadCloudProjects();
											if (!cloudMessage) {
												setCloudStatus('Cloud refreshed.', 'success');
											}
										}}
										sx={{ textTransform: 'none' }}
									>
										{isLoadingCloudProjects ? 'Refreshing...' : 'Refresh Cloud'}
									</Button>
								</Stack>
							</Stack>
						) : (
							<Typography sx={{ fontSize: '0.82rem', color: '#666' }}>
								Login with Teachable to sync projects.
							</Typography>
						)}
					</Box>
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
		</Box>
	);
}
