import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Linking,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BackButton from "../../Components/Buttons/BackButton";
import ScreenWrapper from "../../Components/ScreenWrapper";
import { COLORS, SIZES } from "../../constants/theme";

const PrivacyPolicyScreen = ({ navigation }) => {
  const handleEmailPress = () => {
    Linking.openURL("mailto:support@budgetwise.com");
  };

  const PolicySection = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const PolicyText = ({ children }) => (
    <Text style={styles.policyText}>{children}</Text>
  );

  const BulletPoint = ({ children }) => (
    <View style={styles.bulletContainer}>
      <Text style={styles.bullet}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
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
            <Text style={styles.headerTitle}>Privacy Policy</Text>
          </View>
          <View style={styles.rightContainer} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Last Updated */}
          <View style={styles.updateContainer}>
            <Text style={styles.lastUpdated}>Last updated: June 2, 2025</Text>
          </View>

          {/* Introduction */}
          <PolicySection title="Introduction">
            <PolicyText>
              BudgetWise ("we," "our," or "us") is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard 
              your information when you use our mobile application and services.
            </PolicyText>
            <PolicyText>
              By using BudgetWise, you agree to the collection and use of information 
              in accordance with this Privacy Policy.
            </PolicyText>
          </PolicySection>

          {/* Information We Collect */}
          <PolicySection title="Information We Collect">
            <Text style={styles.subsectionTitle}>Personal Information</Text>
            <PolicyText>
              We may collect the following personal information:
            </PolicyText>
            <BulletPoint>Email address for account creation and authentication</BulletPoint>
            <BulletPoint>Profile information you choose to provide</BulletPoint>
            <BulletPoint>Account names and balances you enter</BulletPoint>
            <BulletPoint>Transaction data you input into the app</BulletPoint>

            <Text style={styles.subsectionTitle}>Automatically Collected Information</Text>
            <BulletPoint>Device information (model, operating system, unique identifiers)</BulletPoint>
            <BulletPoint>App usage data and analytics</BulletPoint>
            <BulletPoint>Crash reports and error logs</BulletPoint>
          </PolicySection>

          {/* How We Use Your Information */}
          <PolicySection title="How We Use Your Information">
            <PolicyText>
              We use your information to:
            </PolicyText>
            <BulletPoint>Provide and maintain our services</BulletPoint>
            <BulletPoint>Process your transactions and manage your accounts</BulletPoint>
            <BulletPoint>Send you important updates and notifications</BulletPoint>
            <BulletPoint>Improve our app's functionality and user experience</BulletPoint>
            <BulletPoint>Provide customer support</BulletPoint>
            <BulletPoint>Ensure security and prevent fraud</BulletPoint>
          </PolicySection>

          {/* Data Storage and Security */}
          <PolicySection title="Data Storage and Security">
            <PolicyText>
              Your data is stored securely using Firebase, Google's cloud platform. 
              We implement industry-standard security measures including:
            </PolicyText>
            <BulletPoint>Encryption of data in transit and at rest</BulletPoint>
            <BulletPoint>Secure authentication protocols</BulletPoint>
            <BulletPoint>Regular security audits and updates</BulletPoint>
            <BulletPoint>Access controls and monitoring</BulletPoint>
            
            <PolicyText>
              While we strive to protect your personal information, no method of 
              transmission over the internet is 100% secure. We cannot guarantee 
              absolute security.
            </PolicyText>
          </PolicySection>

          {/* Data Sharing */}
          <PolicySection title="Information Sharing">
            <PolicyText>
              We do not sell, trade, or rent your personal information to third parties. 
              We may share your information only in the following circumstances:
            </PolicyText>
            <BulletPoint>With your explicit consent</BulletPoint>
            <BulletPoint>To comply with legal obligations</BulletPoint>
            <BulletPoint>To protect our rights and prevent fraud</BulletPoint>
            <BulletPoint>With service providers who assist in app operations (subject to confidentiality agreements)</BulletPoint>
          </PolicySection>

          {/* Your Rights */}
          <PolicySection title="Your Rights">
            <PolicyText>
              You have the right to:
            </PolicyText>
            <BulletPoint>Access your personal data</BulletPoint>
            <BulletPoint>Correct inaccurate information</BulletPoint>
            <BulletPoint>Delete your account and associated data</BulletPoint>
            <BulletPoint>Export your data</BulletPoint>
            <BulletPoint>Opt-out of certain communications</BulletPoint>
            
            <PolicyText>
              To exercise these rights, contact us using the information provided below.
            </PolicyText>
          </PolicySection>

          {/* Data Retention */}
          <PolicySection title="Data Retention">
            <PolicyText>
              We retain your personal information for as long as necessary to provide 
              our services and fulfill the purposes outlined in this Privacy Policy. 
              When you delete your account, we will delete your personal data within 
              30 days, except where retention is required by law.
            </PolicyText>
          </PolicySection>

          {/* Children's Privacy */}
          <PolicySection title="Children's Privacy">
            <PolicyText>
              BudgetWise is not intended for children under 13 years of age. We do not 
              knowingly collect personal information from children under 13. If we 
              discover that we have collected information from a child under 13, we 
              will delete such information immediately.
            </PolicyText>
          </PolicySection>

          {/* Changes to Privacy Policy */}
          <PolicySection title="Changes to This Privacy Policy">
            <PolicyText>
              We may update this Privacy Policy from time to time. We will notify you 
              of any material changes by posting the new Privacy Policy in the app and 
              updating the "Last updated" date. Your continued use of the app after 
              changes constitutes acceptance of the updated policy.
            </PolicyText>
          </PolicySection>

          {/* Contact Information */}
          <PolicySection title="Contact Us">
            <PolicyText>
              If you have questions about this Privacy Policy or our privacy practices, 
              please contact us:
            </PolicyText>
            
            <TouchableOpacity 
              style={styles.contactContainer}
              onPress={handleEmailPress}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="mail-outline" 
                size={20} 
                color={COLORS.primary || "#007AFF"} 
              />
              <Text style={styles.contactText}>support@budgetwise.com</Text>
            </TouchableOpacity>
            
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>BudgetWise Team</Text>
              <Text style={styles.contactLabel}>Personal Finance App</Text>
            </View>
          </PolicySection>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.white 
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
  updateContainer: {
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  lastUpdated: {
    fontSize: 13,
    fontFamily: "Poppins-Medium",
    color: "#6C757D",
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 15,
    fontFamily: "Poppins-Medium",
    color: "#000",
    marginTop: 12,
    marginBottom: 8,
  },
  policyText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#333",
    lineHeight: 22,
    marginBottom: 12,
  },
  bulletContainer: {
    flexDirection: "row",
    marginBottom: 8,
    paddingLeft: 12,
  },
  bullet: {
    fontSize: 16,
    color: COLORS.primary || "#007AFF",
    marginRight: 8,
    fontFamily: "Poppins-Medium",
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#333",
    lineHeight: 20,
  },
  contactContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  contactText: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: COLORS.primary || "#007AFF",
    marginLeft: 8,
  },
  contactInfo: {
    paddingLeft: 12,
  },
  contactLabel: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: "#6C757D",
    marginBottom: 4,
  },
});

export default PrivacyPolicyScreen;