'use client';

import { Box, Button, Grid, Stack, TextField, Typography } from '@mui/material';
import ActivityShell from '../components/ActivityShell';
import { useLessonActivityProject } from '../components/useLessonActivityProject';

const FORM_NAME = 'word-meaning';
const DEFAULT_ACTIVITY_NAME = 'Word Meaning Activity';

function emptyData() {
	return {
		morpheme: '',
		promptWords: Array.from({ length: 12 }, () => ''),
		algoPhrases: Array.from({ length: 12 }, () => ''),
		answerMeanings: Array.from({ length: 12 }, () => ''),
	};
}

function normalizeInputData(rawData) {
	const source = rawData && typeof rawData === 'object' ? rawData : {};
	const promptWords = Array.isArray(source.promptWords) ? source.promptWords : [];
	const algoPhrases = Array.isArray(source.algoPhrases) ? source.algoPhrases : [];
	const answerMeanings = Array.isArray(source.answerMeanings) ? source.answerMeanings : [];
	return {
		morpheme: String(source.morpheme || ''),
		promptWords: Array.from({ length: 12 }, (_, index) => String(promptWords[index] || '')),
		algoPhrases: Array.from({ length: 12 }, (_, index) => String(algoPhrases[index] || '')),
		answerMeanings: Array.from({ length: 12 }, (_, index) => String(answerMeanings[index] || '')),
	};
}

function InputColumn({ title, values, onChange, onClear, variant = 'boxed' }) {
	return (
		<Stack spacing={1}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
				<Typography sx={{ fontWeight: 700 }}>{title}</Typography>
				<Button size="small" variant="outlined" sx={{ textTransform: 'none', minWidth: 0, px: 1.25, py: 0.25 }} onClick={onClear}>Clear</Button>
			</Box>
			{values.map((value, index) => (
				<Box key={index} sx={variant === 'underlined' ? { minHeight: 56, display: 'flex', alignItems: 'center' } : { minHeight: 56, display: 'flex', alignItems: 'center', border: '2px solid #4020A7', borderRadius: 1, px: 1 }}>
					<TextField
						value={value}
						onChange={(event) => onChange(index, event.target.value)}
						size="small"
						fullWidth
						variant={variant === 'underlined' ? 'standard' : 'standard'}
						InputProps={{ disableUnderline: variant !== 'underlined' }}
						inputProps={{ style: { minHeight: 56, fontFamily: 'Courier New, monospace' } }}
						sx={variant === 'underlined'
							? { '& .MuiInputBase-root::before': { borderBottom: '2px solid #4020A7' } }
							: {}}
					/>
				</Box>
			))}
		</Stack>
	);
}

export default function WordMeaningPage() {
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

	const setList = (key, index, value) => {
		setData((prev) => {
			const next = [...prev[key]];
			next[index] = value;
			return { ...prev, [key]: next };
		});
	};

	const clearList = (key) => {
		setData((prev) => ({ ...prev, [key]: prev[key].map(() => '') }));
	};

	return (
		<ActivityShell
			title="WORD MEANING"
			morpheme={data.morpheme}
			onMorphemeChange={(value) => setData((prev) => ({ ...prev, morpheme: value }))}
			instructions="Interpret each prompt word using the morph clues and write the meaning."
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
					<InputColumn title="Prompt Words" values={data.promptWords} onChange={(index, value) => setList('promptWords', index, value)} onClear={() => clearList('promptWords')} />
				</Grid>
				<Grid item xs={12} md={4}>
					<InputColumn title="Algo Phrase / Clue" values={data.algoPhrases} onChange={(index, value) => setList('algoPhrases', index, value)} onClear={() => clearList('algoPhrases')} variant="underlined" />
				</Grid>
				<Grid item xs={12} md={4}>
					<InputColumn title="Word Meaning" values={data.answerMeanings} onChange={(index, value) => setList('answerMeanings', index, value)} onClear={() => clearList('answerMeanings')} />
				</Grid>
			</Grid>
		</ActivityShell>
	);
}
