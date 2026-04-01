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

export default function ActivityShell({
	title,
	morpheme,
	onMorphemeChange,
	instructions,
	children,
	authUser,
	authLoading,
	authFromSuccessRedirect,
	runAuthCheck,
	handleLoginLogout,
	handleGoToLessonProjects,
	handleAddToProject,
	handleSaveAndReturn,
	handleDownloadPdf,
	projectId,
	projectName,
	activityName,
	setActivityName,
	isSaving,
	notice,
	setNotice,
}) {
	const router = useRouter();
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
						<Button
							variant="contained"
							color="primary"
							disabled={isSaving}
							onClick={handleSaveAndReturn}
							sx={{ textTransform: 'none' }}
						>
							{isSaving ? 'Saving...' : 'Save & Return'}
						</Button>
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
							label={`${title} Activity Name`}
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
								<Typography sx={{ fontWeight: 800, fontSize: '1.6rem', letterSpacing: '0.08em' }}>{title}</Typography>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
									<Typography sx={{ fontStyle: 'italic', fontSize: '1.1rem' }}>Morpheme(s):</Typography>
									<TextField
										variant="standard"
										value={morpheme}
										onChange={(event) => onMorphemeChange(event.target.value)}
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
								<Typography color="text.secondary">{instructions}</Typography>
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
