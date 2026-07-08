import { useEffect, useState } from 'react';
import {
	getAuthTransitionState,
	subscribeAuthTransition,
} from '../lib/authTransitionStore';

export function useAuthTransition() {
	const [state, setState] = useState(() => getAuthTransitionState());

	useEffect(() => {
		return subscribeAuthTransition((nextState) => {
			setState(nextState);
		});
	}, []);

	return state;
}
