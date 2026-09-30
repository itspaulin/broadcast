import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline, GlobalStyles, StyledEngineProvider, ThemeProvider } from '@mui/material'
import { theme } from './app/theme'
import { App } from './app/App'
import './index.css'

// Emotion injects its styles before index.css, so the layer order must also be declared
// here; otherwise `mui` becomes the lowest layer and Tailwind's preflight overrides it.
const LAYER_ORDER = '@layer theme, base, mui, components, utilities;'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StyledEngineProvider enableCssLayer>
      <GlobalStyles styles={LAYER_ORDER} />
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </StyledEngineProvider>
  </StrictMode>,
)
