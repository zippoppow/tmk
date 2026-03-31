'use client';

import { Box, Button, Grid, Stack, TextField, Typography } from '@mui/material';
import ActivityShell from '../components/ActivityShell';
import { useLessonActivityProject } from '../components/useLessonActivityProject';

const FORM_NAME = 'part-of-speech';
const DEFAULT_ACTIVITY_NAME = 'Part Of Speech Activity';

function emptyData() {
	return {
		morpheme: '',
		grid: Array.from({ length: 9 }, () => ''),
		nounWords: '',
		verbWords: '',
		adjectiveWords: '',
	};
}

function normalizeInputData(rawData) {
	const source = rawData && typeof rawData === 'object' ? rawData : {};
	const grid = Array.isArray(source.grid) ? source.grid : [];
	return {
		morpheme: String(source.morpheme || ''),
		grid: Array.from({ length: 9 }, (_, index) => String(grid[index] || '')),
		nounWords: String(source.nounWords || ''),
		verbWords: String(source.verbWords || ''),
		adjectiveWords: String(source.adjectiveWords || ''),
	};
}

export default function PartOfSpeechPage() {
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

	const setGridValue = (index, value) => {
		setData((prev) => {
			const next = [...prev.grid];
			next[index] = value;
			return { ...prev, grid: next };
		});
	};

	return (
		<ActivityShell
			title="PART OF SPEECH SORT"
			morpheme={data.morpheme}
			onMorphemeChange={(value) => setData((prev) => ({ ...prev, morpheme: value }))}
			instructions="Sort the words by part of speech after exploring the morph set."
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
			<Box sx={{ my: 3 }}>
				{Array.from({ length: 3 }, (_, rowIndex) => (
					<Box key={rowIndex} sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.25, mb: 1.25 }}>
						{Array.from({ length: 3 }, (_, colIndex) => {
							const index = rowIndex * 3 + colIndex;
							return (
								<TextField
									key={index}
									value={data.grid[index] || ''}
									onChange={(event) => setGridValue(index, event.target.value)}
									inputProps={{ style: { textAlign: 'center', fontFamily: 'Courier New, monospace' } }}
									sx={{ '& .MuiOutlinedInput-root fieldset': { borderColor: '#4020A7', borderWidth: '2px' } }}
								/>
							);
						})}
					</Box>
				))}
			</Box>
			<Grid container spacing={2}>
				<Grid item xs={12} md={4}>
					<Typography sx={{ fontWeight: 700, mb: 1 }}>Nouns</Typography>
					<Box sx={{ border: '2px solid #4020A7', borderRadius: 1, minHeight: 260, maxHeight: 420, p: 1.25 }}>
						<TextField multiline minRows={8} fullWidth variant="standard" InputProps={{ disableUnderline: true }} value={data.nounWords} onChange={(event) => setData((prev) => ({ ...prev, nounWords: event.target.value }))} inputProps={{ style: { fontFamily: 'Courier New, monospace' } }} />
					</Box>
				</Grid>
				<Grid item xs={12} md={4}>
					<Typography sx={{ fontWeight: 700, mb: 1 }}>Verbs</Typography>
					<Box sx={{ border: '2px solid #4020A7', borderRadius: 1, minHeight: 260, maxHeight: 420, p: 1.25 }}>
						<TextField multiline minRows={8} fullWidth variant="standard" InputProps={{ disableUnderline: true }} value={data.verbWords} onChange={(event) => setData((prev) => ({ ...prev, verbWords: event.target.value }))} inputProps={{ style: { fontFamily: 'Courier New, monospace' } }} />
					</Box>
				</Grid>
				<Grid item xs={12} md={4}>
					<Typography sx={{ fontWeight: 700, mb: 1 }}>Adjectives / Adverbs</Typography>
					<Box sx={{ border: '2px solid #4020A7', borderRadius: 1, minHeight: 260, maxHeight: 420, p: 1.25 }}>
						<TextField multiline minRows={8} fullWidth variant="standard" InputProps={{ disableUnderline: true }} value={data.adjectiveWords} onChange={(event) => setData((prev) => ({ ...prev, adjectiveWords: event.target.value }))} inputProps={{ style: { fontFamily: 'Courier New, monospace' } }} />
					</Box>
				</Grid>
			</Grid>
			<Box sx={{ borderTop: '2px solid #eee', pt: 2.5, display: 'flex', justifyContent: 'center', mt: 4 }}>
				<Button variant="outlined" onClick={() => setData(emptyData())} sx={{ minWidth: 150 }}>Clear All</Button>
			</Box>
		</ActivityShell>
	);
}
