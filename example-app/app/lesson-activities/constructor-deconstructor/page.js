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
						inputProps={{ style: { fontFamily: 'Courier New, monospace' } }}
						sx={{ '& .MuiOutlinedInput-root fieldset': { borderColor: '#4020A7', borderWidth: '2px' } }}
					/>
					<TextField
						value={row.sum}
						onChange={(event) => onChange(index, 'sum', event.target.value)}
						inputProps={{ style: { textAlign: 'center', fontFamily: 'Courier New, monospace' } }}
						sx={{ '& .MuiOutlinedInput-root fieldset': { borderColor: '#4020A7', borderWidth: '2px' } }}
					/>
					<TextField
						value={row.right}
						onChange={(event) => onChange(index, 'right', event.target.value)}
						inputProps={{ style: { fontFamily: 'Courier New, monospace' } }}
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
			handleDownloadPdf={handleDownloadPdf}
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
