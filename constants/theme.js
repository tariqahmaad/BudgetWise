export const COLORS = {
    // Navigation
    active: '#007AFF',
    inactive: '#8E8E93',
    white: '#FFFFFF',
    background: '#1C1C1E',
    border: '#38383A',

    // App
    appBackground: '#000000',
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
    }
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
        xxlarge: 24
    },

    // Font Sizes
    font: {
        small: 12,
        medium: 14,
        large: 16,
        xlarge: 28,
        xxlarge: 32
    }
};

export const NAV_ITEMS = [
    { name: 'HomeScreen', icon: 'home', label: 'Home' },
    { name: 'Statistics', icon: 'pie-chart', label: 'Statistics' },
    { name: 'Add', icon: 'add', isAddButton: true },
    { name: 'Rewards', icon: 'sparkles', label: 'Rewards' },
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