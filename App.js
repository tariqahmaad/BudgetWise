import { View, Text } from "react-native";
import React, { useEffect, useState } from "react";
import IndexPage from "./Navigators/IndexPage";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import { ExchangeRateProvider } from "./contexts/ExchangeRateContext";
import { clearCorruptAvatarData } from "./utils/clearCorruptData";

// Error Boundary Component (class component required for error boundaries)
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, textAlign: 'center', marginBottom: 10 }}>
            Something went wrong
          </Text>
          <Text style={{ fontSize: 14, textAlign: 'center', color: '#666' }}>
            Please restart the app. If the problem persists, check your Firebase configuration.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [initializationError, setInitializationError] = useState(null);

  useEffect(() => {
    // Run cleanup once when app starts with error handling
    const runStartupCleanup = async () => {
      try {
        // Add a timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Startup cleanup timeout')), 10000)
        );

        const cleanupPromise = clearCorruptAvatarData();

        await Promise.race([cleanupPromise, timeoutPromise]);
        console.log('Startup cleanup completed successfully');
      } catch (error) {
        console.log("Startup cleanup failed:", error);
        // Don't set error state for cleanup failure as it's not critical
        // setInitializationError(error);
      }
    };

    runStartupCleanup();
  }, []); // Empty dependency array means this runs once when app starts

  // Show error screen if critical initialization failed
  if (initializationError) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, textAlign: 'center', marginBottom: 10 }}>
            App Initialization Failed
          </Text>
          <Text style={{ fontSize: 14, textAlign: 'center', color: '#666' }}>
            {initializationError.message}
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ExchangeRateProvider>
          <CurrencyProvider>
            <View style={{ flex: 1 }}>
              <IndexPage />
            </View>
          </CurrencyProvider>
        </ExchangeRateProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
