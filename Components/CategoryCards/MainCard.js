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
    minHeight: cardHeight * 0.7, // Ensure minimum content height
  },
  contentSingle: {
    maxWidth: '65%', // Improved space allocation for single field cards
    paddingRight: width * 0.02, // Add some padding to prevent overflow
  },
  contentWithExtra: {
    maxWidth: '58%', // More constrained for multi-field cards 
    paddingRight: width * 0.02, // Add some padding to prevent overflow
  },
  mainContent: {
    marginBottom: height * 0.006, // Reduced bottom margin
    flex: 1, // Allow main content to take available space
    justifyContent: 'flex-start', // Align content to top
  },
  title: {
    fontSize: Math.min(width * 0.042, 19), // Slightly increased for better balance
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: height * 0.012, // Reduced gap for cards with extra fields
    fontFamily: "Poppins-SemiBold",
    lineHeight: Math.min(width * 0.042, 19) * 1.2, // Better line height
  },
  titleSingle: {
    fontSize: Math.min(width * 0.052, 22), // Slightly reduced to make amount more dominant
    color: "rgba(255, 255, 255, 0.8)",
    fontFamily: "Poppins-SemiBold",
    textAlign: "left", // Align title to the left
    marginBottom: height * 0.005, // Reduced gap between title and amount
    lineHeight: Math.min(width * 0.052, 22) * 1.2, // Better line height
  },
  amount: {
    fontFamily: "Poppins-Bold",
    marginBottom: height * 0.003, // Reduced gap after amount
  },
  amountSingle: {
    fontSize: Math.min(width * 0.095, 42), // Increased font size for more dominance
    textAlign: "left", // Align the amount text to the left
    marginVertical: height * 0.008, // Reduced vertical spacing for better flow
    lineHeight: Math.min(width * 0.095, 42) * 1.1, // Better line height
  },
  amountWithExtra: {
    fontSize: Math.min(width * 0.08, 36), // Increased font size for better visibility
    lineHeight: Math.min(width * 0.08, 36) * 1.1, // Better line height
  },
  description: {
    fontSize: Math.min(width * 0.035, 16), // Cap max font size
    color: "rgba(255, 255, 255, 0.7)",
    fontFamily: "Poppins-Medium",
    lineHeight: Math.min(width * 0.035, 16) * 1.3, // Better line height
    marginTop: height * 0.004, // Small gap between amount and description
  },
  descriptionSingle: {
    fontSize: Math.min(width * 0.035, 16), // Cap max font size
    color: "rgba(255, 255, 255, 0.7)",
    fontFamily: "Poppins-Medium",
    textAlign: "left", // Align description to the left
    marginTop: height * 0.008, // Further reduced gap between amount and description
    lineHeight: Math.min(width * 0.035, 16) * 1.3, // Better line height
  },
  extraFieldsWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 'auto',
    paddingTop: height * 0.01, // Add some padding to separate from main content
  },
  extraFieldContainer: {
    flexDirection: 'column',
    flex: 1,
    marginRight: width * 0.02, // Responsive margin
    minWidth: 0, // Prevent overflow
  },
  extraLabel: {
    fontSize: Math.min(width * 0.028, 12), // Cap max font size
    color: "rgba(255, 255, 255, 0.7)",
    fontFamily: "Poppins-SemiBold",
    lineHeight: Math.min(width * 0.028, 12) * 1.4, // Better line height
  },
  extraValue: {
    fontSize: Math.min(width * 0.052, 24), // Increased font size for better prominence
    fontFamily: "Poppins-Bold",
    lineHeight: Math.min(width * 0.052, 24) * 1.2, // Better line height
  },
  image: {
    width: imageSize,
    height: imageSize,
    position: "absolute",
    right: -width * 0.05, // Slightly more offset to prevent overlap
    top: height * 0.025, // Slightly adjusted top position
    resizeMode: "contain",
    opacity: 0.85, // Slightly more transparent to reduce visual interference
    zIndex: 1,
  },
});

export default MainCard;