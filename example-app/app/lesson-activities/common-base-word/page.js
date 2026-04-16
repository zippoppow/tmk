'use client';

import { useState } from 'react';
import { Box, Button, Grid, Stack, TextField, Typography, Menu, MenuItem } from '@mui/material';
import ActivityShell from '../components/ActivityShell';
import { useLessonActivityProject } from '../components/useLessonActivityProject';

const FORM_NAME = 'common-base-word';
const DEFAULT_ACTIVITY_NAME = 'Common Base Word Activity';

function emptyData() {
	return {
		morpheme: '',
		grid: Array.from({ length: 9 }, () => ''),
		groups: Array.from({ length: 3 }, () => ''),
	};
}

function normalizeInputData(rawData) {
	const source = rawData && typeof rawData === 'object' ? rawData : {};
	const gridSource = Array.isArray(source.grid) ? source.grid : [];
	const groupsSource = Array.isArray(source.groups) ? source.groups : [];

	return {
		morpheme: String(source.morpheme || ''),
		grid: Array.from({ length: 9 }, (_, index) => String(gridSource[index] || '')),
		groups: Array.from({ length: 3 }, (_, index) => String(groupsSource[index] || '')),
	};
}

export default function CommonBaseWordPage() {
	const [contextMenu, setContextMenu] = useState({ open: false, x: 0, y: 0, gridIndex: -1 });

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

	const setGroupValue = (index, value) => {
		setData((prev) => {
			const next = [...prev.groups];
			next[index] = value;
			return { ...prev, groups: next };
		});
	};

	const openGroupMenu = (event, gridIndex) => {
		event.stopPropagation();
		const word = data.grid[gridIndex];
		if (!word || !word.trim()) return;
		setContextMenu({
			open: true,
			x: event.clientX,
			y: event.clientY,
			gridIndex,
		});
	};

	const closeGroupMenu = () => {
		setContextMenu({ open: false, x: 0, y: 0, gridIndex: -1 });
	};

	const addWordToGroup = (groupIndex) => {
		if (contextMenu.gridIndex < 0) return;
		const word = data.grid[contextMenu.gridIndex];
		if (!word || !word.trim()) {
			closeGroupMenu();
			return;
		}

		setData((prev) => {
			const currentValue = prev.groups[groupIndex].trim();
			const newValue = currentValue ? `${currentValue}\n${word}` : word;
			const nextGroups = [...prev.groups];
			nextGroups[groupIndex] = newValue;
			return {
				...prev,
				groups: nextGroups,
			};
		});
		closeGroupMenu();
	};

	const handleClearWordGrid = () => {
		setData((prev) => ({
			...prev,
			grid: Array.from({ length: 9 }, () => ''),
		}));
	};

	const handleClearSortingBoxes = () => {
		setData((prev) => ({
			...prev,
			groups: Array.from({ length: 3 }, () => ''),
		}));
	};

	const handleDownloadPdfCustom = () => {
		const gridCells = data.grid
			.map((val) => `<div class="grid-cell">${(val || '').replace(/</g, '&lt;')}</div>`)
			.join('');

		const groupBoxes = data.groups
			.map(
				(group, i) => `
			<div class="group-box">
				<div class="group-label">Group ${i + 1}</div>
				<div class="group-content">${(group || '').replace(/</g, '&lt;').replace(/\n/g, '<br/>')}</div>
			</div>`,
			)
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
    .header { border-bottom: 3px solid #4020A7; padding-bottom: 8px; display: grid; grid-template-columns: 3fr 1fr; gap: 10px; margin-bottom: 16px; }
    .header-column { display: flex; flex-direction: column; gap: 4px; }
    .header-column img { max-width: 180px; height: auto; }
    .title { font-size: 1.5em; font-weight: bold; letter-spacing: 1px; }
    .subtitle { font-size: 1.1em; font-style: italic; }
    .morpheme-value { font-family: 'Courier New', monospace; color: #4020A7; font-size: 1.1em; }
    .instructions { font-size: 0.95em; color: #555; margin-top: 4px; }
    .word-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
    .grid-cell { border: 2px solid #4020A7; border-radius: 4px; padding: 10px; text-align: center; font-family: 'Courier New', monospace; min-height: 42px; }
    .sort-label { font-size: 0.9em; color: #555; text-align: center; margin-bottom: 10px; }
    .groups { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .group-box { border: 2px solid #4a4a4a; border-radius: 4px; padding: 10px; min-height: 180px; }
    .group-label { font-weight: bold; margin-bottom: 8px; }
    .group-content { font-family: 'Courier New', monospace; font-size: 0.95em; white-space: pre-wrap; }
    .license-footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e5e7eb; text-align: right; font-size: 0.8em; color: #4b5563; font-style: italic; }
    @media print { @page { size: letter portrait; margin: 0.4in; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-column">
      <div class="title">COMMON BASE WORD</div>
      <div class="subtitle">Morpheme(s): <span class="morpheme-value">${(data.morpheme || '').replace(/</g, '&lt;')}</span></div>
      <div class="instructions">Use the morpheme to build and sort related common base words.</div>
    </div>
    <div class="header-column">
      <img src="/branding/tmk_diy_logo.png" alt="The Morphology Kit" />
    </div>
  </div>
  <div class="word-grid">${gridCells}</div>
  <div class="sort-label">Sort the words into 3 different columns based on a shared base word.</div>
  <div class="groups">${groupBoxes}</div>
  ${licenseFooter}
</body>
</html>`);
		printWindow.document.close();
		printWindow.onload = () => setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
	};

	return (
		<ActivityShell
			title="COMMON BASE WORD"
			morpheme={data.morpheme}
			onMorphemeChange={(value) => setData((prev) => ({ ...prev, morpheme: value }))}
			instructions="Use the morpheme to build and sort related common base words."
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
				{Array.from({ length: 3 }, (_, rowIndex) => (
					<Box key={rowIndex} sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, mb: 1.5 }}>
						{Array.from({ length: 3 }, (_, colIndex) => {
							const index = rowIndex * 3 + colIndex;
							return (
								<TextField
									key={index}
									value={data.grid[index] || ''}
									onChange={(event) => setGridValue(index, event.target.value)}
									onContextMenu={(event) => openGroupMenu(event, index)}
									size="small"
									inputProps={{ style: { textAlign: 'center', fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.2rem', color: '#000000' } }}
									sx={{
										'& .MuiOutlinedInput-root': {
											'& fieldset': { borderColor: '#4020A7', borderWidth: '2px', borderRadius: '4px' },
											'&:hover fieldset': { borderColor: '#667eea' },
											'&.Mui-focused fieldset': { borderColor: '#667eea' },
										},
									}}
								/>
							);
						})}
					</Box>
				))}
			</Box>

			<Box sx={{ textAlign: 'center', fontSize: '1.05rem', color: '#555', mb: 3 }}>
				Sort the words into 3 different columns based on a shared base word.
			</Box>

			<Typography sx={{ fontWeight: 700, mb: 1.5 }}>Common Base Word Groups</Typography>
			<Grid container spacing={2}>
				{data.groups.map((group, index) => (
					<Grid item xs={12} md={4} key={`group-${index}`}>
						<Stack spacing={1}>
							<Box sx={{ border: '2px solid #4a4a4a', borderRadius: 1, minHeight: 200, p: 1.25, backgroundColor: '#fafafa' }}>
								<TextField
									multiline
									minRows={8}
									fullWidth
									value={group}
									onChange={(event) => setGroupValue(index, event.target.value)}
									placeholder="List related words..."
									variant="standard"
									InputProps={{ disableUnderline: true }}
									inputProps={{ style: { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.2rem' } }}
								/>
							</Box>
						</Stack>
					</Grid>
				))}
			</Grid>
			<Menu
				open={contextMenu.open}
				onClose={closeGroupMenu}
				anchorPosition={{ top: contextMenu.y, left: contextMenu.x }}
				anchorReference="anchorPosition"
			>
				<MenuItem onClick={() => addWordToGroup(0)}>Add to Column 1</MenuItem>
				<MenuItem onClick={() => addWordToGroup(1)}>Add to Column 2</MenuItem>
				<MenuItem onClick={() => addWordToGroup(2)}>Add to Column 3</MenuItem>
			</Menu>

			<Box sx={{ borderTop: '2px solid #eee', pt: 2.5, display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap', mt: 4 }}>
				<Button variant="outlined" onClick={handleClearWordGrid} sx={{ minWidth: 180 }}>
					Clear the Word Grid
				</Button>
				<Button variant="outlined" onClick={handleClearSortingBoxes} sx={{ minWidth: 190 }}>
					Clear the Sorting Boxes
				</Button>
			</Box>
		</ActivityShell>
	);
}
