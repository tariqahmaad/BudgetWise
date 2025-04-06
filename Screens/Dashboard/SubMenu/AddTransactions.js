import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Modal,
  TouchableOpacity,
  Platform,
  FlatList,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

import ToggleSwitch from "../../../Components/Buttons/ToggleSwitch";
import BackButton from "../../../Components/Buttons/BackButton";
import CustomButton from "../../../Components/Buttons/CustomButton";
import InputField from "../../../Components/InputField/InputField";
import ScreenWrapper from "../../../Components/ScreenWrapper"; // Make sure this exists
import { COLORS, SIZES, SHADOWS, CATEGORY_ICONS } from "../../../constants/theme";

import { firestore, collection, addDoc, serverTimestamp, auth, query, where, getDocs, updateDoc, doc as firestoreDoc } from "../../../firebase/firebaseConfig";

const AddTransactions = ({ navigation }) => {
  const [transactionType, setTransactionType] = useState("Expenses");
  const [showNotification, setShowNotification] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState("");
  const [selectedCategoryLabel, setSelectedCategoryLabel] = useState(CATEGORY_ICONS[0].label);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);

  const handleCategorySelection = (label, index) => {
    setSelectedCategoryLabel(label);
    setSelectedCategoryIndex(index);
  };

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

  const handleSaveTransaction = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log("No user logged in");
        return;
      }

      const amountValue = parseFloat(amount);

      const transactionData = {
        type: transactionType,
        amount: amountValue,
        date: date.toISOString(),
        description,
        category: selectedCategoryLabel,
        createdAt: serverTimestamp(),
      };

      await addDoc(
        collection(firestore, "users", user.uid, "transactions"),
        transactionData
      );

      console.log("Transaction saved to Firestore:", transactionData);

      if (transactionType === "Income" || transactionType === "Expenses") {
        const accountsRef = collection(firestore, "users", user.uid, "accounts");
        const q = query(accountsRef, where("type", "==", "balance"));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach(async (accountDoc) => {
          const accountRef = firestoreDoc(firestore, "users", user.uid, "accounts", accountDoc.id);
          const currentBalance = accountDoc.data().currentBalance || 0;
          const newBalance = transactionType === "Income"
            ? currentBalance + amountValue
            : currentBalance - amountValue;
          await updateDoc(accountRef, {
            currentBalance: newBalance,
          });
        });
      }
    } catch (error) {
      console.error("Error saving transaction:", error);
    }

    setAmount("");
    setDate(new Date());
    setDescription("");
    setSelectedCategoryLabel(CATEGORY_ICONS[0].label);
    setSelectedCategoryIndex(0);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
      navigation.goBack();
    }, 1000);
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

          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.iconsSliderContainer}>
              <FlatList
                data={CATEGORY_ICONS}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={[
                      styles.iconSliderItem,
                      selectedCategoryIndex === index && styles.selectedIconItem
                    ]}
                    onPress={() => handleCategorySelection(item.label, index)}
                  >
                    <View style={[
                      styles.iconBubble,
                      selectedCategoryIndex === index && styles.selectedIconBubble
                    ]}>
                      <Ionicons name={item.name} size={24} color="#333" />
                    </View>
                    <Text style={styles.iconLabel} numberOfLines={1}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item, index) => index.toString()}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.iconsSlider}
              />
            </View>
          </View>

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
  iconsSliderContainer: {
    backgroundColor: COLORS.lightGrayBackground,
    borderRadius: SIZES.radius.medium,
    // padding: 5,
    marginBottom: SIZES.padding.xxlarge,
  },
  iconsSlider: {
    paddingVertical: 4,
  },
  iconSliderItem: {
    width: 80,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  selectedIconItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: SIZES.radius.medium,
  },
  iconBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedIconBubble: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  iconLabel: {
    fontSize: SIZES.font.small,
    fontFamily: 'Poppins-Medium',
    color: COLORS.darkGray,
    textAlign: 'center',
    maxWidth: '100%',
  },
});

export default AddTransactions;
