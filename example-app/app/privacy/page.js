'use client';

import { Box, Button, Container, Paper, Typography } from '@mui/material';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TmkLogo from '../components/TmkLogo';
import { useDiyAccess } from '../components/useDiyAccess';

export default function PrivacyPage() {
	const router = useRouter();
	const { authUser, loading } = useDiyAccess();

	useEffect(() => {
		if (loading) {
			return;
		}

		if (!authUser) {
			router.replace('/login?next=/privacy');
		}
	}, [authUser, loading, router]);

	if (loading || !authUser) {
		return (
			<Box
				sx={{
					minHeight: '100vh',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					background: 'linear-gradient(135deg, #f7f9ff 0%, #eef2ff 100%)',
					px: 2,
				}}
			>
				<Typography sx={{ color: '#153a73', fontSize: '1.05rem', textAlign: 'center' }}>
					{loading ? 'Checking login...' : 'Session expired. Redirecting to login...'}
				</Typography>
			</Box>
		);
	}

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
					<TmkLogo sx={{ mb: 0 }} routeToHome />
					<Button variant="outlined" onClick={() => router.push('/')} sx={{ textTransform: 'none' }}>
						Back to Home
					</Button>
				</Box>

				<Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, border: '1px solid #dbe2f0' }}>
					<Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
						Privacy Statement
					</Typography>

					<Typography sx={{ color: '#374151', mb: 2 }}>
						Effective Date: 07/10/2026
					</Typography>

					<Typography sx={{ color: '#374151', mb: 2 }}>
						Welcome to The Morphology Kit® DIY App, an enrollee-only web application designed exclusively for literacy instructors to create morphology-based lesson activities tailored to their instructional needs. Your privacy is important to us, and this Privacy Statement outlines our practices regarding the collection, use, and protection of your information.
					</Typography>
					<Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
						Data Collection
					</Typography>
					<Typography sx={{ color: '#374151', mb: 2 }}>
						We collect personal information that you provide when you register for our application, including:
					</Typography>

					<Typography component="ul" sx={{ color: '#374151', pl: 3, mb: 2 }}>
						<li>Email Address (the only personal data we store for login purposes)</li>
					</Typography>

					<Typography sx={{ color: '#374151', mb: 2 }}>
						Additionally, we may collect data about your usage of the application, including:
					</Typography>

					<Typography component="ul" sx={{ color: '#374151', pl: 3, mb: 2 }}>
						<li>Device information</li>
						<li>Log data (e.g., access times, browser types)</li>
						<li>Interaction data (e.g., pages accessed, features used)</li>
					</Typography>

					<Typography sx={{ color: '#374151', mb: 2 }}>
						All other contact information is stored on Teachable.com's system, and we are not liable for its management. By providing your email address, you consent to the collection and use of your information as described in this Privacy Statement.
					</Typography>
					<Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
						Data Usage and Sharing
					</Typography>
					<Typography sx={{ color: '#374151', mb: 2 }}>
						We use the collected data to improve the functionality and user experience of the application. We do not sell or share your personal information with third parties, except as required by law or to provide the services you request.
					</Typography>
					<Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
						Data Usage
					</Typography>
					<Typography sx={{ color: '#374151', mb: 2 }}>
						We use the collected data for the following purposes:
					</Typography>

					<Typography component="ul" sx={{ color: '#374151', pl: 3, mb: 2 }}>
						<li>To provide and maintain our services</li>
						<li>To improve our application and develop new features</li>
						<li>To communicate with you regarding your account and application updates</li>
						<li>To provide customer support and respond to inquiries</li>
						<li>To analyze usage trends and gather insights for improving instructional content</li>
					</Typography>

					<Typography sx={{ color: '#374151', mb: 2 }}>
						Please note that we are not liable for the management of contact information stored on Teachable.com's system, as it is handled by their system. We will not use your personal information for any other purposes without obtaining your consent first.
					</Typography>
					<Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
						Data Security
					</Typography>
					<Typography sx={{ color: '#374151', mb: 2 }}>
						We take data security seriously and implement appropriate technical and organizational measures to protect your personal information. This includes:
					</Typography>
					<Typography component="ul" sx={{ color: '#374151', pl: 3, mb: 2 }}>
						<li>Encryption of sensitive data during transmission</li>
						<li>Access controls to limit data access to authorized personnel only</li>
						<li>Regular security assessments to identify and mitigate risks</li>
					</Typography>
					<Typography sx={{ color: '#374151', mb: 2 }}>
						While we strive to protect your information, please be aware that no method of transmission over the internet or method of electronic storage is 100% secure. Therefore, we cannot guarantee absolute security. In the event of a data breach, we will notify you and any applicable regulators as required by law.
					</Typography>
					<Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
						User Rights
					</Typography>
					<Typography sx={{ color: '#374151', mb: 2 }}>
						As a user, you have certain rights regarding your personal information, including:
					</Typography>
					<Typography component="ul" sx={{ color: '#374151', pl: 3, mb: 2 }}>
						<li>The right to access and obtain a copy of your data</li>
						<li>The right to request correction of any inaccurate or incomplete data</li>
						<li>The right to request deletion of your personal information, subject to legal obligations</li>
						<li>The right to withdraw consent for data processing at any time</li>
						<li>The right to lodge a complaint with a supervisory authority if you believe that your rights have been violated</li>
					</Typography>
					<Typography sx={{ color: '#374151', mb: 2 }}>
						If you wish to exercise any of these rights, please contact us using the information provided below.
					</Typography>
					<Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
						Contact Us
					</Typography>
					<Typography sx={{ color: '#374151', mb: 2 }}>
						If you have any questions or concerns about this Privacy Statement or our data practices, please contact us at:
					</Typography>
					<Typography sx={{ color: '#374151', mb: 2 }}>
						Email: the-team@themorphologykit.com
					</Typography>
					<Typography sx={{ color: '#374151', mb: 2 }}>
						Website: https://framework.themorphologykit.com
					</Typography>
					<Typography sx={{ color: '#374151', mb: 2 }}>
						Thank you for being a part of The Morphology Kit® DIY App community. We are committed to protecting your privacy and ensuring a secure and enriching experience.
					</Typography>
				</Paper>
			</Container>
		</Box>
	);
}
