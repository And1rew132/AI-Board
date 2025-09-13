// Spacing design tokens
export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.25rem',   // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '2rem',   // 32px
  '4xl': '2.5rem', // 40px
  '5xl': '3rem',   // 48px
  '6xl': '4rem',   // 64px
}

// Border radius tokens
export const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.25rem', // 20px
  full: '9999px',  // Fully rounded
}

// Shadow tokens
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 4px 15px rgba(0, 0, 0, 0.05)',
  md: '0 4px 15px rgba(0, 0, 0, 0.1)',
  lg: '0 8px 25px rgba(0, 0, 0, 0.1)',
  xl: '0 10px 40px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
}

// CSS custom properties
export const cssSpacing = `
  --spacing-xs: ${spacing.xs};
  --spacing-sm: ${spacing.sm};
  --spacing-md: ${spacing.md};
  --spacing-lg: ${spacing.lg};
  --spacing-xl: ${spacing.xl};
  --spacing-2xl: ${spacing['2xl']};
  --spacing-3xl: ${spacing['3xl']};
  --spacing-4xl: ${spacing['4xl']};
  --border-radius-sm: ${borderRadius.sm};
  --border-radius-md: ${borderRadius.md};
  --border-radius-lg: ${borderRadius.lg};
  --border-radius-xl: ${borderRadius.xl};
  --border-radius-full: ${borderRadius.full};
  --shadow-sm: ${shadows.sm};
  --shadow-base: ${shadows.base};
  --shadow-md: ${shadows.md};
  --shadow-lg: ${shadows.lg};
  --shadow-xl: ${shadows.xl};
`