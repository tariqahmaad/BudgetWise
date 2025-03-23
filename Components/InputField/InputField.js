import { StyleSheet, Text, View, TextInput } from "react-native";
import React from "react";
import HorizontalLine from "../HorizontalLine";
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const getPlaceholder = (title) => {
  if (title.toLowerCase() === "email") {
    return "name@mail.com";
  } else if (title.toLowerCase() === "password") {
    return "password";
  } else if (title.toLowerCase() === "phone") {
    return "123-456-7890";
  } else {
    return "Enter " + title;
  }
};

const getKeyboardType = (title) => {
  if (title.toLowerCase() === "email") {
    return "email-address";
  } else if (title.toLowerCase() === "phone") {
    return "phone-pad";
  } else {
    return "default";
  }
};

const getSecureTextEntry = (title) => {
  return title.toLowerCase() === "password";
};

const getIconComponent = (title) => {
  const iconColor = "#A2A2A7";
  const iconSize = 23;
  switch (title.toLowerCase()) {
    case "email":
      return <Ionicons name="mail-outline" size={iconSize} color={iconColor} style={styles.icon} />;
    case "password":
      return <Feather name="lock" size={iconSize} color={iconColor} style={styles.icon} />;
    case "phone":
      return <MaterialCommunityIcons name="phone-outline" size={iconSize} color={iconColor} style={styles.icon} />;
    case "name":
      return <Feather name="user" size={iconSize} color={iconColor} style={styles.icon} />;
    case "surname":
      return <Feather name="user" size={iconSize} color={iconColor} style={styles.icon} />;
    default:
      return <Feather name="user" size={iconSize} color={iconColor} style={styles.icon} />;
  }
};

const InputField = (props) => {
  const {
    title = "title",
    placeholder = getPlaceholder(title),
    keyboardType = getKeyboardType(title),
    secureTextEntry = getSecureTextEntry(title),
  } = props;

  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>{title}</Text>
      <View style={styles.imputFieldContainer}>
        {getIconComponent(title)}
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#A2A2A7"
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          style={styles.InputField}
        />
      </View>
      <View style={{ flexDirection: "row" }}>
        <HorizontalLine />
      </View>
    </View>
  );
};

export default InputField;

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  titleText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#1e1e2d",
  },
  icon: {
    height: 25,
    width: 25,
    marginBottom: 5,
    resizeMode: "center",
  },
  imputFieldContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  InputField: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#1E1E2D",
    marginLeft: 10,
    textAlignVertical: "center",
  }
});
