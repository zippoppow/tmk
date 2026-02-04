'use client';

import { useState } from 'react';
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
} from '@mui/material';

const TMK_API_URL = process.env.NEXT_PUBLIC_TMK_API_URL || 'http://localhost:3000';

export default function CreateVocabularyTierPage() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tierLevel: '',
    abbreviation: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

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
        description: formData.description,
        tierLevel: formData.tierLevel ? parseInt(formData.tierLevel) : undefined,
        abbreviation: formData.abbreviation,
        notes: formData.notes,
      };

      // Remove empty fields
      Object.keys(payload).forEach(
        (key) => payload[key] === '' || payload[key] === undefined && delete payload[key]
      );

      console.log('Submitting payload:', payload);

      const response = await fetch(`${TMK_API_URL}/api/vocabulary-tiers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create vocabulary tier');
      }

      const result = await response.json();
      console.log('Vocabulary tier created:', result);

      setMessage({
        type: 'success',
        text: `Vocabulary Tier "${formData.name}" created successfully!`,
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        tierLevel: '',
        abbreviation: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error creating vocabulary tier:', error);
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
              Create Vocabulary Tier
            </Typography>

            {/* Message Alert */}
            {message.text && (
              <Alert severity={message.type} sx={{ mb: 3 }}>
                {message.text}
              </Alert>
            )}

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
                <strong>Instructions:</strong> Fill in the vocabulary tier details below to add a new
                vocabulary tier to the TMK API database. The tier name is required; other fields are
                optional.
              </Typography>
            </Paper>

            <form onSubmit={handleSubmit}>
              {/* Basic Vocabulary Tier Information */}
              <Typography
                variant="h6"
                sx={{ fontWeight: 'bold', mb: 2, mt: 3 }}
              >
                Vocabulary Tier Information
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Tier Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Tier 1, Tier 2, Advanced"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Tier Level"
                    name="tierLevel"
                    type="number"
                    value={formData.tierLevel}
                    onChange={handleInputChange}
                    placeholder="e.g., 1, 2, 3"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Abbreviation"
                    name="abbreviation"
                    value={formData.abbreviation}
                    onChange={handleInputChange}
                    placeholder="e.g., T1, T2, T3"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Detailed description of this vocabulary tier"
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Additional notes or criteria for this tier"
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
                  {loading ? 'Creating...' : 'Create Vocabulary Tier'}
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  size="large"
                  onClick={() => {
                    setFormData({
                      name: '',
                      description: '',
                      tierLevel: '',
                      abbreviation: '',
                      notes: '',
                    });
                    setMessage({ type: '', text: '' });
                  }}
                >
                  Clear Form
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
