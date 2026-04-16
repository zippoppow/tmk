'use client';

import { useRouter } from 'next/navigation';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Container,
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
	handleSave,
	handleSaveAndReturn,
	handleDownloadPdf,
	standaloneActivityId,
	handleSaveStandalone,
	handleDeleteStandalone,
	projectId,
	projectName,
	activityName,
	setActivityName,
	isSaving,
	notice,
	setNotice,
}) {
	const router = useRouter();
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
				<Stack spacing={1.5} sx={{ mb: 1.5 }} direction={{ xs: 'column', md: 'row' }}>
					<Button
						variant="outlined"
						onClick={() => router.push('/dashboard')}
						sx={{
							...outlinedControlButtonSx,
							fontWeight: 700,
						}}
					>
						Dashboard
					</Button>
					<Button variant="contained" onClick={handleLoginLogout} sx={{ textTransform: 'none' }}>
						{authUser ? 'Logout from Teachable' : 'Login with Teachable'}
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

				{projectId && (
					<Box sx={{ mb: 2, p: 1.5, backgroundColor: '#eef2ff', borderRadius: 1, borderLeft: '4px solid #667eea', }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
							<Typography sx={{ fontSize: '2rem', color: '#011436', fontWeight: 700 }}>
								PROJECT:
							</Typography>
							<Typography sx={{ fontSize: '2rem', mb: 0, color: '#000000', fontWeight: 700, fontStyle: 'italic' }}>
								{projectName}
							</Typography>
						</Box>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
							<Typography sx={{ fontSize: '1.2rem', color: '#011436', fontWeight: 700 }}>
								Activity Type:
							</Typography>
							<Typography sx={{ fontSize: '1.2rem', mb: 0, color: '#000000', fontWeight: 400, fontStyle: 'italic' }}>
								{title}
							</Typography>
						</Box>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
							<Typography sx={{ fontSize: '1.2rem', color: '#011436', fontWeight: 700 }}>
								Activity Name:
							</Typography>
							<TextField
								size="small"
								value={activityName}
								onChange={(event) => setActivityName(event.target.value)}
								sx={{ minWidth: 360 }}
							/>
						</Box>
						
					</Box>
				)}

				{!projectId && (
					<Box sx={{ mb: 2, p: 1.5, backgroundColor: '#eef2ff', borderRadius: 1, borderLeft: '4px solid #667eea' }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
							<Typography sx={{ fontSize: '1.2rem', color: '#011436', fontWeight: 700 }}>
								Activity Type:
							</Typography>
							<Typography sx={{ fontSize: '1.2rem', mb: .5, color: '#000000', fontWeight: 400, fontStyle: 'italic' }}>
								{title}
							</Typography>
						</Box>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
							<Typography sx={{ fontSize: '1.2rem', color: '#011436', fontWeight: 700 }}>
								Activity Name:
							</Typography>
							<TextField
								size="small"
								value={activityName}
								onChange={(event) => setActivityName(event.target.value)}
								sx={{ minWidth: 360 }}
							/>
						</Box>
					</Box>
				)}

				<Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', gap: 1, mb: 2, flexWrap: 'wrap' }}>
					{!projectId && (
						<>
							<Button
								variant="contained"
								color="primary"
								disabled={isSaving}
								onClick={handleSaveStandalone}
								sx={{ textTransform: 'none' }}
							>
								{isSaving ? 'Saving...' : 'Save Activity'}
							</Button>
							{standaloneActivityId && (
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
							<Button variant="contained" color="primary" onClick={handleAddToProject} sx={{ textTransform: 'none' }}>
								Add To Project
							</Button>
						</>
					)}
					{projectId && (
						<>
							<Button
								variant="contained"
								color="primary"
								disabled={isSaving}
								onClick={handleSave}
								sx={{ textTransform: 'none' }}
							>
								{isSaving ? 'Saving...' : 'Save Activity'}
							</Button>
						</>
					)}
					<Button variant="contained" color="success" onClick={handleDownloadPdf} sx={{ textTransform: 'none' }}>
						Download as PDF
					</Button>
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
							<Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, alignItems: 'flex-start' }}>
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
		</Box>
	);
}
