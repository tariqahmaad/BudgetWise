import {
  auth,
  firestore,
  doc,
  collection,
  getDocs,
  deleteDoc,
} from "../firebase/firebaseConfig";
import { deleteUser } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const deleteUserAccount = async (user) => {
  if (!user) {
    throw new Error("No user provided");
  }

  try {
    console.log("Starting account deletion process...");

    // 1. Delete all user's subcollections and documents one by one
    const userDocRef = doc(firestore, "users", user.uid);

    // Delete accounts subcollection
    try {
      const accountsRef = collection(userDocRef, "accounts");
      const accountsSnapshot = await getDocs(accountsRef);
      console.log(`Found ${accountsSnapshot.docs.length} accounts to delete`);

      for (const accountDoc of accountsSnapshot.docs) {
        await deleteDoc(accountDoc.ref);
        console.log(`Deleted account: ${accountDoc.id}`);
      }
      console.log("All accounts deleted successfully");
    } catch (error) {
      console.log("No accounts to delete or error:", error.message);
    }

    // Delete categories subcollection
    try {
      const categoriesRef = collection(userDocRef, "categories");
      const categoriesSnapshot = await getDocs(categoriesRef);
      console.log(
        `Found ${categoriesSnapshot.docs.length} categories to delete`
      );

      for (const categoryDoc of categoriesSnapshot.docs) {
        await deleteDoc(categoryDoc.ref);
        console.log(`Deleted category: ${categoryDoc.id}`);
      }
      console.log("All categories deleted successfully");
    } catch (error) {
      console.log("No categories to delete or error:", error.message);
    }

    // Delete transactions subcollection
    try {
      const transactionsRef = collection(userDocRef, "transactions");
      const transactionsSnapshot = await getDocs(transactionsRef);
      console.log(
        `Found ${transactionsSnapshot.docs.length} transactions to delete`
      );

      for (const transactionDoc of transactionsSnapshot.docs) {
        await deleteDoc(transactionDoc.ref);
        console.log(`Deleted transaction: ${transactionDoc.id}`);
      }
      console.log("All transactions deleted successfully");
    } catch (error) {
      console.log("No transactions to delete or error:", error.message);
    }

    // Delete friends subcollection (if it exists)
    try {
      const friendsRef = collection(userDocRef, "friends");
      const friendsSnapshot = await getDocs(friendsRef);
      console.log(`Found ${friendsSnapshot.docs.length} friends to delete`);

      for (const friendDoc of friendsSnapshot.docs) {
        // Delete debts subcollection for each friend
        try {
          const debtsRef = collection(friendDoc.ref, "debts");
          const debtsSnapshot = await getDocs(debtsRef);
          console.log(
            `Found ${debtsSnapshot.docs.length} debts for friend ${friendDoc.id}`
          );

          for (const debtDoc of debtsSnapshot.docs) {
            await deleteDoc(debtDoc.ref);
            console.log(`Deleted debt: ${debtDoc.id}`);
          }
        } catch (debtError) {
          console.log("No debts to delete for friend:", debtError.message);
        }

        await deleteDoc(friendDoc.ref);
        console.log(`Deleted friend: ${friendDoc.id}`);
      }
      console.log("All friends deleted successfully");
    } catch (error) {
      console.log("No friends to delete or error:", error.message);
    }

    // Check for any other subcollections you might have
    // You can add more subcollections here if needed

    // 2. Delete the main user document
    try {
      await deleteDoc(userDocRef);
      console.log("Main user document deleted successfully");
    } catch (error) {
      console.log("Error deleting user document:", error.message);
      // Don't throw here, continue with cleanup
    }

    // 3. Clear local storage
    try {
      await AsyncStorage.clear();
      console.log("Local storage cleared successfully");
    } catch (error) {
      console.log("Error clearing local storage:", error.message);
      // Don't throw here, continue with account deletion
    }

    // 4. Delete the authentication account (this must be last)
    await deleteUser(user);
    console.log("Authentication account deleted successfully");

    return { success: true };
  } catch (error) {
    console.error("Error deleting account:", error);
    throw error;
  }
};

export const clearCorruptAvatarData = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    console.log("Starting corrupt data cleanup...");

    // Clear corrupt cache
    const cacheKey = `@budgetwise_user_${user.uid}`;
    await AsyncStorage.removeItem(cacheKey);
    console.log("Cleared user cache");

    // Check and fix Firebase data
    const { getDoc, updateDoc } = await import("../firebase/firebaseConfig");
    const userDoc = await getDoc(doc(firestore, "users", user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      if (data.avatar && typeof data.avatar !== "string") {
        console.log(
          "Fixing corrupt avatar data in Firebase, current type:",
          typeof data.avatar
        );
        await updateDoc(doc(firestore, "users", user.uid), {
          avatar: null,
          updatedAt: new Date(),
        });
        console.log("Fixed corrupt avatar data in Firebase");
      }
    }

    console.log("Corrupt data cleanup completed");
    return true;
  } catch (error) {
    console.error("Error during cleanup:", error);
    return false;
  }
};
