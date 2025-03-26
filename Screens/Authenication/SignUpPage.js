import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useState } from "react";
import ScreenWrapper from "../../Components/ScreenWrapper";
import BackButton from "../../Components/Buttons/BackButton";
import OtherAuthenticationMethodsButton from "../../Components/Buttons/OtherAuthenticationMethodsButton";
import InputField from "../../Components/InputField/InputField";
import HorizontalLine from "../../Components/HorizontalLine";
import CustomButton from "../../Components/Buttons/CustomButton";
import { COLORS, SIZES } from "../../constants/theme";
import { useNavigation } from "@react-navigation/native";

const SignUpPage = () => {
  const [showPasswords, setShowPasswords] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const navigation = useNavigation();

  const handleSignInPress = () => {
    navigation.navigate("SignIn");
  };

  const handleBackPress = () => {
    navigation.goBack();
    console.log("Back Button Pressed");
  };

  const handleSignUp = () => {
    // TODO: Implement sign up logic
    console.log("Sign Up Button Pressed");
    console.log(`Name: ${formData.name}`);
    console.log(`Surname: ${formData.surname}`);
    console.log(`Email: ${formData.email}`);
    console.log(`Phone: ${formData.phone}`);
    console.log(`Password: ${formData.password}`);
    console.log(`Confirm Password: ${formData.confirmPassword}`);

    

  };

  const handleSocialAuth = (provider) => {
    // TODO: Implement social authentication
    console.log(`${provider} authentication pressed`);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPasswords(!showPasswords);
  };

  return (
    <ScreenWrapper backgroundColor={COLORS.authBackground}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.header}>
          <BackButton onPress={handleBackPress} />
          <Text style={styles.headerText}>Sign Up</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.socialAuthContainer}>
            <View style={styles.socialAuth}>
              <OtherAuthenticationMethodsButton
                type="Google"
                onPress={() => handleSocialAuth("Google")}
              />
              <OtherAuthenticationMethodsButton
                type="Facebook"
                onPress={() => handleSocialAuth("Facebook")}
              />
            </View>
          </View>

          <View style={styles.separator}>
            <HorizontalLine />
            <Text style={styles.separatorText}>Or</Text>
            <HorizontalLine />
          </View>

          <View style={styles.form}>
            <InputField
              title="Name"
              placeholder="Enter your name"
              autoCapitalize="words"
              value={formData.name}
              onChangeText={(value) => handleInputChange("name", value)}
            />
            <InputField
              title="Surname"
              placeholder="Enter your surname"
              autoCapitalize="words"
              value={formData.surname}
              onChangeText={(value) => handleInputChange("surname", value)}
            />
            <InputField
              title="Email"
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(value) => handleInputChange("email", value)}
            />
            <InputField
              title="Phone"
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(value) => handleInputChange("phone", value)}
            />
            <InputField
              title="Password"
              placeholder="Enter your password"
              secureTextEntry={!showPasswords}
              value={formData.password}
              onChangeText={(value) => handleInputChange("password", value)}
              showPasswordToggle
              onPasswordToggle={togglePasswordVisibility}
            />
            <InputField
              title="Password"
              placeholder="Confirm your password"
              secureTextEntry={!showPasswords}
              value={formData.confirmPassword}
              onChangeText={(value) =>
                handleInputChange("confirmPassword", value)
              }
            />
          </View>

          <CustomButton
            title="Sign Up"
            onPress={handleSignUp}
            style={styles.signUpButton}
          />

          <Text style={styles.loginPrompt}>
            Already have an account?{" "}
            <Text style={styles.loginLink} onPress={handleSignInPress}>
              Sign In
            </Text>
          </Text>
        </ScrollView>
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
    paddingHorizontal: SIZES.padding.xxxlarge,
    paddingTop: SIZES.padding.xxxxlarge,
  },
  headerText: {
    fontSize: SIZES.font.xxxlarge,
    fontFamily: "Poppins-Medium",
    marginTop: SIZES.padding.xxlarge,
    color: COLORS.authText,
  },
  scrollContent: {
    paddingHorizontal: SIZES.padding.xxxlarge,
    paddingBottom: SIZES.padding.xxlarge,
  },
  socialAuthContainer: {
    marginTop: SIZES.padding.xxlarge,
  },
  socialAuthTitle: {
    fontSize: SIZES.font.medium,
    fontFamily: "Poppins-Regular",
    color: COLORS.authTextSecondary,
    marginBottom: SIZES.padding.medium,
    textAlign: "center",
  },
  socialAuth: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: SIZES.padding.medium,
  },
  separator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: SIZES.padding.large,
  },
  separatorText: {
    color: COLORS.authTextSecondary,
    fontSize: SIZES.font.large,
    fontFamily: "Poppins-Regular",
    marginHorizontal: SIZES.padding.large,
  },
  form: {
    marginTop: SIZES.padding.medium,
  },
  signUpButton: {
    marginTop: SIZES.padding.xxlarge,
  },
  loginPrompt: {
    marginTop: SIZES.padding.medium,
    color: COLORS.authTextSecondary,
    fontSize: SIZES.font.medium,
    fontFamily: "Poppins-Regular",
    textAlign: "center",
  },
  loginLink: {
    color: COLORS.primary,
    fontFamily: "Poppins-SemiBold",
  },
});
