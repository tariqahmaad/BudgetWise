import { StyleSheet, Text, View, TouchableOpacity, Platform, Dimensions } from 'react-native'
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoginPage from '../Screens/Authenication/LoginPage';
import SignUpPage from '../Screens/Authenication/SignUpPage';
import ForgotPage from '../Screens/Authenication/ForgotPage';
import HomeScreen from '../Screens/Dashboard/HomeScreen';
import ChatBot from '../Screens/AiFeature/ChatBot';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const { width, height } = Dimensions.get('window');

// Authentication navigator
const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: '#1F2937',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
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
};

// Dashboard navigator with bottom tabs
const DashboardTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        tabBarStyle: {
          backgroundColor: '#1C1C1E',
          borderTopColor: '#38383A',
          borderTopWidth: 0.2,
          height: Platform.OS === 'ios' ? 85 : 70,
          paddingTop: 15,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          width: width,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          zIndex: 0,
          shadowColor: 'transparent',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeScreen') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Statistics') {
            iconName = focused ? 'pie-chart' : 'pie-chart-outline';
          } else if (route.name === 'Add') {
            iconName = 'add';
          } else if (route.name === 'Rewards') {
            iconName = focused ? 'sparkles' : 'sparkles-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return (
            <TouchableOpacity
              style={[
                route.name === 'Add' ? styles.addButton : styles.iconContainer,
                focused && route.name !== 'Add' && styles.focusedIcon
              ]}
              activeOpacity={0.7}
              onPress={() => {
                if (route.name === 'Add') {
                  // Handle add button press
                  console.log('Add button pressed');
                } else {
                  navigation.navigate(route.name);
                }
              }}
            >
              <Ionicons
                name={iconName}
                size={route.name === 'Add' ? 44 : 34}
                color={route.name === 'Add' ? '#FFFFFF' : color}
              />
            </TouchableOpacity>
          );
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: route.name === 'HomeScreen' ? false : true,
        tabBarShowLabel: false,
      })}
    >
      <Tab.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{
          title: 'Home'
        }}
      />
      <Tab.Screen
        name="Statistics"
        component={HomeScreen}
        options={{
          title: 'Statistics'
        }}
      />
      <Tab.Screen
        name="Add"
        component={HomeScreen}
        options={{
          title: 'Add'
        }}
      />
      <Tab.Screen
        name="Rewards"
        component={HomeScreen}
        options={{
          title: 'Rewards'
        }}
      />
      <Tab.Screen
        name="Settings"
        component={HomeScreen}
        options={{
          title: 'Settings'
        }}
      />
    </Tab.Navigator>
  );
};

const IndexPage = () => {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      <View style={styles.container}>
        {user ? <DashboardTabs /> : <AuthStack />}
      </View>
    </NavigationContainer>
  );
};

export default IndexPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  iconContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  focusedIcon: {
    // Add any additional styling for focused icons if needed
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    zIndex: 1,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  }
});