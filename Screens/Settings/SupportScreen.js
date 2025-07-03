import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Linking,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BackButton from "../../Components/Buttons/BackButton";
import ScreenWrapper from "../../Components/ScreenWrapper";
import { COLORS, SIZES } from "../../constants/theme";

const SupportScreen = ({ navigation }) => {
  const handleEmailPress = () => {
    Linking.openURL("mailto:tariq_muzamil@live.com");
  };

  const handleFAQPress = () => {
    // Navigate to FAQ or show expandable FAQ section
    Alert.alert("FAQ", "Coming soon - Frequently Asked Questions");
  };

  const handleReportBugPress = () => {
    const subject = "Bug Report - BudgetWise";
    const body = "Please describe the issue you encountered:\n\n";
    Linking.openURL(
      `mailto:tariq_muzamil@live.com?subject=${subject}&body=${body}`
    );
  };

  const SupportOption = ({ icon, iconColor, title, subtitle, onPress }) => (
    <TouchableOpacity style={styles.supportOption} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward-outline" size={20} color="#C7C7CC" />
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper backgroundColor={COLORS.white}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.leftContainer}>
            <BackButton onPress={() => navigation.goBack()} />
          </View>
          <View style={styles.centerContainer}>
            <Text style={styles.headerTitle}>Help & Support</Text>
          </View>
          <View style={styles.rightContainer} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Quick Help */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Help</Text>
            <SupportOption
              icon="help-circle-outline"
              iconColor="#007AFF"
              title="FAQ"
              subtitle="Common questions and answers"
              onPress={handleFAQPress}
            />
            <SupportOption
              icon="document-text-outline"
              iconColor="#8E8E93"
              title="Privacy Policy"
              subtitle="How we protect your data"
              onPress={() => navigation.navigate("PrivacyPolicy")}
            />
          </View>

          {/* Contact Us */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Us</Text>
            <SupportOption
              icon="mail-outline"
              iconColor="#34C759"
              title="Email Support"
              subtitle="Get help via email"
              onPress={handleEmailPress}
            />
            <SupportOption
              icon="bug-outline"
              iconColor="#FF3B30"
              title="Report a Bug"
              subtitle="Found an issue? Let us know"
              onPress={handleReportBugPress}
            />
            <SupportOption
              icon="people-outline"
              iconColor="#FF9500"
              title="About the Team"
              subtitle="Meet the creators of BudgetWise"
              onPress={() => navigation.navigate("About")}
            />
          </View>

          {/* App Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>BudgetWise</Text>
            <Text style={styles.infoSubtitle}>
              Personal Finance Made Simple
            </Text>
            <Text style={styles.infoVersion}>Version 1.0.0</Text>
          </View>
        </ScrollView>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
    marginBottom: 16,
  },
  supportOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#000",
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: "#8E8E93",
  },
  infoContainer: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#8E8E93",
    marginBottom: 8,
  },
  infoVersion: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#C7C7CC",
  },
});

export default SupportScreen;
