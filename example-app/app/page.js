'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDiyAccess } from './components/useDiyAccess';
import {
    buildTeachableLogoutUrl,
} from './components/authHelpers';
import AppTopNav from './components/AppTopNav';
import {
    Alert,
    Container,
    Box,
    Collapse,
    Grid,
    LinearProgress,
    Typography,
    Button,
    Paper,
    IconButton,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

export default function HomePage() {
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);
    const [activePreviewIndex, setActivePreviewIndex] = useState(0);
    const [isCarouselOpen, setIsCarouselOpen] = useState(false);
    const { hasDiyAccess, authUser: user, loading: enrollmentLoading } = useDiyAccess();

    const previewImages = useMemo(
        () => [
            { src: '/lesson-activities/preview-images/Intro.png', alt: 'Intro lesson activity preview' },
            { src: '/lesson-activities/preview-images/CommonBaseWord.png', alt: 'Common Base Word lesson activity preview' },
            { src: '/lesson-activities/preview-images/ConstructorDeconstructor.png', alt: 'Constructor Deconstructor lesson activity preview' },
            { src: '/lesson-activities/preview-images/FillInTheMorphConnectedText.png', alt: 'Fill In The Morph Connected Text lesson activity preview' },
            { src: '/lesson-activities/preview-images/MorphMatchDefinitions.png', alt: 'Morph Match Definitions lesson activity preview' },
            { src: '/lesson-activities/preview-images/MorphMatchRelatedWords.png', alt: 'Morph Match Related Words lesson activity preview' },
            { src: '/lesson-activities/preview-images/MorphMorphMatch.png', alt: 'Morph Morph Match lesson activity preview' },
            { src: '/lesson-activities/preview-images/MorphSort.png', alt: 'Morph Sort lesson activity preview' },
            { src: '/lesson-activities/preview-images/MorphWhich.png', alt: 'Morph Which lesson activity preview' },
            { src: '/lesson-activities/preview-images/PartOfSpeechSort.png', alt: 'Part Of Speech Sort lesson activity preview' },
            { src: '/lesson-activities/preview-images/WordBuilder.png', alt: 'Word Builder lesson activity preview' },
            { src: '/lesson-activities/preview-images/WordMeaning.png', alt: 'Word Meaning lesson activity preview' },
            { src: '/lesson-activities/preview-images/ChameleonPrefixes.png', alt: 'Chameleon Prefixes lesson activity preview' },
        ],
        []
    );

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleLogout = () => {
        window.location.href = buildTeachableLogoutUrl('/');
    };

    const handlePreviousPreview = () => {
        setActivePreviewIndex((currentIndex) => (currentIndex - 1 + previewImages.length) % previewImages.length);
    };

    const handleNextPreview = () => {
        setActivePreviewIndex((currentIndex) => (currentIndex + 1) % previewImages.length);
    };

    if (!isMounted || !user) {
        return null;
    }

  return (
      <Box sx={{
                minHeight: '100vh',
                backgroundImage:
                    "linear-gradient(rgba(255, 255, 255, 0.8), rgba(255,255,255,0.86)), url('/branding/tmk_diy_cat.png')",
                backgroundSize: '65% auto',
                backgroundPosition: 'center calc(10%)',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: { xs: 'scroll', md: 'fixed' },
            }}
        >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <AppTopNav
                title="Dashboard"
                currentSection="dashboard"
                onAuthAction={handleLogout}
                authButtonLabel="Logout"
                leadingActions={(
                    <Typography variant="body1">
                        Welcome, {user?.profile?.name || user?.name || user?.profile?.email || user?.email || 'User'}
                    </Typography>
                )}
          />
          {(enrollmentLoading || !hasDiyAccess) && (
                <Box sx={{ mb: 2 }}>
                    {enrollmentLoading ? (
                        <Alert severity="info" sx={{ alignItems: 'center' }}>
                            <Box sx={{ width: '100%' }}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    Checking your DIY course enrollment status…
                                </Typography>
                                <LinearProgress color="info" />
                            </Box>
                        </Alert>
                    ) : (
                        <Alert severity="warning">
                            Enrollment check complete. Active enrollment in the DIY course is required to access Lesson Activities and Projects.
                            If you believe you should have access, please contact support or visit the{' '}
                            <a href="https://themorphologykit.com/p/diy" target="_blank" rel="noopener noreferrer">The Morphology Kit® DIY Course page</a> to enroll.
                        </Alert>
                    )}
                </Box>
          )}

          <Grid container spacing={{ xs: 2, md: 3 }} alignItems="flex-start" sx={{ mb: 4 }}>
                {/* Left column: Lesson Activities + Standalone */}
                <Grid item xs={12} md={6} sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3, order: { xs: 2, md: 1 } }}>
                    <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid #224c88' }}>
                        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                            Lesson Activities
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                            {hasDiyAccess
                                ? 'Create and manage single, standalone lesson activities.'
                                : 'Available after active DIY course enrollment is verified.'}
                        </Typography>
                        <Button variant="contained" onClick={() => router.push('/lesson-activities')} disabled={!hasDiyAccess}>
                            Go to Lesson Activities
                        </Button>
                    </Paper>
                </Grid>

                {/* Right column: Projects */}
                <Grid item xs={12} md={6} sx={{ order: { xs: 1, md: 2 } }}>
                    <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid #224c88' }}>
                        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                            Projects (Sequences of Activities)
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                            {hasDiyAccess
                                ? 'Create and manage sequences of lesson activities.'
                                : 'Available after active DIY course enrollment is verified.'}
                        </Typography>
                        <Button variant="contained" onClick={() => router.push('/lesson-projects')} disabled={!hasDiyAccess}>
                            Go to Projects
                        </Button>
                    </Paper>
                </Grid>
            </Grid>

            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid #224c88', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1 }}>
                    <Typography variant="h6" component="h2">
                        Preview Lesson Activities
                    </Typography>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setIsCarouselOpen((currentState) => !currentState)}
                        sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
                    >
                        {isCarouselOpen ? 'Collapse' : 'Expand'}
                    </Button>
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    Browse sample lesson activity screenshots.
                </Typography>

                <Collapse in={isCarouselOpen} timeout="auto" unmountOnExit>
                    <Box
                        sx={{
                            position: 'relative',
                            borderRadius: 2,
                            overflow: 'hidden',
                            bgcolor: '#f4f7ff',
                            border: '1px solid #d7e0f4',
                            minHeight: { xs: 280, md: 360 },
                            maxHeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Box
                            component="img"
                            src={previewImages[activePreviewIndex]?.src}
                            alt={previewImages[activePreviewIndex]?.alt}
                            sx={{
                                width: '100%',
                                maxHeight: 600,
                                objectFit: 'contain',
                                display: 'block',
                            }}
                        />

                        <IconButton
                            aria-label="Previous preview image"
                            onClick={handlePreviousPreview}
                            sx={{
                                position: 'absolute',
                                left: 10,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#153a73',
                                bgcolor: '#dbe7ff',
                                border: '1px solid #9cb8ea',
                                '&:hover': { bgcolor: '#c8dbff' },
                            }}
                        >
                            <ArrowBackIosNewIcon fontSize="small" />
                        </IconButton>

                        <IconButton
                            aria-label="Next preview image"
                            onClick={handleNextPreview}
                            sx={{
                                position: 'absolute',
                                right: 10,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#153a73',
                                bgcolor: '#dbe7ff',
                                border: '1px solid #9cb8ea',
                                '&:hover': { bgcolor: '#c8dbff' },
                            }}
                        >
                            <ArrowForwardIosIcon fontSize="small" />
                        </IconButton>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                        {previewImages.map((image, index) => (
                            <Box
                                key={image.src}
                                onClick={() => setActivePreviewIndex(index)}
                                sx={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    bgcolor: index === activePreviewIndex ? '#224c88' : '#bdd0f3',
                                    transition: 'background-color 0.2s ease',
                                }}
                            />
                        ))}
                    </Box>
                </Collapse>
            </Paper>

            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid #224c88', mb: 4  }}>
                <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
                    Copyright
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    View copyright and legal attribution information.
                </Typography>
                <Button variant="outlined" onClick={() => router.push('/copyright')}>
                    Open Copyright Page
                </Button>
            </Paper>
        </Container>

      </Box>
  );
}
