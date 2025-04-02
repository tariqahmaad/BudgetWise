import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from "react-native";

const ToggleSwitch = ({ onToggle }) => {
  const [active, setActive] = useState("Expenses");
  const animatedValue = useRef(new Animated.Value(0)).current;

  const handleToggle = (type) => {
    setActive(type);
    Animated.timing(animatedValue, {
      toValue: type === "Expenses" ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();

    if (onToggle) {
      onToggle(type);
    }
  };

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 190], // Adjust this based on button width
  });
  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={styles.switchBackground}>
        {/* Sliding Button */}
        <Animated.View
          style={[styles.slider, { transform: [{ translateX }] }]}
        />

        {/* Clickable Text Buttons */}
        <TouchableOpacity
          style={styles.textContainer}
          onPress={() => handleToggle("Expenses")}
        >
          <Text
            style={[styles.text, active === "Expenses" && styles.activeText]}
          >
            Expenses
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.textContainer}
          onPress={() => handleToggle("Income")}
        >
          <Text style={[styles.text, active === "Income" && styles.activeText]}>
            Income
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 20,
  },
  switchBackground: {
    flexDirection: "row",
    backgroundColor: "#232533",
    borderRadius: 10,
    width: 378,
    height: 57,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  slider: {
    position: "absolute",
    width: 178,
    height: 45,
    backgroundColor: "#F6BC40",
    borderRadius: 10,
    top: 5,
    left: 5,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    zIndex: 10,
  },
  text: {
    fontSize: 18,
    color: "white",
    fontWeight: "500",
  },
  activeText: {
    fontWeight: "bold",
    color: "black",
  },
});

export default ToggleSwitch;
