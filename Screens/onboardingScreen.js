import { View, Text, Image, StyleSheet, Dimensions } from "react-native";
import Onboarding from "react-native-onboarding-swiper";
import CustomButton from "../Components/Buttons/CustomButton";
import { useNavigation } from "@react-navigation/native";
import { useRef, useState, useCallback } from "react";
import { COLORS } from "../constants/theme";

const { width, height } = Dimensions.get("window");

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const onboardingRef = useRef(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const pages = [
    {
      backgroundColor: "#F0F0F0",
      image: <Image source={require("../assets/Group 1.png")} style={styles.image} />,
      title: "Effortless expense tracking",
      subtitle: "Automatically categorize your spending and gain insights to stay on top of your finances",
      titleStyles: styles.title,
      subTitleStyles: styles.subtitle,
    },
    {
      backgroundColor: "#F0F0F0",
      image: <Image source={require("../assets/Group 3.png")} style={styles.image} />,
      title: "Your personal finance assistant",
      subtitle: "Chat with AI to get tailored budgeting tips, spending analysis, and money-saving advice",
      titleStyles: styles.title,
      subTitleStyles: styles.subtitle,
    },
    {
      backgroundColor: "#F0F0F0",
      image: <Image source={require("../assets/Group 4.png")} style={styles.image} />,
      title: "Understand your spending habits",
      subtitle: "Get a clear summary of where your money goes each month, helping you make better financial decisions",
      titleStyles: styles.title,
      subTitleStyles: styles.subtitle,
    },
  ];

  const isLastPage = currentPageIndex === pages.length - 1;

  // Consistent pagination dots pattern used across the app
  const renderPaginationDots = useCallback((currentIndex, total) => (
    <View style={styles.paginationDots}>
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === currentIndex ? styles.activeDot : styles.inactiveDot,
          ]}
        />
      ))}
    </View>
  ), []);

  const handleContinuePress = useCallback(() => {
    if (isLastPage) {
      navigation.navigate('SignIn');
    } else {
      onboardingRef.current?.goNext();
    }
  }, [isLastPage, navigation]);

  const handlePageChange = useCallback((index) => {
    setCurrentPageIndex(index);
  }, []);

  return (
    <View style={styles.container}>
      <Onboarding
        ref={onboardingRef}
        containerStyles={styles.onboardingContainer}
        pages={pages}
        nextLabel=""
        skipLabel=""
        showDone={false}
        showSkip={false}
        showNext={false}
        bottomBarHighlight={false}
        pageIndexCallback={handlePageChange}
      />

      {/* Custom bottom section with pagination dots and button */}
      <View style={styles.bottomSection}>
        {renderPaginationDots(currentPageIndex, pages.length)}
        <View style={styles.buttonContainer}>
          <CustomButton
            title={isLastPage ? "Get Started" : "Continue"}
            onPress={handleContinuePress}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F0F0",
  },
  onboardingContainer: {
    paddingHorizontal: 15,
    flex: 1,
  },
  image: {
    width: width * 0.75,
    height: height * 0.3,
    resizeMode: "contain",
  },
  title: {
    width: width * 0.85,
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "Poppins-bold",
    color: COLORS.text || "#000",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textGray || "#666",
    textAlign: "center",
    fontFamily: "Poppins-Regular",
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  bottomSection: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#F0F0F0",
    paddingBottom: height * 0.05,
    paddingTop: 20,
    alignItems: "center",
  },
  paginationDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: COLORS.primary || "#007AFF",
    width: 24,
  },
  inactiveDot: {
    backgroundColor: "#0066FF",
    opacity: 0.3,
  },
  buttonContainer: {
    width: width * 0.9,
    alignItems: "center",
  },
});