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

	const handleDownloadPdfCustom = () => {
		const rows = Array.from({ length: 12 }, (_, i) => `
			<div class="cell">${(data.promptWords[i] || '').replace(/</g, '&lt;')}</div>
			<div class="cell">${(data.algoPhrases[i] || '').replace(/</g, '&lt;')}</div>
			<div class="cell">${(data.answerMeanings[i] || '').replace(/</g, '&lt;')}</div>
		`).join('');

		const licenseFooter = authUser?.email
			? `<div class="license-footer">Licensed for use by: ${authUser.email.replace(/</g, '&lt;')}</div>`
			: '';

		const printWindow = window.open('', '', 'width=1100,height=1400');
		printWindow.document.write(`<!DOCTYPE html>
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
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); }
    .col-header { font-weight: 700; font-size: 0.9em; text-transform: uppercase; border: 2px solid #4020A7; padding: 8px; background: #f0ecff; text-align: center; }
    .cell { border: 1px solid #ccc; border-top: none; padding: 8px; font-family: 'Courier New', monospace; min-height: 36px; }
    .license-footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e5e7eb; text-align: right; font-size: 0.8em; color: #4b5563; font-style: italic; }
    @media print { @page { size: letter landscape; margin: 0.4in; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-column">
      <div class="title">WORD MEANING</div>
      <div class="subtitle">Morpheme(s): <span class="morpheme-value">${(data.morpheme || '').replace(/</g, '&lt;')}</span></div>
      <div class="instructions">Interpret each prompt word using the morph clues and write the meaning.</div>
    </div>
    <div class="header-column">
      <img src="https://uploads.teachablecdn.com/attachments/fbdb7d04f47642b38193261d6b2e3101.png" alt="The Morphology Kit" />
    </div>
  </div>
  <div class="grid">
    <div class="col-header">Prompt Words</div>
    <div class="col-header">Algo Phrase</div>
    <div class="col-header">Word Meaning</div>
    ${rows}
  </div>
  ${licenseFooter}
</body>
</html>`);
		printWindow.document.close();
		printWindow.onload = () => setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
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
