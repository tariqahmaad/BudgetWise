import { StyleSheet, View } from "react-native";
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import useFontLoader from "../hooks/useFontLoader";
import AuthenticationScreen from "../Screens/Authenication/AuthenticationScreen";
import HomeScreen from "../Screens/Dashboard/HomeScreen";
import NavigationBar from "../Components/NavBar/NavigationBar";
import { COLORS, HEADER_STYLE } from "../constants/theme";

// Navigation Configuration
const Stack = createNativeStackNavigator();

const navigationConfig = {
  defaultScreenOptions: {
    headerShown: false,
    animation: 'fade',
    presentation: 'transparentModal',
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
    <Stack.Screen
      name="Authentication"
      component={AuthenticationScreen}

    // name="Home"
    // component={HomeScreen}
    />
  </Stack.Navigator>
);

const DashboardStack = () => (
  <Stack.Navigator
    screenOptions={navigationConfig.defaultScreenOptions}
  >
    <Stack.Screen name="HomeScreen" component={HomeScreen} />
    <Stack.Screen name="Summary" component={HomeScreen} />
    <Stack.Screen name="AI" component={HomeScreen} />
    <Stack.Screen name="Settings" component={HomeScreen} />
  </Stack.Navigator>
);

// Main Component
const IndexPage = () => {
  const { fontsLoaded, onLayoutRootView } = useFontLoader();

  if (!fontsLoaded) {
    return null;
  }

  // TODO: Replace with actual authentication state
  const isAuthenticated = false;

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={navigationConfig.defaultScreenOptions}>
          <Stack.Screen name="Auth" component={AuthStack} />
          <Stack.Screen name="Dashboard" component={DashboardStack} />
        </Stack.Navigator>
        {isAuthenticated && <NavigationBar />}
      </NavigationContainer>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.appBackground,
  },
});

export default IndexPage;
