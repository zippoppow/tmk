'use client';

import { Box, Button, Menu, MenuItem, Stack, TextField } from '@mui/material';
import ActivityShell from '../components/ActivityShell';
import { useLessonActivityProject } from '../components/useLessonActivityProject';
import { useContextActionMenu } from '../components/interactionUtils';

const FORM_NAME = 'morph-match-related-words';
const DEFAULT_ACTIVITY_NAME = 'Morph Match Related Words Activity';

const FOCUS_COLORS = ['#ffe4e1', '#e1f7ff', '#e1ffe4', '#fffbe1', '#e1e1ff', '#ffe1fa', '#e1ffd6', '#f1e1ff'];

function emptyData() {
	return {
		morpheme: '',
		focusWords: Array.from({ length: 8 }, () => ''),
		relatedWords: Array.from({ length: 8 }, () => ''),
		relatedWordColors: Array.from({ length: 8 }, () => ''),
	};
}

function normalizeInputData(rawData) {
	const source = rawData && typeof rawData === 'object' ? rawData : {};
	const focusWords = Array.isArray(source.focusWords) ? source.focusWords : [];
	const relatedWords = Array.isArray(source.relatedWords) ? source.relatedWords : [];
	const relatedWordColors = Array.isArray(source.relatedWordColors) ? source.relatedWordColors : [];
	return {
		morpheme: String(source.morpheme || ''),
		focusWords: Array.from({ length: 8 }, (_, index) => String(focusWords[index] || '')),
		relatedWords: Array.from({ length: 8 }, (_, index) => String(relatedWords[index] || '')),
		relatedWordColors: Array.from({ length: 8 }, (_, index) => String(relatedWordColors[index] || '')),
	};
}

export default function MorphMatchRelatedWordsPage() {
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

	const setListValue = (key, index, value) => {
		setData((prev) => {
			const next = [...prev[key]];
			next[index] = value;
			return { ...prev, [key]: next };
		});
	};

	const { menuState: focusMenu, openMenu: openFocusMenu, closeMenu: closeFocusMenu } = useContextActionMenu();

	const handleSetRelatedColor = (relatedIndex) => {
		setData((prev) => {
			const next = [...prev.relatedWordColors];
			next[relatedIndex] = FOCUS_COLORS[focusMenu.index];
			return { ...prev, relatedWordColors: next };
		});
		closeFocusMenu();
	};

	const handleClearRelatedColor = (relatedIndex) => {
		setData((prev) => {
			const next = [...prev.relatedWordColors];
			next[relatedIndex] = '';
			return { ...prev, relatedWordColors: next };
		});
	};

	const handleClearFocusWords = () => {
		setData((prev) => ({ ...prev, focusWords: Array.from({ length: 8 }, () => '') }));
	};

	const handleClearRelatedWords = () => {
		setData((prev) => ({ ...prev, relatedWords: Array.from({ length: 8 }, () => '') }));
	};

	return (
		<ActivityShell
			title="MORPH MATCH -- RELATED WORDS"
			morpheme={data.morpheme}
			onMorphemeChange={(value) => setData((prev) => ({ ...prev, morpheme: value }))}
			instructions="Match focus words with related words that share morph connections."
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
			<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4, mt: 3 }}>
				<Stack spacing={1.8}>
					{data.focusWords.map((value, index) => (
						<TextField
							key={`focus-${index}`}
							variant="standard"
							value={value}
							onChange={(event) => setListValue('focusWords', index, event.target.value)}
							onContextMenu={(event) => openFocusMenu(event, { targetType: 'focusWord', index })}
							inputProps={{ style: { fontFamily: 'Courier New, monospace', width: '90%' } }}
							sx={{ backgroundColor: FOCUS_COLORS[index], borderRadius: 0.5, px: 1, '& .MuiInputBase-root::before': { borderBottom: '2px solid #ddd' } }}
						/>
					))}
					<Box sx={{ pt: 1 }}>
						<Button variant="outlined" size="small" onClick={handleClearFocusWords}>
							Clear Focus Words
						</Button>
					</Box>
				</Stack>
				<Stack spacing={1.8}>
					{data.relatedWords.map((value, index) => (
						<TextField
							key={`related-${index}`}
							variant="standard"
							value={value}
							onChange={(event) => setListValue('relatedWords', index, event.target.value)}
							onDoubleClick={() => handleClearRelatedColor(index)}
							inputProps={{ style: { fontFamily: 'Courier New, monospace', width: '90%' } }}
							sx={{ backgroundColor: data.relatedWordColors[index] || 'transparent', borderRadius: 0.5, px: 1, '& .MuiInputBase-root::before': { borderBottom: '2px solid #ddd' } }}
						/>
					))}
					<Box sx={{ pt: 1 }}>
						<Button variant="outlined" size="small" onClick={handleClearRelatedWords}>
							Clear Related Words
						</Button>
					</Box>
				</Stack>
			</Box>

			<Menu
				open={focusMenu.open}
				onClose={closeFocusMenu}
				anchorReference="anchorPosition"
				anchorPosition={focusMenu.open ? { top: focusMenu.y, left: focusMenu.x } : undefined}
			>
				{data.relatedWords.map((_, relatedIndex) => (
					<MenuItem key={relatedIndex} onClick={() => handleSetRelatedColor(relatedIndex)}>
						Set color for Related Word {relatedIndex + 1}
					</MenuItem>
				))}
			</Menu>
		</ActivityShell>
	);
}
