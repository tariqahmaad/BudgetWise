import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";

import React, { useState, useEffect } from "react";
import HorizontalLine from "../HorizontalLine";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
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

  //the new added feilds

  amount: {
    placeholder: "0.00",
    keyboardType: "numeric",
    icon: "dollar-sign", 
    iconType: "Feather",
    autoCapitalize: "none",
    secureTextEntry: false,
  },
  date: {
    placeholder: "Select date",
    keyboardType: "default",
    icon: "calendar",
    iconType: "Feather",
    autoCapitalize: "none",
    secureTextEntry: false,
    isDatePicker: true,
  },
  description: {
    placeholder: "What was this for?",
    keyboardType: "default",
    icon: "file-text",
    iconType: "Feather",
    autoCapitalize: "sentences",
    secureTextEntry: false,
  },
  category: {
    placeholder: "Select category",
    keyboardType: "default",
    icon: "grid",
    iconType: "Feather",
    autoCapitalize: "none",
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
  return (
    INPUT_CONFIG[key] || {
      placeholder: `Enter ${title}`,
      keyboardType: "default",
      icon: "user",
      iconType: "Feather",
      autoCapitalize: "none",
      secureTextEntry: false,
      isDatePicker: false,
    }
  );
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

 
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  const validateDay = (value) => {
    // Allow only numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    // Convert to number and ensure it's between 1-31
    const day = parseInt(numericValue, 10);
    if (!isNaN(day)) {
      if (day > 31) return '31';
      if (day < 1 && numericValue.length > 0) return '1';
    }
    return numericValue;
  };

  const validateMonth = (value) => {
    // Allow only numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    // Convert to number and ensure it's between 1-12
    const month = parseInt(numericValue, 10);
    if (!isNaN(month)) {
      if (month > 12) return '12';
      if (month < 1 && numericValue.length > 0) return '1';
    }
    return numericValue;
  };

  const validateYear = (value) => {
    // Allow only numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // Convert to number and ensure it's within the allowed range
    if (numericValue.length === 4) {
      const year = parseInt(numericValue, 10);
      const currentYear = 2025; // You can use new Date().getFullYear() for current year
      const minYear = currentYear - 30; // 20 years before 2025 = 2005
      const maxYear = currentYear + 10; // 10 years after 2025 = 2035
    
      if (year < minYear) return minYear.toString();
      if (year > maxYear) return maxYear.toString();
    }
    
    return numericValue;
  };

  const handleDateSet = () => {
    if (selectedDay && selectedMonth && selectedYear) {
      // Parse values to integers
      const day = parseInt(selectedDay, 10);
      const month = parseInt(selectedMonth, 10);
      const year = parseInt(selectedYear, 10);
    
      // Validate year range
      const currentYear = 2025; // You can use new Date().getFullYear() for current year
      const minYear = currentYear - 30;
      const maxYear = currentYear + 10;
    
      if (year < minYear || year > maxYear) {
        alert(`Please enter a year between ${minYear} and ${maxYear}`);
        return;
      }
    
      // Check if date is valid (handles leap years, month lengths, etc.)
      const date = new Date(year, month - 1, day);
      if (
        date.getFullYear() !== year || 
        date.getMonth() !== month - 1 || 
        date.getDate() !== day
      ) {
        // This is an invalid date (like February 31)
        alert("Please enter a valid date");
        return;
      }
    
      // Format day and month to ensure leading zeros
      const formattedDay = day.toString().padStart(2, '0');
      const formattedMonth = month.toString().padStart(2, '0');
    
      const formattedDate = `${formattedDay}/${formattedMonth}/${year}`;
      onChangeText(formattedDate);
      setShowDateModal(false);
    } else {
      alert("Please complete all date fields");
    }
  };

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

  const renderPasswordToggle = () =>
    showPasswordToggle && (
      <TouchableOpacity
        onPress={onPasswordToggle}
        style={styles.passwordToggle}
      >
        <Feather
          name={!restProps.secureTextEntry ? "eye-off" : "eye"}
          size={SIZES.inputIcon}
          color={COLORS.authTextSecondary}
        />
      </TouchableOpacity>
    );

  // Handle showing the date modal and pre-filling values
  const showDatePickerModal = () => {
    if (value) {
      const parts = value.split('/');
      if (parts.length === 3) {
        setSelectedDay(parts[0]);
        setSelectedMonth(parts[1]);
        setSelectedYear(parts[2]);
      }
    }
    setShowDateModal(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>{title}</Text>
      <View
        style={[
          styles.inputFieldContainer,
          isFocused && styles.inputFieldContainerFocused,
          error && styles.inputFieldContainerError,
        ]}
      >
        {renderIcon()}

        {config.isDatePicker ? (
          // For date fields, show a touchable area
          <TouchableOpacity
            style={styles.datePickerTouchable}
            onPress={() => {
              console.log("Date field pressed");
              showDatePickerModal();
            }}
          >
            <Text
              style={[
                styles.inputField,
                !value && { color: COLORS.authTextSecondary },
              ]}
            >
              {value || config.placeholder}
            </Text>
            <Feather 
              name="chevron-down" 
              size={16} 
              color={COLORS.authTextSecondary} 
              style={{ marginRight: 5 }}
            />
          </TouchableOpacity>
        ) : (
          // For regular fields, show the text input
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
        )}

        {renderPasswordToggle()}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <View style={styles.horizontalLineContainer}>
        <HorizontalLine
          color={
            error
              ? COLORS.error
              : isFocused
              ? COLORS.primary
              : COLORS.authDivider
          }
        />
      </View>

      {/* Custom Date Picker Modal */}
      {config.isDatePicker && (
        <Modal
          transparent={true}
          visible={showDateModal}
          animationType="fade"
          onRequestClose={() => setShowDateModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowDateModal(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.datePickerModal}>
                  <Text style={styles.datePickerTitle}>Select Date</Text>
                  
                  <View style={styles.dateInputRow}>
                    <View style={styles.dateInputContainer}>
                      <Text style={styles.dateInputLabel}>Day</Text>
                      <TextInput
                        style={styles.dateInput}
                        keyboardType="number-pad"
                        maxLength={2}
                        placeholder="DD"
                        value={selectedDay}
                        onChangeText={setSelectedDay}
                      />
                    </View>
                    
                    <View style={styles.dateInputContainer}>
                      <Text style={styles.dateInputLabel}>Month</Text>
                      <TextInput
                        style={styles.dateInput}
                        keyboardType="number-pad"
                        maxLength={2}
                        placeholder="MM"
                        value={selectedMonth}
                        onChangeText={setSelectedMonth}
                      />
                    </View>
                    
                    <View style={styles.dateInputContainer}>
                      <Text style={styles.dateInputLabel}>Year</Text>
                      <TextInput
                        style={styles.dateInput}
                        keyboardType="number-pad"
                        maxLength={4}
                        placeholder="YYYY"
                        value={selectedYear}
                        onChangeText={setSelectedYear}
                      />
                    </View>
                  </View>
                  
                  <View style={styles.dateButtonRow}>
                    <TouchableOpacity 
                      style={[styles.dateButton, styles.dateButtonCancel]} 
                      onPress={() => setShowDateModal(false)}
                    >
                      <Text style={styles.dateButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.dateButton, styles.dateButtonConfirm]} 
                      onPress={handleDateSet}
                    >
                      <Text style={styles.dateButtonText}>Confirm</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
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
  },
  datePickerTouchable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerModal: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: COLORS.primary,
  },
  dateInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  dateInputContainer: {
    alignItems: 'center',
    width: '30%',
  },
  dateInputLabel: {
    fontSize: 14,
    marginBottom: 5,
    color: COLORS.authTextSecondary,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: COLORS.authDivider,
    borderRadius: 5,
    padding: 10,
    width: '100%',
    textAlign: 'center',
  },
  dateButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  dateButton: {
    padding: 10,
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  dateButtonCancel: {
    backgroundColor: COLORS.authTextSecondary,
  },
  dateButtonConfirm: {
    backgroundColor: COLORS.primary,
  },
  dateButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
