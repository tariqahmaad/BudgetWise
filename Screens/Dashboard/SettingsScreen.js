import React, { useState, useEffect } from "react";
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
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "../../firebase/firebaseConfig";
import { COLORS } from "../../constants/theme";
import ScreenWrapper from "../../Components/ScreenWrapper";
import NavigationBar from "../../Components/NavBar/NavigationBar";


// =============================================
// Main Screen Component
// =============================================
const SettingsScreen = () => {
  // Navigation
  const navigation = useNavigation();

  // State Management
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isAddAccountModalVisible, setIsAddAccountModalVisible] = useState(false);
  const [isAddCategoryModalVisible, setIsAddCategoryModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);

  const user = auth.currentUser;

  // Effects
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAccountsAndCategories();
    }
  }, [user]);

  const fetchAccountsAndCategories = async () => {
    try {
      const accountsRef = collection(firestore, "users", user.uid, "accounts");
      const categoriesRef = collection(firestore, "users", user.uid, "categories");

      const accountsSnapshot = await getDocs(accountsRef);
      const categoriesSnapshot = await getDocs(categoriesRef);

      const accountsList = accountsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const categoriesList = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setAccounts(accountsList);
      setCategories(categoriesList);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleDeleteAccount = async (accountId) => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete this account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);
              await deleteDoc(doc(firestore, "users", user.uid, "accounts", accountId));
              await fetchAccountsAndCategories();
              Alert.alert("Success", "Account deleted successfully");
            } catch (error) {
              console.error("Error deleting account:", error);
              Alert.alert("Error", "Failed to delete account");
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteCategory = async (categoryId) => {
    Alert.alert(
      "Delete Category",
      "Are you sure you want to delete this category? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);
              await deleteDoc(doc(firestore, "users", user.uid, "categories", categoryId));
              await fetchAccountsAndCategories();
              Alert.alert("Success", "Category deleted successfully");
            } catch (error) {
              console.error("Error deleting category:", error);
              Alert.alert("Error", "Failed to delete category");
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Event Handlers
  const handleSignOut = () => {
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
              console.log("User signed out successfully");
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
  };

  const handleAddAccount = () => {
    setIsAddAccountModalVisible(true);
  };

  const handleAddCategory = () => {
    setIsAddCategoryModalVisible(true);
  };


  // Settings Item Renderer
  const renderSettingItem = ({ title, value, onPress, isSwitch = false, switchValue, onSwitchChange, icon }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={isSwitch || !onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingItemLeft}>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: icon.backgroundColor }]}>
            <Ionicons name={icon.name} size={18} color={icon.color} />
          </View>
        )}
        <Text style={[styles.settingItemTitle, icon && { marginLeft: 12 }]}>{title}</Text>
      </View>
      <View style={styles.settingItemRight}>
        {value && <Text style={styles.settingItemValue}>{value}</Text>}
        {isSwitch ? (
          <Switch
            trackColor={{ false: '#E9E9EA', true: '#007AFF' }}
            thumbColor={'#FFFFFF'}
            ios_backgroundColor="#E9E9EA"
            onValueChange={onSwitchChange}
            value={switchValue}
          />
        ) : (
          onPress && <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper backgroundColor={COLORS.white}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? (
              <ActivityIndicator size="small" color={COLORS.danger} />
            ) : (
              <Ionicons name="log-out-outline" size={26} color={COLORS.danger} />
            )}
          </TouchableOpacity>
        </View>

        {/* Settings List */}
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Testing Section */}
            <Text style={styles.sectionHeader}>Testing</Text>
            <View style={styles.settingsGroup}>
              {renderSettingItem({
                title: "Add Account",
                onPress: handleAddAccount,
                icon: {
                  name: "wallet-outline",
                  backgroundColor: "#E8F0FE",
                  color: "#4285F4"
                }
              })}
              {renderSettingItem({
                title: "Add Category",
                onPress: handleAddCategory,
                icon: {
                  name: "grid-outline",
                  backgroundColor: "#FCE8E7",
                  color: "#EA4335"
                }
              })}
            </View>

            {/* Accounts Section */}
            <Text style={styles.sectionHeader}>Accounts</Text>
            <View style={styles.settingsGroup}>
              {accounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={styles.settingItem}
                  onPress={() => handleDeleteAccount(account.id)}
                >
                  <View style={styles.settingItemLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: account.backgroundColor || "#E8F0FE" }]}>
                      <Ionicons name={getAccountTypeIcon(account.type)} size={18} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.settingItemTitle, { marginLeft: 12 }]}>{account.title}</Text>
                  </View>
                  <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Categories Section */}
            <Text style={styles.sectionHeader}>Categories</Text>
            <View style={styles.settingsGroup}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.settingItem}
                  onPress={() => handleDeleteCategory(category.id)}
                >
                  <View style={styles.settingItemLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: category.backgroundColor || "#FCE8E7" }]}>
                      <Ionicons name={category.iconName} size={18} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.settingItemTitle, { marginLeft: 12 }]}>{category.name}</Text>
                  </View>
                  <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                </TouchableOpacity>
              ))}
            </View>

            {/* General Section */}
            <Text style={styles.sectionHeader}>General</Text>
            <View style={styles.settingsGroup}>
              {renderSettingItem({
                title: "Language",
                value: "English",
                onPress: () => Alert.alert("Language", "Navigate to Language Selection"),
              })}
              {renderSettingItem({
                title: "My Profile",
                onPress: () => navigation.navigate('Profile'),
              })}
              {renderSettingItem({
                title: "Contact Us",
                onPress: () => Alert.alert("Contact Us", "Show Contact Info"),
              })}
            </View>

            {/* Security Section */}
            <Text style={styles.sectionHeader}>Security</Text>
            <View style={styles.settingsGroup}>
              {renderSettingItem({
                title: "Change Password",
                onPress: () => Alert.alert("Password", "Navigate to Change Password"),
              })}
              {renderSettingItem({
                title: "Privacy Policy",
                onPress: () => Alert.alert("Privacy", "Navigate to Privacy Policy"),
              })}
              <Text style={styles.settingDescription}>Choose what data you share with us</Text>
              {renderSettingItem({
                title: "Biometric",
                isSwitch: true,
                switchValue: isBiometricEnabled,
                onSwitchChange: setIsBiometricEnabled,
              })}
            </View>

          </ScrollView>
        </Animated.View>

        {/* Modals */}
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

        {/* Navigation Bar */}
        <NavigationBar />
      </View>
    </ScreenWrapper>
  );
};

const getAccountTypeIcon = (type) => {
  switch (type) {
    case 'balance':
      return 'wallet-outline';
    case 'income_tracker':
      return 'trending-up-outline';
    case 'savings_goal':
      return 'save-outline';
    default:
      return 'wallet-outline';
  }
};

// =============================================
// Styles
// =============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
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
    fontWeight: '600',
    color: '#000000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContentContainer: {
    paddingTop: 20,
    paddingBottom: 80,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '400',
    color: '#8E8E93',
    marginTop: 24,
    marginBottom: 8,
  },
  settingsGroup: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingItemTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000000',
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingItemValue: {
    fontSize: 16,
    fontWeight: '400',
    color: '#8E8E93',
    marginRight: 8,
  },
  settingDescription: {
    fontSize: 13,
    color: '#8E8E93',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
});

export default SettingsScreen;