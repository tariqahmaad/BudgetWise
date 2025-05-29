import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Modal,
  TouchableOpacity,
  Platform,
  Alert,
  KeyboardAvoidingView,
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
  const friend = route.params?.friend || null;

  const [debtType, setDebtType] = useState("Loan (They Pay)");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dueDate, setDueDate] = useState(new Date());
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [showNotification, setShowNotification] = useState(false);

  // Loading state to prevent duplicate submissions
  const [isSaving, setIsSaving] = useState(false);

  // Remove descriptionRef and any ref logic

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

  const formatDate = (dateObj) => {
    if (!dateObj) return "Select Date";
    return dateObj.toLocaleDateString();
  };

  const { user } = useAuth();

  const handleSaveDept = async () => {
    // Prevent multiple submissions
    if (isSaving) {
      console.log("Debt save already in progress, ignoring duplicate request");
      return;
    }

    try {
      setIsSaving(true);

      if (!user) {
        Alert.alert("Error", "User not authenticated");
        setIsSaving(false);
        return;
      }
      if (!friend || !friend.id) {
        Alert.alert("Error", "No friend selected");
        setIsSaving(false);
        return;
      }
      if (!amount.trim()) {
        Alert.alert("Error", "Please enter an amount");
        setIsSaving(false);
        return;
      }

      let type;
      if (debtType === "Debt (You Pay)") {
        type = "Debt";
      } else if (debtType === "Loan (They Pay)") {
        type = "Credit";
      } else {
        type = "Debt";
      }

      const debtData = {
        amount: parseFloat(amount),
        description: description.trim(),
        type,
        date: date.toISOString(),
        dueDate: dueDate.toISOString(),
        createdAt: serverTimestamp(),
        status: "pending",
        paid: false,
      };

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
      setDebtType("Loan (They Pay)");
      setShowNotification(true);
      setIsSaving(false); // Reset loading state when showing success notification
      setTimeout(() => {
        setShowNotification(false);
        navigation.goBack();
      }, 1000);
    } catch (error) {
      console.error("Error saving debt:", error);
      Alert.alert("Error", "Failed to save debt");
      setIsSaving(false);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <ScreenWrapper backgroundColor={COLORS.white}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <BackButton onPress={handleBackPress} />
            <Text style={styles.title}>Add Debt</Text>
          </View>

          {friend && (
            <View style={styles.friendCardContainer}>
              <FriendCard
                avatar={require("../../../assets/Avatar01.png")}
                name={friend.name}
                email={friend.email}
                isFavorite={friend.isFavorite}
              />
            </View>
          )}

          <Text style={styles.subText}>
            You may add your debts here. Make sure to fill all fields as they
            improve your overall experience in our application.
          </Text>

          <View style={styles.toggleWrapper}>
            <ToggleSwitch
              leftOption="Debt (You Pay)"
              rightOption="Loan (They Pay)"
              initialValue={debtType}
              onToggle={(value) => setDebtType(value)}
              disabled={isSaving}
            />
          </View>

          <ScrollView
            style={styles.formContainer}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={!isSaving}
          >
            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel}>Date</Text>
              <View style={styles.dateInputRow}>
                <TouchableOpacity
                  onPress={isSaving ? undefined : () => setShowDatePicker(true)}
                  style={styles.datePickerTouchable}
                  disabled={isSaving}
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

            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel}>Due Date</Text>
              <View style={styles.dateInputRow}>
                <TouchableOpacity
                  onPress={isSaving ? undefined : () => setShowDueDatePicker(true)}
                  style={styles.datePickerTouchable}
                  disabled={isSaving}
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

            <InputField
              title="Amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              returnKeyType="next"
              blurOnSubmit={false}
              editable={!isSaving}
            />

            <InputField
              title="Description"
              value={description}
              onChangeText={setDescription}
              multiline
              returnKeyType="done"
              blurOnSubmit={false}
              editable={!isSaving}
            />

            <View style={styles.buttonWrapper}>
              <CustomButton
                title="Confirm"
                onPress={handleSaveDept}
                loading={isSaving}
                disabled={isSaving}
              />
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
                  Your Debt has been added.
                </Text>
              </View>
            </View>
          </Modal>
        </View>
      </KeyboardAvoidingView>
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
  toggleWrapper: {
    paddingHorizontal: SIZES.padding.large,
    marginBottom: SIZES.padding.medium,
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