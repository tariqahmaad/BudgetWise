//

//new code

import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCurrency } from "../../contexts/CurrencyContext";

const RED = "#E53935"; // Strong red color
const GREEN = "#1BC47D"; // Bright green color

// Helper function to normalize dates for consistent comparison
function normalizeDate(date) {
  if (!date) return null;
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

// Helper function to check if a debt is overdue
function isDebtOverdue(dueDate) {
  if (!dueDate) return false;
  const today = normalizeDate(new Date());
  const dueDateNormalized = normalizeDate(dueDate);
  return dueDateNormalized < today;
}

// Helper function to check if a debt is due today
function isDebtDueToday(dueDate) {
  if (!dueDate) return false;
  const today = normalizeDate(new Date());
  const dueDateNormalized = normalizeDate(dueDate);
  return dueDateNormalized && dueDateNormalized.getTime() === today.getTime();
}

/**
 * @param {object} props
 * @param {object} props.avatar
 * @param {string} props.name
 * @param {string} props.email
 * @param {number} props.debtAmount
 * @param {string} props.dueDate - ISO string
 * @param {boolean} props.youOwe - true if you owe them, false if they owe you
 * @param {boolean} [props.isFavorite] - true if friend is marked as favorite
 * @param {function} [props.onPress] - optional, for pressing the card
 * @param {boolean} [props.noShadow] - optional, disables card shadow for modal contexts
 */
const FriendCard = ({
  avatar,
  name,
  email,
  debtAmount,
  dueDate,
  youOwe = false,
  isFavorite = false,
  onPress,
  noShadow = false,
  showAmounts = true, // New prop to control amount visibility
  youOweAmount = 0, // New prop for "Your owe" amount
  theyOweAmount = 0, // New prop for "They owe" amount
}) => {
  const { formatAmount } = useCurrency();
  const isOverdue = isDebtOverdue(dueDate);
  const isDueToday = isDebtDueToday(dueDate);

  let amountColor = youOwe ? RED : GREEN;
  let showOverdueLabel = isOverdue;
  let showDueTodayLabel = isDueToday && !isOverdue;
  let overdueLabelColor = "#E53935"; // Always red for overdue, regardless of debt direction

  // Animated value for scale - only if onPress is provided
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    // Only animate if onPress is provided
    if (onPress) {
      Animated.spring(scaleValue, {
        toValue: 0.96, // Scale down to 96%
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    // Only animate if onPress is provided
    if (onPress) {
      Animated.spring(scaleValue, {
        toValue: 1, // Scale back to 100%
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  };

  // If no onPress is provided, render without Pressable wrapper
  if (!onPress) {
    return (
      <View style={[styles.card, noShadow && styles.cardNoShadow]}>
        <View style={styles.left}>
          <Image source={avatar} style={styles.avatar} />
          <View style={styles.textContainer}>
            <View style={styles.nameContainer}>
              <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
                {name}
              </Text>
              {isFavorite && (
                <Ionicons
                  name="star"
                  size={16}
                  color="#FFD700"
                  style={styles.favoriteIcon}
                />
              )}
            </View>
            <Text style={styles.email} numberOfLines={1} ellipsizeMode="tail">
              {email}
            </Text>
          </View>
        </View>
        <View style={styles.right}>
          {typeof debtAmount === "number" && !isNaN(debtAmount) ? (
            <Text style={[styles.amount, { color: amountColor }]}>
              {formatAmount(debtAmount)}
            </Text>
          ) : null}
          {showOverdueLabel && (
            <Text style={[styles.status, { color: overdueLabelColor }]}>
              overdue
            </Text>
          )}
          {showDueTodayLabel && (
            <Text style={[styles.status, { color: "#FDB347" }]}>due today</Text>
          )}
          {showAmounts && (youOweAmount > 0 || theyOweAmount > 0) && (
            <View style={{ marginTop: 6, alignItems: "flex-end" }}>
              {youOweAmount > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name="arrow-up-outline"
                    size={16}
                    color="#E53935" // red
                    style={{ marginRight: 4 }}
                  />
                  <Text style={{ color: "red", fontWeight: "bold", fontSize: 13 }}>
                    {formatAmount(youOweAmount)}
                  </Text>
                </View>
              )}
              {theyOweAmount > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name="arrow-down-outline"
                    size={16}
                    color="#1BC47D" // green
                    style={{ marginRight: 4 }}
                  />
                  <Text style={{ color: "green", fontWeight: "bold", fontSize: 13 }}>
                    {formatAmount(theyOweAmount)}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  }

  // Render with Pressable and animation when onPress is provided
  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    // android_ripple={{ color: "#eee", borderless: false }} // Ripple is handled by parent Pressable in Debts.js/DebtTracking.js
    >
      <Animated.View
        style={[
          styles.card,
          noShadow && styles.cardNoShadow,
          { transform: [{ scale: scaleValue }] },
        ]}
      >
        <View style={styles.left}>
          <Image source={avatar} style={styles.avatar} />
          <View style={styles.textContainer}>
            <View style={styles.nameContainer}>
              <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
                {name}
              </Text>
              {isFavorite && (
                <Ionicons
                  name="star"
                  size={16}
                  color="#FFD700"
                  style={styles.favoriteIcon}
                />
              )}
            </View>
            <Text style={styles.email} numberOfLines={1} ellipsizeMode="tail">
              {email}
            </Text>
          </View>
        </View>
        <View style={styles.right}>
          {typeof debtAmount === "number" && !isNaN(debtAmount) ? (
            <Text style={[styles.amount, { color: amountColor }]}>
              {formatAmount(debtAmount)}
            </Text>
          ) : null}
          {showOverdueLabel && (
            <Text style={[styles.status, { color: overdueLabelColor }]}>
              overdue
            </Text>
          )}
          {showDueTodayLabel && (
            <Text style={[styles.status, { color: "#FDB347" }]}>due today</Text>
          )}
          {showAmounts && (youOweAmount > 0 || theyOweAmount > 0) && (
            <View style={{ marginTop: 6, alignItems: "flex-end" }}>
              {youOweAmount > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name="arrow-up-outline"
                    size={16}
                    color="#E53935" // red
                    style={{ marginRight: 4 }}
                  />
                  <Text style={{ color: "red", fontWeight: "bold", fontSize: 13 }}>
                    {formatAmount(youOweAmount)}
                  </Text>
                </View>
              )}
              {theyOweAmount > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name="arrow-down-outline"
                    size={16}
                    color="#1BC47D" // green
                    style={{ marginRight: 4 }}
                  />
                  <Text style={{ color: "green", fontWeight: "bold", fontSize: 13 }}>
                    {formatAmount(theyOweAmount)}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 18,
    // marginBottom: 14, // Margin will be handled by the parent container if needed
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 15,
    backgroundColor: "#F2F4F7",
  },
  textContainer: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212121",
    fontFamily: "Poppins-SemiBold",
  },
  email: {
    fontSize: 14,
    color: "#9E9E9E",
    marginTop: 2,
    fontFamily: "Poppins-Regular",
  },
  right: {
    alignItems: "flex-end",
    minWidth: 110,
    maxWidth: 150,
    justifyContent: "center",
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "Poppins-Bold",
  },
  status: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
    fontFamily: "Poppins-Medium",
    textTransform: "lowercase",
  },
  cardNoShadow: {
    shadowColor: "black",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    borderWidth: 1,
    borderColor: "#E8EAED",
  },
  favoriteIcon: {
    marginLeft: 6,
  },
});

export default FriendCard;
