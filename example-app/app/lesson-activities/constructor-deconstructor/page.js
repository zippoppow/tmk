'use client';

import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import ActivityShell from '../components/ActivityShell';
import { useLessonActivityProject } from '../components/useLessonActivityProject';

const FORM_NAME = 'constructor-deconstructor';
const DEFAULT_ACTIVITY_NAME = 'Constructor Deconstructor Activity';

function emptyRow() {
	return { left: '', sum: '', right: '' };
}

function emptyData() {
	return {
		morpheme: '',
		constructorRows: Array.from({ length: 4 }, () => emptyRow()),
		deconstructorRows: Array.from({ length: 4 }, () => emptyRow()),
	};
}

function normalizeRows(rows) {
	const source = Array.isArray(rows) ? rows : [];
	return Array.from({ length: 4 }, (_, index) => {
		const row = source[index] || {};
		return {
			left: String(row.left || ''),
			sum: String(row.sum || ''),
			right: String(row.right || ''),
		};
	});
}

function normalizeInputData(rawData) {
	const source = rawData && typeof rawData === 'object' ? rawData : {};
	return {
		morpheme: String(source.morpheme || ''),
		constructorRows: normalizeRows(source.constructorRows),
		deconstructorRows: normalizeRows(source.deconstructorRows),
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
						gridTemplateColumns: reverse ? '6fr 1fr 4fr' : '4fr 1fr 6fr',
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
					<TextField
						value={row.sum}
						onChange={(event) => onChange(index, 'sum', event.target.value)}
						inputProps={{ style: { textAlign: 'center', fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.2rem', color: '#000000' } }}
						sx={{ '& .MuiOutlinedInput-root fieldset': { borderColor: '#4020A7', borderWidth: '2px' } }}
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

	const handleDownloadPdfCustom = () => {
		const renderRows = (rows, reverse) =>
			rows
				.map((row) => {
					const [c1, c2, c3] = reverse
						? [row.left, row.sum, row.right]
						: [row.left, row.sum, row.right];
					return `<tr>
						<td class="cell">${(c1 || '').replace(/</g, '&lt;')}</td>
						<td class="cell center">${(c2 || '').replace(/</g, '&lt;')}</td>
						<td class="cell">${(c3 || '').replace(/</g, '&lt;')}</td>
					</tr>`;
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
    .section-title { font-weight: 800; font-size: 1.05em; text-transform: uppercase; margin: 20px 0 8px; }
    table { width: 100%; border-collapse: collapse; }
    .cell { border: 2px solid #4020A7; padding: 10px; font-family: 'Courier New', monospace; min-height: 44px; width: 44%; }
    .cell.center { width: 12%; text-align: center; border-color: #4020A7; }
    .license-footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e5e7eb; text-align: right; font-size: 0.8em; color: #4b5563; font-style: italic; }
    @media print { @page { size: letter portrait; margin: 0.4in; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-column">
      <div class="title">CONSTRUCTOR/DECONSTRUCTOR</div>
      <div class="subtitle">Morpheme(s): <span class="morpheme-value">${(data.morpheme || '').replace(/</g, '&lt;')}</span></div>
      <div class="instructions">Build words with constructor rows, then break them apart in deconstructor rows.</div>
    </div>
    <div class="header-column">
      <img src="https://uploads.teachablecdn.com/attachments/fbdb7d04f47642b38193261d6b2e3101.png" alt="The Morphology Kit" />
    </div>
  </div>
  <div class="section-title">Constructor</div>
  <table><tbody>${renderRows(data.constructorRows, false)}</tbody></table>
  <div class="section-title">Deconstructor</div>
  <table><tbody>${renderRows(data.deconstructorRows, true)}</tbody></table>
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
			<Box sx={{ mt: 3 }}>
				<Typography sx={{ fontWeight: 800, mb: 1.5, fontSize: '1.15rem', textTransform: 'uppercase' }}>Constructor</Typography>
				<RowGrid rows={data.constructorRows} onChange={setConstructorValue} />
			</Box>

			<Box sx={{ mt: 4 }}>
				<Typography sx={{ fontWeight: 800, mb: 1.5, fontSize: '1.15rem', textTransform: 'uppercase' }}>Deconstructor</Typography>
				<RowGrid rows={data.deconstructorRows} onChange={setDeconstructorValue} reverse />
			</Box>

			<Box sx={{ borderTop: '2px solid #eee', pt: 2.5, display: 'flex', justifyContent: 'center', mt: 4 }}>
				<Button variant="outlined" onClick={() => setData(emptyData())} sx={{ minWidth: 150 }}>
					Clear All
				</Button>
			</Box>
		</ActivityShell>
	);
}
