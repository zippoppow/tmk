'use client';

import { Box, Button, Grid, IconButton, Stack, TextField, Typography } from '@mui/material';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import ActivityShell from '../components/ActivityShell';
import { openPrintWindow } from '../components/openPrintWindow';
import { useLessonActivityProject } from '../components/useLessonActivityProject';
import { ActivityDndProvider, DropZone } from '../components/shared';

const FORM_NAME = 'common-base-word';
const DEFAULT_ACTIVITY_NAME = 'Common Base Word Activity';

function emptyData() {
	return {
		morpheme: '',
		grid: Array.from({ length: 9 }, () => ''),
		groups: Array.from({ length: 3 }, () => []),
	};
}

function normalizeInputData(rawData) {
	const source = rawData && typeof rawData === 'object' ? rawData : {};
	const gridSource = Array.isArray(source.grid) ? source.grid : [];
	const groupsSource = Array.isArray(source.groups) ? source.groups : [];

	return {
		morpheme: String(source.morpheme || ''),
		grid: Array.from({ length: 9 }, (_, index) => String(gridSource[index] || '')),
		groups: Array.from({ length: 3 }, (_, index) => {
			const g = groupsSource[index];
			if (Array.isArray(g)) return g.map(String).filter(Boolean);
			if (typeof g === 'string' && g.trim()) return g.split('\n').filter(Boolean);
			return [];
		}),
	};
}

function DragHandle({ id, data, label, disabled = false }) {
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id, data, disabled });

	return (
		<Box
			ref={setNodeRef}
			component="button"
			type="button"
			aria-label={label}
			{...attributes}
			{...listeners}
			sx={{
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
				flexShrink: 0,
				width: 28,
				height: 28,
				border: '1px dashed #667eea',
				borderRadius: 1,
				backgroundColor: isDragging ? 'rgba(102, 126, 234, 0.10)' : '#f9faff',
				color: '#4020A7',
				fontSize: '0.9rem',
				lineHeight: 1,
				cursor: disabled ? 'default' : isDragging ? 'grabbing' : 'grab',
				userSelect: 'none',
				touchAction: disabled ? 'auto' : 'none',
				opacity: disabled ? 0.45 : isDragging ? 0.75 : 1,
				transform: CSS.Translate.toString(transform),
				transition: 'opacity 120ms ease, transform 120ms ease, background-color 120ms ease',
			}}
		>
			::
		</Box>
	);
}

export default function CommonBaseWordPage() {
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
		handleSave,
		handleSaveAndReturn,
		handleGoToLessonProjects,
		handleAddToProject,
    isAddToProjectDialogOpen,
    availableLessonProjects,
    selectedProjectIdsForAdd,
    setSelectedProjectIdsForAdd,
    handleCloseAddToProjectDialog,
    handleConfirmAddToProjects,
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

	const addWordToGroup = (groupIndex, word) => {
		const trimmed = String(word || '').trim();
		if (!trimmed) return;
		setData((prev) => {
			const nextGroups = prev.groups.map((g) => [...g]);
			nextGroups[groupIndex] = [...nextGroups[groupIndex], trimmed];
			return { ...prev, groups: nextGroups };
		});
	};

	const removeWordFromGroup = (groupIndex, wordIndex) => {
		setData((prev) => {
			const nextGroups = prev.groups.map((g) => [...g]);
			nextGroups[groupIndex].splice(wordIndex, 1);
			return { ...prev, groups: nextGroups };
		});
	};

	const moveGridWordToGroup = (groupIndex, payload) => {
		if (!payload?.value || typeof payload.gridIndex !== 'number') return;
		setData((prev) => {
			const sourceValue = String(prev.grid[payload.gridIndex] || '').trim();
			if (!sourceValue) return prev;
			const nextGrid = [...prev.grid];
			nextGrid[payload.gridIndex] = '';
			const nextGroups = prev.groups.map((g) => [...g]);
			nextGroups[groupIndex] = [...nextGroups[groupIndex], sourceValue];
			return { ...prev, grid: nextGrid, groups: nextGroups };
		});
	};

	const moveGroupWordToGrid = (gridIndex, payload) => {
		if (!payload?.value || typeof payload.groupIndex !== 'number' || typeof payload.wordIndex !== 'number') return;
		setData((prev) => {
			if (String(prev.grid[gridIndex] || '').trim()) return prev;
			const sourceValue = String(prev.groups[payload.groupIndex]?.[payload.wordIndex] || '').trim();
			if (!sourceValue) return prev;
			const nextGrid = [...prev.grid];
			nextGrid[gridIndex] = sourceValue;
			const nextGroups = prev.groups.map((g) => [...g]);
			nextGroups[payload.groupIndex].splice(payload.wordIndex, 1);
			return { ...prev, grid: nextGrid, groups: nextGroups };
		});
	};

	const handleDragEnd = (event) => {
		const payload = event?.active?.data?.current;
		const dropTarget = event?.over?.data?.current;
		if (!payload || !dropTarget) return;

		if (payload.sourceType === 'grid' && dropTarget.targetType === 'group') {
			moveGridWordToGroup(dropTarget.groupIndex, payload);
			return;
		}

		if (payload.sourceType === 'group-word' && dropTarget.targetType === 'grid-cell') {
			moveGroupWordToGrid(dropTarget.gridIndex, payload);
		}
	};

	const handleClearWordGrid = () => {
		setData((prev) => ({ ...prev, grid: Array.from({ length: 9 }, () => '') }));
	};

	const handleClearSortingBoxes = () => {
		setData((prev) => ({ ...prev, groups: Array.from({ length: 3 }, () => []) }));
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
				<div class="group-content">${(Array.isArray(group) ? group : []).map((w) => (w || '').replace(/</g, '&lt;')).join('<br/>')}</div>
			</div>`,
			)
			.join('');

		const licenseFooter = authUser?.email
			? `<div class="license-footer">Licensed for use to: ${authUser.email.replace(/</g, '&lt;')}</div>`
			: '';

		openPrintWindow({
			features: 'width=960,height=1200',
			html: `<!DOCTYPE html>
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
    .group-content { font-family: 'Courier New', monospace; font-size: 0.95em; }
    .license-footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e5e7eb; text-align: right; font-size: 0.8em; color: #4b5563; font-style: italic; }
    @media print { @page { size: letter portrait; margin: 0.4in; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-column">
      <div class="title">COMMON BASE WORD</div>
      <div class="subtitle">Morpheme(s): <span class="morpheme-value">${(data.morpheme || '').replace(/</g, '&lt;')}</span></div>
      <div class="instructions">Sort the word into three different columns based on their word families.</div>
    </div>
    <div class="header-column">
      <img src="/branding/tmk_diy_logo_templates.png" alt="The Morphology Kit" />
    </div>
  </div>
  <div class="word-grid">${gridCells}</div>
  <div class="sort-label">Sort the words into 3 different columns based on a shared base word.</div>
  <div class="groups">${groupBoxes}</div>
  ${licenseFooter}
</body>
</html>`,
			onPopupBlocked: () => setNotice({ type: 'error', message: 'Allow pop-ups to print this activity.' }),
		});
	};

	return (
		<ActivityShell
			title="COMMON BASE WORD"
			morpheme={data.morpheme}
			onMorphemeChange={(value) => setData((prev) => ({ ...prev, morpheme: value }))}
			instructions="Sort the word into three different columns based on their word families"
			authUser={authUser}
			authLoading={authLoading}
			authFromSuccessRedirect={authFromSuccessRedirect}
			runAuthCheck={runAuthCheck}
			handleLoginLogout={handleLoginLogout}
			handleSave={handleSave}
			handleGoToLessonProjects={handleGoToLessonProjects}
			handleAddToProject={handleAddToProject}
        isAddToProjectDialogOpen={isAddToProjectDialogOpen}
        availableLessonProjects={availableLessonProjects}
        selectedProjectIdsForAdd={selectedProjectIdsForAdd}
        setSelectedProjectIdsForAdd={setSelectedProjectIdsForAdd}
        handleCloseAddToProjectDialog={handleCloseAddToProjectDialog}
        handleConfirmAddToProjects={handleConfirmAddToProjects}
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
			<ActivityDndProvider onDragEnd={handleDragEnd}>
				{/* Top word grid */}
				<Box sx={{ my: 3 }}>
					{Array.from({ length: 3 }, (_, rowIndex) => (
						<Box key={rowIndex} sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, mb: 1.5 }}>
							{Array.from({ length: 3 }, (_, colIndex) => {
								const index = rowIndex * 3 + colIndex;
								const cellValue = data.grid[index] || '';
								return (
									<DropZone
										key={index}
										id={`grid-drop-${index}`}
										data={{ targetType: 'grid-cell', gridIndex: index }}
										minHeight={56}
										sx={{ p: 0.5, borderRadius: 1 }}
										inactiveSx={{ borderColor: 'transparent' }}
										activeSx={{ borderColor: '#667eea', backgroundColor: 'rgba(102, 126, 234, 0.06)' }}
									>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
											<TextField
												value={cellValue}
												onChange={(event) => setGridValue(index, event.target.value)}
												size="small"
												inputProps={{ style: { textAlign: 'center', fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.2rem', color: '#000000' } }}
												sx={{
													flex: 1,
													'& .MuiOutlinedInput-root': {
														'& fieldset': { borderColor: '#4020A7', borderWidth: '2px', borderRadius: '4px' },
														'&:hover fieldset': { borderColor: '#667eea' },
														'&.Mui-focused fieldset': { borderColor: '#667eea' },
													},
												}}
											/>
											{String(cellValue).trim() ? (
												<DragHandle
													id={`grid-${index}-${cellValue}`}
													label={`Drag grid item ${index + 1}`}
													data={{
														sourceType: 'grid',
														gridIndex: index,
														value: String(cellValue).trim(),
													}}
												/>
											) : null}
										</Box>
									</DropZone>
								);
							})}
						</Box>
					))}
				</Box>

				<Box sx={{ textAlign: 'center', fontSize: '1.05rem', color: '#555', mb: 3 }}>
					Sort the words into 3 different columns based on a shared base word.
				</Box>

				{/* Group boxes */}
				<Typography sx={{ fontWeight: 700, mb: 1.5 }}>Common Base Word Groups</Typography>
				<Grid container spacing={2}>
					{data.groups.map((group, groupIndex) => (
						<Grid item xs={12} md={4} key={`group-${groupIndex}`}>
							<DropZone
								id={`group-drop-${groupIndex}`}
								data={{ targetType: 'group', groupIndex }}
								minHeight={200}
								sx={{ p: 1.25, borderRadius: 1, display: 'flex', flexDirection: 'column', gap: 1 }}
								inactiveSx={{ borderColor: '#4a4a4a', borderStyle: 'solid', backgroundColor: '#fafafa' }}
								activeSx={{ borderColor: '#667eea', backgroundColor: 'rgba(102, 126, 234, 0.06)' }}
							>
								<Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#555', mb: 0.5 }}>
									Group {groupIndex + 1}
								</Typography>

								<Stack spacing={0.75} sx={{ flex: 1 }}>
									{group.map((word, wordIndex) => (
										<Box
											key={`${groupIndex}-${wordIndex}-${word}`}
											sx={{
												display: 'flex',
												alignItems: 'center',
												gap: 0.75,
												px: 1,
												py: 0.5,
												borderRadius: 1,
												backgroundColor: '#f0f0f8',
												border: '1px solid #d5d5e5',
											}}
										>
											<DragHandle
												id={`group-word-${groupIndex}-${wordIndex}-${word}`}
												label={`Drag ${word} from group ${groupIndex + 1}`}
												data={{
													sourceType: 'group-word',
													groupIndex,
													wordIndex,
													value: String(word).trim(),
												}}
											/>
											<Typography
												sx={{
													flex: 1,
													fontFamily: 'Trebuchet MS, sans-serif',
													fontSize: '1.1rem',
													color: '#222',
												}}
											>
												{word}
											</Typography>
											<IconButton
												size="small"
												onPointerDown={(event) => event.stopPropagation()}
												onClick={() => removeWordFromGroup(groupIndex, wordIndex)}
												sx={{ color: '#999', fontSize: '1rem', p: 0.25 }}
											>
												×
											</IconButton>
										</Box>
									))}
								</Stack>
							</DropZone>
						</Grid>
					))}
				</Grid>

				<Box sx={{ borderTop: '2px solid #eee', pt: 2.5, display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap', mt: 4 }}>
					<Button variant="outlined" onClick={handleClearWordGrid} sx={{ minWidth: 180 }}>
						Clear the Word Grid
					</Button>
					<Button variant="outlined" onClick={handleClearSortingBoxes} sx={{ minWidth: 190 }}>
						Clear the Sorting Boxes
					</Button>
				</Box>
			</ActivityDndProvider>
		</ActivityShell>
	);
}
