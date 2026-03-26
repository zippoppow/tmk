'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
  Container,
  Paper,
  Button,
  Stack,
  Snackbar,
  Alert,
} from '@mui/material';
import ProjectManagerPanel from '../components/ProjectManagerPanel';
import {
  buildTeachableLogoutUrl,
  buildTeachableStartUrl,
  clearFormSessionData,
  fetchAuthenticatedUser,
  readFormSessionData,
  resolveTmkApiOrigin,
  writeFormSessionData,
} from '../components/lessonActivityHelpers';

const FORM_NAME = 'morph-sort';

function normalizeMorphSortLessonInputData(rawData) {
  const source = rawData && typeof rawData === 'object' ? rawData : {};
  return {
    morpheme: String(source.morpheme || ''),
    categoryA: String(source.categoryA || ''),
    categoryB: String(source.categoryB || ''),
    categoryC: String(source.categoryC || ''),
    notes: String(source.notes || ''),
  };
}

export default function MorphSortPage() {
  const [morpheme, setMorpheme] = useState('');
  const [categoryA, setCategoryA] = useState('');
  const [categoryB, setCategoryB] = useState('');
  const [categoryC, setCategoryC] = useState('');
  const [notes, setNotes] = useState('');
  const [authUser, setAuthUser] = useState(null);
  const [notice, setNotice] = useState({ open: false, severity: 'success', message: '' });

  const apiOrigin = useMemo(() => resolveTmkApiOrigin(), []);

  const currentLessonInputData = useMemo(
    () => normalizeMorphSortLessonInputData({ morpheme, categoryA, categoryB, categoryC, notes }),
    [morpheme, categoryA, categoryB, categoryC, notes]
  );

  const showNotice = (severity, message) => {
    setNotice({ open: true, severity, message });
  };

  const persistSession = (nextData) => {
    writeFormSessionData(FORM_NAME, nextData);
  };

  const applyLessonInputData = (data) => {
    const normalized = normalizeMorphSortLessonInputData(data);
    setMorpheme(normalized.morpheme);
    setCategoryA(normalized.categoryA);
    setCategoryB(normalized.categoryB);
    setCategoryC(normalized.categoryC);
    setNotes(normalized.notes);
  };

  const clearLessonInputs = () => {
    setMorpheme('');
    setCategoryA('');
    setCategoryB('');
    setCategoryC('');
    setNotes('');
  };

  useEffect(() => {
    const stored = readFormSessionData(FORM_NAME);
    if (stored) {
      applyLessonInputData(stored);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      persistSession(currentLessonInputData);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [currentLessonInputData]);

  useEffect(() => {
    const checkAuth = async () => {
      const user = await fetchAuthenticatedUser(apiOrigin);
      setAuthUser(user);
    };

    checkAuth();
  }, [apiOrigin]);

  const handleSaveSession = () => {
    persistSession(currentLessonInputData);
    showNotice('success', authUser ? 'Session saved locally. Teachable login is active.' : 'Session saved locally.');
  };

  const handleClearSession = () => {
    if (!window.confirm('Clear all saved data for this exercise?')) {
      return;
    }

    clearFormSessionData(FORM_NAME);
    clearLessonInputs();
    showNotice('info', 'Saved data cleared.');
  };

  const initiateOAuthLogin = () => {
    window.location.href = buildTeachableStartUrl(apiOrigin, window.location.href);
  };

  const handleLoginLogout = () => {
    if (authUser) {
      window.location.href = buildTeachableLogoutUrl(window.location.href);
      return;
    }

    initiateOAuthLogin();
  };

  return (
    <Box component="main" sx={{ py: 4, bgcolor: '#f9f9f9', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 1.5 }}>
          <Button variant="contained" onClick={handleLoginLogout} sx={{ textTransform: 'none' }}>
            {authUser ? 'Logout from Teachable' : 'Login with Teachable'}
          </Button>
          <ProjectManagerPanel
            formName={FORM_NAME}
            apiOrigin={apiOrigin}
            isAuthenticated={Boolean(authUser)}
            userEmail={authUser?.email || ''}
            currentLessonInputData={currentLessonInputData}
            normalizeLessonInputData={normalizeMorphSortLessonInputData}
            createEmptyLessonInputData={() => normalizeMorphSortLessonInputData({})}
            applyLessonInputData={applyLessonInputData}
            clearLessonInputs={clearLessonInputs}
            onRequireLogin={() => {
              const shouldLogin = window.confirm('Project Manager requires Teachable login. Log in now?');
              if (shouldLogin) {
                initiateOAuthLogin();
              }
            }}
            onNotice={showNotice}
          />
          <Button variant="outlined" onClick={handleSaveSession} sx={{ textTransform: 'none' }}>
            Save Session
          </Button>
          <Button variant="outlined" color="error" onClick={handleClearSession} sx={{ textTransform: 'none' }}>
            Clear Saved Data
          </Button>
        </Stack>

        <Card sx={{ boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                textAlign: 'center',
                fontWeight: 'bold',
                mb: 3,
                textTransform: 'uppercase',
              }}
            >
              LATIN PROGRESSION MORPH SORT
            </Typography>

            <Paper
              sx={{
                p: 2,
                mb: 3,
                bgcolor: '#f0f8ff',
                border: '1px solid #ccc',
              }}
            >
              <Typography variant="body1">
                <strong>Instructions:</strong> Sort words into categories based on how the morpheme changes meaning.
              </Typography>
            </Paper>

            <Stack spacing={2.2} sx={{ mb: 3 }}>
              <TextField
                label="Morpheme(s)"
                value={morpheme}
                onChange={(e) => setMorpheme(e.target.value)}
                fullWidth
              />
              <TextField
                label="Category A"
                value={categoryA}
                onChange={(e) => setCategoryA(e.target.value)}
                fullWidth
                multiline
                minRows={2}
                placeholder="Example words..."
              />
              <TextField
                label="Category B"
                value={categoryB}
                onChange={(e) => setCategoryB(e.target.value)}
                fullWidth
                multiline
                minRows={2}
                placeholder="Example words..."
              />
              <TextField
                label="Category C"
                value={categoryC}
                onChange={(e) => setCategoryC(e.target.value)}
                fullWidth
                multiline
                minRows={2}
                placeholder="Example words..."
              />
              <TextField
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
                multiline
                minRows={2}
              />
            </Stack>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.2, flexWrap: 'wrap' }}>
              <Button variant="contained" onClick={handleSaveSession}>
                Submit Exercise
              </Button>
              <Button variant="outlined" onClick={clearLessonInputs}>
                Clear Fields
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>

      <Snackbar
        open={notice.open}
        autoHideDuration={2600}
        onClose={() => setNotice((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          severity={notice.severity}
          variant="filled"
          onClose={() => setNotice((prev) => ({ ...prev, open: false }))}
        >
          {notice.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}