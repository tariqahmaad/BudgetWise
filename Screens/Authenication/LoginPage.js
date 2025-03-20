import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const LoginPage = () => {
    return (
        <View style={styles.container}>
            <Text>LoginPage</Text>
        </View>
    )
}

export default LoginPage

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 25,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
})