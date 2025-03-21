import { View, SafeAreaView } from 'react-native';
import React from 'react';
import IndexPage from './Navigators/IndexPage';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <IndexPage />
      </View>
    </SafeAreaView>
  );
}



