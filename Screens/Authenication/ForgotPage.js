import {
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import React, { useState } from "react";
import ScreenWrapper from "../../Components/ScreenWrapper";
import BackButton from "../../Components/Buttons/BackButton";
import InputField from "../../Components/InputField/InputField";
import CustomButton from "../../Components/Buttons/CustomButton";
import { COLORS, SIZES } from "../../constants/theme";
import { useNavigation } from "@react-navigation/native";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";

const ForgotPasswordPage = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert("Input Required", "Please enter your email address.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        "Password Reset",
        "A password reset link has been sent to your email."
      );
      navigation.navigate("SignIn");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <ScreenWrapper backgroundColor={COLORS.authBackground}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.headerText}>Reset Password</Text>
        </View>

        <View style={styles.content}>
          <InputField
            title="Email"
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <View style={{ marginTop: SIZES.padding.xxlarge }}>
            <CustomButton
              title="Send Reset Link"
              onPress={handlePasswordReset}
            />
          </View>
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
  content: {
    paddingHorizontal: SIZES.padding.xxxlarge,
    marginTop: SIZES.padding.xxlarge,
  },
  resetButton: {
    marginTop: SIZES.padding.xxlarge,
  },
});
