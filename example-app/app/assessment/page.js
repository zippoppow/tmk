'use client';

import { useEffect, useMemo, useState } from 'react';
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Container,
	FormControl,
	InputLabel,
	MenuItem,
	Paper,
	Select,
	Typography,
} from '@mui/material';
import TmkLogo from '../components/TmkLogo';
import { tmkAPI } from '@/lib/api-client';

export default function AssessmentPage() {
	const [morphemes, setMorphemes] = useState([]);
	const [words, setWords] = useState([]);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState('');

	const [selectedMorpheme, setSelectedMorpheme] = useState('');
	const [selectedWord, setSelectedWord] = useState('');
	const [showWordSelector, setShowWordSelector] = useState(false);

	useEffect(() => {
		const loadOptions = async () => {
			setLoading(true);
			setLoadError('');
			try {
				const [morphemeData, wordData] = await Promise.all([
					tmkAPI.morphemes.getAll({ limit: 5 }),
					tmkAPI.words.getAll({ limit: 5 }),
				]);

				setMorphemes(Array.isArray(morphemeData) ? morphemeData.slice(0, 5) : []);
				setWords(Array.isArray(wordData) ? wordData.slice(0, 5) : []);
			} catch (error) {
				setLoadError(error?.message || 'Failed to load morphemes and words.');
				setMorphemes([]);
				setWords([]);
			} finally {
				setLoading(false);
			}
		};

		loadOptions();
	}, []);

	const morphemeOptions = useMemo(() => {
		return morphemes.map((morpheme) => ({
			value: String(morpheme?.id || morpheme?._id || morpheme?.name || ''),
			label: morpheme?.name || morpheme?.morpheme || 'Unnamed morpheme',
		}));
	}, [morphemes]);

	const wordOptions = useMemo(() => {
		return words.map((word) => ({
			value: String(word?.id || word?._id || word?.text || ''),
			label: word?.text || word?.word || 'Unnamed word',
		}));
	}, [words]);

	return (
		<Container maxWidth="md" sx={{ py: 4 }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
				<TmkLogo sx={{ mb: 2 }} priority />
				<Typography variant="h4" component="h1">
					Assessment
				</Typography>
				<Box sx={{ width: 180 }} />
			</Box>

			<Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid #224c88' }}>
				{loading && (
					<Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
						<CircularProgress />
					</Box>
				)}

				{!!loadError && (
					<Alert severity="error" sx={{ mb: 2 }}>
						{loadError}
					</Alert>
				)}

				<Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
					<FormControl sx={{ minWidth: 320 }} size="small" disabled={loading || morphemeOptions.length === 0}>
						<InputLabel id="morpheme-select-label">Select Morpheme</InputLabel>
						<Select
							labelId="morpheme-select-label"
							value={selectedMorpheme}
							label="Select Morpheme"
							onChange={(event) => setSelectedMorpheme(event.target.value)}
						>
							{morphemeOptions.map((option) => (
								<MenuItem key={option.value} value={option.value}>
									{option.label}
								</MenuItem>
							))}
						</Select>
					</FormControl>
					<Button
						variant="contained"
						onClick={() => setShowWordSelector(true)}
						disabled={!selectedMorpheme}
					>
						Next
					</Button>
				</Box>

				{showWordSelector && (
					<Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
						<FormControl sx={{ minWidth: 320 }} size="small" disabled={loading || wordOptions.length === 0}>
							<InputLabel id="word-select-label">Select Word</InputLabel>
							<Select
								labelId="word-select-label"
								value={selectedWord}
								label="Select Word"
								onChange={(event) => setSelectedWord(event.target.value)}
							>
								{wordOptions.map((option) => (
									<MenuItem key={option.value} value={option.value}>
										{option.label}
									</MenuItem>
								))}
							</Select>
						</FormControl>
						<Button variant="contained" disabled={!selectedWord}>
							Next
						</Button>
					</Box>
				)}
			</Paper>
		</Container>
	);
}
