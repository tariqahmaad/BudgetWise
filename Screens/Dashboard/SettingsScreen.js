import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { Ionicons } from '@expo/vector-icons';
import { signOut } from "firebase/auth";
import AddAccountModal from '../../Components/Settings/AddAccountModal';
import AddCategoryModal from '../../Components/Settings/AddCategoryModal';
import {
  auth,
  firestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "../../firebase/firebaseConfig";
import { COLORS } from "../../constants/theme";
import ScreenWrapper from "../../Components/ScreenWrapper";
import NavigationBar from "../../Components/NavBar/NavigationBar";
import SettingListItem from "../../Components/Common/SettingListItem";

const SettingsScreen = () => {
  const navigation = useNavigation();

  const [fadeAnim] = useState(new Animated.Value(0));
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isAddAccountModalVisible, setIsAddAccountModalVisible] = useState(false);
  const [isAddCategoryModalVisible, setIsAddCategoryModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);

  const user = auth.currentUser;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (user) fetchAccountsAndCategories();
  }, [user]);

  const fetchAccountsAndCategories = useCallback(async () => {
    try {
      const accountsRef = collection(firestore, "users", user.uid, "accounts");
      const categoriesRef = collection(firestore, "users", user.uid, "categories");

      const [accountsSnapshot, categoriesSnapshot] = await Promise.all([
        getDocs(accountsRef),
        getDocs(categoriesRef),
      ]);

      setAccounts(accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setCategories(categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [user]);

  const confirmDelete = useCallback((type, id) => {
    Alert.alert(
      `Delete ${type}`,
      `Are you sure you want to delete this ${type.toLowerCase()}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDelete(type, id),
        },
      ]
    );
  }, []);

  const handleDelete = useCallback(async (type, id) => {
    try {
      setIsLoading(true);
      await deleteDoc(doc(firestore, "users", user.uid, type === 'Account' ? "accounts" : "categories", id));
      await fetchAccountsAndCategories();
    } catch (error) {
      console.error(`Error deleting ${type.toLowerCase()}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchAccountsAndCategories]);

  const handleSignOut = useCallback(() => {
    Alert.alert(
      "Confirm Sign Out",
      "Are you sure you want to sign out?",
      [
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
      ]
    );
  }, []);

  const accountIcon = useCallback((type) => {
    switch (type) {
      case 'balance': return 'wallet-outline';
      case 'income_tracker': return 'trending-up-outline';
      case 'savings_goal': return 'save-outline';
      default: return 'wallet-outline';
    }
  }, []);

  const SectionHeader = ({ title }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <ScreenWrapper backgroundColor={COLORS.white}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity style={styles.headerButton} onPress={handleSignOut} disabled={isSigningOut}>
            {isSigningOut ? (
              <ActivityIndicator size="small" color={COLORS.danger} />
            ) : (
              <Ionicons name="log-out-outline" size={24} color={COLORS.danger} />
            )}
          </TouchableOpacity>
        </View>

        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Testing */}
            <SectionHeader title="Testing" />
            <View style={styles.settingsGroup}>
              <SettingListItem
                icon="wallet-outline"
                iconColor="#4285F4"
                title="Add Account"
                onPress={() => setIsAddAccountModalVisible(true)}
              />
              <SettingListItem
                icon="grid-outline"
                iconColor="#EA4335"
                title="Add Category"
                onPress={() => setIsAddCategoryModalVisible(true)}
              />
            </View>

            {/* Accounts */}
            <SectionHeader title="Accounts" />
            <View style={styles.settingsGroup}>
              {accounts.length === 0 ? (
                <Text style={styles.emptyText}>No accounts added yet.</Text>
              ) : accounts.map((acc) => (
                <SettingListItem
                  key={acc.id}
                  icon={accountIcon(acc.type)}
                  iconColor="#FDB347"
                  title={acc.title}
                  onPress={() => confirmDelete('Account', acc.id)}
                  rightIcon="trash-outline"
                />
              ))}
            </View>

            {/* Categories */}
            <SectionHeader title="Categories" />
            <View style={styles.settingsGroup}>
              {categories.length === 0 ? (
                <Text style={styles.emptyText}>No categories added yet.</Text>
              ) : categories.map((cat) => (
                <SettingListItem
                  key={cat.id}
                  icon={cat.iconName}
                  iconColor="#FDB347"
                  title={cat.name}
                  onPress={() => confirmDelete('Category', cat.id)}
                  rightIcon="trash-outline"
                />
              ))}
            </View>

            {/* General */}
            <SectionHeader title="General" />
            <View style={styles.settingsGroup}>
              <SettingListItem
                icon="language-outline"
                title="Language"
                onPress={() => Alert.alert("Language", "Navigate to Language Selection")}
                rightComponent={<Text style={styles.settingValue}>English</Text>}
              />
              <SettingListItem
                icon="person-outline"
                title="My Profile"
                onPress={() => navigation.navigate('Profile')}
              />
              <SettingListItem
                icon="mail-outline"
                title="Contact Us"
                onPress={() => Alert.alert("Contact Us", "Show Contact Info")}
              />
            </View>

            {/* Security */}
            <SectionHeader title="Security" />
            <View style={styles.settingsGroup}>
              <SettingListItem
                icon="lock-closed-outline"
                title="Change Password"
                onPress={() => Alert.alert("Password", "Navigate to Change Password")}
              />
              <SettingListItem
                icon="document-text-outline"
                title="Privacy Policy"
                onPress={() => Alert.alert("Privacy", "Navigate to Privacy Policy")}
              />
              <Text style={styles.settingDescription}>Choose what data you share with us</Text>
              <SettingListItem
                icon="finger-print-outline"
                title="Biometric"
                rightComponent={
                  <Switch
                    trackColor={{ false: '#E9E9EA', true: '#007AFF' }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="#E9E9EA"
                    value={isBiometricEnabled}
                    onValueChange={setIsBiometricEnabled}
                  />
                }
              />
            </View>
          </ScrollView>
        </Animated.View>

        {/* Loading overlay during delete */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}

        <AddAccountModal
          isVisible={isAddAccountModalVisible}
          onClose={() => setIsAddAccountModalVisible(false)}
          user={user}
          setIsLoading={setIsLoading}
          isLoading={isLoading}
        />

        <AddCategoryModal
          isVisible={isAddCategoryModalVisible}
          onClose={() => setIsAddCategoryModalVisible(false)}
          user={user}
        />

        <NavigationBar />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: COLORS.white,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    color: '#000',
  },
  content: { flex: 1, paddingHorizontal: 16 },
  scrollContentContainer: { paddingTop: 20, paddingBottom: 80 },
  sectionHeader: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: '#8E8E93',
    marginTop: 24,
    marginBottom: 8,
  },
  settingsGroup: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    shadowColor: '#000',
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
    color: '#8E8E93',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  settingValue: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: '#8E8E93',
    marginRight: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: '#8E8E93',
    padding: 16,
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});

export default SettingsScreen;