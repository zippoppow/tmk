'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Chip, Container, Paper, Stack, Typography } from '@mui/material';
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
import { DIY_LESSON_ACTIVITY_TYPES } from '../../../data/diy/diy-lesson-activity-types';

const LESSON_ACTIVITY_TYPES = DIY_LESSON_ACTIVITY_TYPES;

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
	const [isIframeFullscreen, setIsIframeFullscreen] = useState(false);
	const [isTransitionSaving, setIsTransitionSaving] = useState(false);
	const [transitionIntent, setTransitionIntent] = useState('');
	const hasInstalledHistoryGuard = useRef(false);
	const iframeRef = useRef(null);
	const fullscreenContainerRef = useRef(null);
	const [iframeHeight, setIframeHeight] = useState('82vh');
	const flushMessageCounterRef = useRef(0);
	const FLUSH_DRAFT_MESSAGE = 'TMK_FLUSH_LOCAL_DRAFT';
	const FLUSH_DRAFT_ACK_MESSAGE = 'TMK_FLUSH_LOCAL_DRAFT_ACK';
	const handleFullscreen = () => {
		const container = fullscreenContainerRef.current;
		if (container && container.requestFullscreen) {
			setIsIframeFullscreen(true);
			container.requestFullscreen();
			return;
		}

		const iframe = iframeRef.current;
		if (iframe && iframe.requestFullscreen) {
			setIsIframeFullscreen(true);
			iframe.requestFullscreen();
		}
	};

	const handleExitFullscreen = async () => {
		if (typeof document === 'undefined') {
			return;
		}

		if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
			try {
				await document.exitFullscreen();
			} catch {
				setIsIframeFullscreen(false);
			}
			return;
		}

		setIsIframeFullscreen(false);
	};

	const adjustIframeHeight = useCallback(() => {
		const iframe = iframeRef.current;
		if (!iframe) return;

		try {
			if (typeof window !== 'undefined') {
				const viewportPadding = isIframeFullscreen ? 120 : 170;
				const minHeight = isIframeFullscreen ? 420 : 520;
				const viewportTarget = Math.max(minHeight, window.innerHeight - viewportPadding);
				setIframeHeight((currentHeight) => {
					const nextHeight = `${viewportTarget}px`;
					return currentHeight === nextHeight ? currentHeight : nextHeight;
				});
			}
		} catch {
			// Ignore cross-document measurement issues and keep existing height.
		}
	}, [isIframeFullscreen]);

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
					projectId: String(projectId),
					activityIndex: String(activityIndex),
					slideshow: '1',
					slideshowClone: '1',
					cloneSeedKey,
					slideshowSessionId,
				});
				if (sourceActivityId) {
					params.set('activityId', sourceActivityId);
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
	}, [isClient, localDraftIds, localDraftRecords, projectId, selectedIndices, slideshowSessionId, standaloneIds, standaloneRecords]);

	const slides = slideshow.slides;
	const totalSlides = slides.length;
	const safeIndex = totalSlides === 0 ? 0 : Math.min(currentSlideIndex, totalSlides - 1);
	const currentSlide = totalSlides === 0 ? null : slides[safeIndex];
	const currentSlideSrc = useMemo(() => {
		if (!currentSlide?.url) {
			return '';
		}

		if (typeof window === 'undefined') {
			return currentSlide.url;
		}

		const url = new URL(currentSlide.url, window.location.origin);
		if (isIframeFullscreen) {
			url.searchParams.set('slideshowFullscreen', '1');
		} else {
			url.searchParams.delete('slideshowFullscreen');
		}

		return `${url.pathname}${url.search}`;
	}, [currentSlide?.url, isIframeFullscreen]);
	const isStandaloneMode = !projectId && (standaloneIds.length > 0 || localDraftIds.length > 0);
	const backRoute = isStandaloneMode ? '/lesson-activities' : '/lesson-projects';
	const backLabel = isStandaloneMode ? 'Back to Lesson Activities' : 'Back to Lesson Projects';

	const flushCurrentSlideDraft = useCallback(async () => {
		if (typeof window === 'undefined') {
			return;
		}

		const iframeWindow = iframeRef.current?.contentWindow;
		if (!iframeWindow) {
			return;
		}

		const requestId = `flush_${Date.now()}_${flushMessageCounterRef.current++}`;

		await new Promise((resolve) => {
			let settled = false;
			const timeoutId = window.setTimeout(() => {
				if (settled) {
					return;
				}
				settled = true;
				window.removeEventListener('message', handleAck);
				resolve();
			}, 450);

			const handleAck = (event) => {
				const payload = event?.data;
				if (!payload || payload.type !== FLUSH_DRAFT_ACK_MESSAGE) {
					return;
				}
				if (String(payload.requestId || '') !== requestId) {
					return;
				}
				if (event.source !== iframeWindow) {
					return;
				}

				if (settled) {
					return;
				}
				settled = true;
				window.clearTimeout(timeoutId);
				window.removeEventListener('message', handleAck);
				resolve();
			};

			window.addEventListener('message', handleAck);
			iframeWindow.postMessage(
				{
					type: FLUSH_DRAFT_MESSAGE,
					requestId,
				},
				window.location.origin
			);
		});
	}, []);

	const goToPrevious = async () => {
		setTransitionIntent('previous');
		setIsTransitionSaving(true);
		try {
			await flushCurrentSlideDraft();
			setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
		} finally {
			setIsTransitionSaving(false);
			setTransitionIntent('');
		}
	};

	const goToNext = async () => {
		setTransitionIntent('next');
		setIsTransitionSaving(true);
		try {
			await flushCurrentSlideDraft();
			setCurrentSlideIndex((prev) => Math.min(totalSlides - 1, prev + 1));
		} finally {
			setIsTransitionSaving(false);
			setTransitionIntent('');
		}
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

	const handleExitSlideshow = async () => {
		setTransitionIntent('exit');
		setIsTransitionSaving(true);
		try {
			await flushCurrentSlideDraft();

			if (typeof window === 'undefined') {
				setIsTransitionSaving(false);
				setTransitionIntent('');
				router.push(isStandaloneMode ? backRoute : '/lesson-projects');
				return;
			}

			const unsavedCloneDrafts = getUnsavedCloneDrafts();
			if (unsavedCloneDrafts.length > 0) {
				cleanupUnsavedCloneDrafts(unsavedCloneDrafts);
			}

			router.push(isStandaloneMode ? backRoute : '/lesson-projects');
		} finally {
			setIsTransitionSaving(false);
			setTransitionIntent('');
		}
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

			// const shouldExit = window.confirm(buildUnsavedExitMessage(unsavedCloneDrafts.length));
			// if (!shouldExit) {
			// 	window.history.pushState({ slideshowGuard: true }, '', window.location.href);
			// 	return;
			// }

			cleanupUnsavedCloneDrafts(unsavedCloneDrafts);
		};

		window.addEventListener('beforeunload', handleBeforeUnload);
		window.addEventListener('popstate', handlePopState);

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
			window.removeEventListener('popstate', handlePopState);
		};
	}, [isClient, slideshowSessionId]);

	useEffect(() => {
		if (!isClient || typeof window === 'undefined') {
			return;
		}

		const handleFullscreenChange = async () => {
			const isFullscreenNow = Boolean(document.fullscreenElement);

			// When user exits fullscreen (commonly via Escape), flush pending draft changes
			// before removing the fullscreen query flag, which reloads the iframe source.
			if (isIframeFullscreen && !isFullscreenNow) {
				setTransitionIntent('fullscreen-exit');
				setIsTransitionSaving(true);
				try {
					await flushCurrentSlideDraft();
				} finally {
					setIsTransitionSaving(false);
					setTransitionIntent('');
				}
			}

			setIsIframeFullscreen(isFullscreenNow);
			adjustIframeHeight();
		};
		document.addEventListener('fullscreenchange', handleFullscreenChange);

		const iframe = iframeRef.current;
		if (!iframe) {
			return () => {
				document.removeEventListener('fullscreenchange', handleFullscreenChange);
			};
		}

		const handleLoad = () => {
			adjustIframeHeight();
		};

		iframe.addEventListener('load', handleLoad);
		window.addEventListener('resize', adjustIframeHeight);

		const timerId = window.setTimeout(adjustIframeHeight, 250);

		return () => {
			window.clearTimeout(timerId);
			iframe.removeEventListener('load', handleLoad);
			window.removeEventListener('resize', adjustIframeHeight);
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
		};
	}, [currentSlideSrc, flushCurrentSlideDraft, isClient, isIframeFullscreen, safeIndex]);

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

	const transitionStatusLabel =
		transitionIntent === 'previous'
			? 'Loading previous slide...'
			: transitionIntent === 'next'
				? 'Loading next slide...'
				: transitionIntent === 'exit'
					? 'Leaving slideshow...'
					: transitionIntent === 'fullscreen-exit'
						? 'Exiting fullscreen...'
					: 'Working...';

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
				<Box
					ref={fullscreenContainerRef}
					sx={{
						display: 'flex',
						flexDirection: 'column',
						gap: 1.2,
						height: isIframeFullscreen ? '100dvh' : 'auto',
						width: '100%',
						backgroundColor: isIframeFullscreen ? '#edf2ff' : 'transparent',
						p: isIframeFullscreen ? 1 : 0,
						boxSizing: 'border-box',
					}}
				>
					<Paper sx={{ p: 1.5, borderRadius: 2.5, mb: 1.2 }}>
						{isTransitionSaving && (
							<Typography sx={{ mb: 1, color: '#4b5563', fontSize: '0.9rem', fontWeight: 600 }}>
								{transitionStatusLabel}
							</Typography>
						)}
						<Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'stretch', md: 'center' }}>
							<Button variant="outlined" onClick={handleExitSlideshow} disabled={isTransitionSaving} sx={{ textTransform: 'none' }}>
								{isTransitionSaving && transitionIntent === 'exit' ? 'Saving...' : backLabel}
							</Button>
							<Typography sx={{ flex: 1, fontWeight: 700 }}>
								{slideshow.projectName} · Slide {safeIndex + 1} of {totalSlides}
							</Typography>
							<Chip
								label="Temporary slideshow edits"
								size="small"
								sx={{
									height: 24,
									fontSize: '0.72rem',
									fontWeight: 700,
									backgroundColor: '#fef3c7',
									color: '#92400e',
									border: '1px solid #f59e0b',
								}}
							/>
							<Button variant="outlined" disabled={safeIndex === 0 || isTransitionSaving} onClick={goToPrevious} sx={{ textTransform: 'none' }}>
								{isTransitionSaving && transitionIntent === 'previous' ? 'Saving...' : 'Previous'}
							</Button>
							<Button variant="contained" disabled={safeIndex >= totalSlides - 1 || isTransitionSaving} onClick={goToNext} sx={{ textTransform: 'none' }}>
								{isTransitionSaving && transitionIntent === 'next' ? 'Saving...' : 'Next'}
							</Button>
							{!isIframeFullscreen && (
								<Button variant="outlined" onClick={handleFullscreen} disabled={isTransitionSaving} sx={{ textTransform: 'none', ml: { xs: 0, md: 1 } }}>
									Fullscreen
								</Button>
							)}
							{isIframeFullscreen && (
								<Button
									variant="outlined"
									color="warning"
									onClick={handleExitFullscreen}
									disabled={isTransitionSaving}
									sx={{ textTransform: 'none' }}
								>
									Exit Fullscreen
								</Button>
							)}
						</Stack>
						<Typography sx={{ mt: 1, fontSize: '0.9rem', color: '#4b5563' }}>
							{currentSlide.activityName} ({currentSlide.activityType})
						</Typography>
					</Paper>

					<Paper sx={{ borderRadius: 2.5, overflow: 'hidden', border: '1px solid #dbe2f0', flex: isIframeFullscreen ? 1 : 'none' }}>
						<iframe
							title={`Lesson activity slide ${safeIndex + 1}`}
							src={currentSlideSrc}
							style={{
								width: '100%',
								height: isIframeFullscreen ? '100%' : iframeHeight,
								border: 0,
								background: '#fff',
							}}
							ref={iframeRef}
							allow="fullscreen"
						/>
					</Paper>
				</Box>
			</Container>
		</Box>
	);
}
