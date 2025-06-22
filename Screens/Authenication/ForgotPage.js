import {
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import ScreenWrapper from "../../Components/ScreenWrapper";
import InputField from "../../Components/InputField/InputField";
import CustomButton from "../../Components/Buttons/CustomButton";
import { COLORS, SIZES } from "../../constants/theme";
import { useNavigation } from "@react-navigation/native";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";

const ForgotPasswordPage = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      Alert.alert("Input Required", "Please enter your email address.");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert(
        "Reset Link Sent",
        "A password reset link has been sent to your email. Please check your inbox and follow the instructions to reset your password.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("SignIn"),
          },
        ]
      );
    } catch (error) {
      let errorMessage = "An error occurred. Please try again.";

      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "No account found with this email address.";
          break;
        case "auth/invalid-email":
          errorMessage = "Please enter a valid email address.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many attempts. Please try again later.";
          break;
        default:
          errorMessage = error.message;
      }

      Alert.alert("Reset Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactSupport = () => {
    const subject = "Password Reset Help - BudgetWise";
    const body =
      "Hi, I'm having trouble resetting my password. Please help me with:\n\n";
    Linking.openURL(
      `mailto:tariq_muzamil@live.com?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`
    );
  };

  // Add this function to check if email is valid for button state
  const isFormValid = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email.trim() && emailRegex.test(email.trim());
  };

  return (
    <ScreenWrapper backgroundColor={COLORS.white}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.content}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Welcome Section */}
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>Reset Password</Text>
              <Text style={styles.welcomeSubtitle}>
                Enter your email address and we'll send you a link to reset your
                password.
              </Text>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              <InputField
                title="Email Address"
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />

              <View style={styles.buttonContainer}>
                <CustomButton
                  title={isLoading ? "Sending..." : "Send Reset Link"}
                  onPress={handlePasswordReset}
                  loading={isLoading}
                  disabled={!isFormValid() || isLoading}
                />
              </View>
            </View>
            {/* Support Section */}
            <View style={styles.supportSection}>
              <View style={styles.divider} />

              <Text style={styles.supportTitle}>Still having trouble?</Text>
              <Text style={styles.supportDescription}>
                If you're unable to reset your password or don't receive the
                email, our support team is here to help you get back into your
                account.
              </Text>

              <TouchableOpacity
                style={styles.contactButton}
                onPress={handleContactSupport}
                activeOpacity={0.7}
              >
                <View style={styles.contactButtonContent}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={COLORS.primary || "#007AFF"}
                  />
                  <Text style={styles.contactButtonText}>Contact Support</Text>
                </View>
              </TouchableOpacity>

              {/* Back to Login */}
              <TouchableOpacity
                style={styles.backToLoginButton}
                onPress={() => navigation.navigate("SignIn")}
                activeOpacity={0.7}
              >
                <Text style={styles.backToLoginText}>
                  Remember your password?
                  <Text style={styles.backToLoginLink}> Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default ForgotPasswordPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SIZES.padding.xxlarge,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: SIZES.padding.xxxxlarge,
  },
  welcomeSection: {
    marginTop: SIZES.padding.xxxlarge,
    marginBottom: SIZES.padding.xxxxlarge,
  },
  welcomeTitle: {
    fontSize: SIZES.font.xxlarge,
    fontFamily: "Poppins-Bold",
    color: COLORS.text,
    marginBottom: SIZES.padding.medium,
  },
  welcomeSubtitle: {
    fontSize: SIZES.font.medium,
    fontFamily: "Poppins-Regular",
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  formSection: {
    marginBottom: SIZES.padding.xxxxlarge,
  },
  buttonContainer: {
    marginTop: SIZES.padding.xxlarge,
  },
  supportSection: {
    alignItems: "center",
    paddingTop: SIZES.padding.large,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: COLORS.divider || "#E5E7EB",
    marginBottom: SIZES.padding.xxxxlarge,
  },
  supportTitle: {
    fontSize: SIZES.font.large,
    fontFamily: "Poppins-SemiBold",
    color: COLORS.text,
    marginBottom: SIZES.padding.medium,
    textAlign: "center",
  },
  supportDescription: {
    fontSize: SIZES.font.medium,
    fontFamily: "Poppins-Regular",
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: SIZES.padding.xlarge,
    paddingHorizontal: SIZES.padding.medium,
  },
  contactButton: {
    backgroundColor: "#F8F9FA",
    borderRadius: SIZES.radius.medium,
    paddingVertical: SIZES.padding.medium,
    paddingHorizontal: SIZES.padding.xlarge,
    marginBottom: SIZES.padding.xlarge,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  contactButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  contactButtonText: {
    fontSize: SIZES.font.medium,
    fontFamily: "Poppins-Medium",
    color: COLORS.primary || "#007AFF",
    marginLeft: SIZES.padding.small,
  },
  backToLoginButton: {
    paddingVertical: SIZES.padding.medium,
  },
  backToLoginText: {
    fontSize: SIZES.font.medium,
    fontFamily: "Poppins-Regular",
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  backToLoginLink: {
    color: COLORS.primary || "#007AFF",
    fontFamily: "Poppins-SemiBold",
  },
});
