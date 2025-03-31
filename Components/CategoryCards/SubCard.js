import React from "react";
import { View, Text, StyleSheet, Dimensions, Platform } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

const { width, height } = Dimensions.get("window");

// Calculate responsive dimensions
const cardWidth = width * 0.75; // 75% of screen width
const cardHeight = height * 0.18; // 18% of screen height
const iconSize = cardWidth * 0.22; // 22% of card width
const backgroundIconSize = cardWidth * 0.32; // 32% of card width

const SubCard = ({ Category, amount, description, backgroundColor, iconName, rotation = '0deg' }) => {
  return (
    <View style={[styles.card, { backgroundColor }]}>
      <View style={styles.overlay} />
      <Ionicons
        name={iconName}
        size={backgroundIconSize}
        color="rgba(255, 255, 255, 0.15)"
        style={[styles.backgroundIcon, { transform: [{ rotate: rotation }] }]}
      />
      <Ionicons
        name={iconName}
        size={iconSize}
        color="white"
        style={[styles.icon, { transform: [{ rotate: rotation }] }]}
      />
      <Text style={styles.Category}>{Category}</Text>
      <Text style={styles.amount}>{amount}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: cardWidth,
    height: cardHeight,
    borderRadius: 20,
    padding: width * 0.05, // 5% of screen width
    alignItems: "flex-start",
    justifyContent: "center",
    marginRight: width * 0.04, // 4% of screen width
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
    overflow: 'hidden',
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  backgroundIcon: {
    position: 'absolute',
    bottom: -backgroundIconSize * 0.1,
    right: cardWidth * 0.6,
    opacity: 0.6,
  },
  icon: {
    position: 'absolute',
    top: cardHeight * 0.2,
    right: cardWidth * 0.1,
  },
  Category: {
    fontSize: width * 0.05, // 5% of screen width
    color: "#fff",
    marginBottom: height * 0.01, // 1% of screen height
    fontFamily: "Poppins-SemiBold",
  },
  amount: {
    fontSize: width * 0.06, // 6% of screen width
    color: "#fff",
    marginBottom: height * 0.01, // 1% of screen height
    fontFamily: "Poppins-Bold",
  },
  description: {
    fontSize: width * 0.035, // 3.5% of screen width
    color: "rgba(255, 255, 255, 0.7)",
    fontFamily: "Poppins-Medium",
  },
});

export default SubCard;