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
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, firestore } from "../../firebase/firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../context/AuthProvider";

const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false); // Add this state

  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const errorFadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null); // Add scroll view reference
  const { user } = useAuth();

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
    return password.length >= 8;
  };

  const validatePhone = (phone) => {
    return phone.length >= 10;
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    // Surname validation
    if (!formData.surname.trim()) {
      newErrors.surname = "Surname is required";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation - only validate if provided
    if (formData.phone.trim() && !validatePhone(formData.phone.trim())) {
      newErrors.phone = "Phone number must be at least 10 digits";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!validatePassword(formData.password)) {
      newErrors.password = "Password must be at least 8 characters long";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
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
  const handleSignInPress = () => {
    navigation.navigate("SignIn");
  };

  const handleSignUp = async () => {
    // Clear previous errors
    setErrors({});
    setErrorMessage("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      );
      const user = userCredential.user;
      console.log("User signed up:", user.uid);

      // Save additional user details to Firestore
      await setDoc(doc(firestore, "users", user.uid), {
        name: formData.name.trim(),
        surname: formData.surname.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        profileSetupComplete: false, // Add this flag
        createdAt: serverTimestamp(),
      });

      console.log("Additional user data saved successfully.");

      // Remove this line - let AuthProvider handle navigation
      // navigation.replace("ProfileSetup");
    } catch (error) {
      console.error("Error signing up:", error.message);

      let errorMsg = "An error occurred during sign up";

      switch (error.code) {
        case "auth/email-already-in-use":
          errorMsg = "An account with this email already exists";
          break;
        case "auth/invalid-email":
          errorMsg = "Please enter a valid email address";
          break;
        case "auth/weak-password":
          errorMsg = "Password is too weak. Please choose a stronger password";
          break;
        case "auth/network-request-failed":
          errorMsg = "Network error. Please check your connection";
          break;
        case "auth/operation-not-allowed":
          errorMsg = "Email/password accounts are not enabled";
          break;
        case "auth/too-many-requests":
          errorMsg = "Too many failed attempts. Please try again later";
          break;
        case "auth/user-disabled":
          errorMsg = "This account has been disabled";
          break;
        case "auth/invalid-credential":
          errorMsg = "Invalid credentials provided";
          break;
        case "auth/credential-already-in-use":
          errorMsg =
            "This credential is already associated with another account";
          break;
        case "auth/internal-error":
          errorMsg = "An internal error occurred. Please try again";
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

  // Update isFormValid function to not require phone
  const isFormValid = () => {
    return (
      formData.name.trim() &&
      formData.surname.trim() &&
      formData.email.trim() &&
      validateEmail(formData.email.trim()) &&
      formData.password &&
      validatePassword(formData.password) &&
      formData.confirmPassword &&
      formData.password === formData.confirmPassword
    );
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
            ref={scrollViewRef} // Add ref
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              keyboardVisible && styles.scrollContentKeyboard, // Add conditional styling
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag" // Add this
            scrollEventThrottle={16} // Add this for smoother scrolling
            bounces={false} // Add this to prevent bouncing
            overScrollMode="never" // Add this for Android
          >
            {/* Welcome Section */}
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>Create Account</Text>
              <Text style={styles.welcomeSubtitle}>
                Join BudgetWise to start managing your finances effectively
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

            {/* Sign Up Form */}
            <View style={styles.formSection}>
              <InputField
                title="Name"
                placeholder="Enter your name"
                autoCapitalize="words"
                value={formData.name}
                onChangeText={(value) => handleInputChange("name", value)}
                error={errors.name}
                icon="person-outline"
                iconType="Ionicons"
                returnKeyType="next"
              />

              <InputField
                title="Surname"
                placeholder="Enter your surname"
                autoCapitalize="words"
                value={formData.surname}
                onChangeText={(value) => handleInputChange("surname", value)}
                error={errors.surname}
                icon="person-outline"
                iconType="Ionicons"
                returnKeyType="next"
              />

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
                returnKeyType="next"
              />

              <InputField
                title="Phone Number (Optional)"
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                value={formData.phone}
                onChangeText={(value) => handleInputChange("phone", value)}
                error={errors.phone}
                icon="phone-outline"
                iconType="MaterialCommunityIcons"
                returnKeyType="next"
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
                returnKeyType="next"
              />

              <InputField
                title="Confirm Password"
                placeholder="Confirm your password"
                secureTextEntry={!showPassword}
                value={formData.confirmPassword}
                onChangeText={(value) =>
                  handleInputChange("confirmPassword", value)
                }
                error={errors.confirmPassword}
                icon="lock"
                iconType="Feather"
                returnKeyType="done"
              />
            </View>

            {/* Sign Up Button */}
            <CustomButton
              title="Create Account"
              onPress={handleSignUp}
              style={styles.signUpButton}
              loading={isLoading}
              disabled={!isFormValid() || isLoading}
            />

            {/* Separator */}
            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>or</Text>
              <View style={styles.separatorLine} />
            </View>

            {/* Sign In Prompt */}
            <View style={styles.signInSection}>
              <Text style={styles.signInPrompt}>
                Already have an account?{" "}
                <Text style={styles.signInLink} onPress={handleSignInPress}>
                  Sign In
                </Text>
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default SignUpPage;

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
    flexGrow: 1, // Change from paddingBottom to flexGrow
    justifyContent: "center", // Center content when keyboard is hidden
    paddingBottom: SIZES.padding.xxxxlarge,
  },
  // Add this new style for when keyboard is visible
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
  fieldErrorText: {
    fontSize: SIZES.font.small,
    fontFamily: "Poppins-Medium",
    color: "#FF3B30", // Red color
    marginTop: SIZES.padding.small,
    marginLeft: SIZES.padding.medium,
  },
  signUpButton: {
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
    backgroundColor: COLORS.border,
  },
  separatorText: {
    fontSize: SIZES.font.medium,
    fontFamily: "Poppins-Regular",
    color: COLORS.textSecondary,
    marginHorizontal: SIZES.padding.medium,
  },
  signInSection: {
    marginTop: SIZES.padding.medium,
    alignItems: "center",
  },
  signInPrompt: {
    fontSize: SIZES.font.medium,
    fontFamily: "Poppins-Regular",
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  signInLink: {
    color: COLORS.primary,
    fontFamily: "Poppins-SemiBold",
  },
});
