'use client';

import { useMemo, useState } from 'react';
import {
	DndContext,
	DragOverlay,
	KeyboardSensor,
	PointerSensor,
	TouchSensor,
	closestCenter,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

export default function ActivityDndProvider({
	children,
	onDragStart,
	onDragMove,
	onDragOver,
	onDragEnd,
	onDragCancel,
	collisionDetection = closestCenter,
	modifiers,
	accessibility,
	overlay,
	pointerConstraint,
	touchConstraint,
}) {
	const [activeItem, setActiveItem] = useState(null);
	const pointerSensor = useSensor(PointerSensor, {
		activationConstraint: pointerConstraint || { distance: 6 },
	});
	const touchSensor = useSensor(TouchSensor, {
		activationConstraint: touchConstraint || { delay: 120, tolerance: 8 },
	});
	const keyboardSensor = useSensor(KeyboardSensor, {
		coordinateGetter: sortableKeyboardCoordinates,
	});
	const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor);

	const contextValue = useMemo(
		() => ({
			activeItem,
			setActiveItem,
		}),
		[activeItem]
	);

	const handleDragStart = (event) => {
		setActiveItem(event.active);
		onDragStart?.(event, contextValue);
	};

	const handleDragEnd = (event) => {
		onDragEnd?.(event, contextValue);
		setActiveItem(null);
	};

	const handleDragCancel = (event) => {
		onDragCancel?.(event, contextValue);
		setActiveItem(null);
	};

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={collisionDetection}
			modifiers={modifiers}
			accessibility={accessibility}
			onDragStart={handleDragStart}
			onDragMove={onDragMove}
			onDragOver={onDragOver}
			onDragEnd={handleDragEnd}
			onDragCancel={handleDragCancel}
		>
			{children}
			<DragOverlay>{typeof overlay === 'function' ? overlay(activeItem) : overlay || null}</DragOverlay>
		</DndContext>
	);
}