import {
  firestore,
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
  deleteDoc,
  doc
} from "../firebase/firebaseConfig";

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

/**
 * Cleans up categories that have no associated expense transactions
 * This function is called after transaction deletions or category changes
 * to automatically remove empty categories from Firebase
 * 
 * @param {string} userId - The user's ID
 * @param {string[]} categoriesToCheck - Optional array of specific category names to check
 * @returns {Promise<string[]>} - Array of deleted category IDs
 */
export const cleanupEmptyCategories = async (userId, categoriesToCheck = null) => {
  if (!userId) {
    console.warn("[Category Cleanup] No user ID provided");
    return [];
  }

  try {
    console.log("[Category Cleanup] Starting cleanup for user:", userId);

    // Get all categories for this user
    const categoriesRef = collection(firestore, "users", userId, "categories");
    const categoriesSnapshot = await getDocs(categoriesRef);

    if (categoriesSnapshot.empty) {
      console.log("[Category Cleanup] No categories found");
      return [];
    }

    // Get all expense transactions for this user
    const transactionsRef = collection(firestore, "users", userId, "transactions");
    const expenseQuery = query(transactionsRef, where("type", "==", "Expenses"));
    const transactionsSnapshot = await getDocs(expenseQuery);

    // Create a set of categories that have transactions
    const categoriesWithTransactions = new Set();
    transactionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.category) {
        categoriesWithTransactions.add(data.category);
      }
    });

    console.log("[Category Cleanup] Categories with transactions:", Array.from(categoriesWithTransactions));

    // Find categories to delete
    const categoriesToDelete = [];
    const deletedCategoryIds = [];

    categoriesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const categoryName = data.name || data.Category || data.label;

      if (!categoryName) {
        console.warn("[Category Cleanup] Category with no name found:", doc.id);
        return;
      }

      // If specific categories to check are provided, only check those
      if (categoriesToCheck && categoriesToCheck.length > 0) {
        const shouldCheck = categoriesToCheck.some(checkCategory =>
          categoryName.toLowerCase() === checkCategory.toLowerCase()
        );
        if (!shouldCheck) return;
      }

      // Check if this category has any transactions
      if (!categoriesWithTransactions.has(categoryName)) {
        categoriesToDelete.push({
          id: doc.id,
          name: categoryName
        });
      }
    });

    console.log("[Category Cleanup] Categories to delete:", categoriesToDelete.map(c => c.name));

    // Delete empty categories
    for (const category of categoriesToDelete) {
      try {
        await deleteDoc(doc(firestore, "users", userId, "categories", category.id));
        deletedCategoryIds.push(category.id);
        console.log("[Category Cleanup] Deleted empty category:", category.name);
      } catch (error) {
        console.error("[Category Cleanup] Error deleting category:", category.name, error);
      }
    }

    if (deletedCategoryIds.length > 0) {
      console.log(`[Category Cleanup] Successfully deleted ${deletedCategoryIds.length} empty categories`);
    } else {
      console.log("[Category Cleanup] No empty categories found to delete");
    }

    return deletedCategoryIds;

  } catch (error) {
    console.error("[Category Cleanup] Error during cleanup:", error);
    return [];
  }
};

/**
 * Checks if a specific category has any associated expense transactions
 * 
 * @param {string} userId - The user's ID
 * @param {string} categoryName - The category name to check
 * @returns {Promise<boolean>} - True if category has transactions, false if empty
 */
export const checkCategoryHasTransactions = async (userId, categoryName) => {
  if (!userId || !categoryName) {
    return false;
  }

  try {
    const transactionsRef = collection(firestore, "users", userId, "transactions");
    const categoryQuery = query(
      transactionsRef,
      where("type", "==", "Expenses"),
      where("category", "==", categoryName)
    );

    const snapshot = await getDocs(categoryQuery);
    return !snapshot.empty;

  } catch (error) {
    console.error("[Category Check] Error checking category transactions:", error);
    return false; // Err on the side of caution - don't delete if we can't check
  }
};
