import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Modal,
  TouchableOpacity,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import ToggleSwitch from "../../../Components/Buttons/ToggleSwitch";
import BackButton from "../../../Components/Buttons/BackButton";
import CustomButton from "../../../Components/Buttons/CustomButton";
import InputField from "../../../Components/InputField/InputField";
import ScreenWrapper from "../../../Components/ScreenWrapper"; // Make sure this exists
import { COLORS, SIZES, SHADOWS } from "../../../constants/theme";

const AddTransactions = ({ navigation }) => {
  const [transactionType, setTransactionType] = useState("Expenses");
  const [showNotification, setShowNotification] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  const handleToggle = (type) => {
    setTransactionType(type);
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const onDateChange = (_, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === "ios");
    setDate(currentDate);
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
  };

  const formatDate = (dateObj) => {
    if (!dateObj) return "Select Date";
    return dateObj.toLocaleDateString();
  };

  const handleSaveTransaction = () => {
    console.log("Saving transaction", {
      type: transactionType,
      amount,
      date,
      description,
      category,
    });

    setAmount("");
    setDate(new Date());
    setDescription("");
    setCategory("");
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 1000);
  };

  return (
    <ScreenWrapper backgroundColor={COLORS.white}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton onPress={handleBackPress} />
          <Text style={styles.title}>Add Transactions</Text>
        </View>

        <Text style={styles.subText}>
          You may add your transactions here. Make sure to fill all fields as they improve your overall experience in our application
        </Text>

        <ToggleSwitch onToggle={handleToggle} />

        <ScrollView style={styles.formContainer}>
          <InputField title="Amount" value={amount} onChangeText={setAmount} />

          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Date</Text>
            <View style={styles.dateInputRow}>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={styles.datePickerTouchable}
              >
                <Text style={styles.datePickerText}>{formatDate(date)}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.lineContainer}>
              <View style={styles.line} />
            </View>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              onChange={onDateChange}
              accentColor={COLORS.primary}
              backgroundColor={COLORS.lightGray}
              display="default"
            />
          )}

          <InputField title="Description" value={description} onChangeText={setDescription} />
          <InputField title="Category" value={category} onChangeText={setCategory} />

          <View style={styles.buttonWrapper}>
            <CustomButton title="Save Transaction" onPress={handleSaveTransaction} />
          </View>
        </ScrollView>

        <Modal
          transparent={true}
          visible={showNotification}
          animationType="fade"
          onRequestClose={() => setShowNotification(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.notificationBox}>
              <Text style={styles.notificationTitle}>Success!</Text>
              <Text style={styles.notificationText}>
                Your transaction has been added to your budget.
              </Text>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingHorizontal: SIZES.padding.xxlarge,
    marginBottom: SIZES.padding.large,
  },
  title: {
    fontSize: SIZES.font.xlarge,
    marginLeft: SIZES.padding.xlarge,
    color: COLORS.text,
    fontFamily: "Poppins-SemiBold",
    marginLeft: 45,

  },
  subText: {
    fontSize: SIZES.font.medium,
    textAlign: "left",
    marginHorizontal: SIZES.padding.xxxlarge,
    marginBottom: SIZES.padding.large,
    color: COLORS.textSecondary,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: SIZES.padding.xxlarge,
    marginTop: SIZES.padding.large,
  },
  fieldWrapper: {
    marginBottom: SIZES.padding.xlarge,
  },
  fieldLabel: {
    fontSize: SIZES.font.medium,
    fontFamily: "Poppins-Regular",
    color: COLORS.textSecondary,
    marginBottom: SIZES.padding.medium,
  },
  dateInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  datePickerTouchable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SIZES.padding.xlarge,
    paddingHorizontal: SIZES.padding.large,
  },
  datePickerText: {
    fontSize: SIZES.font.large,
    fontFamily: "Poppins-Regular",
    color: COLORS.text,
  },
  lineContainer: {
    flexDirection: "row",
  },
  line: {
    height: 1,
    backgroundColor: COLORS.authDivider,
    flex: 1,
  },
  buttonWrapper: {
    alignItems: "center",
    marginVertical: SIZES.padding.xxxlarge,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  notificationBox: {
    backgroundColor: COLORS.white,
    padding: SIZES.padding.xxxlarge,
    borderRadius: SIZES.radius.medium,
    width: "80%",
    alignItems: "center",
    ...SHADOWS.medium,
    elevation: 5,
  },
  notificationTitle: {
    fontSize: SIZES.font.xlarge,
    fontWeight: "bold",
    marginBottom: SIZES.padding.large,
    color: COLORS.primary,
  },
  notificationText: {
    fontSize: SIZES.font.medium,
    textAlign: "center",
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
});

export default AddTransactions;
