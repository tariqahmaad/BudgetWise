import { StyleSheet, View } from "react-native";
import React from "react";
import { TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

const BackButton = ({onPress}) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.backButtonContainer}>
        <Ionicons name="chevron-back" size={24} color="black" />
      </View>
    </TouchableOpacity>
  );
};

export default BackButton;

const styles = StyleSheet.create({
  backButtonContainer: {
    backgroundColor: "#CCCCCC",
    height: 45,
    width: 45,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
});
