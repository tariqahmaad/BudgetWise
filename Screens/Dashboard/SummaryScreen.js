import { StyleSheet, Text, View } from "react-native";
import React from "react";
import NavigationBar from "../../Components/NavBar/NavigationBar";
import { COLORS } from "../../constants/theme";
import ScreenWrapper from "../../Components/ScreenWrapper";

const SummaryScreen = () => {
    return (
        <ScreenWrapper backgroundColor={COLORS.appBackground}>
            <View style={styles.container}>
                <View style={styles.content}>
                    <Text style={styles.title}>Summary</Text>
                </View>
                <NavigationBar />
            </View>
        </ScreenWrapper>
    );
};

export default SummaryScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.appBackground,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        color: COLORS.text,
        fontFamily: "Poppins-SemiBold",
    },
}); 