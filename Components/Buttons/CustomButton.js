import React from "react";
import { TouchableOpacity, Text, StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const CustomButton = ({ title, onPress, backgroundColor = "#F8AF14", textColor = "#484848" }) => {
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor }]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: width * 0.8, // 80% of screen width for a balanced size
    borderRadius: 15, // Keeps the rounded look
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center", // Ensures it's centered
    height: 50, // Standardized height
  },
  buttonText: {
    fontSize: 20, // Standardized font size
    textAlign: "center",
    fontFamily: "Poppins-SemiBold",
    letterSpacing: 1, // Slightly increased letter spacing
  },
});

export default CustomButton;
