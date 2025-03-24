import { StyleSheet, Text, View, TextInput, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import HorizontalLine from "../HorizontalLine";
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS, SIZES } from "../../constants/theme";

// Input field configurations
const INPUT_CONFIG = {
  email: {
    placeholder: "name@mail.com",
    keyboardType: "email-address",
    icon: "mail-outline",
    iconType: "Ionicons",
    autoCapitalize: "none",
    secureTextEntry: false,
  },
  password: {
    placeholder: "password",
    keyboardType: "default",
    icon: "lock",
    iconType: "Feather",
    autoCapitalize: "none",
    secureTextEntry: true,
  },
  phone: {
    placeholder: "123-456-7890",
    keyboardType: "phone-pad",
    icon: "phone-outline",
    iconType: "MaterialCommunityIcons",
    autoCapitalize: "none",
    secureTextEntry: false,
  },
  name: {
    placeholder: "Enter your name",
    keyboardType: "default",
    icon: "user",
    iconType: "Feather",
    autoCapitalize: "words",
    secureTextEntry: false,
  },
  surname: {
    placeholder: "Enter your surname",
    keyboardType: "default",
    icon: "user",
    iconType: "Feather",
    autoCapitalize: "words",
    secureTextEntry: false,
  },
};

// Icon component mapping
const IconComponents = {
  Ionicons,
  Feather,
  MaterialCommunityIcons,
};

const getInputConfig = (title) => {
  const key = title.toLowerCase();
  return INPUT_CONFIG[key] || {
    placeholder: `Enter ${title}`,
    keyboardType: "default",
    icon: "user",
    iconType: "Feather",
    autoCapitalize: "none",
    secureTextEntry: false,
  };
};

const InputField = ({
  title = "title",
  value,
  onChangeText,
  error,
  onBlur,
  onFocus,
  showPasswordToggle,
  onPasswordToggle,
  ...restProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const config = getInputConfig(title);
  const IconComponent = IconComponents[config.iconType];

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const renderIcon = () => (
    <IconComponent
      name={config.icon}
      size={SIZES.inputIcon}
      color={isFocused ? COLORS.primary : COLORS.authTextSecondary}
      style={styles.icon}
    />
  );

  const renderPasswordToggle = () => (
    showPasswordToggle && (
      <TouchableOpacity onPress={onPasswordToggle} style={styles.passwordToggle}>
        <Feather
          name={!restProps.secureTextEntry ? "eye-off" : "eye"}
          size={SIZES.inputIcon}
          color={COLORS.authTextSecondary}
        />
      </TouchableOpacity>
    )
  );

  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>{title}</Text>
      <View style={[
        styles.inputFieldContainer,
        isFocused && styles.inputFieldContainerFocused,
        error && styles.inputFieldContainerError
      ]}>
        {renderIcon()}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={config.placeholder}
          placeholderTextColor={COLORS.authTextSecondary}
          keyboardType={config.keyboardType}
          secureTextEntry={restProps.secureTextEntry}
          autoCapitalize={config.autoCapitalize}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={styles.inputField}
          {...restProps}
        />
        {renderPasswordToggle()}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <View style={styles.horizontalLineContainer}>
        <HorizontalLine color={error ? COLORS.error : (isFocused ? COLORS.primary : COLORS.authDivider)} />
      </View>
    </View>
  );
};

export default InputField;

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.padding.large,
  },
  titleText: {
    fontSize: SIZES.font.large,
    fontFamily: "Poppins-Regular",
    color: COLORS.authText,
    marginBottom: SIZES.padding.small,
  },
  icon: {
    height: SIZES.inputIcon,
    width: SIZES.inputIcon,
    marginBottom: SIZES.padding.small,
    resizeMode: "center",
  },
  inputFieldContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: SIZES.padding.small,
    paddingHorizontal: SIZES.padding.small,
  },
  inputFieldContainerFocused: {
    backgroundColor: COLORS.authBackground,
  },
  inputFieldContainerError: {
    borderColor: COLORS.error,
  },
  inputField: {
    flex: 1,
    fontSize: SIZES.font.large,
    fontFamily: "Poppins-Regular",
    color: COLORS.authText,
    marginLeft: SIZES.padding.large,
    textAlignVertical: "center",
  },
  horizontalLineContainer: {
    flexDirection: "row",
  },
  passwordToggle: {
    padding: SIZES.padding.small,
  },
  errorText: {
    color: COLORS.error,
    fontSize: SIZES.font.small,
    fontFamily: "Poppins-Regular",
    marginTop: SIZES.padding.small,
  }
});
