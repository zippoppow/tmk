'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	buildLessonActivityUpsertPayload,
	clearFormSessionData,
	createLessonActivityId,
	deleteLessonActivityById,
	deleteStandaloneDraftByActivityId,
	deleteStandaloneDraftByLocalId,
	fetchLessonActivityById,
	getStandaloneDraftByActivityId,
	getStandaloneDraftByLocalId,
	getSlideshowCloneSeed,
	deleteSlideshowCloneSeed,
	upsertLessonActivity,
	readFormSessionData,
	writeFormSessionData,
	DIY_PROJECTS_ENDPOINT,
	getAllStoredProjects,
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
	buildDiyProjectsPayload,
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
		if (isPresentationCloneRef.current) {
			return;
		}

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
			const paramActivityId = (url.searchParams.get('activityId') || '').trim();
			const paramLocalDraftId = (url.searchParams.get('localDraftId') || '').trim();
			const isSlideshowClone = url.searchParams.get('slideshowClone') === '1';
			const cloneSeedKey = (url.searchParams.get('cloneSeedKey') || '').trim();
			isPresentationCloneRef.current = isSlideshowClone;

			if (isSlideshowClone && cloneSeedKey) {
				const existingDraft = paramLocalDraftId
					? getStandaloneDraftByLocalId(paramLocalDraftId)
					: paramActivityId
						? getStandaloneDraftByActivityId(paramActivityId)
						: null;

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
					const cloneDraft = upsertStandaloneDraft({
						localDraftId: resolvedLocalDraftId,
						id: clonedActivityId,
						'tmk-template': String(cloneSeed['tmk-template'] || formName || '').trim(),
						formName,
						'lesson-name': clonedActivityName,
						'lesson-input-data': clonedData,
						'created-at': Date.now(),
						'modified-at': Date.now(),
						isSlideshowClone: true,
						slideshowSessionId: String(url.searchParams.get('slideshowSessionId') || '').trim(),
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
					if (cloneDraft) {
						latestLocalDraftIdRef.current = resolvedLocalDraftId;
					}
					return;
				}
			}

			if (!paramProjectId) {
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

						if (typeof window !== 'undefined') {
							const nextUrl = new URL(window.location.href);
							nextUrl.searchParams.set('activityId', String(cloudActivity.id || paramActivityId));
							nextUrl.searchParams.set('localDraftId', resolvedLocalDraftId);
							window.history.replaceState({}, '', nextUrl.toString());
						}
						return;
					}

					const draftForActivity = getStandaloneDraftByActivityId(paramActivityId);
					if (draftForActivity && !cancelled) {
						const resolvedLocalDraftId = paramLocalDraftId || String(draftForActivity.localDraftId || createLessonActivityId());
						setLocalDraftId(resolvedLocalDraftId);
						setActivityName(String(draftForActivity['lesson-name'] || defaultActivityName));
						setData(normalizeInput(draftForActivity['lesson-input-data'] || {}));

						if (typeof window !== 'undefined') {
							const nextUrl = new URL(window.location.href);
							nextUrl.searchParams.set('activityId', paramActivityId);
							nextUrl.searchParams.set('localDraftId', resolvedLocalDraftId);
							window.history.replaceState({}, '', nextUrl.toString());
						}
						return;
					}
				}

				if (paramLocalDraftId) {
					const stagedDraft = getStandaloneDraftByLocalId(paramLocalDraftId);
					if (stagedDraft && !cancelled) {
						setLocalDraftId(paramLocalDraftId);
						setStandaloneActivityId(String(stagedDraft.id || ''));
						setActivityName(String(stagedDraft['lesson-name'] || defaultActivityName));
						setData(normalizeInput(stagedDraft['lesson-input-data'] || {}));
						return;
					}
				}

				setLocalDraftId('');
				return;
			}

			const parsedIndex = Number.parseInt(paramActivityIndex || '', 10);
			setProjectId(paramProjectId);

			const projects = getAllStoredProjects();
			const project = projects.find((item) => item.id === paramProjectId);
			if (!project) {
				showNotice('error', 'Project not found.');
				return;
			}

			setProjectName(project.name || 'Untitled Project');
			const activities = getProjectLessonActivities(project, 'lesson-activities-project', (input) => input || {});

			let resolvedIndex = Number.isInteger(parsedIndex) ? parsedIndex : -1;
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

			// In presentation mode: skip saving to draft storage
			// (allows only in-memory/temporary debounced updates)
			if (isPresentationCloneRef.current) {
				return;
			}

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

	// Cleanup presentation mode: delete clone seed and draft when exiting slideshow
	useEffect(() => {
		return () => {
			if (typeof window === 'undefined') {
				return;
			}

			const url = new URL(window.location.href);
			const cloneSeedKey = String(url.searchParams.get('cloneSeedKey') || '').trim();
			const isSlideshowClone = url.searchParams.get('slideshowClone') === '1';

			// If exiting a slideshow presentation, clean up the temporary clone
			if (isSlideshowClone && cloneSeedKey && latestLocalDraftIdRef.current) {
				// Delete the temporary draft created for presentation
				deleteStandaloneDraftByLocalId(latestLocalDraftIdRef.current);
				// Delete the clone seed so it doesn't persist after slideshow
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
		if (!projectId || !Number.isInteger(activityIndex)) {
			showNotice('error', 'No project context available.');
			return false;
		}

		setIsSaving(true);
		try {
			const projects = getAllStoredProjects();
			const project = projects.find((item) => item.id === projectId);
			if (!project) {
				showNotice('error', 'Project not found.');
				setIsSaving(false);
				return false;
			}

			const activities = getProjectLessonActivities(project, 'lesson-activities-project', (input) => input || {});
			if (!activities[activityIndex]) {
				showNotice('error', 'Lesson activity not found.');
				setIsSaving(false);
				return false;
			}

			const normalizedInput = normalizeInput(data);
			const activityId = String(activities[activityIndex].id || createLessonActivityId());
			activities[activityIndex] = {
				...activities[activityIndex],
				id: activityId,
				'lesson-name': activityName || activities[activityIndex]['lesson-name'] || defaultActivityName,
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
				const persistedActivity = activities[activityIndex] || {};
				const createdAtSource = persistedActivity['created-at'] || Date.now();

				const activityResponse = await upsertLessonActivity(
					projectApiOrigin,
					buildLessonActivityUpsertPayload({
						id: activityId,
						template: formName,
						lessonName: activityName || persistedActivity['lesson-name'] || defaultActivityName,
						lessonInputData: normalizedInput,
						createdAt: createdAtSource,
						modifiedAt: Date.now(),
						extra: {
							formName,
						},
					})
				);

				project.syncedAt = null;
				saveStoredProjects(projects);

				const payload = buildDiyProjectsPayload({
					project,
					formName: 'lesson-activities-project',
					normalizeLessonInputData: (input) => input || {},
				});

			const response = await fetchWithTmkToken(DIY_PROJECTS_ENDPOINT, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});

			if (!response.ok) {
				const errorText = await response.text().catch(() => '');
				console.warn('DIY project sync failed from lesson activity save', {
					status: response.status,
					body: errorText.slice(0, 500),
				});
			}

		if (response.ok && activityResponse.ok) {
			const result = await response.json().catch(() => null);
			const updated = getAllStoredProjects();
			const updatedProject = updated.find((item) => item.id === projectId);
			if (updatedProject) {
				updatedProject.syncedAt = new Date().toISOString();
				if (result?.id) {
					updatedProject.remoteId = result.id;
				}
				saveStoredProjects(updated);
			}
			showNotice('success', 'Lesson activity saved to database.');
			return true;
		}
				if (!activityResponse.ok && response.ok) {
					saveStoredProjects(projects);
					showNotice('warning', 'Saved locally and project synced, but activity record save failed.');
					return true;
				}

				if (activityResponse.ok && !response.ok) {
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

			const response = await upsertLessonActivity(
				projectApiOrigin,
				buildLessonActivityUpsertPayload({
					id: activityId,
					template: formName,
					lessonName: activityName || defaultActivityName,
					lessonInputData: normalizedInput,
					createdAt: Number(getStandaloneDraftByLocalId(localDraftId)?.['created-at']) || Date.now(),
					modifiedAt: Date.now(),
					extra: {
						formName,
					},
				})
			);

			if (!response.ok) {
				showNotice('error', 'Could not save standalone lesson activity.');
				setIsSaving(false);
				return false;
			}

			persist(normalizedInput);
			persistStandaloneDraftRecord({
				nextData: normalizedInput,
				nextActivityName: activityName || defaultActivityName,
				nextActivityId: activityId,
				markSaved: true,
			});

			deleteStandaloneDraftByActivityId(activityId);
			if (localDraftId) {
				deleteStandaloneDraftByLocalId(localDraftId);
			}
			clearFormSessionData(formName);


			setStandaloneActivityId(activityId);
			setLocalDraftId('');
			const url = new URL(window.location.href);
			url.searchParams.set('activityId', activityId);
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

		const shouldDelete = window.confirm('Delete this standalone lesson activity? This cannot be undone.');
		if (!shouldDelete) {
			return;
		}

		setIsSaving(true);
		try {
			const response = await deleteLessonActivityById(projectApiOrigin, standaloneActivityId);
			if (!response.ok) {
				showNotice('error', 'Delete failed.');
				setIsSaving(false);
				return;
			}

			deleteStandaloneDraftByActivityId(standaloneActivityId);
			if (localDraftId) {
				deleteStandaloneDraftByLocalId(localDraftId);
			}
			clearFormSessionData(formName);

			setStandaloneActivityId('');
			let nextLocalDraftId = '';
			if (isPresentationCloneRef.current) {
				setLocalDraftId('');
			} else {
				nextLocalDraftId = createLessonActivityId();
				setLocalDraftId(nextLocalDraftId);
			}
			setActivityName('');
			setData(normalizeInput({}));
			const url = new URL(window.location.href);
			url.searchParams.delete('activityId');
			if (isPresentationCloneRef.current) {
				url.searchParams.delete('localDraftId');
			} else {
				url.searchParams.set('localDraftId', nextLocalDraftId);
			}
			window.history.replaceState({}, '', url.toString());
			showNotice('success', 'Standalone lesson activity deleted.');
		} catch (error) {
			console.error('Delete standalone failed:', error);
			showNotice('error', 'Delete failed.');
		} finally {
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

		if (projectId && Number.isInteger(activityIndex)) {
			const sourceProject = getAllStoredProjects().find((item) => item.id === projectId && item.formName === 'lesson-activities-project');
			const sourceActivities = sourceProject
				? getProjectLessonActivities(sourceProject, 'lesson-activities-project', (input) => input || {})
				: [];
			const sourceActivity = sourceActivities[activityIndex] || null;
			activityId = String(sourceActivity?.id || createLessonActivityId()).trim();
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
			if (activityId && activityId !== standaloneActivityId) {
				setStandaloneActivityId(activityId);
			}
		}

		const projects = getAllStoredProjects();
		const fingerprint = `${formName}::${lessonName}::${JSON.stringify(normalizedInput)}`;
		const touchedProjects = [];
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
				if (!touchedProjects.includes(project)) {
					touchedProjects.push(project);
				}
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
			touchedProjects.push(project);
			addedCount += 1;
		});

		if (addedCount === 0 && updatedCount === 0) {
			showNotice('info', duplicateCount > 0 ? 'Selected activity already exists in the selected project(s).' : 'No projects were updated.');
			return;
		}

		saveStoredProjects(projects);
		loadAvailableLessonProjects();

		let syncFailureCount = 0;
		let resolvedAuthUser = authUser;
		if (!resolvedAuthUser) {
			resolvedAuthUser = await fetchAuthenticatedUser();
			if (resolvedAuthUser) {
				setAuthUser(resolvedAuthUser);
			}
		}

		if (resolvedAuthUser) {
			for (const project of touchedProjects) {
				try {
					const payload = buildDiyProjectsPayload({
						project,
						formName: 'lesson-activities-project',
						normalizeLessonInputData: (input) => input || {},
					});
					const response = await fetchWithTmkToken(DIY_PROJECTS_ENDPOINT, {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(payload),
					});
					if (!response.ok) {
						syncFailureCount += 1;
					}
				} catch {
					syncFailureCount += 1;
				}
			}
		}

		handleCloseAddToProjectDialog();

		if (!projectId) {
			deleteStandaloneDraftByActivityId(activityId);
			if (localDraftId) {
				deleteStandaloneDraftByLocalId(localDraftId);
			}
			clearFormSessionData(formName);
			setLocalDraftId('');
			setStandaloneActivityId('');
		}

		if (!projectId) {
			router.push('/lesson-projects?saved=added-to-project');
			return;
		}

		if (syncFailureCount > 0) {
			showNotice('warning', `Added or updated activity in ${addedCount + updatedCount} project${addedCount + updatedCount === 1 ? '' : 's'}, but ${syncFailureCount} cloud sync operation${syncFailureCount === 1 ? '' : 's'} failed.`);
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
