import { StyleSheet, View, TouchableOpacity, Dimensions } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'

const NavigationBar = () => {
    return (
        <View style={styles.overlay}>
            <View style={styles.container}>
                <TouchableOpacity style={styles.iconContainer} onPress={() => navigation.navigate('HomeScreen')}>
                    <Ionicons name="wallet-outline" size={34} color="#007AFF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.iconContainer}>
                    <Ionicons name="pie-chart-outline" size={34} color="#8E8E93" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.addButton}>
                    <Ionicons name="add" size={44} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.iconContainer}>
                    <Ionicons name="gift-outline" size={34} color="#8E8E93" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.iconContainer}>
                    <Ionicons name="settings-outline" size={34} color="#8E8E93" />
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default NavigationBar

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 999, // Ensures the navbar stays on top
    },
    container: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        paddingVertical: 10,
        paddingBottom: 25, // Add extra padding for iOS devices
        borderTopWidth: 0.2,
        borderTopColor: '#38383A',
    },
    iconContainer: {
        padding: 10,
    },
    addButton: {
        backgroundColor: '#007AFF',
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#007AFF',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    }
})