import { useCallback } from 'react';
import { Text, TextInput } from 'react-native';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

// Prevent splash screen from auto-hiding until fonts are loaded
SplashScreen.preventAutoHideAsync();

const useFontLoader = () => {
    const [fontsLoaded] = Font.useFonts({
        "Poppins-Black": require("../assets/fonts/Poppins-Black.ttf"),
        "Poppins-BlackItalic": require("../assets/fonts/Poppins-BlackItalic.ttf"),
        "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
        "Poppins-BoldItalic": require("../assets/fonts/Poppins-BoldItalic.ttf"),
        "Poppins-ExtraBold": require("../assets/fonts/Poppins-ExtraBold.ttf"),
        "Poppins-ExtraBoldItalic": require("../assets/fonts/Poppins-ExtraBoldItalic.ttf"),
        "Poppins-ExtraLight": require("../assets/fonts/Poppins-ExtraLight.ttf"),
        "Poppins-ExtraLightItalic": require("../assets/fonts/Poppins-ExtraLightItalic.ttf"),
        "Poppins-Italic": require("../assets/fonts/Poppins-Italic.ttf"),
        "Poppins-Light": require("../assets/fonts/Poppins-Light.ttf"),
        "Poppins-LightItalic": require("../assets/fonts/Poppins-LightItalic.ttf"),
        "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
        "Poppins-MediumItalic": require("../assets/fonts/Poppins-MediumItalic.ttf"),
        "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
        "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
        "Poppins-SemiBoldItalic": require("../assets/fonts/Poppins-SemiBoldItalic.ttf"),
        "Poppins-Thin": require("../assets/fonts/Poppins-Thin.ttf"),
        "Poppins-ThinItalic": require("../assets/fonts/Poppins-ThinItalic.ttf"),
    });

    const onLayoutRootView = useCallback(async () => {
        if (fontsLoaded) {
            // Set Poppins as default for all Text and TextInput components
            Text.defaultProps = Text.defaultProps || {};
            Text.defaultProps.style = { fontFamily: "Poppins-Regular" };

            TextInput.defaultProps = TextInput.defaultProps || {};
            TextInput.defaultProps.style = { fontFamily: "Poppins-Regular" };

            await SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    return {
        fontsLoaded,
        onLayoutRootView
    };
};

export default useFontLoader; 