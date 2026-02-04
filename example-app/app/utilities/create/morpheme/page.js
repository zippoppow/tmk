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
} from '@mui/material';

const TMK_API_URL = process.env.NEXT_PUBLIC_TMK_API_URL || 'http://localhost:3000';

export default function CreateMorphemePage() {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    meaning: '',
    definition: '',
    etymology: '',
    language: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [morphemeTypes, setMorphemeTypes] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [lookupError, setLookupError] = useState('');

  // Fetch morpheme types on component mount
  useEffect(() => {
    const fetchMorphemeTypes = async () => {
      try {
        setLoadingLookups(true);
        setLookupError('');

        const response = await fetch(`${TMK_API_URL}/api/morpheme-types`);

        if (!response.ok) {
          console.error('Morpheme types fetch failed:', response.status, response.statusText);
          throw new Error(`Morpheme types fetch failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('Morpheme types data:', data);

        setMorphemeTypes(data.data || data || []);
      } catch (error) {
        console.error('Error fetching morpheme types:', error);
        setLookupError(`Failed to load morpheme types: ${error.message}`);
      } finally {
        setLoadingLookups(false);
      }
    };

    fetchMorphemeTypes();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        meaning: formData.meaning,
        definition: formData.definition,
        etymology: formData.etymology,
        language: formData.language,
        notes: formData.notes,
      };

      // Remove empty fields
      Object.keys(payload).forEach(
        (key) => payload[key] === '' && delete payload[key]
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
        type: '',
        meaning: '',
        definition: '',
        etymology: '',
        language: '',
        notes: '',
      });
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
                        <InputLabel>Type</InputLabel>
                        <Select
                          label="Type"
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                        >
                          <MenuItem value="">
                            <em>Select type</em>
                          </MenuItem>
                          {morphemeTypes.map((type) => (
                            <MenuItem key={type.id} value={type.id}>
                              {type.name} ({type.id})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Meaning"
                        name="meaning"
                        value={formData.meaning}
                        onChange={handleInputChange}
                        placeholder="e.g., to speak, before, act of"
                        multiline
                        rows={2}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Definition"
                        name="definition"
                        value={formData.definition}
                        onChange={handleInputChange}
                        placeholder="Detailed definition of the morpheme"
                        multiline
                        rows={2}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Etymology"
                        name="etymology"
                        value={formData.etymology}
                        onChange={handleInputChange}
                        placeholder="e.g., Latin, Greek, Anglo-Saxon"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Language"
                        name="language"
                        value={formData.language}
                        onChange={handleInputChange}
                        placeholder="e.g., Latin, Greek"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Additional notes or comments"
                        multiline
                        rows={2}
                      />
                    </Grid>
                  </Grid>

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
