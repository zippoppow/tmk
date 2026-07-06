'use client';

import React, { useEffect, useRef, useState } from 'react';
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
import AppTopNav from '../../components/AppTopNav';
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
	handleDeleteProjectActivity,
}) {
	const [isSlideshowMode, setIsSlideshowMode] = useState(false);
	const [isSlideshowFullscreenMode, setIsSlideshowFullscreenMode] = useState(false);
	const [isConfirmSaveDialogOpen, setIsConfirmSaveDialogOpen] = useState(false);
	const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
	const pendingDeleteHandlerRef = useRef(null);
	const dialogPaperSx = {
		minWidth: { xs: '90vw', sm: 400 },
	};
	const dialogTitleSx = {
		fontWeight: 700,
		fontSize: '1.1rem',
	};
	const dialogActionsSx = {
		gap: 1,
		p: 2,
	};
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
	const showRetrySessionCheck = !authLoading && !authUser && authFromSuccessRedirect;
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

	const openConfirmDeleteDialog = (handler) => {
		pendingDeleteHandlerRef.current = handler;
		setIsConfirmDeleteDialogOpen(true);
	};

	const handleConfirmDelete = async () => {
		setIsConfirmDeleteDialogOpen(false);
		if (typeof pendingDeleteHandlerRef.current === 'function') {
			await pendingDeleteHandlerRef.current();
			pendingDeleteHandlerRef.current = null;
		}
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
					<AppTopNav
						title={title}
						currentSection={projectId ? 'lesson-projects' : ''}
						onAuthAction={handleLoginLogout}
						authButtonLabel={authUser ? 'Logout' : 'Login'}
						beforeNavigate={allowDebouncedLocalPersist}
						reserveLeadingActionsSpace
						reserveRightContentSpace
						leadingActions={projectId ? (
							<Button
								variant="outlined"
								color="primary"
								disabled={isSaving}
								onClick={handleSaveAndReturn}
								sx={{ textTransform: 'none' }}
							>
								Back to Projects
							</Button>
						) : null}
						rightContent={(
							<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
								<Box
									sx={{
										display: 'inline-flex',
										alignItems: 'center',
										px: 1.5,
										py: 0.75,
										borderRadius: 1,
										minHeight: 34,
										maxWidth: { xs: '100%', md: 300 },
										whiteSpace: 'nowrap',
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										backgroundColor: authUser ? '#d4edda' : authFromSuccessRedirect ? '#cce5ff' : '#fff3cd',
										color: authUser ? '#155724' : authFromSuccessRedirect ? '#004085' : '#856404',
										border: `1px solid ${authUser ? '#c3e6cb' : authFromSuccessRedirect ? '#b8daff' : '#ffeaa7'}`,
										fontWeight: 700,
										fontSize: '0.85rem',
									}}
								>
									{authLabel}
								</Box>
								<Button
									size="small"
									variant="outlined"
									sx={{
										...outlinedControlButtonSx,
										fontSize: '0.8rem',
										minHeight: 34,
										minWidth: 146,
										visibility: showRetrySessionCheck ? 'visible' : 'hidden',
									}}
									onClick={runAuthCheck}
									disabled={!showRetrySessionCheck}
									aria-hidden={!showRetrySessionCheck}
									tabIndex={showRetrySessionCheck ? 0 : -1}
								>
									Retry session check
								</Button>
							</Stack>
						)}
						logoSx={{ maxWidth: 200 }}
						titleSx={{ color: '#fff', fontWeight: 800, fontSize: '1.6rem', letterSpacing: '0.08em', pl: 0 }}
					/>
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
									onClick={() => openConfirmDeleteDialog(handleDeleteStandalone)}
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
							{shouldShowProjectActions && (
								<Button
									variant="outlined"
									color="error"
									disabled={isSaving}
									onClick={() => openConfirmDeleteDialog(handleDeleteProjectActivity)}
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
				open={isConfirmDeleteDialogOpen}
				onClose={() => setIsConfirmDeleteDialogOpen(false)}
				PaperProps={{
					sx: dialogPaperSx,
				}}
			>
				<DialogTitle sx={dialogTitleSx}>Confirm Delete</DialogTitle>
				<DialogContent>
					<Box sx={{ mt: 1 }}>Are you sure you want to delete this activity? This cannot be undone.</Box>
				</DialogContent>
				<DialogActions sx={dialogActionsSx}>
					<Button
						variant="outlined"
						onClick={() => setIsConfirmDeleteDialogOpen(false)}
					>
						Cancel
					</Button>
					<Button
						variant="contained"
						color="error"
						disabled={isSaving}
						onClick={handleConfirmDelete}
					>
						{isSaving ? 'Deleting...' : 'Delete'}
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog
				open={isConfirmSaveDialogOpen}
				onClose={() => setIsConfirmSaveDialogOpen(false)}
				PaperProps={{
					sx: dialogPaperSx,
				}}
			>
				<DialogTitle sx={dialogTitleSx}>Confirm Save</DialogTitle>
				<DialogContent>
					<Box sx={{ mt: 1 }}>Are you sure you want to save your changes?</Box>
				</DialogContent>
				<DialogActions sx={dialogActionsSx}>
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
				PaperProps={{
					sx: dialogPaperSx,
				}}
			>
				<DialogTitle sx={dialogTitleSx}>Add Activity To Projects</DialogTitle>
				<DialogContent>
					<Box sx={{ mt: 1 }}>
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
					</Box>
				</DialogContent>
				<DialogActions sx={dialogActionsSx}>
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
