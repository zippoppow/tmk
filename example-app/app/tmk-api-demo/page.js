'use client';

/**
 * TMK API Integration Example
 * 
 * This page demonstrates how to use the tmk-api client to fetch and display:
 * - Morphemes
 * - Words
 * - Wordlists
 * - Wordfamilies
 */

import { useEffect, useState } from 'react';
import { getApiAuthDebugInfo, tmkAPI } from '@/lib/api-client';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function TMKAPIPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [authDebug, setAuthDebug] = useState(() => getApiAuthDebugInfo());
  
  // Morphemes state
  const [morphemes, setMorphemes] = useState([]);
  const [morphemesLoading, setMorphemesLoading] = useState(false);
  const [morphemesError, setMorphemesError] = useState(null);

  // Words state
  const [words, setWords] = useState([]);
  const [wordsLoading, setWordsLoading] = useState(false);
  const [wordsError, setWordsError] = useState(null);

  // Wordlists state
  const [wordlists, setWordlists] = useState([]);
  const [wordlistsLoading, setWordlistsLoading] = useState(false);
  const [wordlistsError, setWordlistsError] = useState(null);

  // Wordfamilies state
  const [wordfamilies, setWordfamilies] = useState([]);
  const [wordfamiliesLoading, setWordfamiliesLoading] = useState(false);
  const [wordfamiliesError, setWordfamiliesError] = useState(null);

  // Parts of Speech state
  const [partsOfSpeech, setPartsOfSpeech] = useState([]);
  const [partsOfSpeechLoading, setPartsOfSpeechLoading] = useState(false);
  const [partsOfSpeechError, setPartsOfSpeechError] = useState(null);

  // Fetch morphemes
  const fetchMorphemes = async () => {
    setMorphemesLoading(true);
    setMorphemesError(null);
    try {
      const data = await tmkAPI.morphemes.getAll({ limit: 10 });
      setMorphemes(Array.isArray(data) ? data : []);
    } catch (err) {
      setMorphemesError(err.message);
      setMorphemes([]);
    } finally {
      setMorphemesLoading(false);
      setAuthDebug(getApiAuthDebugInfo());
    }
  };

  // Fetch words
  const fetchWords = async () => {
    setWordsLoading(true);
    setWordsError(null);
    try {
      const data = await tmkAPI.words.getAll({ limit: 10 });
      setWords(Array.isArray(data) ? data : []);
    } catch (err) {
      setWordsError(err.message);
      setWords([]);
    } finally {
      setWordsLoading(false);
      setAuthDebug(getApiAuthDebugInfo());
    }
  };

  // Fetch wordlists
  const fetchWordlists = async () => {
    setWordlistsLoading(true);
    setWordlistsError(null);
    try {
      const data = await tmkAPI.wordlists.getAll({ limit: 10 });
      setWordlists(Array.isArray(data) ? data : []);
    } catch (err) {
      setWordlistsError(err.message);
      setWordlists([]);
    } finally {
      setWordlistsLoading(false);
      setAuthDebug(getApiAuthDebugInfo());
    }
  };

  // Fetch wordfamilies
  const fetchWordfamilies = async () => {
    setWordfamiliesLoading(true);
    setWordfamiliesError(null);
    try {
      const data = await tmkAPI.wordfamilies.getAll({ limit: 10 });
      setWordfamilies(Array.isArray(data) ? data : []);
    } catch (err) {
      setWordfamiliesError(err.message);
      setWordfamilies([]);
    } finally {
      setWordfamiliesLoading(false);
      setAuthDebug(getApiAuthDebugInfo());
    }
  };

  // Fetch parts of speech
  const fetchPartsOfSpeech = async () => {
    setPartsOfSpeechLoading(true);
    setPartsOfSpeechError(null);
    try {
      const data = await tmkAPI.lookupTables.getPartsOfSpeech();
      setPartsOfSpeech(Array.isArray(data) ? data : []);
    } catch (err) {
      setPartsOfSpeechError(err.message);
      setPartsOfSpeech([]);
    } finally {
      setPartsOfSpeechLoading(false);
      setAuthDebug(getApiAuthDebugInfo());
    }
  };

  useEffect(() => {
    setAuthDebug(getApiAuthDebugInfo());
  }, []);

  const tokenExpiryText = authDebug.cacheExpiresAt
    ? new Date(authDebug.cacheExpiresAt).toLocaleString()
    : 'N/A';

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
      <Box component="main" sx={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <Typography variant="h1" sx={{ marginBottom: '2rem' }}>
          TMK API Integration Demo
        </Typography>

        <Alert severity="info" sx={{ marginBottom: '2rem' }}>
          This page demonstrates integration with the tmk-api running at{' '}
          <strong>http://localhost:3000</strong>. Make sure the API is running with auth configured
          (client credentials for <code>/api/auth/token</code>, or a transitional API key) before testing.
        </Alert>

        <Card sx={{ marginBottom: '2rem' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="h6">Auth Diagnostics</Typography>
              <Button variant="outlined" onClick={() => setAuthDebug(getApiAuthDebugInfo())}>
                Refresh Diagnostics
              </Button>
            </Box>
            <Box sx={{ marginTop: '1rem', display: 'grid', gap: '0.5rem' }}>
              <Typography variant="body2"><strong>Grant Type:</strong> {authDebug.authGrantType}</Typography>
              <Typography variant="body2"><strong>Last Auth Mode:</strong> {authDebug.lastAuthMode}</Typography>
              <Typography variant="body2"><strong>Last Endpoint:</strong> {authDebug.lastRequestEndpoint || 'N/A'}</Typography>
              <Typography variant="body2"><strong>Last Response Status:</strong> {authDebug.lastResponseStatus ?? 'N/A'}</Typography>
              <Typography variant="body2"><strong>Last Request Time:</strong> {authDebug.lastRequestAt || 'N/A'}</Typography>
              <Typography variant="body2"><strong>Cached Token:</strong> {authDebug.hasCachedToken ? 'Yes' : 'No'}</Typography>
              <Typography variant="body2"><strong>Token Expiry:</strong> {tokenExpiryText}</Typography>
              <Typography variant="body2"><strong>Static Access Token Configured:</strong> {authDebug.usingStaticAccessToken ? 'Yes' : 'No'}</Typography>
              <Typography variant="body2"><strong>API Key Fallback Configured:</strong> {authDebug.hasApiKeyFallback ? 'Yes' : 'No'}</Typography>
            </Box>
            {authDebug.lastTokenError && (
              <Alert severity="warning" sx={{ marginTop: '1rem' }}>
                {authDebug.lastTokenError}
              </Alert>
            )}
          </CardContent>
        </Card>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Morphemes" id="tab-0" />
            <Tab label="Words" id="tab-1" />
            <Tab label="Wordlists" id="tab-2" />
            <Tab label="Wordfamilies" id="tab-3" />
            <Tab label="Parts of Speech" id="tab-4" />
          </Tabs>
        </Box>

        {/* Morphemes Tab */}
        <TabPanel value={activeTab} index={0}>
          <Button variant="contained" onClick={fetchMorphemes} sx={{ marginBottom: '2rem' }}>
            Load Morphemes
          </Button>

          {morphemesLoading && <CircularProgress />}
          {morphemesError && <Alert severity="error">{morphemesError}</Alert>}

          {morphemes.length > 0 && (
            <Box>
              <Typography variant="h6" sx={{ marginBottom: '1rem' }}>
                Loaded {morphemes.length} morphemes
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'primary.main' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Meaning</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Role</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Origin</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Variants</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {morphemes.map((morpheme) => (
                      <TableRow
                        key={morpheme.id || morpheme._id}
                        sx={{
                          '&:nth-of-type(odd)': { bgcolor: '#f5f5f5' },
                          '&:hover': { bgcolor: '#e8f0f8' },
                        }}
                      >
                        <TableCell>{morpheme.id}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>{morpheme.name}</TableCell>
                        <TableCell>{morpheme.senseOfMeaning}</TableCell>
                        <TableCell>{morpheme.wordRole?.name || 'N/A'}</TableCell>
                        <TableCell>{morpheme.morphemeOrigin?.name || 'N/A'}</TableCell>
                        <TableCell>{morpheme.variants?.join(', ') || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </TabPanel>

        {/* Words Tab */}
        <TabPanel value={activeTab} index={1}>
          <Button variant="contained" onClick={fetchWords} sx={{ marginBottom: '2rem' }}>
            Load Words
          </Button>

          {wordsLoading && <CircularProgress />}
          {wordsError && <Alert severity="error">{wordsError}</Alert>}

          {words.length > 0 && (
            <Box>
              <Typography variant="h6" sx={{ marginBottom: '1rem' }}>
                Loaded {words.length} words
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'primary.main' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Text</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Part of Speech</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Definition</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Morphemes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {words.map((word) => (
                      <TableRow
                        key={word.id || word._id}
                        sx={{
                          '&:nth-of-type(odd)': { bgcolor: '#f5f5f5' },
                          '&:hover': { bgcolor: '#e8f0f8' },
                        }}
                      >
                        <TableCell>{word.id}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>{word.text}</TableCell>
                        <TableCell>{word.partOfSpeech?.name || 'N/A'}</TableCell>
                        <TableCell>{word.definition || '—'}</TableCell>
                        <TableCell>{word.morphemes?.length || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </TabPanel>

        {/* Wordlists Tab */}
        <TabPanel value={activeTab} index={2}>
          <Button variant="contained" onClick={fetchWordlists} sx={{ marginBottom: '2rem' }}>
            Load Wordlists
          </Button>

          {wordlistsLoading && <CircularProgress />}
          {wordlistsError && <Alert severity="error">{wordlistsError}</Alert>}

          {wordlists.length > 0 && (
            <Box>
              <Typography variant="h6" sx={{ marginBottom: '1rem' }}>
                Loaded {wordlists.length} wordlists
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'primary.main' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Description</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Word Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {wordlists.map((wordlist) => (
                      <TableRow
                        key={wordlist.id || wordlist._id}
                        sx={{
                          '&:nth-of-type(odd)': { bgcolor: '#f5f5f5' },
                          '&:hover': { bgcolor: '#e8f0f8' },
                        }}
                      >
                        <TableCell>{wordlist.id}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>{wordlist.name}</TableCell>
                        <TableCell>{wordlist.description || '—'}</TableCell>
                        <TableCell>{wordlist.words?.length || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </TabPanel>

        {/* Wordfamilies Tab */}
        <TabPanel value={activeTab} index={3}>
          <Button variant="contained" onClick={fetchWordfamilies} sx={{ marginBottom: '2rem' }}>
            Load Wordfamilies
          </Button>

          {wordfamiliesLoading && <CircularProgress />}
          {wordfamiliesError && <Alert severity="error">{wordfamiliesError}</Alert>}

          {wordfamilies.length > 0 && (
            <Box>
              <Typography variant="h6" sx={{ marginBottom: '1rem' }}>
                Loaded {wordfamilies.length} wordfamilies
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'primary.main' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Root</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Description</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Word Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {wordfamilies.map((family) => (
                      <TableRow
                        key={family.id || family._id}
                        sx={{
                          '&:nth-of-type(odd)': { bgcolor: '#f5f5f5' },
                          '&:hover': { bgcolor: '#e8f0f8' },
                        }}
                      >
                        <TableCell>{family.id}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>{family.name}</TableCell>
                        <TableCell>{family.root?.name || family.rootId || '—'}</TableCell>
                        <TableCell>{family.description || '—'}</TableCell>
                        <TableCell>{family.words?.length || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </TabPanel>

        {/* Parts of Speech Tab */}
        <TabPanel value={activeTab} index={4}>
          <Button variant="contained" onClick={fetchPartsOfSpeech} sx={{ marginBottom: '2rem' }}>
            Load Parts of Speech
          </Button>

          {partsOfSpeechLoading && <CircularProgress />}
          {partsOfSpeechError && <Alert severity="error">{partsOfSpeechError}</Alert>}

          {partsOfSpeech.length > 0 && (
            <Box>
              <Typography variant="h6" sx={{ marginBottom: '1rem' }}>
                Loaded {partsOfSpeech.length} parts of speech
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'primary.main' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Abbreviation</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {partsOfSpeech.map((pos) => (
                      <TableRow
                        key={pos.id || pos._id}
                        sx={{
                          '&:nth-of-type(odd)': { bgcolor: '#f5f5f5' },
                          '&:hover': { bgcolor: '#e8f0f8' },
                        }}
                      >
                        <TableCell>{pos.id}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>{pos.name}</TableCell>
                        <TableCell>{pos.abbreviation || '—'}</TableCell>
                        <TableCell>{pos.description || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </TabPanel>
      </Box>
  );
}
