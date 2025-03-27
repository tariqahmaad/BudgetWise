import React from "react";
import { View, Text, StyleSheet, Image, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const MainCard = ({
  title,
  amount,
  amountColor,
  description,
  backgroundColor,
  Frame,
  extraField = [],
}) => {
  return (
    <View style={[styles.card, { backgroundColor }]}>
      <View style={styles.content}>
        {Frame && (
          <Image
            source={Frame}
            style={styles.image}
          />
        )}
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.amount, { color: amountColor }]}>{amount}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
        {extraField.map((field, index) => (
          <View key={index} style={styles.extraFieldContainer}>
            <Text style={styles.extraLabel}>{field.label}</Text>
            <Text style={[styles.extraValue, { color: field.color }]}>
              {field.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 370,
    height: 180,
    borderRadius: 25,
    padding: 24,
    elevation: 20,
    marginVertical: 15,
    marginRight: 13,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
    marginBottom: 8,
    fontFamily: "Poppins-Medium",
  },
  amount: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 16,
    fontFamily: "Poppins-Bold",
  },
  description: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "500",
    marginTop: 8,
    fontFamily: "Poppins-Medium",
  },
  extraLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "500",
    marginBottom: 4,
    fontFamily: "Poppins-Medium",
  },
  extraValue: {
    fontSize: 28,
    fontWeight: "bold",
    fontFamily: "Poppins-Bold",
  },
  image: {
    width: 180,
    height: 180,
    position: "absolute",
    right: -20,
    top: -20,
    resizeMode: "contain",
    opacity: 0.9,
  },
});

export default MainCard;