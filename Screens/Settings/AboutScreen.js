import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Linking,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BackButton from "../../Components/Buttons/BackButton";
import ScreenWrapper from "../../Components/ScreenWrapper";
import { COLORS, SIZES } from "../../constants/theme";

const AboutScreen = ({ navigation }) => {
  const TeamMember = ({ name, role, email, github, linkedin }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{name}</Text>
        <Text style={styles.memberRole}>{role}</Text>
      </View>
      <View style={styles.socialLinks}>
        {email && (
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => Linking.openURL(`mailto:${email}`)}
          >
            <Ionicons name="mail-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
        )}
        {github && (
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => Linking.openURL(github)}
          >
            <Ionicons name="logo-github" size={20} color="#333" />
          </TouchableOpacity>
        )}
        {linkedin && (
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => Linking.openURL(linkedin)}
          >
            <Ionicons name="logo-linkedin" size={20} color="#0077B5" />
          </TouchableOpacity>
        )}
      </View>
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
            <Text style={styles.headerTitle}>About BudgetWise</Text>
          </View>
          <View style={styles.rightContainer} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* App Info */}
          <View style={styles.appInfoContainer}>
            <View style={styles.appIcon}>
              <Ionicons
                name="wallet-outline"
                size={40}
                color={COLORS.primary || "#007AFF"}
              />
            </View>
            <Text style={styles.appName}>BudgetWise</Text>
            <Text style={styles.appTagline}>Personal Finance Made Simple</Text>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
          </View>

          {/* About */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This App</Text>
            <Text style={styles.aboutText}>
              BudgetWise is a personal finance management app designed to help
              you track your spending, manage multiple accounts, and achieve
              your financial goals. Built with React Native and powered by
              Firebase for secure data storage.
            </Text>
          </View>

          {/* Development Team */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Development Team</Text>
            <TeamMember
              name="Tariq Ahmad"
              role="Software Engineer (AI/Security Focus)"
              email="tariq_muzamil@live.com"
              github="https://github.com/tariqahmaad"
              linkedin="https://www.linkedin.com/in/tariq-ahmad-a43320264/"
            />
            <TeamMember
              name="Mohammad Rauf"
              role="Full-Stack Developer (AI/ML Focus)"
              email="itmrauf@gmail.com"
              github="https://github.com/MohammadRauf0"
              linkedin="https://www.linkedin.com/in/mohammad-rauf-82270b2b5/" // Updated with the provided URL
            />
            <TeamMember
              name="Daniah Ayad Tareq Al-Sultani"
              role="Lead Developer & Designer"
              email="daniaayad728@gmail.com"
              github="https://github.com/Cactuskiller"
              linkedin="https://linkedin.com/in/dania-ayad"
            />
            {/* Add more team members as needed */}
          </View>

          {/* Technologies */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Built With</Text>
            <View style={styles.techContainer}>
              <View style={styles.techItem}>
                <Text style={styles.techName}>React Native</Text>
                <Text style={styles.techDesc}>
                  Cross-platform mobile framework
                </Text>
              </View>
              <View style={styles.techItem}>
                <Text style={styles.techName}>Firebase</Text>
                <Text style={styles.techDesc}>Backend & Authentication</Text>
              </View>
              <View style={styles.techItem}>
                <Text style={styles.techName}>Expo</Text>
                <Text style={styles.techDesc}>Development platform</Text>
              </View>
            </View>
          </View>

          {/* Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Get in Touch</Text>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => Linking.openURL("mailto:support@budgetwise.com")}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={COLORS.primary || "#007AFF"}
              />
              <Text style={styles.contactText}>support@budgetwise.com</Text>
            </TouchableOpacity>
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
  appInfoContainer: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    marginBottom: 24,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  appName: {
    fontSize: 24,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#8E8E93",
    marginBottom: 8,
  },
  appVersion: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#C7C7CC",
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
  aboutText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#333",
    lineHeight: 22,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#000",
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: "#8E8E93",
  },
  socialLinks: {
    flexDirection: "row",
  },
  socialButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  techContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
  },
  techItem: {
    marginBottom: 16,
  },
  techName: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#000",
    marginBottom: 2,
  },
  techDesc: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: "#8E8E93",
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 12,
  },
  contactText: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: COLORS.primary || "#007AFF",
    marginLeft: 12,
  },
});

export default AboutScreen;
