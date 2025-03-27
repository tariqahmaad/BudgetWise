import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

const SubCard = ({ Category, amount, description, backgroundColor, iconName,rotation = '0deg'  }) => {
  return (
    <View style={[styles.card, { backgroundColor }]}>
      <Ionicons name={iconName} size={60} color="white" style={[styles.icon, { transform: [{ rotate: rotation }] }]} />
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
    borderRadius: 15,
    padding: 15,
    alignItems: "flex-start",
    justifyContent: "center",
    marginHorizontal: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  icon: {
    position: 'absolute',
    top: 15,
    right: 15,
    
  },
  Category: {
    fontSize: 18,
    fontWeight: "400",
    color: "#fff",
    marginBottom: 1,
  },
  amount: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  description: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 10,
  },
});

export default SubCard;