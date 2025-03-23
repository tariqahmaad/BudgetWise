import {
  StyleSheet,
  Platform,
  StatusBar,
  SafeAreaView,
  View,
} from "react-native";
import React from "react";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";

const ScreenWrapper = (props) => {
  const {
    children,
    statusBarStyle = "dark", // default to dark content (suitable for light backgrounds)
    backgroundColor = "#fff", // default background color is white
  } = props;

  // On Android, manually get the status bar height to add padding
  // iOS handles this via SafeAreaView already
  const paddingTop =
    Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0;

  return (
    // SafeAreaView helps avoid notches and system UI overlap
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      {/* ExpoStatusBar lets you control status bar icon color (light/dark) */}
      <ExpoStatusBar style={statusBarStyle} />

      {/* Container View holds your screen content, adds top padding on Android */}
      <View style={[styles.container, { paddingTop }]}>{children}</View>
    </SafeAreaView>
  );
};

export default ScreenWrapper;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});
