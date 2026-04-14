'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material';
import { getAllStoredProjects } from '../../components/lessonActivityHelpers';
import { getProjectLessonActivities } from '../../components/projectManagerModel';

const LESSON_ACTIVITY_TYPES = [
	{ value: 'intro', path: '/lesson-activities/intro' },
	{ value: 'chameleon-prefixes', path: '/lesson-activities/chameleon-prefixes' },
	{ value: 'common-base-word', path: '/lesson-activities/common-base-word' },
	{ value: 'constructor-deconstructor', path: '/lesson-activities/constructor-deconstructor' },
	{ value: 'fill-in-the-morph-paragraphs', path: '/lesson-activities/fill-in-the-morph-paragraphs' },
	{ value: 'morph-match-definitions', path: '/lesson-activities/morph-match-definitions' },
	{ value: 'morph-match-related-words', path: '/lesson-activities/morph-match-related-words' },
	{ value: 'morph-morph-match', path: '/lesson-activities/morph-morph-match' },
	{ value: 'morph-sort', path: '/lesson-activities/morph-sort' },
	{ value: 'morph-which', path: '/lesson-activities/morph-which' },
	{ value: 'part-of-speech', path: '/lesson-activities/part-of-speech' },
	{ value: 'word-builder', path: '/lesson-activities/word-builder' },
	{ value: 'word-meaning', path: '/lesson-activities/word-meaning' },
];

function getLessonActivityRoute(activityType) {
	const found = LESSON_ACTIVITY_TYPES.find((type) => type.value === activityType);
	return found?.path || null;
}

function parseIndices(rawIndices) {
	if (!rawIndices) {
		return [];
	}
	return [...new Set(
		String(rawIndices)
			.split(',')
			.map((value) => Number.parseInt(value, 10))
			.filter((value) => Number.isInteger(value) && value >= 0)
	)].sort((a, b) => a - b);
}

export default function LessonActivitySlideshowPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);
	}, []);

	const projectId = String(searchParams.get('projectId') || '').trim();
	const selectedIndices = useMemo(() => parseIndices(searchParams.get('indices')), [searchParams]);

	const slideshow = useMemo(() => {
		if (!isClient || typeof window === 'undefined') {
			return { projectName: '', slides: [] };
		}

		if (!projectId || selectedIndices.length === 0) {
			return { projectName: '', slides: [] };
		}

		const project = getAllStoredProjects().find((item) => item.id === projectId);
		if (!project) {
			return { projectName: '', slides: [] };
		}

		const activities = getProjectLessonActivities(project, 'lesson-activities-project', (data) => data || {});
		const slides = selectedIndices
			.map((activityIndex) => {
				const activity = activities[activityIndex];
				if (!activity) {
					return null;
				}

				const activityType = String(activity['tmk-template'] || '');
				const route = getLessonActivityRoute(activityType);
				if (!route) {
					return null;
				}

				const params = new URLSearchParams({
					projectId,
					activityIndex: String(activityIndex),
					activityType,
				});
				if (activity?.id) {
					params.set('activityId', String(activity.id));
				}

				return {
					activityIndex,
					activityName: String(activity['lesson-name'] || `${activityType} activity`),
					activityType,
					url: `${route}?${params.toString()}`,
				};
			})
			.filter(Boolean);

		return {
			projectName: String(project.name || 'Untitled Project'),
			slides,
		};
	}, [isClient, projectId, selectedIndices]);

	const slides = slideshow.slides;
	const totalSlides = slides.length;
	const safeIndex = totalSlides === 0 ? 0 : Math.min(currentSlideIndex, totalSlides - 1);
	const currentSlide = totalSlides === 0 ? null : slides[safeIndex];

	const goToPrevious = () => {
		setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
	};

	const goToNext = () => {
		setCurrentSlideIndex((prev) => Math.min(totalSlides - 1, prev + 1));
	};

	if (!isClient) {
		return (
			<Container maxWidth="md" sx={{ py: 4 }}>
				<Paper sx={{ p: 3, borderRadius: 2 }}>
					<Typography sx={{ fontWeight: 700, mb: 1.2 }}>Lesson Activity Slideshow</Typography>
					<Typography sx={{ color: '#555' }}>Loading slideshow...</Typography>
				</Paper>
			</Container>
		);
	}

	if (!projectId || selectedIndices.length === 0) {
		return (
			<Container maxWidth="md" sx={{ py: 4 }}>
				<Paper sx={{ p: 3, borderRadius: 2 }}>
					<Typography sx={{ fontWeight: 700, mb: 1.2 }}>Lesson Activity Slideshow</Typography>
					<Typography sx={{ color: '#555', mb: 2 }}>No lesson activities were selected for slideshow.</Typography>
					<Button variant="contained" onClick={() => router.push('/lesson-projects')} sx={{ textTransform: 'none' }}>
						Back to Lesson Projects
					</Button>
				</Paper>
			</Container>
		);
	}

	if (totalSlides === 0) {
		return (
			<Container maxWidth="md" sx={{ py: 4 }}>
				<Paper sx={{ p: 3, borderRadius: 2 }}>
					<Typography sx={{ fontWeight: 700, mb: 1.2 }}>Lesson Activity Slideshow</Typography>
					<Typography sx={{ color: '#555', mb: 2 }}>
						None of the selected activities can be opened in slideshow mode.
					</Typography>
					<Button variant="contained" onClick={() => router.push('/lesson-projects')} sx={{ textTransform: 'none' }}>
						Back to Lesson Projects
					</Button>
				</Paper>
			</Container>
		);
	}

	return (
		<Box
			component="main"
			sx={{
				minHeight: '100vh',
				py: { xs: 2, md: 3 },
				px: 1,
				background: 'linear-gradient(135deg, #edf2ff 0%, #f8faff 100%)',
			}}
		>
			<Container maxWidth="xl">
				<Paper sx={{ p: 1.5, borderRadius: 2.5, mb: 1.2 }}>
					<Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'stretch', md: 'center' }}>
						<Button variant="outlined" onClick={() => router.push('/lesson-projects')} sx={{ textTransform: 'none' }}>
							Back to Lesson Projects
						</Button>
						<Typography sx={{ flex: 1, fontWeight: 700 }}>
							{slideshow.projectName} · Slide {safeIndex + 1} of {totalSlides}
						</Typography>
						<Button variant="outlined" disabled={safeIndex === 0} onClick={goToPrevious} sx={{ textTransform: 'none' }}>
							Previous
						</Button>
						<Button variant="contained" disabled={safeIndex >= totalSlides - 1} onClick={goToNext} sx={{ textTransform: 'none' }}>
							Next
						</Button>
					</Stack>
					<Typography sx={{ mt: 1, fontSize: '0.9rem', color: '#4b5563' }}>
						{currentSlide.activityName} ({currentSlide.activityType})
					</Typography>
				</Paper>

				<Paper sx={{ borderRadius: 2.5, overflow: 'hidden', border: '1px solid #dbe2f0' }}>
					<iframe
						title={`Lesson activity slide ${safeIndex + 1}`}
						src={currentSlide.url}
						style={{ width: '100%', height: '82vh', border: 0, background: '#fff' }}
					/>
				</Paper>
			</Container>
		</Box>
	);
}
