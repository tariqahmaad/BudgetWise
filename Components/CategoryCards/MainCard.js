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
  // card: {
  //   width: 370,
  //   height: 175,
  //   borderRadius: 15,
  //   padding: 20,
  //   elevation: 30,
  //   marginVertical: 10,
  //   marginHorizontal: 10,
  // },

  card: {
    width: 370,
    height: 180,
    borderRadius: 15,
    padding: 20,
    elevation: 20,
    marginVertical: 10,
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },

  content: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    color: "#EBEBEB",
    fontWeight: "500",
    marginBottom: 10,
    marginBottom: -5,
  },
  amount: {
    fontSize: 25,
    fontWeight: "bold",
    marginBottom: 20,
    
  },
  description: {
    fontSize: 12,
    color: "white",
    fontWeight: "bold",
    marginTop: 5,
  },
  extraLabel: {
    fontSize: 14,
    color: "#EBEBEB",
    fontWeight: "500",
    marginBottom: -5,
  },

  extraValue: {
    fontSize: 25,
    fontWeight: "bold",
   
  },
  image: {
    width: 150,
    height: 155,
    position: "absolute",
    right: 1,
    top: 4,
    resizeMode: "contain",
  },

});

export default MainCard;
