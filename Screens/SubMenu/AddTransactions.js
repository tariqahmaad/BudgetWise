import React, { useState } from "react";
import { View, StyleSheet, Text, Modal, ScrollView } from "react-native";
import ToggleSwitch from "../../Components/Buttons/ToggleSwitch";
import BackButton from "../../Components/Buttons/BackButton";
import CustomButton from "../../Components/Buttons/CustomButton";
import InputField from "../../Components/InputField/InputField";
import { COLORS, SIZES } from "../../constants/theme";

const AddTransactions = ({ navigation }) => {
  const [transactionType, setTransactionType] = useState("Expenses");
  const [showNotification, setShowNotification] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  const handleToggle = (type) => {
    setTransactionType(type);
    console.log("Selected transaction type:", type);
    //handeling the input type in firestore
  };

  // Validation
  // if (!amount || !date || !description || !category) {
  //   alert("Please fill in all fields");
  //   return;
  // }
  const handleSaveTransaction = () => {
    console.log("Saving transaction", {
      type: transactionType,
      amount,
      date,
      description,
      category,
    });

    //adding Firestore code to save the transaction
    setAmount("");
    setDate("");
    setDescription("");
    setCategory("");

    // Show the notification
    setShowNotification(true);

    // Auto-hide after 3 seconds
    setTimeout(() => {
      setShowNotification(false);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <BackButton navigation={navigation} />
      <Text style={styles.title}>Add Transactions</Text>
      <ToggleSwitch onToggle={handleToggle} />

      <ScrollView style={styles.formContainer}>
        <InputField title="Amount" value={amount} onChangeText={setAmount} />

        <InputField title="Date" value={date} onChangeText={setDate} />

        <InputField
          title="Description"
          value={description}
          onChangeText={setDescription}
        />

        <InputField
          title="Category"
          value={category}
          onChangeText={setCategory}
        />

        <View style={styles.buttonWrapper}>
          <CustomButton
            title="Save Transaction"
            onPress={handleSaveTransaction}
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
              Your transaction has been added to your budget.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  buttonWrapper: {
    alignItems: "center",
    marginVertical: 30,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  notificationBox: {
    backgroundColor: "white",
    padding: 30,
    borderRadius: 15,
    width: "80%",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    alignItems: "center",
  },
  notificationTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    color: COLORS.primary,
  },
  notificationText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default AddTransactions;
