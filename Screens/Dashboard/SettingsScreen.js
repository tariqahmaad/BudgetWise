import { StyleSheet, Text, View, SafeAreaView } from "react-native";
import React, { useEffect } from "react";
import NavigationBar from "../../Components/NavBar/NavigationBar";
import { COLORS } from "../../constants/theme";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";

const SettingsScreen = () => {
  useEffect(() => {
    // Automatically sign out when the Settings screen is mounted
    const signOutUser = async () => {
      try {
        await signOut(auth);
        console.log("User signed out automatically upon entering Settings.");
        // No manual navigation is required; your AuthProvider should re-route accordingly.
      } catch (error) {
        console.error("Error signing out:", error.message);
      }
    };

    signOutUser();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Settings</Text>
        </View>
        <NavigationBar />
      </View>
    </SafeAreaView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.appBackground,
    paddingTop: 35,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.appBackground,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: COLORS.text,
    fontFamily: "Poppins-SemiBold",
  },
});
