import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  Animated,
  Easing,
  Switch,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import {
  auth,
  firestore,
  collection,
  getDocs,
} from "../../firebase/firebaseConfig";
import { COLORS, SIZES } from "../../constants/theme";
import ScreenWrapper from "../../Components/ScreenWrapper";
import NavigationBar from "../../Components/NavBar/NavigationBar";
import SettingListItem from "../../Components/Common/SettingListItem";

const SettingsScreen = () => {
  const navigation = useNavigation();

  const [fadeAnim] = useState(new Animated.Value(0));
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [accounts, setAccounts] = useState([]);

  const user = auth.currentUser;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchAccounts = useCallback(async () => {
    try {
      const accountsRef = collection(firestore, "users", user.uid, "accounts");
      const accountsSnapshot = await getDocs(accountsRef);

      setAccounts(
        accountsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchAccounts();
  }, [user, fetchAccounts]);

  // Refresh accounts when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (user) fetchAccounts();
    });

    return unsubscribe;
  }, [navigation, user, fetchAccounts]);

  const handleSignOut = useCallback(() => {
    Alert.alert("Confirm Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          setIsSigningOut(true);
          try {
            await signOut(auth);
          } catch (error) {
            console.error("Sign out error:", error);
            Alert.alert("Sign Out Error", error.message);
          } finally {
            setIsSigningOut(false);
          }
        },
      },
    ]);
  }, []);

  const SectionHeader = ({ title }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <ScreenWrapper backgroundColor={COLORS.white}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.centerContainer}>
            <Text style={styles.headerTitle}>Settings</Text>
          </View>
        </View>

        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile & General */}
            <SectionHeader title="Profile & General" />
            <View style={styles.settingsGroup}>
              <SettingListItem
                icon="person-outline"
                iconColor="#007AFF"
                title="My Profile"
                onPress={() => navigation.navigate("Profile")}
              />
              <Text style={styles.settingDescription}>
                Manage your personal information and account preferences
              </Text>
            </View>

            {/* Financial Management */}
            <SectionHeader title="Financial Management" />
            <View style={styles.settingsGroup}>
              <SettingListItem
                icon="wallet-outline"
                iconColor="#34C759"
                title="Manage Accounts"
                subtitle={`${accounts.length} of 3 accounts created`}
                onPress={() => navigation.navigate("ManageAccounts")}
                rightIcon="chevron-forward-outline"
              />
              <SettingListItem
                icon="receipt-outline"
                iconColor="#FF9500"
                title="Manage Transactions"
                subtitle="Edit or delete transaction history"
                onPress={() => navigation.navigate("ManageTransactions")}
                rightIcon="chevron-forward-outline"
              />
              <Text style={styles.settingDescription}>
                View and manage your financial accounts and transaction history
              </Text>
            </View>

            {/* Security & Privacy */}
            <SectionHeader title="Security & Privacy" />
            <View style={styles.settingsGroup}>
              <SettingListItem
                icon="lock-closed-outline"
                iconColor="#FF3B30"
                title="Change Password"
                onPress={() => navigation.navigate("ChangePassword")}
              />
              <SettingListItem
                icon="finger-print-outline"
                iconColor="#8E4EC6"
                title="Biometric Authentication"
                rightComponent={
                  <Switch
                    trackColor={{ false: "#E9E9EA", true: "#007AFF" }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="#E9E9EA"
                    value={isBiometricEnabled}
                    onValueChange={setIsBiometricEnabled}
                  />
                }
              />
              <SettingListItem
                icon="document-text-outline"
                iconColor="#8E8E93"
                title="Privacy Policy"
                onPress={() => navigation.navigate("PrivacyPolicy")}
              />
              <Text style={styles.settingDescription}>
                Secure your account with password changes, biometric login, and
                privacy settings
              </Text>
            </View>

            {/* Support & About */}
            <SectionHeader title="Support & About" />
            <View style={styles.settingsGroup}>
              <SettingListItem
                icon="help-circle-outline"
                iconColor="#007AFF"
                title="Help & Support"
                subtitle="Get help, contact us, and learn more"
                onPress={() => navigation.navigate("Support")}
                rightIcon="chevron-forward-outline"
              />
              <SettingListItem
                icon="information-circle-outline"
                iconColor="#34C759"
                title="About BudgetWise"
                subtitle="App version and credits"
                onPress={() => navigation.navigate("About")}
                rightIcon="chevron-forward-outline"
              />
              <Text style={styles.settingDescription}>
                Access help resources, contact support, and learn about the
                development team
              </Text>
            </View>

            {/* Account Actions */}
            <SectionHeader title="Account Actions" />
            <View style={styles.settingsGroup}>
              <SettingListItem
                icon="log-out-outline"
                iconColor="#FF3B30"
                title="Sign Out"
                subtitle={
                  isSigningOut ? "Signing out..." : "Sign out of your account"
                }
                onPress={handleSignOut}
                rightComponent={
                  isSigningOut ? (
                    <ActivityIndicator size="small" color="#FF3B30" />
                  ) : null
                }
                disabled={isSigningOut}
              />
              <Text style={styles.settingDescription}>
                Sign out of your BudgetWise account on this device
              </Text>
            </View>
          </ScrollView>
        </Animated.View>

        <NavigationBar />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingHorizontal: SIZES.padding.xxlarge,
    paddingVertical: SIZES.padding.large, // Changed from xxlarge to large
    backgroundColor: COLORS.white,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
  },
  content: { flex: 1, paddingHorizontal: 16 },
  scrollContentContainer: {
    paddingTop: 8, // Reduced from 20 to 8
    paddingBottom: 80,
  },
  sectionHeader: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#8E8E93",
    marginTop: 16, // Reduced from 24 to 16
    marginBottom: 8,
  },
  settingsGroup: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 16,
    paddingVertical: 4,
  },
  settingDescription: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: "#8E8E93",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  settingValue: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#8E8E93",
    marginRight: 8,
  },
});

export default SettingsScreen;
