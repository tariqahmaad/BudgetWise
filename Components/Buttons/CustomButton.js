import React from "react";
import { TouchableOpacity, Text, StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const CustomButton = ({ title, onPress, backgroundColor = "#F8AF14", textColor = "#000" }) => {
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
    width: width * 0.8, // 70% of screen width for a balanced size
    paddingVertical: 14, // Slightly reduced padding
    borderRadius: 15, // Keeps the rounded look
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center", // Ensures it's centered
    marginTop: 30, // Adds space from subtitle to prevent overlapping
    marginBottom: 100,// Extra space before bottom screen edge
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 }, // Moderate shadow
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4, // Android shadow
  },
  buttonText: {
    fontSize: 16, // Standardized font size
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "Poppins-Regular",
  },
});

export default CustomButton;
