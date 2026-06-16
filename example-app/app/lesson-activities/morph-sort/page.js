'use client';

import { useState } from 'react';
import { Box, Button, Grid, IconButton, List, ListItem, ListItemText, Stack, TextField, Typography, Menu, MenuItem } from '@mui/material';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import ActivityShell from '../components/ActivityShell';
import { openPrintWindow } from '../components/openPrintWindow';
import { useLessonActivityProject } from '../components/useLessonActivityProject';
import { ActivityDndProvider, DropZone } from '../components/shared';

const FORM_NAME = 'morph-sort';
const DEFAULT_ACTIVITY_NAME = 'Morph Sort Activity';

function emptyData() {
	return {
		morpheme: '',
		words: Array.from({ length: 11 }, () => ''),
		leftItems: [],
		rightItems: [],
	};
}

function normalizeInputData(rawData) {
	const source = rawData && typeof rawData === 'object' ? rawData : {};
	const words = Array.isArray(source.words) ? source.words : [];
	return {
		morpheme: String(source.morpheme || ''),
		words: Array.from({ length: 11 }, (_, index) => String(words[index] || '')),
		leftItems: Array.isArray(source.leftItems) ? source.leftItems.map(String) : [],
		rightItems: Array.isArray(source.rightItems) ? source.rightItems.map(String) : [],
	};
}

function DragHandle({ id, data, disabled = false }) {
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id, data, disabled });
	return (
		<Box
			ref={setNodeRef}
			component="button"
			type="button"
			aria-label="Drag word"
			{...attributes}
			{...listeners}
			sx={{
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
				width: 24,
				height: 24,
				border: '1px solid #c2c8d6',
				borderRadius: 0.75,
				backgroundColor: isDragging ? 'rgba(64, 32, 167, 0.12)' : 'transparent',
				color: '#263142',
				fontSize: '0.72rem',
				lineHeight: 1,
				cursor: disabled ? 'default' : isDragging ? 'grabbing' : 'grab',
				userSelect: 'none',
				touchAction: disabled ? 'auto' : 'none',
				opacity: disabled ? 0.45 : isDragging ? 0.75 : 1,
				transform: CSS.Translate.toString(transform),
				transition: 'opacity 120ms ease, transform 120ms ease, background-color 120ms ease, border-color 120ms ease',
				'&:hover': {
					backgroundColor: 'rgba(64, 32, 167, 0.08)',
					borderColor: '#4020A7',
				},
			}}
		>
			::
		</Box>
	);
}

export default function MorphSortPage() {
	const [contextMenu, setContextMenu] = useState({ open: false, x: 0, y: 0, wordIndex: -1 });
	const [selectedWordIndex, setSelectedWordIndex] = useState(null);
	const rowActionButtonSx = {
		minWidth: 0,
		width: 24,
		height: 24,
		border: '1px solid #c2c8d6',
		borderRadius: 0.75,
		backgroundColor: 'transparent',
		color: '#263142',
		fontSize: '0.72rem',
		px: 0,
		'&:hover': {
			backgroundColor: 'rgba(64, 32, 167, 0.08)',
			borderColor: '#4020A7',
		},
	};

	const {
		data,
		setData,
		authUser,
		authLoading,
		authFromSuccessRedirect,
		notice,
		setNotice,
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
    isAddToProjectDialogOpen,
    availableLessonProjects,
    selectedProjectIdsForAdd,
    setSelectedProjectIdsForAdd,
    handleCloseAddToProjectDialog,
    handleConfirmAddToProjects,
		handleDownloadPdf,
		standaloneActivityId,
		handleSaveStandalone,
		handleDeleteStandalone,
	} = useLessonActivityProject({
		formName: FORM_NAME,
		defaultActivityName: DEFAULT_ACTIVITY_NAME,
		initialData: emptyData(),
		normalizeInputData,
	});

	const setWord = (index, value) => {
		setData((prev) => {
			const next = [...prev.words];
			next[index] = value;
			return { ...prev, words: next };
		});
	};

	const openSortMenu = (event, wordIndex) => {
		event.preventDefault();
		const word = data.words[wordIndex];
		if (!word || !word.trim()) return;
		setContextMenu({
			open: true,
			x: event.clientX,
			y: event.clientY,
			wordIndex,
		});
	};

	const closeSortMenu = () => {
		setContextMenu({ open: false, x: 0, y: 0, wordIndex: -1 });
	};

	const addWordToColumn = (column) => {
		if (contextMenu.wordIndex < 0) return;
		const word = data.words[contextMenu.wordIndex];
		if (!word || !word.trim()) { closeSortMenu(); return; }
		setData((prev) => {
			const field = column === 'left' ? 'leftItems' : 'rightItems';
			return { ...prev, [field]: [...prev[field], word] };
		});
		closeSortMenu();
	};

	const handleSelectWord = (index) => {
		const word = String(data.words[index] || '').trim();
		if (!word) return;
		setSelectedWordIndex((prev) => (prev === index ? null : index));
	};

	const handleAddSelectedToBox = (column) => {
		if (selectedWordIndex === null) return;
		const value = String(data.words[selectedWordIndex] || '').trim();
		if (!value) { setSelectedWordIndex(null); return; }
		setData((prev) => {
			const nextWords = [...prev.words];
			nextWords[selectedWordIndex] = '';
			const field = column === 'left' ? 'leftItems' : 'rightItems';
			return { ...prev, words: nextWords, [field]: [...prev[field], value] };
		});
		setSelectedWordIndex(null);
	};

	const handleMoveBoxItem = (fromColumn, itemIndex, toColumn) => {
		setData((prev) => {
			const srcField = fromColumn === 'left' ? 'leftItems' : 'rightItems';
			const tgtField = toColumn === 'left' ? 'leftItems' : 'rightItems';
			const nextSrc = [...prev[srcField]];
			const [moved] = nextSrc.splice(itemIndex, 1);
			if (toColumn === 'words') {
				const nextWords = [...prev.words];
				const emptyIdx = nextWords.findIndex((w) => !String(w || '').trim());
				if (emptyIdx < 0) return prev;
				nextWords[emptyIdx] = moved;
				return { ...prev, [srcField]: nextSrc, words: nextWords };
			}
			return { ...prev, [srcField]: nextSrc, [tgtField]: [...prev[tgtField], moved] };
		});
	};

	const removeItem = (column, itemIndex) => {
		setData((prev) => {
			const field = column === 'left' ? 'leftItems' : 'rightItems';
			const next = [...prev[field]];
			next.splice(itemIndex, 1);
			return { ...prev, [field]: next };
		});
	};

	const handleDragEnd = (event) => {
		const source = event?.active?.data?.current;
		const target = event?.over?.data?.current;
		if (!source || !target) return;

		// Middle word → sort box
		if (source.sourceType === 'word' && target.targetType === 'sort-box') {
			const value = String(data.words[source.wordIndex] || '').trim();
			if (!value) return;
			setData((prev) => {
				const nextWords = [...prev.words];
				nextWords[source.wordIndex] = '';
				const field = target.column === 'left' ? 'leftItems' : 'rightItems';
				return { ...prev, words: nextWords, [field]: [...prev[field], value] };
			});
			return;
		}

		// Box item → other sort box
		if (source.sourceType === 'box-item' && target.targetType === 'sort-box') {
			if (source.column === target.column) return;
			setData((prev) => {
				const srcField = source.column === 'left' ? 'leftItems' : 'rightItems';
				const tgtField = target.column === 'left' ? 'leftItems' : 'rightItems';
				const nextSrc = [...prev[srcField]];
				const [moved] = nextSrc.splice(source.itemIndex, 1);
				return { ...prev, [srcField]: nextSrc, [tgtField]: [...prev[tgtField], moved] };
			});
			return;
		}

		// Box item → words column
		if (source.sourceType === 'box-item' && target.targetType === 'words-column') {
			setData((prev) => {
				const srcField = source.column === 'left' ? 'leftItems' : 'rightItems';
				const nextSrc = [...prev[srcField]];
				const nextWords = [...prev.words];
				const emptyIdx = nextWords.findIndex((w) => !String(w || '').trim());
				if (emptyIdx < 0) return prev;
				const [moved] = nextSrc.splice(source.itemIndex, 1);
				nextWords[emptyIdx] = moved;
				return { ...prev, [srcField]: nextSrc, words: nextWords };
			});
			return;
		}
	};

	const handleClearWords = () => {
		setData((prev) => ({ ...prev, words: Array.from({ length: 11 }, () => '') }));
	};

	const handleDownloadPdfCustom = () => {
		const wordItems = data.words
			.map((w) => `<div class="word-cell">${(w || '').replace(/</g, '&lt;')}</div>`)
			.join('');

		const leftItems = data.leftItems.map((item) => `<li>${(item || '').replace(/</g, '&lt;')}</li>`).join('');
		const rightItems = data.rightItems.map((item) => `<li>${(item || '').replace(/</g, '&lt;')}</li>`).join('');

		const licenseFooter = authUser?.email
			? `<div class="license-footer">Licensed for use to: ${authUser.email.replace(/</g, '&lt;')}</div>`
			: '';

		openPrintWindow({
			features: 'width=1100,height=1400',
			html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${(activityName || DEFAULT_ACTIVITY_NAME).replace(/</g, '&lt;')}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; line-height: 1.4; }
    .header { border-bottom: 3px solid #4020A7; padding-bottom: 8px; display: grid; grid-template-columns: 3fr 1fr; gap: 10px; margin-bottom: 20px; }
    .header-column { display: flex; flex-direction: column; gap: 4px; }
    .header-column img { max-width: 180px; height: auto; }
    .title { font-size: 1.5em; font-weight: bold; letter-spacing: 1px; }
    .subtitle { font-size: 1.1em; font-style: italic; }
    .morpheme-value { font-family: 'Courier New', monospace; color: #4020A7; }
    .instructions { font-size: 0.95em; color: #555; margin-top: 4px; }
    .cols { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
    .col-title { font-weight: 700; font-size: 0.95em; margin-bottom: 8px; }
    .sort-box { border: 2px solid #4a4a4a; border-radius: 4px; min-height: 480px; padding: 10px; }
    .word-cell { border-bottom: 2px solid #ddd; padding: 0 4px; font-family: 'Courier New', monospace; color: #4020A7; font-size: 1.05em; height: 42px; display: flex; align-items: center; }
    .sort-box li { font-family: 'Courier New', monospace; list-style: none; padding: 6px 0; border-bottom: 1px solid #eee; }
    .license-footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e5e7eb; text-align: right; font-size: 0.8em; color: #4b5563; font-style: italic; }
    @media print { @page { size: letter portrait; margin: 0.4in; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-column">
      <div class="title">MORPH SORT</div>
      <div class="subtitle">Morpheme(s): <span class="morpheme-value">${(data.morpheme || '').replace(/</g, '&lt;')}</span></div>
      <div class="instructions">Find the families.  Sort the words into two columns based on their related meanings.</div>
    </div>
    <div class="header-column">
      <img src="/branding/tmk_diy_logo_templates.png" alt="The Morphology Kit" />
    </div>
  </div>
  <div class="cols">
    <div>
      <div class="col-title">Sort Box A</div>
      <ul class="sort-box">${leftItems}</ul>
    </div>
    <div>
      <div class="col-title">Words</div>
      <div>${wordItems}</div>
    </div>
    <div>
      <div class="col-title">Sort Box B</div>
      <ul class="sort-box">${rightItems}</ul>
    </div>
  </div>
  ${licenseFooter}
</body>
</html>`,
			onPopupBlocked: () => setNotice({ type: 'error', message: 'Allow pop-ups to print this activity.' }),
		});
	};

	return (
		<ActivityShell
			title="MORPH SORT"
			morpheme={data.morpheme}
			onMorphemeChange={(value) => setData((prev) => ({ ...prev, morpheme: value }))}
			instructions="Find the families.  Sort the words into two columns based on their related meanings."
			authUser={authUser}
			authLoading={authLoading}
			authFromSuccessRedirect={authFromSuccessRedirect}
			runAuthCheck={runAuthCheck}
			handleLoginLogout={handleLoginLogout}
			handleSave={handleSave}
			handleGoToLessonProjects={handleGoToLessonProjects}
			handleAddToProject={handleAddToProject}
        isAddToProjectDialogOpen={isAddToProjectDialogOpen}
        availableLessonProjects={availableLessonProjects}
        selectedProjectIdsForAdd={selectedProjectIdsForAdd}
        setSelectedProjectIdsForAdd={setSelectedProjectIdsForAdd}
        handleCloseAddToProjectDialog={handleCloseAddToProjectDialog}
        handleConfirmAddToProjects={handleConfirmAddToProjects}
			handleSaveAndReturn={handleSaveAndReturn}
			handleDownloadPdf={handleDownloadPdfCustom}
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
			<ActivityDndProvider onDragEnd={handleDragEnd}>
			<Grid container spacing={2} sx={{ mt: 2, alignItems: 'stretch' }}>
				<Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column' }}>
					<Typography sx={{ fontWeight: 700, mb: 1 }}>Sort Box A</Typography>
					{selectedWordIndex !== null && (
						<Button
							size="small"
							variant="outlined"
							onClick={() => handleAddSelectedToBox('left')}
							sx={{ mb: 1, fontSize: '1rem' }}
						>
							← Add "{String(data.words[selectedWordIndex] || '').trim()}" here
						</Button>
					)}
					<DropZone
						id="sort-box-left"
						data={{ targetType: 'sort-box', column: 'left' }}
						minHeight={0}
						inactiveSx={{ border: '2px solid #4a4a4a', borderRadius: 1 }}
						activeSx={{ border: '2px solid #667eea', backgroundColor: 'rgba(102, 126, 234, 0.05)' }}
						sx={{ flex: 1, p: 1.5, overflow: 'auto', display: 'flex', flexDirection: 'column' }}
					>
						<List dense disablePadding sx={{ flex: 1 }}>
							{data.leftItems.map((item, itemIndex) => (
								<ListItem
									key={itemIndex}
									disableGutters
									sx={{ pr: 11 }}
									secondaryAction={
										<Box sx={{ display: 'flex', gap: 0.35 }}>
											<IconButton size="small" aria-label="Move to Sort Box B" onClick={() => handleMoveBoxItem('left', itemIndex, 'right')} sx={rowActionButtonSx}>→B</IconButton>
											<IconButton size="small" aria-label="Return to words" onClick={() => handleMoveBoxItem('left', itemIndex, 'words')} sx={rowActionButtonSx}>↩</IconButton>
											<IconButton size="small" aria-label="Remove" onClick={() => removeItem('left', itemIndex)} sx={{ ...rowActionButtonSx, fontSize: '0.95rem' }}>×</IconButton>
										</Box>
									}
								>
									<DragHandle
										id={`left-item-handle-${itemIndex}`}
										data={{ sourceType: 'box-item', column: 'left', itemIndex, value: item }}
									/>
									<ListItemText primary={item} primaryTypographyProps={{ fontFamily: 'Courier New, monospace' }} sx={{ ml: 0.5 }} />
								</ListItem>
							))}
						</List>
						<Button
							variant="outlined"
							size="small"
							onClick={() => setData((prev) => ({ ...prev, leftItems: [] }))}
							sx={{ mt: 1 }}
						>
							Clear Sort Box A
						</Button>
					</DropZone>
				</Grid>
				<Grid item xs={12} md={4}>
					<DropZone
						id="words-column"
						data={{ targetType: 'words-column' }}
						minHeight={0}
						inactiveSx={{ borderColor: 'transparent', p: 0, backgroundColor: 'transparent' }}
						activeSx={{ border: '2px dashed #667eea', borderRadius: 1, backgroundColor: 'rgba(102, 126, 234, 0.04)' }}
						sx={{ p: 0 }}
					>
						<Stack spacing={1}>
							{data.words.map((word, index) => {
								const hasValue = Boolean(String(word || '').trim());
								const isSelected = selectedWordIndex === index;
								return (
									<Box
										key={index}
										sx={{
											display: 'flex',
											alignItems: 'center',
											gap: 0.5,
											borderRadius: 1,
											outline: isSelected ? '2px solid #667eea' : 'none',
											backgroundColor: isSelected ? 'rgba(102, 126, 234, 0.07)' : 'transparent',
										}}
									>
										<TextField
											variant="standard"
											value={word}
											onChange={(event) => setWord(index, event.target.value)}
											onContextMenu={(event) => openSortMenu(event, index)}
											inputProps={{ style: { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.2rem', color: '#000000' } }}
											sx={{ flex: 1, '& .MuiInputBase-root::before': { borderBottom: '2px solid #ddd' } }}
										/>
										<Button
											size="small"
											variant={isSelected ? 'contained' : 'outlined'}
											disabled={!hasValue}
											onClick={() => handleSelectWord(index)}
											aria-pressed={isSelected}
											aria-label={isSelected ? 'Deselect word' : 'Select word to sort'}
											sx={{ minWidth: 0, px: 1, py: 0.25, fontSize: '0.7rem', lineHeight: 1.4 }}
										>
											{isSelected ? '✓' : <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>⊕</span>}
										</Button>
										<DragHandle
											id={`word-handle-${index}`}
											data={{ sourceType: 'word', wordIndex: index, value: word }}
											disabled={!hasValue}
										/>
									</Box>
								);
							})}
						</Stack>
					</DropZone>
				</Grid>
				<Menu
					open={contextMenu.open}
					onClose={closeSortMenu}
					anchorPosition={{ top: contextMenu.y, left: contextMenu.x }}
					anchorReference="anchorPosition"
				>
					<MenuItem onClick={() => addWordToColumn('left')}>Add to "Sort Box A"</MenuItem>
					<MenuItem onClick={() => addWordToColumn('right')}>Add to "Sort Box B"</MenuItem>
				</Menu>
				<Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column' }}>
					<Typography sx={{ fontWeight: 700, mb: 1 }}>Sort Box B</Typography>
					{selectedWordIndex !== null && (
						<Button
							size="small"
							variant="outlined"
							onClick={() => handleAddSelectedToBox('right')}
							sx={{ mb: 1, fontSize: '1rem' }}
						>
							→ Add "{String(data.words[selectedWordIndex] || '').trim()}" here
						</Button>
					)}
					<DropZone
						id="sort-box-right"
						data={{ targetType: 'sort-box', column: 'right' }}
						minHeight={0}
						inactiveSx={{ border: '2px solid #4a4a4a', borderRadius: 1 }}
						activeSx={{ border: '2px solid #667eea', backgroundColor: 'rgba(102, 126, 234, 0.05)' }}
						sx={{ flex: 1, p: 1.5, overflow: 'auto', display: 'flex', flexDirection: 'column' }}
					>
						<List dense disablePadding sx={{ flex: 1 }}>
							{data.rightItems.map((item, itemIndex) => (
								<ListItem
									key={itemIndex}
									disableGutters
									sx={{ pr: 11 }}
									secondaryAction={
										<Box sx={{ display: 'flex', gap: 0.35 }}>
											<IconButton size="small" aria-label="Move to Sort Box A" onClick={() => handleMoveBoxItem('right', itemIndex, 'left')} sx={rowActionButtonSx}>A←</IconButton>
											<IconButton size="small" aria-label="Return to words" onClick={() => handleMoveBoxItem('right', itemIndex, 'words')} sx={rowActionButtonSx}>↩</IconButton>
											<IconButton size="small" aria-label="Remove" onClick={() => removeItem('right', itemIndex)} sx={{ ...rowActionButtonSx, fontSize: '0.95rem' }}>×</IconButton>
										</Box>
									}
								>
									<DragHandle
										id={`right-item-handle-${itemIndex}`}
										data={{ sourceType: 'box-item', column: 'right', itemIndex, value: item }}
									/>
									<ListItemText primary={item} primaryTypographyProps={{ fontFamily: 'Courier New, monospace' }} sx={{ ml: 0.5 }} />
								</ListItem>
							))}
						</List>
						<Button
							variant="outlined"
							size="small"
							onClick={() => setData((prev) => ({ ...prev, rightItems: [] }))}
							sx={{ mt: 1 }}
						>
							Clear Sort Box B
						</Button>
					</DropZone>
				</Grid>
			</Grid>
			</ActivityDndProvider>

			<Box sx={{ borderTop: '2px solid #eee', pt: 2.5, display: 'flex', justifyContent: 'center', mt: 4 }} className="no-print">
				<Button
					variant="contained"
					onClick={handleClearWords}
					sx={{
						minWidth: 150,
						bgcolor: '#111827',
						color: '#fff',
						'&:hover': { bgcolor: '#1f2937' },
					}}
				>
					Clear Words
				</Button>
			</Box>
		</ActivityShell>
	);
}
