import React from "react";
import { TouchableOpacity, Text, StyleSheet, Dimensions, ActivityIndicator } from "react-native";

const { width } = Dimensions.get("window");

const CustomButton = ({
  title,
  onPress,
  backgroundColor = "#F8AF14",
  textColor = "#484848",
  disabled = false,
  loading = false
}) => {
  const buttonStyle = [
    styles.button,
    { backgroundColor: disabled ? "#CCCCCC" : backgroundColor }
  ];

  const textStyle = [
    styles.buttonText,
    { color: disabled ? "#888888" : textColor }
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      activeOpacity={disabled ? 1 : 0.8}
      onPress={disabled || loading ? undefined : onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
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
