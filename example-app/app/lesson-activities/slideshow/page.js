'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material';
import {
	deleteStandaloneDraftByLocalId,
	getAllStoredProjects,
	getStandaloneDraftByLocalId,
	listStandaloneDrafts,
	listLessonActivities,
	upsertSlideshowCloneSeed,
} from '../../components/lessonActivityHelpers';
import { resolveTmkApiOrigin } from '../../components/authHelpers';
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

function parseIdList(rawIds) {
	if (!rawIds) {
		return [];
	}

	return [...new Set(
		String(rawIds)
			.split(',')
			.map((value) => String(value || '').trim())
			.filter(Boolean)
	)];
}

function buildCloneSeedKey(prefix, uniquePart) {
	return `clone_${prefix}_${String(uniquePart || '').trim()}`;
}

export default function LessonActivitySlideshowPage() {
	const router = useRouter();
	const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
	const [isClient, setIsClient] = useState(false);
	const [slideshowSessionId, setSlideshowSessionId] = useState('');
	const [projectId, setProjectId] = useState('');
	const [selectedIndices, setSelectedIndices] = useState([]);
	const [standaloneIds, setStandaloneIds] = useState([]);
	const [localDraftIds, setLocalDraftIds] = useState([]);
	const [standaloneRecords, setStandaloneRecords] = useState([]);
	const [localDraftRecords, setLocalDraftRecords] = useState([]);
	const [loadingStandalone, setLoadingStandalone] = useState(false);
	const [standaloneLoadError, setStandaloneLoadError] = useState('');
	const hasInstalledHistoryGuard = useRef(false);

	useEffect(() => {
		setIsClient(true);
		if (typeof window === 'undefined') {
			return;
		}
		const params = new URLSearchParams(window.location.search);
		let sessionId = String(params.get('slideshowSessionId') || '').trim();
		if (!sessionId) {
			sessionId = `ss_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
			params.set('slideshowSessionId', sessionId);
			const nextUrl = `${window.location.pathname}?${params.toString()}`;
			window.history.replaceState({}, '', nextUrl);
		}
		setSlideshowSessionId(sessionId);
		setProjectId(String(params.get('projectId') || '').trim());
		setSelectedIndices(parseIndices(params.get('indices')));
		setStandaloneIds(parseIdList(params.get('standaloneIds')));
		setLocalDraftIds(parseIdList(params.get('localDraftIds')));
	}, []);

	useEffect(() => {
		if (!isClient || projectId || localDraftIds.length === 0) {
			setLocalDraftRecords([]);
			return;
		}

		const orderedDrafts = localDraftIds
			.map((localDraftId) => getStandaloneDraftByLocalId(localDraftId))
			.filter(Boolean);
		setLocalDraftRecords(orderedDrafts);
	}, [isClient, projectId, localDraftIds]);

	useEffect(() => {
		if (!isClient || typeof window === 'undefined') {
			return;
		}

		if (projectId || standaloneIds.length === 0) {
			setStandaloneRecords([]);
			setStandaloneLoadError('');
			setLoadingStandalone(false);
			return;
		}

		let cancelled = false;

		const loadStandaloneRecords = async () => {
			setLoadingStandalone(true);
			setStandaloneLoadError('');
			try {
				const records = await listLessonActivities(resolveTmkApiOrigin());
				if (cancelled) {
					return;
				}

				const byId = new Map(
					records.map((record) => [String(record?.id || '').trim(), record])
				);
				const ordered = standaloneIds
					.map((id) => byId.get(String(id)))
					.filter(Boolean);

				setStandaloneRecords(ordered);
			} catch (error) {
				if (!cancelled) {
					setStandaloneRecords([]);
					setStandaloneLoadError('Unable to load standalone lesson activities for slideshow.');
				}
			} finally {
				if (!cancelled) {
					setLoadingStandalone(false);
				}
			}
		};

		loadStandaloneRecords();

		return () => {
			cancelled = true;
		};
	}, [isClient, projectId, standaloneIds]);

	const slideshow = useMemo(() => {
		if (!isClient || typeof window === 'undefined') {
			return { projectName: '', slides: [] };
		}

		if (!projectId && standaloneIds.length === 0 && localDraftIds.length === 0) {
			return { projectName: '', slides: [] };
		}

		if (!projectId) {
			const savedSlides = standaloneRecords
				.map((activity, idx) => {
					const activityType = String(activity?.['tmk-template'] || activity?.formName || '');
					const route = getLessonActivityRoute(activityType);
					if (!route) {
						return null;
					}

					const sourceActivityId = String(activity?.id || '').trim();
					const cloneSeedKey = buildCloneSeedKey('saved', sourceActivityId || `${activityType}_${idx}`);
					upsertSlideshowCloneSeed(cloneSeedKey, {
						sourceType: 'standalone-saved',
						'tmk-template': activityType,
						'lesson-name': String(activity?.['lesson-name'] || `${activityType} activity`),
						'lesson-input-data': activity?.['lesson-input-data'] || {},
						sourceActivityId,
					});
					const params = new URLSearchParams({
						slideshow: '1',
						slideshowClone: '1',
						cloneSeedKey,
						slideshowSessionId,
					});

					return {
						activityIndex: -1,
						activityName: String(activity?.['lesson-name'] || `${activityType} activity`),
						activityType,
						url: `${route}?${params.toString()}`,
					};
				})
				.filter(Boolean);

			const stagedSlides = localDraftRecords
				.map((draft, idx) => {
					const activityType = String(draft?.['tmk-template'] || draft?.formName || '');
					const route = getLessonActivityRoute(activityType);
					if (!route) {
						return null;
					}

					const localDraftId = String(draft?.localDraftId || '').trim();
					const sourceActivityId = String(draft?.id || '').trim();
					const cloneSeedKey = buildCloneSeedKey('draft', localDraftId || `${activityType}_${idx}`);
					upsertSlideshowCloneSeed(cloneSeedKey, {
						sourceType: 'standalone-draft',
						'tmk-template': activityType,
						'lesson-name': String(draft?.['lesson-name'] || `${activityType} activity`),
						'lesson-input-data': draft?.['lesson-input-data'] || {},
						sourceActivityId,
						sourceLocalDraftId: localDraftId,
					});
					const params = new URLSearchParams({
						slideshow: '1',
						slideshowClone: '1',
						cloneSeedKey,
						slideshowSessionId,
					});

					return {
						activityIndex: -1,
						activityName: String(draft?.['lesson-name'] || `${activityType} activity`),
						activityType,
						url: `${route}?${params.toString()}`,
					};
				})
				.filter(Boolean);

			const slides = [...savedSlides, ...stagedSlides];

			return {
				projectName: 'Standalone Lesson Activities',
				slides,
			};
		}

		if (selectedIndices.length === 0) {
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

				const sourceActivityId = String(activity?.id || '').trim();
				const cloneSeedKey = buildCloneSeedKey('project', `${projectId}_${activityIndex}_${sourceActivityId || activityType}`);
				upsertSlideshowCloneSeed(cloneSeedKey, {
					sourceType: 'project',
					'tmk-template': activityType,
					'lesson-name': String(activity['lesson-name'] || `${activityType} activity`),
					'lesson-input-data': activity?.['lesson-input-data'] || {},
					sourceProjectId: projectId,
					sourceActivityIndex: activityIndex,
					sourceActivityId,
				});

				const params = new URLSearchParams({
					slideshow: '1',
					slideshowClone: '1',
					cloneSeedKey,
					slideshowSessionId,
				});

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
	}, [isClient, localDraftIds, localDraftRecords, projectId, selectedIndices, slideshowSessionId, standaloneIds, standaloneRecords]);

	const slides = slideshow.slides;
	const totalSlides = slides.length;
	const safeIndex = totalSlides === 0 ? 0 : Math.min(currentSlideIndex, totalSlides - 1);
	const currentSlide = totalSlides === 0 ? null : slides[safeIndex];
	const isStandaloneMode = !projectId && (standaloneIds.length > 0 || localDraftIds.length > 0);
	const backRoute = isStandaloneMode ? '/lesson-activities' : '/lesson-projects';
	const backLabel = isStandaloneMode ? 'Back to Lesson Activities' : 'Back to Lesson Projects';

	const goToPrevious = () => {
		setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
	};

	const goToNext = () => {
		setCurrentSlideIndex((prev) => Math.min(totalSlides - 1, prev + 1));
	};

	const getUnsavedCloneDrafts = () => {
		if (typeof window === 'undefined') {
			return [];
		}

		return listStandaloneDrafts().filter((record) => {
			if (!record || typeof record !== 'object') {
				return false;
			}

			const isCloneDraft = Boolean(record.isSlideshowClone);
			const sameSession = String(record.slideshowSessionId || '').trim() === String(slideshowSessionId || '').trim();
			const savedToApi = Boolean(record.savedToApi);
			return isCloneDraft && sameSession && !savedToApi;
		});
	};

	const buildUnsavedExitMessage = (count) => {
		return `You have ${count} copied activit${count === 1 ? 'y' : 'ies'} that have not been saved. If you exit now, those copies will not be saved. Continue?`;
	};

	const cleanupUnsavedCloneDrafts = (drafts) => {
		drafts.forEach((record) => {
			const localDraftId = String(record?.localDraftId || '').trim();
			if (localDraftId) {
				deleteStandaloneDraftByLocalId(localDraftId);
			}
		});
	};

	const handleExitSlideshow = () => {
		if (typeof window === 'undefined') {
			router.push(backRoute);
			return;
		}

		const unsavedCloneDrafts = getUnsavedCloneDrafts();

		if (unsavedCloneDrafts.length > 0) {
			const shouldExit = window.confirm(buildUnsavedExitMessage(unsavedCloneDrafts.length));
			if (!shouldExit) {
				return;
			}
			cleanupUnsavedCloneDrafts(unsavedCloneDrafts);
		}

		router.push(backRoute);
	};

	useEffect(() => {
		if (!isClient || typeof window === 'undefined') {
			return;
		}

		if (!hasInstalledHistoryGuard.current) {
			window.history.pushState({ slideshowGuard: true }, '', window.location.href);
			hasInstalledHistoryGuard.current = true;
		}

		const handleBeforeUnload = (event) => {
			const unsavedCloneDrafts = getUnsavedCloneDrafts();
			if (unsavedCloneDrafts.length === 0) {
				return;
			}

			event.preventDefault();
			event.returnValue = '';
		};

		const handlePopState = () => {
			const unsavedCloneDrafts = getUnsavedCloneDrafts();
			if (unsavedCloneDrafts.length === 0) {
				return;
			}

			const shouldExit = window.confirm(buildUnsavedExitMessage(unsavedCloneDrafts.length));
			if (!shouldExit) {
				window.history.pushState({ slideshowGuard: true }, '', window.location.href);
				return;
			}

			cleanupUnsavedCloneDrafts(unsavedCloneDrafts);
		};

		window.addEventListener('beforeunload', handleBeforeUnload);
		window.addEventListener('popstate', handlePopState);

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
			window.removeEventListener('popstate', handlePopState);
		};
	}, [isClient, slideshowSessionId]);

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

	if ((!projectId && standaloneIds.length === 0 && localDraftIds.length === 0) || (projectId && selectedIndices.length === 0)) {
		return (
			<Container maxWidth="md" sx={{ py: 4 }}>
				<Paper sx={{ p: 3, borderRadius: 2 }}>
					<Typography sx={{ fontWeight: 700, mb: 1.2 }}>Lesson Activity Slideshow</Typography>
					<Typography sx={{ color: '#555', mb: 2 }}>No lesson activities were selected for slideshow.</Typography>
					<Button variant="contained" onClick={handleExitSlideshow} sx={{ textTransform: 'none' }}>
						{backLabel}
					</Button>
				</Paper>
			</Container>
		);
	}

	if (isStandaloneMode && loadingStandalone) {
		return (
			<Container maxWidth="md" sx={{ py: 4 }}>
				<Paper sx={{ p: 3, borderRadius: 2 }}>
					<Typography sx={{ fontWeight: 700, mb: 1.2 }}>Lesson Activity Slideshow</Typography>
					<Typography sx={{ color: '#555' }}>Loading standalone lesson activities...</Typography>
				</Paper>
			</Container>
		);
	}

	if (isStandaloneMode && standaloneLoadError) {
		return (
			<Container maxWidth="md" sx={{ py: 4 }}>
				<Paper sx={{ p: 3, borderRadius: 2 }}>
					<Typography sx={{ fontWeight: 700, mb: 1.2 }}>Lesson Activity Slideshow</Typography>
					<Typography sx={{ color: '#555', mb: 2 }}>{standaloneLoadError}</Typography>
					<Button variant="contained" onClick={handleExitSlideshow} sx={{ textTransform: 'none' }}>
						{backLabel}
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
					<Button variant="contained" onClick={handleExitSlideshow} sx={{ textTransform: 'none' }}>
						{backLabel}
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
						<Button variant="outlined" onClick={handleExitSlideshow} sx={{ textTransform: 'none' }}>
							{backLabel}
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
