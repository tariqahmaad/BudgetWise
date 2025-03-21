import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';

const PrimaryButton = ({ onPress, title, style, textStyle }) => {
    const scaleAnimation = useRef(new Animated.Value(1)).current;
    const opacityAnimation = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.parallel([
            Animated.spring(scaleAnimation, {
                toValue: 0.95,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnimation, {
                toValue: 0.8,
                duration: 100,
                useNativeDriver: true,
            })
        ]).start();
    };

    const handlePressOut = () => {
        Animated.parallel([
            Animated.spring(scaleAnimation, {
                toValue: 1,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnimation, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            })
        ]).start();
    };

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnimation }], opacity: opacityAnimation }}>
            <TouchableOpacity
                style={[styles.button, style]}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
            >
                <Text style={[styles.buttonText, textStyle]}>{title}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#FDB347',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 5,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
});

export default PrimaryButton; 