'use client';

import { Box } from '@mui/material';
import { m } from 'motion/react';

const defaultVariants = {
	hidden: {
		opacity: 0,
		y: 20,
	},
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.24,
			ease: 'easeOut',
			staggerChildren: 0.04,
			when: 'beforeChildren',
		},
	},
};

export default function ActivityEntrance({
	children,
	variants = defaultVariants,
	initial = 'hidden',
	animate = 'visible',
	exit,
	transition,
	sx,
	...props
}) {
	return (
		<Box
			component={m.div}
			initial={initial}
			animate={animate}
			exit={exit}
			variants={variants}
			transition={transition}
			sx={sx}
			{...props}
		>
			{children}
		</Box>
	);
}

export { defaultVariants as activityEntranceVariants };