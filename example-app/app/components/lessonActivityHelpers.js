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

export function getLessonActivityProjectAssociation(record) {
	return {
		projectId: String(record?.projectId || '').trim(),
		projectName: String(record?.projectName || '').trim(),
	};
}

export function isProjectLinkedLessonActivity(record) {
	const { projectId, projectName } = getLessonActivityProjectAssociation(record);
	return Boolean(projectId || projectName);
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

export function extractDiyProjectsFromResponse(payload) {
	if (Array.isArray(payload)) {
		return payload.flatMap((item) => {
			if (item && Array.isArray(item['diy-projects'])) {
				return item['diy-projects'];
			}
			if (item && item['project-name']) {
				return [item];
			}
			return [];
		});
	}

	if (payload && typeof payload === 'object' && Array.isArray(payload['diy-projects'])) {
		return payload['diy-projects'];
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
