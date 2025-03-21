import { View, StyleSheet, Text, SafeAreaView } from 'react-native';
import React from 'react';
import IndexPage from './Navigators/IndexPage';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <IndexPage />
      </View>
      <View style={{ flex: 1, backgroundColor: '#f0f0f0' }}>
        <Text style={{ textAlign: 'center', padding: 20 }}>Footer</Text>
      </View>
    </SafeAreaView>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})



