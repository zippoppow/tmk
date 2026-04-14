'use client';

import { Box, Button, Menu, MenuItem, TextField, Typography } from '@mui/material';
import ActivityShell from '../components/ActivityShell';
import { useLessonActivityProject } from '../components/useLessonActivityProject';
import { useContextActionMenu } from '../components/interactionUtils';

const FORM_NAME = 'intro';
const DEFAULT_ACTIVITY_NAME = 'Intro Activity';

function emptyWordList() {
	return Array.from({ length: 9 }, () => '');
}

function normalizeInputData(rawData) {
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
	const {
		data,
		setData,
		authUser,
		authLoading,
		authFromSuccessRedirect,
		notice,
		setNotice,
		showNotice,
		projectId,
		projectName,
		activityName,
		setActivityName,
		isSaving,
		runAuthCheck,
		handleLoginLogout,
		handleSave,
		handleSaveAndReturn,
		handleGoToLessonProjects,
		handleAddToProject,
		handleDownloadPdf,
		standaloneActivityId,
		handleSaveStandalone,
		handleDeleteStandalone,
	} = useLessonActivityProject({
		formName: FORM_NAME,
		defaultActivityName: DEFAULT_ACTIVITY_NAME,
		initialData: { morpheme: '', questionMorpheme: '', words: emptyWordList() },
		normalizeInputData,
	});

	const {
		menuState: contextMenu,
		openMenu: openContextMenuMenu,
		closeMenu: closeContextMenu,
	} = useContextActionMenu({ targetType: '', index: -1 });

	const handleWordChange = (index, value) => {
		setData((prev) => {
			const next = [...prev.words];
			next[index] = value;
			return { ...prev, words: next };
		});
	};

	const handleClearWordsOnly = () => {
		setData((prev) => ({ ...prev, words: emptyWordList() }));
		closeContextMenu();
	};

	const openContextMenu = (event, targetType, index = -1) => {
		openContextMenuMenu(event, { targetType, index });
	};

	const getContextTargetValue = () => {
		if (contextMenu.targetType === 'word' && contextMenu.index >= 0) {
			return data.words[contextMenu.index] || '';
		}
		if (contextMenu.targetType === 'morpheme') {
			return data.morpheme;
		}
		if (contextMenu.targetType === 'questionMorpheme') {
			return data.questionMorpheme;
		}
		return '';
	};

	const setContextTargetValue = (value) => {
		if (contextMenu.targetType === 'word' && contextMenu.index >= 0) {
			handleWordChange(contextMenu.index, value);
			return;
		}
		if (contextMenu.targetType === 'morpheme') {
			setData((prev) => ({ ...prev, morpheme: value }));
			return;
		}
		if (contextMenu.targetType === 'questionMorpheme') {
			setData((prev) => ({ ...prev, questionMorpheme: value }));
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
		setData((prev) => {
			const next = [...prev.words];
			next[rowStart] = '';
			next[rowStart + 1] = '';
			next[rowStart + 2] = '';
			return { ...prev, words: next };
		});
		closeContextMenu();
	};

	const handleCopyMorphemeToQuestion = () => {
		setData((prev) => ({ ...prev, questionMorpheme: prev.morpheme }));
		closeContextMenu();
	};

	return (
		<ActivityShell
			title="INTRO"
			morpheme={data.morpheme}
			onMorphemeChange={(value) => setData((prev) => ({ ...prev, morpheme: value }))}
			instructions="Fill-in the correct form of the morpheme and read the following words."
			authUser={authUser}
			authLoading={authLoading}
			authFromSuccessRedirect={authFromSuccessRedirect}
			runAuthCheck={runAuthCheck}
			handleLoginLogout={handleLoginLogout}
			handleGoToLessonProjects={handleGoToLessonProjects}
			handleAddToProject={handleAddToProject}
			handleSave={handleSave}
			handleSaveAndReturn={handleSaveAndReturn}
			handleDownloadPdf={handleDownloadPdf}
			standaloneActivityId={standaloneActivityId}
			handleSaveStandalone={handleSaveStandalone}
			handleDeleteStandalone={handleDeleteStandalone}
			projectId={projectId}
			projectName={projectName}
			activityName={activityName}
			setActivityName={setActivityName}
			isSaving={isSaving}
			notice={notice}
			setNotice={setNotice}
		>
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
									value={data.words[index] || ''}
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
					value={data.questionMorpheme}
					onChange={(e) => setData((prev) => ({ ...prev, questionMorpheme: e.target.value }))}
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
				<Button
					variant="outlined"
					onClick={() => setData({ morpheme: '', questionMorpheme: '', words: emptyWordList() })}
					sx={{ minWidth: 150 }}
				>
					Clear
				</Button>
			</Box>

			<Menu
				open={contextMenu.open}
				onClose={closeContextMenu}
				anchorReference="anchorPosition"
				anchorPosition={contextMenu.open ? { top: contextMenu.y, left: contextMenu.x } : undefined}
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
		</ActivityShell>
	);
}
