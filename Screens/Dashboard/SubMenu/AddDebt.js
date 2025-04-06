import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Modal,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import BackButton from "../../../Components/Buttons/BackButton";
import ToggleSwitch from "../../../Components/Buttons/ToggleSwitch";
import CustomButton from "../../../Components/Buttons/CustomButton";
import InputField from "../../../Components/InputField/InputField";
import FriendCard from "../../../Components/FriendCards/FriendCard";
import ScreenWrapper from "../../../Components/ScreenWrapper";
import { COLORS, SIZES, SHADOWS } from "../../../constants/theme";
import { useAuth } from "../../../context/AuthProvider";
import { firestore, collection, addDoc, serverTimestamp } from "../../../firebase/firebaseConfig";

const AddDebt = ({ navigation, route }) => {
  // Extract the friend data from route params
  const friend = route.params?.friend || null;

  const [debtType, setDebtType] = useState("Loan (They Pay)");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dueDate, setDueDate] = useState(new Date());
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [showNotification, setShowNotification] = useState(false);

  // --- Date Picker Handlers ---
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === "ios");
    setDate(currentDate);
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
  };

  const onDueDateChange = (event, selectedDueDate) => {
    const currentDueDate = selectedDueDate || dueDate;
    setShowDueDatePicker(Platform.OS === "ios");
    setDueDate(currentDueDate);
    if (Platform.OS === "android") {
      setShowDueDatePicker(false);
    }
  };

  // Helper to format date for display
  const formatDate = (dateObj) => {
    if (!dateObj) return "Select Date";
    return dateObj.toLocaleDateString();
  };
  // --- End Date Picker Handlers ---

  const { user } = useAuth();

  const handleSaveDept = async () => {
    if (!user) {
      Alert.alert("Error", "User not authenticated");
      return;
    }
    if (!friend || !friend.id) {
      Alert.alert("Error", "No friend selected");
      return;
    }
    if (!amount.trim()) {
      Alert.alert("Error", "Please enter an amount");
      return;
    }

    const debtData = {
      amount: parseFloat(amount),
      description: description.trim(),
      type: debtType === "Debt (You Pay)" ? "Debt" : "Loan",
      date: date.toISOString(),
      dueDate: dueDate.toISOString(),
      createdAt: serverTimestamp(),
      status: "pending",
    };

    try {
      const debtsRef = collection(
        firestore,
        "users",
        user.uid,
        "friends",
        friend.id,
        "debts"
      );
      await addDoc(debtsRef, debtData);

      setAmount("");
      setDate(new Date());
      setDueDate(new Date());
      setDescription("");
      setDebtType("Owes");
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
        navigation.goBack();
      }, 1000);
    } catch (error) {
      console.error("Error saving debt:", error);
      Alert.alert("Error", "Failed to save debt");
    }
  };

  // Handle back press
  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <ScreenWrapper backgroundColor={COLORS.white}>
      <View style={styles.container}>
        {/* Header like AddTransactions */}
        <View style={styles.header}>
          <BackButton onPress={handleBackPress} />
          <Text style={styles.title}>Add Debt</Text>
        </View>

        {/* Optional: Display Friend Card below header if friend exists */}
        {friend && (
          <View style={styles.friendCardContainer}>
            <FriendCard
              avatar={require("../../../assets/Avatar01.png")}
              name={friend.name}
              email={friend.email}
            />
          </View>
        )}

        {/* Subtext like AddTransactions */}
        <Text style={styles.subText}>
          You may add your debts here. Make sure to fill all fields as they
          improve your overall experience in our application.
        </Text>

        {/* ToggleSwitch like AddTransactions */}
        <ToggleSwitch
          leftOption="Debt (You Pay)"
          rightOption="Loan (They Pay)"
          initialValue={debtType}
          onToggle={(value) => setDebtType(value)}
        />

        <ScrollView style={styles.formContainer}>
          {/* Date Input Field */}
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
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onDateChange}
              accentColor={COLORS.primary}
              backgroundColor={COLORS.lightGray}
            />
          )}

          {/* Due Date Input Field */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Due Date</Text>
            <View style={styles.dateInputRow}>
              <TouchableOpacity
                onPress={() => setShowDueDatePicker(true)}
                style={styles.datePickerTouchable}
              >
                <Text style={styles.datePickerText}>{formatDate(dueDate)}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.lineContainer}>
              <View style={styles.line} />
            </View>
          </View>
          {showDueDatePicker && (
            <DateTimePicker
              value={dueDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onDueDateChange}
              minimumDate={date}
              accentColor={COLORS.primary}
              backgroundColor={COLORS.lightGray}
            />
          )}

          {/* Amount Input Field */}
          <InputField
            title="Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />

          {/* Description Input Field */}
          <InputField
            title="Description"
            value={description}
            onChangeText={setDescription}
            multiline
          />

          {/* Save Button like AddTransactions */}
          <View style={styles.buttonWrapper}>
            <CustomButton title="Confirm" onPress={handleSaveDept} />
          </View>
        </ScrollView>

        {/* Modal like AddTransactions */}
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
                Your Debt has been added.
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
    flex: 1,
    textAlign: 'center',
    marginLeft: -SIZES.padding.xxlarge,
    paddingRight: 40,
    color: COLORS.text,
    fontFamily: "Poppins-SemiBold",
  },
  friendCardContainer: {
    marginHorizontal: SIZES.padding.xxlarge,
    marginBottom: SIZES.padding.medium,
    marginTop: SIZES.padding.xlarge,
  },
  subText: {
    fontSize: SIZES.font.medium,
    textAlign: "left",
    marginHorizontal: SIZES.padding.xxxlarge,
    marginBottom: SIZES.padding.large,
    color: COLORS.textSecondary,
    fontFamily: "Poppins-Regular",
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
    fontFamily: "Poppins-Bold",
    marginBottom: SIZES.padding.large,
    color: COLORS.primary,
  },
  notificationText: {
    fontSize: SIZES.font.medium,
    textAlign: "center",
    lineHeight: 20,
    color: COLORS.textSecondary,
    fontFamily: "Poppins-Regular",
  },
});

export default AddDebt;
