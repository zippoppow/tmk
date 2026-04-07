'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Alert,
	Box,
	Button,
	Chip,
	Container,
	Divider,
	MenuItem,
	Paper,
	Snackbar,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import {
	DIY_PROJECTS_ENDPOINT,
	LESSON_ACTIVITIES_ENDPOINT,
	buildLessonActivityUpsertPayload,
	createLessonActivityId,
	deleteLessonActivityById,
	formatActivityDate,
	formatProjectDate,
	getLessonActivityProjectAssociation,
	getAllStoredProjects,
	listLessonActivities,
	saveStoredProjects,
} from '../components/lessonActivityHelpers';
import {
	buildTeachableLogoutUrl,
	fetchAuthenticatedUser,
	fetchWithUserToken,
	resolveTmkApiOrigin,
} from '../components/authHelpers';
import {
	buildDiyProjectsPayload,
	createLessonActivitySnapshot,
	createLocalProjectRecord,
	getProjectLessonActivities,
	getUniqueLessonActivityName,
	mergeDisplayProjects,
	normalizeCloudProjects,
} from '../components/projectManagerModel';
import AuthDebugPanel from '../components/AuthDebugPanel';

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
	const [authLoading, setAuthLoading] = useState(true);
	const [authUser, setAuthUser] = useState(null);
	const [localProjects, setLocalProjects] = useState([]);
	const [cloudProjects, setCloudProjects] = useState([]);
	const [isLoadingCloudProjects, setIsLoadingCloudProjects] = useState(false);
	const [cloudMessage, setCloudMessage] = useState('');
	const [cloudMessageSeverity, setCloudMessageSeverity] = useState('error');
	const [projectNameInput, setProjectNameInput] = useState('');
	const [selectedLocalProjectId, setSelectedLocalProjectId] = useState(null);
	const [activityNameDrafts, setActivityNameDrafts] = useState({});
	const [newActivityTypeByProjectId, setNewActivityTypeByProjectId] = useState({});
	const [defaultActivityType, setDefaultActivityType] = useState(LESSON_ACTIVITY_TYPES[0].value);
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

	const loadCloudProjects = async () => {
		if (!isAuthenticated) {
			setCloudProjects([]);
			setCloudStatus('');
			return;
		}

		setIsLoadingCloudProjects(true);
		setCloudStatus('');

		try {
			const response = await fetchWithUserToken(apiOrigin, DIY_PROJECTS_ENDPOINT, {
				method: 'GET',
			});

			if (!response.ok) {
				setCloudProjects([]);
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

			setCloudProjects(enrichedProjects);
		} catch (error) {
			console.error('Failed to load cloud projects:', error);
			setCloudProjects([]);
			setCloudStatus('Cloud load failed. Please try Refresh Cloud.');
		} finally {
			setIsLoadingCloudProjects(false);
		}
	};

	const syncProjectToApi = async (project) => {
		if (!isAuthenticated) {
			return null;
		}

		try {
			const activities = getProjectLessonActivities(project, PROJECT_FORM_NAME, normalizeLessonInputData);
			for (const activity of activities) {
				const activityId = String(activity.id || createLessonActivityId());
				activity.id = activityId;
				const lessonTemplate = String(activity['tmk-template'] || '').trim() || PROJECT_FORM_NAME;
				await fetchWithUserToken(apiOrigin, LESSON_ACTIVITIES_ENDPOINT, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(
						buildLessonActivityUpsertPayload({
							id: activityId,
							template: lessonTemplate,
							lessonName: activity['lesson-name'] || project.name || 'Lesson Activity',
							lessonInputData: normalizeLessonInputData(activity['lesson-input-data'] || {}),
							createdAt: activity['created-at'],
							modifiedAt: activity['modified-at'],
							extra: {
								projectId: project.id,
								projectName: project.name || '',
								formName: lessonTemplate,
							},
						})
					),
				});
			}

			const payload = buildDiyProjectsPayload({
				project,
				formName: PROJECT_FORM_NAME,
				normalizeLessonInputData,
			});
			const response = await fetchWithUserToken(apiOrigin, DIY_PROJECTS_ENDPOINT, {
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
		return mergeDisplayProjects(localProjects, cloudProjects, PROJECT_FORM_NAME, normalizeLessonInputData);
	}, [localProjects, cloudProjects]);

	const unsyncedCount = useMemo(() => {
		return localProjects.filter((project) => !project.syncedAt).length;
	}, [localProjects]);

	const selectedProjectText = useMemo(() => {
		if (!selectedLocalProjectId) {
			return 'No project selected. Create and select a Lesson Activities Project first.';
		}
		const project = getLocalProjectById(selectedLocalProjectId);
		return project ? `Selected project: ${project.name}` : 'No project selected.';
	}, [selectedLocalProjectId, localProjects]);

	const runAuthCheck = async () => {
		setAuthLoading(true);
		try {
			const user = await fetchAuthenticatedUser(apiOrigin);
			setAuthUser(user);
		} catch {
			setAuthUser(null);
		} finally {
			setAuthLoading(false);
		}
	};

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

	const handleCreateProject = () => {
		const trimmedName = projectNameInput.trim();
		if (!trimmedName) {
			return;
		}

		const projects = getAllStoredProjects();
		const existing = projects.find(
			(project) => project.formName === PROJECT_FORM_NAME && (project.name || '').trim() === trimmedName
		);
		if (existing) {
			setSelectedLocalProjectId(existing.id);
			setProjectNameInput('');
			loadLocalProjects();
			showNotice('info', 'Project already exists. Selected existing project.');
			return;
		}

		const created = createLocalProjectRecord(trimmedName, PROJECT_FORM_NAME);
		projects.unshift(created);
		saveStoredProjects(projects);
		setProjectNameInput('');
		setSelectedLocalProjectId(created.id);
		setNewActivityTypeByProjectId((prev) => ({ ...prev, [created.id]: defaultActivityType }));
		loadLocalProjects();
	};

	const handleSelectProject = (projectId) => {
		setSelectedLocalProjectId(projectId);
	};

	const handleDeleteProject = (projectId) => {
		const project = getLocalProjectById(projectId);
		if (!project) {
			return;
		}

		const shouldDelete = window.confirm(`Delete "${project.name}"? This cannot be undone.`);
		if (!shouldDelete) {
			return;
		}

		if (isAuthenticated) {
			const activities = getProjectLessonActivities(project, PROJECT_FORM_NAME, normalizeLessonInputData);
			activities.forEach((activity) => {
				if (activity?.id) {
					deleteLessonActivityById(apiOrigin, String(activity.id));
				}
			});
		}

		saveStoredProjects(getAllStoredProjects().filter((item) => item.id !== projectId));
		if (selectedLocalProjectId === projectId) {
			setSelectedLocalProjectId(null);
		}
		setNewActivityTypeByProjectId((prev) => {
			const next = { ...prev };
			delete next[projectId];
			return next;
		});
		loadLocalProjects();
	};

	const handleNewActivity = (projectId) => {
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
		setSelectedLocalProjectId(project.id);
		showNotice('success', `${requestedType} lesson activity added.`);
	};

	const handleOpenActivity = (project, activity, activityIndex) => {
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

	const handleUpdateActivityName = (projectId, activityIndex) => {
		const projects = getAllStoredProjects();
		const project = projects.find((item) => item.id === projectId);
		if (!project) {
			return;
		}

		const activities = getProjectLessonActivities(project, PROJECT_FORM_NAME, normalizeLessonInputData);
		if (!activities[activityIndex]) {
			return;
		}

		const key = `${projectId}:${activityIndex}`;
		const requestedName = activityNameDrafts[key] || activities[activityIndex]['lesson-name'] || '';
		const uniqueName = getUniqueLessonActivityName({
			project,
			requestedName: requestedName || project.name || 'Lesson Activity',
			formName: PROJECT_FORM_NAME,
			normalizeLessonInputData,
			excludeIndex: activityIndex,
		});

		activities[activityIndex] = {
			...activities[activityIndex],
			'lesson-name': uniqueName,
			'modified-at': Date.now(),
		};
		project.lessonActivities = activities;
		project.modifiedAtMs = Date.now();
		project.syncedAt = null;

		saveStoredProjects(projects);
		loadLocalProjects();
		showNotice('success', 'Lesson activity name updated.');
	};

	const handleDeleteActivity = async (projectId, activityIndex) => {
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
			await deleteLessonActivityById(apiOrigin, String(activity.id));
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

	const handleSyncAll = async () => {
		if (!isAuthenticated) {
			return;
		}

		const unsyncedProjects = getAllStoredProjects().filter(
			(project) => project.formName === PROJECT_FORM_NAME && !project.syncedAt
		);

		let count = 0;
		for (const project of unsyncedProjects) {
			const result = await syncProjectToApi(project);
			if (result) {
				count += 1;
			}
		}

		if (count > 0) {
			showNotice('success', `${count} project(s) synced to cloud.`);
		} else if (unsyncedProjects.length === 0) {
			showNotice('info', 'All projects are already synced.');
		} else {
			showNotice('error', 'Sync failed. Check your connection.');
		}

		await loadCloudProjects();
	};

	useEffect(() => {
		loadLocalProjects();
		runAuthCheck();
	}, []);

	useEffect(() => {
		if (isAuthenticated) {
			loadCloudProjects();
		} else {
			setCloudProjects([]);
			setCloudStatus('');
		}
	}, [isAuthenticated]);

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
					<Chip
						label="Project-first workflow"
						color="primary"
						variant="outlined"
						sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}
					/>
				</Stack>

				<Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2.5, mb: 2 }}>
					<Typography sx={{ fontSize: '1.3rem', fontWeight: 800, mb: 0.5 }}>Lesson Activities Projects</Typography>
					<Typography sx={{ color: '#5a6472', fontSize: '0.95rem', mb: 2 }}>
						Create a project first. Then choose a Lesson Activity type and add activities under that project. For now, Intro is the implemented example type.
					</Typography>

					<Stack direction="row" spacing={1} sx={{ mb: 1.2 }}>
						<TextField
							size="small"
							fullWidth
							placeholder="Lesson Activities Project name..."
							value={projectNameInput}
							onChange={(event) => setProjectNameInput(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === 'Enter') {
									event.preventDefault();
									handleCreateProject();
								}
							}}
						/>
						<Button variant="contained" color="success" onClick={handleCreateProject} sx={{ textTransform: 'none' }}>
							Create Project
						</Button>
					</Stack>
					<Typography sx={{ color: '#666', fontSize: '0.82rem', mb: 1 }}>{selectedProjectText}</Typography>

					<Divider sx={{ mb: 1.5 }} />

					<Typography sx={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#777', fontWeight: 700, mb: 1 }}>
						Saved Projects
					</Typography>
					{displayProjects.length === 0 && (
						<Typography sx={{ color: '#bbb', fontSize: '0.9rem', textAlign: 'center', py: 2 }}>
							No saved projects yet.
						</Typography>
					)}

					<Stack spacing={1}>
								{displayProjects.map((project) => {
									const lessonActivities = Array.isArray(project.lessonActivities) ? project.lessonActivities : [];
									const isSelected = project.source === 'local' && project.id === selectedLocalProjectId;

									return (
										<Box
											key={project.id}
											sx={{
												border: '1px solid',
												borderColor: isSelected ? '#667eea' : '#e0e0e0',
												borderRadius: 1,
												p: 1.2,
												backgroundColor: isSelected ? '#eef2ff' : '#fafafa',
											}}
										>
											<Stack direction="row" alignItems="center" spacing={0.8}>
												<Typography sx={{ fontSize: '0.92rem', fontWeight: 700, flex: 1 }} noWrap title={project.name}>
													{project.name}
												</Typography>
												<Chip
													label={lessonActivities.length}
													size="small"
													sx={{
														height: 18,
														fontSize: '0.72rem',
														backgroundColor: '#eef2ff',
														color: '#3f37c9',
													}}
												/>
											</Stack>

											<Typography sx={{ fontSize: '0.75rem', color: '#888', mt: 0.2 }}>
												{formatProjectDate(project.createdAt)}
												{' · '}
												{project.source === 'cloud' ? 'Cloud' : project.syncedAt ? 'Synced' : 'Local'}
											</Typography>

<Stack direction={{ xs: 'column', md: 'row' }} spacing={0.6} sx={{ mt: 1, mb: lessonActivities.length ? 0.8 : 0 }}>
											{project.source === 'local' && (
												<Button size="small" variant="outlined" onClick={() => handleSelectProject(project.id)} sx={{ textTransform: 'none' }}>
													Select
												</Button>
											)}
											{project.source === 'local' && (
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
											{project.source === 'local' && (
												<Button size="small" variant="contained" color="success" onClick={() => handleNewActivity(project.id)} sx={{ textTransform: 'none' }}>
													Add Activity
												</Button>
											)}
											{project.source === 'local' && (
												<Button size="small" variant="contained" color="error" onClick={() => handleDeleteProject(project.id)} sx={{ textTransform: 'none' }}>
													Delete Project
													</Button>
												)}
											</Stack>

											<Stack spacing={0.6}>
												{lessonActivities.map((activity, activityIndex) => {
													const draftKey = `${project.id}:${activityIndex}`;
													const activityType = String(activity['tmk-template'] || 'unknown');
													const canOpenType = Boolean(getLessonActivityRoute(activityType));

													return (
														<Stack key={draftKey} direction="row" spacing={0.6} alignItems="center">
															{project.source === 'local' ? (
																<TextField
																	size="small"
																	value={activityNameDrafts[draftKey] ?? String(activity['lesson-name'] || 'Lesson')}
																	onChange={(event) => {
																		const value = event.target.value;
																		setActivityNameDrafts((prev) => ({ ...prev, [draftKey]: value }));
																	}}
																	sx={{ flex: 1 }}
																/>
															) : (
																<Typography sx={{ flex: 1, fontSize: '0.78rem', color: '#555' }} noWrap>
																	{activity['lesson-name'] || project.name}
																</Typography>
															)}
															<Typography sx={{ fontSize: '0.72rem', color: '#888', minWidth: 98 }}>
																{activityType}
																{formatActivityDate(activity['modified-at']) ? ` · ${formatActivityDate(activity['modified-at'])}` : ''}
															</Typography>
															{activity?.id ? (
																<Chip
																	size="small"
																	label={`ID: ${String(activity.id).slice(0, 10)}...`}
																	variant="outlined"
																	sx={{ height: 20, fontSize: '0.68rem', color: '#4b5563', borderColor: '#cbd5e1' }}
																/>
															) : (
																<Chip
																	size="small"
																	label="ID: pending"
																	variant="outlined"
																	sx={{ height: 20, fontSize: '0.68rem', color: '#9ca3af', borderColor: '#e5e7eb' }}
																/>
															)}
															<Button
																size="small"
																variant="contained"
																disabled={!canOpenType}
																onClick={() => handleOpenActivity(project, activity, activityIndex)}
																sx={{ textTransform: 'none', minWidth: 60 }}
															>
																Open
															</Button>
															{project.source === 'local' && (
																<>
																	<Button
																		size="small"
																		variant="contained"
																		color="warning"
																		onClick={() => handleUpdateActivityName(project.id, activityIndex)}
																		sx={{ textTransform: 'none', minWidth: 70 }}
																	>
																		Rename
																	</Button>
																	<Button
																		size="small"
																		variant="contained"
																		color="error"
																		onClick={() => handleDeleteActivity(project.id, activityIndex)}
																		sx={{ textTransform: 'none', minWidth: 52 }}
																	>
																		Del
																	</Button>
																</>
															)}
														</Stack>
													);
												})}
											</Stack>
										</Box>
									);
								})}
							</Stack>

					{isLoadingCloudProjects && (
						<Typography sx={{ color: '#999', fontSize: '0.83rem', mt: 1 }}>Loading cloud projects...</Typography>
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
									{unsyncedCount > 0 ? `${unsyncedCount} project(s) not yet synced` : 'All projects synced'}
									{authUser?.email ? ` - ${authUser.email}` : ''}
								</Typography>
								<Stack direction="row" spacing={0.6}>
									<Button
										size="small"
										variant="contained"
										color="success"
										onClick={handleSyncAll}
										sx={{ textTransform: 'none' }}
									>
										Sync All
									</Button>
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
