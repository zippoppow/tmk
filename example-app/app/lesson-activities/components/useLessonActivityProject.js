'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	buildLessonActivityUpsertPayload,
	createLessonActivityId,
	deleteLessonActivityById,
	fetchLessonActivityById,
	upsertLessonActivity,
	readFormSessionData,
	writeFormSessionData,
	DIY_PROJECTS_ENDPOINT,
	getAllStoredProjects,
	saveStoredProjects,
} from '../../components/lessonActivityHelpers';
import {
	buildTeachableLogoutUrl,
	buildTeachableStartUrl,
	fetchAuthenticatedUser,
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
	const [isSaving, setIsSaving] = useState(false);

	const projectApiOrigin = useMemo(() => resolveTmkApiOrigin(), []);

	const showNotice = (severity, message) => {
		setNotice({ open: true, severity, message });
	};

	const persist = (nextData) => {
		writeFormSessionData(formName, nextData);
	};

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

			if (!paramProjectId) {
				if (paramActivityId) {
					const cloudActivity = await fetchLessonActivityById(projectApiOrigin, paramActivityId);
					if (cloudActivity && !cancelled) {
						setStandaloneActivityId(String(cloudActivity.id || paramActivityId));
						setActivityName(String(cloudActivity['lesson-name'] || defaultActivityName));
						setData(normalizeInputData(cloudActivity['lesson-input-data'] || {}));
						return;
					}
				}
				const stored = readFormSessionData(formName);
				if (stored && !cancelled) {
					setData(normalizeInputData(stored));
				}
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
				setData(normalizeInputData(resolvedActivity['lesson-input-data'] || {}));
			}
		};

		hydrateFromContext();

		return () => {
			cancelled = true;
		};
	}, [defaultActivityName, formName, normalizeInputData, projectApiOrigin]);

	useEffect(() => {
		const timeout = setTimeout(() => {
			const normalizedInput = normalizeInputData(data);
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
			}
		}, 300);

		return () => clearTimeout(timeout);
	}, [activityIndex, activityName, data, defaultActivityName, normalizeInputData, projectId]);

	const runAuthCheck = async () => {
		setAuthLoading(true);
		try {
			const user = await fetchAuthenticatedUser(projectApiOrigin);
			setAuthUser(user);
		} catch {
			setAuthUser(null);
		} finally {
			setAuthLoading(false);
		}
	};

	useEffect(() => {
		if (typeof window !== 'undefined') {
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
	}, []);

	const handleLoginLogout = () => {
		if (authUser) {
			window.location.href = buildTeachableLogoutUrl(window.location.href, projectApiOrigin);
			return;
		}
		window.location.href = buildTeachableStartUrl(projectApiOrigin, window.location.href);
	};

	const handleSaveAndReturn = async () => {
		if (!projectId || !Number.isInteger(activityIndex)) {
			showNotice('error', 'No project context available.');
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
			if (!activities[activityIndex]) {
				showNotice('error', 'Lesson activity not found.');
				setIsSaving(false);
				return;
			}

			const normalizedInput = normalizeInputData(data);
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

			if (authUser) {
				project.syncedAt = null;
				saveStoredProjects(projects);

				const payload = buildDiyProjectsPayload({
					project,
					formName: 'lesson-activities-project',
					normalizeLessonInputData: (input) => input || {},
				});

				const response = await fetchWithUserToken(projectApiOrigin, DIY_PROJECTS_ENDPOINT, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload),
				});

				if (response.ok) {
					const result = await response.json();
					const updated = getAllStoredProjects();
					const updatedProject = updated.find((item) => item.id === projectId);
					if (updatedProject) {
						updatedProject.syncedAt = new Date().toISOString();
						if (result?.id) {
							updatedProject.remoteId = result.id;
						}
						saveStoredProjects(updated);
					}
					showNotice('success', 'Lesson activity saved.');
				} else {
					saveStoredProjects(projects);
					showNotice('warning', 'Saved locally. Cloud sync failed.');
				}
			} else {
				saveStoredProjects(projects);
				showNotice('success', 'Saved locally.');
			}

			router.push('/lesson-projects');
		} catch (error) {
			console.error('Save and return failed:', error);
			showNotice('error', 'Could not save lesson activity.');
			setIsSaving(false);
		}
	};

	const handleSaveStandalone = async () => {
		if (!authUser) {
			showNotice('error', 'Please login with Teachable to save standalone activities.');
			return;
		}

		setIsSaving(true);
		try {
			const normalizedInput = normalizeInputData(data);
			const activityId = String(standaloneActivityId || createLessonActivityId());

			const response = await upsertLessonActivity(
				projectApiOrigin,
				buildLessonActivityUpsertPayload({
					id: activityId,
					template: formName,
					lessonName: activityName || defaultActivityName,
					lessonInputData: normalizedInput,
					createdAt: Date.now(),
					modifiedAt: Date.now(),
					extra: {
						formName,
					},
				})
			);

			if (!response.ok) {
				showNotice('error', 'Could not save standalone lesson activity.');
				setIsSaving(false);
				return;
			}

			setStandaloneActivityId(activityId);
			const url = new URL(window.location.href);
			url.searchParams.set('activityId', activityId);
			window.history.replaceState({}, '', url.toString());
			showNotice('success', 'Standalone lesson activity saved.');
		} catch (error) {
			console.error('Save standalone failed:', error);
			showNotice('error', 'Could not save standalone lesson activity.');
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

			setStandaloneActivityId('');
			setActivityName('');
			setData(normalizeInputData({}));
			const url = new URL(window.location.href);
			url.searchParams.delete('activityId');
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

	const handleAddToProject = () => {
		router.push(`/lesson-projects?activityType=${encodeURIComponent(formName)}`);
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
		handleSaveAndReturn,
		standaloneActivityId,
		handleSaveStandalone,
		handleDeleteStandalone,
		handleGoToLessonProjects,
		handleAddToProject,
		handleDownloadPdf,
	};
}
