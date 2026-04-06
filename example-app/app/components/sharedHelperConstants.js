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
	token: '/api/auth/user/token',
	refresh: '/api/auth/user/refresh',
};

export const TEACHABLE_SESSION_PARAM = 'teachable_session';
export const TEACHABLE_SESSION_STORAGE_KEY = 'tmk-teachable-session-handoff';

export const LESSON_ACTIVITIES_ENDPOINT = '/api/lesson-activities';
export const DIY_PROJECTS_ENDPOINT = '/api/diy-projects';

export const DEFAULT_SESSION_STORAGE_KEY = 'tmk-diy-sessions';
export const PROJECTS_STORAGE_KEY = 'tmk-diy-projects';

export const AUTH_BYPASS_ENABLED = false;
