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
import { deleteUserAccount } from "../../utils/deleteAccount";

const SettingsScreen = () => {
  const navigation = useNavigation();

  const [fadeAnim] = useState(new Animated.Value(0));
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

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

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      "Delete Account",
      "WARNING: This action cannot be undone!\n\nDeleting your account will permanently remove:\n• All your financial data\n• Account information\n• Transaction history\n• Categories and settings\n\nAre you absolutely sure you want to delete your account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Forever",
          style: "destructive",
          onPress: () => confirmAccountDeletion(),
        },
      ]
    );
  }, []);

  const confirmAccountDeletion = useCallback(() => {
    Alert.alert(
      "Final Confirmation",
      "This is your last chance to cancel.\n\nAll your data will be permanently deleted and cannot be recovered.\n\nAre you really sure you want to proceed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Delete My Account",
          style: "destructive",
          onPress: () => executeAccountDeletion(),
        },
      ]
    );
  }, []);

  const executeAccountDeletion = useCallback(async () => {
    if (!user) {
      Alert.alert("Error", "No user found to delete");
      return;
    }

    setIsDeletingAccount(true);

    try {
      await deleteUserAccount(user);
      // User will be automatically signed out and redirected to auth screens
      // No need to handle navigation as the auth state change will handle it
    } catch (error) {
      console.error("Account deletion error:", error);
      let errorMessage = "Failed to delete account. Please try again.";

      if (error.code === "auth/requires-recent-login") {
        errorMessage =
          "For security reasons, please sign out and sign back in, then try deleting your account again.";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage =
          "Network error. Please check your internet connection and try again.";
      }

      Alert.alert("Deletion Failed", errorMessage);
    } finally {
      setIsDeletingAccount(false);
    }
  }, [user]);

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
              <SettingListItem
                icon="card-outline"
                iconColor="#FF9500"
                title="Currency"
                subtitle="Choose your preferred currency"
                onPress={() => navigation.navigate("CurrencySelection")}
                rightIcon="chevron-forward-outline"
              />
              <Text style={styles.settingDescription}>
                Manage your personal information, account preferences, and
                currency settings
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
              <Text style={styles.settingDescription}>
                Secure your account with password changes and privacy settings
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

            {/* Danger Zone */}
            <SectionHeader title="Danger Zone" />
            <View style={styles.dangerZoneGroup}>
              <SettingListItem
                icon="trash-outline"
                iconColor="#FF3B30"
                iconBackgroundColor="#FFE5E5"
                title="Delete Account"
                subtitle={
                  isDeletingAccount
                    ? "Deleting account..."
                    : "Permanently delete your account and all data"
                }
                onPress={handleDeleteAccount}
                rightComponent={
                  isDeletingAccount ? (
                    <ActivityIndicator size="small" color="#FF3B30" />
                  ) : (
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#FF3B30"
                    />
                  )
                }
                disabled={isDeletingAccount}
                titleStyle={styles.dangerTitle}
                subtitleStyle={styles.dangerSubtitle}
                itemStyle={styles.dangerItemStyle}
              />
              <Text style={styles.settingDescription}>
                This action cannot be undone and will remove all your data
                permanently
              </Text>
            </View>
          </ScrollView>
        </Animated.View>

        {/* Loading overlay during delete */}
        {isDeletingAccount && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Deleting your account...</Text>
              <Text style={styles.loadingSubtext}>
                This may take a few moments
              </Text>
            </View>
          </View>
        )}

        <NavigationBar />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingHorizontal: SIZES.padding.xxlarge,
    paddingVertical: SIZES.padding.large,
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContentContainer: {
    paddingTop: 8,
    paddingBottom: 80,
  },
  sectionHeader: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#8E8E93",
    marginTop: 16,
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
  dangerZoneGroup: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 20,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#FFE5E5",
  },
  settingDescription: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: "#8E8E93",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  dangerTitle: {
    color: "#FF3B30",
    fontFamily: "Poppins-Medium",
  },
  dangerSubtitle: {
    color: "#FF6B6B",
    fontSize: 13,
  },
  dangerItemStyle: {
    backgroundColor: "rgba(255, 59, 48, 0.02)",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 200,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text,
    fontFamily: "Poppins-Medium",
    textAlign: "center",
  },
  loadingSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: "Poppins-Regular",
    textAlign: "center",
  },
});

export default SettingsScreen;
