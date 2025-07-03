import { useCallback, useState } from 'react';
import { Text, TextInput } from 'react-native';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

// Prevent splash screen from auto-hiding until fonts are loaded
SplashScreen.preventAutoHideAsync().catch(console.error);

const useFontLoader = () => {
    const [fontError, setFontError] = useState(null);

    const [fontsLoaded, fontError2] = Font.useFonts({
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

    // Handle font loading errors
    if (fontError2) {
        console.error('Font loading error:', fontError2);
        setFontError(fontError2);
    }

    const onLayoutRootView = useCallback(async () => {
        try {
            if (fontsLoaded || fontError) {
                // Set Poppins as default for all Text and TextInput components only if fonts loaded successfully
                if (fontsLoaded && !fontError) {
                    Text.defaultProps = Text.defaultProps || {};
                    Text.defaultProps.style = { fontFamily: "Poppins-Regular" };

                    TextInput.defaultProps = TextInput.defaultProps || {};
                    TextInput.defaultProps.style = { fontFamily: "Poppins-Regular" };

                    console.log('Fonts loaded successfully and set as default');
                } else {
                    console.warn('Using system fonts due to font loading error');
                }

                await SplashScreen.hideAsync();
            }
        } catch (error) {
            console.error('Error in onLayoutRootView:', error);
            // Still try to hide splash screen to prevent app from hanging
            try {
                await SplashScreen.hideAsync();
            } catch (splashError) {
                console.error('Failed to hide splash screen:', splashError);
            }
        }
    }, [fontsLoaded, fontError]);

    // Return true if fonts loaded OR if there was an error (to prevent infinite loading)
    const shouldProceed = fontsLoaded || fontError || fontError2;

    return {
        fontsLoaded: shouldProceed,
        onLayoutRootView,
        fontError: fontError || fontError2
    };
};

export default useFontLoader; 