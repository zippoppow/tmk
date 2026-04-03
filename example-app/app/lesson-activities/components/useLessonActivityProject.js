'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	buildTeachableLogoutUrl,
	buildTeachableStartUrl,
	createLessonActivityId,
	upsertLessonActivity,
	fetchAuthenticatedUser,
	fetchWithUserToken,
	readFormSessionData,
	resolveTmkApiOrigin,
	writeFormSessionData,
	DIY_PROJECTS_ENDPOINT,
	getAllStoredProjects,
	saveStoredProjects,
} from '../../components/lessonActivityHelpers';
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

		const url = new URL(window.location.href);
		const paramProjectId = url.searchParams.get('projectId') || '';
		const paramActivityIndex = url.searchParams.get('activityIndex');

		if (paramProjectId && paramActivityIndex !== null) {
			const parsedIndex = Number.parseInt(paramActivityIndex, 10);
			if (!Number.isInteger(parsedIndex)) {
				showNotice('error', 'Invalid activity context.');
				return;
			}

			setProjectId(paramProjectId);
			setActivityIndex(parsedIndex);

			const projects = getAllStoredProjects();
			const project = projects.find((item) => item.id === paramProjectId);
			if (!project) {
				showNotice('error', 'Project not found.');
				return;
			}

			setProjectName(project.name || 'Untitled Project');
			const activities = getProjectLessonActivities(project, 'lesson-activities-project', (input) => input || {});
			const activity = activities[parsedIndex];
			if (!activity) {
				showNotice('error', 'Lesson activity not found.');
				return;
			}

			setActivityName(String(activity['lesson-name'] || defaultActivityName));
			setData(normalizeInputData(activity['lesson-input-data'] || {}));
			return;
		}

		const stored = readFormSessionData(formName);
		if (stored) {
			setData(normalizeInputData(stored));
		}
	}, [defaultActivityName, formName, normalizeInputData]);

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

				const lessonActivityResponse = await upsertLessonActivity(projectApiOrigin, {
					id: activityId,
					projectId,
					projectName: project.name || '',
					formName,
					'tmk-template': String(activities[activityIndex]['tmk-template'] || formName),
					'lesson-name': String(activities[activityIndex]['lesson-name'] || defaultActivityName),
					'lesson-input-data': normalizedInput,
					'created-at': Number.isFinite(Number(activities[activityIndex]['created-at']))
						? Number(activities[activityIndex]['created-at'])
						: Date.now(),
					'modified-at': Number.isFinite(Number(activities[activityIndex]['modified-at']))
						? Number(activities[activityIndex]['modified-at'])
						: Date.now(),
				});

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

				if (response.ok && lessonActivityResponse.ok) {
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
		handleGoToLessonProjects,
		handleAddToProject,
		handleDownloadPdf,
	};
}
