export const COLORS = {
  // Navigation
  active: "#007AFF",
  inactive: "#8E8E93",
  white: "#FFFFFF",
  background: "#1C1C1E",
  border: "#38383A",

  // App
  appBackground: "#FFFFFF",
  header: "#FFFFFF",
  text: "#1F2937",

  // Login
  primary: "#FDB347",
  textSecondary: "#6B7280",
  textTertiary: "#9CA3AF",
  divider: "#E5E7EB",
  social: {
    facebook: "#1877F2",
    google: "#DB4437",
  },

  // Auth Screen
  authBackground: "#E9E9E9",
  authText: "#1E1E2D",
  authTextSecondary: "#A2A2A7",
  authDivider: "#CCCCCC",
  authButton: "#CCCCCC",

  // Add missing colors for AI screen
  darkBackground: "#181A20", // Deep dark background
  textLight: "#F5F6FA", // Light text for dark backgrounds
  textGray: "#A1A1AA", // Muted gray text
  cardBackground: "#23262F", // Card/section background
  chartLine: "#3B82F6", // Blue for chart line
  chartLabel: "#64748B", // Muted blue-gray for chart axis labels
  chartPoint: "#2563EB", // Darker blue for chart points
  highlightBackground: "rgba(253, 211, 67, 0.18)", // Soft yellow highlight
  tooltipBackground: "#22223B", // Tooltip dark bg
  placeholder: "#8E8E93", // Placeholder text color
  inputBackground: "#23262F", // Input field bg
  lightGray: "#E5E7EB", // For chart grid lines
  darkGray: "#23262F", // For input field and borders
  gray: "#8E8E93", // Standard gray color
  DeepGreen: "#174C3C",
  DeepRed: "#7B1F24",
  LightRed: "#FFE5EC",
  LightGreen: "#E6F9F0",
  BrightGreen: "#12B76A",

  // Add error and warning colors
  error: "#FF3B30",
  warning: "#FFA500",
};

export const SIZES = {
  // Icons
  regular: 32,
  large: 40,
  button: 45,
  socialIcon: 24,
  inputIcon: 20,
  base: 8,

  // Spacing
  padding: {
    small: 5,
    medium: 8,
    large: 10,
    xlarge: 16,
    xxlarge: 24,
    xxxlarge: 28,
    xxxxlarge: 36,
  },

  // Font Sizes
  font: {
    small: 12,
    medium: 14,
    large: 16,
    xlarge: 28,
    xxlarge: 32,
    xxxlarge: 36,
  },

  // Border Radius
  radius: {
    small: 8,
    medium: 12,
    large: 24,
    xlarge: 50,
  },

  header: 20,
};

export const NAV_ITEMS = [
  { name: "HomeScreen", icon: "home", label: "Home" },
  { name: "Summary", icon: "pie-chart", label: "Statistics" },
  { name: "Add", icon: "add", isAddButton: true },
  { name: "AI", icon: "sparkles", label: "AI" },
  { name: "Settings", icon: "settings", label: "Settings" },
];

export const HEADER_STYLE = {
  headerStyle: {
    backgroundColor: COLORS.header,
  },
  headerTintColor: COLORS.text,
  headerTitleStyle: {
    fontWeight: "600",
  },
};

export const SHADOWS = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
};

// Account types for selection
export const ACCOUNT_TYPES = [
  { label: "Balance Tracking", value: "balance" },
  { label: "Income/Expense Tracker", value: "income_tracker" },
  { label: "Savings Goal", value: "savings_goal" },
];

// Default category colors for selection
export const DEFAULT_CATEGORY_COLORS = [
  { label: "Teal", value: "#2D8F78" },
  { label: "Yellow", value: "#E1B345" },
  { label: "Blue", value: "#0D60C4" },
  { label: "Dark Blue", value: "#0B2749" },
  { label: "Dark Green", value: "#1C4A3E" },
  { label: "Orange", value: "#AF7700" },
  { label: "Red", value: "#FF3B30" },
  { label: "Purple", value: "#AF52DE" },
  { label: "Gray", value: "#8E8E93" },
  { label: "Black", value: "#000000" },
  { label: "Green", value: "#12B76A" },
];

export const CATEGORY_ICONS = [
  { name: "basket-outline", label: "Groceries", color: "#4CAF50" },
  { name: "home-outline", label: "Housing", color: "#4CAF50" },
  { name: "car-outline", label: "Transport", color: "#4CAF50" },
  { name: "fast-food-outline", label: "Food", color: "#4CAF50" },
  { name: "medical-outline", label: "Healthcare", color: "#4CAF50" },
  { name: "shirt-outline", label: "Clothing", color: "#4CAF50" },
  { name: "film-outline", label: "Entertainment", color: "#4CAF50" },
  { name: "wifi-outline", label: "Utilities", color: "#4CAF50" },
  { name: "school-outline", label: "Education", color: "#4CAF50" },
  { name: "gift-outline", label: "Gifts", color: "#4CAF50" },
  { name: "card-outline", label: "Finance", color: "#4CAF50" },
  { name: "airplane-outline", label: "Travel", color: "#4CAF50" },
  { name: "fitness-outline", label: "Health & Fitness", color: "#4CAF50" },
  { name: "game-controller-outline", label: "Gaming", color: "#4CAF50" },
  { name: "book-outline", label: "Books", color: "#4CAF50" },
];

export const FONTS = {
  h3: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 20,
  },
  largeTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 32,
  },
  body2: {
    fontFamily: "Poppins-Regular",
    fontSize: 15,
  },
  body3: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
  },
};
