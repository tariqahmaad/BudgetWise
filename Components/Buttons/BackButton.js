import { StyleSheet, View } from "react-native";
import React from "react";
import { TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { COLORS } from "../../constants/theme";

const BackButton = ({ onPress, style }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <View
        style={[
          styles.backButtonContainer,
          style === "absolute" && styles.absolutePosition,
        ]}
      >
        <Ionicons name="chevron-back" size={24} color="black" />
      </View>
    </TouchableOpacity>
  );
};

export default BackButton;

const styles = StyleSheet.create({
  backButtonContainer: {
    backgroundColor: COLORS.lightGray,
    height: 45,
    width: 45,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    position: "relative", // Default position
  },
  absolutePosition: {
    position: "absolute",
  },
});
