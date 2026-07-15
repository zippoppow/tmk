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
						<li>Email Address</li>
						<li>Log data (e.g., access times)</li>
						<li>Activity within the app (e.g., pages accessed, features used)</li>
						<li>We do not store your IP address.</li>
					</Typography>
					<Typography sx={{ color: '#374151', mb: 2 }}>
						Certain account registration and payment information is collected and maintained by Teachable under its own Privacy Policy. We encourage you to review Teachable's Privacy Policy for information about how it collects, uses, and protects your personal information.
					</Typography>
					<Typography sx={{ color: '#374151', mb: 2 }}>
						We process your information:
					</Typography>
					<Typography component="ul" sx={{ color: '#374151', pl: 3, mb: 2 }}>
						<li>to provide the service you requested</li>
						<li>to authenticate your account</li>
						<li>to maintain application security</li>
						<li>to improve our services</li>
						<li>to comply with legal obligations</li>
					</Typography>
					<Typography sx={{ color: '#374151', mb: 2 }}>
						Where required by law, we rely on your consent or our legitimate interests as the legal basis for processing.
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
					<Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
						Cookies and Browser Local Storage
					</Typography>
					<Typography sx={{ color: '#374151', mb: 2 }}>
						We use cookies and similar technologies (e.g., browser local storage) to:
					</Typography>
					<Typography sx={{ color: '#374151', mb: 2 }}>
						<li>keep you logged in</li>
						<li>remember your preferences</li>
						<li>improve site performance</li>
					</Typography>
					<Typography sx={{ color: '#374151', mb: 2 }}>
						Certain account and purchase information is collected and maintained by Teachable under its own Privacy Policy. We encourage you to review Teachable's Privacy Policy to understand how that information is handled.
					</Typography>
					<Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Data Retention</Typography>
					<Typography sx={{ color: '#374151', mb: 2 }}>
						We retain your personal information only as long as necessary to provide the application, comply with legal obligations, resolve disputes, and enforce our agreements. When information is no longer needed, it is securely deleted or anonymized.
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
						<li>We use reasonable administrative, technical, and organizational safeguards appropriate to the nature of the information we collect.</li>
					</Typography>
					<Typography sx={{ color: '#374151', mb: 2 }}>
						While we strive to protect your information, please be aware that no method of transmission over the internet or method of electronic storage is 100% secure. Therefore, we cannot guarantee absolute security. In the event of a data breach, we will notify you and any applicable regulators as required by law.
					</Typography>
					<Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
						Third-Party Services
					</Typography>
					<Typography sx={{ color: '#374151', mb: 2 }}>
						We use trusted third-party service providers to operate the application. These providers may process personal information on our behalf. Examples include:
					</Typography>
					<Typography component="ul" sx={{ color: '#374151', pl: 3, mb: 2 }}>
						<li>Teachable (course management)</li>
						<li>Vercel (hosting and deployment)</li>
						<li>Railway (hosting and database)</li>
						<li>Cloudflare (content delivery and security)</li>
					</Typography>
					<Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
						Automated Decision Making
					</Typography>
					<Typography sx={{ color: '#374151', mb: 2 }}>
						We do not use your personal information for automated decision-making or profiling that produces legal or similarly significant effects.
					</Typography>
					<Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
						Changes to this Privacy Statement
					</Typography>
					<Typography sx={{ color: '#374151', mb: 2 }}>
						We may update this Privacy Statement from time to time. When we make material changes, we will update the Effective Date and provide notice through the application or by email where appropriate.
					</Typography>
					<Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
						International Transfers
					</Typography>
					<Typography sx={{ color: '#374151', mb: 2 }}>
						Your information may be processed in the United States or other countries where our service providers operate. Where required by law, we use appropriate safeguards for international data transfers.
					</Typography>
					<Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
						Children's Privacy
					</Typography>
					<Typography sx={{ color: '#374151', mb: 2 }}>
						This application is intended for educators and other adults. We do not knowingly collect personal information from children under 13 (or under the applicable age in your jurisdiction). If we become aware that we have collected such information, we will delete it promptly.
					</Typography>
					<Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
						California Rights (CCPA/CPRA)
					</Typography>
					<Typography sx={{ color: '#374151', mb: 2 }}>
						We do not sell or share personal information for cross-context behavioral advertising.
					</Typography>
					<Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
						Canadian Privacy
					</Typography>
					<Typography sx={{ color: '#374151', mb: 2 }}>
						By creating an account and using the application, you consent to the collection, use, and disclosure of your information as described in this Privacy Statement, subject to applicable law.
					</Typography>
					<Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
						Australian Privacy
					</Typography>
					<Typography sx={{ color: '#374151', mb: 2 }}>
						If you believe we have not handled your information appropriately, please contact us first. If you remain dissatisfied, you may contact the Office of the Australian Information Commissioner or the applicable privacy authority in your jurisdiction.
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
						<li>The right to restrict processing</li>
						<li>The right to object</li>
						<li>The right to data portability</li>
					</Typography>
					<Typography sx={{ color: '#374151', mb: 2 }}>
						If you wish to exercise any of these rights, please contact us using the information provided below.
					</Typography>
					<Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
						Contact Us
					</Typography>
					<Typography sx={{ color: '#374151', mb: 2 }}>
						This application is operated by Sound Literacy Solutions LLC, owner of The Morphology Kit®. Sound Literacy Solutions LLC is the data controller responsible for the personal information described in this Privacy Statement.
					</Typography>
					<Typography sx={{ color: '#374151', mb: 2 }}>
						If you have any questions or concerns about this Privacy Statement or our data practices, please contact us at:
					</Typography>
					<Typography sx={{ color: '#374151', mb: 2 }}>
						Email: the-team@themorphologykit.com
					</Typography>
					<Typography sx={{ color: '#374151', mb: 2 }}>
						Website: https://themorphologykit.com
					</Typography>
					<Typography sx={{ color: '#374151', mb: 2 }}>
						Thank you for being a part of The Morphology Kit® DIY App community. We are committed to protecting your privacy and ensuring a secure and enriching experience.
					</Typography>
				</Paper>
			</Container>
		</Box>
	);
}
