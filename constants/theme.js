export const COLORS = {
  // Navigation
  active: '#007AFF',
  inactive: '#8E8E93',
  white: '#FFFFFF',
  background: '#1C1C1E',
  border: '#38383A',

  // App
  appBackground: '#FFFFFF',
  header: '#FFFFFF',
  text: '#1F2937',

  // Login
  primary: '#FDB347',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  divider: '#E5E7EB',
  social: {
      facebook: '#1877F2',
      google: '#DB4437'
  },

  // Auth Screen
  authBackground: '#E9E9E9',
  authText: '#1E1E2D',
  authTextSecondary: '#A2A2A7',
  authDivider: '#CCCCCC',
  authButton: '#CCCCCC'
};

export const SIZES = {
  // Icons
  regular: 32,
  large: 40,
  button: 45,
  socialIcon: 24,
  inputIcon: 20,

  // Spacing
  padding: {
      small: 5,
      medium: 8,
      large: 10,
      xlarge: 16,
      xxlarge: 24,
      xxxlarge: 28,
      xxxxlarge: 36
  },

  // Font Sizes
  font: {
      small: 12,
      medium: 14,
      large: 16,
      xlarge: 28,
      xxlarge: 32,
      xxxlarge: 36
  },

  // Border Radius
  radius: {
      small: 8,
      medium: 12,
      large: 24,
      xlarge: 50
  }
};

export const NAV_ITEMS = [
  { name: 'HomeScreen', icon: 'home', label: 'Home' },
  { name: 'Summary', icon: 'pie-chart', label: 'Statistics' },
  { name: 'Add', icon: 'add', isAddButton: true },
  { name: 'AI', icon: 'sparkles', label: 'AI' },
  { name: 'Settings', icon: 'settings', label: 'Settings' }
];

export const HEADER_STYLE = {
  headerStyle: {
      backgroundColor: COLORS.header,
  },
  headerTintColor: COLORS.text,
  headerTitleStyle: {
      fontWeight: '600',
  },
};

export const SHADOWS = {
  small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
  },
  medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
  }
};


// Account types for selection
export const ACCOUNT_TYPES = [
  { label: 'Balance Tracking', value: 'balance' },
  { label: 'Income/Expense Tracker', value: 'income_tracker' },
  { label: 'Savings Goal', value: 'savings_goal' },
];

// Default category colors for selection
export const DEFAULT_CATEGORY_COLORS = [
  { label: 'Teal', value: '#2D8F78' },
  { label: 'Yellow', value: '#E1B345' },
  { label: 'Blue', value: '#0D60C4' },
  { label: 'Dark Blue', value: '#0B2749' },
  { label: 'Dark Green', value: '#1C4A3E' },
  { label: 'Orange', value: '#AF7700' },
  { label: 'Red', value: '#FF3B30' },
  { label: 'Purple', value: '#AF52DE' },
  { label: 'Gray', value: '#8E8E93' },
  { label: 'Black', value: '#000000' },
];


// ... rest of the existing constants ... 