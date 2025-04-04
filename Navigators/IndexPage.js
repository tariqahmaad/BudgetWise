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
import NavigationBar from "../Components/NavBar/NavigationBar";
import { COLORS, HEADER_STYLE } from "../constants/theme";
import SignUpPage from "../Screens/Authenication/SignUpPage";
import LoginPage from "../Screens/Authenication/LoginPage";
import { AuthProvider, AuthContext } from "../context/AuthProvider";
import ForgotPasswordPage from "../Screens/Authenication/ForgotPage";

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
