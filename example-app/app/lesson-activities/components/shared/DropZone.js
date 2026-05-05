'use client';

import { Box } from '@mui/material';
import { useDroppable } from '@dnd-kit/core';

export default function DropZone({
	id,
	children,
	data,
	disabled = false,
	minHeight = 56,
	activeSx,
	inactiveSx,
	sx,
	...props
}) {
	const { isOver, setNodeRef, active } = useDroppable({
		id,
		data,
		disabled,
	});

	return (
		<Box
			ref={setNodeRef}
			{...props}
			sx={[
				{
					minHeight,
					p: 1.25,
					borderRadius: 1,
					border: '2px solid #4020A7',
					backgroundColor: isOver ? 'rgba(102, 126, 234, 0.08)' : '#fff',
					borderColor: isOver ? '#667eea' : '#4020A7',
					borderStyle: active && !disabled ? 'solid' : 'dashed',
					transition: 'background-color 120ms ease, border-color 120ms ease',
				},
				!isOver && inactiveSx,
				isOver && activeSx,
				sx,
			]}
		>
			{children}
		</Box>
	);
}