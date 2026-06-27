'use client';

import { Box, Button, Grid, Stack, TextField, Typography } from '@mui/material';
import ActivityShell from '../components/ActivityShell';
import { useLessonActivityProject } from '../components/useLessonActivityProject';

const FORM_NAME = 'word-meaning';
const DEFAULT_ACTIVITY_NAME = 'Word Meaning Activity';

function emptyData() {
	return {
		morpheme: '',
		promptWords: Array.from({ length: 12 }, () => ''),
		algoPhrases: Array.from({ length: 12 }, () => ''),
		answerMeanings: Array.from({ length: 12 }, () => ''),
	};
}

function normalizeInputData(rawData) {
	const source = rawData && typeof rawData === 'object' ? rawData : {};
	const promptWords = Array.isArray(source.promptWords) ? source.promptWords : [];
	const algoPhrases = Array.isArray(source.algoPhrases) ? source.algoPhrases : [];
	const answerMeanings = Array.isArray(source.answerMeanings) ? source.answerMeanings : [];
	return {
		morpheme: String(source.morpheme || ''),
		promptWords: Array.from({ length: 12 }, (_, index) => String(promptWords[index] || '')),
		algoPhrases: Array.from({ length: 12 }, (_, index) => String(algoPhrases[index] || '')),
		answerMeanings: Array.from({ length: 12 }, (_, index) => String(answerMeanings[index] || '')),
	};
}

export default function WordMeaningPage() {
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

	const setList = (key, index, value) => {
		setData((prev) => {
			const next = [...prev[key]];
			next[index] = value;
			return { ...prev, [key]: next };
		});
	};

	const clearList = (key) => {
		setData((prev) => ({ ...prev, [key]: prev[key].map(() => '') }));
	};

	const handleDownloadPdfCustom = () => {
		const isSlideshowClone = typeof window !== 'undefined' && new URL(window.location.href).searchParams.get('slideshowClone') === '1';
		const printWindow = window.open('', '', 'width=1100,height=1400');

		if (!printWindow) {
			setNotice({ type: 'error', message: 'Allow pop-ups to print this activity.' });
			return;
		}

		const { document: printDocument } = printWindow;
		const popupTitle = activityName || DEFAULT_ACTIVITY_NAME;
		const styles = `
			* { margin: 0; padding: 0; box-sizing: border-box; }
			body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; line-height: 1.4; }
			.header { border-bottom: 3px solid #4020A7; padding-bottom: 8px; display: grid; grid-template-columns: 3fr 1fr; gap: 10px; margin-bottom: 20px; }
			.header-column { display: flex; flex-direction: column; gap: 4px; }
			.header-column img { max-width: 180px; height: auto; }
			.title { font-size: 1.5em; font-weight: bold; letter-spacing: 1px; }
			.subtitle { font-size: 1.1em; font-style: italic; }
			.morpheme-value { font-family: 'Courier New', monospace; color: #4020A7; }
			.instructions { font-size: 0.95em; color: #555; margin-top: 4px; }
			.grid { display: flex; flex-direction: column; gap: 0; }
			.headers { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 8px; }
			.col-header { font-weight: 700; font-size: 0.9em; text-transform: uppercase; text-align: center; }
			.row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 8px; }
			.cell { padding: 8px 10px; font-family: 'Trebuchet MS, sans-serif'; font-size: 0.95em; min-height: 56px; display: flex; align-items: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
			.cell-boxed { border: 2px solid #4020A7; border-radius: 3px; }
			.cell-underlined { border-bottom: 2px solid #4020A7; }
			.license-footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e5e7eb; text-align: right; font-size: 0.8em; color: #4b5563; font-style: italic; }
			@page { size: letter portrait; margin: 0.4in; }
			@media print { body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; width: 8.5in; max-width: 100%; } }
		`;

		const appendElement = (parent, tagName, className, textContent) => {
			const element = printDocument.createElement(tagName);
			if (className) {
				element.className = className;
			}
			if (typeof textContent === 'string') {
				element.textContent = textContent;
			}
			parent.appendChild(element);
			return element;
		};

		printDocument.documentElement.lang = 'en';
		printDocument.head.replaceChildren();
		printDocument.body.replaceChildren();

		const charsetMeta = printDocument.createElement('meta');
		charsetMeta.setAttribute('charset', 'UTF-8');
		printDocument.head.appendChild(charsetMeta);

		const titleElement = printDocument.createElement('title');
		titleElement.textContent = popupTitle;
		printDocument.head.appendChild(titleElement);

		const styleElement = printDocument.createElement('style');
		styleElement.textContent = styles;
		printDocument.head.appendChild(styleElement);

		const header = appendElement(printDocument.body, 'div', 'header');
		const headerContent = appendElement(header, 'div', 'header-column');
		appendElement(headerContent, 'div', 'title', 'WORD MEANING');

		const subtitle = appendElement(headerContent, 'div', 'subtitle');
		subtitle.append('Morpheme(s): ');
		appendElement(subtitle, 'span', 'morpheme-value', data.morpheme || '');

		appendElement(headerContent, 'div', 'instructions', 'Write the meaning for each prompt word using the provided clues.');

		const headerLogo = appendElement(header, 'div', 'header-column');
		const logo = printDocument.createElement('img');
		logo.src = `${window.location.origin}/branding/tmk_diy_logo_templates.png`;
		logo.alt = 'The Morphology Kit';
		headerLogo.appendChild(logo);

		const grid = appendElement(printDocument.body, 'div', 'grid');
		const headers = appendElement(grid, 'div', 'headers');
		appendElement(headers, 'div', 'col-header', 'Prompt Word');
		appendElement(headers, 'div', 'col-header', 'Clue');
		appendElement(headers, 'div', 'col-header', 'Word Meaning');

		Array.from({ length: 12 }, (_, index) => index).forEach((index) => {
			const row = appendElement(grid, 'div', 'row');
			appendElement(row, 'div', 'cell cell-boxed', data.promptWords[index] || '');
			appendElement(row, 'div', 'cell cell-underlined', data.algoPhrases[index] || '');
			appendElement(row, 'div', 'cell cell-boxed', data.answerMeanings[index] || '');
		});

		if (!isSlideshowClone && authUser?.email) {
			appendElement(printDocument.body, 'div', 'license-footer', `Licensed for use to: ${authUser.email}`);
		}

		const triggerPrint = () => {
			printWindow.focus();
			window.setTimeout(() => {
				printWindow.print();
				printWindow.close();
			}, 250);
		};

		if (logo.complete) {
			triggerPrint();
			return;
		}

		logo.addEventListener('load', triggerPrint, { once: true });
		logo.addEventListener('error', triggerPrint, { once: true });
	};

	return (
		<ActivityShell
			title="WORD MEANING"
			morpheme={data.morpheme}
			onMorphemeChange={(value) => setData((prev) => ({ ...prev, morpheme: value }))}
			instructions="Write the meaning for each prompt word using the provided clues."
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
			<Box sx={{ mt: 2 }}>
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
						columnGap: 2,
						rowGap: 1,
						mb: 3,
						mt:4,
					}}
				>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<Typography sx={{ fontWeight: 700 }}>Prompt Words</Typography>
						<Button size="small" variant="outlined" sx={{ textTransform: 'none', minWidth: 0, px: 1.25, py: 0.25 }} onClick={() => clearList('promptWords')}>Clear</Button>
					</Box>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<Typography sx={{ fontWeight: 700 }}>Clue</Typography>
						<Button size="small" variant="outlined" sx={{ textTransform: 'none', minWidth: 0, px: 1.25, py: 0.25 }} onClick={() => clearList('algoPhrases')}>Clear</Button>
					</Box>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<Typography sx={{ fontWeight: 700 }}>Word Meaning</Typography>
						<Button size="small" variant="outlined" sx={{ textTransform: 'none', minWidth: 0, px: 1.25, py: 0.25 }} onClick={() => clearList('answerMeanings')}>Clear</Button>
					</Box>
				</Box>

				<Stack spacing={1}>
					{data.promptWords.map((promptWord, index) => (
						<Box
							key={`word-meaning-row-${index}`}
							sx={{
								display: 'grid',
								gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
								columnGap: 2,
								rowGap: 1,
								alignItems: 'center',
							}}
						>
							<Box sx={{ minHeight: 56, display: 'flex', alignItems: 'center', border: '2px solid #4020A7', borderRadius: 1, px: 1 }}>
								<TextField
									value={promptWord}
									onChange={(event) => setList('promptWords', index, event.target.value)}
									size="small"
									fullWidth
									variant="standard"
									InputProps={{ disableUnderline: true }}
									inputProps={{ style: { minHeight: 56, fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.2rem', color: '#000000' } }}
								/>
							</Box>

							<Box sx={{ minHeight: 56, display: 'flex', alignItems: 'center' }}>
								<TextField
									value={data.algoPhrases[index]}
									onChange={(event) => setList('algoPhrases', index, event.target.value)}
									size="small"
									fullWidth
									variant="standard"
									multiline
									minRows={2}
									inputProps={{ style: { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.2rem', color: '#000000' } }}
									sx={{ '& .MuiInputBase-root::before': { borderBottom: '2px solid #4020A7' } }}
								/>
							</Box>

							<Box sx={{ minHeight: 56, display: 'flex', alignItems: 'center', border: '2px solid #4020A7', borderRadius: 1, px: 1 }}>
								<TextField
									value={data.answerMeanings[index]}
									onChange={(event) => setList('answerMeanings', index, event.target.value)}
									size="small"
									fullWidth
									variant="standard"
									InputProps={{ disableUnderline: true }}
									inputProps={{ style: { minHeight: 56, fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.2rem', color: '#000000' } }}
								/>
							</Box>
						</Box>
					))}
				</Stack>
			</Box>
		</ActivityShell>
	);
}
