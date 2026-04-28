export const DEFAULT_API_ORIGINS = {
	production: 'https://tmk-api.up.railway.app',
	staging: 'https://tmk-api.up.railway.app',
};

export const OAUTH_ENDPOINTS = {
	start: '/api/auth/teachable/start',
	me: '/api/auth/teachable/me',
	logout: '/api/auth/teachable/logout',
};

export const USER_AUTH_ENDPOINTS = {
	token: '/api/auth/token',
	refresh: '/api/auth/refresh',
};

export const TEACHABLE_SESSION_PARAM = 'teachable_session';
export const TEACHABLE_SESSION_STORAGE_KEY = 'tmk-teachable-session-handoff';

export const LESSON_ACTIVITIES_ENDPOINT = '/api/lesson-activities';
export const DIY_PROJECTS_ENDPOINT = '/api/diy-projects';

export const DEFAULT_SESSION_STORAGE_KEY = 'tmk-diy-sessions';
export const PROJECTS_STORAGE_KEY = 'tmk-diy-projects';

const AUTH_BYPASS_FLAG = String(process.env.NEXT_PUBLIC_AUTH_BYPASS || '').trim().toLowerCase();
const AUTH_BYPASS_REQUESTED = AUTH_BYPASS_FLAG === '1' || AUTH_BYPASS_FLAG === 'true' || AUTH_BYPASS_FLAG === 'yes' || AUTH_BYPASS_FLAG === 'on';

export const AUTH_BYPASS_ENABLED = process.env.NODE_ENV !== 'production' && AUTH_BYPASS_REQUESTED;
