'use client';

import { useRef } from 'react';
import { Box, Button, Menu, MenuItem, Stack, TextField, Typography } from '@mui/material';
import ActivityShell from '../components/ActivityShell';
import { useLessonActivityProject } from '../components/useLessonActivityProject';
import { useContextActionMenu } from '../components/interactionUtils';

const FORM_NAME = 'chameleon-prefixes';
const DEFAULT_ACTIVITY_NAME = 'Chameleon Prefixes Activity';

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
		initialData: { morpheme: '', grid: emptyGrid(), pairs: emptyPairs() },
		normalizeInputData: normalizeChameleonPrefixesLessonInputData,
	});

	const pairPrefixRefs = useRef([]);
	const {
		menuState: contextMenu,
		openMenu: openContextMenuMenu,
		closeMenu: closeContextMenu,
	} = useContextActionMenu({ targetType: '', index: -1, field: '' });

	const handleGridChange = (index, value) => {
		setData((prev) => {
			const next = [...prev.grid];
			next[index] = value;
			return { ...prev, grid: next };
		});
	};

	const handlePairChange = (index, field, value) => {
		setData((prev) => {
			const next = [...prev.pairs];
			next[index] = { ...next[index], [field]: value };
			return { ...prev, pairs: next };
		});
	};

	const handleClearForm = () => {
		setData({ morpheme: '', grid: emptyGrid(), pairs: emptyPairs() });
	};

	const openContextMenu = (event, targetType, index = -1, field = '') => {
		openContextMenuMenu(event, { targetType, index, field });
	};

	const getContextTargetValue = () => {
		if (contextMenu.targetType === 'grid') return data.grid[contextMenu.index] || '';
		if (contextMenu.targetType === 'pair') return data.pairs[contextMenu.index]?.[contextMenu.field] || '';
		if (contextMenu.targetType === 'morpheme') return data.morpheme;
		return '';
	};

	const setContextTargetValue = (value) => {
		if (contextMenu.targetType === 'grid') { handleGridChange(contextMenu.index, value); return; }
		if (contextMenu.targetType === 'pair') { handlePairChange(contextMenu.index, contextMenu.field, value); return; }
		if (contextMenu.targetType === 'morpheme') setData((prev) => ({ ...prev, morpheme: value }));
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
		const gridValue = data.grid[contextMenu.index] || '';
		const prefixValue = data.pairs[pairIndex]?.prefix || '';
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

	const handleDownloadPdfLandscape = () => {
		const escapeHtml = (value) => String(value || '')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');

		const gridHtml = data.grid
			.map((item) => `<div class="grid-cell">${escapeHtml(item)}</div>`)
			.join('');

		const pairRowsHtml = data.pairs
			.map((pair, index) => (
				`<div class="pair-row"><div class="pair-index">${index + 1}.</div><div class="pair-prefix">${escapeHtml(pair?.prefix)}</div><div class="pair-word">${escapeHtml(pair?.word)}</div></div>`
			))
			.join('');

		const printWindow = window.open('', '', 'width=1400,height=900');
		if (!printWindow) {
			showNotice('error', 'Unable to open print window. Please allow popups and try again.');
			return;
		}

		printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>${escapeHtml(activityName || DEFAULT_ACTIVITY_NAME)}</title>
	<style>
		* { box-sizing: border-box; margin: 0; padding: 0; }
		@page { size: letter landscape; margin: 0.22in; }
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
			gap: 10px;
			page-break-inside: avoid;
			break-inside: avoid;
		}
		.header {
			display: grid;
			grid-template-columns: 3fr 1fr;
			gap: 14px;
			align-items: start;
			border-bottom: 3px solid #4020A7;
			padding-bottom: 6px;
		}
		.title { font-size: 24px; letter-spacing: 0.07em; font-weight: 800; }
		.morpheme { margin-top: 4px; font-size: 17px; font-style: italic; }
		.morpheme-value {
			font-family: 'Courier New', monospace;
			color: #4020A7;
			font-style: normal;
			margin-left: 6px;
		}
		.instructions { margin-top: 4px; color: #4b5563; font-size: 12px; }
		.logo {
			width: 100%;
			max-width: 160px;
			justify-self: end;
			object-fit: contain;
		}
		.grid {
			display: grid;
			grid-template-columns: repeat(6, 1fr);
			gap: 6px;
		}
		.grid-cell {
			min-height: 28px;
			border: 1px solid #374151;
			border-radius: 3px;
			padding: 4px 6px;
			font-family: 'Courier New', monospace;
			font-size: 13px;
			display: flex;
			align-items: center;
			justify-content: center;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.pairs {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 8px 16px;
			margin-top: 2px;
		}
		.pair-row {
			display: grid;
			grid-template-columns: 24px 1fr 2fr;
			align-items: center;
			gap: 6px;
			min-height: 22px;
		}
		.pair-index { font-weight: 700; font-size: 12px; }
		.pair-prefix, .pair-word {
			border-bottom: 1px solid #9ca3af;
			padding: 1px 2px;
			font-family: 'Courier New', monospace;
			font-size: 12px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.license {
			margin-top: auto;
			border-top: 1px solid #e5e7eb;
			padding-top: 6px;
			text-align: right;
			font-size: 11px;
			color: #4b5563;
			font-style: italic;
		}
	</style>
</head>
<body>
	<main class="sheet">
		<header class="header">
			<div>
				<div class="title">CHAMELEON PREFIXES</div>
				<div class="morpheme">Morpheme(s): <span class="morpheme-value">${escapeHtml(data.morpheme)}</span></div>
				<div class="instructions">Fill-in the correct form of the morpheme and read the following words.</div>
			</div>
			<img class="logo" src="https://uploads.teachablecdn.com/attachments/fbdb7d04f47642b38193261d6b2e3101.png" alt="The Morphology Kit" />
		</header>
		<section class="grid">${gridHtml}</section>
		<section class="pairs">${pairRowsHtml}</section>
		${authUser?.email ? `<footer class="license">Licensed for use by: ${escapeHtml(authUser.email)}</footer>` : ''}
	</main>
</body>
</html>`);

		printWindow.document.close();
		printWindow.onload = () => {
			setTimeout(() => {
				printWindow.print();
				printWindow.close();
			}, 200);
		};
	};

	return (
		<ActivityShell
			title="Chameleon Prefixes"
			morpheme={data.morpheme}
			onMorphemeChange={(value) => setData((prev) => ({ ...prev, morpheme: value }))}
			onMorphemeContextMenu={(event) => openContextMenu(event, 'morpheme')}
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
									value={data.grid[cellIndex] || ''}
									onChange={(event) => handleGridChange(cellIndex, event.target.value)}
									onContextMenu={(event) => openContextMenu(event, 'grid', cellIndex)}
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
											inputRef={(element) => { pairPrefixRefs.current[pairIndex] = element; }}
											variant="standard"
											value={data.pairs[pairIndex]?.prefix || ''}
											onChange={(event) => handlePairChange(pairIndex, 'prefix', event.target.value)}
											onContextMenu={(event) => openContextMenu(event, 'pair', pairIndex, 'prefix')}
											sx={{ width: '33%' }}
											inputProps={{ style: { fontFamily: 'Courier New, monospace', fontSize: '1rem' } }}
										/>
										<TextField
											variant="standard"
											value={data.pairs[pairIndex]?.word || ''}
											onChange={(event) => handlePairChange(pairIndex, 'word', event.target.value)}
											onContextMenu={(event) => openContextMenu(event, 'pair', pairIndex, 'word')}
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

			<Menu
				open={contextMenu.open}
				onClose={closeContextMenu}
				anchorReference="anchorPosition"
				anchorPosition={contextMenu.open ? { top: contextMenu.y, left: contextMenu.x } : undefined}
			>
				{contextMenu.targetType === 'grid'
					? Array.from({ length: 12 }, (_, index) => (
							<MenuItem key={`sync-${index}`} onClick={() => handleSyncGridToPair(index)}>
								Item {index + 1}
							</MenuItem>
						))
					: [
						<MenuItem key="copy" onClick={handleCopyTarget}>Copy value</MenuItem>,
						<MenuItem key="paste" onClick={handlePasteTarget}>Paste value</MenuItem>,
						<MenuItem key="clear" onClick={handleClearTarget}>Clear field</MenuItem>,
					]}
			</Menu>
		</ActivityShell>
	);
}
