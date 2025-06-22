import { auth, firestore, doc, updateDoc, getDoc } from '../firebase/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveAvatarToFirebase = async (base64Image) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    // Save to Firestore
    await updateDoc(doc(firestore, 'users', user.uid), {
      avatar: base64Image,
      updatedAt: new Date(),
    });

    // Cache locally
    await AsyncStorage.setItem(`@budgetwise_avatar_${user.uid}`, base64Image);

    return true;
  } catch (error) {
    console.error('Error saving avatar:', error);
    throw error;
  }
};

export const getAvatarFromFirebase = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    // Try to get from cache first
    const cachedAvatar = await AsyncStorage.getItem(`@budgetwise_avatar_${user.uid}`);
    if (cachedAvatar) {
      return cachedAvatar;
    }

    // Get from Firestore
    const userDoc = await getDoc(doc(firestore, 'users', user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      if (data.avatar) {
        // Cache it
        await AsyncStorage.setItem(`@budgetwise_avatar_${user.uid}`, data.avatar);
        return data.avatar;
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting avatar:', error);
    return null;
  }
};

export const removeAvatar = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    // Remove from Firestore
    await updateDoc(doc(firestore, 'users', user.uid), {
      avatar: null,
      updatedAt: new Date(),
    });

    // Remove from cache
    await AsyncStorage.removeItem(`@budgetwise_avatar_${user.uid}`);

    return true;
  } catch (error) {
    console.error('Error removing avatar:', error);
    throw error;
  }
};

// Function to get Gmail/Google avatar
export const getGmailAvatar = async (email) => {
  try {
    // Try multiple sources for profile pictures
    const sources = [
      `https://www.gravatar.com/avatar/${await hashEmail(email)}?d=404&s=400`,
      // You can add more sources here
    ];

    for (const url of sources) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const blob = await response.blob();
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        }
      } catch (error) {
        console.log(`Failed to fetch from ${url}:`, error);
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting Gmail avatar:', error);
    return null;
  }
};

const hashEmail = async (email) => {
  // You'll need to install a crypto library or use a simple hash function
  // For now, using a simple implementation
  const crypto = require('crypto');
  return crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
};