import { firestore, collection, onSnapshot, query, where } from "../firebase/firebaseConfig";

export const subscribeToMonthlyExpenses = (userId, month, onSuccess, onError) => {
  const transactionsRef = collection(firestore, "users", userId, "transactions");
  const expenseQuery = query(transactionsRef, where("type", "==", "Expenses"));

  return onSnapshot(
    expenseQuery,
    (snapshot) => {
      const allExpenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      onSuccess(allExpenses);
    },
    (error) => {
      console.error("Firestore error:", error);
      onError(error);
    }
  );
};
