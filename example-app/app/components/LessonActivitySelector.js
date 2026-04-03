'use client';

import { useState } from 'react';
import {
    Box,
    Button,
    MenuItem,
    Paper,
    TextField,
    Typography,
} from '@mui/material';

/**
 * LessonActivitySelector - A reusable dropdown selector for lesson activities
 * 
 * @param {Array} activities - Array of activity objects with { name, path, description }
 * @param {Function} onOpen - Callback when the Open button is clicked with (activity) => {}
 * @param {string} [selectedActivityPath] - Optional pre-selected activity path
 * @param {boolean} [disabled] - Optional disabled state
 */
export default function LessonActivitySelector({
    activities = [],
    onOpen,
    selectedActivityPath = null,
    disabled = false,
}) {
    const [selectedPath, setSelectedPath] = useState(selectedActivityPath || (activities.length > 0 ? activities[0].path : ''));

    const selectedActivity = activities.find((a) => a.path === selectedPath);

    const handleOpen = () => {
        if (selectedActivity && onOpen) {
            onOpen(selectedActivity);
        }
    };

    const handleActivityChange = (event) => {
        setSelectedPath(event.target.value);
    };

    return (
        <Paper
            sx={{
                p: 2.5,
                borderRadius: 1.5,
                backgroundColor: '#fafbfc',
                border: '1px solid #e0e7ff',
            }}
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                    select
                    fullWidth
                    label="Select Lesson Activity"
                    value={selectedPath}
                    onChange={handleActivityChange}
                    disabled={disabled || activities.length === 0}
                    size="medium"
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            backgroundColor: '#fff',
                        },
                    }}
                >
                    {activities.map((activity) => (
                        <MenuItem key={activity.path} value={activity.path}>
                            {activity.name}
                        </MenuItem>
                    ))}
                </TextField>

                {selectedActivity && (
                    <Box sx={{ px: 0.5 }}>
                        <Typography
                            variant="body2"
                            sx={{
                                color: '#5a6472',
                                lineHeight: 1.5,
                                fontStyle: 'italic',
                            }}
                        >
                            {selectedActivity.description}
                        </Typography>
                    </Box>
                )}

                <Button
                    variant="contained"
                    fullWidth
                    onClick={handleOpen}
                    disabled={disabled || !selectedActivity}
                    sx={{
                        textTransform: 'none',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                    }}
                >
                    Open Activity
                </Button>
            </Box>
        </Paper>
    );
}
