'use client';

import { useState } from 'react';
import { Box, Button, IconButton, TextField, Typography } from '@mui/material';
import ActivityShell from '../components/ActivityShell';
import { openPrintWindow } from '../components/openPrintWindow';
import { useLessonActivityProject } from '../components/useLessonActivityProject';

const FORM_NAME = 'part-of-speech';
const DEFAULT_ACTIVITY_NAME = 'Part Of Speech Activity';
const CATEGORY_ORDER = ['adjective', 'noun', 'verb', 'adverb'];
const CATEGORY_LABELS = {
	adjective: 'Adjective',
	noun: 'Noun',
	verb: 'Verb',
	adverb: 'Adverb',
};
const SORT_GRID_CATEGORIES = ['noun', 'verb', 'adverb'];
const ADJECTIVE_CATEGORY = 'adjective';

function emptyData() {
	return {
		morpheme: '',
		grid: Array.from({ length: 12 }, () => ''),
		sortBoxes: {
			adjective: [],
			noun: [],
			verb: [],
			adverb: [],
		},
	};
}

function normalizeInputData(rawData) {
	const source = rawData && typeof rawData === 'object' ? rawData : {};
	const grid = Array.isArray(source.grid) ? source.grid : [];
	const sortBoxes = source.sortBoxes && typeof source.sortBoxes === 'object' ? source.sortBoxes : {};

	return {
		morpheme: String(source.morpheme || ''),
		grid: Array.from({ length: 12 }, (_, index) => String(grid[index] || '')),
		sortBoxes: {
			adjective: Array.isArray(sortBoxes.adjective) ? sortBoxes.adjective.map(String) : [],
			noun: Array.isArray(sortBoxes.noun) ? sortBoxes.noun.map(String) : [],
			verb: Array.isArray(sortBoxes.verb) ? sortBoxes.verb.map(String) : [],
			adverb: Array.isArray(sortBoxes.adverb) ? sortBoxes.adverb.map(String) : [],
		},
	};
}

function cloneSortBoxes(sortBoxes) {
	return {
		adjective: [...sortBoxes.adjective],
		noun: [...sortBoxes.noun],
		verb: [...sortBoxes.verb],
		adverb: [...sortBoxes.adverb],
	};
}

export default function PartOfSpeechPage() {
	const [dragOverTarget, setDragOverTarget] = useState(null);

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
			const nextGrid = [...prev.grid];
			nextGrid[index] = value;
			return { ...prev, grid: nextGrid };
		});
	};

	const removeSortItem = (category, itemIndex) => {
		setData((prev) => {
			const nextSortBoxes = cloneSortBoxes(prev.sortBoxes);
			nextSortBoxes[category].splice(itemIndex, 1);
			return { ...prev, sortBoxes: nextSortBoxes };
		});
	};

	const parseDragPayload = (event) => {
		const raw = event.dataTransfer.getData('text/plain');
		if (!raw) return null;

		try {
			return JSON.parse(raw);
		} catch {
			return null;
		}
	};

	const handleGridDragStart = (event, gridIndex) => {
		const value = String(data.grid[gridIndex] || '').trim();
		if (!value) {
			event.preventDefault();
			return;
		}

		event.dataTransfer.effectAllowed = 'move';
		event.dataTransfer.setData('text/plain', JSON.stringify({ sourceType: 'grid', gridIndex, value }));
	};

	const handleSortItemDragStart = (event, category, itemIndex) => {
		const value = String(data.sortBoxes[category][itemIndex] || '').trim();
		if (!value) {
			event.preventDefault();
			return;
		}

		event.dataTransfer.effectAllowed = 'move';
		event.dataTransfer.setData('text/plain', JSON.stringify({ sourceType: 'sort', category, itemIndex, value }));
	};

	const moveToSortBox = (targetCategory, payload) => {
		if (!payload?.value) return;

		setData((prev) => {
			const nextGrid = [...prev.grid];
			const nextSortBoxes = cloneSortBoxes(prev.sortBoxes);

			if (payload.sourceType === 'grid') {
				nextGrid[payload.gridIndex] = '';
			}

			if (payload.sourceType === 'sort') {
				nextSortBoxes[payload.category].splice(payload.itemIndex, 1);
			}

			nextSortBoxes[targetCategory].push(payload.value);

			return {
				...prev,
				grid: nextGrid,
				sortBoxes: nextSortBoxes,
			};
		});
	};

	const moveToGrid = (targetGridIndex, payload) => {
		if (!payload?.value) return;

		setData((prev) => {
			if (String(prev.grid[targetGridIndex] || '').trim()) {
				return prev;
			}

			const nextGrid = [...prev.grid];
			const nextSortBoxes = cloneSortBoxes(prev.sortBoxes);
			nextGrid[targetGridIndex] = payload.value;

			if (payload.sourceType === 'sort') {
				nextSortBoxes[payload.category].splice(payload.itemIndex, 1);
			}

			return {
				...prev,
				grid: nextGrid,
				sortBoxes: nextSortBoxes,
			};
		});
	};

	const handleClearWordGrid = () => {
		setData((prev) => ({ ...prev, grid: Array.from({ length: 12 }, () => '') }));
	};

	const renderSortBox = (category, minHeight = 260) => {
		const isDragOver = dragOverTarget?.type === 'box' && dragOverTarget.category === category;

		return (
			<Box>
				<Typography sx={{ fontWeight: 700, mb: 1 }}>{CATEGORY_LABELS[category]}</Typography>
				<Box
					onDragOver={(event) => {
						event.preventDefault();
						setDragOverTarget({ type: 'box', category });
					}}
					onDragLeave={() => setDragOverTarget((prev) => (prev?.type === 'box' && prev.category === category ? null : prev))}
					onDrop={(event) => {
						event.preventDefault();
						setDragOverTarget(null);
						moveToSortBox(category, parseDragPayload(event));
					}}
					sx={{
						border: '2px solid #4020A7',
						borderColor: isDragOver ? '#667eea' : '#4020A7',
						borderRadius: 1,
						minHeight,
						p: 1.25,
						display: 'flex',
						flexDirection: 'column',
						gap: 1,
						backgroundColor: isDragOver ? 'rgba(102, 126, 234, 0.08)' : '#fff',
					}}
				>
					{data.sortBoxes[category].length === 0 ? <Box sx={{ minHeight: 32 }} /> : null}

					{data.sortBoxes[category].map((item, itemIndex) => (
						<Box
							key={`${category}-${itemIndex}-${item}`}
							draggable
							onDragStart={(event) => handleSortItemDragStart(event, category, itemIndex)}
							sx={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								gap: 1,
								px: 1.25,
								py: 0.75,
								borderRadius: 1,
								background: 'linear-gradient(180deg, #ffffff, #f5f5fb)',
								border: '1px solid #d5d5e5',
								cursor: 'grab',
							}}
						>
							<Typography sx={{ fontFamily: 'Courier New, monospace' }}>{item}</Typography>
							<IconButton size="small" onClick={() => removeSortItem(category, itemIndex)} sx={{ color: '#777', fontSize: '1rem' }}>
								×
							</IconButton>
						</Box>
					))}
				</Box>
			</Box>
		);
	};

	const handleDownloadPdfCustom = () => {
		const gridCells = data.grid
			.map((v) => `<div class="grid-cell">${(v || '').replace(/</g, '&lt;')}</div>`)
			.join('');

		const gridSections = SORT_GRID_CATEGORIES.map((cat) => {
			const items = (data.sortBoxes[cat] || [])
				.map((item) => `<div class="sort-item">${(item || '').replace(/</g, '&lt;')}</div>`)
				.join('');
			return `<div class="sort-box-section">
				<div class="sort-label">${CATEGORY_LABELS[cat]}</div>
				<div class="sort-box">${items}</div>
			</div>`;
		}).join('');

		const adjectiveItems = (data.sortBoxes[ADJECTIVE_CATEGORY] || [])
			.map((item) => `<div class="sort-item">${(item || '').replace(/</g, '&lt;')}</div>`)
			.join('');

		const adjectiveSection = `<div class="sort-box-section">
			<div class="sort-label">${CATEGORY_LABELS[ADJECTIVE_CATEGORY]}</div>
			<div class="sort-box">${adjectiveItems}</div>
		</div>`;

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
	.word-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
    .grid-cell { border: 2px solid #4020A7; border-radius: 4px; padding: 10px; text-align: center; font-family: 'Courier New', monospace; min-height: 42px; }
	.sort-layout { display: grid; grid-template-columns: 3fr 1fr; gap: 16px; }
	.sort-boxes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .sort-box-section { display: flex; flex-direction: column; gap: 6px; }
    .sort-label { font-weight: 700; font-size: 0.95em; text-transform: uppercase; }
	.sort-box { border: 2px solid #4020A7; border-radius: 4px; min-height: 160px; padding: 8px; display: flex; flex-direction: column; gap: 6px; }
    .sort-item { padding: 6px 8px; background: #f5f5fb; border: 1px solid #d5d5e5; border-radius: 3px; font-family: 'Courier New', monospace; }
    .license-footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e5e7eb; text-align: right; font-size: 0.8em; color: #4b5563; font-style: italic; }
    @media print { @page { size: letter landscape; margin: 0.4in; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-column">
      <div class="title">PART OF SPEECH SORT</div>
      <div class="subtitle">Morpheme(s): <span class="morpheme-value">${(data.morpheme || '').replace(/</g, '&lt;')}</span></div>
      <div class="instructions">Drag words from the grid into the correct part-of-speech boxes.</div>
    </div>
    <div class="header-column">
      <img src="/branding/tmk_diy_logo.png" alt="The Morphology Kit" />
    </div>
  </div>
  <div class="word-grid">${gridCells}</div>
	<div class="sort-layout">
		<div class="sort-boxes">${gridSections}</div>
		${adjectiveSection}
	</div>
  ${licenseFooter}
</body>
</html>`,
			onPopupBlocked: () => setNotice({ type: 'error', message: 'Allow pop-ups to print this activity.' }),
		});
	};

	return (
		<ActivityShell
			title="PART OF SPEECH SORT"
			morpheme={data.morpheme}
			onMorphemeChange={(value) => setData((prev) => ({ ...prev, morpheme: value }))}
			instructions="Drag words from the grid into the correct part-of-speech boxes, or drag sorted items back into empty grid cells."
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
			<Box sx={{ my: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.25 }}>
				{data.grid.map((value, index) => {
					const isDragOver = dragOverTarget?.type === 'grid' && dragOverTarget.index === index;

					return (
						<TextField
							key={index}
							value={value || ''}
							onChange={(event) => setGridValue(index, event.target.value)}
							onDragStart={(event) => handleGridDragStart(event, index)}
							onDragOver={(event) => {
								event.preventDefault();
								setDragOverTarget({ type: 'grid', index });
							}}
							onDragLeave={() => setDragOverTarget((prev) => (prev?.type === 'grid' && prev.index === index ? null : prev))}
							onDrop={(event) => {
								event.preventDefault();
								setDragOverTarget(null);
								moveToGrid(index, parseDragPayload(event));
							}}
							inputProps={{
								style: {
									textAlign: 'center',
									fontFamily: 'Trebuchet MS, sans-serif',
									fontSize: '1.2rem',
									color: '#000000',
									cursor: String(value || '').trim() ? 'grab' : 'text',
								},
								draggable: Boolean(String(value || '').trim()),
							}}
							sx={{
								'& .MuiOutlinedInput-root': {
									backgroundColor: isDragOver ? 'rgba(102, 126, 234, 0.08)' : '#fff',
									'& fieldset': {
										borderColor: isDragOver ? '#667eea' : '#4020A7',
										borderWidth: isDragOver ? '3px' : '2px',
									},
								},
							}}
						/>
					);
				})}
			</Box>

			<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '3fr 1fr' }, gap: 2 }}>
				<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
					{SORT_GRID_CATEGORIES.map((category) => (
						<Box key={category}>{renderSortBox(category, 260)}</Box>
					))}
				</Box>
				<Box>{renderSortBox(ADJECTIVE_CATEGORY, 260)}</Box>
			</Box>

			<Box sx={{ borderTop: '2px solid #eee', pt: 2.5, display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
				<Button variant="outlined" onClick={handleClearWordGrid} sx={{ minWidth: 150 }}>
					Clear Word Grid
				</Button>
				<Button variant="outlined" onClick={() => setData(emptyData())} sx={{ minWidth: 150 }}>
					Clear All
				</Button>
			</Box>
		</ActivityShell>
	);
}
