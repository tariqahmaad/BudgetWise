import { StyleSheet, Text, View, Image, TouchableOpacity } from "react-native";
import React from "react";
import Images from "../../constants/Images";

const OtherAuthenticationMethodsButton = (props) => {
  const { 
    onPress,
    type = "Google" 
  } = props;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image
        source={type == "Google" ? Images.googleIcon : Images.facebookIcon}
        style={styles.logo}
      />
      <Text style={styles.innerText}>{type}</Text>
    </TouchableOpacity>
  );
};

export default OtherAuthenticationMethodsButton;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 10,
    width: 140,
  },
  logo: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  innerText: {
    fontSize: 16,
    color: "#61677D",
    fontFamily: "Poppins-Medium",
    height: 24,
  },
});
