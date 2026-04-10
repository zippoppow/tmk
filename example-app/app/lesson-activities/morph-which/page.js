'use client';

import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import ActivityShell from '../components/ActivityShell';
import { useLessonActivityProject } from '../components/useLessonActivityProject';
import { useClickDoubleClickSelection } from '../components/interactionUtils';

const FORM_NAME = 'morph-which';
const DEFAULT_ACTIVITY_NAME = 'Morph Which Activity';
const OPTION_STYLES = [
	{ bg: 'linear-gradient(180deg, #fff8c6, #fff3a0)', shadow: '#c89f00' },
	{ bg: 'linear-gradient(180deg, #dff7e1, #c8efcb)', shadow: '#2e7d32' },
	{ bg: 'linear-gradient(180deg, #efe1ff, #e1d0ff)', shadow: '#6a1b9a' },
	{ bg: 'linear-gradient(180deg, #ffe9d6, #ffd7b1)', shadow: '#c96b00' },
];

function emptyChoiceSet() {
	return { a: '', b: '', c: '', d: '' };
}

function emptyData() {
	return {
		morpheme: '',
		questions: Array.from({ length: 8 }, () => ''),
		choices: Array.from({ length: 8 }, () => emptyChoiceSet()),
		selectedChoices: Array.from({ length: 8 }, () => ''),
	};
}

function normalizeInputData(rawData) {
	const source = rawData && typeof rawData === 'object' ? rawData : {};
	const questions = Array.isArray(source.questions) ? source.questions : [];
	const choices = Array.isArray(source.choices) ? source.choices : [];
	const selectedChoices = Array.isArray(source.selectedChoices) ? source.selectedChoices : [];
	return {
		morpheme: String(source.morpheme || ''),
		questions: Array.from({ length: 8 }, (_, index) => String(questions[index] || '')),
		choices: Array.from({ length: 8 }, (_, index) => {
			const choice = choices[index] || {};
			return {
				a: String(choice.a || ''),
				b: String(choice.b || ''),
				c: String(choice.c || ''),
				d: String(choice.d || ''),
			};
		}),
		selectedChoices: Array.from({ length: 8 }, (_, index) => {
			const rawValue = String(selectedChoices[index] || '').toLowerCase();
			return ['a', 'b', 'c', 'd'].includes(rawValue) ? rawValue : '';
		}),
	};
}

export default function MorphWhichPage() {
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

	const setQuestion = (index, value) => {
		setData((prev) => {
			const next = [...prev.questions];
			next[index] = value;
			return { ...prev, questions: next };
		});
	};

	const setChoice = (index, key, value) => {
		setData((prev) => {
			const next = [...prev.choices];
			next[index] = { ...next[index], [key]: value };
			return { ...prev, choices: next };
		});
	};

	const clearSelectedChoice = (questionIndex) => {
		setData((prev) => {
			const next = [...(prev.selectedChoices || Array.from({ length: 8 }, () => ''))];
			next[questionIndex] = '';
			return { ...prev, selectedChoices: next };
		});
	};

	const selectChoice = (questionIndex, optionKey) => {
		setData((prev) => {
			const next = [...(prev.selectedChoices || Array.from({ length: 8 }, () => ''))];
			next[questionIndex] = optionKey;
			return { ...prev, selectedChoices: next };
		});
	};

	const { handleClick: handleOptionClick, handleDoubleClick: handleOptionDoubleClick } = useClickDoubleClickSelection({
		onClick: ({ questionIndex }) => clearSelectedChoice(questionIndex),
		onDoubleClick: ({ questionIndex, optionKey }) => selectChoice(questionIndex, optionKey),
		delayMs: 300,
	});

	return (
		<ActivityShell
			title="MORPH, WHICH?"
			morpheme={data.morpheme}
			onMorphemeChange={(value) => setData((prev) => ({ ...prev, morpheme: value }))}
			instructions="Write the focus prompt, then fill four option paths for each numbered item."
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
			<Stack spacing={2} sx={{ mt: 3 }}>
				{data.questions.map((question, index) => (
					<Box key={index} sx={{ display: 'grid', gridTemplateColumns: '1fr 24fr', gap: 1.5, alignItems: 'start' }}>
						<Typography sx={{ fontWeight: 700, pt: 1 }}>{index + 1}.</Typography>
						<Stack spacing={1}>
							<TextField
								variant="standard"
								value={question}
								onChange={(event) => setQuestion(index, event.target.value)}
								placeholder="Question / root word"
								inputProps={{ style: { fontFamily: 'Courier New, monospace' } }}
								sx={{ '& .MuiInputBase-root::before': { borderBottom: '2px solid #ddd' } }}
							/>
							<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1 }}>
								{['a', 'b', 'c', 'd'].map((key, keyIndex) => (
									(() => {
										const isSelected = String(data.selectedChoices?.[index] || '') === key;
										return (
									<TextField
										key={key}
										variant="standard"
										value={data.choices[index]?.[key] || ''}
										onChange={(event) => setChoice(index, key, event.target.value)}
										onClick={() => handleOptionClick({ questionIndex: index, optionKey: key })}
										onDoubleClick={() => handleOptionDoubleClick({ questionIndex: index, optionKey: key })}
										placeholder={`Option ${String.fromCharCode(65 + keyIndex)}`}
										inputProps={{ style: { fontFamily: 'Courier New, monospace' } }}
										sx={{
											background: OPTION_STYLES[keyIndex].bg,
											px: 0.75,
											borderRadius: 0.5,
											boxShadow: isSelected
												? `inset 0 0 0 4px ${OPTION_STYLES[keyIndex].shadow}, 0 6px 18px ${OPTION_STYLES[keyIndex].shadow}40`
												: `inset 0 0 0 1px ${OPTION_STYLES[keyIndex].shadow}`,
											'& .MuiInputBase-root::before': { borderBottom: '2px solid transparent' },
											'& .MuiInputBase-root.Mui-focused': { boxShadow: `inset 0 0 0 2px ${OPTION_STYLES[keyIndex].shadow}` },
										}}
									/>
										);
									})()
								)}
							</Box>
						</Stack>
					</Box>
				))}
			</Stack>
			<Box sx={{ borderTop: '2px solid #eee', pt: 2.5, display: 'flex', justifyContent: 'center', mt: 4 }}>
				<Button variant="outlined" onClick={() => setData(emptyData())} sx={{ minWidth: 150 }}>Clear All</Button>
			</Box>
		</ActivityShell>
	);
}
