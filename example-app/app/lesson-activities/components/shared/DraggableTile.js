'use client';

import { Box, Paper } from '@mui/material';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

export default function DraggableTile({
	id,
	children,
	data,
	disabled = false,
	PaperProps = {},
	sx,
	grabCursor = true,
	...props
}) {
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
		id,
		data,
		disabled,
	});

	const transformStyle = CSS.Translate.toString(transform);

	return (
		<Paper
			ref={setNodeRef}
			elevation={isDragging ? 6 : 0}
			{...attributes}
			{...listeners}
			{...PaperProps}
			{...props}
			sx={[
				{
					px: 1.25,
					py: 0.75,
					borderRadius: 1,
					border: '1px solid #d5d5e5',
					background: 'linear-gradient(180deg, #ffffff, #f5f5fb)',
					cursor: disabled ? 'default' : grabCursor ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
					userSelect: 'none',
					touchAction: disabled ? 'auto' : 'none',
					opacity: isDragging ? 0.72 : 1,
					transform: transformStyle,
					transition: 'box-shadow 120ms ease, opacity 120ms ease',
				},
				PaperProps.sx,
				sx,
			]}
		>
			<Box>{children}</Box>
		</Paper>
	);
}