import { StyleSheet, View } from "react-native";
import React, { useContext } from "react"; // Add useContext import
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
import ManageAccountsScreen from "../Screens/Settings/ManageAccountsScreen"
import ManageTransactionsScreen from "../Screens/Settings/ManageTransactionsScreen"
import EditTransactionScreen from "../Screens/Settings/EditTransactionScreen"

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
    <Stack.Screen name="ManageTransactions" component={ManageTransactionsScreen} />
    <Stack.Screen name="EditTransaction" component={EditTransactionScreen} />
  </Stack.Navigator>
);

const RootNavigator = () => {
  const { user } = useContext(AuthContext);
  return user ? <DashboardStack /> : <AuthStack />;
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
