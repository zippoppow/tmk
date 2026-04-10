'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_CONTEXT_MENU_STATE = {
	open: false,
	x: 0,
	y: 0,
	targetType: '',
	index: -1,
};

export function useContextActionMenu(initialState = {}) {
	const baseState = { ...DEFAULT_CONTEXT_MENU_STATE, ...initialState };
	const [menuState, setMenuState] = useState(baseState);

	const openMenu = useCallback(
		(event, payload = {}) => {
			event.preventDefault();
			setMenuState({
				...baseState,
				open: true,
				x: event.clientX,
				y: event.clientY,
				...payload,
			});
		},
		[baseState]
	);

	const closeMenu = useCallback(() => {
		setMenuState((prev) => ({ ...prev, open: false }));
	}, []);

	return {
		menuState,
		setMenuState,
		openMenu,
		closeMenu,
	};
}

export function useClickDoubleClickSelection({ onClick, onDoubleClick, delayMs = 250 } = {}) {
	const timerRef = useRef(null);

	useEffect(() => {
		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		};
	}, []);

	const handleClick = useCallback(
		(payload) => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}

			timerRef.current = setTimeout(() => {
				timerRef.current = null;
				onClick?.(payload);
			}, delayMs);
		},
		[delayMs, onClick]
	);

	const handleDoubleClick = useCallback(
		(payload) => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
				timerRef.current = null;
			}
			onDoubleClick?.(payload);
		},
		[onDoubleClick]
	);

	return {
		handleClick,
		handleDoubleClick,
	};
}
