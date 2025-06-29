import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BackButton from "../../Components/Buttons/BackButton";
import ScreenWrapper from "../../Components/ScreenWrapper";
import { COLORS, SIZES } from "../../constants/theme";
import { FAQ_SECTIONS } from "../../constants/diagrams";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const FAQScreen = ({ navigation }) => {
  const [expandedSections, setExpandedSections] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const openImageModal = (image, title, description) => {
    setSelectedImage({ image, title, description });
    setImageModalVisible(true);
  };

  const closeImageModal = () => {
    setImageModalVisible(false);
    setSelectedImage(null);
  };

  const DiagramCard = ({ diagram }) => (
    <TouchableOpacity
      style={styles.diagramCard}
      onPress={() =>
        openImageModal(diagram.image, diagram.title, diagram.description)
      }
    >
      <View style={styles.diagramImageContainer}>
        <Image
          source={diagram.image}
          style={styles.diagramThumbnail}
          resizeMode="contain"
        />
        <View style={styles.zoomIconContainer}>
          <Ionicons name="expand-outline" size={16} color="#FFF" />
        </View>
      </View>
      <View style={styles.diagramInfo}>
        <Text style={styles.diagramTitle}>{diagram.title}</Text>
        <Text style={styles.diagramDescription}>{diagram.description}</Text>
      </View>
    </TouchableOpacity>
  );

  const FAQSection = ({ section }) => {
    const isExpanded = expandedSections[section.id];

    return (
      <View style={styles.sectionContainer}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(section.id)}
        >
          <View style={styles.sectionHeaderContent}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionDescription}>{section.description}</Text>
          </View>
          <Ionicons
            name={isExpanded ? "chevron-up-outline" : "chevron-down-outline"}
            size={20}
            color="#8E8E93"
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.sectionContent}>
            {section.diagrams.map((diagram) => (
              <DiagramCard key={diagram.id} diagram={diagram} />
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScreenWrapper backgroundColor={COLORS.white}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.leftContainer}>
            <BackButton onPress={() => navigation.goBack()} />
          </View>
          <View style={styles.centerContainer}>
            <Text style={styles.headerTitle}>FAQ & Documentation</Text>
          </View>
          <View style={styles.rightContainer} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Introduction */}
          <View style={styles.introContainer}>
            <Text style={styles.introTitle}>System Documentation</Text>
            <Text style={styles.introText}>
              Explore BudgetWise's architecture and understand how the app
              works. Tap on any section below to view detailed diagrams and
              documentation.
            </Text>
          </View>

          {/* FAQ Sections */}
          {FAQ_SECTIONS.map((section) => (
            <FAQSection key={section.id} section={section} />
          ))}

          {/* Additional Info */}
          <View style={styles.additionalInfo}>
            <Text style={styles.additionalInfoTitle}>Need More Help?</Text>
            <Text style={styles.additionalInfoText}>
              If you can't find what you're looking for, feel free to contact
              our support team.
            </Text>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => navigation.navigate("Support")}
            >
              <Ionicons name="mail-outline" size={16} color="#FFF" />
              <Text style={styles.contactButtonText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Image Modal */}
        <Modal
          visible={imageModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={closeImageModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderInfo}>
                  <Text style={styles.modalTitle}>{selectedImage?.title}</Text>
                  <Text style={styles.modalDescription}>
                    {selectedImage?.description}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeImageModal}
                >
                  <Ionicons name="close-outline" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.modalImageContainer}
                contentContainerStyle={styles.modalImageContent}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                maximumZoomScale={3}
                minimumZoomScale={1}
              >
                {selectedImage && (
                  <Image
                    source={selectedImage.image}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
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
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingHorizontal: SIZES.padding.xxlarge,
    paddingVertical: SIZES.padding.large,
    backgroundColor: COLORS.white,
  },
  leftContainer: {
    flex: 1,
    alignItems: "flex-start",
  },
  centerContainer: {
    flex: 4,
    alignItems: "center",
  },
  rightContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContentContainer: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  introContainer: {
    backgroundColor: "#F8F9FA",
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#8E8E93",
    lineHeight: 20,
  },
  sectionContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FAFAFA",
  },
  sectionHeaderContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: "#8E8E93",
  },
  sectionContent: {
    padding: 16,
    paddingTop: 0,
  },
  diagramCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E5E7",
    overflow: "hidden",
  },
  diagramImageContainer: {
    position: "relative",
    height: 150,
    backgroundColor: "#F8F9FA",
  },
  diagramThumbnail: {
    width: "100%",
    height: "100%",
  },
  zoomIconContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  diagramInfo: {
    padding: 12,
  },
  diagramTitle: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
    marginBottom: 4,
  },
  diagramDescription: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#8E8E93",
    lineHeight: 16,
  },
  additionalInfo: {
    backgroundColor: "#F8F9FA",
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    alignItems: "center",
  },
  additionalInfoTitle: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
    marginBottom: 8,
  },
  additionalInfoText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#8E8E93",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  contactButtonText: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#FFF",
    marginLeft: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: screenWidth * 0.95,
    height: screenHeight * 0.9,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    borderRadius: 12,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  modalHeaderInfo: {
    flex: 1,
    marginRight: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFF",
    marginBottom: 4,
  },
  modalDescription: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#CCCCCC",
    lineHeight: 16,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalImageContainer: {
    flex: 1,
  },
  modalImageContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: screenWidth * 0.9,
    height: screenHeight * 0.7,
  },
});

export default FAQScreen;
