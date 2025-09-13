// Color design tokens
export const colors = {
  // Primary brand colors
  primary: {
    50: '#f0f4ff',
    100: '#e1e9ff',
    500: '#667eea',
    600: '#5a67d8',
    700: '#4c51bf',
  },
  
  // Secondary colors
  secondary: {
    500: '#764ba2',
    600: '#6b3f87',
    700: '#5a336b',
  },
  
  // Status colors
  success: {
    50: '#d4edda',
    500: '#28a745',
    600: '#218838',
    700: '#1e7e34',
  },
  
  warning: {
    50: '#fff3cd',
    500: '#ffc107',
    600: '#e0a800',
    700: '#d39e00',
  },
  
  danger: {
    50: '#f8d7da',
    500: '#dc3545',
    600: '#c82333',
    700: '#bd2130',
  },
  
  // Gray scale
  gray: {
    50: '#f8f9fa',
    100: '#e9ecef',
    200: '#dee2e6',
    300: '#ced4da',
    400: '#adb5bd',
    500: '#6c757d',
    600: '#495057',
    700: '#343a40',
    800: '#212529',
    900: '#161719',
  },
  
  // Semantic colors
  white: '#ffffff',
  black: '#000000',
  
  // Background overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  backdropBlur: 'rgba(255, 255, 255, 0.95)',
}

// CSS custom properties for use in components
export const cssColors = `
  --color-primary: ${colors.primary[500]};
  --color-primary-light: ${colors.primary[100]};
  --color-secondary: ${colors.secondary[500]};
  --color-success: ${colors.success[500]};
  --color-warning: ${colors.warning[500]};
  --color-danger: ${colors.danger[500]};
  --color-gray-50: ${colors.gray[50]};
  --color-gray-100: ${colors.gray[100]};
  --color-gray-300: ${colors.gray[300]};
  --color-gray-500: ${colors.gray[500]};
  --color-gray-700: ${colors.gray[700]};
  --color-white: ${colors.white};
  --color-black: ${colors.black};
  --color-overlay: ${colors.overlay};
  --color-backdrop-blur: ${colors.backdropBlur};
`