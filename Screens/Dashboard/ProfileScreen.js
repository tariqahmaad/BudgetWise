import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Platform,
  Animated,
  Easing,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import NavigationBar from "../../Components/NavBar/NavigationBar";
import { COLORS, SIZES } from "../../constants/theme";
import ScreenWrapper from "../../Components/ScreenWrapper";
import Images from "../../constants/Images";
import {
  auth,
  firestore,
  doc,
  getDoc,
  updateDoc,
} from "../../firebase/firebaseConfig";
import BackButton from "../../Components/Buttons/BackButton";
import SettingListItem from "../../Components/Common/SettingListItem";

// Move InfoField component outside to prevent re-creation
const InfoField = React.memo(
  ({
    label,
    value,
    placeholder,
    editable = false,
    isEditing,
    onChangeText,
  }) => (
    <View style={styles.infoField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {editable && isEditing ? (
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="done"
          blurOnSubmit={true}
        />
      ) : (
        <Text style={[styles.fieldValue, !value && styles.fieldValueEmpty]}>
          {value || placeholder}
        </Text>
      )}
    </View>
  )
);

// Move SectionHeader outside as well
const SectionHeader = React.memo(({ title }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
));

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(auth.currentUser);
  const [userData, setUserData] = useState({
    name: "",
    surname: "",
    email: user?.email || "",
    avatar: Images.profilePic,
  });
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    name: "",
    surname: "",
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchUserData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const userDoc = await getDoc(doc(firestore, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const userInfo = {
          name: data.name || "",
          surname: data.surname || "",
          email: user.email || "",
          avatar: data.avatar || Images.profilePic,
        };
        setUserData(userInfo);
        setEditedData({
          name: data.name || "",
          surname: data.surname || "",
        });
      } else {
        const userInfo = {
          name: "",
          surname: "",
          email: user.email || "",
          avatar: Images.profilePic,
        };
        setUserData(userInfo);
        setEditedData({
          name: "",
          surname: "",
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      Alert.alert("Error", "Failed to load user data");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Refresh data when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchUserData();
    });
    return unsubscribe;
  }, [navigation, fetchUserData]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUserData({ name: "", surname: "", email: "", avatar: null });
      }
    });
    return () => unsubscribe();
  }, []);

  // Use useCallback to prevent function recreation
  const handleNameChange = useCallback((text) => {
    setEditedData((prev) => ({ ...prev, name: text }));
  }, []);

  const handleSurnameChange = useCallback((text) => {
    setEditedData((prev) => ({ ...prev, surname: text }));
  }, []);

  const getFullName = () =>
    userData.name && userData.surname
      ? `${userData.name} ${userData.surname}`
      : userData.name || "User";

  const handleSave = async () => {
    if (!user) return;

    if (!editedData.name.trim()) {
      Alert.alert("Validation Error", "Name is required");
      return;
    }

    setIsSaving(true);
    try {
      await updateDoc(doc(firestore, "users", user.uid), {
        name: editedData.name.trim(),
        surname: editedData.surname.trim(),
        updatedAt: new Date(),
      });

      setUserData((prev) => ({
        ...prev,
        name: editedData.name.trim(),
        surname: editedData.surname.trim(),
      }));

      setIsEditing(false);
      Alert.alert("Success", "Personal information updated successfully");
    } catch (error) {
      console.error("Error updating user data:", error);
      Alert.alert("Error", "Failed to update personal information");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedData({
      name: userData.name,
      surname: userData.surname,
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert("Confirm Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            await auth.signOut();
          } catch (error) {
            Alert.alert("Log Out Error", error.message);
          }
        },
      },
    ]);
  };

  const settingsItems = [
    {
      icon: {
        name: "settings-outline",
        backgroundColor: "#FEF7E0",
        color: "#FBBC04",
      },
      title: "Settings",
      onPress: () => navigation.navigate("Settings"),
    },
    {
      icon: {
        name: "log-out-outline",
        backgroundColor: "#FCE8E7",
        color: "#EA4335",
      },
      title: "Log Out",
      onPress: handleLogout,
    },
  ];

  if (isLoading) {
    return (
      <ScreenWrapper backgroundColor={COLORS.white}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.leftContainer}>
              <BackButton onPress={() => navigation.goBack()} />
            </View>
            <View style={styles.centerContainer}>
              <Text style={styles.headerTitle}>Profile</Text>
            </View>
            <View style={styles.rightContainer} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper backgroundColor={COLORS.white}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.leftContainer}>
            <BackButton onPress={() => navigation.goBack()} />
          </View>
          <View style={styles.centerContainer}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
          <View style={styles.rightContainer}>
            {!isEditing ? (
              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                style={styles.editButton}
              >
                <Ionicons
                  name="pencil-outline"
                  size={20}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Profile Section */}
            <View style={styles.profileSection}>
              {userData.avatar ? (
                <Image source={userData.avatar} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={40} color="#4B5563" />
                </View>
              )}
              <Text style={styles.name}>{getFullName()}</Text>
              {userData.email && (
                <Text style={styles.email}>{userData.email}</Text>
              )}
            </View>

            {/* Personal Information Section */}
            <SectionHeader title="Personal Information" />
            <View style={styles.infoGroup}>
              <InfoField
                label="First Name"
                value={editedData.name}
                placeholder="Enter your first name"
                editable={true}
                isEditing={isEditing}
                onChangeText={handleNameChange}
              />
              <View style={styles.separator} />
              <InfoField
                label="Last Name"
                value={editedData.surname}
                placeholder="Enter your last name"
                editable={true}
                isEditing={isEditing}
                onChangeText={handleSurnameChange}
              />
              <Text style={styles.groupDescription}>
                Your name helps personalize your BudgetWise experience
              </Text>
            </View>

            {/* Account Information */}
            <SectionHeader title="Account Information" />
            <View style={styles.infoGroup}>
              <InfoField
                label="Email Address"
                value={userData.email}
                placeholder="No email address"
                isEditing={isEditing}
              />
              <Text style={styles.groupDescription}>
                Your email address is used for account authentication and cannot
                be changed here
              </Text>
            </View>

            {/* Account Statistics */}
            <SectionHeader title="Account Statistics" />
            <View style={styles.infoGroup}>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                  <Text style={styles.statLabel}>Member Since</Text>
                  <Text style={styles.statValue}>
                    {user?.metadata?.creationTime
                      ? new Date(
                          user.metadata.creationTime
                        ).toLocaleDateString()
                      : "N/A"}
                  </Text>
                </View>
              </View>
              <View style={styles.separator} />
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color="#34C759"
                  />
                  <Text style={styles.statLabel}>Account Status</Text>
                  <Text style={[styles.statValue, { color: "#34C759" }]}>
                    Verified
                  </Text>
                </View>
              </View>
              <Text style={styles.groupDescription}>
                Your account information and verification status
              </Text>
            </View>

            {/* Action Buttons */}
            {isEditing && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={handleCancel}
                  disabled={isSaving}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.saveButton]}
                  onPress={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Settings Section */}
            <SectionHeader title="Account Settings" />
            <View style={styles.settingsGroup}>
              {settingsItems.map((item, index) => (
                <React.Fragment key={index}>
                  <SettingListItem
                    icon={item.icon?.name}
                    iconColor={item.icon?.color}
                    iconBackgroundColor={item.icon?.backgroundColor}
                    title={item.title}
                    onPress={item.onPress}
                  />
                  {index < settingsItems.length - 1 && (
                    <View style={styles.separator} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </ScrollView>
        </Animated.View>

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
  leftContainer: {
    flex: 1,
    alignItems: "flex-start",
  },
  centerContainer: {
    flex: 4,
    alignItems: "center",
  },
  rightContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContentContainer: {
    paddingTop: 8,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontFamily: "Poppins-Regular",
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 32,
    paddingVertical: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: 24,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#8E8E93",
  },
  sectionHeader: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#8E8E93",
    marginTop: 16,
    marginBottom: 8,
  },
  infoGroup: {
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
  infoField: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: COLORS.text,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: COLORS.textSecondary,
  },
  fieldValueEmpty: {
    color: "#C7C7CC",
    fontStyle: "italic",
  },
  textInput: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: COLORS.text,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  separator: {
    height: 1,
    backgroundColor: "#E5E5EA",
    marginLeft: 16,
  },
  groupDescription: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: "#8E8E93",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  statRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statLabel: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: COLORS.text,
    marginLeft: 12,
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: COLORS.textSecondary,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  actionButton: {
    flex: 0.48,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: COLORS.text,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: COLORS.white,
  },
  settingsGroup: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 20,
  },
});

export default ProfileScreen;
