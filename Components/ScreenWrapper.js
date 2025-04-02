import {
  StyleSheet,
  Platform,
  StatusBar,
  View,
} from "react-native";
import React from "react";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ScreenWrapper = (props) => {
  const {
    children,
    statusBarStyle = "dark", // default to dark content (suitable for light backgrounds)
    backgroundColor = "#fff", // default background color is white
  } = props;

  const insets = useSafeAreaInsets();
  const paddingTop = Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : insets.top;

  return (
    // SafeAreaView helps avoid notches and system UI overlap
    <View style={[styles.container, { backgroundColor, paddingTop }]}>
      {/* ExpoStatusBar lets you control status bar icon color (light/dark) */}
      <ExpoStatusBar style={statusBarStyle} />

      {/* Container View holds your screen content, adds top padding on Android */}
      {children}
    </View>
  );
};

export default ScreenWrapper;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
