'use client';

import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import ActivityShell from '../components/ActivityShell';
import { openPrintWindow } from '../components/openPrintWindow';
import { useLessonActivityProject } from '../components/useLessonActivityProject';
import { useClickDoubleClickSelection } from '../components/interactionUtils';

const FORM_NAME = 'morph-which';
const DEFAULT_ACTIVITY_NAME = 'Morph Which Activity';
const OPTION_STYLES = [
	{ bg: 'linear-gradient(90deg, #fff9db 0%, #fff4b8 100%)', shadow: '#c89f00' },
	{ bg: 'linear-gradient(90deg, #e8fff0 0%, #ccf5d1 100%)', shadow: '#2e7d32' },
	{ bg: 'linear-gradient(90deg, #f3e9ff 0%, #e6d4ff 100%)', shadow: '#6a1b9a' },
	{ bg: 'linear-gradient(90deg, #fff0e0 0%, #ffd2a8 100%)', shadow: '#ff6f00' },
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

	const handleClearQuestions = () => {
		setData((prev) => ({ ...prev, questions: Array.from({ length: 8 }, () => '') }));
	};

	const handleClearAnswers = () => {
		setData((prev) => ({
			...prev,
			choices: Array.from({ length: 8 }, () => emptyChoiceSet()),
			selectedChoices: Array.from({ length: 8 }, () => ''),
		}));
	};

	const handleDownloadPdfCustom = () => {
		const questionBlocks = data.questions.map((question, i) => {
			const selected = String(data.selectedChoices?.[i] || '');
			const options = ['a', 'b', 'c', 'd'].map((key, ki) => {
				const isSelected = selected === key;
				const style = OPTION_STYLES[ki];
				const boxShadow = isSelected
					? `inset 0 0 0 4px ${style.shadow}, 0 4px 12px ${style.shadow}40`
					: `inset 0 0 0 1px ${style.shadow}`;
				return `<div class="option" style="background:${style.bg};box-shadow:${boxShadow};">
					<span class="option-label">${String.fromCharCode(65 + ki)}.</span>
					<span>${(data.choices[i]?.[key] || '').replace(/</g, '&lt;')}</span>
				</div>`;
			}).join('');
			return `
			<div class="question-block">
				<div class="q-row">
					<span class="q-num">${i + 1}.</span>
					<span class="q-text">${(question || '').replace(/</g, '&lt;')}</span>
				</div>
				<div class="options">${options}</div>
			</div>`;
		}).join('');

		const licenseFooter = authUser?.email
			? `<div class="license-footer">Licensed for use by: ${authUser.email.replace(/</g, '&lt;')}</div>`
			: '';

		openPrintWindow({
			features: 'width=900,height=1200',
			html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${(activityName || DEFAULT_ACTIVITY_NAME).replace(/</g, '&lt;')}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; line-height: 1.4; }
    .header { border-bottom: 3px solid #4020A7; padding-bottom: 8px; display: grid; grid-template-columns: 3fr 1fr; gap: 10px; margin-bottom: 20px; }
    .header-column { display: flex; flex-direction: column; gap: 4px; }
    .header-column img { max-width: 180px; height: auto; }
    .title { font-size: 1.5em; font-weight: bold; letter-spacing: 1px; }
    .subtitle { font-size: 1.1em; font-style: italic; }
    .morpheme-value { font-family: 'Courier New', monospace; color: #4020A7; }
    .instructions { font-size: 0.95em; color: #555; margin-top: 4px; }
    .questions { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .question-block { padding: 10px; border: 1px solid #e0e0e0; border-radius: 4px; }
    .q-row { display: flex; gap: 8px; margin-bottom: 8px; }
    .q-num { font-weight: 700; min-width: 20px; }
    .q-text { font-family: 'Courier New', monospace; }
    .options { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .option { display: flex; gap: 6px; align-items: center; padding: 5px 8px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 0.9em; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .option-label { font-weight: 700; min-width: 16px; }
    .license-footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e5e7eb; text-align: right; font-size: 0.8em; color: #4b5563; font-style: italic; }
    @media print { @page { size: letter portrait; margin: 0.4in; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-column">
      <div class="title">MORPH, WHICH?</div>
      <div class="subtitle">Morpheme(s): <span class="morpheme-value">${(data.morpheme || '').replace(/</g, '&lt;')}</span></div>
      <div class="instructions">Write the focus prompt, then fill four option paths for each numbered item.</div>
    </div>
    <div class="header-column">
      <img src="/branding/tmk_diy_logo.png" alt="The Morphology Kit" />
    </div>
  </div>
  <div class="questions">${questionBlocks}</div>
  ${licenseFooter}
</body>
</html>`,
			onPopupBlocked: () => setNotice({ type: 'error', message: 'Allow pop-ups to print this activity.' }),
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
			handleDownloadPdf={handleDownloadPdfCustom}
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
								inputProps={{ style: { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.2rem', color: '#000000' } }}
								sx={{ '& .MuiInputBase-root::before': { borderBottom: '2px solid #ddd' } }}
							/>
							<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1 }}>
								{['a', 'b', 'c', 'd'].map((key, keyIndex) => {
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
											inputProps={{ style: { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.2rem', color: '#000000' } }}
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
								})}
							</Box>
						</Stack>
					</Box>
				))}
			</Stack>
		<Box sx={{ borderTop: '2px solid #eee', pt: 2.5, display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
			<Button variant="outlined" onClick={handleClearQuestions} sx={{ minWidth: 150 }}>Clear Questions</Button>
			<Button variant="outlined" onClick={handleClearAnswers} sx={{ minWidth: 150 }}>Clear Answers</Button>
			</Box>
		</ActivityShell>
	);
}
