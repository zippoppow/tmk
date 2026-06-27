'use client';

import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import ActivityShell from '../components/ActivityShell';
import { openPrintWindow } from '../components/openPrintWindow';
import { useLessonActivityProject } from '../components/useLessonActivityProject';
import { ActivityDndProvider, DropZone } from '../components/shared';

const FORM_NAME = 'morph-morph-match';
const DEFAULT_ACTIVITY_NAME = 'Morph Morph Match Activity';

function emptyPair() {
	return { leftSub1: '', leftSub2: '', rightSub1: '', rightSub2: '' };
}

function emptyHeaders() {
	return { leftTitle: '', leftSub1: '', leftSub2: '', rightTitle: '', rightSub1: '', rightSub2: '' };
}

function emptyData() {
	return {
		morpheme: '',
		grid: Array.from({ length: 20 }, () => ''),
		sectionHeaders: emptyHeaders(),
		pairs: Array.from({ length: 10 }, () => emptyPair()),
	};
}

function normalizeInputData(rawData) {
	const source = rawData && typeof rawData === 'object' ? rawData : {};
	const grid = Array.isArray(source.grid) ? source.grid : [];
	const pairs = Array.isArray(source.pairs) ? source.pairs : [];
	const sh = source.sectionHeaders && typeof source.sectionHeaders === 'object' ? source.sectionHeaders : {};
	return {
		morpheme: String(source.morpheme || ''),
		grid: Array.from({ length: 20 }, (_, index) => String(grid[index] || '')),
		sectionHeaders: {
			leftTitle: String(sh.leftTitle || ''),
			leftSub1: String(sh.leftSub1 || ''),
			leftSub2: String(sh.leftSub2 || ''),
			rightTitle: String(sh.rightTitle || ''),
			rightSub1: String(sh.rightSub1 || ''),
			rightSub2: String(sh.rightSub2 || ''),
		},
		pairs: Array.from({ length: 10 }, (_, index) => {
			const pair = pairs[index] || {};
			return {
				leftSub1: String(pair.leftSub1 || ''),
				leftSub2: String(pair.leftSub2 || ''),
				rightSub1: String(pair.rightSub1 || ''),
				rightSub2: String(pair.rightSub2 || ''),
			};
		}),
	};
}

function DragHandle({ id, data, disabled = false }) {
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
		id,
		data,
		disabled,
	});

	return (
		<Box
			ref={setNodeRef}
			component="button"
			type="button"
			aria-label="Drag value"
			{...attributes}
			{...listeners}
			sx={{
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
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

	const moveGridValueToPairField = (pairIndex, field, payload) => {
		const sourceIndex = Number(payload?.gridIndex);
		if (!Number.isInteger(sourceIndex) || sourceIndex < 0 || sourceIndex >= data.grid.length) return;
		if (!['leftSub1', 'leftSub2', 'rightSub1', 'rightSub2'].includes(field)) return;
		if (!Number.isInteger(pairIndex) || pairIndex < 0 || pairIndex >= data.pairs.length) return;

		setData((prev) => {
			const sourceValue = String(prev.grid[sourceIndex] || '').trim();
			if (!sourceValue) return prev;

			const nextGrid = [...prev.grid];
			const nextPairs = [...prev.pairs];
			nextGrid[sourceIndex] = '';
			nextPairs[pairIndex] = {
				...nextPairs[pairIndex],
				[field]: sourceValue,
			};

			return {
				...prev,
				grid: nextGrid,
				pairs: nextPairs,
			};
		});
	};

	const resolvePairDropTarget = (dropTarget, overId) => {
		const dropField = dropTarget?.field;
		const dropPairIndex = Number(dropTarget?.pairIndex);

		if (['leftSub1', 'leftSub2', 'rightSub1', 'rightSub2'].includes(dropField) && Number.isInteger(dropPairIndex)) {
			return { field: dropField, pairIndex: dropPairIndex };
		}

		const parsed = String(overId || '').match(/^pair-(left|right)-sub([12])-(\d+)$/);
		if (!parsed) return null;

		const side = parsed[1];
		const subNum = parsed[2];
		const pairIndex = Number(parsed[3]);
		if (!Number.isInteger(pairIndex)) return null;

		return {
			field: `${side}Sub${subNum}`,
			pairIndex,
		};
	};

	const handleDragEnd = (event) => {
		const payload = event?.active?.data?.current;
		const dropTarget = event?.over?.data?.current;
		const overId = event?.over?.id;
		if (!payload || !overId) return;
		if (payload.sourceType !== 'grid') return;
		if (dropTarget && dropTarget.targetType !== 'pair-field') return;

		const resolvedTarget = resolvePairDropTarget(dropTarget, overId);
		if (!resolvedTarget) return;

		moveGridValueToPairField(resolvedTarget.pairIndex, resolvedTarget.field, payload);
	};

	const handleClearTopSection = () => {
		setData((prev) => ({ ...prev, grid: Array.from({ length: 20 }, () => '') }));
	};

	const handleClearSectionHeaders = () => {
		setData((prev) => ({ ...prev, sectionHeaders: emptyHeaders() }));
	};

	const handleClearLowerSection = () => {
		setData((prev) => ({ ...prev, pairs: Array.from({ length: 10 }, () => emptyPair()) }));
	};

	const handleDownloadPdfCustom = () => {
		const isSlideshowClone = typeof window !== 'undefined' && new URL(window.location.href).searchParams.get('slideshowClone') === '1';
		const sh = data.sectionHeaders || {};
		const gridCells = data.grid
			.map((v) => `<div class="grid-cell">${(v || '').replace(/</g, '&lt;')}</div>`)
			.join('');

		const pairRows = data.pairs
			.map(
				(pair, i) => `
			<div class="pair-row">
				<span class="pair-num">${i + 1}.</span>
				<div class="pair-cell">${(pair.leftSub1 || '').replace(/</g, '&lt;')}</div>
				<div class="pair-cell">${(pair.leftSub2 || '').replace(/</g, '&lt;')}</div>
				<div class="pair-cell">${(pair.rightSub1 || '').replace(/</g, '&lt;')}</div>
				<div class="pair-cell">${(pair.rightSub2 || '').replace(/</g, '&lt;')}</div>
			</div>`
			)
			.join('');

		const licenseFooter = !isSlideshowClone && authUser?.email
			? `<div class="license-footer">Licensed for use to: ${authUser.email.replace(/</g, '&lt;')}</div>`
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
		.title { font-size: 1.5em; font-weight: 700; letter-spacing: 0.4px; line-height: 1.5; }
		.subtitle { font-size: 1em; font-style: italic; line-height: 1.5; }
    .morpheme-value { font-family: 'Courier New', monospace; color: #4020A7; }
		.instructions { font-size: 1em; color: #555; margin-top: 2px; }
		.top-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 5px; margin-bottom: 10px; break-inside: avoid; page-break-inside: avoid; }
		.grid-cell { border: 2px solid #4020A7; border-radius: 3px; padding: 4px; text-align: center; font-family: 'Trebuchet MS', sans-serif; min-height: 40px; font-size: 1em; }
		.section-divider { border-top: 2px solid #eee; margin: 8px 0; padding-top: 8px; }
		.section-headers { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 8px; }
    .sh-col { display: flex; flex-direction: column; gap: 3px; }
		.sh-title { font-weight: 700; font-size: 1.5em; text-align: center; margin-top: 10px; margin-bottom: 10px; }
		.sh-subs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; align-items: center; margin-bottom: 10px; }
		.sh-sub { font-size: 1em; color: #555; text-align: center; }
		.pairs { display: flex; flex-direction: column; gap: 2px; break-inside: avoid; page-break-inside: avoid; }
		.pair-row { display: grid; grid-template-columns: 20px repeat(4, 1fr); gap: 8px; align-items: center; border-bottom: 1px solid #eee; padding: 3.5px 0; }
    .pair-num { font-weight: 700; text-align: right; color: #555; font-size: 0.85em; }
		.pair-cell { font-family: 'Trebuchet MS', sans-serif; padding: 4px; min-height: 32px; border-bottom: 1px solid #ddd; font-size: 0.86em; }
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
      <div class="instructions">Use the top grid to explore morpheme forms, then pair related morpheme words below.</div>
    </div>
    <div class="header-column">
      <img src="/branding/tmk_diy_logo_templates.png" alt="The Morphology Kit" />
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
				<Box sx={{ mt: 2, mb: 1, fontSize: '0.95rem', color: '#243b53' }}>
					Drag from the top grid into either left or right numbered input below.
				</Box>
				<Box sx={{ my: 3 }}>
					{Array.from({ length: 4 }, (_, rowIndex) => (
					<Box key={rowIndex} sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1.25, mb: 1.25 }}>
						{Array.from({ length: 5 }, (_, colIndex) => {
							const index = rowIndex * 5 + colIndex;
								return (
									<Box
										key={index}
										sx={{
											display: 'flex',
											alignItems: 'center',
											gap: 0.5,
											border: '2px solid #4020A7',
											borderRadius: 1,
											px: 0.5,
											backgroundColor: '#fff',
										}}
									>
										<TextField
											value={data.grid[index] || ''}
											onChange={(event) => setGridValue(index, event.target.value)}
											size="small"
											inputProps={{
												style: {
													textAlign: 'center',
													fontFamily: 'Trebuchet MS, sans-serif',
													fontSize: '1.2rem',
													color: '#000000',
												},
											}}
											sx={{
												flex: 1,
												'& .MuiOutlinedInput-root': {
													'& fieldset': { border: 'none' },
													'&:hover fieldset': { border: 'none' },
													'&.Mui-focused fieldset': { border: 'none' },
												},
											}}
										/>
										<DragHandle
											id={`grid-handle-${index}`}
											data={{ sourceType: 'grid', gridIndex: index, value: data.grid[index] || '' }}
											disabled={!String(data.grid[index] || '').trim()}
										/>
									</Box>
								);
							})}
						</Box>
					))}
					<Box sx={{ pt: 1 }}>
						<Button variant="outlined" size="small" onClick={handleClearTopSection}>
							Clear Word Grid
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
								inputProps={{
									style: {
										textAlign: 'center',
										fontFamily: 'Trebuchet MS, sans-serif',
										fontWeight: 700,
										fontSize: '1.2rem',
										color: '#000000',
									},
								}}
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
								inputProps={{
									style: {
										textAlign: 'center',
										fontFamily: 'Trebuchet MS, sans-serif',
										fontWeight: 700,
										fontSize: '1.2rem',
										color: '#000000',
									},
								}}
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
							<Box key={index} sx={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr 1fr 1fr', gap: 1.5, alignItems: 'center' }}>
								<Typography sx={{ fontWeight: 700 }}>{index + 1}.</Typography>
								<DropZone
									id={`pair-left-sub1-${index}`}
									data={{ targetType: 'pair-field', pairIndex: index, field: 'leftSub1' }}
									minHeight={0}
									inactiveSx={{ borderColor: 'transparent', p: 0, backgroundColor: 'transparent' }}
									sx={{ p: 0 }}
								>
									<TextField
										variant="standard"
										value={pair.leftSub1}
										onChange={(event) => setPairValue(index, 'leftSub1', event.target.value)}
										inputProps={{ style: { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.2rem', color: '#000000' } }}
										sx={{ width: '100%', '& .MuiInputBase-root::before': { borderBottom: '2px solid #ddd' } }}
									/>
								</DropZone>
								<DropZone
									id={`pair-left-sub2-${index}`}
									data={{ targetType: 'pair-field', pairIndex: index, field: 'leftSub2' }}
									minHeight={0}
									inactiveSx={{ borderColor: 'transparent', p: 0, backgroundColor: 'transparent' }}
									sx={{ p: 0 }}
								>
									<TextField
										variant="standard"
										value={pair.leftSub2}
										onChange={(event) => setPairValue(index, 'leftSub2', event.target.value)}
										inputProps={{ style: { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.2rem', color: '#000000' } }}
										sx={{ width: '100%', '& .MuiInputBase-root::before': { borderBottom: '2px solid #ddd' } }}
									/>
								</DropZone>
								<DropZone
									id={`pair-right-sub1-${index}`}
									data={{ targetType: 'pair-field', pairIndex: index, field: 'rightSub1' }}
									minHeight={0}
									inactiveSx={{ borderColor: 'transparent', p: 0, backgroundColor: 'transparent' }}
									sx={{ p: 0 }}
								>
									<TextField
										variant="standard"
										value={pair.rightSub1}
										onChange={(event) => setPairValue(index, 'rightSub1', event.target.value)}
										inputProps={{ style: { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.2rem', color: '#000000' } }}
										sx={{ width: '100%', '& .MuiInputBase-root::before': { borderBottom: '2px solid #ddd' } }}
									/>
								</DropZone>
								<DropZone
									id={`pair-right-sub2-${index}`}
									data={{ targetType: 'pair-field', pairIndex: index, field: 'rightSub2' }}
									minHeight={0}
									inactiveSx={{ borderColor: 'transparent', p: 0, backgroundColor: 'transparent' }}
									sx={{ p: 0 }}
								>
									<TextField
										variant="standard"
										value={pair.rightSub2}
										onChange={(event) => setPairValue(index, 'rightSub2', event.target.value)}
										inputProps={{ style: { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.2rem', color: '#000000' } }}
										sx={{ width: '100%', '& .MuiInputBase-root::before': { borderBottom: '2px solid #ddd' } }}
									/>
								</DropZone>
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
			</ActivityDndProvider>
		</ActivityShell>
	);
}
