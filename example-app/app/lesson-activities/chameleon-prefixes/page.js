'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Container,
	Menu,
	MenuItem,
	Snackbar,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import {
	buildTeachableLogoutUrl,
	buildTeachableStartUrl,
	createLessonActivityId,
	upsertLessonActivity,
	fetchWithUserToken,
	fetchAuthenticatedUser,
	readFormSessionData,
	resolveTmkApiOrigin,
	writeFormSessionData,
	DIY_PROJECTS_ENDPOINT,
	getAllStoredProjects,
	saveStoredProjects,
} from '../../components/lessonActivityHelpers';
import {
	buildDiyProjectsPayload,
	getProjectLessonActivities,
} from '../../components/projectManagerModel';

const FORM_NAME = 'chameleon-prefixes';

function emptyGrid() {
	return Array.from({ length: 12 }, () => '');
}

function emptyPairs() {
	return Array.from({ length: 12 }, () => ({ prefix: '', word: '' }));
}

function normalizeChameleonPrefixesLessonInputData(rawData) {
	const source = rawData && typeof rawData === 'object' ? rawData : {};

	const incomingGrid = Array.isArray(source.grid) ? source.grid : emptyGrid();
	const grid = incomingGrid
		.slice(0, 12)
		.concat(Array.from({ length: Math.max(0, 12 - incomingGrid.length) }, () => ''))
		.map((v) => String(v || ''));

	const incomingPairs = Array.isArray(source.pairs) ? source.pairs : emptyPairs();
	const pairs = incomingPairs
		.slice(0, 12)
		.concat(Array.from({ length: Math.max(0, 12 - incomingPairs.length) }, () => ({ prefix: '', word: '' })))
		.map((p) => ({ prefix: String((p && p.prefix) || ''), word: String((p && p.word) || '') }));

	return {
		morpheme: String(source.morpheme || ''),
		grid,
		pairs,
	};
}

export default function ChameleonPrefixesPage() {
	const router = useRouter();
	const [morpheme, setMorpheme] = useState('');
	const [grid, setGrid] = useState(emptyGrid);
	const [pairs, setPairs] = useState(emptyPairs);

	const [authUser, setAuthUser] = useState(null);
	const [authLoading, setAuthLoading] = useState(true);
	const [authFromSuccessRedirect, setAuthFromSuccessRedirect] = useState(false);
	const [notice, setNotice] = useState({ open: false, severity: 'success', message: '' });
	const [contextMenu, setContextMenu] = useState({ open: false, x: 0, y: 0, targetType: '', index: -1, field: '' });
	const [projectId, setProjectId] = useState('');
	const [activityIndex, setActivityIndex] = useState(null);
	const [projectName, setProjectName] = useState('');
	const [activityName, setActivityName] = useState('');
	const [isSaving, setIsSaving] = useState(false);
	const pairPrefixRefs = useRef([]);

	const projectApiOrigin = useMemo(() => resolveTmkApiOrigin(), []);

	const persist = (nextState) => {
		writeFormSessionData(FORM_NAME, nextState);
	};

	const showNotice = (severity, message) => {
		setNotice({ open: true, severity, message });
	};

	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}

		const url = new URL(window.location.href);
		const paramProjectId = url.searchParams.get('projectId') || '';
		const paramActivityIndex = url.searchParams.get('activityIndex');

		if (paramProjectId && paramActivityIndex !== null) {
			const parsedIndex = Number.parseInt(paramActivityIndex, 10);
			if (!Number.isInteger(parsedIndex)) {
				showNotice('error', 'Invalid activity context.');
				return;
			}

			setProjectId(paramProjectId);
			setActivityIndex(parsedIndex);

			const projects = getAllStoredProjects();
			const project = projects.find((item) => item.id === paramProjectId);
			if (!project) {
				showNotice('error', 'Project not found.');
				return;
			}

			setProjectName(project.name || 'Untitled Project');
			const activities = getProjectLessonActivities(project, 'lesson-activities-project', (data) => data || {});
			const activity = activities[parsedIndex];
			if (!activity) {
				showNotice('error', 'Lesson activity not found.');
				return;
			}

			setActivityName(String(activity['lesson-name'] || 'Chameleon Prefixes Activity'));
			const normalized = normalizeChameleonPrefixesLessonInputData(activity['lesson-input-data'] || {});
			setMorpheme(normalized.morpheme);
			setGrid(normalized.grid);
			setPairs(normalized.pairs);
			return;
		}

		const stored = readFormSessionData(FORM_NAME);
		if (stored) {
			const normalized = normalizeChameleonPrefixesLessonInputData(stored);
			setMorpheme(normalized.morpheme);
			setGrid(normalized.grid);
			setPairs(normalized.pairs);
		}
	}, []);

	useEffect(() => {
		const timeout = setTimeout(() => {
			const normalizedInput = normalizeChameleonPrefixesLessonInputData({ morpheme, grid, pairs });
			persist(normalizedInput);

			if (projectId && Number.isInteger(activityIndex)) {
				const projects = getAllStoredProjects();
				const project = projects.find((item) => item.id === projectId);
				if (!project) {
					return;
				}

				const activities = getProjectLessonActivities(project, 'lesson-activities-project', (data) => data || {});
				if (!activities[activityIndex]) {
					return;
				}

				activities[activityIndex] = {
					...activities[activityIndex],
					'lesson-name': activityName || activities[activityIndex]['lesson-name'] || 'Chameleon Prefixes Activity',
					'lesson-input-data': normalizedInput,
					'modified-at': Date.now(),
				};
				project.lessonActivities = activities;
				project.modifiedAtMs = Date.now();
				project.syncedAt = null;
				saveStoredProjects(projects);
			}
		}, 300);

		return () => clearTimeout(timeout);
	}, [morpheme, grid, pairs, projectId, activityIndex, activityName]);

	const runAuthCheck = async () => {
		setAuthLoading(true);
		try {
			const user = await fetchAuthenticatedUser(projectApiOrigin);
			setAuthUser(user);
		} catch {
			setAuthUser(null);
		} finally {
			setAuthLoading(false);
		}
	};

	useEffect(() => {
		if (typeof window !== 'undefined') {
			const url = new URL(window.location.href);
			if (url.searchParams.get('auth') === 'success') {
				setAuthFromSuccessRedirect(true);
				showNotice('success', 'Teachable login successful.');
				url.searchParams.delete('auth');
				window.history.replaceState({}, '', url.toString());
			} else if (url.searchParams.get('auth') === 'error') {
				const rawMessage = url.searchParams.get('message');
				showNotice('error', rawMessage || 'Teachable login failed. Please try again.');
				url.searchParams.delete('auth');
				url.searchParams.delete('message');
				window.history.replaceState({}, '', url.toString());
			}
		}

		runAuthCheck();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleGridChange = (index, value) => {
		setGrid((prev) => {
			const next = [...prev];
			next[index] = value;
			return next;
		});
	};

	const handlePairChange = (index, field, value) => {
		setPairs((prev) => {
			const next = [...prev];
			next[index] = { ...next[index], [field]: value };
			return next;
		});
	};

	const handleClearForm = () => {
		setMorpheme('');
		setGrid(emptyGrid());
		setPairs(emptyPairs());
	};

	const handleDownloadPdf = () => {
		window.print();
	};

	const handleGoToLessonProjects = () => {
		router.push('/lesson-projects');
	};

	const handleAddToProject = () => {
		router.push('/lesson-projects?activityType=chameleon-prefixes');
	};

	const initiateOAuthLogin = () => {
		window.location.href = buildTeachableStartUrl(projectApiOrigin, window.location.href);
	};

	const handleLoginLogout = () => {
		if (authUser) {
			window.location.href = buildTeachableLogoutUrl(window.location.href, projectApiOrigin);
			return;
		}

		initiateOAuthLogin();
	};

	const handleSaveAndReturn = async () => {
		if (!projectId || !Number.isInteger(activityIndex)) {
			showNotice('error', 'No project context available.');
			return;
		}

		setIsSaving(true);
		try {
			const projects = getAllStoredProjects();
			const project = projects.find((item) => item.id === projectId);
			if (!project) {
				showNotice('error', 'Project not found.');
				setIsSaving(false);
				return;
			}

			const activities = getProjectLessonActivities(project, 'lesson-activities-project', (data) => data || {});
			if (!activities[activityIndex]) {
				showNotice('error', 'Lesson activity not found.');
				setIsSaving(false);
				return;
			}

			const normalizedInput = normalizeChameleonPrefixesLessonInputData({ morpheme, grid, pairs });
			const activityId = String(activities[activityIndex].id || createLessonActivityId());
			activities[activityIndex] = {
				...activities[activityIndex],
				id: activityId,
				'lesson-name': activityName || activities[activityIndex]['lesson-name'] || 'Chameleon Prefixes Activity',
				'lesson-input-data': normalizedInput,
				'modified-at': Date.now(),
			};
			project.lessonActivities = activities;
			project.modifiedAtMs = Date.now();

			if (authUser) {
				project.syncedAt = null;
				saveStoredProjects(projects);

				const lessonActivityResponse = await upsertLessonActivity(projectApiOrigin, {
					id: activityId,
					projectId,
					projectName: project.name || '',
					formName: FORM_NAME,
					'tmk-template': String(activities[activityIndex]['tmk-template'] || FORM_NAME),
					'lesson-name': String(activities[activityIndex]['lesson-name'] || 'Chameleon Prefixes Activity'),
					'lesson-input-data': normalizedInput,
					'created-at': Number.isFinite(Number(activities[activityIndex]['created-at']))
						? Number(activities[activityIndex]['created-at'])
						: Date.now(),
					'modified-at': Number.isFinite(Number(activities[activityIndex]['modified-at']))
						? Number(activities[activityIndex]['modified-at'])
						: Date.now(),
				});

				const payload = buildDiyProjectsPayload({
					project,
					formName: 'lesson-activities-project',
					normalizeLessonInputData: (data) => data || {},
				});

				const response = await fetchWithUserToken(projectApiOrigin, DIY_PROJECTS_ENDPOINT, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload),
				});

				if (response.ok && lessonActivityResponse.ok) {
					const result = await response.json();
					const updated = getAllStoredProjects();
					const updatedProject = updated.find((item) => item.id === projectId);
					if (updatedProject) {
						updatedProject.syncedAt = new Date().toISOString();
						if (result?.id) {
							updatedProject.remoteId = result.id;
						}
						saveStoredProjects(updated);
					}
					showNotice('success', 'Lesson activity saved.');
				} else {
					saveStoredProjects(projects);
					showNotice('warning', 'Saved locally. Cloud sync failed.');
				}
			} else {
				saveStoredProjects(projects);
				showNotice('success', 'Saved locally.');
			}

			router.push('/lesson-projects');
		} catch (error) {
			console.error('Save and return failed:', error);
			showNotice('error', 'Could not save lesson activity.');
			setIsSaving(false);
		}
	};

	const openContextMenu = (event, targetType, index = -1, field = '') => {
		event.preventDefault();
		setContextMenu({ open: true, x: event.clientX, y: event.clientY, targetType, index, field });
	};

	const closeContextMenu = () => {
		setContextMenu((prev) => ({ ...prev, open: false }));
	};

	const getContextTargetValue = () => {
		if (contextMenu.targetType === 'grid') return grid[contextMenu.index] || '';
		if (contextMenu.targetType === 'pair') return pairs[contextMenu.index]?.[contextMenu.field] || '';
		if (contextMenu.targetType === 'morpheme') return morpheme;
		return '';
	};

	const setContextTargetValue = (value) => {
		if (contextMenu.targetType === 'grid') { handleGridChange(contextMenu.index, value); return; }
		if (contextMenu.targetType === 'pair') { handlePairChange(contextMenu.index, contextMenu.field, value); return; }
		if (contextMenu.targetType === 'morpheme') setMorpheme(value);
	};

	const handleCopyTarget = async () => {
		try {
			await navigator.clipboard.writeText(getContextTargetValue());
			showNotice('success', 'Copied to clipboard.');
		} catch (_error) {
			showNotice('error', 'Clipboard copy failed.');
		}
		closeContextMenu();
	};

	const handlePasteTarget = async () => {
		try {
			const text = await navigator.clipboard.readText();
			setContextTargetValue(text || '');
			showNotice('success', 'Pasted from clipboard.');
		} catch (_error) {
			showNotice('error', 'Clipboard paste failed.');
		}
		closeContextMenu();
	};

	const handleClearTarget = () => {
		setContextTargetValue('');
		closeContextMenu();
	};

	const handleSyncGridToPair = (pairIndex) => {
		const gridValue = grid[contextMenu.index] || '';
		const prefixValue = pairs[pairIndex]?.prefix || '';
		const valueToUse = gridValue || prefixValue;
		if (valueToUse) {
			handleGridChange(contextMenu.index, valueToUse);
			if (gridValue) handlePairChange(pairIndex, 'prefix', gridValue);
		}
		const el = pairPrefixRefs.current[pairIndex];
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'center' });
			el.focus();
		}
		closeContextMenu();
	};

	const authLabel = authLoading
		? 'Checking login...'
		: authUser
			? `Logged in: ${authUser.name || authUser.email || 'Teachable'}`
			: authFromSuccessRedirect
				? 'Login flow completed — verifying session…'
				: 'Not logged in';
	const licenseLabel = authUser?.email ? `Licenses for use by: ${authUser.email}` : '';

	return (
		<Box
			component="main"
			sx={{
				minHeight: '100vh',
				py: { xs: 2, md: 4 },
				px: 1,
				background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
			}}
		>
			<style jsx global>{`
				@media print {
					body * {
						visibility: hidden !important;
					}
					#lesson-activity-print-root,
					#lesson-activity-print-root * {
						visibility: visible !important;
					}
					#lesson-activity-print-root {
						position: absolute;
						left: 0;
						top: 0;
						width: 100%;
						box-shadow: none !important;
					}
				}
			`}</style>
			<Container maxWidth="lg">
				<Stack spacing={1.5} sx={{ mb: 1.5 }} direction={{ xs: 'column', md: 'row' }}>
					<Button
						variant="outlined"
						onClick={() => router.push('/dashboard')}
						sx={{
							textTransform: 'none',
							backgroundColor: '#000',
							color: '#fff',
							borderColor: '#000',
							'&:hover': {
								backgroundColor: '#1f1f1f',
								borderColor: '#1f1f1f',
							},
						}}
					>
						Dashboard
					</Button>
					<Button variant="contained" onClick={handleLoginLogout} sx={{ textTransform: 'none' }}>
						{authUser ? 'Logout from Teachable' : 'Login with Teachable'}
					</Button>
					<Button variant="outlined" onClick={handleGoToLessonProjects} sx={{ textTransform: 'none' }}>
						Lesson Projects
					</Button>
					{!projectId && (
						<Button variant="contained" color="primary" onClick={handleAddToProject} sx={{ textTransform: 'none' }}>
							Add To Project
						</Button>
					)}
					{projectId && (
						<>
							<Button variant="outlined" onClick={handleGoToLessonProjects} sx={{ textTransform: 'none' }}>
								Back to Lesson Projects
							</Button>
							<Button
								variant="contained"
								color="primary"
								disabled={isSaving}
								onClick={handleSaveAndReturn}
								sx={{ textTransform: 'none' }}
							>
								{isSaving ? 'Saving...' : 'Save & Return'}
							</Button>
						</>
					)}
					<Button variant="contained" color="success" onClick={handleDownloadPdf} sx={{ textTransform: 'none' }}>
						Download as PDF
					</Button>
				</Stack>
				{projectId && (
					<Box sx={{ mb: 2, p: 1.5, backgroundColor: '#eef2ff', borderRadius: 1, borderLeft: '4px solid #667eea' }}>
						<Typography sx={{ fontSize: '0.8rem', color: '#4a5568', textTransform: 'uppercase', fontWeight: 700 }}>
							Project
						</Typography>
						<Typography sx={{ mb: 1.2, fontWeight: 700 }}>{projectName}</Typography>
						<TextField
							size="small"
							label="Chameleon Prefixes Activity Name"
							value={activityName}
							onChange={(event) => setActivityName(event.target.value)}
							fullWidth
						/>
					</Box>
				)}
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
					<Box
						sx={{
							display: 'inline-flex',
							alignItems: 'center',
							px: 1.5,
							py: 0.75,
							borderRadius: 1,
							backgroundColor: authUser ? '#d4edda' : authFromSuccessRedirect ? '#cce5ff' : '#fff3cd',
							color: authUser ? '#155724' : authFromSuccessRedirect ? '#004085' : '#856404',
							border: `1px solid ${authUser ? '#c3e6cb' : authFromSuccessRedirect ? '#b8daff' : '#ffeaa7'}`,
							fontWeight: 700,
							fontSize: '0.85rem',
						}}
					>
						{authLabel}
					</Box>
					{!authLoading && !authUser && authFromSuccessRedirect && (
						<Button
							size="small"
							variant="outlined"
							sx={{ textTransform: 'none', bgcolor: 'white', fontSize: '0.8rem' }}
							onClick={runAuthCheck}
						>
							Retry session check
						</Button>
					)}
				</Box>

				<Card id="lesson-activity-print-root" sx={{ borderRadius: 2, boxShadow: 8 }}>
					<CardContent sx={{ p: { xs: 2, md: 4 } }}>
						<Box
							sx={{
								display: 'grid',
								gridTemplateColumns: { xs: '1fr', md: '3fr 1fr' },
								gap: 2,
								borderBottom: '3px solid #4020A7',
								pb: 1.5,
							}}
						>
							<Stack spacing={0.8}>
								<Typography sx={{ fontWeight: 800, fontSize: '1.6rem', letterSpacing: '0.08em' }}>
									Chameleon Prefixes
								</Typography>

								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
									<Typography sx={{ fontStyle: 'italic', fontSize: '1.1rem' }}>Morpheme(s):</Typography>
									<TextField
										variant="standard"
										value={morpheme}
										onChange={(e) => setMorpheme(e.target.value)}
										onContextMenu={(e) => openContextMenu(e, 'morpheme')}
										sx={{ minWidth: 180 }}
										inputProps={{
											style: {
												fontFamily: 'Courier New, monospace',
												fontSize: '1.1rem',
												color: '#4020A7',
											},
										}}
									/>
								</Box>

								<Typography color="text.secondary">
									Fill-in the correct form of the morpheme and read the following words.
								</Typography>
							</Stack>

							<Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, alignItems: 'flex-start' }}>
								<Box
									component="img"
									src="https://uploads.teachablecdn.com/attachments/fbdb7d04f47642b38193261d6b2e3101.png"
									alt="The Morphology Kit"
									sx={{ width: '100%', maxWidth: 200, height: 'auto' }}
								/>
							</Box>
						</Box>

						{/* Chameleon Grid: 2 rows × 6 columns */}
						<Box sx={{ my: 3 }}>
							{[0, 1].map((rowIndex) => (
								<Box
									key={rowIndex}
									sx={{
										display: 'grid',
										gridTemplateColumns: 'repeat(6, 1fr)',
										gap: 2,
										mb: rowIndex === 0 ? 2 : 0,
									}}
								>
									{Array.from({ length: 6 }, (_, colIndex) => {
										const cellIndex = rowIndex * 6 + colIndex;
										return (
											<TextField
												key={cellIndex}
												value={grid[cellIndex] || ''}
												onChange={(e) => handleGridChange(cellIndex, e.target.value)}
												onContextMenu={(e) => openContextMenu(e, 'grid', cellIndex)}
												variant="outlined"
												size="small"
												inputProps={{
													style: {
														textAlign: 'center',
														fontFamily: 'Courier New, monospace',
														fontSize: '0.9rem',
													},
												}}
												sx={{
													'& .MuiOutlinedInput-root': {
														'& fieldset': { borderColor: '#333', borderWidth: '1px', borderRadius: '2px' },
														'&:hover fieldset': { borderColor: '#4020A7' },
														'&.Mui-focused fieldset': { borderColor: '#4020A7' },
													},
												}}
											/>
										);
									})}
								</Box>
							))}
						</Box>

						{/* Numbered pairs: 2 columns of 6 */}
						<Box
							sx={{
								display: 'grid',
								gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
								gap: { xs: 2, md: 5 },
								mt: 3,
							}}
						>
							{[0, 1].map((colIndex) => (
								<Stack key={colIndex} spacing={2.5}>
									{Array.from({ length: 6 }, (_, rowIndex) => {
										const pairIndex = colIndex * 6 + rowIndex;
										return (
											<Box key={pairIndex} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
												<Typography sx={{ minWidth: 30, fontWeight: 700, fontSize: '1.1rem', pt: 0.5 }}>
													{pairIndex + 1}.
												</Typography>
												<Box sx={{ display: 'flex', gap: 1.25, flex: 1 }}>
													<TextField
														inputRef={(el) => { pairPrefixRefs.current[pairIndex] = el; }}
														variant="standard"
														value={pairs[pairIndex]?.prefix || ''}
														onChange={(e) => handlePairChange(pairIndex, 'prefix', e.target.value)}
														onContextMenu={(e) => openContextMenu(e, 'pair', pairIndex, 'prefix')}
														sx={{ width: '33%' }}
														inputProps={{ style: { fontFamily: 'Courier New, monospace', fontSize: '1rem' } }}
													/>
													<TextField
														variant="standard"
														value={pairs[pairIndex]?.word || ''}
														onChange={(e) => handlePairChange(pairIndex, 'word', e.target.value)}
														onContextMenu={(e) => openContextMenu(e, 'pair', pairIndex, 'word')}
														sx={{ width: '66%' }}
														inputProps={{ style: { fontFamily: 'Courier New, monospace', fontSize: '1rem' } }}
													/>
												</Box>
											</Box>
										);
									})}
								</Stack>
							))}
						</Box>

						<Box
							sx={{
								borderTop: '2px solid #eee',
								pt: 2.5,
								display: 'flex',
								justifyContent: 'center',
								mt: 4,
							}}
						>
							<Button variant="outlined" onClick={handleClearForm} sx={{ minWidth: 150 }}>
								Clear All
							</Button>
						</Box>

						{licenseLabel && (
							<Box
								sx={{
									mt: 2,
									pt: 1.5,
									borderTop: '1px solid #e5e7eb',
									textAlign: 'right',
									fontSize: '0.8rem',
									color: '#4b5563',
									fontStyle: 'italic',
								}}
							>
								{licenseLabel}
							</Box>
						)}
					</CardContent>
				</Card>
			</Container>

			<Menu
				open={contextMenu.open}
				onClose={closeContextMenu}
				anchorReference="anchorPosition"
				anchorPosition={
					contextMenu.open ? { top: contextMenu.y, left: contextMenu.x } : undefined
				}
			>
				<MenuItem onClick={handleCopyTarget}>Copy value</MenuItem>
				<MenuItem onClick={handlePasteTarget}>Paste value</MenuItem>
				<MenuItem onClick={handleClearTarget}>Clear field</MenuItem>
				{contextMenu.targetType === 'grid' && [
					<MenuItem key="sync-header" disabled sx={{ opacity: 0.6, fontSize: '0.75rem' }}>Sync to prefix…</MenuItem>,
					...Array.from({ length: 12 }, (_, i) => (
						<MenuItem key={`sync-${i}`} onClick={() => handleSyncGridToPair(i)}>
							Item {i + 1}
						</MenuItem>
					)),
				]}
			</Menu>

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
