'use client';

import { Box, Button, Grid, Stack, TextField, Typography } from '@mui/material';
import ActivityShell from '../components/ActivityShell';
import { useLessonActivityProject } from '../components/useLessonActivityProject';

const FORM_NAME = 'morph-match-definitions';
const DEFAULT_ACTIVITY_NAME = 'Morph Match Definitions Activity';

function emptyData() {
	return {
		morpheme: '',
		words: Array.from({ length: 8 }, () => ''),
		numbers: Array.from({ length: 8 }, () => ''),
		definitions: Array.from({ length: 8 }, () => ''),
	};
}

function normalizeInputData(rawData) {
	const source = rawData && typeof rawData === 'object' ? rawData : {};
	const words = Array.isArray(source.words) ? source.words : [];
	const numbers = Array.isArray(source.numbers) ? source.numbers : [];
	const definitions = Array.isArray(source.definitions) ? source.definitions : [];
	return {
		morpheme: String(source.morpheme || ''),
		words: Array.from({ length: 8 }, (_, index) => String(words[index] || '')),
		numbers: Array.from({ length: 8 }, (_, index) => String(numbers[index] || '')),
		definitions: Array.from({ length: 8 }, (_, index) => String(definitions[index] || '')),
	};
}

export default function MorphMatchDefinitionsPage() {
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
			title="MORPH MATCH -- DEFINITIONS"
			morpheme={data.morpheme}
			onMorphemeChange={(value) => setData((prev) => ({ ...prev, morpheme: value }))}
			instructions="Match each morph-based word to the correct numbered definition."
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
			<Grid container spacing={3} sx={{ mt: 2 }}>
				<Grid item xs={12} md={4}>
					<Stack spacing={1.5}>
						{data.words.map((word, index) => (
							<Box key={index} sx={{ display: 'grid', gridTemplateColumns: '8fr 2fr', gap: 1 }}>
								<TextField
									variant="standard"
									value={word}
									onChange={(event) => setListValue('words', index, event.target.value)}
									inputProps={{ style: { fontFamily: 'Courier New, monospace' } }}
									sx={{ '& .MuiInputBase-root::before': { borderBottom: '2px solid #ddd' } }}
								/>
								<TextField
									value={data.numbers[index] || ''}
									onChange={(event) => setListValue('numbers', index, event.target.value)}
									inputProps={{ style: { textAlign: 'center', fontWeight: 700 } }}
									sx={{ '& .MuiOutlinedInput-root fieldset': { borderColor: '#ddd', borderWidth: '1px' } }}
								/>
							</Box>
						))}
					</Stack>
				</Grid>
				<Grid item xs={12} md={8}>
					<Stack spacing={1.5}>
						{data.definitions.map((definition, index) => (
							<Box key={`def-${index}`} sx={{ display: 'grid', gridTemplateColumns: '32px 1fr', gap: 1, alignItems: 'start' }}>
								<Typography sx={{ fontWeight: 700, pt: 1 }}>{index + 1}.</Typography>
								<TextField
									variant="standard"
									multiline
									minRows={2}
									value={definition}
									onChange={(event) => setListValue('definitions', index, event.target.value)}
									inputProps={{ style: { minHeight: '2.5em', fontFamily: 'Courier New, monospace' } }}
									sx={{ '& .MuiInputBase-root::before': { borderBottom: '2px solid #ddd' } }}
								/>
							</Box>
						))}
					</Stack>
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
