import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

const SubCard = ({ Category, amount, description, backgroundColor, iconName, rotation = '0deg' }) => {
  return (
    <View style={[styles.card, { backgroundColor }]}>
      <View style={styles.overlay} />
      <Ionicons
        name={iconName}
        size={95}
        color="rgba(255, 255, 255, 0.15)"
        style={[styles.backgroundIcon, { transform: [{ rotate: rotation }] }]}
      />
      <Ionicons
        name={iconName}
        size={65}
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
    width: 295,
    height: 151,
    borderRadius: 20,
    padding: 20,
    alignItems: "flex-start",
    justifyContent: "center",
    marginRight: 15,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    bottom: -10,
    right: 180,
    // left: -20,
    opacity: 0.6,
  },
  icon: {
    position: 'absolute',
    top: 30,
    right: 30,
  },
  Category: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
    fontFamily: "Poppins-SemiBold",
  },
  amount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    fontFamily: "Poppins-Bold",
  },
  description: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    fontFamily: "Poppins-Medium",
  },
});

export default SubCard;