import { createTheme } from '@mui/material'
import { ptBR } from '@mui/material/locale'

const ink = '#201e1d'
const ground = '#f3f2f2'
const surface = '#eae9e9'
const divider = 'rgba(32, 30, 29, 0.4)'

const accent = { 100: '#fff2ef', 500: '#ec3013', 600: '#dd2b0f', 700: '#ae1800', 800: '#7c1405' }

const neutral = {
  100: '#f8f4f4',
  200: '#eae7e7',
  300: '#d7d3d3',
  400: '#bab6b6',
  500: '#9b9797',
  600: '#7d7979',
  700: '#605d5d',
  800: '#444141',
  900: '#2d2b2b',
}

const inkTint = (percent: number) => `color-mix(in srgb, ${ink} ${percent}%, transparent)`
const shadow = { md: `0 3px 10px ${inkTint(16)}`, lg: `0 12px 32px ${inkTint(22)}` }
const focusRing = { outline: `2px solid ${accent[500]}`, outlineOffset: 2 }
const heading = { fontWeight: 800, letterSpacing: '-0.015em', lineHeight: 1.12 }

// cssVariables exposes the palette as --mui-* custom properties, so Tailwind classes
// can reference theme colors instead of duplicating them.
export const theme = createTheme(
  {
    cssVariables: true,
    palette: {
      mode: 'light',
      primary: { main: accent[500], dark: accent[600], contrastText: ground },
      error: { main: accent[700], light: accent[100], dark: accent[800], contrastText: ground },
      text: { primary: ink, secondary: neutral[700] },
      background: { default: ground, paper: surface },
      divider,
      grey: neutral,
    },
    shape: { borderRadius: 0 },
    spacing: 4,
    typography: {
      fontFamily: '"Archivo Variable", system-ui, sans-serif',
      h1: heading,
      h2: heading,
      h3: { ...heading, fontSize: 42 },
      h4: { ...heading, fontSize: 32 },
      h5: { ...heading, fontSize: 25 },
      h6: { ...heading, fontSize: 20 },
      subtitle1: { fontSize: 15, fontWeight: 600 },
      body1: { fontSize: 15, lineHeight: 1.55 },
      body2: { fontSize: 13, lineHeight: 1.55 },
      button: { fontSize: 14, fontWeight: 800, textTransform: 'none', lineHeight: 1.2 },
      overline: { fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', lineHeight: 1.6 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '::selection': { backgroundColor: `color-mix(in srgb, ${accent[500]} 30%, transparent)` },
          // Lucide icons drawn with square ends to match the zero-radius shapes.
          '.lucide': { strokeLinecap: 'square', strokeLinejoin: 'miter', flex: 'none' },
        },
      },
      // The ripple is replaced by flat hover tints, so keyboard focus needs its own ring.
      MuiButtonBase: {
        defaultProps: { disableRipple: true },
        styleOverrides: { root: { '&.Mui-focusVisible': focusRing } },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { justifyContent: 'flex-start', minHeight: 36, padding: '8px 14px' },
          sizeLarge: { minHeight: 44, fontSize: 14 },
          startIcon: { marginLeft: 0, marginRight: 6 },
          endIcon: { marginLeft: 'auto', paddingLeft: 12, marginRight: 0 },
        },
        variants: [
          {
            props: { variant: 'contained', color: 'primary' },
            style: { '&:active': { backgroundColor: accent[700] } },
          },
          {
            props: { variant: 'outlined', color: 'inherit' },
            style: { borderColor: divider, '&:hover': { borderColor: divider, backgroundColor: inkTint(7) } },
          },
          {
            props: { variant: 'text', color: 'primary' },
            style: {
              paddingInline: 4,
              '&:hover': { backgroundColor: `color-mix(in srgb, ${accent[500]} 10%, transparent)` },
            },
          },
        ],
      },
      MuiIconButton: {
        styleOverrides: {
          root: { borderRadius: 0, width: 36, height: 36, color: 'inherit', '&:hover': { backgroundColor: inkTint(7) } },
        },
      },
      MuiPaper: { defaultProps: { elevation: 0, square: true } },
      MuiMenu: { styleOverrides: { paper: { boxShadow: shadow.md, minWidth: 200 } } },
      MuiMenuItem: {
        styleOverrides: {
          root: { minHeight: 44, fontSize: 15, gap: 10, '& .MuiListItemIcon-root': { minWidth: 0 } },
        },
      },
      MuiListItemIcon: { styleOverrides: { root: { minWidth: 0, color: 'inherit' } } },
      MuiDialog: { styleOverrides: { paper: { boxShadow: shadow.lg } } },
      MuiBackdrop: {
        styleOverrides: { root: { '&:not(.MuiBackdrop-invisible)': { backgroundColor: `${neutral[900]}80` } } },
      },
      MuiAppBar: { defaultProps: { elevation: 0 } },
      MuiDrawer: { styleOverrides: { paper: { backgroundColor: ground, borderRight: 'none' } } },
      MuiTabs: { styleOverrides: { root: { minHeight: 0 }, indicator: { height: 2 } } },
      MuiTab: {
        styleOverrides: {
          root: {
            minWidth: 0,
            minHeight: 0,
            padding: '10px 0 12px',
            marginRight: 32,
            alignItems: 'flex-start',
            fontSize: 15,
            fontWeight: 600,
            color: neutral[700],
            '&.Mui-selected': { color: ink, fontWeight: 800 },
            // Full-width tabs (phones) split the bar evenly instead of hugging their labels.
            '&.MuiTab-fullWidth': { marginRight: 0, padding: '14px 16px' },
          },
        },
      },
      // Labels sit above the field instead of floating inside its border.
      MuiTextField: { defaultProps: { slotProps: { inputLabel: { shrink: true } } } },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            position: 'static',
            transform: 'none',
            fontSize: 12,
            lineHeight: 1.55,
            marginBottom: 5,
            color: inkTint(70),
            '&.Mui-focused': { color: inkTint(70) },
            '&.Mui-error': { color: accent[700] },
          },
        },
      },
      MuiOutlinedInput: {
        defaultProps: { notched: false },
        styleOverrides: {
          root: {
            backgroundColor: surface,
            minHeight: 44,
            // 16px on phones keeps iOS from zooming into the field.
            fontSize: 16,
            '@media (min-width:900px)': { fontSize: 15 },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: inkTint(45) },
            '&.Mui-focused': { outline: `2px solid ${accent[500]}` },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: accent[500], borderWidth: 1 },
            '&.Mui-error .MuiOutlinedInput-notchedOutline': { borderColor: accent[700], borderWidth: 2 },
            '&.Mui-error.Mui-focused': { outlineColor: accent[700] },
          },
          input: { padding: '6px 10px', caretColor: accent[500] },
          notchedOutline: { top: 0, borderColor: divider, '& legend': { display: 'none' } },
        },
      },
      MuiFormHelperText: { styleOverrides: { root: { margin: '6px 0 0', fontSize: 12, lineHeight: 1.55 } } },
      MuiAlert: {
        styleOverrides: {
          root: { fontSize: 14, padding: '8px 14px' },
        },
        variants: [
          {
            props: { variant: 'standard', severity: 'error' },
            style: { backgroundColor: accent[100], color: accent[800], '& .MuiAlert-icon': { color: accent[700] } },
          },
        ],
      },
      MuiSkeleton: {
        defaultProps: { animation: 'pulse' },
        styleOverrides: { root: { backgroundColor: inkTint(8) } },
      },
      MuiLink: {
        styleOverrides: { root: { color: accent[700], textUnderlineOffset: 3, '&:hover': { color: accent[800] } } },
      },
    },
  },
  ptBR,
)
