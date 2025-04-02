import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import LoginPage from '../Screens/Authenication/LoginPage';
import SignUpPage from '../Screens/Authenication/SignUpPage';
import ForgotPage from '../Screens/Authenication/ForgotPage';
import OnboardingScreen from '../Screens/onboardingScreen';
import testingScreen from '../Screens/testingSCreen';
import DebtTrcaking from '../Screens/SubMenu/DebtTracking';
import AddTransactions from '../Screens/SubMenu/AddTransactions';

const Stack = createNativeStackNavigator();

const index = () => {
  return (

    <NavigationContainer>
      <Stack.Navigator  options={{ headerShown: false }}  initialRouteName="addTransaction">
      <Stack.Screen  options={{ headerShown: false }}  name="addTransaction" component={AddTransactions} />
      <Stack.Screen  options={{ headerShown: false }}  name="debtTracking" component={DebtTrcaking} />
       <Stack.Screen  options={{ headerShown: false }}  name="testing" component={testingScreen} />
        <Stack.Screen  options={{ headerShown: false }}  name="onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginPage} />
        <Stack.Screen  options={{ headerShown: false }}  name="SignUp" component={SignUpPage} />
        <Stack.Screen  options={{ headerShown: false }}  name="Forgot" component={ForgotPage} />
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