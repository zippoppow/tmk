'use client';

import { Box, Button, Container, Paper, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import TmkLogo from '../components/TmkLogo';

export default function CopyrightPage() {
	const router = useRouter();

	return (
		<Box
			sx={{
				minHeight: '100vh',
				background: 'linear-gradient(135deg, #f7f9ff 0%, #eef2ff 100%)',
				py: 4,
				px: 1,
			}}
		>
			<Container maxWidth="md">
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
					<TmkLogo sx={{ mb: 0 }} />
					<Button variant="outlined" onClick={() => router.push('/')} sx={{ textTransform: 'none' }}>
						Back to Home
					</Button>
				</Box>

				<Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, border: '1px solid #dbe2f0' }}>
					<Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
						Copyright & Usage Policy
					</Typography>

					<Typography sx={{ color: '#374151', mb: 2 }}>
						All Morphology Kit(R) DIY Latin Progression templates and materials are protected by copyright law. Purchase of these templates grants the purchaser a single-user license for educational use with their own students only.
					</Typography>

					<Typography sx={{ color: '#374151', mb: 2 }}>
						By purchasing and downloading these materials, you agree to the following terms:
					</Typography>

					<Typography component="ul" sx={{ color: '#374151', pl: 3, mb: 2 }}>
						<li>
							Materials may be used only by the purchaser in their own classroom, tutoring practice, or instructional setting.
						</li>
						<li>
							Materials created using these templates are for personal instructional use only.
						</li>
					</Typography>

					<Typography sx={{ color: '#374151', mb: 1 }}>
						Materials may not be:
					</Typography>

					<Typography component="ul" sx={{ color: '#374151', pl: 3 }}>
						<li>Reproduced</li>
						<li>Distributed</li>
						<li>Shared digitally or physically</li>
						<li>Uploaded to shared drives or learning platforms</li>
						<li>Posted online</li>
						<li>Sold</li>
						<li>Resold</li>
						<li>Licensed</li>
						<li>Included in trainings, courses, or commercial products</li>
						<li>Used for professional development resale</li>
						<li>Used for commercial purposes</li>
					</Typography>
				</Paper>
			</Container>
		</Box>
	);
}
