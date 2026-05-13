'use client';

import { Box, Button, Menu, MenuItem, TextField, Typography } from '@mui/material';
import { useCallback, useEffect } from 'react';
import ActivityShell from '../components/ActivityShell';
import { openPrintWindow } from '../components/openPrintWindow';
import { useLessonActivityProject } from '../components/useLessonActivityProject';
import { useDiyAccess } from '../../components/useDiyAccess';
import { useRouter } from 'next/navigation';
import { useContextActionMenu } from '../components/interactionUtils';

const FORM_NAME = 'intro';
const DEFAULT_ACTIVITY_NAME = 'Intro Activity';
const INTRO_INSTRUCTIONS = 'Read the following words.';
const INTRO_GRID_FONT_SIZES = [16, 20, 24, 28];
const INTRO_GRID_FONT_SIZE_OPTIONS = [
	{ label: 'Small', value: 16 },
	{ label: 'Default', value: 20 },
	{ label: 'Larger', value: 24 },
	{ label: 'Largest', value: 28 },
];

function normalizeIntroGridFontSize(value) {
	const parsed = Number(value);
	return INTRO_GRID_FONT_SIZES.includes(parsed) ? parsed : 20;
}

function emptyWordList() {
	return Array.from({ length: 9 }, () => '');
}

export default function IntroPage() {
	const normalizeInputData = useCallback((rawData) => {
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
			gridFontSize: normalizeIntroGridFontSize(source.gridFontSize),
		};
	}, []);

	const router = useRouter();
	const { hasDiyAccess, loading: diyLoading } = useDiyAccess();

	useEffect(() => {
		if (!diyLoading && !hasDiyAccess) {
			router.replace('/dashboard');
		}
	}, [diyLoading, hasDiyAccess, router]);

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
		standaloneActivityId,
		handleSaveStandalone,
		handleDeleteStandalone,
	} = useLessonActivityProject({
		formName: FORM_NAME,
		defaultActivityName: DEFAULT_ACTIVITY_NAME,
		initialData: { morpheme: '', questionMorpheme: '', words: emptyWordList(), gridFontSize: 20 },
		normalizeInputData,
	});

	const {
		menuState: contextMenu,
		openMenu: openContextMenuMenu,
		closeMenu: closeContextMenu,
	} = useContextActionMenu({ targetType: '', index: -1 });

	if (diyLoading) {
		return null;
	}

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

	const handleGridFontSizeChange = (size) => {
		setData((prev) => ({ ...prev, gridFontSize: normalizeIntroGridFontSize(size) }));
	};

	const handleDownloadPdfLandscape = () => {
		const escapeHtml = (value) => String(value || '')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');

		const wordsHtml = data.words
			.map((word) => `<div class="word-cell">${escapeHtml(word)}</div>`)
			.join('');
		const gridFontSize = normalizeIntroGridFontSize(data.gridFontSize);

		openPrintWindow({
			features: 'width=1400,height=900',
			printDelay: 200,
			html: `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>${escapeHtml(activityName || DEFAULT_ACTIVITY_NAME)}</title>
	<style>
		* { box-sizing: border-box; margin: 0; padding: 0; }
		@page { size: letter landscape; margin: 0.28in; }
		html, body {
			width: 100%;
			height: 100%;
			overflow: hidden;
			font-family: 'Lato', 'Segoe UI', Arial, sans-serif;
			color: #111827;
			background: #fff;
		}
		.sheet {
			width: 100%;
			min-height: 100%;
			display: flex;
			flex-direction: column;
			gap: 14px;
			page-break-inside: avoid;
			break-inside: avoid;
		}
		.header {
			display: grid;
			grid-template-columns: 3fr 1fr;
			gap: 16px;
			align-items: start;
			border-bottom: 3px solid #4020A7;
			padding-bottom: 8px;
		}
		.title { font-size: 28px; letter-spacing: 0.08em; font-weight: 800; }
		.morpheme { margin-top: 6px; font-size: 20px; font-style: italic; }
		.instructions {
			margin-top: 8px;
			font-size: 16px;
			color: #4b5563;
		}
		.morpheme-value {
			font-family: 'Courier New', monospace;
			color: #4020A7;
			font-style: normal;
			margin-left: 6px;
		}
		.logo {
			width: 100%;
			max-width: 180px;
			justify-self: end;
			object-fit: contain;
		}
		.grid {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: 10px;
		}
		.word-cell {
			min-height: 42px;
			border: 2px solid #4020A7;
			border-radius: 7px;
			padding: 8px 10px;
			font-family: 'Courier New', monospace;
			font-size: ${gridFontSize}px;
			display: flex;
			align-items: center;
			justify-content: center;
			text-align: center;
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
		}
		.question {
			margin-top: 4px;
			text-align: center;
			font-size: 22px;
			line-height: 1.25;
		}
		.question-value {
			font-family: 'Courier New', monospace;
			color: #4020A7;
			display: inline-block;
			min-width: 120px;
			border-bottom: 2px solid #4020A7;
			padding: 0 8px 2px;
			margin: 0 6px;
		}
		.license {
			margin-top: auto;
			border-top: 1px solid #e5e7eb;
			padding-top: 8px;
			text-align: right;
			font-size: 12px;
			color: #4b5563;
			font-style: italic;
		}
	</style>
</head>
<body>
	<main class="sheet">
		<header class="header">
			<div>
				<div class="title">INTRO</div>
				<div class="morpheme">Morpheme(s):<span class="morpheme-value">${escapeHtml(data.morpheme)}</span></div>
				<div class="instructions">${escapeHtml(INTRO_INSTRUCTIONS)}</div>
			</div>
			<img class="logo" src="/branding/tmk_diy_logo.png" alt="The Morphology Kit" />
		</header>
		<section class="grid">${wordsHtml}</section>
		<section class="question">
			How does <span class="question-value">${escapeHtml(data.questionMorpheme)}</span> affect the meaning of these words?
		</section>
		${authUser?.email ? `<footer class="license">Licensed for use by: ${escapeHtml(authUser.email)}</footer>` : ''}
	</main>
</body>
</html>`,
			onPopupBlocked: () => showNotice('error', 'Unable to open print window. Please allow popups and try again.'),
		});
	};

	return (
		<ActivityShell
			title="INTRO"
			morpheme={data.morpheme}
			onMorphemeChange={(value) => setData((prev) => ({ ...prev, morpheme: value }))}
			instructions={INTRO_INSTRUCTIONS}
			authUser={authUser}
			authLoading={authLoading}
			authFromSuccessRedirect={authFromSuccessRedirect}
			runAuthCheck={runAuthCheck}
			handleLoginLogout={handleLoginLogout}
			handleGoToLessonProjects={handleGoToLessonProjects}
			handleAddToProject={handleAddToProject}
			handleSave={handleSave}
			handleSaveAndReturn={handleSaveAndReturn}
			handleDownloadPdf={handleDownloadPdfLandscape}
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
			<Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, mt: 1, mb: 1.25, flexWrap: 'wrap' }}>
				<Typography sx={{ fontSize: '0.95rem', color: '#243b53', fontWeight: 600 }}>Word Grid Font Size:</Typography>
				<TextField
					select
					size="small"
					value={normalizeIntroGridFontSize(data.gridFontSize)}
					onChange={(event) => handleGridFontSizeChange(event.target.value)}
					sx={{
						minWidth: 140,
						'& .MuiInputBase-root': {
							height: 30,
							alignItems: 'center',
						},
						'& .MuiSelect-select': {
							display: 'flex',
							alignItems: 'center',
							minHeight: 'unset !important',
							height: '100% !important',
							lineHeight: 1.2,
							fontSize: '0.88rem',
							paddingTop: '0 !important',
							paddingBottom: '0 !important',
							paddingLeft: '10px',
							paddingRight: '28px !important',
						},
						'& .MuiSelect-icon': {
							top: '50%',
							transform: 'translateY(-50%)',
						},
					}}
				>
					{INTRO_GRID_FONT_SIZE_OPTIONS.map((option) => (
						<MenuItem key={option.value} value={option.value}>
							{option.label}
						</MenuItem>
					))}
				</TextField>
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
									value={data.words[index] || ''}
									onChange={(e) => handleWordChange(index, e.target.value)}
									onContextMenu={(e) => openContextMenu(e, 'word', index)}
									variant="outlined"
									fullWidth
									inputProps={{
										style: {
											textAlign: 'center',
										},
									}}
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: '4px',
											transition: 'border-color 0.3s ease, background-color 0.3s ease',
											'& .MuiOutlinedInput-input': {
												padding: '10px',
												textAlign: 'center',
												fontSize: `${normalizeIntroGridFontSize(data.gridFontSize)}px`,
											},
											'& fieldset': { borderColor: '#4020A7', borderWidth: '2px' },
											'&:hover fieldset': { borderColor: '#667eea' },
											'& input::placeholder': { color: '#ccc', opacity: 1 },
											'&.Mui-focused': { backgroundColor: 'rgba(102, 126, 234, 0.05)' },
											'&.Mui-focused fieldset': { borderColor: '#667eea' },
										},
									}}
								/>
							);
						})}
					</Box>
				))}
			</Box>

			<Typography
				component="div"
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					flexWrap: 'wrap',
					gap: 0.5,
					textAlign: 'center',
					fontSize: '1.2rem',
					mb: 4,
				}}
			>
				<Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>How does</Box>
				<TextField
					variant="outlined"
					value={data.questionMorpheme}
					onChange={(e) => setData((prev) => ({ ...prev, questionMorpheme: e.target.value }))}
					onContextMenu={(e) => openContextMenu(e, 'questionMorpheme')}
					sx={{
						minWidth: 140,
						mx: 0.5,
						'& .MuiOutlinedInput-root': {
							height: '100%',
							borderRadius: '4px',
							transition: 'border-color 0.3s ease, background-color 0.3s ease',
							'& .MuiOutlinedInput-input': {
								padding: '8px 10px',
								textAlign: 'center',
								fontSize: '1.5rem',
							},
							'& fieldset': { borderColor: '#4020A7', borderWidth: '2px' },
							'&:hover fieldset': { borderColor: '#667eea' },
							'& input::placeholder': { color: '#ccc', opacity: 1 },
							'&.Mui-focused': { backgroundColor: 'rgba(102, 126, 234, 0.05)' },
							'&.Mui-focused fieldset': { borderColor: '#667eea' },
						},
					}}
					inputProps={{
						style: {
							textAlign: 'center',
						},
					}}
				/>
				<Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
					affect the meaning of these words?
				</Box>
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
					onClick={() => setData({ morpheme: '', questionMorpheme: '', words: emptyWordList(), gridFontSize: 20 })}
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
