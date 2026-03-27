'use client';

import { useEffect, useMemo, useState } from 'react';
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
	buildTeachableLogoutUrl,
	fetchAuthenticatedUser,
	formatActivityDate,
	formatProjectDate,
	getAllStoredProjects,
	resolveTmkApiOrigin,
	saveStoredProjects,
} from '../lesson-activities/components/lessonActivityHelpers';
import {
	buildDiyProjectsPayload,
	createLessonActivitySnapshot,
	createLocalProjectRecord,
	getProjectLessonActivities,
	getUniqueLessonActivityName,
	mergeDisplayProjects,
	normalizeCloudProjects,
} from '../lesson-activities/components/projectManagerModel';

const DEFAULT_FORM_NAME = 'intro';

function normalizeLessonInputData(rawData) {
	if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
		return {};
	}
	return rawData;
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
	const [selectedFormName, setSelectedFormName] = useState(DEFAULT_FORM_NAME);
	const [projectNameInput, setProjectNameInput] = useState('');
	const [selectedLocalProjectId, setSelectedLocalProjectId] = useState(null);
	const [selectedLessonActivity, setSelectedLessonActivity] = useState(null);
	const [activityNameDrafts, setActivityNameDrafts] = useState({});
	const [currentLessonInputJson, setCurrentLessonInputJson] = useState('{}');
	const [notice, setNotice] = useState({ open: false, severity: 'success', message: '' });

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
		setLocalProjects(getAllStoredProjects().filter((project) => project.formName === selectedFormName));
	};

	const getLocalProjectById = (projectId) => {
		return getAllStoredProjects().find((project) => project.id === projectId && project.formName === selectedFormName) || null;
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
			const response = await fetch(`${apiOrigin}${DIY_PROJECTS_ENDPOINT}`, {
				method: 'GET',
				credentials: 'include',
			});

			if (!response.ok) {
				setCloudProjects([]);
				setCloudStatus('Cloud load failed. Please try Refresh Cloud.');
				return;
			}

			const payload = await response.json();
			const normalized = normalizeCloudProjects(payload, selectedFormName, normalizeLessonInputData).map((project) => {
				const activities = getProjectLessonActivities(project, selectedFormName, normalizeLessonInputData).filter((activity) => {
					return String(activity['tmk-template'] || '') === selectedFormName;
				});
				return {
					...project,
					lessonActivities: activities,
				};
			}).filter((project) => project.lessonActivities.length > 0);
			setCloudProjects(normalized);
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
			const payload = buildDiyProjectsPayload({
				project,
				formName: selectedFormName,
				userEmail: authUser?.email,
				normalizeLessonInputData,
			});
			const response = await fetch(`${apiOrigin}${DIY_PROJECTS_ENDPOINT}`, {
				method: 'POST',
				credentials: 'include',
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
		return mergeDisplayProjects(localProjects, cloudProjects, selectedFormName, normalizeLessonInputData);
	}, [localProjects, cloudProjects, selectedFormName]);

	const availableForms = useMemo(() => {
		const known = new Set([DEFAULT_FORM_NAME]);
		getAllStoredProjects().forEach((project) => {
			if (project?.formName) {
				known.add(String(project.formName));
			}
		});
		return Array.from(known).sort((a, b) => a.localeCompare(b));
	}, [localProjects]);

	const unsyncedCount = useMemo(() => {
		return localProjects.filter((project) => !project.syncedAt).length;
	}, [localProjects]);

	const selectedProjectText = useMemo(() => {
		if (!selectedLocalProjectId) {
			return 'No project selected. Create and select a project to manage lesson activities.';
		}
		const project = getLocalProjectById(selectedLocalProjectId);
		return project ? `Selected project: ${project.name}` : 'No project selected.';
	}, [selectedLocalProjectId, localProjects, selectedFormName]);

	const runAuthCheck = async () => {
		setAuthLoading(true);
		try {
			const user = await fetchAuthenticatedUser();
			setAuthUser(user);
		} catch {
			setAuthUser(null);
		} finally {
			setAuthLoading(false);
		}
	};

	const handleCreateProject = () => {
		const trimmedName = projectNameInput.trim();
		if (!trimmedName) {
			return;
		}

		const projects = getAllStoredProjects();
		const existing = projects.find(
			(project) => project.formName === selectedFormName && (project.name || '').trim() === trimmedName
		);
		if (existing) {
			setSelectedLocalProjectId(existing.id);
			setProjectNameInput('');
			loadLocalProjects();
			showNotice('info', 'Project already exists. Selected existing project.');
			return;
		}

		projects.unshift(createLocalProjectRecord(trimmedName, selectedFormName));
		saveStoredProjects(projects);
		setProjectNameInput('');
		setSelectedLocalProjectId(projects[0].id);
		setSelectedLessonActivity(null);
		loadLocalProjects();
	};

	const handleSelectProject = (projectId) => {
		setSelectedLocalProjectId(projectId);
		setSelectedLessonActivity(null);
		setCurrentLessonInputJson('{}');
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

		saveStoredProjects(getAllStoredProjects().filter((item) => item.id !== projectId));
		if (selectedLocalProjectId === projectId) {
			setSelectedLocalProjectId(null);
		}
		if (selectedLessonActivity?.projectId === projectId) {
			setSelectedLessonActivity(null);
		}
		setCurrentLessonInputJson('{}');
		loadLocalProjects();
	};

	const handleNewActivity = (projectId) => {
		const projects = getAllStoredProjects();
		const project = projects.find((item) => item.id === projectId);
		if (!project) {
			return;
		}

		const requestedName = String(window.prompt('Lesson activity name:', '') || '').trim();
		const uniqueName = getUniqueLessonActivityName({
			project,
			requestedName: requestedName || project.name || 'Lesson Activity',
			formName: selectedFormName,
			normalizeLessonInputData,
		});
		const snapshot = createLessonActivitySnapshot({
			formName: selectedFormName,
			projectName: project.name,
			lessonName: uniqueName,
			lessonInputData: {},
			normalizeLessonInputData,
			currentLessonInputData: {},
		});
		const activities = getProjectLessonActivities(project, selectedFormName, normalizeLessonInputData);

		project.lessonActivities = [...activities, snapshot];
		project.modifiedAtMs = Date.now();
		project.syncedAt = null;

		saveStoredProjects(projects);
		loadLocalProjects();
		setSelectedLocalProjectId(project.id);
		setSelectedLessonActivity({ projectId: project.id, activityIndex: project.lessonActivities.length - 1 });
		setCurrentLessonInputJson(JSON.stringify(snapshot['lesson-input-data'] || {}, null, 2));
	};

	const handleLoadLatest = (project) => {
		const activities = getProjectLessonActivities(project, selectedFormName, normalizeLessonInputData);
		const latest = activities.length ? activities[activities.length - 1] : null;
		if (!latest) {
			return;
		}

		setCurrentLessonInputJson(JSON.stringify(latest['lesson-input-data'] || {}, null, 2));
		if (project.source === 'local') {
			setSelectedLocalProjectId(project.id);
			setSelectedLessonActivity({ projectId: project.id, activityIndex: Math.max(activities.length - 1, 0) });
		}
		showNotice('success', 'Loaded latest lesson activity data into editor.');
	};

	const handleLoadActivity = (project, activityIndex) => {
		const activities = getProjectLessonActivities(project, selectedFormName, normalizeLessonInputData);
		const activity = activities[activityIndex];
		if (!activity) {
			return;
		}

		setCurrentLessonInputJson(JSON.stringify(activity['lesson-input-data'] || {}, null, 2));
		if (project.source === 'local') {
			setSelectedLocalProjectId(project.id);
			setSelectedLessonActivity({ projectId: project.id, activityIndex });
		}
	};

	const handleUpdateActivity = (projectId, activityIndex) => {
		const projects = getAllStoredProjects();
		const project = projects.find((item) => item.id === projectId);
		if (!project) {
			return;
		}

		const activities = getProjectLessonActivities(project, selectedFormName, normalizeLessonInputData);
		if (!activities[activityIndex]) {
			return;
		}

		let parsedInputData;
		try {
			parsedInputData = JSON.parse(currentLessonInputJson || '{}');
		} catch {
			showNotice('error', 'Lesson input JSON is invalid. Fix JSON before updating.');
			return;
		}

		const key = `${projectId}:${activityIndex}`;
		const requestedName = activityNameDrafts[key] || activities[activityIndex]['lesson-name'] || '';
		const uniqueName = getUniqueLessonActivityName({
			project,
			requestedName: requestedName || project.name || 'Lesson Activity',
			formName: selectedFormName,
			normalizeLessonInputData,
			excludeIndex: activityIndex,
		});

		activities[activityIndex] = {
			...activities[activityIndex],
			'lesson-name': uniqueName,
			'modified-at': Date.now(),
			'lesson-input-data': normalizeLessonInputData(parsedInputData),
		};
		project.lessonActivities = activities;
		project.modifiedAtMs = Date.now();
		project.syncedAt = null;

		saveStoredProjects(projects);
		loadLocalProjects();
		setSelectedLocalProjectId(project.id);
		setSelectedLessonActivity({ projectId: project.id, activityIndex });
		showNotice('success', 'Lesson activity updated.');
	};

	const handleDeleteActivity = (projectId, activityIndex) => {
		const projects = getAllStoredProjects();
		const projectIndex = projects.findIndex((item) => item.id === projectId);
		if (projectIndex === -1) {
			return;
		}

		const project = projects[projectIndex];
		const activities = getProjectLessonActivities(project, selectedFormName, normalizeLessonInputData);
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
		if (nextActivities.length === 0) {
			projects.splice(projectIndex, 1);
			if (selectedLocalProjectId === projectId) {
				setSelectedLocalProjectId(null);
			}
			setSelectedLessonActivity(null);
			setCurrentLessonInputJson('{}');
		} else {
			project.lessonActivities = nextActivities;
			project.modifiedAtMs = Date.now();
			project.syncedAt = null;
			if (selectedLessonActivity?.projectId === projectId) {
				if (selectedLessonActivity.activityIndex === activityIndex) {
					setSelectedLessonActivity({ projectId, activityIndex: Math.max(activityIndex - 1, 0) });
				} else if (selectedLessonActivity.activityIndex > activityIndex) {
					setSelectedLessonActivity({
						projectId,
						activityIndex: selectedLessonActivity.activityIndex - 1,
					});
				}
			}
		}

		saveStoredProjects(projects);
		loadLocalProjects();
	};

	const handleSyncAll = async () => {
		if (!isAuthenticated) {
			return;
		}

		const unsyncedProjects = getAllStoredProjects().filter(
			(project) => project.formName === selectedFormName && !project.syncedAt
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
		runAuthCheck();
	}, []);

	useEffect(() => {
		loadLocalProjects();
		setSelectedLocalProjectId(null);
		setSelectedLessonActivity(null);
		setActivityNameDrafts({});
		setCurrentLessonInputJson('{}');
	}, [selectedFormName]);

	useEffect(() => {
		if (isAuthenticated) {
			loadCloudProjects();
		} else {
			setCloudProjects([]);
			setCloudStatus('');
		}
	}, [selectedFormName, isAuthenticated]);

	useEffect(() => {
		if (!selectedLessonActivity || !selectedLessonActivity.projectId || !Number.isInteger(selectedLessonActivity.activityIndex)) {
			return;
		}

		const timer = window.setTimeout(() => {
			let parsed;
			try {
				parsed = JSON.parse(currentLessonInputJson || '{}');
			} catch {
				return;
			}

			const projects = getAllStoredProjects();
			const project = projects.find(
				(item) => item.id === selectedLessonActivity.projectId && item.formName === selectedFormName
			);
			if (!project) {
				return;
			}

			const activities = getProjectLessonActivities(project, selectedFormName, normalizeLessonInputData);
			const targetIndex = selectedLessonActivity.activityIndex;
			if (!activities[targetIndex]) {
				return;
			}

			activities[targetIndex] = {
				...activities[targetIndex],
				'modified-at': Date.now(),
				'lesson-input-data': normalizeLessonInputData(parsed),
			};
			project.lessonActivities = activities;
			project.modifiedAtMs = Date.now();
			project.syncedAt = null;

			saveStoredProjects(projects);
			loadLocalProjects();
		}, 300);

		return () => window.clearTimeout(timer);
	}, [currentLessonInputJson, selectedLessonActivity, selectedFormName]);

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
					<TextField
						select
						size="small"
						label="Lesson Activity Type"
						value={selectedFormName}
						onChange={(event) => setSelectedFormName(event.target.value)}
						sx={{ minWidth: 220, bgcolor: 'white' }}
					>
						{availableForms.map((formName) => (
							<MenuItem key={formName} value={formName}>
								{formName}
							</MenuItem>
						))}
					</TextField>
				</Stack>

				<Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2.5, mb: 2 }}>
					<Typography sx={{ fontSize: '1.3rem', fontWeight: 800, mb: 0.5 }}>Create Project</Typography>
					<Typography sx={{ color: '#5a6472', fontSize: '0.95rem', mb: 2 }}>
						Manage projects and lesson activities outside a specific lesson page. In-lesson project workflows remain available via ProjectManagerPanel.
					</Typography>

					<Stack direction="row" spacing={1} sx={{ mb: 1.2 }}>
						<TextField
							size="small"
							fullWidth
							placeholder="Project name..."
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
							Create
						</Button>
					</Stack>
					<Typography sx={{ color: '#666', fontSize: '0.82rem', mb: 1 }}>{selectedProjectText}</Typography>

					<Divider sx={{ mb: 1.5 }} />

					<Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
						<Box sx={{ flex: 1 }}>
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

											<Stack direction="row" spacing={0.6} sx={{ mt: 1, mb: lessonActivities.length ? 0.8 : 0 }}>
												{project.source === 'local' && (
													<Button size="small" variant="outlined" onClick={() => handleSelectProject(project.id)} sx={{ textTransform: 'none' }}>
														Select
													</Button>
												)}
												{project.source === 'local' && (
													<Button size="small" variant="contained" color="success" onClick={() => handleNewActivity(project.id)} sx={{ textTransform: 'none' }}>
														New Activity
													</Button>
												)}
												<Button size="small" variant="contained" onClick={() => handleLoadLatest(project)} sx={{ textTransform: 'none' }}>
													Load Latest
												</Button>
												{project.source === 'local' && (
													<Button size="small" variant="contained" color="error" onClick={() => handleDeleteProject(project.id)} sx={{ textTransform: 'none' }}>
														Del
													</Button>
												)}
											</Stack>

											<Stack spacing={0.6}>
												{lessonActivities.map((activity, activityIndex) => {
													const draftKey = `${project.id}:${activityIndex}`;
													const selected =
														selectedLessonActivity?.projectId === project.id &&
														selectedLessonActivity?.activityIndex === activityIndex;

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
																	sx={{
																		flex: 1,
																		'& .MuiOutlinedInput-root': selected
																			? { backgroundColor: '#eef2ff', '& fieldset': { borderColor: '#667eea' } }
																			: undefined,
																	}}
																/>
															) : (
																<Typography sx={{ flex: 1, fontSize: '0.78rem', color: '#555' }} noWrap>
																	{activity['lesson-name'] || project.name}
																</Typography>
															)}
															<Typography sx={{ fontSize: '0.72rem', color: '#888', minWidth: 62 }}>
																{String(activity['tmk-template'] || selectedFormName)}
																{formatActivityDate(activity['modified-at']) ? ` · ${formatActivityDate(activity['modified-at'])}` : ''}
															</Typography>
															<Button size="small" variant="contained" onClick={() => handleLoadActivity(project, activityIndex)} sx={{ textTransform: 'none', minWidth: 52 }}>
																Load
															</Button>
															{project.source === 'local' && (
																<>
																	<Button
																		size="small"
																		variant="contained"
																		color="warning"
																		onClick={() => handleUpdateActivity(project.id, activityIndex)}
																		sx={{ textTransform: 'none', minWidth: 60 }}
																	>
																		Update
																	</Button>
																	<Button
																		size="small"
																		variant="contained"
																		color="error"
																		onClick={() => handleDeleteActivity(project.id, activityIndex)}
																		sx={{ textTransform: 'none', minWidth: 44 }}
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
						</Box>

						<Box sx={{ width: { xs: '100%', lg: 380 } }}>
							<Typography sx={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#777', fontWeight: 700, mb: 1 }}>
								Lesson Input Data (JSON)
							</Typography>
							<TextField
								multiline
								minRows={20}
								maxRows={30}
								fullWidth
								placeholder="Select or load a lesson activity to edit JSON data"
								value={currentLessonInputJson}
								onChange={(event) => setCurrentLessonInputJson(event.target.value)}
								sx={{ '& .MuiInputBase-root': { fontFamily: 'Menlo, Monaco, Consolas, monospace', fontSize: '0.82rem' } }}
							/>
							<Typography sx={{ color: '#7b8190', fontSize: '0.78rem', mt: 0.8 }}>
								For local projects, changes are auto-saved to the selected lesson activity after a short debounce.
							</Typography>
						</Box>
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
