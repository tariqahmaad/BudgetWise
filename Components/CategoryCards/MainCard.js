import React from "react";
import { View, Text, StyleSheet, Image, Dimensions, Platform } from "react-native";

const { width, height } = Dimensions.get("window");

// Calculate responsive dimensions
const cardWidth = width * 0.9; // 90% of screen width
const cardHeight = height * 0.22; // 22% of screen height
const imageSize = cardWidth * 0.45; // Reduced image size to 42% of card width

// Standardized margins
const CARD_MARGINS = {
  vertical: height * 0.01, // 2% of screen height
  horizontal: width * 0.035, // 3.5% of screen width
};

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
  // Determine if we need to adjust sizes based on extra fields
  const hasExtraFields = extraField.length > 0;

  return (
    <View style={[styles.card, { backgroundColor, marginRight: isLast ? 0 : CARD_MARGINS.horizontal }]}>
      {Frame && (
        <Image
          source={Frame}
          style={styles.image}
        />
      )}
      <View style={[
        styles.content,
        // Apply different width constraints based on extra fields
        hasExtraFields ? styles.contentWithExtra : styles.contentSingle
      ]}>
        <View style={styles.mainContent}>
          {!hasExtraFields ? (
            // Single field layout (centered amount)
            <>
              <Text style={styles.titleSingle} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
              <Text
                style={[
                  styles.amount,
                  styles.amountSingle,
                  { color: amountColor }
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {amount}
              </Text>
              {description && <Text style={styles.descriptionSingle} numberOfLines={1} ellipsizeMode="tail">{description}</Text>}
            </>
          ) : (
            <>
              <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
              <Text
                style={[
                  styles.amount,
                  { color: amountColor },
                  // Apply different font size based on extra fields
                  hasExtraFields ? styles.amountWithExtra : styles.amountSingle
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {amount}
              </Text>
              {description && <Text style={styles.description} numberOfLines={1} ellipsizeMode="tail">{description}</Text>}
            </>
          )}
        </View>

        {hasExtraFields && (
          <View style={styles.extraFieldsWrapper}>
            {extraField.map((field, index) => (
              <View key={index} style={styles.extraFieldContainer}>
                <Text style={styles.extraLabel} numberOfLines={1} ellipsizeMode="tail">{field.label}</Text>
                <Text style={[styles.extraValue, { color: field.color }]} numberOfLines={1} ellipsizeMode="tail">
                  {field.value}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: cardWidth,
    height: cardHeight,
    borderRadius: 25,
    padding: width * 0.05,
    marginVertical: CARD_MARGINS.vertical,
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
    position: 'relative',
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    zIndex: 2, // Ensure content is above the image
  },
  contentSingle: {
    maxWidth: '70%', // More space for single field cards
  },
  contentWithExtra: {
    maxWidth: '62%', // Constrained for multi-field cards
  },
  mainContent: {
    marginBottom: height * 0.01,
  },
  title: {
    fontSize: width * 0.04,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: height * 0.005,
    fontFamily: "Poppins-SemiBold",
  },
  titleSingle: {
    fontSize: width * 0.06,
    color: "rgba(255, 255, 255, 0.8)",
    fontFamily: "Poppins-SemiBold",
    textAlign: "left", // Align title to the left
    marginBottom: height * 0.01,
  },
  amount: {
    fontFamily: "Poppins-Bold",
    marginBottom: height * 0.005,
  },
  amountSingle: {
    fontSize: width * 0.085, // Larger font for single field cards
    textAlign: "left", // Align the amount text to the left
    marginVertical: height * 0.015, // Add vertical spacing

  },
  amountWithExtra: {
    fontSize: width * 0.075, // Smaller font when extra fields are present
  },
  description: {
    fontSize: width * 0.035,
    color: "rgba(255, 255, 255, 0.7)",
    fontFamily: "Poppins-Medium",
  },
  descriptionSingle: {
    fontSize: width * 0.035,
    color: "rgba(255, 255, 255, 0.7)",
    fontFamily: "Poppins-Medium",
    textAlign: "left", // Align description to the left
    marginTop: height * 0.02, // Add top margin

  },
  extraFieldsWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 'auto',
  },
  extraFieldContainer: {
    flexDirection: 'column',
    flex: 1,
    marginRight: 8,
  },
  extraLabel: {
    fontSize: width * 0.028,
    color: "rgba(255, 255, 255, 0.7)",
    fontFamily: "Poppins-SemiBold",
  },
  extraValue: {
    fontSize: width * 0.048,
    fontFamily: "Poppins-Bold",
  },
  image: {
    width: imageSize,
    height: imageSize,
    position: "absolute",
    right: -width * 0.00,
    top: height * 0.03,
    resizeMode: "contain",
    opacity: 0.9,
    zIndex: 1,
  },
});

export default MainCard;