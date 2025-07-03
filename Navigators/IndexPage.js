import { StyleSheet, View, ActivityIndicator } from "react-native";
import React, { useContext, useState, useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import useFontLoader from "../hooks/useFontLoader";
import HomeScreen from "../Screens/Dashboard/HomeScreen";
import SummaryScreen from "../Screens/Dashboard/SummaryScreen";
import AIScreen from "../Screens/Dashboard/AIScreen";
import SettingsScreen from "../Screens/Dashboard/SettingsScreen";
import ProfileScreen from "../Screens/Dashboard/ProfileScreen";
import { COLORS, HEADER_STYLE } from "../constants/theme";
import SignUpPage from "../Screens/Authenication/SignUpPage";
import LoginPage from "../Screens/Authenication/LoginPage";
import { AuthProvider, AuthContext } from "../context/AuthProvider";
import AddDebt from "../Screens/Dashboard/SubMenu/AddDebt";
import AddTransactions from "../Screens/Dashboard/SubMenu/AddTransactions";
import DebtTracking from "../Screens/Dashboard/SubMenu/DebtTracking";
import ForgotPasswordPage from "../Screens/Authenication/ForgotPage";
import onboardingScreen from "../Screens/onboardingScreen";
import Debts from "../Screens/Dashboard/SubMenu/Debts";
import DebtDetails from "../Screens/Dashboard/SubMenu/DebtDetails";
import ManageAccountsScreen from "../Screens/Settings/ManageAccountsScreen";
import ManageTransactionsScreen from "../Screens/Settings/ManageTransactionsScreen";
import EditTransactionScreen from "../Screens/Settings/EditTransactionScreen";
import ChangePasswordScreen from "../Screens/Settings/ChangePasswordScreen";
import PrivacyPolicyScreen from "../Screens/Settings/PrivacyPolicyScreen";
import SupportScreen from "../Screens/Settings/SupportScreen";
import AboutScreen from "../Screens/Settings/AboutScreen";
import CurrencySelectionScreen from "../Screens/Settings/CurrencySelectionScreen";
import APIKeysScreen from "../Screens/Settings/APIKeysScreen";
import ProfileSetupPage from "../Screens/ProfileSetupPage";
import { firestore, doc, onSnapshot } from "../firebase/firebaseConfig";
import { auth } from "../firebase/firebaseConfig";

// Navigation Configuration
const Stack = createNativeStackNavigator();

const navigationConfig = {
  defaultScreenOptions: {
    headerShown: false,
    animation: "fade",
    presentation: "transparentModal",
    contentStyle: {
      backgroundColor: COLORS.appBackground,
    },
  },
  authStackOptions: {
    ...HEADER_STYLE,
  },
};

// Navigation Stacks
const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      ...navigationConfig.defaultScreenOptions,
      ...navigationConfig.authStackOptions,
    }}
  >
    <Stack.Screen name="Onboarding" component={onboardingScreen} />
    <Stack.Screen name="SignUp" component={SignUpPage} />
    <Stack.Screen name="SignIn" component={LoginPage} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordPage} />
  </Stack.Navigator>
);

const DashboardStack = () => (
  <Stack.Navigator screenOptions={navigationConfig.defaultScreenOptions}>
    <Stack.Screen name="HomeScreen" component={HomeScreen} />
    <Stack.Screen name="Summary" component={SummaryScreen} />
    <Stack.Screen name="AI" component={AIScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="addDebt" component={AddDebt} />
    <Stack.Screen name="addTransaction" component={AddTransactions} />
    <Stack.Screen name="debtTracking" component={DebtTracking} />
    <Stack.Screen name="Debts" component={Debts} />
    <Stack.Screen name="DebtDetails" component={DebtDetails} />
    <Stack.Screen name="ManageAccounts" component={ManageAccountsScreen} />
    <Stack.Screen
      name="ManageTransactions"
      component={ManageTransactionsScreen}
    />
    <Stack.Screen name="EditTransaction" component={EditTransactionScreen} />
    <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    <Stack.Screen
      name="CurrencySelection"
      component={CurrencySelectionScreen}
    />
    <Stack.Screen name="APIKeys" component={APIKeysScreen} />
    <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    <Stack.Screen name="Support" component={SupportScreen} />
    <Stack.Screen name="About" component={AboutScreen} />
  </Stack.Navigator>
);

// Profile Setup Stack for new users
const ProfileSetupStack = () => (
  <Stack.Navigator screenOptions={navigationConfig.defaultScreenOptions}>
    <Stack.Screen name="ProfileSetup" component={ProfileSetupPage} />
  </Stack.Navigator>
);

const RootNavigator = () => {
  const { user } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const [profileSetupComplete, setProfileSetupComplete] = useState(null);

  useEffect(() => {
    let unsubscribe = null;

    const checkProfileSetup = async () => {
      if (user) {
        try {
          // Set up a real-time listener for profile setup changes
          const userDocRef = doc(firestore, "users", user.uid);
          unsubscribe = onSnapshot(
            userDocRef,
            (doc) => {
              if (doc.exists()) {
                const userData = doc.data();
                const setupComplete = userData.profileSetupComplete || false;
                setProfileSetupComplete(setupComplete);
              } else {
                // Document doesn't exist - could be a new user or deleted user
                // For deleted users, Firebase Auth will handle sign out
                console.log(
                  "User document doesn't exist - treating as incomplete setup"
                );
                setProfileSetupComplete(false);
              }
              setIsLoading(false);
            },
            (error) => {
              console.error("Error listening to user document:", error);
              // If permission error, likely user was deleted
              if (error.code === "permission-denied") {
                console.log(
                  "Permission denied - user likely deleted, signing out"
                );
                setProfileSetupComplete(null);
                // Force sign out to ensure clean state
                auth.signOut().catch(console.error);
              } else {
                setProfileSetupComplete(false);
              }
              setIsLoading(false);
            }
          );
        } catch (error) {
          console.error("Error setting up profile listener:", error);
          setProfileSetupComplete(false);
          setIsLoading(false);
        }
      } else {
        // No user - reset state
        setProfileSetupComplete(null);
        setIsLoading(false);
      }
    };

    // Reset loading state when user changes
    setIsLoading(true);
    checkProfileSetup();

    // Cleanup function
    return () => {
      if (unsubscribe && typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [user]);

  // Show loading screen while checking profile setup
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: COLORS.white,
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // If no user, show auth stack (this handles deleted accounts and logged out users)
  if (!user) {
    return <AuthStack />;
  }

  // If user exists but hasn't completed profile setup, show profile setup
  if (user && profileSetupComplete === false) {
    return <ProfileSetupStack />;
  }

  // If user exists and has completed profile setup, show main app
  if (user && profileSetupComplete === true) {
    return <DashboardStack />;
  }

  // Fallback - show auth stack if we can't determine profile setup status
  return <AuthStack />;
};

// Main Component
const IndexPage = () => {
  const { fontsLoaded, onLayoutRootView } = useFontLoader();

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <View style={styles.container} onLayout={onLayoutRootView}>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </View>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.appBackground,
  },
});

export default IndexPage;
