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

export default function CreateWordListPage() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    language: '',
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
        category: formData.category,
        language: formData.language,
        notes: formData.notes,
      };

      // Remove empty fields
      Object.keys(payload).forEach(
        (key) => payload[key] === '' && delete payload[key]
      );

      console.log('Submitting payload:', payload);

      const response = await fetch(`${TMK_API_URL}/api/word-lists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create word list');
      }

      const result = await response.json();
      console.log('Word list created:', result);

      setMessage({
        type: 'success',
        text: `Word List "${formData.name}" created successfully!`,
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        category: '',
        language: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error creating word list:', error);
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
              Create Word List
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
                <strong>Instructions:</strong> Fill in the word list details below to add a new
                word list to the TMK API database. The list name is required; other fields are
                optional.
              </Typography>
            </Paper>

            <form onSubmit={handleSubmit}>
              {/* Basic Word List Information */}
              <Typography
                variant="h6"
                sx={{ fontWeight: 'bold', mb: 2, mt: 3 }}
              >
                Word List Information
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="List Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Latin Roots Set 5, Medical Terminology"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    placeholder="e.g., Science, Medical, Academic"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Language"
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    placeholder="e.g., Latin, Greek, Mixed"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Detailed description of this word list"
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
                    placeholder="Additional notes or usage guidelines"
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
                  {loading ? 'Creating...' : 'Create Word List'}
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  size="large"
                  onClick={() => {
                    setFormData({
                      name: '',
                      description: '',
                      category: '',
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
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
