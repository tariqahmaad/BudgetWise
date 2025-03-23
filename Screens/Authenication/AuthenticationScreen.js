import { ScrollView, StyleSheet, Text, View } from "react-native";
import React from "react";
import ScreenWrapper from "../../Components/ScreenWrapper";
import BackButton from "../../Components/Buttons/BackButton";
import OtherAuthenticationMethodsButton from "../../Components/Buttons/OtherAuthenticationMethodsButton";
import InputField from "../../Components/InputField/InputField";
import HorizontalLine from "../../Components/HorizontalLine";
import CustomButton from "../../Components/Buttons/CustomButton";

const AuthenticationScreen = () => {
  return (
    <ScreenWrapper backgroundColor="#E9E9E9">
      <View style={styles.container}>
        <BackButton onPress={() => console.log("Back Button Pressed")} />

        <Text style={styles.headerText}>Sign Up</Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.otherMethods}>
            <OtherAuthenticationMethodsButton type="Facebook" />
            <OtherAuthenticationMethodsButton type="Google" />
          </View>
          <View style={styles.seperator}>
            <HorizontalLine />
            <Text style={styles.seperatorText}>Or</Text>
            <HorizontalLine />
          </View>
          <View style={styles.inputFieldsContainer}>
            <InputField title="Name" />
            <InputField title="Surname" />
            <InputField title="Email" />
            <InputField title="Phone" />
            <InputField title="Password" />
            <Text style={styles.forgotPass}>Forgot your Password?</Text>
          </View>

          <CustomButton
            title="Sign Up"
            onPress={() => console.log("Sign Up Button Pressed")}
          />

          <Text style={styles.someText}>Already have an account? Sign In...</Text>

          <View style={{ height: 25 }} />
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

export default AuthenticationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 26,
    marginHorizontal: 28,
  },
  backButtonContainer: {
    backgroundColor: "#CCCCCC",
    height: 48,
    width: 48,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    fontSize: 36,
    fontFamily: "Poppins-Medium",
    marginTop: 50,
    color: "#1E1E2D",
  },
  otherMethods: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  seperator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  seperatorText: {
    color: "#A2A2A7",
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    marginHorizontal: 10,
  },
  horizontalLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: "#cccccc",
  },
  inputFieldsContainer: {
    marginBottom: 10,
  },
  someText:{
    marginTop: 5,
    color: "#A2A2A7",
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    textAlign: "center",
  },
  forgotPass: {
    color: "#A2A2A7",
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    textAlign: "right",
    marginTop: 0,
  },
});
