import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Animated,
  Easing,
  TextInput,
  ActivityIndicator,
  Image,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { COLORS, SIZES } from "../constants/theme";
import ScreenWrapper from "../Components/ScreenWrapper";
import CustomButton from "../Components/Buttons/CustomButton";
import {
  auth,
  firestore,
  doc,
  updateDoc,
  setDoc,
  getDoc,
} from "../firebase/firebaseConfig";
import { compressImage, validateImageSize } from "../utils/imageCompression";
import CurrencyPickerModal from "../Components/Exchange/CurrencyPickerModal";
import { getCurrencyByCode } from "../constants/currencies";
import { useCurrency } from "../contexts/CurrencyContext";

const { width: screenWidth } = Dimensions.get("window");

const ProfileSetupPage = () => {
  const navigation = useNavigation();
  const { setCurrency, changeCurrency } = useCurrency();
  const user = auth.currentUser;

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  // Form state - initialize with user data (removed selectedCurrency)
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    avatar: null,
    currencyPreference: "USD", // Changed from selectedCurrency to currencyPreference
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});

  // Load user data from Firestore on component mount
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(firestore, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFormData((prev) => ({
            ...prev,
            name: userData.name || "",
            surname: userData.surname || "",
            avatar: userData.avatar || null, // Load existing avatar if it exists
            currencyPreference: userData.currencyPreference || "USD", // Load existing currency preference
          }));
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    loadUserData();
  }, [user]);

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Image picker functions
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "We need camera roll permissions to set your profile picture.",
        [{ text: "OK" }]
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    Alert.alert(
      "Select Photo",
      "Choose how you would like to select your profile picture",
      [
        { text: "Camera", onPress: () => openCamera() },
        { text: "Photo Library", onPress: () => openImageLibrary() },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Camera permission is required to take photos."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      await processImage(result.assets[0]);
    }
  };

  const openImageLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      await processImage(result.assets[0]);
    }
  };

  const processImage = async (imageAsset) => {
    if (!imageAsset.uri) return;

    setIsUploadingImage(true);
    try {
      console.log("🚀 Processing profile image...");

      // Compress the image to 500KB max
      const compressed = await compressImage(imageAsset.uri, 500, 800, 800);

      if (!compressed || !compressed.base64) {
        throw new Error("Failed to compress image");
      }

      // Validate the compressed image size
      if (!validateImageSize(compressed.base64, 500)) {
        Alert.alert(
          "Image Too Large",
          "The image is still too large after compression. Please try a smaller image."
        );
        return;
      }

      const base64Image = `data:image/jpeg;base64,${compressed.base64}`;

      // Update form data
      setFormData((prev) => ({
        ...prev,
        avatar: base64Image,
      }));

      console.log("✅ Profile image processed successfully!");
    } catch (error) {
      console.error("❌ Error processing image:", error);
      Alert.alert(
        "Error",
        "Failed to process profile picture. Please try again."
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeProfilePicture = () => {
    setFormData((prev) => ({
      ...prev,
      avatar: null,
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.name.trim()) {
        newErrors.name = "First name is required";
      }
      if (!formData.surname.trim()) {
        newErrors.surname = "Last name is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep(1)) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) {
      Alert.alert("Error", "No user found. Please try signing up again.");
      return;
    }

    setIsLoading(true);
    try {
      // Save user profile data to Firestore
      await setDoc(
        doc(firestore, "users", user.uid),
        {
          name: formData.name.trim(),
          surname: formData.surname.trim(),
          email: user.email,
          avatar: formData.avatar,
          currencyPreference: formData.currencyPreference, // Changed from selectedCurrency
          profileSetupComplete: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { merge: true }
      );

      // Set currency in context using changeCurrency
      const success = await changeCurrency(formData.currencyPreference); // Changed from selectedCurrency
      if (!success) {
        console.warn("Failed to set currency, but continuing...");
      }

      console.log("✅ Profile setup completed successfully!");

      // Force navigation to HomeScreen
      navigation.reset({
        index: 0,
        routes: [{ name: "HomeScreen" }],
      });
    } catch (error) {
      console.error("❌ Error completing profile setup:", error);
      Alert.alert(
        "Error",
        "Failed to complete profile setup. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={styles.stepContainer}>
        <View style={[styles.step, currentStep >= 1 && styles.stepActive]}>
          <Text
            style={[styles.stepText, currentStep >= 1 && styles.stepTextActive]}
          >
            1
          </Text>
        </View>
        <View
          style={[styles.stepLine, currentStep > 1 && styles.stepLineActive]}
        />
        <View style={[styles.step, currentStep >= 2 && styles.stepActive]}>
          <Text
            style={[styles.stepText, currentStep >= 2 && styles.stepTextActive]}
          >
            2
          </Text>
        </View>
        <View
          style={[styles.stepLine, currentStep > 2 && styles.stepLineActive]}
        />
        <View style={[styles.step, currentStep >= 3 && styles.stepActive]}>
          <Text
            style={[styles.stepText, currentStep >= 3 && styles.stepTextActive]}
          >
            3
          </Text>
        </View>
      </View>
      <View style={styles.stepLabels}>
        <Text style={styles.stepLabel}>Profile</Text>
        <Text style={styles.stepLabel}>Currency</Text>
        <Text style={styles.stepLabel}>Complete</Text>
      </View>
    </View>
  );

  const renderProfileStep = () => (
    <Animated.View
      style={[
        styles.stepContent,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Set Up Your Profile</Text>
        <Text style={styles.welcomeSubtitle}>
          Let's personalize your BudgetWise experience
        </Text>
      </View>

      {/* Profile Picture Section */}
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity
            onPress={pickImage}
            style={styles.avatarTouchable}
            disabled={isUploadingImage}
          >
            {formData.avatar ? (
              <Image source={{ uri: formData.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={40} color="#6B7280" />
              </View>
            )}

            {/* Camera Icon Overlay */}
            <View style={styles.cameraIconContainer}>
              {isUploadingImage ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Ionicons name="camera" size={16} color={COLORS.white} />
              )}
            </View>
          </TouchableOpacity>

          {/* Remove Picture Button */}
          {formData.avatar && (
            <TouchableOpacity
              onPress={removeProfilePicture}
              style={styles.removePictureButton}
              disabled={isUploadingImage}
            >
              <Text style={styles.removePictureText}>Remove Picture</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.avatarHint}>
            Add a profile picture (optional)
          </Text>
        </View>
      </View>

      {/* Name Fields */}
      <View style={styles.formSection}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>First Name *</Text>
          <TextInput
            style={[styles.textInput, errors.name && styles.textInputError]}
            value={formData.name}
            onChangeText={(value) => handleInputChange("name", value)}
            placeholder="Enter your first name"
            placeholderTextColor={COLORS.textSecondary}
            autoCorrect={false}
            autoCapitalize="words"
            returnKeyType="next"
          />
          {errors.name ? (
            <Text style={styles.errorText}>{errors.name}</Text>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Last Name *</Text>
          <TextInput
            style={[styles.textInput, errors.surname && styles.textInputError]}
            value={formData.surname}
            onChangeText={(value) => handleInputChange("surname", value)}
            placeholder="Enter your last name"
            placeholderTextColor={COLORS.textSecondary}
            autoCorrect={false}
            autoCapitalize="words"
            returnKeyType="done"
          />
          {errors.surname ? (
            <Text style={styles.errorText}>{errors.surname}</Text>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );

  const renderCurrencyStep = () => {
    const selectedCurrencyInfo = getCurrencyByCode(formData.currencyPreference); // Changed from selectedCurrency

    return (
      <Animated.View
        style={[
          styles.stepContent,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Choose Your Currency</Text>
          <Text style={styles.welcomeSubtitle}>
            Select your preferred currency for the app
          </Text>
        </View>

        <View style={styles.currencySection}>
          <TouchableOpacity
            style={styles.currencySelector}
            onPress={() => setShowCurrencyPicker(true)}
          >
            <View style={styles.currencyInfo}>
              <Text style={styles.currencyFlag}>
                {selectedCurrencyInfo.flag}
              </Text>
              <View style={styles.currencyTextContainer}>
                <Text style={styles.currencyCode}>
                  {formData.currencyPreference}{" "}
                  {/* Changed from selectedCurrency */}
                </Text>
                <Text style={styles.currencyName}>
                  {selectedCurrencyInfo.name}
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>

          <Text style={styles.currencyHint}>
            You can change this later in settings
          </Text>
        </View>

        <CurrencyPickerModal
          visible={showCurrencyPicker}
          onClose={() => setShowCurrencyPicker(false)}
          onSelect={(currencyCode) => {
            setFormData((prev) => ({
              ...prev,
              currencyPreference: currencyCode, // Changed from selectedCurrency
            }));
            setShowCurrencyPicker(false);
          }}
          selectedCurrency={formData.currencyPreference} // Changed from selectedCurrency
        />
      </Animated.View>
    );
  };

  const renderCompleteStep = () => (
    <Animated.View
      style={[
        styles.stepContent,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.welcomeSection}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={80} color={COLORS.primary} />
        </View>
        <Text style={styles.welcomeTitle}>You're All Set!</Text>
        <Text style={styles.welcomeSubtitle}>
          Your profile has been created successfully. Welcome to BudgetWise!
        </Text>
      </View>

      {/* Profile Summary */}
      <View style={styles.summarySection}>
        <View style={styles.summaryItem}>
          <View style={styles.summaryAvatarContainer}>
            {formData.avatar ? (
              <Image
                source={{ uri: formData.avatar }}
                style={styles.summaryAvatar}
              />
            ) : (
              <View style={[styles.summaryAvatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={20} color="#6B7280" />
              </View>
            )}
          </View>
          <Text style={styles.summaryName}>
            {formData.name} {formData.surname}
          </Text>
        </View>

        <View style={styles.summaryDetails}>
          <View style={styles.summaryDetailItem}>
            <Ionicons
              name="mail-outline"
              size={16}
              color={COLORS.textSecondary}
            />
            <Text style={styles.summaryDetailText}>{user?.email}</Text>
          </View>
          <View style={styles.summaryDetailItem}>
            <Ionicons
              name="card-outline"
              size={16}
              color={COLORS.textSecondary}
            />
            <Text style={styles.summaryDetailText}>
              {getCurrencyByCode(formData.currencyPreference).name}{" "}
              {/* Changed from selectedCurrency */}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderProfileStep();
      case 2:
        return renderCurrencyStep();
      case 3:
        return renderCompleteStep();
      default:
        return renderProfileStep();
    }
  };

  const isStepValid = () => {
    if (currentStep === 1) {
      return formData.name.trim() && formData.surname.trim();
    }
    return true;
  };

  return (
    <ScreenWrapper backgroundColor={COLORS.white}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            {currentStep > 1 && currentStep < 3 && (
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color={COLORS.text} />
              </TouchableOpacity>
            )}
            <Text style={styles.headerTitle}>Profile Setup</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        {/* Step Indicator */}
        {renderStepIndicator()}

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderCurrentStep()}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {currentStep < 3 ? (
            <CustomButton
              title={currentStep === 2 ? "Continue" : "Next"}
              onPress={handleNext}
              disabled={!isStepValid() || isUploadingImage}
              style={styles.actionButton}
            />
          ) : (
            <CustomButton
              title="Get Started"
              onPress={handleComplete}
              loading={isLoading}
              disabled={isLoading}
              style={styles.actionButton}
            />
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingHorizontal: SIZES.padding.xxlarge,
    paddingVertical: SIZES.padding.large,
    backgroundColor: COLORS.white,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    color: COLORS.text,
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  stepIndicator: {
    paddingHorizontal: SIZES.padding.xxlarge,
    paddingVertical: SIZES.padding.large,
    backgroundColor: COLORS.white,
  },
  stepContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  step: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5E5EA",
    justifyContent: "center",
    alignItems: "center",
  },
  stepActive: {
    backgroundColor: COLORS.primary,
  },
  stepText: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#8E8E93",
  },
  stepTextActive: {
    color: COLORS.white,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#E5E5EA",
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: COLORS.primary,
  },
  stepLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stepLabel: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    color: "#8E8E93",
    textAlign: "center",
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SIZES.padding.xxlarge,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  stepContent: {
    flex: 1,
  },
  welcomeSection: {
    alignItems: "center",
    marginVertical: SIZES.padding.xxxxlarge,
  },
  welcomeTitle: {
    fontSize: SIZES.font.xxlarge,
    fontFamily: "Poppins-Bold",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: SIZES.padding.medium,
  },
  welcomeSubtitle: {
    fontSize: SIZES.font.medium,
    fontFamily: "Poppins-Regular",
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: SIZES.padding.xxxxlarge,
  },
  avatarContainer: {
    alignItems: "center",
  },
  avatarTouchable: {
    position: "relative",
    marginBottom: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  removePictureButton: {
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  removePictureText: {
    fontSize: 14,
    color: "#FF3B30",
    fontFamily: "Poppins-Medium",
  },
  avatarHint: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
  formSection: {
    marginBottom: SIZES.padding.xxxxlarge,
  },
  inputGroup: {
    marginBottom: SIZES.padding.large,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: COLORS.text,
    marginBottom: 8,
  },
  textInput: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: COLORS.text,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  textInputError: {
    borderColor: COLORS.error,
    backgroundColor: "#FFF5F5",
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    color: COLORS.error,
    marginTop: 4,
  },
  currencySection: {
    marginBottom: SIZES.padding.xxxxlarge,
  },
  currencySelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  currencyInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  currencyFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  currencyTextContainer: {
    flex: 1,
  },
  currencyCode: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: COLORS.text,
  },
  currencyName: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  currencyHint: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: COLORS.textSecondary,
    marginTop: 12,
    textAlign: "center",
  },
  successIcon: {
    marginBottom: SIZES.padding.large,
  },
  summarySection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SIZES.padding.xlarge,
    marginBottom: SIZES.padding.xxxxlarge,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryItem: {
    alignItems: "center",
    marginBottom: SIZES.padding.large,
  },
  summaryAvatarContainer: {
    marginBottom: 8,
  },
  summaryAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  summaryName: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: COLORS.text,
  },
  summaryDetails: {
    gap: 12,
  },
  summaryDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  summaryDetailText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: COLORS.textSecondary,
    marginLeft: 12,
  },
  actionContainer: {
    paddingHorizontal: SIZES.padding.xxlarge,
    paddingVertical: SIZES.padding.large,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  actionButton: {
    marginBottom: 0,
  },
});

export default ProfileSetupPage;
