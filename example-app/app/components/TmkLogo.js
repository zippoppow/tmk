import Link from 'next/link';
import Image from 'next/image';
import { Box } from '@mui/material';

export const TMK_DIY_LOGO_SRC = '/branding/tmk_diy_logo_templates.png';

export default function TmkLogo({
	alt = 'The Morphology Kit',
	renderMode = 'image',
	routeToHome = false,
	homePath = '/',
	maxWidth = 200,
	width = 200,
	height = 56,
	priority = false,
	sx,
	...rest
}) {
	const logo = renderMode === 'img' ? (
		<Box
			component="img"
			src={TMK_DIY_LOGO_SRC}
			alt={alt}
			sx={{
				width: '100%',
				maxWidth,
				height: 'auto',
				cursor: routeToHome ? 'pointer' : 'default',
				...sx,
			}}
			{...rest}
		/>
	) : (
		<Box sx={{ width: '100%', maxWidth, ...sx }} {...rest}>
			<Image
				src={TMK_DIY_LOGO_SRC}
				alt={alt}
				width={width}
				height={height}
				priority={priority}
				style={{
					width: '100%',
					height: 'auto',
					cursor: routeToHome ? 'pointer' : 'default',
				}}
			/>
		</Box>
	);

	if (!routeToHome) {
		return logo;
	}

	return (
		<Link
			href={homePath}
			aria-label={`${alt} home`}
			style={{ display: 'inline-block', lineHeight: 0 }}
		>
			{logo}
		</Link>
	);
}