'use client';

import { useState } from 'react';
import { Box, Button, Stack, TextField } from '@mui/material';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import ActivityShell from '../components/ActivityShell';
import { openPrintWindow } from '../components/openPrintWindow';
import { useLessonActivityProject } from '../components/useLessonActivityProject';
import { ActivityDndProvider, DropZone } from '../components/shared';

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

function DragHandle({ id, data }) {
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id, data });
	return (
		<Box
			component="span"
			ref={setNodeRef}
			{...attributes}
			{...listeners}
			title="Drag to match color"
			sx={{
				cursor: isDragging ? 'grabbing' : 'grab',
				color: 'rgba(0,0,0,0.4)',
				fontSize: '1.1rem',
				px: 0.75,
				userSelect: 'none',
				touchAction: 'none',
				transform: CSS.Translate.toString(transform),
				flexShrink: 0,
				lineHeight: 1,
			}}
		>
			⠿
		</Box>
	);
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
	const [selectedFocusIndex, setSelectedFocusIndex] = useState(null);

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

	const handleDragEnd = (event) => {
		const { active, over } = event;
		if (!active || !over) return;
		const payload = active.data.current;
		const dropTarget = over.data.current;
		if (payload?.sourceType === 'focus' && dropTarget?.targetType === 'related') {
			setListValue('relatedWordColors', dropTarget.index, FOCUS_COLORS[payload.index]);
		}
	};

	const handleClearRelatedColor = (relatedIndex) => {
		setData((prev) => {
			const next = [...prev.relatedWordColors];
			next[relatedIndex] = '';
			return { ...prev, relatedWordColors: next };
		});
	};

	const handleApplySelectedColor = (relatedIndex) => {
		if (selectedFocusIndex === null) return;
		setListValue('relatedWordColors', relatedIndex, FOCUS_COLORS[selectedFocusIndex]);
	};

	const handleClearFocusWords = () => {
		setData((prev) => ({ ...prev, focusWords: Array.from({ length: ROW_COUNT }, () => '') }));
	};

	const handleClearRelatedWords = () => {
		setData((prev) => ({ ...prev, relatedWords: Array.from({ length: ROW_COUNT }, () => '') }));
	};

	const handleRandomizeRelatedWords = () => {
		setData((prev) => {
			const filledIndices = prev.relatedWords.reduce((indices, value, index) => {
				if (value.trim()) {
					indices.push(index);
				}
				return indices;
			}, []);

			for (let index = filledIndices.length - 1; index > 0; index -= 1) {
				const randomIndex = Math.floor(Math.random() * (index + 1));
				[filledIndices[index], filledIndices[randomIndex]] = [filledIndices[randomIndex], filledIndices[index]];
			}

			const nextRelatedWords = [...prev.relatedWords];
			const nextRelatedWordColors = [...prev.relatedWordColors];
			const shuffledFilledWords = filledIndices.map((index) => prev.relatedWords[index]);
			const shuffledFilledColors = filledIndices.map((index) => prev.relatedWordColors[index]);

			filledIndices
				.slice()
				.sort((left, right) => left - right)
				.forEach((targetIndex, index) => {
					nextRelatedWords[targetIndex] = shuffledFilledWords[index];
					nextRelatedWordColors[targetIndex] = shuffledFilledColors[index];
				});

			return {
				...prev,
				relatedWords: nextRelatedWords,
				relatedWordColors: nextRelatedWordColors,
			};
		});
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
</html>`,
			onPopupBlocked: () => setNotice({ type: 'error', message: 'Allow pop-ups to print this activity.' }),
		});
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
			<ActivityDndProvider onDragEnd={handleDragEnd}>
				<Box sx={{ mt: 2, mb: 1.5, fontSize: '0.95rem', color: '#243b53' }}>
					Drag a handle to match color, or use Select on the left and Apply on the right. Double-click a related word to clear its color.
				</Box>
				<Box sx={{ mt: 3 }}>
					<Box
						sx={{
							display: { xs: 'block', sm: 'grid' },
							gridTemplateColumns: '1fr 1fr',
							columnGap: 4,
							mb: 1.8,
							alignItems: 'end',
						}}
					>
						<Box sx={{ display: { xs: 'none', sm: 'block' } }} />
						<Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
							<Button variant="outlined" size="small" onClick={handleRandomizeRelatedWords} sx={{ minWidth: 112 }}>
								Randomize Order
							</Button>
						</Box>
					</Box>
					<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 4, mb: 1 }}>
						<Box sx={{ fontWeight: 700, fontSize: '0.95rem', textTransform: 'uppercase', mb: 1, letterSpacing: 0.5 }}>Focus Words</Box>
						<Box sx={{ fontWeight: 700, fontSize: '0.95rem', textTransform: 'uppercase', mb: 1, letterSpacing: 0.5 }}>Related Words</Box>
					</Box>
					<Stack spacing={1.8}>
						{data.focusWords.map((focusValue, index) => (
							<Box
								key={`match-row-${index}`}
								sx={{
									display: 'grid',
									gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
									columnGap: 4,
									rowGap: 1.2,
									alignItems: 'center',
								}}
							>
								<Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: FOCUS_COLORS[index], borderRadius: 0.5, px: 1 }}>
									<DragHandle id={`focus-handle-${index}`} data={{ sourceType: 'focus', index }} />
									<TextField
										variant="standard"
										value={focusValue}
										onChange={(event) => setListValue('focusWords', index, event.target.value)}
										inputProps={{ style: { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.2rem', color: '#000000', width: '90%' } }}
										sx={{ flex: 1, '& .MuiInputBase-root::before': { borderBottom: '2px solid #ddd' } }}
									/>
									<Button
										variant={selectedFocusIndex === index ? 'contained' : 'outlined'}
										size="small"
										onClick={() => setSelectedFocusIndex(index)}
										aria-pressed={selectedFocusIndex === index}
										sx={{ minWidth: 74, ml: 1, whiteSpace: 'nowrap' }}
									>
										Select
									</Button>
								</Box>
								<DropZone
									id={`related-drop-${index}`}
									data={{ targetType: 'related', index }}
									minHeight={0}
									inactiveSx={{ borderColor: 'transparent', p: 0, backgroundColor: 'transparent' }}
									sx={{ p: 0 }}
								>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
										<TextField
											variant="standard"
											value={data.relatedWords[index]}
											onChange={(event) => setListValue('relatedWords', index, event.target.value)}
											onDoubleClick={() => handleClearRelatedColor(index)}
											inputProps={{ style: { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.2rem', color: '#000000', width: '90%' } }}
											sx={{ width: '100%', backgroundColor: data.relatedWordColors[index] || 'transparent', borderRadius: 0.5, px: 1, '& .MuiInputBase-root::before': { borderBottom: '2px solid #ddd' } }}
										/>
										<Button
											variant="outlined"
											size="small"
											onClick={() => handleApplySelectedColor(index)}
											disabled={selectedFocusIndex === null}
											sx={{ minWidth: 72, whiteSpace: 'nowrap' }}
										>
											Apply
										</Button>
									</Box>
								</DropZone>
							</Box>
						))}
					</Stack>
					<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 4, mt: 1 }}>
						<Box sx={{ pt: 1 }}>
							<Button variant="outlined" size="small" onClick={handleClearFocusWords}>
								Clear Focus Words
							</Button>
						</Box>
						<Box sx={{ pt: 1 }}>
							<Button variant="outlined" size="small" onClick={handleClearRelatedWords}>
								Clear Related Words
							</Button>
						</Box>
					</Box>
				</Box>
			</ActivityDndProvider>
		</ActivityShell>
	);
}
