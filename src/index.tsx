import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Demo from './Demo';

const darkTheme = createTheme({ palette: { mode: 'dark' } });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Demo />
    </ThemeProvider>
  </React.StrictMode>
);
