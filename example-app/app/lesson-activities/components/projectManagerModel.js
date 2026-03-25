import { createProjectId, extractDiyProjectsFromResponse } from './lessonActivityHelpers';

export function getProjectLessonActivities(project, formName, normalizeLessonInputData) {
	if (project && Array.isArray(project.lessonActivities) && project.lessonActivities.length > 0) {
		return project.lessonActivities;
	}

	if (project && project.data && typeof project.data === 'object') {
		const createdAt = Number.isFinite(project.createdAtMs) ? project.createdAtMs : Date.now();
		const modifiedAt = Number.isFinite(project.modifiedAtMs) ? project.modifiedAtMs : createdAt;
		return [
			{
				'tmk-template': formName,
				'lesson-name': String(project.name || ''),
				'created-at': createdAt,
				'modified-at': modifiedAt,
				'lesson-input-data': normalizeLessonInputData(project.data),
			},
		];
	}

	return [];
}

export function getLatestLessonActivity(project, formName, normalizeLessonInputData) {
	const activities = getProjectLessonActivities(project, formName, normalizeLessonInputData);
	return activities.length > 0 ? activities[activities.length - 1] : null;
}

export function createLessonActivitySnapshot({
	formName,
	projectName,
	lessonName,
	lessonInputData,
	normalizeLessonInputData,
	currentLessonInputData,
}) {
	const now = Date.now();
	return {
		'tmk-template': formName,
		'lesson-name': String(lessonName || projectName || ''),
		'created-at': now,
		'modified-at': now,
		'lesson-input-data': lessonInputData
			? normalizeLessonInputData(lessonInputData)
			: normalizeLessonInputData(currentLessonInputData),
	};
}

export function getUniqueLessonActivityName({
	project,
	requestedName,
	formName,
	normalizeLessonInputData,
	excludeIndex = -1,
}) {
	const baseName = String(requestedName || '').trim() || 'Lesson Activity';
	const usedNames = new Set(
		getProjectLessonActivities(project, formName, normalizeLessonInputData)
			.map((activity, idx) => ({
				name: String(activity['lesson-name'] || '').trim(),
				idx,
			}))
			.filter((item) => item.idx !== excludeIndex)
			.map((item) => item.name)
	);

	if (!usedNames.has(baseName)) {
		return baseName;
	}

	let suffix = 2;
	let candidate = `${baseName} ${suffix}`;
	while (usedNames.has(candidate)) {
		suffix += 1;
		candidate = `${baseName} ${suffix}`;
	}
	return candidate;
}

export function normalizeCloudProjects(payload, formName, normalizeLessonInputData) {
	const diyProjects = extractDiyProjectsFromResponse(payload);
	const normalized = [];

	diyProjects.forEach((project, projectIndex) => {
		const activities = Array.isArray(project['lesson-activities']) ? project['lesson-activities'] : [];
		if (activities.length === 0) {
			return;
		}

		const createdAtRaw = project['created-at'] || activities[0]['created-at'] || Date.now();
		const modifiedAtRaw = project['modified-at'] || activities[activities.length - 1]['modified-at'] || createdAtRaw;
		const createdAtIso = Number.isFinite(Number(createdAtRaw))
			? new Date(Number(createdAtRaw)).toISOString()
			: String(createdAtRaw);
		const syncedAtIso = Number.isFinite(Number(modifiedAtRaw))
			? new Date(Number(modifiedAtRaw)).toISOString()
			: String(modifiedAtRaw);

		const lessonActivities = activities
			.filter((activity) => activity && activity['lesson-input-data'])
			.map((activity) => ({
				'tmk-template': String(activity['tmk-template'] || ''),
				'lesson-name': String(activity['lesson-name'] || project['project-name'] || ''),
				'created-at': Number.isFinite(Number(activity['created-at']))
					? Number(activity['created-at'])
					: Date.now(),
				'modified-at': Number.isFinite(Number(activity['modified-at']))
					? Number(activity['modified-at'])
					: Date.now(),
				'lesson-input-data': normalizeLessonInputData(activity['lesson-input-data']),
			}));

		if (lessonActivities.length === 0) {
			return;
		}

		const latest = lessonActivities[lessonActivities.length - 1];
		normalized.push({
			id: `cloud_${projectIndex}_${String(project['project-name'] || 'project')}`,
			source: 'cloud',
			name: String(project['project-name'] || latest['lesson-name'] || 'Untitled Cloud Project'),
			createdAt: createdAtIso,
			createdAtMs: Number.isFinite(Number(createdAtRaw)) ? Number(createdAtRaw) : Date.now(),
			modifiedAtMs: Number.isFinite(Number(modifiedAtRaw)) ? Number(modifiedAtRaw) : Date.now(),
			syncedAt: syncedAtIso,
			lessonActivities,
			data: latest['lesson-input-data'],
		});
	});

	return normalized;
}

export function mergeDisplayProjects(localProjects, cloudProjects, formName, normalizeLessonInputData) {
	const localWithActivities = localProjects.map((project) => {
		const lessonActivities = getProjectLessonActivities(project, formName, normalizeLessonInputData);
		const latest = lessonActivities.length > 0 ? lessonActivities[lessonActivities.length - 1] : null;
		return {
			...project,
			source: 'local',
			lessonActivities,
			data: latest && latest['lesson-input-data'] ? latest['lesson-input-data'] : {},
		};
	});

	const cloudOnly = cloudProjects.filter((cloudProject) => {
		return !localWithActivities.some((localProject) => {
			const sameName = (localProject.name || '').trim() === (cloudProject.name || '').trim();
			const sameActivities =
				JSON.stringify(localProject.lessonActivities || []) === JSON.stringify(cloudProject.lessonActivities || []);
			return sameName && sameActivities;
		});
	});

	return [...localWithActivities, ...cloudOnly];
}

export function buildDiyProjectsPayload({ project, formName, userEmail, normalizeLessonInputData }) {
	const now = Date.now();
	const createdAtMs = Number.isFinite(project.createdAtMs) ? project.createdAtMs : now;
	const modifiedAtMs = Number.isFinite(project.modifiedAtMs) ? project.modifiedAtMs : now;
	const sourceActivities = getProjectLessonActivities(project, formName, normalizeLessonInputData);
	const normalizedActivities =
		sourceActivities.length > 0
			? sourceActivities
			: [
				createLessonActivitySnapshot({
					formName,
					projectName: project.name || '',
					lessonName: project.name || '',
					normalizeLessonInputData,
					currentLessonInputData: {},
				}),
			];

	return {
		'user-email': userEmail || '',
		'diy-projects': [
			{
				'project-name': String(project.name || ''),
				'created-at': createdAtMs,
				'modified-at': modifiedAtMs,
				'lesson-activities': normalizedActivities.map((activity) => ({
					'tmk-template': String(activity['tmk-template'] || formName),
					'lesson-name': String(activity['lesson-name'] || project.name || ''),
					'created-at': Number.isFinite(Number(activity['created-at']))
						? Number(activity['created-at'])
						: createdAtMs,
					'modified-at': Number.isFinite(Number(activity['modified-at']))
						? Number(activity['modified-at'])
						: modifiedAtMs,
					'lesson-input-data': normalizeLessonInputData(activity['lesson-input-data'] || {}),
				})),
			},
		],
	};
}

export function createLocalProjectRecord(name, formName) {
	const now = Date.now();
	return {
		id: createProjectId(),
		name: name.trim(),
		formName,
		createdAt: new Date(now).toISOString(),
		createdAtMs: now,
		modifiedAtMs: now,
		syncedAt: null,
		lessonActivities: [],
	};
}
