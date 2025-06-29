import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Easing,
  Keyboard, // Add this import
} from "react-native";
import React, { useState, useRef, useEffect } from "react";
import ScreenWrapper from "../../Components/ScreenWrapper";
import InputField from "../../Components/InputField/InputField";
import CustomButton from "../../Components/Buttons/CustomButton";
import { COLORS, SIZES } from "../../constants/theme";
import { useNavigation } from "@react-navigation/native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false); // Add this state

  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const errorFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    // Add keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setKeyboardVisible(false)
    );

    // Cleanup listeners
    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation - only check if empty
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    }

    // Password validation - only check if empty
    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showError = (message) => {
    setErrorMessage(message);
    Animated.sequence([
      Animated.timing(errorFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(4000),
      Animated.timing(errorFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setErrorMessage("");
    });
  };
  const handleSignUpPress = () => {
    navigation.navigate("SignUp");
  };

  const handleSignIn = async () => {
    // Clear previous errors
    setErrors({});
    setErrorMessage("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      );

      console.log("User signed in:", userCredential.user.uid);
      // Navigation will be handled by auth state change
    } catch (error) {
      console.error("Error signing in:", error.message);

      let errorMsg = "An error occurred during sign in";

      switch (error.code) {
        case "auth/user-not-found":
          errorMsg = "No account found with this email address";
          break;
        case "auth/wrong-password":
          errorMsg = "Incorrect password. Please try again";
          break;
        case "auth/invalid-email":
          errorMsg = "Please enter a valid email address";
          break;
        case "auth/user-disabled":
          errorMsg = "This account has been disabled";
          break;
        case "auth/too-many-requests":
          errorMsg = "Too many failed attempts. Please try again later";
          break;
        case "auth/network-request-failed":
          errorMsg = "Network error. Please check your connection";
          break;
        case "auth/invalid-credential":
          errorMsg = "Invalid email or password. Please check your credentials";
          break;
        default:
          errorMsg = error.message;
      }

      showError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Add this function to check if form is valid for button state
  const isFormValid = () => {
    return formData.email.trim() && formData.password;
  };

  return (
    <ScreenWrapper backgroundColor={COLORS.white}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0} // Add this
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              keyboardVisible && styles.scrollContentKeyboard, // Add conditional styling
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag" // Add this
            scrollEventThrottle={16} // Add this for smoother scrolling
          >
            {/* Welcome Section */}
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>Welcome Back!</Text>
              <Text style={styles.welcomeSubtitle}>
                Sign in to your account to continue managing your finances
              </Text>
            </View>

            {/* Error Message */}
            {errorMessage ? (
              <Animated.View
                style={[styles.errorContainer, { opacity: errorFadeAnim }]}
              >
                <Text style={styles.errorText}>{errorMessage}</Text>
              </Animated.View>
            ) : null}

            {/* Sign In Form */}
            <View style={styles.formSection}>
              <InputField
                title="Email Address"
                placeholder="Enter your email address"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={formData.email}
                onChangeText={(value) => handleInputChange("email", value)}
                error={errors.email}
                icon="mail-outline"
                iconType="Ionicons"
              />

              <InputField
                title="Password"
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={(value) => handleInputChange("password", value)}
                showPasswordToggle
                onPasswordToggle={togglePasswordVisibility}
                error={errors.password}
                icon="lock"
                iconType="Feather"
              />

              <Text
                style={styles.forgotPassword}
                onPress={() => navigation.navigate("ForgotPassword")}
              >
                Forgot your password?
              </Text>
            </View>

            {/* Sign In Button */}
            <CustomButton
              title="Sign In"
              onPress={handleSignIn}
              style={styles.signInButton}
              loading={isLoading}
              disabled={!isFormValid() || isLoading}
            />

            {/* Separator */}
            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>or</Text>
              <View style={styles.separatorLine} />
            </View>

            {/* Sign Up Prompt */}
            <View style={styles.signUpSection}>
              <Text style={styles.signUpPrompt}>
                Don't have an account?{" "}
                <Text style={styles.signUpLink} onPress={handleSignUpPress}>
                  Create Account
                </Text>
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default LoginPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingHorizontal: SIZES.padding.xxlarge,
    paddingVertical: SIZES.padding.large,
    backgroundColor: COLORS.white,
  },
  centerContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    color: COLORS.text,
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
  scrollContentKeyboard: {
    justifyContent: "flex-start", // Change alignment when keyboard is visible
    paddingTop: SIZES.padding.large, // Add some top padding
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
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: COLORS.LightRed,
    borderRadius: SIZES.radius.medium,
    paddingHorizontal: SIZES.padding.xlarge,
    paddingVertical: SIZES.padding.medium,
    marginBottom: SIZES.padding.large,
    borderLeftWidth: 3,
    borderLeftColor: "#FF3B30",
  },
  errorText: {
    fontSize: SIZES.font.medium,
    fontFamily: "Poppins-Medium",
    color: "#FF3B30",
    textAlign: "center",
  },
  formSection: {
    marginBottom: SIZES.padding.xxxxlarge,
  },
  forgotPassword: {
    color: COLORS.primary,
    fontSize: SIZES.font.medium,
    fontFamily: "Poppins-Medium",
    textAlign: "right",
    marginTop: SIZES.padding.large,
  },
  signInButton: {
    marginBottom: SIZES.padding.xxxxlarge,
  },
  separator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SIZES.padding.xxlarge,
    marginBottom: SIZES.padding.large,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.divider,
  },
  separatorText: {
    fontSize: SIZES.font.small,
    fontFamily: "Poppins-Regular",
    color: COLORS.textSecondary,
    marginHorizontal: SIZES.padding.xlarge,
  },
  signUpSection: {
    alignItems: "center",
  },
  signUpPrompt: {
    fontSize: SIZES.font.medium,
    fontFamily: "Poppins-Regular",
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  signUpLink: {
    color: COLORS.primary,
    fontFamily: "Poppins-SemiBold",
  },
});
