'use client';

import { Box, Button, Menu, MenuItem, Stack, TextField } from '@mui/material';
import ActivityShell from '../components/ActivityShell';
import { useLessonActivityProject } from '../components/useLessonActivityProject';
import { useContextActionMenu } from '../components/interactionUtils';

const FORM_NAME = 'morph-match-related-words';
const DEFAULT_ACTIVITY_NAME = 'Morph Match Related Words Activity';
const ROW_COUNT = 10;

const FOCUS_COLORS = ['#ffe4e1', '#e1f7ff', '#dcffe7', '#fffbe1', '#e1e1ff', '#ffe1fa', '#b9efc0', '#f1e1ff', '#f0ffe0', '#ffeecf'];

function emptyData() {
	return {
		morpheme: '',
		focusWords: Array.from({ length: ROW_COUNT }, () => ''),
		relatedWords: Array.from({ length: ROW_COUNT }, () => ''),
		relatedWordColors: Array.from({ length: ROW_COUNT }, () => ''),
	};
}

function normalizeInputData(rawData) {
	const source = rawData && typeof rawData === 'object' ? rawData : {};
	const focusWords = Array.isArray(source.focusWords) ? source.focusWords : [];
	const relatedWords = Array.isArray(source.relatedWords) ? source.relatedWords : [];
	const relatedWordColors = Array.isArray(source.relatedWordColors) ? source.relatedWordColors : [];
	return {
		morpheme: String(source.morpheme || ''),
		focusWords: Array.from({ length: ROW_COUNT }, (_, index) => String(focusWords[index] || '')),
		relatedWords: Array.from({ length: ROW_COUNT }, (_, index) => String(relatedWords[index] || '')),
		relatedWordColors: Array.from({ length: ROW_COUNT }, (_, index) => String(relatedWordColors[index] || '')),
	};
}

export default function MorphMatchRelatedWordsPage() {
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

	const { menuState: focusMenu, openMenu: openFocusMenu, closeMenu: closeFocusMenu } = useContextActionMenu();

	const handleSetRelatedColor = (relatedIndex) => {
		setData((prev) => {
			const next = [...prev.relatedWordColors];
			next[relatedIndex] = FOCUS_COLORS[focusMenu.index];
			return { ...prev, relatedWordColors: next };
		});
		closeFocusMenu();
	};

	const handleClearRelatedColor = (relatedIndex) => {
		setData((prev) => {
			const next = [...prev.relatedWordColors];
			next[relatedIndex] = '';
			return { ...prev, relatedWordColors: next };
		});
	};

	const handleClearFocusWords = () => {
		setData((prev) => ({ ...prev, focusWords: Array.from({ length: ROW_COUNT }, () => '') }));
	};

	const handleClearRelatedWords = () => {
		setData((prev) => ({ ...prev, relatedWords: Array.from({ length: ROW_COUNT }, () => '') }));
	};

	const handleDownloadPdfCustom = () => {
		const FOCUS_COLORS_HEX = FOCUS_COLORS;

		const focusRows = data.focusWords
			.map((word, i) => `<div class="word-cell" style="background-color:${FOCUS_COLORS_HEX[i]}">${(word || '').replace(/</g, '&lt;')}</div>`)
			.join('');

		const relatedRows = data.relatedWords
			.map((word, i) => {
				const bg = data.relatedWordColors[i] || '#ffffff';
				return `<div class="word-cell" style="background-color:${bg}">${(word || '').replace(/</g, '&lt;')}</div>`;
			})
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
    .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
    .col-title { font-weight: 700; font-size: 0.95em; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; }
    .col { display: flex; flex-direction: column; gap: 8px; }
		.word-cell {
			border-bottom: 2px solid #ddd;
			padding: 8px 10px;
			font-family: 'Courier New', monospace;
			min-height: 47.88px;
			border-radius: 3px;
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}
    .license-footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e5e7eb; text-align: right; font-size: 0.8em; color: #4b5563; font-style: italic; }
		@media print {
			@page { size: letter portrait; margin: 0.4in; }
			body {
				padding: 0;
				-webkit-print-color-adjust: exact;
				print-color-adjust: exact;
			}
		}
  </style>
</head>
<body>
  <div class="header">
    <div class="header-column">
      <div class="title">MORPH MATCH — RELATED WORDS</div>
      <div class="subtitle">Morpheme(s): <span class="morpheme-value">${(data.morpheme || '').replace(/</g, '&lt;')}</span></div>
      <div class="instructions">Match focus words with related words that share morph connections.</div>
    </div>
    <div class="header-column">
      <img src="/branding/tmk_diy_logo.png" alt="The Morphology Kit" />
    </div>
  </div>
  <div class="cols">
    <div>
      <div class="col-title">Focus Words</div>
      <div class="col">${focusRows}</div>
    </div>
    <div>
      <div class="col-title">Related Words</div>
      <div class="col">${relatedRows}</div>
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
			title="MORPH MATCH -- RELATED WORDS"
			morpheme={data.morpheme}
			onMorphemeChange={(value) => setData((prev) => ({ ...prev, morpheme: value }))}
			instructions="Match focus words with related words that share morph connections."
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
			<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4, mt: 3 }}>
				<Stack spacing={1.8}>
					{data.focusWords.map((value, index) => (
						<TextField
							key={`focus-${index}`}
							variant="standard"
							value={value}
							onChange={(event) => setListValue('focusWords', index, event.target.value)}
							onContextMenu={(event) => openFocusMenu(event, { targetType: 'focusWord', index })}
							inputProps={{ style: { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.2rem', color: '#000000', width: '90%' } }}
							sx={{ backgroundColor: FOCUS_COLORS[index], borderRadius: 0.5, px: 1, '& .MuiInputBase-root::before': { borderBottom: '2px solid #ddd' } }}
						/>
					))}
					<Box sx={{ pt: 1 }}>
						<Button variant="outlined" size="small" onClick={handleClearFocusWords}>
							Clear Focus Words
						</Button>
					</Box>
				</Stack>
				<Stack spacing={1.8}>
					{data.relatedWords.map((value, index) => (
						<TextField
							key={`related-${index}`}
							variant="standard"
							value={value}
							onChange={(event) => setListValue('relatedWords', index, event.target.value)}
							onDoubleClick={() => handleClearRelatedColor(index)}
							inputProps={{ style: { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.2rem', color: '#000000', width: '90%' } }}
							sx={{ backgroundColor: data.relatedWordColors[index] || 'transparent', borderRadius: 0.5, px: 1, '& .MuiInputBase-root::before': { borderBottom: '2px solid #ddd' } }}
						/>
					))}
					<Box sx={{ pt: 1 }}>
						<Button variant="outlined" size="small" onClick={handleClearRelatedWords}>
							Clear Related Words
						</Button>
					</Box>
				</Stack>
			</Box>

			<Menu
				open={focusMenu.open}
				onClose={closeFocusMenu}
				anchorReference="anchorPosition"
				anchorPosition={focusMenu.open ? { top: focusMenu.y, left: focusMenu.x } : undefined}
			>
				{data.relatedWords.map((_, relatedIndex) => (
					<MenuItem key={relatedIndex} onClick={() => handleSetRelatedColor(relatedIndex)}>
						Set color for Related Word {relatedIndex + 1}
					</MenuItem>
				))}
			</Menu>
		</ActivityShell>
	);
}
