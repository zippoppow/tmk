import Image from 'next/image';
import { Box } from '@mui/material';

export const TMK_DIY_LOGO_SRC = '/branding/tmk_diy_logo.png';

export default function TmkLogo({
	alt = 'The Morphology Kit',
	renderMode = 'image',
	maxWidth = 200,
	width = 200,
	height = 56,
	priority = false,
	sx,
	...rest
}) {
	if (renderMode === 'img') {
		return (
			<Box
				component="img"
				src={TMK_DIY_LOGO_SRC}
				alt={alt}
				sx={{ width: '100%', maxWidth, height: 'auto', ...sx }}
				{...rest}
			/>
		);
	}

	return (
		<Box sx={{ width: '100%', maxWidth, ...sx }} {...rest}>
			<Image
				src={TMK_DIY_LOGO_SRC}
				alt={alt}
				width={width}
				height={height}
				priority={priority}
				style={{ width: '100%', height: 'auto' }}
			/>
		</Box>
	);
}