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
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const TMK_API_URL = process.env.NEXT_PUBLIC_TMK_API_URL || 'http://localhost:3000';

export default function CreateMorphemePage() {
  const [formData, setFormData] = useState({
    name: '',
    senseOfMeaning: '',
    variants: [],
    pronunciations: [],
    morphemeWordRoleId: '',
    morphemeWordOriginId: '',
    wordFormationConventionId: '',
  });

  const [newVariant, setNewVariant] = useState('');
  const [newPronunciation, setNewPronunciation] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [wordRoles, setWordRoles] = useState([]);
  const [morphemeOrigins, setMorphemeOrigins] = useState([]);
  const [wordFormationConventions, setWordFormationConventions] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [lookupError, setLookupError] = useState('');

  // Fetch lookup tables on component mount
  useEffect(() => {
    const fetchLookupTables = async () => {
      try {
        setLoadingLookups(true);
        setLookupError('');

        const [rolesRes, originsRes, conventionsRes] = await Promise.all([
          fetch(`${TMK_API_URL}/api/morpheme-word-roles`),
          fetch(`${TMK_API_URL}/api/morpheme-word-origins`),
          fetch(`${TMK_API_URL}/api/word-formation-conventions`),
        ]);

        if (!rolesRes.ok) {
          console.error('Word roles fetch failed:', rolesRes.status, rolesRes.statusText);
          throw new Error(`Word roles fetch failed: ${rolesRes.status}`);
        }
        if (!originsRes.ok) {
          console.error('Morpheme origins fetch failed:', originsRes.status, originsRes.statusText);
          throw new Error(`Morpheme origins fetch failed: ${originsRes.status}`);
        }
        if (!conventionsRes.ok) {
          console.error('Word formation conventions fetch failed:', conventionsRes.status, conventionsRes.statusText);
          throw new Error(`Word formation conventions fetch failed: ${conventionsRes.status}`);
        }

        const rolesData = await rolesRes.json();
        const originsData = await originsRes.json();
        const conventionsData = await conventionsRes.json();

        console.log('Word roles data:', rolesData);
        console.log('Morpheme origins data:', originsData);
        console.log('Word formation conventions data:', conventionsData);

        setWordRoles(rolesData.data || rolesData || []);
        setMorphemeOrigins(originsData.data || originsData || []);
        setWordFormationConventions(conventionsData.data || conventionsData || []);
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

  const handleAddVariant = () => {
    if (newVariant.trim()) {
      setFormData((prev) => ({
        ...prev,
        variants: [...prev.variants, newVariant.trim()],
      }));
      setNewVariant('');
    }
  };

  const handleRemoveVariant = (index) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const handleAddPronunciation = () => {
    if (newPronunciation.trim()) {
      setFormData((prev) => ({
        ...prev,
        pronunciations: [...prev.pronunciations, newPronunciation.trim()],
      }));
      setNewPronunciation('');
    }
  };

  const handleRemovePronunciation = (index) => {
    setFormData((prev) => ({
      ...prev,
      pronunciations: prev.pronunciations.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        name: formData.name,
        senseOfMeaning: formData.senseOfMeaning,
        variants: formData.variants.length > 0 ? formData.variants : undefined,
        pronunciations: formData.pronunciations.length > 0 ? formData.pronunciations : undefined,
        morphemeWordRoleId: formData.morphemeWordRoleId ? parseInt(formData.morphemeWordRoleId) : undefined,
        morphemeWordOriginId: formData.morphemeWordOriginId ? parseInt(formData.morphemeWordOriginId) : undefined,
        wordFormationConventionId: formData.wordFormationConventionId ? parseInt(formData.wordFormationConventionId) : undefined,
      };

      // Remove undefined fields
      Object.keys(payload).forEach(
        (key) => payload[key] === undefined && delete payload[key]
      );

      console.log('Submitting payload:', payload);

      const response = await fetch(`${TMK_API_URL}/api/morphemes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create morpheme');
      }

      const result = await response.json();
      console.log('Morpheme created:', result);

      setMessage({
        type: 'success',
        text: `Morpheme "${formData.name}" created successfully!`,
      });

      // Reset form
      setFormData({
        name: '',
        senseOfMeaning: '',
        variants: [],
        pronunciations: [],
        morphemeWordRoleId: '',
        morphemeWordOriginId: '',
        wordFormationConventionId: '',
      });
      setNewVariant('');
      setNewPronunciation('');
    } catch (error) {
      console.error('Error creating morpheme:', error);
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
              Create Morpheme
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
                <Typography sx={{ ml: 2 }}>Loading morpheme types...</Typography>
              </Box>
            )}

            {!loadingLookups && (
              <>
                {/* Instructions */}
                <Paper
                  sx={{
                    p: 2,
                    mb: 4,
                    bgcolor: '#fff9e6',
                    border: '1px solid #ffd966',
                  }}
                >
                  <Typography variant="body2">
                    <strong>Instructions:</strong> Fill in the morpheme details below to add a new
                    morpheme to the TMK API database. The morpheme name is required; other fields
                    are optional.
                  </Typography>
                </Paper>

                <form onSubmit={handleSubmit}>
                  {/* Basic Morpheme Information */}
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 'bold', mb: 2, mt: 3 }}
                  >
                    Morpheme Information
                  </Typography>

                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Morpheme Name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g., DICT, PRE-, -TION"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Word Role</InputLabel>
                        <Select
                          label="Word Role"
                          name="morphemeWordRoleId"
                          value={formData.morphemeWordRoleId}
                          onChange={handleInputChange}
                        >
                          <MenuItem value="">
                            <em>Select word role</em>
                          </MenuItem>
                          {wordRoles.map((role) => (
                            <MenuItem key={role.id} value={role.id}>
                              {role.name} ({role.id})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Sense of Meaning"
                        name="senseOfMeaning"
                        value={formData.senseOfMeaning}
                        onChange={handleInputChange}
                        placeholder="e.g., above, to speak, able to"
                        multiline
                        rows={2}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Morpheme Origin</InputLabel>
                        <Select
                          label="Morpheme Origin"
                          name="morphemeWordOriginId"
                          value={formData.morphemeWordOriginId}
                          onChange={handleInputChange}
                        >
                          <MenuItem value="">
                            <em>Select origin</em>
                          </MenuItem>
                          {morphemeOrigins.map((origin) => (
                            <MenuItem key={origin.id} value={origin.id}>
                              {origin.name} ({origin.id})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Word Formation Convention</InputLabel>
                        <Select
                          label="Word Formation Convention"
                          name="wordFormationConventionId"
                          value={formData.wordFormationConventionId}
                          onChange={handleInputChange}
                        >
                          <MenuItem value="">
                            <em>Select convention</em>
                          </MenuItem>
                          {wordFormationConventions.map((convention) => (
                            <MenuItem key={convention.id} value={convention.id}>
                              {convention.name} ({convention.id})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>

                  {/* Variants Section */}
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 'bold', mb: 2, mt: 3 }}
                  >
                    Variants
                  </Typography>

                  <Paper sx={{ p: 2, mb: 3, bgcolor: '#f0f8ff', border: '1px solid #b3e5fc' }}>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} sm={9}>
                        <TextField
                          fullWidth
                          label="Variant"
                          size="small"
                          value={newVariant}
                          onChange={(e) => setNewVariant(e.target.value)}
                          placeholder="e.g., COL-, COR-, COM-"
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Button
                          variant="contained"
                          color="primary"
                          fullWidth
                          onClick={handleAddVariant}
                          sx={{ height: '40px' }}
                        >
                          Add Variant
                        </Button>
                      </Grid>
                    </Grid>

                    {formData.variants.length > 0 && (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: '#e1f5fe' }}>
                              <TableCell>Variant</TableCell>
                              <TableCell align="center">Action</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {formData.variants.map((variant, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{variant}</TableCell>
                                <TableCell align="center">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleRemoveVariant(idx)}
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

                  {/* Pronunciations Section */}
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 'bold', mb: 2, mt: 3 }}
                  >
                    Pronunciations
                  </Typography>

                  <Paper sx={{ p: 2, mb: 3, bgcolor: '#f0f8ff', border: '1px solid #b3e5fc' }}>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} sm={9}>
                        <TextField
                          fullWidth
                          label="Pronunciation"
                          size="small"
                          value={newPronunciation}
                          onChange={(e) => setNewPronunciation(e.target.value)}
                          placeholder="e.g., /kɒn/, /trænz/"
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Button
                          variant="contained"
                          color="primary"
                          fullWidth
                          onClick={handleAddPronunciation}
                          sx={{ height: '40px' }}
                        >
                          Add Pronunciation
                        </Button>
                      </Grid>
                    </Grid>

                    {formData.pronunciations.length > 0 && (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: '#e1f5fe' }}>
                              <TableCell>Pronunciation</TableCell>
                              <TableCell align="center">Action</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {formData.pronunciations.map((pronunciation, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{pronunciation}</TableCell>
                                <TableCell align="center">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleRemovePronunciation(idx)}
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
                      {loading ? 'Creating...' : 'Create Morpheme'}
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      size="large"
                      onClick={() => {
                        setFormData({
                          name: '',
                          type: '',
                          meaning: '',
                          definition: '',
                          etymology: '',
                          language: '',
                          notes: '',
                        });
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
