'use client';

import { Box, Button, Stack, TextField } from '@mui/material';
import ActivityShell from '../components/ActivityShell';
import { useLessonActivityProject } from '../components/useLessonActivityProject';

const FORM_NAME = 'morph-match-related-words';
const DEFAULT_ACTIVITY_NAME = 'Morph Match Related Words Activity';

const FOCUS_COLORS = ['#ffe4e1', '#e1f7ff', '#e1ffe4', '#fffbe1', '#e1e1ff', '#ffe1fa', '#e1ffd6', '#f1e1ff'];

function emptyData() {
	return {
		morpheme: '',
		focusWords: Array.from({ length: 8 }, () => ''),
		relatedWords: Array.from({ length: 8 }, () => ''),
	};
}

function normalizeInputData(rawData) {
	const source = rawData && typeof rawData === 'object' ? rawData : {};
	const focusWords = Array.isArray(source.focusWords) ? source.focusWords : [];
	const relatedWords = Array.isArray(source.relatedWords) ? source.relatedWords : [];
	return {
		morpheme: String(source.morpheme || ''),
		focusWords: Array.from({ length: 8 }, (_, index) => String(focusWords[index] || '')),
		relatedWords: Array.from({ length: 8 }, (_, index) => String(relatedWords[index] || '')),
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
							inputProps={{ style: { fontFamily: 'Courier New, monospace', width: '90%' } }}
							sx={{ backgroundColor: FOCUS_COLORS[index], borderRadius: 0.5, px: 1, '& .MuiInputBase-root::before': { borderBottom: '2px solid #ddd' } }}
						/>
					))}
				</Stack>
				<Stack spacing={1.8}>
					{data.relatedWords.map((value, index) => (
						<TextField
							key={`related-${index}`}
							variant="standard"
							value={value}
							onChange={(event) => setListValue('relatedWords', index, event.target.value)}
							inputProps={{ style: { fontFamily: 'Courier New, monospace', width: '90%' } }}
							sx={{ '& .MuiInputBase-root::before': { borderBottom: '2px solid #ddd' } }}
						/>
					))}
				</Stack>
			</Box>

			<Box sx={{ borderTop: '2px solid #eee', pt: 2.5, display: 'flex', justifyContent: 'center', mt: 4 }}>
				<Button variant="outlined" onClick={() => setData(emptyData())} sx={{ minWidth: 150 }}>
					Clear All
				</Button>
			</Box>
		</ActivityShell>
	);
}
