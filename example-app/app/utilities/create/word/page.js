'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
  Container,
  Paper,
  Button,
  Grid,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const TMK_API_URL = process.env.NEXT_PUBLIC_TMK_API_URL || 'http://localhost:3000';

export default function CreateWordPage() {
  const [formData, setFormData] = useState({
    name: '',
    baseMorphemeId: '',
    wordConstructor: '',
    totalSyllables: '',
    partOfSpeechId: '',
    dictionaryRef: '',
    vocabularyTierId: '',
    instructionalLevelId: '',
  });

  const [prefixes, setPrefixes] = useState([]);
  const [suffixes, setSuffixes] = useState([]);
  const [newPrefix, setNewPrefix] = useState({ morphemeId: '', position: '' });
  const [newSuffix, setNewSuffix] = useState({ morphemeId: '', position: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Lookup tables state
  const [morphemes, setMorphemes] = useState([]);
  const [partsOfSpeech, setPartsOfSpeech] = useState([]);
  const [vocabularyTiers, setVocabularyTiers] = useState([]);
  const [instructionalLevels, setInstructionalLevels] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [lookupError, setLookupError] = useState('');

  // Fetch lookup tables on component mount
  useEffect(() => {
    const fetchLookupTables = async () => {
      try {
        setLoadingLookups(true);
        setLookupError('');

        const [morphemesRes, posRes, tiersRes, levelsRes] = await Promise.all([
          fetch(`${TMK_API_URL}/api/morphemes`),
          fetch(`${TMK_API_URL}/api/parts-of-speech`),
          fetch(`${TMK_API_URL}/api/vocabulary-tiers`),
          fetch(`${TMK_API_URL}/api/instructional-levels`),
        ]);

        if (!morphemesRes.ok) {
          console.error('Morphemes fetch failed:', morphemesRes.status, morphemesRes.statusText);
          throw new Error(`Morphemes fetch failed: ${morphemesRes.status}`);
        }
        if (!posRes.ok) {
          console.error('Parts of Speech fetch failed:', posRes.status, posRes.statusText);
          throw new Error(`Parts of Speech fetch failed: ${posRes.status}`);
        }
        if (!tiersRes.ok) {
          console.error('Vocabulary Tiers fetch failed:', tiersRes.status, tiersRes.statusText);
          throw new Error(`Vocabulary Tiers fetch failed: ${tiersRes.status}`);
        }
        if (!levelsRes.ok) {
          console.error('Instructional Levels fetch failed:', levelsRes.status, levelsRes.statusText);
          throw new Error(`Instructional Levels fetch failed: ${levelsRes.status}`);
        }

        const morphemesData = await morphemesRes.json();
        const posData = await posRes.json();
        const tiersData = await tiersRes.json();
        const levelsData = await levelsRes.json();

        console.log('Morphemes data:', morphemesData);
        console.log('Parts of Speech data:', posData);
        console.log('Vocabulary Tiers data:', tiersData);
        console.log('Instructional Levels data:', levelsData);

        setMorphemes(morphemesData.data || morphemesData || []);
        setPartsOfSpeech(posData.data || posData || []);
        setVocabularyTiers(tiersData.data || tiersData || []);
        setInstructionalLevels(levelsData.data || levelsData || []);
      } catch (error) {
        console.error('Error fetching lookup tables:', error);
        setLookupError(`Failed to load lookup tables: ${error.message}`);
      } finally {
        setLoadingLookups(false);
      }
    };

    fetchLookupTables();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddPrefix = () => {
    if (newPrefix.morphemeId && newPrefix.position) {
      setPrefixes((prev) => [
        ...prev,
        {
          morphemeId: parseInt(newPrefix.morphemeId),
          position: parseInt(newPrefix.position),
        },
      ]);
      setNewPrefix({ morphemeId: '', position: '' });
    }
  };

  const handleAddSuffix = () => {
    if (newSuffix.morphemeId && newSuffix.position) {
      setSuffixes((prev) => [
        ...prev,
        {
          morphemeId: parseInt(newSuffix.morphemeId),
          position: parseInt(newSuffix.position),
        },
      ]);
      setNewSuffix({ morphemeId: '', position: '' });
    }
  };

  const handleRemovePrefix = (index) => {
    setPrefixes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveSuffix = (index) => {
    setSuffixes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        name: formData.name,
        baseMorphemeId: parseInt(formData.baseMorphemeId),
        wordConstructor: formData.wordConstructor,
        totalSyllables: parseInt(formData.totalSyllables),
        partOfSpeechId: parseInt(formData.partOfSpeechId),
        dictionaryRef: formData.dictionaryRef,
        vocabularyTierId: parseInt(formData.vocabularyTierId),
        instructionalLevelId: parseInt(formData.instructionalLevelId),
        prefixes: prefixes.length > 0 ? prefixes : undefined,
        suffixes: suffixes.length > 0 ? suffixes : undefined,
      };

      // Remove undefined fields
      Object.keys(payload).forEach(
        (key) => payload[key] === undefined && delete payload[key]
      );

      const response = await fetch(`${TMK_API_URL}/api/words`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create word');
      }

      const result = await response.json();
      setMessage({
        type: 'success',
        text: `Word "${formData.name}" created successfully!`,
      });

      // Reset form
      setFormData({
        name: '',
        baseMorphemeId: '',
        wordConstructor: '',
        totalSyllables: '',
        partOfSpeechId: '',
        dictionaryRef: '',
        vocabularyTierId: '',
        instructionalLevelId: '',
      });
      setPrefixes([]);
      setSuffixes([]);
      setNewPrefix({ morphemeId: '', position: '' });
      setNewSuffix({ morphemeId: '', position: '' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Error: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="main" sx={{ py: 4, bgcolor: '#f9f9f9', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        <Card sx={{ boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
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
              Create Word
            </Typography>

            {/* Message Alert */}
            {message.text && (
              <Alert severity={message.type} sx={{ mb: 3 }}>
                {message.text}
              </Alert>
            )}

            {/* Lookup Error Alert */}
            {lookupError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {lookupError}
              </Alert>
            )}

            {/* Loading Indicator */}
            {loadingLookups && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading lookup tables...</Typography>
              </Box>
            )}

            {!loadingLookups && (
              <>
                <Paper
                  sx={{
                    p: 2,
                    mb: 4,
                    bgcolor: '#fff9e6',
                    border: '1px solid #ffd966',
                  }}
                >
                  <Typography variant="body2">
                    <strong>Instructions:</strong> Fill in the word details below to add a new word to
                    the TMK API database. You can optionally add prefixes and suffixes.
                  </Typography>
                </Paper>

                <form onSubmit={handleSubmit}>
              {/* Basic Word Information */}
              <Typography
                variant="h6"
                sx={{ fontWeight: 'bold', mb: 2, mt: 3 }}
              >
                Word Information
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Word Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., intercontinental"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Word Constructor"
                    name="wordConstructor"
                    value={formData.wordConstructor}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., inter- + con- + tine + -ent + -al"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Base Morpheme</InputLabel>
                    <Select
                      label="Base Morpheme"
                      name="baseMorphemeId"
                      value={formData.baseMorphemeId}
                      onChange={handleInputChange}
                    >
                      <MenuItem value="">
                        <em>Select a morpheme</em>
                      </MenuItem>
                      {morphemes.map((morpheme) => (
                        <MenuItem key={morpheme.id} value={morpheme.id}>
                          {morpheme.name} ({morpheme.id})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Total Syllables"
                    name="totalSyllables"
                    type="number"
                    value={formData.totalSyllables}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Part of Speech</InputLabel>
                    <Select
                      label="Part of Speech"
                      name="partOfSpeechId"
                      value={formData.partOfSpeechId}
                      onChange={handleInputChange}
                    >
                      <MenuItem value="">
                        <em>Select part of speech</em>
                      </MenuItem>
                      {partsOfSpeech.map((pos) => (
                        <MenuItem key={pos.id} value={pos.id}>
                          {pos.name} ({pos.id})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Dictionary Reference"
                    name="dictionaryRef"
                    value={formData.dictionaryRef}
                    onChange={handleInputChange}
                    placeholder="e.g., MW-12345"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Vocabulary Tier</InputLabel>
                    <Select
                      label="Vocabulary Tier"
                      name="vocabularyTierId"
                      value={formData.vocabularyTierId}
                      onChange={handleInputChange}
                    >
                      <MenuItem value="">
                        <em>Select vocabulary tier</em>
                      </MenuItem>
                      {vocabularyTiers.map((tier) => (
                        <MenuItem key={tier.id} value={tier.id}>
                          {tier.name} ({tier.id})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Instructional Level</InputLabel>
                    <Select
                      label="Instructional Level"
                      name="instructionalLevelId"
                      value={formData.instructionalLevelId}
                      onChange={handleInputChange}
                    >
                      <MenuItem value="">
                        <em>Select instructional level</em>
                      </MenuItem>
                      {instructionalLevels.map((level) => (
                        <MenuItem key={level.id} value={level.id}>
                          {level.name} ({level.id})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Prefixes Section */}
              <Typography
                variant="h6"
                sx={{ fontWeight: 'bold', mb: 2, mt: 3 }}
              >
                Prefixes
              </Typography>

              <Paper sx={{ p: 2, mb: 3, bgcolor: '#f0f8ff', border: '1px solid #b3e5fc' }}>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Morpheme</InputLabel>
                      <Select
                        label="Morpheme"
                        value={newPrefix.morphemeId}
                        onChange={(e) =>
                          setNewPrefix((prev) => ({
                            ...prev,
                            morphemeId: e.target.value,
                          }))
                        }
                      >
                        <MenuItem value="">
                          <em>Select morpheme</em>
                        </MenuItem>
                        {morphemes.map((morpheme) => (
                          <MenuItem key={morpheme.id} value={morpheme.id}>
                            {morpheme.name} ({morpheme.id})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Position"
                      type="number"
                      size="small"
                      value={newPrefix.position}
                      onChange={(e) =>
                        setNewPrefix((prev) => ({
                          ...prev,
                          position: e.target.value,
                        }))
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      onClick={handleAddPrefix}
                      sx={{ height: '40px' }}
                    >
                      Add Prefix
                    </Button>
                  </Grid>
                </Grid>

                {prefixes.length > 0 && (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#e1f5fe' }}>
                          <TableCell>Morpheme ID</TableCell>
                          <TableCell>Position</TableCell>
                          <TableCell align="center">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {prefixes.map((prefix, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{prefix.morphemeId}</TableCell>
                            <TableCell>{prefix.position}</TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={() => handleRemovePrefix(idx)}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>

              {/* Suffixes Section */}
              <Typography
                variant="h6"
                sx={{ fontWeight: 'bold', mb: 2, mt: 3 }}
              >
                Suffixes
              </Typography>

              <Paper sx={{ p: 2, mb: 3, bgcolor: '#f0f8ff', border: '1px solid #b3e5fc' }}>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Morpheme</InputLabel>
                      <Select
                        label="Morpheme"
                        value={newSuffix.morphemeId}
                        onChange={(e) =>
                          setNewSuffix((prev) => ({
                            ...prev,
                            morphemeId: e.target.value,
                          }))
                        }
                      >
                        <MenuItem value="">
                          <em>Select morpheme</em>
                        </MenuItem>
                        {morphemes.map((morpheme) => (
                          <MenuItem key={morpheme.id} value={morpheme.id}>
                            {morpheme.name} ({morpheme.id})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Position"
                      type="number"
                      size="small"
                      value={newSuffix.position}
                      onChange={(e) =>
                        setNewSuffix((prev) => ({
                          ...prev,
                          position: e.target.value,
                        }))
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      onClick={handleAddSuffix}
                      sx={{ height: '40px' }}
                    >
                      Add Suffix
                    </Button>
                  </Grid>
                </Grid>

                {suffixes.length > 0 && (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#e1f5fe' }}>
                          <TableCell>Morpheme ID</TableCell>
                          <TableCell>Position</TableCell>
                          <TableCell align="center">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {suffixes.map((suffix, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{suffix.morphemeId}</TableCell>
                            <TableCell>{suffix.position}</TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveSuffix(idx)}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>

              {/* Action Buttons */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  mt: 4,
                }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Word'}
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  size="large"
                  onClick={() => {
                    setFormData({
                      name: '',
                      baseMorphemeId: '',
                      wordConstructor: '',
                      totalSyllables: '',
                      partOfSpeechId: '',
                      dictionaryRef: '',
                      vocabularyTierId: '',
                      instructionalLevelId: '',
                    });
                    setPrefixes([]);
                    setSuffixes([]);
                    setMessage({ type: '', text: '' });
                  }}
                >
                  Clear Form
                </Button>
              </Box>
            </form>
              </>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
