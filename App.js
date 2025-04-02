import { View } from 'react-native';
import React from 'react';
import IndexPage from './Navigators/IndexPage';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <IndexPage />
      </View>
    </SafeAreaProvider>
  );
}



