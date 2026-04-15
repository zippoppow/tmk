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
		standaloneActivityId,
		handleSaveStandalone,
		handleDeleteStandalone,
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

	const handleClearWords = () => {
		setData((prev) => ({
			...prev,
			words: Array.from({ length: 8 }, () => ''),
		}));
	};

	const handleClearNumbers = () => {
		setData((prev) => ({
			...prev,
			numbers: Array.from({ length: 8 }, () => ''),
		}));
	};

	const handleClearDefinitions = () => {
		setData((prev) => ({
			...prev,
			definitions: Array.from({ length: 8 }, () => ''),
		}));
	};

	const handleDownloadPdfCustom = () => {
		const wordsRows = data.words
			.map(
				(word, i) => `
				<div class="item-inputs-container">
					<input class="morph-word-input" value="${(word || '').replace(/"/g, '&quot;')}" readonly />
					<input class="morph-number-input" value="${(data.numbers[i] || '').replace(/"/g, '&quot;')}" readonly />
				</div>`,
			)
			.join('');

		const definitionRows = data.definitions
			.map(
				(def, i) => `
				<div class="definitions-item">
					<span class="definitions-number">${i + 1}.</span>
					<textarea class="definitions-input" readonly>${(def || '').replace(/</g, '&lt;')}</textarea>
				</div>`,
			)
			.join('');

		const activityTitle = activityName || DEFAULT_ACTIVITY_NAME;

		const printWindow = window.open('', '', 'width=960,height=1200');
		printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${activityTitle}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; line-height: 1.4; }
    .header {
      border-bottom: 3px solid #4020A7;
      padding-bottom: 8px;
      display: grid;
      grid-template-columns: 3fr 1fr;
      gap: 10px;
      margin-bottom: 16px;
    }
    .header-column { display: flex; flex-direction: column; gap: 4px; }
    .header-column img { max-width: 180px; height: auto; }
    .title { font-size: 1.5em; font-weight: bold; letter-spacing: 1px; }
    .subtitle { font-size: 1.1em; font-style: italic; }
    .morpheme-value { font-family: 'Courier New', monospace; color: #4020A7; font-size: 1.1em; }
    .instructions { font-size: 0.95em; color: #555; margin-top: 4px; }
    .content {
      display: grid;
      grid-template-columns: 4fr 8fr;
      gap: 32px;
      margin-top: 12px;
    }
    .column { display: flex; flex-direction: column; gap: 12px; }
    .column-label { font-size: 1.1em; font-style: italic; margin-bottom: 4px; }
    .item-inputs-container { display: flex; gap: 8px; }
    .morph-word-input {
      border: none;
      border-bottom: 2px solid #ddd;
      padding: 4px 0;
      font-size: 1em;
      font-family: 'Courier New', monospace;
      background: transparent;
      width: 78%;
    }
    .morph-number-input {
      border: 1px solid #ddd;
      padding: 4px;
      font-weight: bold;
      font-size: 1em;
      font-family: 'Courier New', monospace;
      background: transparent;
      width: 20%;
      text-align: center;
    }
    .definitions-item { display: flex; align-items: flex-start; gap: 8px; }
    .definitions-number { min-width: 24px; font-weight: bold; font-size: 1em; flex-shrink: 0; padding-top: 4px; }
    .definitions-input {
      border: none;
      border-bottom: 2px solid #ddd;
      padding: 4px 0;
      font-size: 1em;
      font-family: 'Courier New', monospace;
      background: transparent;
      width: 100%;
      resize: none;
      height: 2.4em;
    }
    .license-footer {
      margin-top: 24px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
      text-align: right;
      font-size: 0.8em;
      color: #4b5563;
      font-style: italic;
    }
    @media print {
      @page { size: letter landscape; margin: 0.4in; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-column">
      <div class="title">MORPH MATCH -- DEFINITIONS</div>
      <div class="subtitle">Morpheme(s): <span class="morpheme-value">${(data.morpheme || '').replace(/</g, '&lt;')}</span></div>
      <div class="instructions">Match each morph-based word to the correct numbered definition.</div>
    </div>
    <div class="header-column">
      <img src="/branding/tmk_diy_logo.png" alt="The Morphology Kit" />
    </div>
  </div>
  <div class="content">
    <div class="column">
      <div class="column-label">Morpheme Words</div>
      ${wordsRows}
    </div>
    <div class="column">
      <div class="column-label">Definitions</div>
      ${definitionRows}
    </div>
  </div>
  ${authUser?.email ? `<div class="license-footer">Licensed for use by: ${authUser.email.replace(/</g, '&lt;')}</div>` : ''}
</body>
</html>`);
		printWindow.document.close();
		printWindow.onload = () => {
			setTimeout(() => {
				printWindow.print();
				printWindow.close();
			}, 250);
		};
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
				<Grid item xs={12}>
					<Stack spacing={1.5}>
						{data.words.map((word, index) => (
							<Box
								key={index}
								sx={{
									display: 'grid',
									gridTemplateColumns: { xs: '1fr', md: '3fr 1.2fr 7fr' },
									gap: 1,
									alignItems: 'end',
								}}
							>
								<TextField
									variant="standard"
									value={word}
									onChange={(event) => setListValue('words', index, event.target.value)}
									inputProps={{ style: { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.2rem', color: '#000000' } }}
									sx={{ '& .MuiInputBase-root::before': { borderBottom: '2px solid #ddd' } }}
								/>
								<TextField
									value={data.numbers[index] || ''}
									onChange={(event) => setListValue('numbers', index, event.target.value)}
									inputProps={{ style: { textAlign: 'center', fontWeight: 700, fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.2rem', color: '#000000'  } }}
									sx={{ '& .MuiOutlinedInput-root fieldset': { borderColor: '#ddd', borderWidth: '1px' } }}
								/>
								<Box sx={{ display: 'grid', gridTemplateColumns: '32px 1fr', gap: 1, alignItems: 'end' }}>
									<Typography sx={{ fontWeight: 700, pb: 1 }}>{index + 1}.</Typography>
									<TextField
										variant="standard"
										multiline
										minRows={2}
										maxRows={2}
										value={data.definitions[index] || ''}
										onChange={(event) => setListValue('definitions', index, event.target.value)}
										inputProps={{ style: { minHeight: '1em', maxHeight: '2.5em', fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.2rem', color: '#000000' } }}
										sx={{ '& .MuiInputBase-root::before': { borderBottom: '2px solid #ddd' } }}
									/>
								</Box>
							</Box>
						))}
					</Stack>
				</Grid>
				<Grid item xs={12}>
					<Box sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-start' }, gap: 1.25, flexWrap: 'wrap', pt: 1 }}>
						<Button variant="outlined" onClick={handleClearWords} sx={{ minWidth: 140 }}>
							Clear Words
						</Button>
						<Button variant="outlined" onClick={handleClearNumbers} sx={{ minWidth: 150 }}>
							Clear Numbers
						</Button>
						<Button variant="outlined" onClick={handleClearDefinitions} sx={{ minWidth: 170 }}>
							Clear Definitions
						</Button>
					</Box>
				</Grid>
			</Grid>
		</ActivityShell>
	);
}
