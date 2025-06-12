import { View } from 'react-native';
import React from 'react';
import IndexPage from './Navigators/IndexPage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { ExchangeRateProvider } from './contexts/ExchangeRateContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <ExchangeRateProvider>
        <CurrencyProvider>
          <View style={{ flex: 1 }}>
            <IndexPage />
          </View>
        </CurrencyProvider>
      </ExchangeRateProvider>
    </SafeAreaProvider>
  );
}



