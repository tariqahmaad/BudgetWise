import { StyleSheet, View } from 'react-native'
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import LoginPage from '../Screens/Authenication/LoginPage';
import SignUpPage from '../Screens/Authenication/SignUpPage';
import ForgotPage from '../Screens/Authenication/ForgotPage';
import HomeScreen from '../Screens/Dashboard/HomeScreen';
import { useAuth } from '../context/AuthContext';
import NavigationBar from '../Components/NavBar/NavigationBar';
import { COLORS, HEADER_STYLE } from '../constants/theme';

const Stack = createNativeStackNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={HEADER_STYLE}>
    <Stack.Screen
      name="Login"
      component={LoginPage}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="SignUp"
      component={SignUpPage}
      options={{ title: 'Sign Up' }}
    />
    <Stack.Screen
      name="Forgot"
      component={ForgotPage}
      options={{ title: 'Forgot Password' }}
    />
  </Stack.Navigator>
);

const DashboardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeScreen" component={HomeScreen} />
    <Stack.Screen name="Summary" component={HomeScreen} />
    <Stack.Screen name="AI Bot" component={HomeScreen} />
    <Stack.Screen name="Settings" component={HomeScreen} />
  </Stack.Navigator>
);

const IndexPage = () => {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      <View style={styles.container}>
        {user ? (
          <>
            <DashboardStack />
            <NavigationBar />
          </>
        ) : (
          <AuthStack />
        )}
      </View>
    </NavigationContainer>
  );
};

export default IndexPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.appBackground,
  }
});