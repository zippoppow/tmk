'use client';

import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import ActivityShell from '../components/ActivityShell';
import { useLessonActivityProject } from '../components/useLessonActivityProject';

const FORM_NAME = 'fill-in-the-morph-paragraphs';
const DEFAULT_ACTIVITY_NAME = 'Fill In The Morph Paragraphs Activity';

function emptyData() {
	return {
		morpheme: '',
		newWord: '',
		morphWords: [],
		paragraph: '',
	};
}

function normalizeInputData(rawData) {
	const source = rawData && typeof rawData === 'object' ? rawData : {};
	return {
		morpheme: String(source.morpheme || ''),
		newWord: String(source.newWord || ''),
		morphWords: Array.isArray(source.morphWords) ? source.morphWords.map((word) => String(word || '')) : [],
		paragraph: String(source.paragraph || ''),
	};
}

export default function FillInTheMorphParagraphsPage() {
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

	const handleAddWord = () => {
		const trimmed = data.newWord.trim();
		if (!trimmed) {
			return;
		}
		setData((prev) => ({ ...prev, newWord: '', morphWords: [...prev.morphWords, trimmed] }));
	};

	const handleRemoveWord = (index) => {
		setData((prev) => ({
			...prev,
			morphWords: prev.morphWords.filter((_, wordIndex) => wordIndex !== index),
		}));
	};

	return (
		<ActivityShell
			title="FILL IN THE MORPH -- PARAGRAPHS"
			morpheme={data.morpheme}
			onMorphemeChange={(value) => setData((prev) => ({ ...prev, morpheme: value }))}
			instructions="Complete each morph pair, then write or annotate the paragraph."
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
			<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '3fr 9fr' }, gap: 4, mt: 3 }}>
				<Stack spacing={1.25}>
					<Box sx={{ display: 'flex', gap: 1 }}>
						<TextField
							variant="standard"
							fullWidth
							value={data.newWord}
							onChange={(event) => setData((prev) => ({ ...prev, newWord: event.target.value }))}
							placeholder="Add a word..."
							inputProps={{ style: { fontFamily: 'Courier New, monospace' } }}
							sx={{ '& .MuiInputBase-root::before': { borderBottom: '2px solid #ddd' } }}
						/>
						<Button variant="contained" onClick={handleAddWord} sx={{ textTransform: 'none' }}>Add</Button>
					</Box>
					<Box sx={{ minHeight: 320 }}>
						{data.morphWords.map((word, index) => (
							<Box key={`${word}-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#f7f7f7', borderRadius: 1, px: 1.5, py: 0.75, mb: 0.75 }}>
								<Box sx={{ flex: 1, fontFamily: 'Courier New, monospace' }}>{word}</Box>
								<Button size="small" color="error" variant="contained" onClick={() => handleRemoveWord(index)} sx={{ minWidth: 0, px: 1 }}>x</Button>
							</Box>
						))}
					</Box>
				</Stack>

				<Box>
					<TextField
						multiline
						minRows={12}
						fullWidth
						value={data.paragraph}
						onChange={(event) => setData((prev) => ({ ...prev, paragraph: event.target.value }))}
						inputProps={{ style: { fontFamily: 'Courier New, monospace' } }}
						sx={{ '& .MuiOutlinedInput-root fieldset': { borderColor: '#4020A7', borderWidth: '2px' } }}
					/>
				</Box>
			</Box>

			<Box sx={{ borderTop: '2px solid #eee', pt: 2.5, display: 'flex', justifyContent: 'center', mt: 4 }}>
				<Button variant="outlined" onClick={() => setData(emptyData())} sx={{ minWidth: 150 }}>
					Clear All
				</Button>
			</Box>
		</ActivityShell>
	);
}
