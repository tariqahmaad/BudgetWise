import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { updateDoc, doc } from "firebase/firestore";
import { firestore } from "../../firebase/firebaseConfig";
import { COLORS } from "../../constants/theme";

const EditAccountModal = ({
  isVisible,
  onClose,
  onSuccess,
  account,
  user,
  setIsLoading,
  isLoading,
}) => {
  const [title, setTitle] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");

  // Animation refs
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    if (account) {
      setTitle(account.title || "");
      setCurrentBalance((account.currentBalance || 0).toString());
      setGoalAmount((account.goalAmount || 0).toString());
      setCurrentAmount((account.currentAmount || 0).toString());
    }
  }, [account]);

  useEffect(() => {
    if (isVisible) {
      // Animate modal in
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(modalTranslateY, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animation values when modal becomes invisible
      backdropOpacity.setValue(0);
      modalTranslateY.setValue(500);
    }
  }, [isVisible, backdropOpacity, modalTranslateY]);

  const handleClose = () => {
    // Animate modal out
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(modalTranslateY, {
        toValue: 500,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter an account title.");
      return;
    }

    try {
      setIsLoading(true);

      let updateData = {
        title: title.trim(),
      };

      // Add balance fields based on account type
      if (account.type === "balance" || account.type === "income_tracker") {
        const balance = parseFloat(currentBalance) || 0;
        updateData.currentBalance = balance;
      }

      if (account.type === "savings_goal") {
        const goal = parseFloat(goalAmount) || 0;
        const current = parseFloat(currentAmount) || 0;
        updateData.goalAmount = goal;
        updateData.currentAmount = current;
      }

      const accountRef = doc(firestore, "users", user.uid, "accounts", account.id);
      await updateDoc(accountRef, updateData);

      Alert.alert("Success", "Account updated successfully!");
      // Animate modal out smoothly after success
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(modalTranslateY, {
          toValue: 500,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onSuccess();
      });
    } catch (error) {
      console.error("Error updating account:", error);
      Alert.alert("Error", "Failed to update account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderBalanceFields = () => {
    if (!account) return null;

    if (account.type === "balance" || account.type === "income_tracker") {
      return (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Current Balance</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.input}
              value={currentBalance}
              onChangeText={setCurrentBalance}
              placeholder="0.00"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
          </View>
        </View>
      );
    }

    if (account.type === "savings_goal") {
      return (
        <>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Goal Amount</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.input}
                value={goalAmount}
                onChangeText={setGoalAmount}
                placeholder="0.00"
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Current Saved Amount</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.input}
                value={currentAmount}
                onChangeText={setCurrentAmount}
                placeholder="0.00"
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </>
      );
    }

    return null;
  };

  return (
    <Modal visible={isVisible} animationType="none" transparent>
      <Animated.View
        style={[
          styles.overlay,
          { opacity: backdropOpacity }
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={handleClose}
        />
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              { transform: [{ translateY: modalTranslateY }] }
            ]}
          >
            <View style={styles.header}>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Edit Account</Text>
              <View style={styles.placeholder} />
            </View>

            <View style={styles.content}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Account Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter account name"
                  placeholderTextColor="#999"
                  maxLength={50}
                />
              </View>

              {renderBalanceFields()}

              <TouchableOpacity
                style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={isLoading}
              >
                <Text style={styles.saveButtonText}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 15,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
  },
  closeButton: {
    padding: 4,
  },
  placeholder: {
    width: 32,
  },
  content: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#000",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#000",
    backgroundColor: "#FAFAFA",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 10,
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#666",
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#000",
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
  },
});

export default EditAccountModal;