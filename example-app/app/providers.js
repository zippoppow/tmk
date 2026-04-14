'use client';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import pegasus from '../../theme/index.js';

export default function Providers({ children }) {
  return (
    <ThemeProvider theme={pegasus}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}