import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

const FriendCard = ({ avatar, name, email }) => {
  return (
    <View style={styles.card}>
      <Image source={avatar} style={styles.avatar} />
      <View style={styles.textContainer}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 20, 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    width: 370,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25, // Ensuring it's circular
    backgroundColor: "transparent", // Prevents unwanted backgrounds
    overflow: "hidden", // Ensures image stays inside the circle
    resizeMode: "cover", // Makes sure it properly fits the circle
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212121",
  },
  email: {
    fontSize: 14,
    color: "#9E9E9E",
  },
});

export default FriendCard;