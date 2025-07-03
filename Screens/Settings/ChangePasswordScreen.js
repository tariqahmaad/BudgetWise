// ChangePasswordScreen.js

import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";
import BackButton from "../../Components/Buttons/BackButton";
import CustomButton from "../../Components/Buttons/CustomButton";
import ScreenWrapper from "../../Components/ScreenWrapper";
import NavigationBar from "../../Components/NavBar/NavigationBar";
import { COLORS, SIZES } from "../../constants/theme";

const ChangePasswordScreen = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  // Add error states
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [checkboxError, setCheckboxError] = useState("");

  const user = auth.currentUser;

  // Determine password strength (1: weak, 2: medium, 3: strong)
  const getPasswordStrength = (pwd) => {
    if (pwd.length >= 10) return 3;
    if (pwd.length >= 6) return 2;
    if (pwd.length > 0) return 1;
    return 0;
  };
  const strength = getPasswordStrength(newPassword);

  // Validation: current password not empty, new & confirm match, new meets minimum length
  const isValidForm =
    currentPassword.trim().length > 0 &&
    newPassword.length >= 6 &&
    newPassword === confirmPassword;

  const handleSubmit = async () => {
    // Clear previous errors
    setCurrentPasswordError("");
    setCheckboxError("");

    // Check current password first
    if (!currentPassword.trim()) {
      setCurrentPasswordError("Current password is required.");
      return;
    }

    if (!isValidForm) return;

    if (!isCheckboxChecked) {
      setCheckboxError("Please check this box to proceed.");
      return;
    }

    if (!user || !user.email) {
      Alert.alert("Error", "No authenticated user found.");
      return;
    }

    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      Alert.alert("Success", "Your password has been updated.");
      navigation.goBack();
    } catch (error) {
      console.error("Password update error:", error);
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password"
      ) {
        setCurrentPasswordError("* The current password entered is incorrect.");
      } else {
        Alert.alert("Error", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Clear current password error when user starts typing
  const handleCurrentPasswordChange = (text) => {
    setCurrentPassword(text);
    if (currentPasswordError) {
      setCurrentPasswordError("");
    }
  };

  // Clear checkbox error when user checks the box
  const handleCheckboxToggle = () => {
    setIsCheckboxChecked((prev) => !prev);
    if (checkboxError) {
      setCheckboxError("");
    }
  };

  return (
    <ScreenWrapper backgroundColor={COLORS.white}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.leftContainer}>
            <BackButton onPress={() => navigation.goBack()} />
          </View>
          <View style={styles.centerContainer}>
            <Text style={styles.headerTitle}>Change Password</Text>
          </View>
          <View style={styles.rightContainer} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Description */}
          <Text style={styles.description}>
            Use this page to update your account password. Your new password
            must be at least 6 characters long and match the confirmation field.
            Once changed, you may need to sign in again on other devices.
          </Text>

          {/* Current Password Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Current Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter current password"
                secureTextEntry={!showCurrent}
                value={currentPassword}
                onChangeText={handleCurrentPasswordChange}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowCurrent((prev) => !prev)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showCurrent ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#8E8E93"
                />
              </TouchableOpacity>
            </View>
            {(currentPassword.length === 0 || currentPasswordError) && (
              <Text style={styles.currentPasswordErrorText}>
                {currentPasswordError || "Current password is required."}
              </Text>
            )}
          </View>

          {/* New Password Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>New Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter new password"
                secureTextEntry={!showNew}
                value={newPassword}
                onChangeText={setNewPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowNew((prev) => !prev)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showNew ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#8E8E93"
                />
              </TouchableOpacity>
            </View>
            {/* Strength Bar */}
            {strength > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBarBackground}>
                  <View
                    style={[
                      styles.strengthBarFill,
                      strength === 1 && styles.strengthWeak,
                      strength === 2 && styles.strengthMedium,
                      strength === 3 && styles.strengthStrong,
                      { width: `${(strength / 3) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.strengthLabel}>
                  {strength === 1 && "Weak"}
                  {strength === 2 && "Medium"}
                  {strength === 3 && "Strong"}
                </Text>
              </View>
            )}
            {newPassword.length > 0 && newPassword.length < 6 && (
              <Text style={styles.errorText}>
                Password must be at least 6 characters.
              </Text>
            )}
          </View>

          {/* Confirm New Password Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Re-enter new password"
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirm((prev) => !prev)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showConfirm ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#8E8E93"
                />
              </TouchableOpacity>
            </View>
            {confirmPassword.length > 0 && confirmPassword !== newPassword && (
              <Text style={styles.errorText}>Passwords do not match.</Text>
            )}
          </View>

          {/* Checkbox */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={handleCheckboxToggle}
          >
            <View
              style={[
                styles.checkboxBox,
                isCheckboxChecked && styles.checkboxBoxChecked,
              ]}
            >
              {isCheckboxChecked && (
                <Ionicons name="checkmark" size={16} color={COLORS.white} />
              )}
            </View>
            <Text style={styles.checkboxLabel}>
              I understand changing my password will sign me out from other
              devices.
            </Text>
          </TouchableOpacity>
          {checkboxError && (
            <Text style={styles.checkboxErrorText}>{checkboxError}</Text>
          )}

          {/* Submit Button */}
          <CustomButton
            title="Update Password"
            onPress={handleSubmit}
            backgroundColor={COLORS.primary || "#007AFF"}
            textColor={COLORS.white}
            disabled={!isValidForm}
            loading={loading}
          />
        </ScrollView>
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContentContainer: {
    paddingTop: 20,
    paddingBottom: 40, // Reduced from 80 since no navbar
  },
  description: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#8E8E93",
    marginBottom: 24,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#000",
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9E9EA",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
  },
  textInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Poppins-Regular",
    color: "#000",
  },
  eyeIcon: {
    padding: 4,
  },
  strengthContainer: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  strengthBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: "#E9E9EA",
    borderRadius: 3,
    marginRight: 8,
  },
  strengthBarFill: {
    height: 6,
    borderRadius: 3,
  },
  strengthWeak: {
    backgroundColor: "#FF3B30",
  },
  strengthMedium: {
    backgroundColor: "#FF9500",
  },
  strengthStrong: {
    backgroundColor: "#34C759",
  },
  strengthLabel: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    color: "#8E8E93",
  },
  currentPasswordErrorText: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: COLORS.primary || "#007AFF",
    textAlign: "center",
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "red",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: "#E9E9EA",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },
  checkboxBoxChecked: {
    backgroundColor: COLORS.primary || "#007AFF",
    borderColor: COLORS.primary || "#007AFF",
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: "#8E8E93",
    flex: 1,
  },
  checkboxErrorText: {
    marginTop: -20,
    marginBottom: 20,
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "red",
    marginLeft: 30,
  },
});

export default ChangePasswordScreen;
