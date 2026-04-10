'use client';

import { useState } from 'react';
import { Box, Button, Grid, Stack, TextField, Typography, Menu, MenuItem } from '@mui/material';
import ActivityShell from '../components/ActivityShell';
import { useLessonActivityProject } from '../components/useLessonActivityProject';

const FORM_NAME = 'morph-sort';
const DEFAULT_ACTIVITY_NAME = 'Morph Sort Activity';

function emptyData() {
	return {
		morpheme: '',
		words: Array.from({ length: 11 }, () => ''),
		leftSort: '',
		rightSort: '',
	};
}

function normalizeInputData(rawData) {
	const source = rawData && typeof rawData === 'object' ? rawData : {};
	const words = Array.isArray(source.words) ? source.words : [];
	return {
		morpheme: String(source.morpheme || ''),
		words: Array.from({ length: 11 }, (_, index) => String(words[index] || '')),
		leftSort: String(source.leftSort || ''),
		rightSort: String(source.rightSort || ''),
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
		event.stopPropagation();
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

	const addWordToSort = (targetBox) => {
		if (contextMenu.wordIndex < 0) return;
		const word = data.words[contextMenu.wordIndex];
		if (!word || !word.trim()) {
			closeSortMenu();
			return;
		}

		setData((prev) => {
			const targetField = targetBox === 'left' ? 'leftSort' : 'rightSort';
			const currentValue = prev[targetField].trim();
			const newValue = currentValue ? `${currentValue}\n${word}` : word;
			const nextWords = [...prev.words];
			nextWords[contextMenu.wordIndex] = '';
			return {
				...prev,
				[targetField]: newValue,
				words: nextWords,
			};
		});
		closeSortMenu();
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
						<TextField
							multiline
							minRows={18}
							fullWidth
							value={data.leftSort}
							onChange={(event) => setData((prev) => ({ ...prev, leftSort: event.target.value }))}
							variant="standard"
							InputProps={{ disableUnderline: true }}
							inputProps={{ style: { fontFamily: 'Courier New, monospace' } }}
						/>
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
					<MenuItem onClick={() => addWordToSort('left')}>Add to Sort Box A</MenuItem>
					<MenuItem onClick={() => addWordToSort('right')}>Add to Sort Box B</MenuItem>
				</Menu>
				<Grid item xs={12} md={4}>
					<Typography sx={{ fontWeight: 700, mb: 1 }}>Sort Box B</Typography>
					<Box sx={{ border: '2px solid #4a4a4a', borderRadius: 1, minHeight: '68vh', maxHeight: '68vh', p: 1.5, overflow: 'auto' }}>
						<TextField
							multiline
							minRows={18}
							fullWidth
							value={data.rightSort}
							onChange={(event) => setData((prev) => ({ ...prev, rightSort: event.target.value }))}
							variant="standard"
							InputProps={{ disableUnderline: true }}
							inputProps={{ style: { fontFamily: 'Courier New, monospace' } }}
						/>
					</Box>
				</Grid>
			</Grid>

			<Box sx={{ borderTop: '2px solid #eee', pt: 2.5, display: 'flex', justifyContent: 'center', mt: 4 }}>
				<Button variant="outlined" onClick={() => setData(emptyData())} sx={{ minWidth: 150 }}>
					Clear All
				</Button>
			</Box>
		</ActivityShell>
	);
}
