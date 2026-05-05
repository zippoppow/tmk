'use client';

import { LazyMotion, MotionConfig, domAnimation } from 'motion/react';

export default function ActivityMotionProvider({ children, reducedMotion = 'user', transition }) {
	return (
		<LazyMotion features={domAnimation}>
			<MotionConfig reducedMotion={reducedMotion} transition={transition}>
				{children}
			</MotionConfig>
		</LazyMotion>
	);
}