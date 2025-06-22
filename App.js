import { View } from "react-native";
import React, { useEffect } from "react";
import IndexPage from "./Navigators/IndexPage";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import { ExchangeRateProvider } from "./contexts/ExchangeRateContext";
import { clearCorruptAvatarData } from "./utils/clearCorruptData";

export default function App() {
  useEffect(() => {
    // Run cleanup once when app starts
    const runStartupCleanup = async () => {
      try {
        await clearCorruptAvatarData();
      } catch (error) {
        console.log("Startup cleanup failed:", error);
      }
    };

    runStartupCleanup();
  }, []); // Empty dependency array means this runs once when app starts

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
