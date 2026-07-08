let authTransitionState = {
	active: false,
	message: '',
};

const listeners = new Set();

function emit() {
	listeners.forEach((listener) => {
		try {
			listener(authTransitionState);
		} catch {
			// Ignore listener errors to keep store stable.
		}
	});
}

export function getAuthTransitionState() {
	return authTransitionState;
}

export function setAuthTransitionState(nextState) {
	authTransitionState = {
		...authTransitionState,
		...(nextState || {}),
	};
	emit();
}

export function beginAuthTransition(message = 'Checking login...') {
	setAuthTransitionState({
		active: true,
		message: String(message || 'Checking login...'),
	});
}

export function endAuthTransition() {
	setAuthTransitionState({
		active: false,
		message: '',
	});
}

export function subscribeAuthTransition(listener) {
	if (typeof listener !== 'function') {
		return () => {};
	}

	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}
