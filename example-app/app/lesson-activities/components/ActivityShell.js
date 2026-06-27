'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Container,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	MenuItem,
	Snackbar,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import TmkLogo from '../../components/TmkLogo';

export default function ActivityShell({
	title,
	morpheme,
	onMorphemeChange,
	onMorphemeContextMenu,
	instructions,
	children,
	authUser,
	authLoading,
	authFromSuccessRedirect,
	runAuthCheck,
	handleLoginLogout,
	handleGoToLessonProjects,
	handleAddToProject,
	handleOpenAddToProjectDialog,
	handleCloseAddToProjectDialog,
	handleConfirmAddToProjects,
	handleSave,
	handleSaveAndReturn,
	handleDownloadPdf,
	standaloneActivityId,
	handleSaveStandalone,
	handleDeleteStandalone,
	isAddToProjectDialogOpen,
	availableLessonProjects,
	selectedProjectIdsForAdd,
	setSelectedProjectIdsForAdd,
	projectId,
	projectName,
	activityName,
	setActivityName,
	isSaving,
	notice,
	setNotice,
}) {
	const router = useRouter();
	const [isSlideshowMode, setIsSlideshowMode] = useState(false);
	const [isSlideshowFullscreenMode, setIsSlideshowFullscreenMode] = useState(false);
	const [isConfirmSaveDialogOpen, setIsConfirmSaveDialogOpen] = useState(false);
	const outlinedControlButtonSx = {
		textTransform: 'none',
		bgcolor: '#fff',
		color: '#1f2937',
		borderColor: '#d1d5db',
		'&:hover': {
			bgcolor: '#f3f4f6',
			borderColor: '#9ca3af',
		},
	};
	const authLabel = authLoading
		? 'Checking login...'
		: authUser
			? `Logged in: ${authUser.name || authUser.email || 'Teachable'}`
			: authFromSuccessRedirect
				? 'Login flow completed — verifying session…'
				: 'Not logged in';
	const licenseLabel = authUser?.email ? `Licensed for use to: ${authUser.email}` : '';
	const openAddToProjectDialog = typeof handleOpenAddToProjectDialog === 'function'
		? handleOpenAddToProjectDialog
		: handleAddToProject;
	const allowDebouncedLocalPersist = async () => {
		if (typeof window === 'undefined') {
			return;
		}

		await new Promise((resolve) => {
			window.setTimeout(resolve, 325);
		});
	};

	const handleSaveActivityClick = () => {
		setIsConfirmSaveDialogOpen(true);
	};

	const handleConfirmSave = async () => {
		setIsConfirmSaveDialogOpen(false);
		const hasProjectRouteContext = Boolean(projectId)
			|| (typeof window !== 'undefined' && Boolean(new URLSearchParams(window.location.search).get('projectId')));

		if (hasProjectRouteContext && !isSlideshowMode) {
			const didSave = await handleSave();
			if (didSave) {
				setNotice({ open: true, severity: 'success', message: 'Changes have been saved.' });
			}
			return;
		}

		const didSaveStandalone = await handleSaveStandalone();
		if (didSaveStandalone) {
			setNotice({ open: true, severity: 'success', message: 'Changes have been saved.' });
		}
	};

	const shouldShowActionButtons = !isSlideshowMode;
	const shouldShowProjectActions = shouldShowActionButtons && !isSlideshowFullscreenMode;

	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}

		const params = new URLSearchParams(window.location.search);
		setIsSlideshowMode(params.get('slideshow') === '1');
		setIsSlideshowFullscreenMode(params.get('slideshowFullscreen') === '1');
	}, []);

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
					@page {
						size: auto;
						margin: 0.35in;
					}
					html,
					body {
						background: #fff !important;
					}
					body * {
						visibility: hidden !important;
					}
					#lesson-activity-print-root,
					#lesson-activity-print-root * {
						visibility: visible !important;
					}
					#lesson-activity-print-root {
						position: static !important;
						margin: 0 !important;
						width: 100%;
						max-width: 100% !important;
						box-shadow: none !important;
						break-inside: avoid-page;
					}
					#lesson-activity-print-root .MuiCardContent-root {
						padding: 12px !important;
					}
					#lesson-activity-print-root .no-print {
						display: none !important;
					}
				}
			`}</style>
			<Container maxWidth="lg">
				{!isSlideshowMode && (
					<Box
						sx={{
							mb: 1.5,
							display: 'flex',
							flexDirection: { xs: 'column', sm: 'row' },
							justifyContent: 'space-between',
							gap: 1.5,
						}}
					>
						<Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
							{!projectId && (
								<Button
									variant="outlined"
									onClick={async () => {
										await allowDebouncedLocalPersist();
										router.push('/lesson-activities');
									}}
									sx={{
										...outlinedControlButtonSx,
										fontWeight: 700,
									}}
								>
									Lesson Actvities Home
								</Button>
							)}
							{projectId && (
								<Button
									variant="outlined"
									color="primary"
									disabled={isSaving}
									onClick={handleSaveAndReturn}
									sx={{ textTransform: 'none' }}
								>
									Back to Projects
								</Button>
							)}
						</Stack>

						<Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ justifyContent: 'flex-end' }}>
							<Button
								variant="outlined"
								onClick={async () => {
									await allowDebouncedLocalPersist();
									router.push('/');
								}}
								sx={{
									...outlinedControlButtonSx,
									fontWeight: 700,
								}}
							>
								Back to Home
							</Button>
							<Button variant="contained" onClick={handleLoginLogout} sx={{ textTransform: 'none' }}>
								{authUser ? 'Logout from App' : 'Login'}
							</Button>
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
									sx={{ ...outlinedControlButtonSx, fontSize: '0.8rem' }}
									onClick={runAuthCheck}
								>
									Retry session check
								</Button>
							)}
						</Stack>
					</Box>
				)}

				{projectId && !isSlideshowMode && !isSlideshowFullscreenMode && (
					<Box sx={{ mb: 2, p: 1.5, backgroundColor: '#eef2ff', borderRadius: 1, borderLeft: '4px solid #667eea', }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
						<Typography sx={{ fontSize: { xs: '1.3rem', sm: '1.6rem', md: '2rem' }, color: '#011436', fontWeight: 700 }}>
							PROJECT:
						</Typography>
						<Typography sx={{ fontSize: { xs: '1.3rem', sm: '1.6rem', md: '2rem' }, mb: 0, color: '#000000', fontWeight: 700, fontStyle: 'italic' }}>
								{projectName}
							</Typography>
						</Box>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
						<Typography sx={{ fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' }, color: '#011436', fontWeight: 700 }}>
							Activity Type:
						</Typography>
						<Typography sx={{ fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' }, mb: 0, color: '#000000', fontWeight: 400, fontStyle: 'italic' }}>
							{title}
						</Typography>
					</Box>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
						<Typography sx={{ fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' }, color: '#011436', fontWeight: 700 }}>
							Activity Name:
						</Typography>
						<TextField
							value={activityName}
							onChange={(event) => setActivityName(event.target.value)}
							sx={{ minWidth: { sm: 360 }, width: { xs: '100%', sm: 'auto' } }}
								inputProps={{ style: { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.4rem', color: '#000000' } }}
							/>
						</Box>
						
					</Box>
				)}

				{!projectId && !isSlideshowMode && !isSlideshowFullscreenMode && (
					<Box sx={{ mb: 2, p: 1.5, backgroundColor: '#eef2ff', borderRadius: 1, borderLeft: '4px solid #667eea' }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
						<Typography sx={{ fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' }, color: '#011436', fontWeight: 700 }}>
							Activity Type:
						</Typography>
						<Typography sx={{ fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' }, mb: .5, color: '#000000', fontWeight: 400, fontStyle: 'italic' }}>
							{title}
						</Typography>
					</Box>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
						<Typography sx={{ fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' }, color: '#011436', fontWeight: 700 }}>
							Activity Name:
						</Typography>
						<TextField
							size="small"
							value={activityName}
							onChange={(event) => setActivityName(event.target.value)}
							sx={{ minWidth: { sm: 360 }, width: { xs: '100%', sm: 'auto' } }}
								inputProps={{ style: { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.2rem', color: '#000000' } }}
							/>
						</Box>
					</Box>
				)}

				{shouldShowActionButtons && (
					<Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', gap: 1, mb: 2, flexWrap: 'wrap' }}>
					{!projectId && (
						<>
							{shouldShowProjectActions && (
							<Button
								variant="outlined"
								disabled={isSaving || isSlideshowMode}
								onClick={openAddToProjectDialog}
								sx={{
									...outlinedControlButtonSx,
									fontWeight: 700,
								}}
							>
								Add to Project(s)
							</Button>
							)}
							<Button
								variant="contained"
								color="primary"
								disabled={isSaving}
								onClick={handleSaveActivityClick}
								sx={{ textTransform: 'none' }}
							>
								{isSaving ? 'Saving...' : 'Save Activity'}
							</Button>
							{shouldShowProjectActions && standaloneActivityId && (
								<Button
									variant="outlined"
									color="error"
									disabled={isSaving}
									onClick={handleDeleteStandalone}
									sx={{
										...outlinedControlButtonSx,
										borderColor: '#ef4444',
										color: '#b91c1c',
										'&:hover': {
											bgcolor: '#fee2e2',
											borderColor: '#dc2626',
										},
									}}
								>
									Delete Activity
								</Button>
							)}
						</>
					)}
					{projectId && (
						<>
							{shouldShowProjectActions && (
							<Button
								variant="outlined"
								disabled={isSaving || isSlideshowMode}
								onClick={openAddToProjectDialog}
								sx={{
									...outlinedControlButtonSx,
									fontWeight: 700,
								}}
							>
								Add to Project(s)
							</Button>
							)}
							<Button
								variant="contained"
								color="primary"
								disabled={isSaving}
								onClick={handleSaveActivityClick}
								sx={{ textTransform: 'none' }}
							>
								{isSaving ? 'Saving...' : 'Save Activity'}
							</Button>
						</>
					)}
					<Button
						variant="contained"
						color="success"
						onClick={async () => {
							await allowDebouncedLocalPersist();
							handleDownloadPdf();
						}}
						sx={{ textTransform: 'none' }}
					>
						Download as PDF
					</Button>
					</Box>
				)}

				<Card id="lesson-activity-print-root" sx={{ borderRadius: 2, boxShadow: 8 }}>
					<CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
						<Box
							sx={{
								display: 'grid',
								gridTemplateColumns: { xs: '1fr', sm: '3fr 1fr' },
								gap: 2,
								borderBottom: '3px solid #4020A7',
								pb: 1.5,
							}}
						>
							<Stack spacing={0.8}>
								<Typography sx={{ fontWeight: 800, fontSize: '1.6rem', letterSpacing: '0.08em' }}>{title}</Typography>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
									<Typography sx={{ fontStyle: 'italic', fontSize: '1.5rem', fontFamily: "'Lato', 'Segoe UI', Arial, sans-serif;", color: '#000000 ' }}>Morpheme(s):</Typography>
									<TextField
										variant="standard"
										value={morpheme}
										onChange={(event) => onMorphemeChange(event.target.value)}
										onContextMenu={onMorphemeContextMenu}
										sx={{ minWidth: 180, pb: 0.5 }}
										inputProps={{
											style: {
												fontFamily: 'Trebuchet MS, sans-serif',
												fontSize: '2rem',
												color: '#4020A7',
												paddingBottom: '16px',
											},
										}}
									/>
								</Box>
								<Typography color="text.secondary">{instructions}</Typography>
							</Stack>
							<Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, alignItems: 'flex-start' }}>
								<TmkLogo renderMode="img" sx={{ maxWidth: 200 }} />
							</Box>
						</Box>

						{children}

						{licenseLabel && (
							<Box
								sx={{
									mt: 3,
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
				open={isConfirmSaveDialogOpen}
				onClose={() => setIsConfirmSaveDialogOpen(false)}
				PaperProps={{
					sx: {
						minWidth: { xs: '90vw', sm: 400 },
					},
				}}
			>
				<DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem' }}>Confirm Save</DialogTitle>
				<DialogContent>
					<Box sx={{ mt: 1 }}>Are you sure you want to save your changes?</Box>
				</DialogContent>
				<DialogActions sx={{ gap: 1, p: 2 }}>
					<Button
						variant="outlined"
						onClick={() => setIsConfirmSaveDialogOpen(false)}
					>
						Cancel
					</Button>
					<Button
						variant="contained"
						color="primary"
						disabled={isSaving}
						onClick={handleConfirmSave}
					>
						{isSaving ? 'Saving...' : 'Save'}
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog
				open={Boolean(isAddToProjectDialogOpen)}
				onClose={handleCloseAddToProjectDialog}
				fullWidth
				maxWidth="sm"
			>
				<DialogTitle>Add Activity To Projects</DialogTitle>
				<DialogContent>
					<TextField
						select
						fullWidth
						label="Select one or more projects"
						margin="dense"
						value={Array.isArray(selectedProjectIdsForAdd) ? selectedProjectIdsForAdd : []}
						onChange={(event) => {
							const nextValue = event.target.value;
							setSelectedProjectIdsForAdd(Array.isArray(nextValue) ? nextValue : [nextValue]);
						}}
						SelectProps={{
							multiple: true,
							renderValue: (selected) => {
								const selectedIds = Array.isArray(selected) ? selected : [];
								const selectedNames = selectedIds
									.map((id) => availableLessonProjects.find((project) => project.id === id)?.name || '')
									.filter(Boolean);
								return selectedNames.join(', ');
							},
						}}
					>
						{Array.isArray(availableLessonProjects) && availableLessonProjects.length > 0 ? (
							availableLessonProjects.map((project) => (
								<MenuItem key={project.id} value={project.id}>
									{project.name}
								</MenuItem>
							))
						) : (
							<MenuItem value="" disabled>
								No lesson projects available
							</MenuItem>
						)}
					</TextField>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseAddToProjectDialog} sx={{ textTransform: 'none' }}>
						Cancel
					</Button>
					<Button
						onClick={handleConfirmAddToProjects}
						variant="contained"
						disabled={isSaving || !Array.isArray(selectedProjectIdsForAdd) || selectedProjectIdsForAdd.length === 0}
						sx={{ textTransform: 'none' }}
					>
						Add To Selected Projects
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
