'use client';

import { useEffect, useMemo, useState } from 'react';
import {
	Box,
	Button,
	Chip,
	Divider,
	Drawer,
	IconButton,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {
	DIY_PROJECTS_ENDPOINT,
	formatActivityDate,
	formatProjectDate,
	getAllStoredProjects,
	saveStoredProjects,
} from './lessonActivityHelpers';
import {
	buildDiyProjectsPayload,
	createLessonActivitySnapshot,
	createLocalProjectRecord,
	getLatestLessonActivity,
	getProjectLessonActivities,
	getUniqueLessonActivityName,
	mergeDisplayProjects,
	normalizeCloudProjects,
} from './projectManagerModel';

export default function ProjectManagerPanel({
	formName,
	apiOrigin,
	isAuthenticated,
	userEmail,
	currentLessonInputData,
	normalizeLessonInputData,
	createEmptyLessonInputData,
	applyLessonInputData,
	clearLessonInputs,
	onRequireLogin,
	onNotice,
}) {
	const [open, setOpen] = useState(false);
	const [localProjects, setLocalProjects] = useState([]);
	const [cloudProjects, setCloudProjects] = useState([]);
	const [isLoadingCloudProjects, setIsLoadingCloudProjects] = useState(false);
	const [cloudMessage, setCloudMessage] = useState('');
	const [cloudMessageSeverity, setCloudMessageSeverity] = useState('error');
	const [selectedLocalProjectId, setSelectedLocalProjectId] = useState(null);
	const [selectedLessonActivity, setSelectedLessonActivity] = useState(null);
	const [projectNameInput, setProjectNameInput] = useState('');
	const [activityNameDrafts, setActivityNameDrafts] = useState({});

	const notify = (severity, message) => {
		if (typeof onNotice === 'function') {
			onNotice(severity, message);
		}
	};

	const loadLocalProjects = () => {
		if (typeof window === 'undefined') {
			return;
		}
		setLocalProjects(getAllStoredProjects().filter((project) => project.formName === formName));
	};

	const getLocalProjectById = (projectId) => {
		return getAllStoredProjects().find((project) => project.id === projectId && project.formName === formName) || null;
	};

	const getSelectedLocalProject = () => {
		if (!selectedLocalProjectId) {
			return null;
		}
		return getLocalProjectById(selectedLocalProjectId);
	};

	const setCloudStatus = (message, severity = 'error') => {
		setCloudMessage(message || '');
		setCloudMessageSeverity(severity);
	};

	const displayProjects = useMemo(() => {
		return mergeDisplayProjects(localProjects, cloudProjects, formName, normalizeLessonInputData);
	}, [localProjects, cloudProjects, formName, normalizeLessonInputData]);

	const updateSelectedLessonActivityData = () => {
		if (!selectedLessonActivity || !selectedLessonActivity.projectId || !Number.isInteger(selectedLessonActivity.activityIndex)) {
			return;
		}

		const projects = getAllStoredProjects();
		const project = projects.find(
			(item) => item.id === selectedLessonActivity.projectId && item.formName === formName
		);
		if (!project) {
			return;
		}

		const activities = getProjectLessonActivities(project, formName, normalizeLessonInputData);
		const targetIndex = selectedLessonActivity.activityIndex;
		if (!activities[targetIndex]) {
			return;
		}

		activities[targetIndex] = {
			...activities[targetIndex],
			'modified-at': Date.now(),
			'lesson-input-data': normalizeLessonInputData(currentLessonInputData),
		};
		project.lessonActivities = activities;
		project.modifiedAtMs = Date.now();
		project.syncedAt = null;

		saveStoredProjects(projects);
		loadLocalProjects();
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
			setCloudProjects(normalizeCloudProjects(payload, formName, normalizeLessonInputData));
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
				formName,
				userEmail,
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

	const handleTogglePanel = () => {
		if (!isAuthenticated) {
			onRequireLogin?.();
			return;
		}

		setOpen((previous) => !previous);
	};

	const handleCreateProject = () => {
		const trimmedName = projectNameInput.trim();
		if (!trimmedName) {
			return;
		}

		const projects = getAllStoredProjects();
		const existing = projects.find(
			(project) => project.formName === formName && (project.name || '').trim() === trimmedName
		);
		if (existing) {
			setSelectedLocalProjectId(existing.id);
			setProjectNameInput('');
			loadLocalProjects();
			return;
		}

		projects.unshift(createLocalProjectRecord(trimmedName, formName));
		saveStoredProjects(projects);
		setProjectNameInput('');
		setSelectedLocalProjectId(projects[0].id);
		setSelectedLessonActivity(null);
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
			formName,
			normalizeLessonInputData,
		});
		const snapshot = createLessonActivitySnapshot({
			formName,
			projectName: project.name,
			lessonName: uniqueName,
			lessonInputData: createEmptyLessonInputData(),
			normalizeLessonInputData,
			currentLessonInputData,
		});
		const activities = getProjectLessonActivities(project, formName, normalizeLessonInputData);

		project.lessonActivities = [...activities, snapshot];
		project.modifiedAtMs = Date.now();
		project.syncedAt = null;

		saveStoredProjects(projects);
		loadLocalProjects();
		setSelectedLocalProjectId(project.id);
		setSelectedLessonActivity({ projectId: project.id, activityIndex: project.lessonActivities.length - 1 });
		clearLessonInputs?.();
	};

	const handleSelectProject = (projectId) => {
		setSelectedLocalProjectId(projectId);
		setSelectedLessonActivity(null);
	};

	const handleLoadLatest = (project) => {
		const latest = getLatestLessonActivity(project, formName, normalizeLessonInputData);
		if (!latest) {
			return;
		}

		const shouldLoad = window.confirm(
			`Load latest lesson activity from "${project.name}"? Your current answers will be replaced.`
		);
		if (!shouldLoad) {
			return;
		}

		applyLessonInputData(latest['lesson-input-data'] || {});
		if (project.source === 'local') {
			setSelectedLocalProjectId(project.id);
			const activities = getProjectLessonActivities(project, formName, normalizeLessonInputData);
			setSelectedLessonActivity({ projectId: project.id, activityIndex: Math.max(activities.length - 1, 0) });
		}
		setOpen(false);
	};

	const handleLoadActivity = (project, activityIndex) => {
		const activities = getProjectLessonActivities(project, formName, normalizeLessonInputData);
		const activity = activities[activityIndex];
		if (!activity) {
			return;
		}

		const shouldLoad = window.confirm(
			`Load lesson activity "${activity['lesson-name'] || project.name}" from "${project.name}"? Your current answers will be replaced.`
		);
		if (!shouldLoad) {
			return;
		}

		applyLessonInputData(activity['lesson-input-data'] || {});
		if (project.source === 'local') {
			setSelectedLocalProjectId(project.id);
			setSelectedLessonActivity({ projectId: project.id, activityIndex });
		}
		setOpen(false);
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
		loadLocalProjects();
	};

	const handleUpdateActivity = (projectId, activityIndex) => {
		const projects = getAllStoredProjects();
		const project = projects.find((item) => item.id === projectId);
		if (!project) {
			return;
		}

		const activities = getProjectLessonActivities(project, formName, normalizeLessonInputData);
		if (!activities[activityIndex]) {
			return;
		}

		const key = `${projectId}:${activityIndex}`;
		const requestedName = activityNameDrafts[key] || activities[activityIndex]['lesson-name'] || '';
		const uniqueName = getUniqueLessonActivityName({
			project,
			requestedName: requestedName || project.name || 'Lesson Activity',
			formName,
			normalizeLessonInputData,
			excludeIndex: activityIndex,
		});

		activities[activityIndex] = {
			...activities[activityIndex],
			'lesson-name': uniqueName,
			'modified-at': Date.now(),
			'lesson-input-data': normalizeLessonInputData(currentLessonInputData),
		};
		project.lessonActivities = activities;
		project.modifiedAtMs = Date.now();
		project.syncedAt = null;

		saveStoredProjects(projects);
		loadLocalProjects();
		setSelectedLocalProjectId(project.id);
		setSelectedLessonActivity({ projectId: project.id, activityIndex });
		notify('success', 'Lesson activity updated.');
	};

	const handleDeleteActivity = (projectId, activityIndex) => {
		const projects = getAllStoredProjects();
		const projectIndex = projects.findIndex((item) => item.id === projectId);
		if (projectIndex === -1) {
			return;
		}

		const project = projects[projectIndex];
		const activities = getProjectLessonActivities(project, formName, normalizeLessonInputData);
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
			(project) => project.formName === formName && !project.syncedAt
		);

		let count = 0;
		for (const project of unsyncedProjects) {
			const result = await syncProjectToApi(project);
			if (result) {
				count += 1;
			}
		}

		if (count > 0) {
			notify('success', `${count} project(s) synced to cloud.`);
		} else if (unsyncedProjects.length === 0) {
			notify('info', 'All projects are already synced.');
		} else {
			notify('error', 'Sync failed. Check your connection.');
		}

		await loadCloudProjects();
	};

	const unsyncedCount = useMemo(() => {
		return localProjects.filter((project) => !project.syncedAt).length;
	}, [localProjects]);

	const selectedProjectText = useMemo(() => {
		const selectedProject = getSelectedLocalProject();
		if (selectedProject) {
			return `Selected project: ${selectedProject.name}`;
		}
		return 'No project selected. Create and select a project to manage lesson activities.';
	}, [selectedLocalProjectId, localProjects]);

	useEffect(() => {
		loadLocalProjects();
	}, []);

	useEffect(() => {
		if (!isAuthenticated) {
			setOpen(false);
			setCloudProjects([]);
			setCloudStatus('');
		}
	}, [isAuthenticated]);

	useEffect(() => {
		if (open && isAuthenticated) {
			loadCloudProjects();
		}
	}, [open, isAuthenticated]);

	useEffect(() => {
		if (!selectedLessonActivity || !selectedLessonActivity.projectId || !Number.isInteger(selectedLessonActivity.activityIndex)) {
			return;
		}

		const timer = window.setTimeout(() => {
			updateSelectedLessonActivityData();
		}, 300);

		return () => window.clearTimeout(timer);
	}, [currentLessonInputData, selectedLessonActivity]);

	return (
		<>
			<Button
				variant="contained"
				disabled={!isAuthenticated}
				onClick={handleTogglePanel}
				sx={{
					textTransform: 'none',
					minWidth: 130,
					backgroundColor: '#4020A7',
					'&:hover': { backgroundColor: '#2e1580' },
				}}
				title={isAuthenticated ? 'Open Project Manager' : 'Login with Teachable to use Project Manager'}
			>
				Projects
			</Button>

			<Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
				<Box sx={{ width: { xs: 340, sm: 380 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
					<Box
						sx={{
							px: 2,
							py: 1.6,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
							color: 'white',
						}}
					>
						<Typography sx={{ fontWeight: 700 }}>Project Manager</Typography>
						<IconButton onClick={() => setOpen(false)} sx={{ color: 'white' }} size="small">
							<CloseIcon />
						</IconButton>
					</Box>

					<Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>
						<Typography sx={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#777', fontWeight: 700, mb: 1 }}>
							Project and Lesson Activity
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
						<Typography sx={{ color: '#666', fontSize: '0.8rem', mb: 2 }}>{selectedProjectText}</Typography>

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
															{String(activity['tmk-template'] || formName)}
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
					</Box>

					<Box sx={{ borderTop: '1px solid #eee', p: 1.5 }}>
						{isAuthenticated ? (
							<Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
								<Typography sx={{ fontSize: '0.82rem', color: '#555' }}>
									{unsyncedCount > 0
										? `${unsyncedCount} project(s) not yet synced`
										: 'All projects synced'}
									{userEmail ? ` - ${userEmail}` : ''}
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
				</Box>
			</Drawer>
		</>
	);
}
