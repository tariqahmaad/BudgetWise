import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Alert, 
  StyleSheet, 
  Modal, 
  ActivityIndicator 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

const ProfileImagePicker = ({ onImageSelected, isVisible, onClose }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera roll permissions to upload a profile picture.'
      );
      return false;
    }
    return true;
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera permissions to take a profile picture.'
      );
      return false;
    }
    return true;
  };

  const processImage = async (imageUri) => {
    try {
      setIsProcessing(true);
      
      // First, resize and crop the image to a square
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { resize: { width: 400, height: 400 } },
          // You can add crop here if needed
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      // Convert to base64 data URL for storage
      const base64Image = `data:image/jpeg;base64,${manipulatedImage.base64}`;
      
      onImageSelected(base64Image);
      onClose();
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('Error', 'Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const pickImageFromGallery = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const fetchGmailAvatar = async (email) => {
    try {
      setIsProcessing(true);
      
      // Try to get Gmail/Google avatar
      const avatarUrl = `https://www.gravatar.com/avatar/${await hashEmail(email)}?d=404&s=400`;
      
      // Check if the avatar exists
      const response = await fetch(avatarUrl);
      if (response.ok) {
        // Convert to base64
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          onImageSelected(reader.result);
          onClose();
          setIsProcessing(false);
        };
        reader.readAsDataURL(blob);
      } else {
        // Try Google profile picture
        const googleAvatarUrl = `https://lh3.googleusercontent.com/a/default-user=s400-c`;
        const googleResponse = await fetch(googleAvatarUrl);
        if (googleResponse.ok) {
          const blob = await googleResponse.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            onImageSelected(reader.result);
            onClose();
            setIsProcessing(false);
          };
          reader.readAsDataURL(blob);
        } else {
          Alert.alert('Not Found', 'No profile picture found for this email address.');
          setIsProcessing(false);
        }
      }
    } catch (error) {
      console.error('Error fetching Gmail avatar:', error);
      Alert.alert('Error', 'Failed to fetch profile picture from email.');
      setIsProcessing(false);
    }
  };

  const hashEmail = async (email) => {
    // Simple MD5-like hash for Gravatar (you might want to use a proper crypto library)
    const crypto = require('crypto');
    return crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Update Profile Picture</Text>
          
          {isProcessing && (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.processingText}>Processing image...</Text>
            </View>
          )}
          
          {!isProcessing && (
            <>
              <TouchableOpacity style={styles.optionButton} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
                <Text style={styles.optionText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionButton} onPress={pickImageFromGallery}>
                <Ionicons name="images-outline" size={24} color={COLORS.primary} />
                <Text style={styles.optionText}>Choose from Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionButton} onPress={() => fetchGmailAvatar('user@gmail.com')}>
                <Ionicons name="mail-outline" size={24} color={COLORS.primary} />
                <Text style={styles.optionText}>Use Email Avatar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 350,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 25,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: COLORS.text,
    marginLeft: 15,
  },
  cancelButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: COLORS.textSecondary,
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  processingText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: COLORS.text,
    marginTop: 15,
  },
});

export default ProfileImagePicker;