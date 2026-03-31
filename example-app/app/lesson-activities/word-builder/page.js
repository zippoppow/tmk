'use client';

import { Box, Button, Grid, Stack, TextField, Typography } from '@mui/material';
import ActivityShell from '../components/ActivityShell';
import { useLessonActivityProject } from '../components/useLessonActivityProject';

const FORM_NAME = 'word-builder';
const DEFAULT_ACTIVITY_NAME = 'Word Builder Activity';

function emptyData() {
	return {
		morpheme: '',
		prefixes: Array.from({ length: 5 }, () => ''),
		bases: Array.from({ length: 2 }, () => ''),
		suffixes: Array.from({ length: 5 }, () => ''),
		builtWords: Array.from({ length: 15 }, () => ''),
	};
}

function normalizeInputData(rawData) {
	const source = rawData && typeof rawData === 'object' ? rawData : {};
	const prefixes = Array.isArray(source.prefixes) ? source.prefixes : [];
	const bases = Array.isArray(source.bases) ? source.bases : [];
	const suffixes = Array.isArray(source.suffixes) ? source.suffixes : [];
	const builtWords = Array.isArray(source.builtWords) ? source.builtWords : [];
	return {
		morpheme: String(source.morpheme || ''),
		prefixes: Array.from({ length: 5 }, (_, index) => String(prefixes[index] || '')),
		bases: Array.from({ length: 2 }, (_, index) => String(bases[index] || '')),
		suffixes: Array.from({ length: 5 }, (_, index) => String(suffixes[index] || '')),
		builtWords: Array.from({ length: 15 }, (_, index) => String(builtWords[index] || '')),
	};
}

function ColumnList({ title, values, onChange, bg }) {
	return (
		<Stack spacing={1} sx={{ p: 1.5, borderRadius: 1, background: bg, border: '1px solid rgba(64,32,167,0.18)' }}>
			<Typography sx={{ fontWeight: 700 }}>{title}</Typography>
			{values.map((value, index) => (
				<Box key={index} sx={{ px: 1, py: 0.25, borderRadius: 0.75, backgroundColor: 'rgba(255,255,255,0.55)' }}>
					<TextField
						variant="standard"
						value={value}
						onChange={(event) => onChange(index, event.target.value)}
						fullWidth
						inputProps={{ style: { fontFamily: 'Courier New, monospace' } }}
					/>
				</Box>
			))}
		</Stack>
	);
}

export default function WordBuilderPage() {
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

	const setList = (key, index, value) => {
		setData((prev) => {
			const next = [...prev[key]];
			next[index] = value;
			return { ...prev, [key]: next };
		});
	};

	return (
		<ActivityShell
			title="WORD BUILDER"
			morpheme={data.morpheme}
			onMorphemeChange={(value) => setData((prev) => ({ ...prev, morpheme: value }))}
			instructions="Build words by combining prefixes, base elements, and suffixes."
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
			<Grid container spacing={2} sx={{ mt: 2 }}>
				<Grid item xs={12} md={4}>
					<ColumnList title="Prefixes" values={data.prefixes} onChange={(index, value) => setList('prefixes', index, value)} bg="linear-gradient(180deg,#e8f0ff,#f6f9ff)" />
				</Grid>
				<Grid item xs={12} md={4}>
					<ColumnList title="Base Elements" values={data.bases} onChange={(index, value) => setList('bases', index, value)} bg="linear-gradient(180deg,#fffce8,#fffef6)" />
				</Grid>
				<Grid item xs={12} md={4}>
					<ColumnList title="Suffixes" values={data.suffixes} onChange={(index, value) => setList('suffixes', index, value)} bg="linear-gradient(180deg,#eaffef,#f6fff8)" />
				</Grid>
			</Grid>
			<Box sx={{ mt: 3 }}>
				<Typography sx={{ fontWeight: 700, mb: 1.5 }}>Words Bin</Typography>
				<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.25 }}>
					{data.builtWords.map((value, index) => (
						<TextField
							key={index}
							value={value}
							onChange={(event) => setList('builtWords', index, event.target.value)}
							inputProps={{ style: { fontFamily: 'Courier New, monospace', textAlign: 'center' } }}
							sx={{ '& .MuiOutlinedInput-root fieldset': { borderColor: '#4020A7', borderWidth: '2px' } }}
						/>
					))}
				</Box>
			</Box>
			<Box sx={{ borderTop: '2px solid #eee', pt: 2.5, display: 'flex', justifyContent: 'center', mt: 4 }}>
				<Button variant="outlined" onClick={() => setData(emptyData())} sx={{ minWidth: 150 }}>Clear All</Button>
			</Box>
		</ActivityShell>
	);
}
