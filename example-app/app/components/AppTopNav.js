'use client';

import { useRouter } from 'next/navigation';
import { Box, Button, Stack, Typography } from '@mui/material';
import TmkLogo from './TmkLogo';

export default function AppTopNav({
	title,
	currentSection = '',
	onAuthAction,
	authButtonLabel = 'Logout',
	beforeNavigate,
	rightContent = null,
	leadingActions = null,
	containerSx,
	titleSx,
	logoSx,
}) {
	const router = useRouter();

	const buttonSx = { textTransform: 'none' };

	const navigateTo = async (path) => {
		if (typeof beforeNavigate === 'function') {
			await beforeNavigate(path);
		}
		router.push(path);
	};

	return (
		<Box
			sx={{
				mb: 1.5,
				display: 'flex',
				flexDirection: { xs: 'column', lg: 'row' },
				justifyContent: 'space-between',
				alignItems: { xs: 'stretch', lg: 'center' },
				gap: 1.5,
				...containerSx,
			}}
		>
			<Stack
				direction={{ xs: 'column', md: 'row' }}
				spacing={1.5}
				alignItems={{ xs: 'stretch', md: 'center' }}
				flexWrap="wrap"
				useFlexGap
			>
				<Stack direction="row" alignItems="center" spacing={0.5}>
					<TmkLogo sx={{ mb: 0, ...logoSx }} priority routeToHome />
					{title ? (
						<Typography
							component="h1"
							sx={{
								fontSize: { xs: '2rem', md: '3rem' },
								textTransform: 'uppercase',
								color: '#000',
								fontWeight: 700,
								pl: 5,
								...titleSx,
							}}
						>
							{title}
						</Typography>
					) : null}
				</Stack>
				{leadingActions}
			</Stack>

			<Stack
				direction={{ xs: 'column', md: 'row' }}
				spacing={1.2}
				sx={{ ml: { lg: 'auto' } }}
				alignItems={{ xs: 'stretch', md: 'center' }}
				flexWrap="wrap"
				useFlexGap
			>
				<Button
					variant="outlined"
					onClick={() => navigateTo('/lesson-activities')}
					disabled={currentSection === 'lesson-activities'}
					sx={buttonSx}
				>
					Lesson Activities
				</Button>
				<Button
					variant="outlined"
					onClick={() => navigateTo('/lesson-projects')}
					disabled={currentSection === 'lesson-projects'}
					sx={buttonSx}
				>
					DIY Projects
				</Button>
				<Button variant="contained" onClick={onAuthAction} sx={buttonSx}>
					{authButtonLabel}
				</Button>
				{rightContent}
			</Stack>
		</Box>
	);
}
