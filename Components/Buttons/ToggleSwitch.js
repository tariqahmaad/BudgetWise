import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
} from "react-native";

const ToggleSwitch = ({
  leftOption = "Expenses",
  rightOption = "Income",
  initialValue,
  initialType, // Add support for initialType prop
  onToggle,
  disabled = false,
  containerStyle,
  sliderStyle,
  textStyle,
  activeTextStyle,
}) => {
  // Use initialType if provided, otherwise fall back to initialValue
  const initialActiveValue = initialType || initialValue || leftOption;

  const [active, setActive] = useState(initialActiveValue);
  const [containerWidth, setContainerWidth] = useState(0);

  // Set initial animated value based on the initial active value
  const animatedValue = useRef(
    new Animated.Value(initialActiveValue === rightOption ? 1 : 0)
  ).current;

  // Update the toggle when initialType changes (for edit scenarios)
  useEffect(() => {
    if (initialType && initialType !== active) {
      setActive(initialType);
      Animated.timing(animatedValue, {
        toValue: initialType === leftOption ? 0 : 1,
        duration: 0, // No animation for initial setup
        useNativeDriver: false,
      }).start();
    }
  }, [initialType, leftOption, rightOption, active, animatedValue]);

  // Calculate responsive dimensions
  const screenWidth = Dimensions.get("window").width;
  const maxWidth = Math.min(screenWidth - 60, 378); // Leave some margin and max width
  const actualWidth = containerWidth > 0 ? containerWidth : maxWidth;
  const sliderWidth = Math.max((actualWidth - 20) / 2, 80); // Minimum slider width
  const translateDistance = sliderWidth + 10;

  const handleToggle = (type) => {
    if (disabled) return; // Prevent toggle when disabled

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
    outputRange: [0, translateDistance], // Responsive translate distance
  });

  const handleLayout = (event) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && width !== containerWidth) {
      setContainerWidth(width);
    }
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* Background */}
      <View
        style={[
          styles.switchBackground,
          { width: actualWidth },
          containerStyle,
          disabled && styles.disabledBackground,
        ]}
      >
        {/* Sliding Button */}
        <Animated.View
          style={[
            styles.slider,
            { width: sliderWidth },
            sliderStyle,
            { transform: [{ translateX }] },
            disabled && styles.disabledSlider,
          ]}
        />

        {/* Clickable Text Buttons */}
        <TouchableOpacity
          style={styles.textContainer}
          onPress={() => handleToggle(leftOption)}
          disabled={disabled}
        >
          <Text
            style={[
              styles.text,
              textStyle,
              active === leftOption && (activeTextStyle || styles.activeText),
              disabled && styles.disabledText,
            ]}
          >
            {leftOption}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.textContainer}
          onPress={() => handleToggle(rightOption)}
          disabled={disabled}
        >
          <Text
            style={[
              styles.text,
              textStyle,
              active === rightOption && (activeTextStyle || styles.activeText),
              disabled && styles.disabledText,
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
    height: 57,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  disabledBackground: {
    opacity: 0.6,
  },
  slider: {
    position: "absolute",
    height: 45,
    backgroundColor: "#F6BC40",
    borderRadius: 10,
    top: 5,
    left: 5,
  },
  disabledSlider: {
    backgroundColor: "#CCCCCC",
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
  disabledText: {
    color: "#999999",
  },
});

export default ToggleSwitch;
