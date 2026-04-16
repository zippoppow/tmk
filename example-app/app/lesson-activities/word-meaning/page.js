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

function InputColumn({ title, values, onChange, onClear, variant = 'boxed' }) {
	return (
		<Stack spacing={1}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
				<Typography sx={{ fontWeight: 700 }}>{title}</Typography>
				<Button size="small" variant="outlined" sx={{ textTransform: 'none', minWidth: 0, px: 1.25, py: 0.25 }} onClick={onClear}>Clear</Button>
			</Box>
			{values.map((value, index) => (
				<Box key={index} sx={variant === 'underlined' ? { minHeight: 56, display: 'flex', alignItems: 'center' } : { minHeight: 56, display: 'flex', alignItems: 'center', border: '2px solid #4020A7', borderRadius: 1, px: 1 }}>
					<TextField
						value={value}
						onChange={(event) => onChange(index, event.target.value)}
						size="small"
						fullWidth
						variant={variant === 'underlined' ? 'standard' : 'standard'}
						InputProps={{ disableUnderline: variant !== 'underlined' }}
							inputProps={{ style: { minHeight: 56, fontFamily: 'Trebuchet MS, sans-serif', fontSize: '1.2rem', color: '#000000' } }}
						sx={variant === 'underlined'
							? { '& .MuiInputBase-root::before': { borderBottom: '2px solid #4020A7' } }
							: {}}
					/>
				</Box>
			))}
		</Stack>
	);
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

	const clearList = (key) => {
		setData((prev) => ({ ...prev, [key]: prev[key].map(() => '') }));
	};

	const handleDownloadPdfCustom = () => {
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

		appendElement(headerContent, 'div', 'instructions', 'Interpret each prompt word using the morph clues and write the meaning.');

		const headerLogo = appendElement(header, 'div', 'header-column');
		const logo = printDocument.createElement('img');
		logo.src = `${window.location.origin}/branding/tmk_diy_logo.png`;
		logo.alt = 'The Morphology Kit';
		headerLogo.appendChild(logo);

		const grid = appendElement(printDocument.body, 'div', 'grid');
		const headers = appendElement(grid, 'div', 'headers');
		appendElement(headers, 'div', 'col-header', 'Prompt Word');
		appendElement(headers, 'div', 'col-header', 'Algo Phrase / Clue');
		appendElement(headers, 'div', 'col-header', 'Word Meaning');

		Array.from({ length: 12 }, (_, index) => index).forEach((index) => {
			const row = appendElement(grid, 'div', 'row');
			appendElement(row, 'div', 'cell cell-boxed', data.promptWords[index] || '');
			appendElement(row, 'div', 'cell cell-underlined', data.algoPhrases[index] || '');
			appendElement(row, 'div', 'cell cell-boxed', data.answerMeanings[index] || '');
		});

		if (authUser?.email) {
			appendElement(printDocument.body, 'div', 'license-footer', `Licensed for use by: ${authUser.email}`);
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
			instructions="Interpret each prompt word using the morph clues and write the meaning."
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
					<InputColumn title="Prompt Words" values={data.promptWords} onChange={(index, value) => setList('promptWords', index, value)} onClear={() => clearList('promptWords')} />
				</Grid>
				<Grid item xs={12} md={4}>
					<InputColumn title="Algo Phrase / Clue" values={data.algoPhrases} onChange={(index, value) => setList('algoPhrases', index, value)} onClear={() => clearList('algoPhrases')} variant="underlined" />
				</Grid>
				<Grid item xs={12} md={4}>
					<InputColumn title="Word Meaning" values={data.answerMeanings} onChange={(index, value) => setList('answerMeanings', index, value)} onClear={() => clearList('answerMeanings')} />
				</Grid>
			</Grid>
		</ActivityShell>
	);
}
