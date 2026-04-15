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
		standaloneActivityId,
		handleSaveStandalone,
		handleDeleteStandalone,
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

	const handleDownloadPdfCustom = () => {
		const wordListItems = data.morphWords
			.map((w) => `<div class="word-chip">${(w || '').replace(/</g, '&lt;')}</div>`)
			.join('');

		const licenseFooter = authUser?.email
			? `<div class="license-footer">Licensed for use by: ${authUser.email.replace(/</g, '&lt;')}</div>`
			: '';

		const printWindow = window.open('', '', 'width=960,height=1200');
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
    .layout { display: grid; grid-template-columns: 3fr 9fr; gap: 24px; }
    .col-title { font-weight: 700; font-size: 0.9em; text-transform: uppercase; margin-bottom: 8px; }
    .word-list { display: flex; flex-direction: column; gap: 6px; }
    .word-chip { background: #f7f7f7; border-radius: 4px; padding: 8px 10px; font-family: 'Courier New', monospace; }
    .paragraph-box { border: 2px solid #4020A7; border-radius: 4px; padding: 14px; font-family: 'Courier New', monospace; min-height: 320px; white-space: pre-wrap; font-size: 0.95em; line-height: 1.6; }
    .license-footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e5e7eb; text-align: right; font-size: 0.8em; color: #4b5563; font-style: italic; }
    @media print { @page { size: letter portrait; margin: 0.4in; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-column">
      <div class="title">FILL IN THE MORPH — PARAGRAPHS</div>
      <div class="subtitle">Morpheme(s): <span class="morpheme-value">${(data.morpheme || '').replace(/</g, '&lt;')}</span></div>
      <div class="instructions">Complete each morph pair, then write or annotate the paragraph.</div>
    </div>
    <div class="header-column">
      <img src="/branding/tmk_diy_logo.png" alt="The Morphology Kit" />
    </div>
  </div>
  <div class="layout">
    <div>
      <div class="col-title">Morph Words</div>
      <div class="word-list">${wordListItems}</div>
    </div>
    <div>
      <div class="col-title">Paragraph</div>
      <div class="paragraph-box">${(data.paragraph || '').replace(/</g, '&lt;').replace(/\n/g, '<br/>')}</div>
    </div>
  </div>
  ${licenseFooter}
</body>
</html>`);
		printWindow.document.close();
		printWindow.onload = () => setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
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
			<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '3fr 9fr' }, gap: 4, mt: 3 }}>
				<Stack spacing={1.25}>
					<Box sx={{ display: 'flex', gap: 1 }}>
						<TextField
							variant="standard"
							fullWidth
							value={data.newWord}
							onChange={(event) => setData((prev) => ({ ...prev, newWord: event.target.value }))}
							placeholder="Add a word..."
							inputProps={{ style: { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.2rem', color: '#000000' } }}
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
