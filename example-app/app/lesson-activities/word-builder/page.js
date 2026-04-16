'use client';

import { Box, Button, Grid, Stack, TextField, Typography } from '@mui/material';
import ActivityShell from '../components/ActivityShell';
import { openPrintWindow } from '../components/openPrintWindow';
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
		prefixes: prefixes.length > 0 ? prefixes.map((value) => String(value || '')) : Array.from({ length: 5 }, () => ''),
		bases: bases.length > 0 ? bases.map((value) => String(value || '')) : Array.from({ length: 2 }, () => ''),
		suffixes: suffixes.length > 0 ? suffixes.map((value) => String(value || '')) : Array.from({ length: 5 }, () => ''),
		builtWords: Array.from({ length: 15 }, (_, index) => String(builtWords[index] || '')),
	};
}

function ColumnList({ title, values, onChange, onAdd, onRemove, bg }) {
	return (
		<Stack spacing={1} sx={{ p: 1.5, borderRadius: 1, background: bg, border: '1px solid rgba(64,32,167,0.18)' }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
				<Typography sx={{ fontWeight: 700 }}>{title}</Typography>
				<Button size="small" variant="outlined" onClick={onAdd} sx={{ minWidth: 0, px: 1.25, py: 0.25 }}>
					+ Add
				</Button>
			</Box>
			{values.length === 0 ? (
				<Typography sx={{ fontSize: '0.88rem', color: '#666' }}>No items yet.</Typography>
			) : null}
			{values.map((value, index) => (
				<Box key={index} sx={{ px: 1, py: 0.25, borderRadius: 0.75, backgroundColor: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', gap: 1 }}>
					<TextField
						variant="standard"
						value={value}
						onChange={(event) => onChange(index, event.target.value)}
						fullWidth
						inputProps={{ style: { fontFamily: 'Courier New, monospace' } }}
					/>
					<Button
						type="button"
						onClick={() => onRemove(index)}
						size="small"
						sx={{ minWidth: 0, px: 1, color: '#b23a2f', borderColor: 'rgba(178,58,47,0.5)' }}
						variant="outlined"
						aria-label={`Remove ${title} item ${index + 1}`}
					>
						x
					</Button>
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

	const addListItem = (key) => {
		setData((prev) => ({
			...prev,
			[key]: [...prev[key], ''],
		}));
	};

	const removeListItem = (key, index) => {
		setData((prev) => ({
			...prev,
			[key]: prev[key].filter((_, itemIndex) => itemIndex !== index),
		}));
	};

	const handleDownloadPdfCustom = () => {
		const makeColItems = (arr) =>
			arr.length > 0
				? arr.map((v) => `<div class="col-item">${(v || '').replace(/</g, '&lt;')}</div>`).join('')
				: '<div class="col-item empty">—</div>';

		const builtWordCells = data.builtWords
			.map((v) => `<div class="built-cell">${(v || '').replace(/</g, '&lt;')}</div>`)
			.join('');

		const licenseFooter = authUser?.email
			? `<div class="license-footer">Licensed for use by: ${authUser.email.replace(/</g, '&lt;')}</div>`
			: '';

		openPrintWindow({
			features: 'width=1100,height=1400',
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
    .parts-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
	.col-box { padding: 10px; }
    .col-title { font-weight: 700; margin-bottom: 8px; font-size: 0.95em; }
    .col-item { border-bottom: 1px solid #e8e8e8; padding: 6px; font-family: 'Courier New', monospace; min-height: 30px; }
    .col-item.empty { color: #bbb; }
    .bin-title { font-weight: 700; margin-bottom: 8px; }
    .built-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .built-cell { border: 2px solid #4020A7; border-radius: 3px; padding: 8px; font-family: 'Courier New', monospace; text-align: center; min-height: 36px; }
    .license-footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e5e7eb; text-align: right; font-size: 0.8em; color: #4b5563; font-style: italic; }
    @media print { @page { size: letter portrait; margin: 0.4in; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-column">
      <div class="title">WORD BUILDER</div>
      <div class="subtitle">Morpheme(s): <span class="morpheme-value">${(data.morpheme || '').replace(/</g, '&lt;')}</span></div>
      <div class="instructions">Build words by combining prefixes, base elements, and suffixes.</div>
    </div>
    <div class="header-column">
      <img src="/branding/tmk_diy_logo.png" alt="The Morphology Kit" />
    </div>
  </div>
  <div class="parts-grid">
    <div class="col-box">
      <div class="col-title">Prefixes</div>
      ${makeColItems(data.prefixes)}
    </div>
    <div class="col-box">
      <div class="col-title">Base Elements</div>
      ${makeColItems(data.bases)}
    </div>
    <div class="col-box">
      <div class="col-title">Suffixes</div>
      ${makeColItems(data.suffixes)}
    </div>
  </div>
  <div class="bin-title">Words Bin</div>
  <div class="built-grid">${builtWordCells}</div>
  ${licenseFooter}
</body>
</html>`,
			onPopupBlocked: () => setNotice({ type: 'error', message: 'Allow pop-ups to print this activity.' }),
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
					<ColumnList
						title="Prefixes"
						values={data.prefixes}
						onChange={(index, value) => setList('prefixes', index, value)}
						onAdd={() => addListItem('prefixes')}
						onRemove={(index) => removeListItem('prefixes', index)}
						bg="linear-gradient(180deg,#e8f0ff,#f6f9ff)"
					/>
				</Grid>
				<Grid item xs={12} md={4}>
					<ColumnList
						title="Base Elements"
						values={data.bases}
						onChange={(index, value) => setList('bases', index, value)}
						onAdd={() => addListItem('bases')}
						onRemove={(index) => removeListItem('bases', index)}
						bg="linear-gradient(180deg,#fffce8,#fffef6)"
					/>
				</Grid>
				<Grid item xs={12} md={4}>
					<ColumnList
						title="Suffixes"
						values={data.suffixes}
						onChange={(index, value) => setList('suffixes', index, value)}
						onAdd={() => addListItem('suffixes')}
						onRemove={(index) => removeListItem('suffixes', index)}
						bg="linear-gradient(180deg,#eaffef,#f6fff8)"
					/>
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
						inputProps={{ style: { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.2rem', color: '#000000', textAlign: 'center' } }}
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
