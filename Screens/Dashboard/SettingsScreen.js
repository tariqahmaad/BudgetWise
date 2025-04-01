import { StyleSheet, Text, View, SafeAreaView } from "react-native";
import React from "react";
import NavigationBar from "../../Components/NavBar/NavigationBar";
import { COLORS } from "../../constants/theme";

const SettingsScreen = () => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.content}>
                    <Text style={styles.title}>Settings</Text>
                </View>
                <NavigationBar />
            </View>
        </SafeAreaView>
    );
};

export default SettingsScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.appBackground,
        paddingTop: 35,
    },
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