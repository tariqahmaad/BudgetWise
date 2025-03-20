import { View, StyleSheet } from 'react-native';
import React from 'react';
import IndexPage from './Navigators/IndexPage';

export default function App() {
  return (
    <View style={styles.container}>
      <IndexPage />
    </View>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})



