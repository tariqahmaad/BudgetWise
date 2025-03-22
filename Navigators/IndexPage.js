import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import LoginPage from '../Screens/Authenication/LoginPage';
import SignUpPage from '../Screens/Authenication/SignUpPage';
import ForgotPage from '../Screens/Authenication/ForgotPage';
import OnboardingScreen from '../Screens/onboardingScreen';

const Stack = createNativeStackNavigator();

const index = () => {
  return (

    <NavigationContainer>
      <Stack.Navigator initialRouteName="onboarding">
        <Stack.Screen name="onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginPage} />
        <Stack.Screen name="SignUp" component={SignUpPage} />
        <Stack.Screen name="Forgot" component={ForgotPage} />
      </Stack.Navigator>
    </NavigationContainer>

  )
}

export default index

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',

  },
  text: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
})