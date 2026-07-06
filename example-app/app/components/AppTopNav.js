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
	reserveLeadingActionsSpace = false,
	reserveRightContentSpace = true,
	containerSx,
	titleSx,
	logoSx,
}) {
	const router = useRouter();
	const hasLeadingActions = Boolean(leadingActions);
	const hasRightContent = Boolean(rightContent);

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
				display: 'grid',
				gridTemplateAreas: {
					xs: `'brand' 'sections' 'account'`,
					md: `'brand sections account'`,
				},
				gridTemplateColumns: {
					xs: '1fr',
					md: 'minmax(260px, 1fr) auto minmax(220px, auto)',
				},
				alignItems: 'center',
				columnGap: 2,
				rowGap: 1,
				...containerSx,
			}}
		>
			<Box
				sx={{
					gridArea: 'brand',
					display: 'flex',
					flexDirection: 'column',
					alignItems: { xs: 'stretch', md: 'flex-start' },
					minWidth: 0,
					gap: 0.75,
				}}
			>
				<Stack direction="row" alignItems="center" spacing={0.5} sx={{ minHeight: 56, minWidth: 0 }}>
					<TmkLogo sx={{ mb: 0, ...logoSx }} priority routeToHome />
					<Box sx={{ minWidth: 0, flex: 1 }}>
						{title ? (
							<Typography
								component="h1"
								sx={{
									fontSize: { xs: '1.6rem', md: '2.1rem' },
									lineHeight: 1.1,
									textTransform: 'uppercase',
									color: '#000',
									fontWeight: 700,
									pl: { xs: 1.5, md: 2 },
									whiteSpace: 'nowrap',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									...titleSx,
								}}
							>
								{title}
							</Typography>
						) : null}
					</Box>
				</Stack>
				<Box
					sx={{
						minHeight: { xs: 0, md: reserveLeadingActionsSpace ? 40 : 0 },
						display: 'flex',
						alignItems: 'center',
						visibility: hasLeadingActions ? 'visible' : reserveLeadingActionsSpace ? 'hidden' : 'visible',
					}}
				>
					{hasLeadingActions ? leadingActions : reserveLeadingActionsSpace ? <Box aria-hidden="true" sx={{ width: 1, height: 40 }} /> : null}
				</Box>
			</Box>

			<Stack
				direction="row"
				spacing={1.2}
				sx={{
					gridArea: 'sections',
					justifySelf: { xs: 'stretch', md: 'center' },
					justifyContent: { xs: 'stretch', md: 'center' },
					alignItems: 'center',
					minHeight: 40,
					'& > *': {
						flex: { xs: 1, md: 'none' },
					},
				}}
			>
				<Button
					variant="outlined"
					onClick={() => navigateTo('/lesson-activities')}
					disabled={currentSection === 'lesson-activities'}
					sx={{ ...buttonSx, minWidth: 148, height: 40 }}
				>
					Lesson Activities
				</Button>
				<Button
					variant="outlined"
					onClick={() => navigateTo('/lesson-projects')}
					disabled={currentSection === 'lesson-projects'}
					sx={{ ...buttonSx, minWidth: 124, height: 40 }}
				>
					DIY Projects
				</Button>
			</Stack>

			<Stack
				direction={{ xs: 'column', md: 'row' }}
				spacing={1}
				sx={{
					gridArea: 'account',
					justifySelf: { xs: 'stretch', md: 'end' },
					alignItems: { xs: 'stretch', md: 'center' },
					minWidth: { xs: 0, md: 280 },
					minHeight: 40,
				}}
			>
				<Button variant="contained" onClick={onAuthAction} sx={{ ...buttonSx, minWidth: 96, height: 40 }}>
					{authButtonLabel}
				</Button>
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: { xs: 'flex-start', md: 'flex-end' },
						minHeight: 36,
						minWidth: { xs: '100%', md: reserveRightContentSpace ? 190 : 0 },
						visibility: hasRightContent ? 'visible' : reserveRightContentSpace ? 'hidden' : 'visible',
					}}
				>
					{hasRightContent ? rightContent : reserveRightContentSpace ? <Box aria-hidden="true" sx={{ width: 190, height: 36 }} /> : null}
				</Box>
			</Stack>
		</Box>
	);
}
