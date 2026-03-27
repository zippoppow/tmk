'use client';

import { useEffect, useMemo, useState } from 'react';
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
import ProjectManagerPanel from '../components/ProjectManagerPanel';
import {
	buildTeachableLogoutUrl,
	buildTeachableStartUrl,
	fetchAuthenticatedUser,
	readFormSessionData,
	resolveTmkApiOrigin,
	writeFormSessionData,
} from '../components/lessonActivityHelpers';

const FORM_NAME = 'intro';

function emptyWordList() {
	return Array.from({ length: 9 }, () => '');
}

function normalizeIntroLessonInputData(rawData) {
	const source = rawData && typeof rawData === 'object' ? rawData : {};
	const incomingWords = Array.isArray(source.words) ? source.words : emptyWordList();
	const words = incomingWords
		.slice(0, 9)
		.concat(Array.from({ length: Math.max(0, 9 - incomingWords.length) }, () => ''))
		.map((value) => String(value || ''));

	return {
		morpheme: String(source.morpheme || ''),
		questionMorpheme: String(source.questionMorpheme || ''),
		words,
	};
}

export default function IntroPage() {
	const [morpheme, setMorpheme] = useState('');
	const [words, setWords] = useState(emptyWordList);
	const [questionMorpheme, setQuestionMorpheme] = useState('');
	const [authUser, setAuthUser] = useState(null);
	const [authLoading, setAuthLoading] = useState(true);
	const [authFromSuccessRedirect, setAuthFromSuccessRedirect] = useState(false);
	const [notice, setNotice] = useState({ open: false, severity: 'success', message: '' });
	const [contextMenu, setContextMenu] = useState({ open: false, x: 0, y: 0, targetType: '', index: -1 });

	const projectApiOrigin = useMemo(() => resolveTmkApiOrigin(), []);

	const persist = (nextState) => {
		writeFormSessionData(FORM_NAME, nextState);
	};

	const normalizedLessonInputData = useMemo(
		() => normalizeIntroLessonInputData({ morpheme, words, questionMorpheme }),
		[morpheme, words, questionMorpheme]
	);

	const showNotice = (severity, message) => {
		setNotice({ open: true, severity, message });
	};

	useEffect(() => {
		const stored = readFormSessionData(FORM_NAME);
		if (stored) {
			const normalized = normalizeIntroLessonInputData(stored);
			setMorpheme(normalized.morpheme);
			setQuestionMorpheme(normalized.questionMorpheme);
			setWords(normalized.words);
		}
	}, []);

	useEffect(() => {
		const timeout = setTimeout(() => {
			persist({ morpheme, words, questionMorpheme });
		}, 300);

		return () => clearTimeout(timeout);
	}, [morpheme, words, questionMorpheme]);

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

	const handleWordChange = (index, value) => {
		setWords((prev) => {
			const next = [...prev];
			next[index] = value;
			return next;
		});
	};

	const handleClearForm = () => {
		setMorpheme('');
		setWords(emptyWordList());
		setQuestionMorpheme('');
	};

	const handleClearWordsOnly = () => {
		setWords(emptyWordList());
		closeContextMenu();
	};

	const handleDownloadPdf = () => {
		window.print();
	};

	const initiateOAuthLogin = () => {
		window.location.href = buildTeachableStartUrl(null, window.location.href);
	};

	const handleLoginLogout = () => {
		if (authUser) {
			window.location.href = buildTeachableLogoutUrl(window.location.href);
			return;
		}

		initiateOAuthLogin();
	};

	const applyLessonInputData = (data) => {
		const normalized = normalizeIntroLessonInputData(data);
		setMorpheme(normalized.morpheme);
		setWords(normalized.words);
		setQuestionMorpheme(normalized.questionMorpheme);
	};

	const openContextMenu = (event, targetType, index = -1) => {
		event.preventDefault();
		setContextMenu({
			open: true,
			x: event.clientX,
			y: event.clientY,
			targetType,
			index,
		});
	};

	const closeContextMenu = () => {
		setContextMenu((prev) => ({ ...prev, open: false }));
	};

	const getContextTargetValue = () => {
		if (contextMenu.targetType === 'word' && contextMenu.index >= 0) {
			return words[contextMenu.index] || '';
		}
		if (contextMenu.targetType === 'morpheme') {
			return morpheme;
		}
		if (contextMenu.targetType === 'questionMorpheme') {
			return questionMorpheme;
		}
		return '';
	};

	const setContextTargetValue = (value) => {
		if (contextMenu.targetType === 'word' && contextMenu.index >= 0) {
			handleWordChange(contextMenu.index, value);
			return;
		}
		if (contextMenu.targetType === 'morpheme') {
			setMorpheme(value);
			return;
		}
		if (contextMenu.targetType === 'questionMorpheme') {
			setQuestionMorpheme(value);
		}
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

	const handleClearContextRow = () => {
		if (contextMenu.targetType !== 'word' || contextMenu.index < 0) {
			closeContextMenu();
			return;
		}

		const rowStart = Math.floor(contextMenu.index / 3) * 3;
		setWords((prev) => {
			const next = [...prev];
			next[rowStart] = '';
			next[rowStart + 1] = '';
			next[rowStart + 2] = '';
			return next;
		});
		closeContextMenu();
	};

	const handleCopyMorphemeToQuestion = () => {
		setQuestionMorpheme(morpheme);
		closeContextMenu();
	};

	const authLabel = authLoading
		? 'Checking login...'
		: authUser
			? `Logged in: ${authUser.name || authUser.email || 'Teachable'}`
			: authFromSuccessRedirect
				? 'Login flow completed — verifying session…'
				: 'Not logged in';

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
			<Container maxWidth="lg">
				<Stack spacing={1.5} sx={{ mb: 1.5 }} direction={{ xs: 'column', md: 'row' }}>
					<Button variant="contained" onClick={handleLoginLogout} sx={{ textTransform: 'none' }}>
						{authUser ? 'Logout from Teachable' : 'Login with Teachable'}
					</Button>
					<ProjectManagerPanel
						formName={FORM_NAME}
						apiOrigin={projectApiOrigin}
						isAuthenticated={Boolean(authUser)}
						userEmail={authUser?.email || ''}
						currentLessonInputData={normalizedLessonInputData}
						normalizeLessonInputData={normalizeIntroLessonInputData}
						createEmptyLessonInputData={() => normalizeIntroLessonInputData({})}
						applyLessonInputData={applyLessonInputData}
						clearLessonInputs={handleClearForm}
						onRequireLogin={() => {
							const shouldLogin = window.confirm('Project Manager requires Teachable login. Log in now?');
							if (shouldLogin) {
								initiateOAuthLogin();
							}
						}}
						onNotice={showNotice}
					/>
					<Button variant="contained" color="success" onClick={handleDownloadPdf} sx={{ textTransform: 'none' }}>
						Download as PDF
					</Button>
</Stack>

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

				<Card sx={{ borderRadius: 2, boxShadow: 8 }}>
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
									INTRO
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

						<Box sx={{ mt: 4, mb: 3 }}>
							{Array.from({ length: 3 }, (_, rowIndex) => (
								<Box
									key={rowIndex}
									sx={{
										display: 'grid',
										gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
										gap: 1.5,
										mb: 1.5,
									}}
								>
									{Array.from({ length: 3 }, (_, cellIndex) => {
										const index = rowIndex * 3 + cellIndex;
										return (
											<TextField
												key={`intro-word-${index}`}
												value={words[index] || ''}
												onChange={(e) => handleWordChange(index, e.target.value)}
												onContextMenu={(e) => openContextMenu(e, 'word', index)}
												variant="outlined"
												fullWidth
												inputProps={{
													style: {
														textAlign: 'center',
														fontFamily: 'Courier New, monospace',
														fontSize: '1rem',
													},
												}}
												sx={{
													'& .MuiOutlinedInput-root': {
														'& fieldset': { borderColor: '#4020A7', borderWidth: '2px' },
														'&:hover fieldset': { borderColor: '#667eea' },
														'&.Mui-focused fieldset': { borderColor: '#667eea' },
													},
												}}
											/>
										);
									})}
								</Box>
							))}
						</Box>

						<Typography component="div" sx={{ textAlign: 'center', fontSize: '1.1rem', mb: 4 }}>
							How does{' '}
							<TextField
								variant="standard"
								value={questionMorpheme}
								onChange={(e) => setQuestionMorpheme(e.target.value)}
								onContextMenu={(e) => openContextMenu(e, 'questionMorpheme')}
								sx={{ minWidth: 140, mx: 0.5 }}
								inputProps={{
									style: {
										textAlign: 'center',
										fontFamily: 'Courier New, monospace',
									},
								}}
							/>{' '}
							affect the meaning of these words?
						</Typography>

						<Box
							sx={{
								borderTop: '2px solid #eee',
								pt: 2.5,
								display: 'flex',
								justifyContent: 'center',
							}}
						>
							<Button variant="outlined" onClick={handleClearForm} sx={{ minWidth: 150 }}>
								Clear
							</Button>
						</Box>
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
				{contextMenu.targetType === 'word' && <MenuItem onClick={handleClearContextRow}>Clear row</MenuItem>}
				{contextMenu.targetType === 'word' && <MenuItem onClick={handleClearWordsOnly}>Clear all words</MenuItem>}
				{contextMenu.targetType === 'morpheme' && (
					<MenuItem onClick={handleCopyMorphemeToQuestion}>Copy morpheme to question</MenuItem>
				)}
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
