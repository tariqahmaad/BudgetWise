import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  auth,
  firestore,
  doc,
  getDoc,
  updateDoc,
} from "../firebase/firebaseConfig";

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
