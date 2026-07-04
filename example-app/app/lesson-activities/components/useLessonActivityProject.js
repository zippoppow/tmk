'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	buildLessonActivityUpsertPayload,
	clearFormSessionData,
	createLessonActivity,
	createLessonActivityId,
	deleteLessonActivityById,
	deleteStandaloneDraftByActivityId,
	deleteStandaloneDraftByLocalId,
	extractLessonActivityFromResponsePayload,
	fetchLessonActivityById,
	getStandaloneDraftByActivityId,
	getStandaloneDraftByLocalId,
	getSlideshowCloneSeed,
	deleteSlideshowCloneSeed,
	isTemporaryLocalLessonActivityId,
	isTemporaryLocalProjectId,
	readFormSessionData,
	updateLessonActivityById,
	writeFormSessionData,
	DIY_PROJECTS_ENDPOINT,
	getAllStoredProjects,
	listStandaloneDrafts,
	saveStoredProjects,
	upsertStandaloneDraft,
} from '../../components/lessonActivityHelpers';
import {
	buildTeachableLogoutUrl,
	buildTeachableStartUrl,
	captureTeachableSessionFromUrl,
	fetchAuthenticatedUser,
	fetchWithTmkToken,
	fetchWithUserToken,
	resolveTmkApiOrigin,
} from '../../components/authHelpers';
import {
	getProjectLessonActivities,
} from '../../components/projectManagerModel';

export function useLessonActivityProject({
	formName,
	defaultActivityName,
	initialData,
	normalizeInputData,
}) {
	const router = useRouter();
	const normalizeInputDataRef = useRef(normalizeInputData);
	const [data, setData] = useState(initialData);
	const [authUser, setAuthUser] = useState(null);
	const [authLoading, setAuthLoading] = useState(true);
	const [authFromSuccessRedirect, setAuthFromSuccessRedirect] = useState(false);
	const [notice, setNotice] = useState({ open: false, severity: 'success', message: '' });
	const [projectId, setProjectId] = useState('');
	const [activityIndex, setActivityIndex] = useState(null);
	const [projectName, setProjectName] = useState('');
	const [activityName, setActivityName] = useState('');
	const [standaloneActivityId, setStandaloneActivityId] = useState('');
	const [localDraftId, setLocalDraftId] = useState('');
	const [isSaving, setIsSaving] = useState(false);
	const [isAddToProjectDialogOpen, setIsAddToProjectDialogOpen] = useState(false);
	const [availableLessonProjects, setAvailableLessonProjects] = useState([]);
	const [selectedProjectIdsForAdd, setSelectedProjectIdsForAdd] = useState([]);
	const latestDataRef = useRef(initialData);
	const latestActivityNameRef = useRef('');
	const latestStandaloneActivityIdRef = useRef('');
	const latestProjectIdRef = useRef('');
	const latestLocalDraftIdRef = useRef('');
	const isPresentationCloneRef = useRef(false);
	const flushLocalDraftRef = useRef(() => {});
	const slideshowCloneContextRef = useRef({ cloneSeedKey: '', isSlideshowClone: false });

	useEffect(() => {
		normalizeInputDataRef.current = normalizeInputData;
	}, [normalizeInputData]);

	const normalizeInput = (raw) => normalizeInputDataRef.current(raw);

	const projectApiOrigin = useMemo(() => resolveTmkApiOrigin(), []);

	const showNotice = (severity, message) => {
		setNotice({ open: true, severity, message });
	};

	const getSlideshowCloneContext = () => {
		if (typeof window === 'undefined') {
			return {
				isClone: false,
				cloneSeedKey: '',
				slideshowSessionId: '',
				cloneSeed: null,
			};
		}

		const url = new URL(window.location.href);
		const cloneSeedKey = String(url.searchParams.get('cloneSeedKey') || '').trim();
		const slideshowSessionId = String(url.searchParams.get('slideshowSessionId') || '').trim();
		const isClone = url.searchParams.get('slideshowClone') === '1';

		return {
			isClone,
			cloneSeedKey,
			slideshowSessionId,
			cloneSeed: cloneSeedKey ? getSlideshowCloneSeed(cloneSeedKey) : null,
		};
	};

	const loadAvailableLessonProjects = () => {
		const currentProjectId = String(projectId || '').trim();
		const projects = getAllStoredProjects()
			.filter((project) => String(project?.formName || '').trim() === 'lesson-activities-project')
			.map((project) => ({
				id: String(project?.id || '').trim(),
				name: String(project?.name || '').trim() || 'Untitled Project',
			}))
			.filter((project) => Boolean(project.id))
			.filter((project) => !currentProjectId || project.id !== currentProjectId);
		setAvailableLessonProjects(projects);
		return projects;
	};

	const buildDiyProjectsCollectionPayload = (projects) => {
		return {
			'diy-projects': projects.map((project) => {
				const now = Date.now();
				const createdAtMs = Number.isFinite(project?.createdAtMs) ? project.createdAtMs : now;
				const modifiedAtMs = Number.isFinite(project?.modifiedAtMs) ? project.modifiedAtMs : now;
				const projectName = String(project?.name || '').trim() || 'Untitled Project';
				const projectIdCandidate = String(project?.remoteId || project?.id || '').trim();
				const canonicalProjectId = projectIdCandidate && !isTemporaryLocalProjectId(projectIdCandidate)
					? projectIdCandidate
					: '';
				const projectClientRef = !canonicalProjectId && projectIdCandidate ? projectIdCandidate : '';
				const lessonActivities = getProjectLessonActivities(project, 'lesson-activities-project', (input) => input || {});

				return {
					...(canonicalProjectId ? { id: canonicalProjectId } : {}),
					...(projectClientRef ? { client_ref: projectClientRef } : {}),
					'project-name': projectName,
					'created-at': createdAtMs,
					'modified-at': modifiedAtMs,
					'lesson-activities': lessonActivities.map((activity) => {
						const activityIdCandidate = String(activity?.id || activity?.['lesson-activity-id'] || '').trim();
						const canonicalActivityId = activityIdCandidate && !isTemporaryLocalLessonActivityId(activityIdCandidate)
							? activityIdCandidate
							: '';
						const activityClientRef = !canonicalActivityId && activityIdCandidate ? activityIdCandidate : '';
						return {
							...(canonicalActivityId ? { id: canonicalActivityId } : {}),
							...(activityClientRef ? { client_ref: activityClientRef } : {}),
							'tmk-template': String(activity?.['tmk-template'] || 'lesson-activities-project'),
							'lesson-name': String(activity?.['lesson-name'] || projectName),
							'created-at': Number.isFinite(Number(activity?.['created-at']))
								? Number(activity['created-at'])
								: createdAtMs,
							'modified-at': Number.isFinite(Number(activity?.['modified-at']))
								? Number(activity['modified-at'])
								: modifiedAtMs,
							'lesson-input-data': activity?.['lesson-input-data'] && typeof activity['lesson-input-data'] === 'object' && !Array.isArray(activity['lesson-input-data'])
								? activity['lesson-input-data']
								: {},
						};
					}),
				};
			}),
		};
	};

	const syncAllLessonProjectsToCloud = async () => {
		const lessonProjects = getAllStoredProjects().filter(
			(project) => String(project?.formName || '').trim() === 'lesson-activities-project'
		);

		if (lessonProjects.length === 0) {
			const deleteResponse = await fetchWithTmkToken(DIY_PROJECTS_ENDPOINT, {
				method: 'DELETE',
			});
			return deleteResponse.ok || deleteResponse.status === 404;
		}

		const payload = buildDiyProjectsCollectionPayload(lessonProjects);
		const response = await fetchWithTmkToken(DIY_PROJECTS_ENDPOINT, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			const errorText = await response.text().catch(() => '');
			console.warn('DIY project collection sync failed from lesson activity save', {
				status: response.status,
				body: errorText.slice(0, 500),
			});
			return false;
		}

		const syncedAtIso = new Date().toISOString();
		const allProjects = getAllStoredProjects();
		let updatedAny = false;
		allProjects.forEach((project) => {
			if (String(project?.formName || '').trim() !== 'lesson-activities-project') {
				return;
			}
			project.syncedAt = syncedAtIso;
			updatedAny = true;
		});
		if (updatedAny) {
			saveStoredProjects(allProjects);
		}

		return true;
	};

	const persist = (nextData) => {
		if (isPresentationCloneRef.current) {
			return;
		}
		writeFormSessionData(formName, nextData);
	};

	const ensureStandaloneLocalDraftId = () => {
		if (latestProjectIdRef.current && !isPresentationCloneRef.current) {
			return '';
		}

		const existing = String(latestLocalDraftIdRef.current || '').trim();
		if (existing) {
			return existing;
		}

		const urlActivityId = typeof window !== 'undefined'
			? String(new URL(window.location.href).searchParams.get('activityId') || '').trim()
			: '';
		const existingActivityId = String(latestStandaloneActivityIdRef.current || urlActivityId || '').trim();
		if (existingActivityId) {
			const existingDraft = getStandaloneDraftByActivityId(existingActivityId);
			const existingDraftId = String(existingDraft?.localDraftId || '').trim();
			if (existingDraftId) {
				latestLocalDraftIdRef.current = existingDraftId;
				setLocalDraftId(existingDraftId);

				if (typeof window !== 'undefined') {
					const url = new URL(window.location.href);
					url.searchParams.set('localDraftId', existingDraftId);
					window.history.replaceState({}, '', url.toString());
				}

				return existingDraftId;
			}
		}

		const generated = createLessonActivityId();
		latestLocalDraftIdRef.current = generated;
		setLocalDraftId(generated);

		if (typeof window !== 'undefined') {
			const url = new URL(window.location.href);
			url.searchParams.set('localDraftId', generated);
			window.history.replaceState({}, '', url.toString());
		}

		return generated;
	};

	const persistStandaloneDraftRecord = ({
		nextData,
		nextActivityName,
		nextActivityId,
		markSaved = false,
	}) => {
		if (latestProjectIdRef.current && !isPresentationCloneRef.current) {
			return null;
		}

		const cloneContext = getSlideshowCloneContext();

		const normalizedInput = normalizeInput(nextData ?? latestDataRef.current);
		const resolvedActivityName = String((nextActivityName ?? latestActivityNameRef.current) || '').trim() || defaultActivityName;
		const urlActivityId = typeof window !== 'undefined'
			? String(new URL(window.location.href).searchParams.get('activityId') || '').trim()
			: '';
		const resolvedActivityId = String((nextActivityId ?? latestStandaloneActivityIdRef.current ?? urlActivityId) || '').trim();
		const existingLocalDraftId = String(latestLocalDraftIdRef.current || '').trim();

		const hasContentChanges = JSON.stringify(normalizedInput) !== JSON.stringify(normalizeInput(initialData));
		const hasCustomActivityName = resolvedActivityName !== defaultActivityName;
		const shouldPersistStandaloneDraft = Boolean(resolvedActivityId)
			|| Boolean(existingLocalDraftId)
			|| hasContentChanges
			|| hasCustomActivityName;

		if (!shouldPersistStandaloneDraft) {
			return null;
		}

		const resolvedLocalDraftId = ensureStandaloneLocalDraftId();
		if (!resolvedLocalDraftId) {
			return null;
		}

		const existingDraft = getStandaloneDraftByLocalId(resolvedLocalDraftId);
		const nextTemplate = String(formName || '').trim();
		const nextInputJson = JSON.stringify(normalizedInput);
		const existingInputJson = JSON.stringify(normalizeInput(existingDraft?.['lesson-input-data'] || {}));
		const existingLessonName = String(existingDraft?.['lesson-name'] || '').trim() || defaultActivityName;
		const existingTemplate = String(existingDraft?.['tmk-template'] || existingDraft?.formName || '').trim();
		const draftChanged = Boolean(existingDraft)
			&& (
				existingLessonName !== resolvedActivityName
				|| existingTemplate !== nextTemplate
				|| existingInputJson !== nextInputJson
			);
		return upsertStandaloneDraft({
			...(existingDraft || {}),
			localDraftId: resolvedLocalDraftId,
			id: resolvedActivityId,
			'tmk-template': nextTemplate,
			formName,
			'lesson-name': resolvedActivityName,
			'lesson-input-data': normalizedInput,
			'created-at': Number(existingDraft?.['created-at']) || Date.now(),
			'modified-at': Date.now(),
			isSlideshowClone: cloneContext.isClone,
			slideshowSessionId: cloneContext.slideshowSessionId,
			cloneSeedKey: cloneContext.cloneSeedKey,
			sourceType: cloneContext.cloneSeed?.sourceType || existingDraft?.sourceType,
			sourceProjectId: cloneContext.cloneSeed?.sourceProjectId || existingDraft?.sourceProjectId,
			sourceActivityIndex: cloneContext.cloneSeed?.sourceActivityIndex ?? existingDraft?.sourceActivityIndex,
			sourceActivityId: cloneContext.cloneSeed?.sourceActivityId || existingDraft?.sourceActivityId,
			sourceLocalDraftId: cloneContext.cloneSeed?.sourceLocalDraftId || existingDraft?.sourceLocalDraftId,
			savedToApi: markSaved || (Boolean(existingDraft?.savedToApi) && !draftChanged),
		});
	};

	const flushLocalDraft = () => {
		const normalizedInput = normalizeInput(latestDataRef.current);
		persist(normalizedInput);

		if (latestProjectIdRef.current) {
			return;
		}

		persistStandaloneDraftRecord({
			nextData: normalizedInput,
			nextActivityName: latestActivityNameRef.current,
			nextActivityId: latestStandaloneActivityIdRef.current,
			markSaved: false,
		});
	};

	useEffect(() => {
		flushLocalDraftRef.current = flushLocalDraft;
	});

	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}

		const handleMessage = (event) => {
			const payload = event?.data;
			if (!payload || payload.type !== 'TMK_FLUSH_LOCAL_DRAFT') {
				return;
			}

			flushLocalDraftRef.current?.();

			if (event.source && typeof event.source.postMessage === 'function') {
				event.source.postMessage(
					{
						type: 'TMK_FLUSH_LOCAL_DRAFT_ACK',
						requestId: String(payload.requestId || ''),
					},
					event.origin || '*'
				);
			}
		};

		window.addEventListener('message', handleMessage);
		return () => {
			window.removeEventListener('message', handleMessage);
		};
	}, []);

	useEffect(() => {
		latestDataRef.current = data;
	}, [data]);

	useEffect(() => {
		latestActivityNameRef.current = activityName;
	}, [activityName]);

	useEffect(() => {
		latestStandaloneActivityIdRef.current = standaloneActivityId;
	}, [standaloneActivityId]);

	useEffect(() => {
		latestProjectIdRef.current = projectId;
	}, [projectId]);

	useEffect(() => {
		latestLocalDraftIdRef.current = localDraftId;
	}, [localDraftId]);

	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}

		let cancelled = false;

		const hydrateFromContext = async () => {
			const url = new URL(window.location.href);
			const paramProjectId = url.searchParams.get('projectId') || '';
			const paramActivityIndex = url.searchParams.get('activityIndex');
			const parsedActivityIndex = Number(paramActivityIndex);
			const paramActivityId = (url.searchParams.get('activityId') || '').trim();
			const paramLocalDraftId = (url.searchParams.get('localDraftId') || '').trim();
			const isSlideshowClone = url.searchParams.get('slideshowClone') === '1';
			const cloneSeedKey = (url.searchParams.get('cloneSeedKey') || '').trim();
			const slideshowSessionId = String(url.searchParams.get('slideshowSessionId') || '').trim();
			isPresentationCloneRef.current = isSlideshowClone;

			if (isSlideshowClone && cloneSeedKey) {
				const existingCloneDraft = listStandaloneDrafts().find((record) => {
					if (!record || typeof record !== 'object') {
						return false;
					}
					return Boolean(record.isSlideshowClone)
						&& String(record.cloneSeedKey || '').trim() === cloneSeedKey
						&& String(record.slideshowSessionId || '').trim() === slideshowSessionId;
				});
				const existingDraft = paramLocalDraftId
					? getStandaloneDraftByLocalId(paramLocalDraftId)
					: existingCloneDraft;

				if (existingDraft) {
					const resolvedLocalDraftId = String(existingDraft.localDraftId || paramLocalDraftId || createLessonActivityId()).trim();
					const resolvedActivityId = String(existingDraft.id || paramActivityId || createLessonActivityId()).trim();
					setLocalDraftId(resolvedLocalDraftId);
					setStandaloneActivityId(resolvedActivityId);
					setActivityName(String(existingDraft['lesson-name'] || defaultActivityName));
					setData(normalizeInput(existingDraft['lesson-input-data'] || {}));

					const nextUrl = new URL(window.location.href);
					nextUrl.searchParams.set('activityId', resolvedActivityId);
					nextUrl.searchParams.set('localDraftId', resolvedLocalDraftId);
					window.history.replaceState({}, '', nextUrl.toString());
					return;
				}

				const cloneSeed = getSlideshowCloneSeed(cloneSeedKey);
				if (cloneSeed) {
					const clonedActivityId = createLessonActivityId();
					const resolvedLocalDraftId = createLessonActivityId();
					const clonedActivityName = String(cloneSeed['lesson-name'] || defaultActivityName);
					const clonedData = normalizeInput(cloneSeed['lesson-input-data'] || {});

					upsertStandaloneDraft({
						localDraftId: resolvedLocalDraftId,
						id: clonedActivityId,
						'tmk-template': String(cloneSeed['tmk-template'] || formName || '').trim(),
						formName,
						'lesson-name': clonedActivityName,
						'lesson-input-data': clonedData,
						'created-at': Date.now(),
						'modified-at': Date.now(),
						isSlideshowClone: true,
						slideshowSessionId,
						cloneSeedKey,
						sourceType: cloneSeed.sourceType,
						sourceProjectId: cloneSeed.sourceProjectId,
						sourceActivityIndex: cloneSeed.sourceActivityIndex,
						sourceActivityId: cloneSeed.sourceActivityId,
						sourceLocalDraftId: cloneSeed.sourceLocalDraftId,
						savedToApi: false,
					});

					setLocalDraftId(resolvedLocalDraftId);
					setStandaloneActivityId(clonedActivityId);
					setActivityName(clonedActivityName);
					setData(clonedData);

					const nextUrl = new URL(window.location.href);
					nextUrl.searchParams.set('activityId', clonedActivityId);
					nextUrl.searchParams.set('localDraftId', resolvedLocalDraftId);
					window.history.replaceState({}, '', nextUrl.toString());
					latestLocalDraftIdRef.current = resolvedLocalDraftId;
					return;
				}
			}

			if (!paramProjectId) {
				if (!cancelled) {
					setProjectId('');
					setActivityIndex(null);
					setProjectName('');
				}

				if (paramLocalDraftId) {
					setLocalDraftId(paramLocalDraftId);
				}

				const explicitLocalDraft = paramLocalDraftId
					? getStandaloneDraftByLocalId(paramLocalDraftId)
					: null;
				const fallbackDraftForActivity = paramActivityId
					? getStandaloneDraftByActivityId(paramActivityId)
					: null;
				const preferredLocalDraft = explicitLocalDraft || fallbackDraftForActivity;

				if (paramActivityId) {
					if (!cancelled) {
						// Keep editing bound to the existing standalone record even if cloud rehydrate fails.
						latestStandaloneActivityIdRef.current = paramActivityId;
						setStandaloneActivityId(paramActivityId);
					}

					if (preferredLocalDraft && !cancelled) {
						const resolvedLocalDraftId = String(preferredLocalDraft.localDraftId || paramLocalDraftId || createLessonActivityId());
						setLocalDraftId(resolvedLocalDraftId);
						setActivityName(String(preferredLocalDraft['lesson-name'] || defaultActivityName));
						setData(normalizeInput(preferredLocalDraft['lesson-input-data'] || {}));

						if (typeof window !== 'undefined') {
							const nextUrl = new URL(window.location.href);
							nextUrl.searchParams.set('activityId', paramActivityId);
							nextUrl.searchParams.set('localDraftId', resolvedLocalDraftId);
							window.history.replaceState({}, '', nextUrl.toString());
						}
						return;
					}

					const cloudActivity = await fetchLessonActivityById(projectApiOrigin, paramActivityId);
					if (cloudActivity && !cancelled) {
						const draftForActivity = getStandaloneDraftByActivityId(paramActivityId);
						const resolvedLocalDraftId = paramLocalDraftId || String(draftForActivity?.localDraftId || createLessonActivityId());
						setLocalDraftId(resolvedLocalDraftId);
						setStandaloneActivityId(String(cloudActivity.id || paramActivityId));
						setActivityName(String(cloudActivity['lesson-name'] || defaultActivityName));
						setData(normalizeInput(cloudActivity['lesson-input-data'] || {}));

						upsertStandaloneDraft({
							...(draftForActivity || {}),
							localDraftId: resolvedLocalDraftId,
							id: String(cloudActivity.id || paramActivityId),
							'tmk-template': String(cloudActivity['tmk-template'] || formName || '').trim(),
							formName,
							'lesson-name': String(cloudActivity['lesson-name'] || defaultActivityName),
							'lesson-input-data': normalizeInput(cloudActivity['lesson-input-data'] || {}),
							'created-at': Number(cloudActivity['created-at']) || Number(draftForActivity?.['created-at']) || Date.now(),
							'modified-at': Date.now(),
							savedToApi: true,
						});
					}
				}

				setLocalDraftId('');
				return;
			}

			const projects = getAllStoredProjects();
			const project = projects.find((item) => item.id === paramProjectId);
			if (!project) {
				showNotice('error', 'Project not found.');
				return;
			}

			setProjectName(project.name || 'Untitled Project');
			setProjectId(paramProjectId);
			const activities = getProjectLessonActivities(project, 'lesson-activities-project', (input) => input || {});

			let resolvedIndex = Number.isInteger(parsedActivityIndex) ? parsedActivityIndex : -1;
			if (resolvedIndex < 0 && paramActivityId) {
				resolvedIndex = activities.findIndex((activity) => String(activity?.id || '') === paramActivityId);
			}

			if (resolvedIndex < 0) {
				showNotice('error', 'Invalid activity context.');
				return;
			}

			setActivityIndex(resolvedIndex);
			let resolvedActivity = activities[resolvedIndex];

			if (paramActivityId) {
				const cloudActivity = await fetchLessonActivityById(projectApiOrigin, paramActivityId);
				if (cloudActivity && typeof cloudActivity === 'object') {
					resolvedActivity = {
						...resolvedActivity,
						...cloudActivity,
						id: String(cloudActivity.id || paramActivityId),
					};
					if (activities[resolvedIndex]) {
						activities[resolvedIndex] = resolvedActivity;
						project.lessonActivities = activities;
						saveStoredProjects(projects);
					}
				}
			}

			if (!resolvedActivity) {
				showNotice('error', 'Lesson activity not found.');
				return;
			}

			if (!cancelled) {
				setActivityName(String(resolvedActivity['lesson-name'] || defaultActivityName));
				setData(normalizeInput(resolvedActivity['lesson-input-data'] || {}));
			}
		};

		hydrateFromContext();

		return () => {
			cancelled = true;
		};
	}, [defaultActivityName, formName, projectApiOrigin]);

	useEffect(() => {
		const timeout = setTimeout(() => {
			const normalizedInput = normalizeInput(data);
			persist(normalizedInput);

			if (projectId && Number.isInteger(activityIndex)) {
				const projects = getAllStoredProjects();
				const project = projects.find((item) => item.id === projectId);
				if (!project) {
					return;
				}

				const activities = getProjectLessonActivities(project, 'lesson-activities-project', (input) => input || {});
				if (!activities[activityIndex]) {
					return;
				}

				activities[activityIndex] = {
					...activities[activityIndex],
					'lesson-name': activityName || activities[activityIndex]['lesson-name'] || defaultActivityName,
					'lesson-input-data': normalizedInput,
					'modified-at': Date.now(),
				};
				project.lessonActivities = activities;
				project.modifiedAtMs = Date.now();
				project.syncedAt = null;
				saveStoredProjects(projects);
				return;
			}

			persistStandaloneDraftRecord({
				nextData: normalizedInput,
				nextActivityName: activityName,
				nextActivityId: standaloneActivityId,
				markSaved: false,
			});
		}, 300);

		return () => clearTimeout(timeout);
	}, [activityIndex, activityName, data, defaultActivityName, projectId, standaloneActivityId]);

	// Cleanup presentation mode: delete clone seed when exiting slideshow
	useEffect(() => {
		return () => {
			const { cloneSeedKey, isSlideshowClone } = slideshowCloneContextRef.current;

			// If exiting a slideshow presentation, clean up the clone seed
			// (no localStorage draft to delete since we don't persist in presentation mode)
			if (isSlideshowClone && cloneSeedKey) {
				deleteSlideshowCloneSeed(cloneSeedKey);
			}
		};
	}, []);

	useEffect(() => {
		return () => {
			flushLocalDraftRef.current?.();
		};
	}, []);

	const runAuthCheck = async () => {
		setAuthLoading(true);
		try {
			const user = await fetchAuthenticatedUser();
			setAuthUser(user);
		} catch {
			setAuthUser(null);
		} finally {
			setAuthLoading(false);
		}
	};

	useEffect(() => {
		if (typeof window !== 'undefined') {
			// Capture teachable_session BEFORE cleaning URL params so token exchange has it available
			captureTeachableSessionFromUrl();

			const url = new URL(window.location.href);
			if (url.searchParams.get('auth') === 'success') {
				setAuthFromSuccessRedirect(true);
				showNotice('success', 'Teachable login successful.');
				url.searchParams.delete('auth');
				window.history.replaceState({}, '', url.toString());
			} else if (url.searchParams.get('auth') === 'error') {
				const rawMessage = url.searchParams.get('message');
				showNotice('error', rawMessage || 'Teachable login failed. Please try again.');
				url.searchParams.delete('auth');
				url.searchParams.delete('message');
				window.history.replaceState({}, '', url.toString());
			}

			// Capture presentation clone context early so it's available in cleanup effect
			const cloneSeedKey = String(url.searchParams.get('cloneSeedKey') || '').trim();
			const isSlideshowClone = url.searchParams.get('slideshowClone') === '1';
			slideshowCloneContextRef.current = { cloneSeedKey, isSlideshowClone };
		}

		runAuthCheck();
		loadAvailableLessonProjects();
	}, []);

	const handleLoginLogout = () => {
		if (authUser) {
			window.location.href = buildTeachableLogoutUrl('/');
			return;
		}
		window.location.href = buildTeachableStartUrl(window.location.href);
	};

	const handleSave = async () => {
		const routeProjectId = typeof window !== 'undefined'
			? String(new URL(window.location.href).searchParams.get('projectId') || '').trim()
			: '';
		const routeActivityIndexRaw = typeof window !== 'undefined'
			? new URL(window.location.href).searchParams.get('activityIndex')
			: null;
		const routeActivityIndex = Number(routeActivityIndexRaw);
		const resolvedProjectId = String(projectId || routeProjectId).trim();
		const resolvedActivityIndex = Number.isInteger(activityIndex)
			? activityIndex
			: (Number.isInteger(routeActivityIndex) ? routeActivityIndex : null);

		if (!resolvedProjectId || !Number.isInteger(resolvedActivityIndex)) {
			showNotice('error', 'No project context available.');
			return false;
		}

		if (!projectId && resolvedProjectId) {
			setProjectId(resolvedProjectId);
		}
		if (!Number.isInteger(activityIndex) && Number.isInteger(resolvedActivityIndex)) {
			setActivityIndex(resolvedActivityIndex);
		}

		setIsSaving(true);
		try {
			const projects = getAllStoredProjects();
			const project = projects.find((item) => item.id === resolvedProjectId);
			if (!project) {
				showNotice('error', 'Project not found.');
				setIsSaving(false);
				return false;
			}

			const activities = getProjectLessonActivities(project, 'lesson-activities-project', (input) => input || {});
			if (!activities[resolvedActivityIndex]) {
				showNotice('error', 'Lesson activity not found.');
				setIsSaving(false);
				return false;
			}

			const normalizedInput = normalizeInput(data);
			const activityId = String(activities[resolvedActivityIndex].id || createLessonActivityId());
			activities[resolvedActivityIndex] = {
				...activities[resolvedActivityIndex],
				id: activityId,
				'lesson-name': activityName || activities[resolvedActivityIndex]['lesson-name'] || defaultActivityName,
				'lesson-input-data': normalizedInput,
				'modified-at': Date.now(),
			};
			project.lessonActivities = activities;
			project.modifiedAtMs = Date.now();

			let resolvedAuthUser = authUser;
			if (!resolvedAuthUser) {
				resolvedAuthUser = await fetchAuthenticatedUser();
				if (resolvedAuthUser) {
					setAuthUser(resolvedAuthUser);
				}
			}

			if (resolvedAuthUser) {
				const persistedActivity = activities[resolvedActivityIndex] || {};
				const createdAtSource = persistedActivity['created-at'] || Date.now();
				const hasCanonicalActivityId = Boolean(activityId) && !isTemporaryLocalLessonActivityId(activityId);
				let activitySaveOk = false;

				const payload = buildLessonActivityUpsertPayload({
					id: activityId,
					template: formName,
					lessonName: activityName || persistedActivity['lesson-name'] || defaultActivityName,
					lessonInputData: normalizedInput,
					createdAt: createdAtSource,
					modifiedAt: Date.now(),
					extra: {
						formName,
					},
				});

				const activityResponse = hasCanonicalActivityId
					? await updateLessonActivityById(projectApiOrigin, activityId, {
						...payload,
						id: undefined,
						client_ref: undefined,
					})
					: await createLessonActivity(projectApiOrigin, {
						...payload,
						id: undefined,
						client_ref: activityId,
					});

				activitySaveOk = activityResponse.ok;

				if (!hasCanonicalActivityId && activityResponse.ok) {
					const activityPayload = await activityResponse.json().catch(() => ({}));
					const savedActivity = extractLessonActivityFromResponsePayload(activityPayload);
					const canonicalId = String(savedActivity?.id || '').trim();
					if (!canonicalId || isTemporaryLocalLessonActivityId(canonicalId)) {
						activitySaveOk = false;
					} else if (canonicalId !== activityId) {
						activities[resolvedActivityIndex] = {
							...activities[resolvedActivityIndex],
							id: canonicalId,
							'lesson-activity-id': canonicalId,
						};
						project.lessonActivities = activities;
					}
				}

				project.syncedAt = null;
				saveStoredProjects(projects);

				const projectSyncOk = await syncAllLessonProjectsToCloud();

		if (projectSyncOk && activitySaveOk) {
			showNotice('success', 'Lesson activity saved to database.');
			return true;
		}
				if (!activitySaveOk && projectSyncOk) {
					saveStoredProjects(projects);
					showNotice('warning', 'Saved locally and project synced, but activity canonical id was not returned.');
					return true;
				}

				if (activitySaveOk && !projectSyncOk) {
					saveStoredProjects(projects);
					showNotice('warning', 'Saved locally and activity saved to database, but project sync failed.');
					return true;
				}

				{
					saveStoredProjects(projects);
					showNotice('warning', 'Saved locally. Cloud save failed.');
					return true;
				}
			} else {
				saveStoredProjects(projects);
				showNotice('success', 'Saved locally.');
				return true;
			}
		} catch (error) {
			console.error('Save failed:', error);
			showNotice('error', 'Could not save lesson activity.');
			return false;
		} finally {
			setIsSaving(false);
		}
	};

	const handleSaveAndReturn = async () => {
		const didSave = await handleSave();
		if (didSave) {
			router.push('/lesson-projects?saved=project-activity');
		}
	};

	const handleSaveStandalone = async () => {
		const projectIdInUrl = typeof window !== 'undefined'
			? String(new URL(window.location.href).searchParams.get('projectId') || '').trim()
			: '';
		if (projectId || projectIdInUrl) {
			showNotice('info', 'Project-linked activity detected. Use project save.');
			return false;
		}

		let resolvedAuthUser = authUser;
		if (!resolvedAuthUser) {
			resolvedAuthUser = await fetchAuthenticatedUser();
			if (resolvedAuthUser) {
				setAuthUser(resolvedAuthUser);
			}
		}

		if (!resolvedAuthUser) {
			showNotice('error', 'Please login with Teachable to save standalone activities.');
			return false;
		}

		setIsSaving(true);
		try {
			const normalizedInput = normalizeInput(data);
			const urlActivityId = typeof window !== 'undefined'
				? String(new URL(window.location.href).searchParams.get('activityId') || '').trim()
				: '';
			const hadExistingId = Boolean(standaloneActivityId || urlActivityId);
			const activityId = String(standaloneActivityId || urlActivityId || createLessonActivityId());
			if (activityId && activityId !== standaloneActivityId) {
				setStandaloneActivityId(activityId);
			}

			const existingDraft = getStandaloneDraftByLocalId(localDraftId);
			const hasCanonicalStandaloneId = Boolean(activityId) && !isTemporaryLocalLessonActivityId(activityId);
			const shouldUpdateStandalone = hadExistingId && hasCanonicalStandaloneId;
			const payload = buildLessonActivityUpsertPayload({
				id: activityId,
				template: formName,
				lessonName: activityName || defaultActivityName,
				lessonInputData: normalizedInput,
				createdAt: Number(existingDraft?.['created-at']) || Date.now(),
				modifiedAt: Date.now(),
				extra: {
					formName,
				},
			});

			const response = shouldUpdateStandalone
				? await updateLessonActivityById(projectApiOrigin, activityId, {
					...payload,
					id: undefined,
					client_ref: undefined,
				})
				: await createLessonActivity(projectApiOrigin, {
					...payload,
					client_ref: activityId,
					id: undefined,
				});

			if (!response.ok) {
				if (response.status === 404 && shouldUpdateStandalone) {
					showNotice('error', 'Cloud activity id was not found (404). Please refresh lesson activities and reopen the saved record.');
					setIsSaving(false);
					return false;
				}
				showNotice('error', 'Could not save standalone lesson activity.');
				setIsSaving(false);
				return false;
			}

			let resolvedActivityId = activityId;
			if (!shouldUpdateStandalone) {
				const responsePayload = await response.json().catch(() => ({}));
				const savedRecord = extractLessonActivityFromResponsePayload(responsePayload);
				const canonicalId = String(savedRecord?.id || '').trim();
				if (canonicalId && !isTemporaryLocalLessonActivityId(canonicalId)) {
					resolvedActivityId = canonicalId;
				} else {
					showNotice('error', 'Create succeeded but canonical activity id was not returned. Please retry.');
					setIsSaving(false);
					return false;
				}
			}

			persist(normalizedInput);
			persistStandaloneDraftRecord({
				nextData: normalizedInput,
				nextActivityName: activityName || defaultActivityName,
				nextActivityId: resolvedActivityId,
				markSaved: true,
			});

			deleteStandaloneDraftByActivityId(activityId);
			if (localDraftId) {
				deleteStandaloneDraftByLocalId(localDraftId);
			}
			clearFormSessionData(formName);


			setStandaloneActivityId(resolvedActivityId);
			setLocalDraftId('');
			const url = new URL(window.location.href);
			url.searchParams.set('activityId', resolvedActivityId);
			url.searchParams.delete('localDraftId');
			window.history.replaceState({}, '', url.toString());
			showNotice('success', 'Standalone lesson activity saved.');
			return true;
		} catch (error) {
			console.error('Save standalone failed:', error);
			showNotice('error', 'Could not save standalone lesson activity.');
			return false;
		} finally {
			setIsSaving(false);
		}
	};

	const handleDeleteStandalone = async () => {
		if (!standaloneActivityId) {
			showNotice('error', 'No standalone activity selected.');
			return;
		}

		setIsSaving(true);
		try {
			// Always delete from local storage first, regardless of server result
			deleteStandaloneDraftByActivityId(standaloneActivityId);
			if (localDraftId) {
				deleteStandaloneDraftByLocalId(localDraftId);
			}
			clearFormSessionData(formName);

			// Then attempt to delete from server
			let serverDeleteSucceeded = false;
			try {
				const response = await deleteLessonActivityById(projectApiOrigin, standaloneActivityId);
				serverDeleteSucceeded = response?.ok || false;
			} catch (serverError) {
				console.warn('Server delete failed, but local storage was cleaned up:', serverError);
			}

			setStandaloneActivityId('');
		setLocalDraftId('');
		setActivityName('');
		setData(normalizeInput({}));
		const url = new URL(window.location.href);
		url.searchParams.delete('activityId');
		url.searchParams.delete('localDraftId');

			if (serverDeleteSucceeded) {
				showNotice('success', 'Standalone lesson activity deleted.');
			} else {
				showNotice('success', 'Activity deleted locally. Server sync may fail, but your local copy is now removed.');
			}
		} catch (error) {
			console.error('Delete standalone failed:', error);
			showNotice('error', 'Delete failed.');
		} finally {
			setIsSaving(false);
			router.push('/lesson-activities');
		}
	};

	const handleDeleteProjectActivity = async () => {
		if (!projectId || !Number.isInteger(activityIndex)) {
			showNotice('error', 'No project activity selected.');
			return;
		}

		setIsSaving(true);
		try {
			const projects = getAllStoredProjects();
			const project = projects.find((item) => item.id === projectId);
			if (!project) {
				showNotice('error', 'Project not found.');
				setIsSaving(false);
				return;
			}

			const activities = getProjectLessonActivities(project, 'lesson-activities-project', (input) => input || {});
			const activityToDelete = activities[activityIndex];
			if (!activityToDelete) {
				showNotice('error', 'Activity not found in project.');
				setIsSaving(false);
				return;
			}

			const activityId = String(activityToDelete.id || '').trim();

			// Delete from cloud if it has a saved ID
			if (activityId) {
				try {
					await deleteLessonActivityById(projectApiOrigin, activityId);
				} catch (cloudError) {
					console.warn('Could not delete from cloud:', cloudError);
				}
			}

			// Delete from local project storage
			activities.splice(activityIndex, 1);
			project.lessonActivities = activities;
			project['modified-at'] = Date.now();
			saveStoredProjects(projects);

			// Also delete any standalone drafts associated with this activity
			if (activityId) {
				deleteStandaloneDraftByActivityId(activityId);
			}

			clearFormSessionData(formName);
			setActivityIndex(null);
			setActivityName('');
			setData(normalizeInput({}));

			const url = new URL(window.location.href);
			url.searchParams.delete('activityIndex');
			url.searchParams.delete('activityId');
			window.history.replaceState({}, '', url.toString());

			showNotice('success', 'Lesson activity deleted from project.');
			// Navigate back to projects after deletion
			router.push('/lesson-projects');
		} catch (error) {
			console.error('Delete project activity failed:', error);
			showNotice('error', 'Delete failed.');
			setIsSaving(false);
		}
	};

	const handleGoToLessonProjects = () => {
		router.push('/lesson-projects');
	};

	const handleOpenAddToProjectDialog = () => {
		const projects = loadAvailableLessonProjects();
		if (projects.length === 0) {
			showNotice('warning', 'Create at least one lesson project before adding activities.');
			return;
		}
		setSelectedProjectIdsForAdd([]);
		setIsAddToProjectDialogOpen(true);
	};

	const handleCloseAddToProjectDialog = () => {
		setIsAddToProjectDialogOpen(false);
		setSelectedProjectIdsForAdd([]);
	};

	const handleAddToProject = () => {
		handleOpenAddToProjectDialog();
	};

	const handleConfirmAddToProjects = async () => {
		if (selectedProjectIdsForAdd.length === 0) {
			showNotice('info', 'Select at least one project.');
			return;
		}

		const currentProjectId = String(projectId || '').trim();
		const uniqueProjectIds = [...new Set(selectedProjectIdsForAdd)]
			.map((id) => String(id || '').trim())
			.filter(Boolean)
			.filter((id) => !currentProjectId || id !== currentProjectId);

		if (uniqueProjectIds.length === 0) {
			showNotice('info', 'Select at least one other project.');
			return;
		}

		const normalizedInput = normalizeInput(data);
		let lessonName = String(activityName || defaultActivityName).trim() || defaultActivityName;
		let activityId = '';
		let originalTemporaryActivityId = '';
		let activityCreatedAt = Date.now();
		let activityModifiedAt = Date.now();
		const projects = getAllStoredProjects();

		if (projectId && Number.isInteger(activityIndex)) {
			const sourceProject = projects.find((item) => item.id === projectId && item.formName === 'lesson-activities-project');
			const sourceActivities = sourceProject
				? getProjectLessonActivities(sourceProject, 'lesson-activities-project', (input) => input || {})
				: [];
			const sourceActivity = sourceActivities[activityIndex] || null;
			activityId = String(sourceActivity?.id || createLessonActivityId()).trim();
			activityCreatedAt = Number(sourceActivity?.['created-at']) || activityCreatedAt;
			activityModifiedAt = Date.now();
			lessonName = String(activityName || sourceActivity?.['lesson-name'] || defaultActivityName).trim() || defaultActivityName;

			if (sourceProject && sourceActivity) {
				sourceActivities[activityIndex] = {
					...sourceActivity,
					id: activityId,
					'tmk-template': formName,
					'lesson-name': lessonName,
					'lesson-input-data': normalizedInput,
					'modified-at': Date.now(),
				};
				sourceProject.lessonActivities = sourceActivities;
				sourceProject.modifiedAtMs = Date.now();
				sourceProject.syncedAt = null;
			}
		} else {
			const urlActivityId = typeof window !== 'undefined'
				? String(new URL(window.location.href).searchParams.get('activityId') || '').trim()
				: '';
			activityId = String(standaloneActivityId || urlActivityId || createLessonActivityId()).trim();
			if (activityId && isTemporaryLocalLessonActivityId(activityId)) {
				originalTemporaryActivityId = activityId;
			}
			if (activityId && activityId !== standaloneActivityId) {
				setStandaloneActivityId(activityId);
			}
		}

		const fingerprint = `${formName}::${lessonName}::${JSON.stringify(normalizedInput)}`;
		let addedCount = 0;
		let updatedCount = 0;
		let duplicateCount = 0;

		uniqueProjectIds.forEach((targetProjectId) => {
			const project = projects.find((item) => item.id === targetProjectId && item.formName === 'lesson-activities-project');
			if (!project) {
				return;
			}

			const activities = getProjectLessonActivities(project, 'lesson-activities-project', (input) => input || {});
			const sameIdIndex = activities.findIndex((activity) => String(activity?.id || '').trim() === activityId);
			const sameFingerprintIndex = activities.findIndex((activity) => {
				const existingType = String(activity?.['tmk-template'] || '').trim();
				const existingName = String(activity?.['lesson-name'] || '').trim();
				const existingData = JSON.stringify(activity?.['lesson-input-data'] || {});
				return `${existingType}::${existingName}::${existingData}` === fingerprint;
			});
			const existingIndex = sameIdIndex >= 0 ? sameIdIndex : sameFingerprintIndex;

			if (existingIndex >= 0) {
				const now = Date.now();
				const existing = activities[existingIndex] || {};
				activities[existingIndex] = {
					...existing,
					id: activityId,
					'tmk-template': formName,
					'lesson-name': lessonName,
					'lesson-input-data': normalizedInput,
					'created-at': Number(existing?.['created-at']) || now,
					'modified-at': now,
				};
				project.lessonActivities = activities;
				project.modifiedAtMs = now;
				project.syncedAt = null;
				duplicateCount += 1;
				updatedCount += 1;
				return;
			}

			const now = Date.now();
			project.lessonActivities = [
				...activities,
				{
					id: activityId,
					'tmk-template': formName,
					'lesson-name': lessonName,
					'created-at': now,
					'modified-at': now,
					'lesson-input-data': normalizedInput,
				},
			];
			project.modifiedAtMs = now;
			project.syncedAt = null;
			addedCount += 1;
		});

		if (addedCount === 0 && updatedCount === 0) {
			showNotice('info', duplicateCount > 0 ? 'Selected activity already exists in the selected project(s).' : 'No projects were updated.');
			return;
		}

		saveStoredProjects(projects);
		loadAvailableLessonProjects();

		let syncFailureCount = 0;
		let activitySyncFailed = false;
		let resolvedAuthUser = authUser;
		if (!resolvedAuthUser) {
			resolvedAuthUser = await fetchAuthenticatedUser();
			if (resolvedAuthUser) {
				setAuthUser(resolvedAuthUser);
			}
		}

		if (resolvedAuthUser) {
			try {
				let remappedCanonicalId = false;
				const payload = buildLessonActivityUpsertPayload({
					id: activityId,
					template: formName,
					lessonName,
					lessonInputData: normalizedInput,
					createdAt: activityCreatedAt,
					modifiedAt: activityModifiedAt,
					extra: {
						formName,
					},
				});

				const shouldUpdateActivity = Boolean(activityId) && !isTemporaryLocalLessonActivityId(activityId);
				const activityResponse = shouldUpdateActivity
					? await updateLessonActivityById(projectApiOrigin, activityId, {
						...payload,
						id: undefined,
						client_ref: undefined,
					})
					: await createLessonActivity(projectApiOrigin, {
						...payload,
						client_ref: activityId,
						id: undefined,
					});
				if (!activityResponse.ok) {
					activitySyncFailed = true;
				} else if (!shouldUpdateActivity) {
					const responsePayload = await activityResponse.json().catch(() => ({}));
					const savedActivity = extractLessonActivityFromResponsePayload(responsePayload);
					const canonicalId = String(savedActivity?.id || '').trim();
					if (!canonicalId || isTemporaryLocalLessonActivityId(canonicalId)) {
						activitySyncFailed = true;
					} else if (canonicalId !== activityId) {
						projects.forEach((project) => {
							if (!Array.isArray(project?.lessonActivities)) {
								return;
							}
							project.lessonActivities = project.lessonActivities.map((activity) => {
								const existingId = String(activity?.id || '').trim();
								if (!existingId || existingId !== activityId) {
									return activity;
								}
								return {
									...activity,
									id: canonicalId,
									'lesson-activity-id': canonicalId,
								};
							});
						});
						activityId = canonicalId;
						remappedCanonicalId = true;
					}
				}

				if (remappedCanonicalId) {
					saveStoredProjects(projects);
				}
			} catch {
				activitySyncFailed = true;
			}

			const projectSyncOk = await syncAllLessonProjectsToCloud();
			if (!projectSyncOk) {
				syncFailureCount += 1;
			}
		}

		handleCloseAddToProjectDialog();

		const routeProjectId = typeof window !== 'undefined'
			? String(new URL(window.location.href).searchParams.get('projectId') || '').trim()
			: '';
		const hasProjectContext = Boolean(String(projectId || routeProjectId).trim());

		if (!hasProjectContext) {
			if (originalTemporaryActivityId) {
				deleteStandaloneDraftByActivityId(originalTemporaryActivityId);
			}
			deleteStandaloneDraftByActivityId(activityId);
			if (localDraftId) {
				deleteStandaloneDraftByLocalId(localDraftId);
			}
			clearFormSessionData(formName);
			setLocalDraftId('');
			setStandaloneActivityId('');
		}

		if (!hasProjectContext) {
			router.push('/lesson-projects?saved=added-to-project');
			return;
		}

		if (syncFailureCount > 0 || activitySyncFailed) {
			const failureCount = syncFailureCount + (activitySyncFailed ? 1 : 0);
			showNotice('warning', `Added or updated activity in ${addedCount + updatedCount} project${addedCount + updatedCount === 1 ? '' : 's'}, but ${failureCount} cloud sync operation${failureCount === 1 ? '' : 's'} failed.`);
			return;
		}

		if (updatedCount > 0 || duplicateCount > 0) {
			showNotice('success', `Added activity to ${addedCount} project${addedCount === 1 ? '' : 's'} and updated ${updatedCount} existing project activit${updatedCount === 1 ? 'y' : 'ies'}.`);
			return;
		}

		showNotice('success', `Added activity to ${addedCount} project${addedCount === 1 ? '' : 's'}.`);
	};

	const handleDownloadPdf = () => {
		window.print();
	};

	return {
		data,
		setData,
		authUser,
		authLoading,
		authFromSuccessRedirect,
		notice,
		setNotice,
		showNotice,
		projectId,
		projectName,
		activityName,
		setActivityName,
		isSaving,
		runAuthCheck,
		handleLoginLogout,
		handleSave,
		handleSaveAndReturn,
		standaloneActivityId,
		localDraftId,
		flushLocalDraft,
		handleSaveStandalone,
		handleDeleteStandalone,
		handleDeleteProjectActivity,
		handleGoToLessonProjects,
		handleAddToProject,
		handleOpenAddToProjectDialog,
		handleCloseAddToProjectDialog,
		handleConfirmAddToProjects,
		handleDownloadPdf,
		isAddToProjectDialogOpen,
		availableLessonProjects,
		selectedProjectIdsForAdd,
		setSelectedProjectIdsForAdd,
	};
}
