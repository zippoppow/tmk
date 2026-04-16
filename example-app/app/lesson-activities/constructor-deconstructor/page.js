'use client';

import Image from 'next/image';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import ActivityShell from '../components/ActivityShell';
import { useLessonActivityProject } from '../components/useLessonActivityProject';

const FORM_NAME = 'constructor-deconstructor';
const DEFAULT_ACTIVITY_NAME = 'Constructor Deconstructor Activity';
const DEFAULT_ROW_COUNT = 5;
const MIN_ROW_COUNT = 1;
const MAX_ROW_COUNT = 20;

function emptyRow() {
	return { left: '', sum: '', right: '' };
}

function emptyData(rowCount = DEFAULT_ROW_COUNT) {
	return {
		morpheme: '',
		rowCount,
		constructorRows: Array.from({ length: rowCount }, () => emptyRow()),
		deconstructorRows: Array.from({ length: rowCount }, () => emptyRow()),
	};
}

function normalizeRows(rows, rowCount) {
	const source = Array.isArray(rows) ? rows : [];
	return Array.from({ length: rowCount }, (_, index) => {
		const row = source[index] || {};
		return {
			left: String(row.left || ''),
			sum: String(row.sum || ''),
			right: String(row.right || ''),
		};
	});
}

function clampRowCount(value) {
	const normalized = Number.isFinite(value) ? Math.floor(value) : DEFAULT_ROW_COUNT;
	return Math.max(MIN_ROW_COUNT, Math.min(MAX_ROW_COUNT, normalized));
}

function resizeRows(rows, rowCount) {
	const source = Array.isArray(rows) ? rows : [];
	if (source.length >= rowCount) {
		return source.slice(0, rowCount).map((row) => ({
			left: String(row.left || ''),
			sum: String(row.sum || ''),
			right: String(row.right || ''),
		}));
	}

	const nextRows = source.map((row) => ({
		left: String(row.left || ''),
		sum: String(row.sum || ''),
		right: String(row.right || ''),
	}));

	while (nextRows.length < rowCount) {
		nextRows.push(emptyRow());
	}

	return nextRows;
}

function normalizeInputData(rawData) {
	const source = rawData && typeof rawData === 'object' ? rawData : {};
	const computedRowCount = clampRowCount(
		Number(source.rowCount) || Math.max(source.constructorRows?.length || 0, source.deconstructorRows?.length || 0) || DEFAULT_ROW_COUNT
	);
	return {
		morpheme: String(source.morpheme || ''),
		rowCount: computedRowCount,
		constructorRows: normalizeRows(source.constructorRows, computedRowCount),
		deconstructorRows: normalizeRows(source.deconstructorRows, computedRowCount),
	};
}

function RowGrid({ rows, onChange, reverse = false }) {
	return (
		<Stack spacing={0.75}>
			{rows.map((row, index) => (
				<Box
					key={index}
					sx={{
						display: 'grid',
						gridTemplateColumns: reverse ? '4fr 1fr 6fr' : '6fr 1fr 4fr',
						gap: 1.5,
						alignItems: 'center',
					}}
				>
					<TextField
						value={row.left}
						onChange={(event) => onChange(index, 'left', event.target.value)}
						inputProps={{ style: { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.2rem', color: '#000000' } }}
						sx={{ '& .MuiOutlinedInput-root fieldset': { borderColor: '#4020A7', borderWidth: '2px' } }}
					/>
				<Image
					src="/lesson-activities/test-arrows.png"
					alt="Arrow"
					width={150}
					height={50}
					style={{ objectFit: 'contain' }}
					/>
					<TextField
						value={row.right}
						onChange={(event) => onChange(index, 'right', event.target.value)}
						inputProps={{ style: { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.2rem', color: '#000000' } }}
						sx={{ '& .MuiOutlinedInput-root fieldset': { borderColor: '#4020A7', borderWidth: '2px' } }}
					/>
				</Box>
			))}
		</Stack>
	);
}

export default function ConstructorDeconstructorPage() {
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

	const setConstructorValue = (index, field, value) => {
		setData((prev) => {
			const next = [...prev.constructorRows];
			next[index] = { ...next[index], [field]: value };
			return { ...prev, constructorRows: next };
		});
	};

	const setDeconstructorValue = (index, field, value) => {
		setData((prev) => {
			const next = [...prev.deconstructorRows];
			next[index] = { ...next[index], [field]: value };
			return { ...prev, deconstructorRows: next };
		});
	};

	const handleRowCountChange = (value) => {
		const parsed = Number(value);
		const nextCount = clampRowCount(parsed);
		setData((prev) => ({
			...prev,
			rowCount: nextCount,
			constructorRows: resizeRows(prev.constructorRows, nextCount),
			deconstructorRows: resizeRows(prev.deconstructorRows, nextCount),
		}));
	};

	const handleDownloadPdfCustom = () => {
		const escapeHtml = (value) => String(value || '').replace(/</g, '&lt;');

		const renderRows = (rows, reverse) =>
			rows
				.map((row) => {
					return `<div class="print-row ${reverse ? 'reverse' : 'forward'}">
						<div class="print-cell input-left">${escapeHtml(row.left)}</div>
						<div class="arrow-cell"><img src="${window.location.origin}/lesson-activities/test-arrows.png" alt="Arrow" /></div>
						<div class="print-cell input-right">${escapeHtml(row.right)}</div>
					</div>`;
				})
				.join('');

		const licenseFooter = authUser?.email
			? `<div class="license-footer">Licensed for use by: ${escapeHtml(authUser.email)}</div>`
			: '';

		const printWindow = window.open('', '', 'width=960,height=1200');
		printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
	 <title>${escapeHtml(activityName || DEFAULT_ACTIVITY_NAME)}</title>
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
    .section-title { font-weight: 800; font-size: 1.05em; text-transform: uppercase; margin: 20px 0 8px; }
		.rows { display: flex; flex-direction: column; gap: 8px; }
		.print-row { display: grid; align-items: center; gap: 10px; }
		.print-row.forward { grid-template-columns: 6fr 1fr 4fr; }
		.print-row.reverse { grid-template-columns: 4fr 1fr 6fr; }
		.print-cell { border: 2px solid #4020A7; padding: 10px; min-height: 44px; font-family: 'Courier New', monospace; }
		.arrow-cell { display: flex; justify-content: center; align-items: center; }
		.arrow-cell img { width: 100%; max-width: 110px; height: auto; object-fit: contain; }
    .license-footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e5e7eb; text-align: right; font-size: 0.8em; color: #4b5563; font-style: italic; }
    @media print { @page { size: letter portrait; margin: 0.4in; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-column">
      <div class="title">CONSTRUCTOR/DECONSTRUCTOR</div>
		 <div class="subtitle">Morpheme(s): <span class="morpheme-value">${escapeHtml(data.morpheme)}</span></div>
      <div class="instructions">Build words with constructor rows, then break them apart in deconstructor rows.</div>
    </div>
    <div class="header-column">
		 <img src="${window.location.origin}/branding/tmk_diy_logo.png" alt="The Morphology Kit" />
    </div>
  </div>
  <div class="section-title">Constructor</div>
	 <div class="rows">${renderRows(data.constructorRows, false)}</div>
  <div class="section-title">Deconstructor</div>
	 <div class="rows">${renderRows(data.deconstructorRows, true)}</div>
  ${licenseFooter}
</body>
</html>`);
		printWindow.document.close();
		printWindow.onload = () => setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
	};

	return (
		<ActivityShell
			title="CONSTRUCTOR/DECONSTRUCTOR"
			morpheme={data.morpheme}
			onMorphemeChange={(value) => setData((prev) => ({ ...prev, morpheme: value }))}
			instructions="Build words with constructor rows, then break them apart in deconstructor rows."
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
			<Box sx={{ mt: 2.5, alignItems: 'center' , display: 'flex', justifyContent: 'flex-end' }}>
				<Typography sx={{ fontSize: '1.1rem', color: '#011436', fontWeight: 600, paddingRight: 1}}>
					Add/Remove Rows:
				</Typography>
				<TextField
					label="Rows"
					type="number"
					value={data.rowCount || DEFAULT_ROW_COUNT}
					onChange={(event) => handleRowCountChange(event.target.value)}
					inputProps={{ min: MIN_ROW_COUNT, max: MAX_ROW_COUNT, step: 1, style: { textAlign: 'center' } }}
					sx={{ width: 140 }}
				/>
			</Box>

			<Box sx={{ mt: 3 }}>
				<Typography sx={{ fontWeight: 800, mb: 1.5, fontSize: '1.15rem', textTransform: 'uppercase' }}>Constructor</Typography>
				<RowGrid rows={data.constructorRows} onChange={setConstructorValue} />
			</Box>

			<Box sx={{ mt: 4 }}>
				<Typography sx={{ fontWeight: 800, mb: 1.5, fontSize: '1.15rem', textTransform: 'uppercase' }}>Deconstructor</Typography>
				<RowGrid rows={data.deconstructorRows} onChange={setDeconstructorValue} reverse />
			</Box>

			<Box sx={{ borderTop: '2px solid #eee', pt: 2.5, display: 'flex', justifyContent: 'center', mt: 4 }}>
				<Button variant="outlined" onClick={() => setData(emptyData(data.rowCount || DEFAULT_ROW_COUNT))} sx={{ minWidth: 150 }}>
					Clear All
				</Button>
			</Box>
		</ActivityShell>
	);
}
