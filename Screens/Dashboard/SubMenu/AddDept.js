import React, { useState } from "react";
import { View, StyleSheet, Text, ScrollView, Modal } from "react-native";
import BackButton from "../../../Components/Buttons/BackButton";
import ToggleSwitch from "../../../Components/Buttons/ToggleSwitch";
import CustomButton from "../../../Components/Buttons/CustomButton";
import InputField from "../../../Components/InputField/InputField";
import FriendCard from "../../../Components/FriendCards/FriendCard";
import { COLORS, SIZES } from "../../../constants/theme";

const AddDebt = ({ navigation, route }) => {
  // Extract the friend data from route params
  const friend = route.params?.friend || null;

  const [debtType, setDebtType] = useState("Owes");
  const [date, setDate] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const handleSaveDept = () => {
    console.log("Saving dept", {
      type: debtType,
      amount,
      date,
      description,
      dueDate,
      friend: friend
        ? {
            //to keep track of the selected card
            id: friend.id,
            name: friend.name,
            email: friend.email,
          }
        : null,
    });

    setAmount("");
    setDate("");
    setDueDate("");
    setDescription("");
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <BackButton
        navigation={navigation}
        onPress={() => navigation.navigate("debtTracking")}
      />

      <Text style={styles.title}>Add Debt</Text>
      {friend && (
        <View style={styles.friendCardContainer}>
          <FriendCard
            avatar={friend.avatar}
            name={friend.name}
            email={friend.email}
          />
        </View>
      )}

      <Text style={styles.subText}>
        You may add your debts here. Make sure to fill all fields as they
        improve your overall experience in our application
      </Text>

      <ToggleSwitch
        leftOption="Owe"
        rightOption="Owes"
        onToggle={(value) => setDebtType(value)}
      />

      <ScrollView style={styles.formContainer}>
        <InputField title="Date" value={date} onChangeText={setDate} />
        <InputField title="DueDate" value={dueDate} onChangeText={setDueDate} />
        <InputField title="Amount" value={amount} onChangeText={setAmount} />
        <InputField
          title="Description"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <View style={styles.buttonWrapper}>
          <CustomButton title="Confirm" onPress={handleSaveDept} />
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    backgroundColor: "#F5F6FA",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    marginLeft: 30,
  },
  // Add this new style for the friend card container
  friendCardContainer: {
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  subText: {
    fontSize: 14,
    textAlign: "left",
    marginLeft: 30,
    color: "#7E848D",
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

export default AddDebt;