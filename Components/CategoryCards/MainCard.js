import React from "react";
import { View, Text, StyleSheet, Image, Dimensions, Platform } from "react-native";

const { width, height } = Dimensions.get("window");

// Calculate responsive dimensions
const cardWidth = width * 0.9; // 90% of screen width
const cardHeight = height * 0.22; // 22% of screen height
const imageSize = cardWidth * 0.5; // 50% of card width

const MainCard = ({
  title,
  amount,
  amountColor,
  description,
  backgroundColor,
  Frame,
  extraField = [],
  isLast = false,
}) => {
  return (
    <View style={[styles.card, { backgroundColor, marginRight: isLast ? 1 : 13 }]}>
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
    width: cardWidth,
    height: cardHeight,
    borderRadius: 25,
    padding: width * 0.06, // 6% of screen width
    marginVertical: height * 0.02, // 2% of screen height
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.44,
        shadowRadius: 10.32,
      },
      android: {
        elevation: 8,
      },
    }),
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
  },
  title: {
    fontSize: width * 0.04, // 4% of screen width
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: height * 0.01, // 1% of screen height
    fontFamily: "Poppins-SemiBold",
  },
  amount: {
    fontSize: width * 0.08, // 8% of screen width
    marginBottom: height * 0.01, // 1% of screen height
    fontFamily: "Poppins-Bold",
  },
  description: {
    fontSize: width * 0.035, // 3.5% of screen width
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: height * 0.01, // 1% of screen height
    fontFamily: "Poppins-Medium",
  },
  extraLabel: {
    fontSize: width * 0.035, // 3.5% of screen width
    color: "rgba(255, 255, 255, 0.7)",
    fontFamily: "Poppins-SemiBold",
  },
  extraValue: {
    fontSize: width * 0.07, // 7% of screen width
    fontFamily: "Poppins-Bold",
  },
  image: {
    width: imageSize,
    height: imageSize,
    position: "absolute",
    right: -imageSize * 0.1,
    top: -imageSize * 0.1,
    resizeMode: "contain",
    opacity: 0.9,
  },
});

export default MainCard;