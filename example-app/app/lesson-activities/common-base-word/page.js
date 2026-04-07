'use client';

import { Box, Button, Grid, Stack, TextField, Typography } from '@mui/material';
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
			handleDownloadPdf={handleDownloadPdf}
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
									size="small"
									inputProps={{ style: { textAlign: 'center', fontFamily: 'Courier New, monospace' } }}
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
									inputProps={{ style: { fontFamily: 'Courier New, monospace' } }}
								/>
							</Box>
						</Stack>
					</Grid>
				))}
			</Grid>

			<Box sx={{ borderTop: '2px solid #eee', pt: 2.5, display: 'flex', justifyContent: 'center', mt: 4 }}>
				<Button variant="outlined" onClick={() => setData(emptyData())} sx={{ minWidth: 150 }}>
					Clear All
				</Button>
			</Box>
		</ActivityShell>
	);
}
