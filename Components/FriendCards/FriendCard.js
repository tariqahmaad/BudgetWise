// 


//new code 

import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

const GREEN = "#12B76A";
const RED = "#F04438";

/**
 * @param {object} props
 * @param {object} props.avatar
 * @param {string} props.name
 * @param {string} props.email
 * @param {number} props.debtAmount
 * @param {string} props.dueDate - ISO string
 * @param {boolean} props.youOwe - true if you owe them, false if they owe you
 * @param {function} [props.onPress] - optional, for pressing the card
 */
const FriendCard = ({
  avatar,
  name,
  email,
  debtAmount,
  dueDate,
  youOwe = false,
  onPress,
}) => {
  const currentDate = new Date();
  const isOverdue = dueDate
    ? new Date(dueDate).setHours(0, 0, 0, 0) <= currentDate.setHours(0, 0, 0, 0)
    : false;

  let amountColor = youOwe ? RED : GREEN;
  let showOverdueLabel = isOverdue;
  let overdueLabelColor = amountColor;

  return (
    <View style={styles.card} onTouchEnd={onPress}>
      <View style={styles.left}>
        <Image source={avatar} style={styles.avatar} />
        <View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>
      </View>
      <View style={styles.right}>
        {typeof debtAmount === "number" && !isNaN(debtAmount) ? (
          <Text style={[styles.amount, { color: amountColor }]}>
            ${debtAmount.toFixed(2)}
          </Text>
        ) : null}
        {showOverdueLabel && (
          <Text style={[styles.status, { color: overdueLabelColor }]}>
            overdue
          </Text>
        )}
      </View>
    </View>
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
    marginBottom: 14,
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 15,
    backgroundColor: "#F2F4F7",
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
    minWidth: 100,
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
    textTransform: 'lowercase',
  },
});

export default FriendCard;