import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import NavigationBar from '../../Components/NavBar/NavigationBar'
import { COLORS } from '../../constants/theme'

const HomeScreen = () => {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.text}>HomeScreen</Text>
            </View>
            <NavigationBar />
        </View>
    )
}

export default HomeScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.appBackground,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    text: {
        color: COLORS.white,
        fontSize: 24,
    }
})