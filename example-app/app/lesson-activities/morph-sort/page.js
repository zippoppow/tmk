'use client';

import { useState } from 'react';
import { Box, Button, Grid, IconButton, List, ListItem, ListItemText, Stack, TextField, Typography, Menu, MenuItem } from '@mui/material';
import ActivityShell from '../components/ActivityShell';
import { useLessonActivityProject } from '../components/useLessonActivityProject';

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

export default function MorphSortPage() {
	const [contextMenu, setContextMenu] = useState({ open: false, x: 0, y: 0, wordIndex: -1 });

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

	const removeItem = (column, itemIndex) => {
		setData((prev) => {
			const field = column === 'left' ? 'leftItems' : 'rightItems';
			const next = [...prev[field]];
			next.splice(itemIndex, 1);
			return { ...prev, [field]: next };
		});
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
			? `<div class="license-footer">Licensed for use by: ${authUser.email.replace(/</g, '&lt;')}</div>`
			: '';

		const printWindow = window.open('', '', 'width=1100,height=1400');
		printWindow.document.write(`<!DOCTYPE html>
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
    .word-cell { border-bottom: 2px solid #ddd; padding: 8px 0; font-family: 'Courier New', monospace; color: #4020A7; font-size: 1.05em; }
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
      <div class="instructions">Sort the center words into left and right groups.</div>
    </div>
    <div class="header-column">
      <img src="https://uploads.teachablecdn.com/attachments/fbdb7d04f47642b38193261d6b2e3101.png" alt="The Morphology Kit" />
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
</html>`);
		printWindow.document.close();
		printWindow.onload = () => setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
	};

	return (
		<ActivityShell
			title="MORPH SORT"
			morpheme={data.morpheme}
			onMorphemeChange={(value) => setData((prev) => ({ ...prev, morpheme: value }))}
			instructions="Sort the center words into left and right groups."
			authUser={authUser}
			authLoading={authLoading}
			authFromSuccessRedirect={authFromSuccessRedirect}
			runAuthCheck={runAuthCheck}
			handleLoginLogout={handleLoginLogout}
			handleGoToLessonProjects={handleGoToLessonProjects}
			handleAddToProject={handleAddToProject}
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
			<Grid container spacing={2} sx={{ mt: 2 }}>
				<Grid item xs={12} md={4}>
					<Typography sx={{ fontWeight: 700, mb: 1 }}>Sort Box A</Typography>
					<Box
						sx={{
							border: '2px solid #4a4a4a',
							borderRadius: 1,
							minHeight: '68vh',
							maxHeight: '68vh',
							p: 1.5,
							overflow: 'auto',
							'@media print': {
								minHeight: '42vh',
								maxHeight: '42vh',
								p: 1,
							},
						}}
					>
						<List dense disablePadding>
							{data.leftItems.map((item, itemIndex) => (
								<ListItem
									key={itemIndex}
									disableGutters
									secondaryAction={
										<IconButton size="small" onClick={() => removeItem('left', itemIndex)} sx={{ fontSize: '1rem', color: '#999' }}>×</IconButton>
									}
								>
									<ListItemText primary={item} primaryTypographyProps={{ fontFamily: 'Courier New, monospace' }} />
								</ListItem>
							))}
						</List>
					</Box>
				</Grid>
				<Grid item xs={12} md={4}>
					<Stack spacing={1}>
						{data.words.map((word, index) => (
							<TextField
								key={index}
								variant="standard"
								value={word}
								onChange={(event) => setWord(index, event.target.value)}
								onContextMenu={(event) => openSortMenu(event, index)}
								inputProps={{ style: { fontFamily: 'Courier New, monospace', fontSize: '1.2em', color: '#4020A7' } }}
								sx={{ '& .MuiInputBase-root::before': { borderBottom: '2px solid #ddd' } }}
							/>
						))}
					</Stack>
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
				<Grid item xs={12} md={4}>
					<Typography sx={{ fontWeight: 700, mb: 1 }}>Sort Box B</Typography>
					<Box
						sx={{
							border: '2px solid #4a4a4a',
							borderRadius: 1,
							minHeight: '68vh',
							maxHeight: '68vh',
							p: 1.5,
							overflow: 'auto',
							'@media print': {
								minHeight: '42vh',
								maxHeight: '42vh',
								p: 1,
							},
						}}
					>
						<List dense disablePadding>
							{data.rightItems.map((item, itemIndex) => (
								<ListItem
									key={itemIndex}
									disableGutters
									secondaryAction={
										<IconButton size="small" onClick={() => removeItem('right', itemIndex)} sx={{ fontSize: '1rem', color: '#999' }}>×</IconButton>
									}
								>
									<ListItemText primary={item} primaryTypographyProps={{ fontFamily: 'Courier New, monospace' }} />
								</ListItem>
							))}
						</List>
					</Box>
				</Grid>
			</Grid>

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
