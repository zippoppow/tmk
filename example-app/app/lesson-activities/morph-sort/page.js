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

	return (
		<ActivityShell
			title="MORPH SORT"
			morpheme={data.morpheme}
			onMorphemeChange={(value) => setData((prev) => ({ ...prev, morpheme: value }))}
			instructions="Sort the center words into left and right groups based on morph features."
			authUser={authUser}
			authLoading={authLoading}
			authFromSuccessRedirect={authFromSuccessRedirect}
			runAuthCheck={runAuthCheck}
			handleLoginLogout={handleLoginLogout}
			handleGoToLessonProjects={handleGoToLessonProjects}
			handleAddToProject={handleAddToProject}
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
			<Grid container spacing={2} sx={{ mt: 2 }}>
				<Grid item xs={12} md={4}>
					<Typography sx={{ fontWeight: 700, mb: 1 }}>Sort Box A</Typography>
					<Box sx={{ border: '2px solid #4a4a4a', borderRadius: 1, minHeight: '68vh', maxHeight: '68vh', p: 1.5, overflow: 'auto' }}>
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
					<MenuItem onClick={() => addWordToColumn('left')}>Add to Column 1</MenuItem>
					<MenuItem onClick={() => addWordToColumn('right')}>Add to Column 2</MenuItem>
				</Menu>
				<Grid item xs={12} md={4}>
					<Typography sx={{ fontWeight: 700, mb: 1 }}>Sort Box B</Typography>
					<Box sx={{ border: '2px solid #4a4a4a', borderRadius: 1, minHeight: '68vh', maxHeight: '68vh', p: 1.5, overflow: 'auto' }}>
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

			<Box sx={{ borderTop: '2px solid #eee', pt: 2.5, display: 'flex', justifyContent: 'center', mt: 4 }}>
				<Button variant="outlined" onClick={handleClearWords} sx={{ minWidth: 150 }}>
					Clear Words
				</Button>
			</Box>
		</ActivityShell>
	);
}
