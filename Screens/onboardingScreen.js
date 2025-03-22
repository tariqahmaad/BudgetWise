import { View, Text, Image, StyleSheet, Dimensions } from "react-native";
import Onboarding from "react-native-onboarding-swiper";
import CustomButton from "../Components/Buttons/CustomButton";
import { useNavigation } from "@react-navigation/native";
import { useRef , useState} from "react";

const { width, height } = Dimensions.get("window");

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const onboardingRef = useRef(null);
  const [isLastPage, setIsLastPage] = useState(false);

  return (
    <View style={styles.container}>
      <Onboarding
        ref={onboardingRef} // Assign the reference here
        containerStyles={{ paddingHorizontal: 15 }}
        pages={[
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
        ]}
        nextLabel=""
        skipLabel=""
        showDone={false}
        showSkip={false}
        showNext={false}
        bottomBarHighlight={false}
        bottomBarStyle={styles.bottomBar} // Add space for button
        pageIndexCallback={(index) => {
          setIsLastPage(index === 2);
        }}
      />
      <View style={styles.buttonContainer}>
        <CustomButton
          title="Continue"
          onPress={() => {
            if (isLastPage) {
              navigation.navigate('Login');
            } else {
              onboardingRef.current.goNext(); // Use .current to access ref methods
            }
          }}
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: -50,
  },
  image: {
    width: width * 0.75,
    height: height * 0.3,
    resizeMode: "contain",
  },
  title: {
    width: width * 0.8,
    fontSize: 22,
    fontWeight: "bold",
    fontFamily: "Poppins",
    color: "#000",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    fontFamily: "Poppins",
    paddingHorizontal: 20,
  },
  bottomBar: {
    paddingBottom: 60, // Give space for button
  },
  buttonContainer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: "center",
    
  },
});

