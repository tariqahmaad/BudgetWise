import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from "react-native";

const ToggleSwitch = ({ 
  leftOption = "Expenses", 
  rightOption = "Income", 
  initialValue,
  onToggle,
  containerStyle,
  sliderStyle,
  textStyle,
  activeTextStyle
}) => {
  const [active, setActive] = useState(initialValue || leftOption);
  const animatedValue = useRef(new Animated.Value(initialValue === rightOption ? 1 : 0)).current;

  const handleToggle = (type) => {
    setActive(type);
    Animated.timing(animatedValue, {
      toValue: type === leftOption ? 0 : 1,
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
      <View style={[styles.switchBackground, containerStyle]}>
        {/* Sliding Button */}
        <Animated.View
          style={[styles.slider, sliderStyle, { transform: [{ translateX }] }]}
        />

        {/* Clickable Text Buttons */}
        <TouchableOpacity
          style={styles.textContainer}
          onPress={() => handleToggle(leftOption)}
        >
          <Text
            style={[
              styles.text, 
              textStyle,
              active === leftOption && (activeTextStyle || styles.activeText)
            ]}
          >
            {leftOption}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.textContainer}
          onPress={() => handleToggle(rightOption)}
        >
          <Text 
            style={[
              styles.text, 
              textStyle,
              active === rightOption && (activeTextStyle || styles.activeText)
            ]}
          >
            {rightOption}
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
