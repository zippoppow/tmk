import { fetchWithUserToken } from './authHelpers';
import {
	DEFAULT_SESSION_STORAGE_KEY,
	DIY_PROJECTS_ENDPOINT,
	LESSON_ACTIVITIES_ENDPOINT,
	PROJECTS_STORAGE_KEY,
} from './sharedHelperConstants';

export {
	DEFAULT_SESSION_STORAGE_KEY,
	DIY_PROJECTS_ENDPOINT,
	LESSON_ACTIVITIES_ENDPOINT,
	PROJECTS_STORAGE_KEY,
} from './sharedHelperConstants';

export function readFormSessionData(formName, storageKey = DEFAULT_SESSION_STORAGE_KEY) {
	if (typeof window === 'undefined') {
		return null;
	}

	const allSessions = JSON.parse(window.localStorage.getItem(storageKey) || '{}');
	return allSessions[formName] || null;
}

export function writeFormSessionData(formName, data, storageKey = DEFAULT_SESSION_STORAGE_KEY) {
	if (typeof window === 'undefined') {
		return;
	}

	const allSessions = JSON.parse(window.localStorage.getItem(storageKey) || '{}');
	allSessions[formName] = {
		...data,
		timestamp: Date.now(),
	};
	window.localStorage.setItem(storageKey, JSON.stringify(allSessions));
}

export function clearFormSessionData(formName, storageKey = DEFAULT_SESSION_STORAGE_KEY) {
	if (typeof window === 'undefined') {
		return;
	}

	const allSessions = JSON.parse(window.localStorage.getItem(storageKey) || '{}');
	delete allSessions[formName];
	window.localStorage.setItem(storageKey, JSON.stringify(allSessions));
}

export function getAllStoredProjects(storageKey = PROJECTS_STORAGE_KEY) {
	try {
		return JSON.parse(window.localStorage.getItem(storageKey) || '[]');
	} catch {
		return [];
	}
}

export function saveStoredProjects(projects, storageKey = PROJECTS_STORAGE_KEY) {
	window.localStorage.setItem(storageKey, JSON.stringify(projects));
}

export function createProjectId() {
	return `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createLessonActivityId() {
	return `la_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function coerceBoolean(value) {
	if (typeof value === 'boolean') {
		return value;
	}
	if (typeof value === 'string') {
		const normalized = value.trim().toLowerCase();
		if (normalized === 'true') {
			return true;
		}
		if (normalized === 'false') {
			return false;
		}
	}
	return null;
}

function normalizeStringList(values) {
	if (!Array.isArray(values)) {
		return [];
	}

	const unique = new Set();
	values.forEach((value) => {
		const normalized = String(value || '').trim();
		if (normalized) {
			unique.add(normalized);
		}
	});

	return [...unique];
}

export function getLessonActivityProjectAssociation(record) {
	const linkedProjects = Array.isArray(record?.projects) ? record.projects : [];
	const linkedAssociations = Array.isArray(record?.associations) ? record.associations : [];
	const linkedProjectRefs = Array.isArray(record?.['diy-projects']) ? record['diy-projects'] : [];

	const projectIds = normalizeStringList([
		record?.projectId,
		record?.['project-id'],
		...(Array.isArray(record?.projectIds) ? record.projectIds : []),
		...(Array.isArray(record?.['project-ids']) ? record['project-ids'] : []),
		...(Array.isArray(record?.diyProjectIds) ? record.diyProjectIds : []),
		...(Array.isArray(record?.['diy-project-ids']) ? record['diy-project-ids'] : []),
		...(Array.isArray(record?.associationIds) ? record.associationIds : []),
		...(Array.isArray(record?.['association-ids']) ? record['association-ids'] : []),
		...linkedAssociations,
		...linkedProjectRefs,
		...linkedProjects.map((project) =>
			project?.id
			|| project?.projectId
			|| project?.['project-id']
			|| project?.diyProjectId
			|| project?.['diy-project-id']
		),
		...linkedAssociations.map((item) =>
			item?.projectId
			|| item?.['project-id']
			|| item?.id
			|| item?.diyProjectId
			|| item?.['diy-project-id']
			|| item?.project?.id
			|| item?.project?.projectId
			|| item?.project?.['project-id']
		),
		...linkedProjectRefs.map((item) =>
			item?.id
			|| item?.projectId
			|| item?.['project-id']
			|| item?.diyProjectId
			|| item?.['diy-project-id']
		),
	]);

	const projectNames = normalizeStringList([
		record?.projectName,
		record?.['project-name'],
		...(Array.isArray(record?.projectNames) ? record.projectNames : []),
		...(Array.isArray(record?.['project-names']) ? record['project-names'] : []),
		...(Array.isArray(record?.diyProjectNames) ? record.diyProjectNames : []),
		...(Array.isArray(record?.['diy-project-names']) ? record['diy-project-names'] : []),
		...(Array.isArray(record?.associationNames) ? record.associationNames : []),
		...(Array.isArray(record?.['association-names']) ? record['association-names'] : []),
		...linkedProjects.map((project) =>
			project?.name
			|| project?.projectName
			|| project?.['project-name']
			|| project?.diyProjectName
			|| project?.['diy-project-name']
		),
		...linkedAssociations.map((item) =>
			item?.projectName
			|| item?.['project-name']
			|| item?.name
			|| item?.diyProjectName
			|| item?.['diy-project-name']
			|| item?.project?.name
			|| item?.project?.projectName
			|| item?.project?.['project-name']
		),
		...linkedProjectRefs.map((item) =>
			item?.name
			|| item?.projectName
			|| item?.['project-name']
			|| item?.diyProjectName
			|| item?.['diy-project-name']
		),
	]);

	const standaloneExplicitCandidates = [
		record?.standalone,
		record?.isStandalone,
		record?.['is-standalone'],
		record?.association?.standalone,
		record?.association?.isStandalone,
		record?.association?.['is-standalone'],
		record?.associationStatus === 'standalone' ? true : null,
		record?.associationType === 'standalone' ? true : null,
		record?.['association-status'] === 'standalone' ? true : null,
		record?.['association-type'] === 'standalone' ? true : null,
	];

	const associatedExplicitCandidates = [
		record?.associated,
		record?.isAssociated,
		record?.['is-associated'],
		record?.association?.associated,
		record?.association?.isAssociated,
		record?.association?.['is-associated'],
		record?.associationStatus === 'associated' ? true : null,
		record?.associationType === 'associated' ? true : null,
		record?.['association-status'] === 'associated' ? true : null,
		record?.['association-type'] === 'associated' ? true : null,
	];

	const standaloneExplicit = standaloneExplicitCandidates
		.map(coerceBoolean)
		.find((value) => value !== null) ?? null;

	const associatedExplicit = associatedExplicitCandidates
		.map(coerceBoolean)
		.find((value) => value !== null) ?? null;

	return {
		projectId: projectIds[0] || '',
		projectName: projectNames[0] || '',
		projectIds,
		projectNames,
		standaloneExplicit,
		associatedExplicit,
	};
}

export function isProjectLinkedLessonActivity(record) {
	const association = getLessonActivityProjectAssociation(record);
	const hasProjectLinks = association.projectIds.length > 0 || association.projectNames.length > 0;

	// Concrete project links always indicate association, even if legacy flags disagree.
	if (hasProjectLinks) {
		return true;
	}

	if (association.associatedExplicit === true) {
		return true;
	}
	if (association.standaloneExplicit === true) {
		return false;
	}
	return false;
}

export function isStandaloneLessonActivity(record) {
	return !isProjectLinkedLessonActivity(record);
}

function toEpochMs(value) {
	const num = Number(value);
	return Number.isFinite(num) ? num : Date.now();
}

function normalizeLessonInputObject(value) {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return {};
	}
	return value;
}

export function buildLessonActivityUpsertPayload({
	id,
	template,
	lessonName,
	lessonInputData,
	createdAt,
	modifiedAt,
	extra = {},
}) {
	const resolvedId = String(id || createLessonActivityId()).trim();
	const resolvedTemplate = String(template || '').trim() || 'unknown-template';
	const resolvedLessonName = String(lessonName || '').trim() || 'Untitled Lesson Activity';

	return {
		...extra,
		id: resolvedId,
		'tmk-template': resolvedTemplate,
		'lesson-name': resolvedLessonName,
		'lesson-input-data': normalizeLessonInputObject(lessonInputData),
		'created-at': toEpochMs(createdAt),
		'modified-at': toEpochMs(modifiedAt),
	};
}

function normalizeLessonActivityPayload(payload) {
	if (!payload || typeof payload !== 'object') {
		return [];
	}

	if (Array.isArray(payload)) {
		return payload;
	}

	if (Array.isArray(payload['lesson-activities'])) {
		return payload['lesson-activities'];
	}

	if (payload.data && Array.isArray(payload.data['lesson-activities'])) {
		return payload.data['lesson-activities'];
	}

	if (payload.data && Array.isArray(payload.data)) {
		return payload.data;
	}

	return [];
}

function normalizeSingleLessonActivityPayload(payload) {
	if (!payload || typeof payload !== 'object') {
		return null;
	}

	if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
		return payload.data;
	}

	if (payload.result && typeof payload.result === 'object' && !Array.isArray(payload.result)) {
		return payload.result;
	}

	if (!Array.isArray(payload)) {
		return payload;
	}

	return null;
}

export async function upsertLessonActivity(apiOrigin, record) {
	return fetchWithUserToken(apiOrigin, LESSON_ACTIVITIES_ENDPOINT, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(record),
	});
}

export async function listLessonActivities(apiOrigin) {
	const response = await fetchWithUserToken(apiOrigin, LESSON_ACTIVITIES_ENDPOINT, {
		method: 'GET',
	});

	if (!response.ok) {
		return [];
	}

	const payload = await response.json().catch(() => ({}));
	return normalizeLessonActivityPayload(payload);
}

export async function fetchLessonActivityById(apiOrigin, id) {
	if (!id) {
		return null;
	}

	const response = await fetchWithUserToken(
		apiOrigin,
		`${LESSON_ACTIVITIES_ENDPOINT}/${encodeURIComponent(String(id))}`,
		{ method: 'GET' }
	);

	if (!response.ok) {
		return null;
	}

	const payload = await response.json().catch(() => ({}));
	return normalizeSingleLessonActivityPayload(payload);
}

export async function deleteLessonActivityById(apiOrigin, id) {
	if (!id) {
		return new Response(null, { status: 400, statusText: 'Missing lesson activity id' });
	}

	return fetchWithUserToken(apiOrigin, LESSON_ACTIVITIES_ENDPOINT, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ id }),
	});
}

export async function hardDeleteLessonActivityById(apiOrigin, id, maxAttempts = 3) {
	const activityId = String(id || '').trim();
	if (!activityId) {
		return { ok: false, attempts: 0, reason: 'missing-id' };
	}

	for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
		const deleteResponse = await deleteLessonActivityById(apiOrigin, activityId);
		if (!deleteResponse.ok && deleteResponse.status !== 404) {
			continue;
		}

		const existing = await fetchLessonActivityById(apiOrigin, activityId);
		if (!existing) {
			return { ok: true, attempts: attempt };
		}
	}

	return { ok: false, attempts: maxAttempts, reason: 'still-exists' };
}

export function extractDiyProjectsFromResponse(payload) {
	if (Array.isArray(payload)) {
		return payload.flatMap((item) => {
			if (item && Array.isArray(item['diy-projects'])) {
				return item['diy-projects'];
			}
			if (item?.data && Array.isArray(item.data['diy-projects'])) {
				return item.data['diy-projects'];
			}
			if (item && item['project-name']) {
				return [item];
			}
			if (item?.data && item.data['project-name']) {
				return [item.data];
			}
			return [];
		});
	}

	if (payload && typeof payload === 'object' && Array.isArray(payload['diy-projects'])) {
		return payload['diy-projects'];
	}

	if (payload?.data && Array.isArray(payload.data['diy-projects'])) {
		return payload.data['diy-projects'];
	}

	if (Array.isArray(payload?.data)) {
		return payload.data.flatMap((item) => {
			if (item && Array.isArray(item['diy-projects'])) {
				return item['diy-projects'];
			}
			if (item && item['project-name']) {
				return [item];
			}
			return [];
		});
	}

	return [];
}

export function formatProjectDate(iso) {
	try {
		return new Date(iso).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	} catch {
		return String(iso || '');
	}
}

export function formatActivityDate(ms) {
	try {
		if (Number.isFinite(Number(ms))) {
			return new Date(Number(ms)).toLocaleDateString(undefined, {
				month: 'short',
				day: 'numeric',
			});
		}
		return '';
	} catch {
		return '';
	}
}
