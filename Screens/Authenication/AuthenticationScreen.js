import { StyleSheet, Text, View } from "react-native";
import React from "react";
import ScreenWrapper from "../../Components/ScreenWrapper";
import BackButton from "../../Components/Buttons/BackButton";
import OtherAuthenticationMethodsButton from "../../Components/Buttons/OtherAuthenticationMethodsButton";

const AuthenticationScreen = () => {
  return (
    <ScreenWrapper backgroundColor="#E9E9E9">
      <View style={styles.container}>
        <BackButton onPress={() => console.log("Back Button Pressed")} />

        <Text style={styles.headerText}>Sign Up</Text>

        <View style={styles.otherMethods}>
          <OtherAuthenticationMethodsButton type="Facebook" />
          <OtherAuthenticationMethodsButton type="Google" />
        </View>

        <View style={styles.seperator}>
          <View style={styles.horizontalLine}/>
          <Text style={styles.seperatorText}>Or</Text>
          <View style={styles.horizontalLine}/>
        </View>


        




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
  seperatorText:{
    color: "#A2A2A7",
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    marginHorizontal: 10,
  },
  horizontalLine:{
    flex: 1,
    height: 2,
    backgroundColor: "#cccccc",
  }


});
