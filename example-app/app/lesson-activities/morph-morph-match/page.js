'use client';

import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import ActivityShell from '../components/ActivityShell';
import { useLessonActivityProject } from '../components/useLessonActivityProject';

const FORM_NAME = 'morph-morph-match';
const DEFAULT_ACTIVITY_NAME = 'Morph Morph Match Activity';
const GRID_LABELS = ['Column 1', 'Column 2', 'Column 3', 'Column 4', 'Column 5', 'Column 6'];

function emptyPair() {
	return { left: '', right: '' };
}

function emptyData() {
	return {
		morpheme: '',
		grid: Array.from({ length: 24 }, () => ''),
		pairs: Array.from({ length: 12 }, () => emptyPair()),
	};
}

function normalizeInputData(rawData) {
	const source = rawData && typeof rawData === 'object' ? rawData : {};
	const grid = Array.isArray(source.grid) ? source.grid : [];
	const pairs = Array.isArray(source.pairs) ? source.pairs : [];
	return {
		morpheme: String(source.morpheme || ''),
		grid: Array.from({ length: 24 }, (_, index) => String(grid[index] || '')),
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
			handleDownloadPdf={handleDownloadPdf}
			projectId={projectId}
			projectName={projectName}
			activityName={activityName}
			setActivityName={setActivityName}
			isSaving={isSaving}
			notice={notice}
			setNotice={setNotice}
		>
			<Box sx={{ my: 3 }}>
				<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1.25, mb: 1 }}>
					{GRID_LABELS.map((label) => (
						<Typography key={label} sx={{ textAlign: 'center', fontWeight: 700, color: '#555', fontSize: '0.9rem' }}>{label}</Typography>
					))}
				</Box>
				{Array.from({ length: 4 }, (_, rowIndex) => (
					<Box key={rowIndex} sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1.25, mb: 1.25 }}>
						{Array.from({ length: 6 }, (_, colIndex) => {
							const index = rowIndex * 6 + colIndex;
							return (
								<TextField
									key={index}
									value={data.grid[index] || ''}
									onChange={(event) => setGridValue(index, event.target.value)}
									size="small"
									inputProps={{ style: { textAlign: 'center', fontFamily: 'Courier New, monospace' } }}
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
			</Box>

			<Box sx={{ borderTop: '2px solid #eee', pt: 3, mt: 2 }}>
				<Typography sx={{ fontWeight: 700, mb: 1.5 }}>Base Word / Related Word</Typography>
			<Stack spacing={1.25}>
				{data.pairs.map((pair, index) => (
					<Box key={index} sx={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr', gap: 1.5, alignItems: 'center' }}>
						<Typography sx={{ fontWeight: 700 }}>{index + 1}.</Typography>
						<TextField
							variant="standard"
							value={pair.left}
							onChange={(event) => setPairValue(index, 'left', event.target.value)}
							inputProps={{ style: { fontFamily: 'Courier New, monospace' } }}
							sx={{ '& .MuiInputBase-root::before': { borderBottom: '2px solid #ddd' } }}
						/>
						<TextField
							variant="standard"
							value={pair.right}
							onChange={(event) => setPairValue(index, 'right', event.target.value)}
							inputProps={{ style: { fontFamily: 'Courier New, monospace' } }}
							sx={{ '& .MuiInputBase-root::before': { borderBottom: '2px solid #ddd' } }}
						/>
					</Box>
				))}
			</Stack>
			</Box>

			<Box sx={{ borderTop: '2px solid #eee', pt: 2.5, display: 'flex', justifyContent: 'center', mt: 4 }}>
				<Button variant="outlined" onClick={() => setData(emptyData())} sx={{ minWidth: 150 }}>
					Clear All
				</Button>
			</Box>
		</ActivityShell>
	);
}
