'use client';

import { useRef } from 'react';
import { Box, Button, Menu, MenuItem, Stack, TextField, Typography } from '@mui/material';
import ActivityShell from '../components/ActivityShell';
import { openPrintWindow } from '../components/openPrintWindow';
import { useLessonActivityProject } from '../components/useLessonActivityProject';
import { useContextActionMenu } from '../components/interactionUtils';

const FORM_NAME = 'morph-morph-match';
const DEFAULT_ACTIVITY_NAME = 'Morph Morph Match Activity';

function emptyPair() {
	return { left: '', right: '' };
}

function emptyHeaders() {
	return { leftTitle: '', leftSub1: '', leftSub2: '', rightTitle: '', rightSub1: '', rightSub2: '' };
}

function emptyData() {
	return {
		morpheme: '',
		grid: Array.from({ length: 24 }, () => ''),
		sectionHeaders: emptyHeaders(),
		pairs: Array.from({ length: 12 }, () => emptyPair()),
	};
}

function normalizeInputData(rawData) {
	const source = rawData && typeof rawData === 'object' ? rawData : {};
	const grid = Array.isArray(source.grid) ? source.grid : [];
	const pairs = Array.isArray(source.pairs) ? source.pairs : [];
	const sh = source.sectionHeaders && typeof source.sectionHeaders === 'object' ? source.sectionHeaders : {};
	return {
		morpheme: String(source.morpheme || ''),
		grid: Array.from({ length: 24 }, (_, index) => String(grid[index] || '')),
		sectionHeaders: {
			leftTitle: String(sh.leftTitle || ''),
			leftSub1: String(sh.leftSub1 || ''),
			leftSub2: String(sh.leftSub2 || ''),
			rightTitle: String(sh.rightTitle || ''),
			rightSub1: String(sh.rightSub1 || ''),
			rightSub2: String(sh.rightSub2 || ''),
		},
		pairs: Array.from({ length: 12 }, (_, index) => {
			const pair = pairs[index] || {};
			return { left: String(pair.left || ''), right: String(pair.right || '') };
		}),
	};
}

export default function MorphMorphMatchPage() {
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

	const setGridValue = (index, value) => {
		setData((prev) => {
			const next = [...prev.grid];
			next[index] = value;
			return { ...prev, grid: next };
		});
	};

	const setPairValue = (index, field, value) => {
		setData((prev) => {
			const next = [...prev.pairs];
			next[index] = { ...next[index], [field]: value };
			return { ...prev, pairs: next };
		});
	};

	const setSectionHeader = (field, value) => {
		setData((prev) => ({ ...prev, sectionHeaders: { ...prev.sectionHeaders, [field]: value } }));
	};

	const { menuState: gridMenu, openMenu: openGridMenu, closeMenu: closeGridMenu } = useContextActionMenu();

	const pairLeftRefs = useRef([]);

	const handleSyncGridToPair = (pairIndex) => {
		const gridValue = data.grid[gridMenu.index];
		if (gridValue) {
			setPairValue(pairIndex, 'left', gridValue);
		}
		closeGridMenu();
		if (pairLeftRefs.current[pairIndex]) {
			pairLeftRefs.current[pairIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
			pairLeftRefs.current[pairIndex].focus();
		}
	};

	const handleClearTopSection = () => {
		setData((prev) => ({ ...prev, grid: Array.from({ length: 24 }, () => '') }));
	};

	const handleClearSectionHeaders = () => {
		setData((prev) => ({ ...prev, sectionHeaders: emptyHeaders() }));
	};

	const handleClearLowerSection = () => {
		setData((prev) => ({ ...prev, pairs: Array.from({ length: 12 }, () => emptyPair()) }));
	};

	const handleDownloadPdfCustom = () => {
		const sh = data.sectionHeaders || {};
		const gridCells = data.grid
			.map((v) => `<div class="grid-cell">${(v || '').replace(/</g, '&lt;')}</div>`)
			.join('');

		const pairRows = data.pairs.map((pair, i) => `
			<div class="pair-row">
				<span class="pair-num">${i + 1}.</span>
				<div class="pair-left">${(pair.left || '').replace(/</g, '&lt;')}</div>
				<div class="pair-right">${(pair.right || '').replace(/</g, '&lt;')}</div>
			</div>`).join('');

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
		body { font-family: 'Trebuchet MS', sans-serif; padding: 12px; line-height: 1.2; color: #000; }
		.header { border-bottom: 3px solid #4020A7; padding-bottom: 6px; display: grid; grid-template-columns: 3fr 1fr; gap: 8px; margin-bottom: 10px; break-inside: avoid; page-break-inside: avoid; }
    .header-column { display: flex; flex-direction: column; gap: 4px; }
		.header-column img { max-width: 120px; height: auto; }
		.title { font-size: 1.22em; font-weight: 700; letter-spacing: 0.4px; line-height: 1.15; }
		.subtitle { font-size: 0.95em; font-style: italic; line-height: 1.15; }
    .morpheme-value { font-family: 'Courier New', monospace; color: #4020A7; }
		.instructions { font-size: 0.78em; color: #555; margin-top: 2px; }
		.top-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 5px; margin-bottom: 10px; break-inside: avoid; page-break-inside: avoid; }
		.grid-cell { border: 2px solid #4020A7; border-radius: 3px; padding: 4px; text-align: center; font-family: 'Trebuchet MS', sans-serif; min-height: 40px; font-size: 1em; }
		.section-divider { border-top: 2px solid #eee; margin: 8px 0; padding-top: 8px; }
		.section-headers { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 8px; }
    .sh-col { display: flex; flex-direction: column; gap: 3px; }
		.sh-title { font-weight: 700; font-size: 0.92em; text-align: center; }
		.sh-subs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; align-items: center; }
		.sh-sub { font-size: 0.78em; color: #555; text-align: center; }
		.pairs { display: flex; flex-direction: column; gap: 2px; break-inside: avoid; page-break-inside: avoid; }
		.pair-row { display: grid; grid-template-columns: 20px 1fr 1fr; gap: 8px; align-items: center; border-bottom: 1px solid #eee; padding: 3px 0; }
    .pair-num { font-weight: 700; text-align: right; color: #555; font-size: 0.85em; }
		.pair-left, .pair-right { font-family: 'Trebuchet MS', sans-serif; padding: 2px 4px; min-height: 22px; border-bottom: 1px solid #ddd; font-size: 0.86em; }
		.license-footer { margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb; text-align: right; font-size: 0.72em; color: #4b5563; font-style: italic; }
		@media print {
			@page { size: letter portrait; margin: 0.25in; }
			body { padding: 0; }
		}
  </style>
</head>
<body>
  <div class="header">
    <div class="header-column">
      <div class="title">MORPH, MORPH? MATCH</div>
      <div class="subtitle">Morpheme(s): <span class="morpheme-value">${(data.morpheme || '').replace(/</g, '&lt;')}</span></div>
      <div class="instructions">Use the top grid to explore morph forms, then pair related morph words below.</div>
    </div>
    <div class="header-column">
      <img src="/branding/tmk_diy_logo.png" alt="The Morphology Kit" />
    </div>
  </div>
  <div class="top-grid">${gridCells}</div>
  <div class="section-divider">
    <div class="section-headers">
      <div class="sh-col">
        <div class="sh-title">${(sh.leftTitle || '').replace(/</g, '&lt;')}</div>
				<div class="sh-subs">
					<div class="sh-sub">${(sh.leftSub1 || '').replace(/</g, '&lt;')}</div>
					<div class="sh-sub">${(sh.leftSub2 || '').replace(/</g, '&lt;')}</div>
				</div>
      </div>
      <div class="sh-col">
        <div class="sh-title">${(sh.rightTitle || '').replace(/</g, '&lt;')}</div>
				<div class="sh-subs">
					<div class="sh-sub">${(sh.rightSub1 || '').replace(/</g, '&lt;')}</div>
					<div class="sh-sub">${(sh.rightSub2 || '').replace(/</g, '&lt;')}</div>
				</div>
      </div>
    </div>
    <div class="pairs">${pairRows}</div>
  </div>
  ${licenseFooter}
</body>
</html>`,
			onPopupBlocked: () => setNotice({ type: 'error', message: 'Allow pop-ups to print this activity.' }),
		});
	};

	return (
		<ActivityShell
			title="MORPH, MORPH? MATCH"
			morpheme={data.morpheme}
			onMorphemeChange={(value) => setData((prev) => ({ ...prev, morpheme: value }))}
			instructions="Use the top grid to explore morph forms, then pair related morph words below."
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
			<Box sx={{ my: 3 }}>
				{Array.from({ length: 4 }, (_, rowIndex) => (
					<Box key={rowIndex} sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1.25, mb: 1.25 }}>
						{Array.from({ length: 6 }, (_, colIndex) => {
							const index = rowIndex * 6 + colIndex;
							return (
								<TextField
									key={index}
									value={data.grid[index] || ''}
									onChange={(event) => setGridValue(index, event.target.value)}
									onContextMenu={(event) => openGridMenu(event, { targetType: 'grid', index })}
									size="small"
								inputProps={{ style: { textAlign: 'center', fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.2rem', color: '#000000' } }}
									sx={{
										'& .MuiOutlinedInput-root': {
											'& fieldset': { borderColor: '#4020A7', borderWidth: '2px' },
											'&:hover fieldset': { borderColor: '#667eea' },
											'&.Mui-focused fieldset': { borderColor: '#667eea' },
										},
									}}
								/>
							);
						})}
					</Box>
				))}
				<Box sx={{ pt: 1 }}>
					<Button variant="outlined" size="small" onClick={handleClearTopSection}>
						Clear Top Section
					</Button>
				</Box>
			</Box>

			<Box sx={{ borderTop: '2px solid #eee', pt: 3, mt: 2 }}>
				<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 2 }}>
					<Stack spacing={1}>
						<TextField
							variant="standard"
							placeholder="Left column title"
							value={data.sectionHeaders.leftTitle}
							onChange={(e) => setSectionHeader('leftTitle', e.target.value)}
							inputProps={{ style: { textAlign: 'center', fontFamily: 'Trebuchet MS, sans-serif', fontWeight: 700, fontSize: '1.2rem', color: '#000000' } }}
							sx={{ '& .MuiInputBase-root::before': { borderBottom: '2px solid #4020A7' } }}
						/>
						<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
							<TextField
								variant="standard"
								placeholder="Sub-header 1"
								value={data.sectionHeaders.leftSub1}
								onChange={(e) => setSectionHeader('leftSub1', e.target.value)}
								inputProps={{ style: { textAlign: 'center', fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.2rem', color: '#000000' } }}
								sx={{ '& .MuiInputBase-root::before': { borderBottom: '2px solid #ddd' } }}
							/>
							<TextField
								variant="standard"
								placeholder="Sub-header 2"
								value={data.sectionHeaders.leftSub2}
								onChange={(e) => setSectionHeader('leftSub2', e.target.value)}
								inputProps={{ style: { textAlign: 'center', fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.2rem', color: '#000000' } }}
								sx={{ '& .MuiInputBase-root::before': { borderBottom: '2px solid #ddd' } }}
							/>
						</Box>
					</Stack>
					<Stack spacing={1}>
						<TextField
							variant="standard"
							placeholder="Right column title"
							value={data.sectionHeaders.rightTitle}
							onChange={(e) => setSectionHeader('rightTitle', e.target.value)}
							inputProps={{ style: { textAlign: 'center', fontFamily: 'Trebuchet MS, sans-serif', fontWeight: 700, fontSize: '1.2rem', color: '#000000' } }}
							sx={{ '& .MuiInputBase-root::before': { borderBottom: '2px solid #4020A7' } }}
						/>
						<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
							<TextField
								variant="standard"
								placeholder="Sub-header 1"
								value={data.sectionHeaders.rightSub1}
								onChange={(e) => setSectionHeader('rightSub1', e.target.value)}
								inputProps={{ style: { textAlign: 'center', fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.2rem', color: '#000000' } }}
								sx={{ '& .MuiInputBase-root::before': { borderBottom: '2px solid #ddd' } }}
							/>
							<TextField
								variant="standard"
								placeholder="Sub-header 2"
								value={data.sectionHeaders.rightSub2}
								onChange={(e) => setSectionHeader('rightSub2', e.target.value)}
								inputProps={{ style: { textAlign: 'center', fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.2rem', color: '#000000' } }}
								sx={{ '& .MuiInputBase-root::before': { borderBottom: '2px solid #ddd' } }}
							/>
						</Box>
					</Stack>
				</Box>

			<Stack spacing={1.25}>
				{data.pairs.map((pair, index) => (
					<Box key={index} sx={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr', gap: 1.5, alignItems: 'center' }}>
						<Typography sx={{ fontWeight: 700 }}>{index + 1}.</Typography>
						<TextField
							variant="standard"
							value={pair.left}
							onChange={(event) => setPairValue(index, 'left', event.target.value)}
							inputRef={(el) => { pairLeftRefs.current[index] = el; }}
							inputProps={{ style: { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.2rem', color: '#000000' } }}
							sx={{ '& .MuiInputBase-root::before': { borderBottom: '2px solid #ddd' } }}
						/>
						<TextField
							variant="standard"
							value={pair.right}
							onChange={(event) => setPairValue(index, 'right', event.target.value)}
							inputProps={{ style: { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.2rem', color: '#000000' } }}
							sx={{ '& .MuiInputBase-root::before': { borderBottom: '2px solid #ddd' } }}
						/>
					</Box>
				))}
			</Stack>
				<Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
					<Button variant="outlined" size="small" onClick={handleClearSectionHeaders}>
						Clear Section Headers
					</Button>
					<Button variant="outlined" size="small" onClick={handleClearLowerSection}>
						Clear Lower Section
					</Button>
				</Box>
			</Box>

			<Menu
				open={gridMenu.open}
				onClose={closeGridMenu}
				anchorReference="anchorPosition"
				anchorPosition={gridMenu.open ? { top: gridMenu.y, left: gridMenu.x } : undefined}
			>
				{data.pairs.map((_, pairIndex) => (
					<MenuItem key={pairIndex} onClick={() => handleSyncGridToPair(pairIndex)}>
						Item {pairIndex + 1}
					</MenuItem>
				))}
			</Menu>
		</ActivityShell>
	);
}
