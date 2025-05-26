// import React, { useState, useEffect } from "react";
// import {
//   View,
//   ScrollView,
//   Text,
//   StyleSheet,
//   ActivityIndicator,
//   Modal,
//   TouchableOpacity,
//   Alert,
//   Platform,
// } from "react-native";
// import FriendCard from "../../../Components/FriendCards/FriendCard";
// import BackButton from "../../../Components/Buttons/BackButton";
// import ScreenWrapper from "../../../Components/ScreenWrapper";
// import { COLORS, SIZES } from "../../../constants/theme";
// import { useAuth } from "../../../context/AuthProvider";
// import {
//   firestore,
//   collection,
//   onSnapshot,
//   getDocs,
//   doc,
//   updateDoc,
//   increment,
// } from "../../../firebase/firebaseConfig";

// const Debts = ({ navigation, route }) => {
//   const { user } = useAuth();
//   const { friendId, friendName, friendEmail, avatar, type } = route.params;

//   const [debts, setDebts] = useState([]);
//   const [accounts, setAccounts] = useState([]);
//   const [accountModalVisible, setAccountModalVisible] = useState(false);
//   const [selectedDebt, setSelectedDebt] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [paying, setPaying] = useState(false);

//   // Real-time fetch debts for this friend (only UNPAID debts)
//   useEffect(() => {
//     if (!user) return;
//     setLoading(true);

//     const debtsRef = collection(
//       firestore,
//       "users",
//       user.uid,
//       "friends",
//       friendId,
//       "debts"
//     );
//     const unsub = onSnapshot(debtsRef, (debtsSnap) => {
//       const unpaid = debtsSnap.docs
//         .map((doc) => ({ id: doc.id, ...doc.data() }))
//         .filter((d) =>
//           type === "owe" ? d.type === "Debt" && !d.paid : d.type === "Credit" && !d.paid
//         );
//       setDebts(unpaid);
//       setLoading(false);
//     });

//     return () => unsub();
//   }, [user, friendId, type]);

//   // Fetch accounts for modal (no need for real-time here)
//   useEffect(() => {
//     if (!user) return;
//     const fetchAccounts = async () => {
//       const accountsRef = collection(firestore, "users", user.uid, "accounts");
//       const snap = await getDocs(accountsRef);
//       setAccounts(
//         snap.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         }))
//       );
//     };
//     fetchAccounts();
//   }, [user]);

//   // Pay or receive a specific debt
//   const handlePayOrReceive = (debt) => {
//     setSelectedDebt(debt);
//     setAccountModalVisible(true);
//   };

//   const handleAccountChoose = async (account) => {
//     setAccountModalVisible(false);
//     setPaying(true);

//     try {
//       // Mark debt as paid in Firestore
//       const debtDocRef = doc(
//         firestore,
//         "users",
//         user.uid,
//         "friends",
//         friendId,
//         "debts",
//         selectedDebt.id
//       );
//       await updateDoc(debtDocRef, { paid: true });

//       // Update account balance
//       const accountDocRef = doc(
//         firestore,
//         "users",
//         user.uid,
//         "accounts",
//         account.id
//       );
//       if (type === "owe") {
//         // You pay: subtract from your account
//         await updateDoc(accountDocRef, {
//           currentBalance: increment(-selectedDebt.amount),
//         });
//       } else {
//         // Someone pays you: add to your account
//         await updateDoc(accountDocRef, {
//           currentBalance: increment(selectedDebt.amount),
//         });
//       }

//       setSelectedDebt(null);
//       Alert.alert("Success", type === "owe" ? "Debt paid!" : "Payment received!");
//     } catch (err) {
//       setSelectedDebt(null); // Keep the debt in UI if payment fails
//       Alert.alert("Error", "Could not process payment.");
//     }
//     setPaying(false);
//   };

//   const handleBackPress = () => {
//     navigation.goBack();
//   };

//   return (
//     <ScreenWrapper backgroundColor={COLORS.white}>
//       <View style={styles.container}>
//         <View style={styles.header}>
//           <BackButton onPress={handleBackPress} />
//           <Text style={styles.title}>{type === "owe" ? "Pay Debts" : "Receive Payments"}</Text>
//         </View>
//         <Text style={styles.infoText}>
//           {type === "owe"
//             ? "Below are unpaid debts you owe to this contact. Tap to pay."
//             : "Below are unpaid debts this contact owes you. Tap to receive."}
//         </Text>
//         {loading ? (
//           <ActivityIndicator style={{ marginTop: 32 }} size="large" color={COLORS.primary} />
//         ) : (
//           <ScrollView contentContainerStyle={styles.scrollContainer}>
//             {debts.length === 0 ? (
//               <Text style={{ color: "#888", textAlign: "center", marginTop: 30 }}>
//                 No unpaid {type === "owe" ? "debts" : "credits"} for this contact!
//               </Text>
//             ) : (
//               debts.map((debt) => (
//                 <TouchableOpacity
//                   key={debt.id}
//                   disabled={paying}
//                   onPress={() => handlePayOrReceive(debt)}
//                   style={{ marginBottom: SIZES.padding.medium }}
//                 >
//                   <FriendCard
//                     avatar={avatar}
//                     name={friendName}
//                     email={friendEmail}
//                     debtAmount={debt.amount}
//                     dueDate={debt.dueDate}
//                     youOwe={type === "owe"}
//                   />
//                   {/* Only show Overdue if actually overdue */}
//                   {debt.dueDate && new Date(debt.dueDate) < new Date() && (
//                     <Text
//                       style={{
//                         color: "#F04438",
//                         fontWeight: "bold",
//                         marginTop: 4,
//                         marginLeft: 12,
//                       }}
//                     >
//                     </Text>
//                   )}
//                 </TouchableOpacity>
//               ))
//             )}
//           </ScrollView>
//         )}

//         {/* Account selection modal */}
//         <Modal visible={accountModalVisible} transparent animationType="slide">
//           <View
//             style={{
//               flex: 1,
//               backgroundColor: "rgba(0,0,0,0.5)",
//               justifyContent: "center",
//               alignItems: "center",
//             }}
//           >
//             <View
//               style={{
//                 backgroundColor: "#fff",
//                 padding: 24,
//                 borderRadius: 16,
//                 minWidth: 300,
//               }}
//             >
//               <Text
//                 style={{
//                   fontSize: 18,
//                   fontWeight: "bold",
//                   marginBottom: 12,
//                 }}
//               >
//                 Select account {type === "owe" ? "to pay from" : "to receive to"}:
//               </Text>
//               {accounts.map((acc) => (
//                 <TouchableOpacity
//                   key={acc.id}
//                   style={{
//                     padding: 12,
//                     borderBottomWidth: 1,
//                     borderBottomColor: "#eee",
//                   }}
//                   onPress={() => handleAccountChoose(acc)}
//                   disabled={paying}
//                 >
//                   <Text style={{ fontSize: 16 }}>
//                     {acc.title} (${Number(acc.currentBalance).toFixed(2)})
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//               <TouchableOpacity
//                 onPress={() => setAccountModalVisible(false)}
//                 disabled={paying}
//               >
//                 <Text style={{ color: "red", marginTop: 16, textAlign: "center" }}>
//                   Cancel
//                 </Text>
//               </TouchableOpacity>
//               {paying && (
//                 <ActivityIndicator style={{ marginTop: 12 }} color={COLORS.primary} />
//               )}
//             </View>
//           </View>
//         </Modal>
//       </View>
//     </ScreenWrapper>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingTop: Platform.OS === "ios" ? 50 : 30,
//     paddingHorizontal: SIZES.padding.xxlarge,
//     marginBottom: SIZES.padding.large,
//   },
//   title: {
//     fontSize: SIZES.font.xlarge,
//     flex: 1,
//     textAlign: "center",
//     paddingRight: 40,
//     color: COLORS.text,
//     fontFamily: "Poppins-SemiBold",
//   },
//   infoText: {
//     textAlign: "left",
//     fontSize: SIZES.font.medium,
//     color: COLORS.textSecondary,
//     marginHorizontal: SIZES.padding.xxlarge,
//     marginBottom: SIZES.padding.large,
//     fontFamily: "Poppins-Regular",
//   },
//   scrollContainer: {
//     paddingHorizontal: SIZES.padding.xlarge,
//     paddingBottom: SIZES.padding.xxlarge,
//   },
// });

// export default Debts;

//new code
import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import FriendCard from "../../../Components/FriendCards/FriendCard";
import BackButton from "../../../Components/Buttons/BackButton";
import ScreenWrapper from "../../../Components/ScreenWrapper";
import { COLORS, SIZES } from "../../../constants/theme";
import { useAuth } from "../../../context/AuthProvider";
import {
  firestore,
  collection,
  onSnapshot,
  getDocs,
  doc,
  updateDoc,
  increment,
} from "../../../firebase/firebaseConfig";

const Debts = ({ navigation, route }) => {
  const { user } = useAuth();
  const { friendId, friendName, friendEmail, avatar, type } = route.params;

  const [debts, setDebts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  // Real-time fetch debts for this friend (only UNPAID debts)
  useEffect(() => {
    if (!user || !friendId || !type) {
      setDebts([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const debtsRef = collection(
      firestore,
      "users",
      user.uid,
      "friends",
      friendId,
      "debts"
    );
    const unsub = onSnapshot(debtsRef, (debtsSnap) => {
      if (!debtsSnap || !Array.isArray(debtsSnap.docs)) {
        setDebts([]);
        setLoading(false);
        return;
      }
      const unpaid = debtsSnap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((d) =>
          type === "owe"
            ? d.type === "Debt" && !d.paid
            : d.type === "Credit" && !d.paid
        );
      setDebts(unpaid);
      setLoading(false);
    });

    return () => unsub();
  }, [user, friendId, type]);

  // Fetch accounts for modal (no need for real-time here)
  useEffect(() => {
    if (!user) return;
    const fetchAccounts = async () => {
      const accountsRef = collection(firestore, "users", user.uid, "accounts");
      const snap = await getDocs(accountsRef);
      setAccounts(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    };
    fetchAccounts();
  }, [user]);

  // Pay or receive a specific debt
  const handlePayOrReceive = (debt) => {
    setSelectedDebt(debt);
    setAccountModalVisible(true);
  };

  const handleAccountChoose = async (account) => {
    setAccountModalVisible(false);
    setPaying(true);

    try {
      // Mark debt as paid in Firestore
      const debtDocRef = doc(
        firestore,
        "users",
        user.uid,
        "friends",
        friendId,
        "debts",
        selectedDebt.id
      );
      await updateDoc(debtDocRef, { paid: true });

      // Update account balance
      const accountDocRef = doc(
        firestore,
        "users",
        user.uid,
        "accounts",
        account.id
      );
      if (type === "owe") {
        // You pay: subtract from your account
        await updateDoc(accountDocRef, {
          currentBalance: increment(-selectedDebt.amount),
        });
      } else {
        // Someone pays you: add to your account
        await updateDoc(accountDocRef, {
          currentBalance: increment(selectedDebt.amount),
        });
      }

      setSelectedDebt(null);
      Alert.alert(
        "Success",
        type === "owe" ? "Debt paid!" : "Payment received!"
      );
    } catch (err) {
      setSelectedDebt(null); // Keep the debt in UI if payment fails
      Alert.alert("Error", "Could not process payment.");
    }
    setPaying(false);
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  // View Details handler: Pass ALL debts for this friend and friend info
  const handleViewDetails = () => {
    navigation.navigate("DebtDetails", {
      friend: {
        avatar,
        name: friendName,
        email: friendEmail,
        id: friendId,
      },
      debts, // pass the full array!
    });
  };

  return (
    <ScreenWrapper backgroundColor={COLORS.white}>
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton onPress={handleBackPress} />
          <Text style={styles.title}>
            {type === "owe" ? "Pay Debts" : "Receive Payments"}
          </Text>
        </View>
        <Text style={styles.infoText}>
          {type === "owe"
            ? "Below are unpaid debts you owe to this contact. Tap to pay."
            : "Below are unpaid debts this contact owes you. Tap to receive."}
        </Text>
        {/* View Details Button (shows at the top for this friend) */}
        <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 8 }}>
          <TouchableOpacity
            onPress={handleViewDetails}
            style={{
              alignSelf: "flex-end",
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 8,
              backgroundColor: "#F3F4F6",
            }}
          >
            <Text style={{ color: "#174C3C", fontWeight: "bold" }}>
              View Details
            </Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator
            style={{ marginTop: 32 }}
            size="large"
            color={COLORS.primary}
          />
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {debts.length === 0 ? (
              <Text
                style={{ color: "#888", textAlign: "center", marginTop: 30 }}
              >
                No unpaid {type === "owe" ? "debts" : "credits"} for this
                contact!
              </Text>
            ) : (
              debts.map((debt) => (
                <View
                  key={debt.id}
                  style={{ marginBottom: SIZES.padding.medium }}
                >
                  <TouchableOpacity
                    disabled={paying}
                    onPress={() => handlePayOrReceive(debt)}
                  >
                    <FriendCard
                      avatar={avatar}
                      name={friendName}
                      email={friendEmail}
                      debtAmount={debt.amount}
                      dueDate={debt.dueDate}
                      youOwe={type === "owe"}
                    />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        )}

        {/* Account selection modal */}
        <Modal visible={accountModalVisible} transparent animationType="slide">
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View
              style={{
                backgroundColor: "#fff",
                padding: 24,
                borderRadius: 16,
                minWidth: 300,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  marginBottom: 12,
                }}
              >
                Select account{" "}
                {type === "owe" ? "to pay from" : "to receive to"}:
              </Text>
              {accounts.map((acc) => (
                <TouchableOpacity
                  key={acc.id}
                  style={{
                    padding: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#eee",
                  }}
                  onPress={() => handleAccountChoose(acc)}
                  disabled={paying}
                >
                  <Text style={{ fontSize: 16 }}>
                    {acc.title} (${Number(acc.currentBalance).toFixed(2)})
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => setAccountModalVisible(false)}
                disabled={paying}
              >
                <Text
                  style={{ color: "red", marginTop: 16, textAlign: "center" }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              {paying && (
                <ActivityIndicator
                  style={{ marginTop: 12 }}
                  color={COLORS.primary}
                />
              )}
            </View>
          </View>
        </Modal>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
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
    textAlign: "center",
    paddingRight: 40,
    color: COLORS.text,
    fontFamily: "Poppins-SemiBold",
  },
  infoText: {
    textAlign: "left",
    fontSize: SIZES.font.medium,
    color: COLORS.textSecondary,
    marginHorizontal: SIZES.padding.xxlarge,
    marginBottom: SIZES.padding.large,
    fontFamily: "Poppins-Regular",
  },
  scrollContainer: {
    paddingHorizontal: SIZES.padding.xlarge,
    paddingBottom: SIZES.padding.xxlarge,
  },
});

export default Debts;