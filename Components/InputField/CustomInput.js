import React, { useState, useRef } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const CustomInput = ({
    placeholder,
    value,
    onChangeText,
    secureTextEntry,
    leftIcon,
    keyboardType = 'default',
    style,
    onFocus,
}) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const glowAnimation = useRef(new Animated.Value(0)).current;
    const scaleAnimation = useRef(new Animated.Value(1)).current;

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    const handleFocus = () => {
        setIsFocused(true);
        Animated.parallel([
            Animated.timing(glowAnimation, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnimation, {
                toValue: 1.02,
                useNativeDriver: true,
            })
        ]).start();
        onFocus?.();
    };

    const handleBlur = () => {
        setIsFocused(false);
        Animated.parallel([
            Animated.timing(glowAnimation, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnimation, {
                toValue: 1,
                useNativeDriver: true,
            })
        ]).start();
    };

    const animatedStyle = {
        transform: [{ scale: scaleAnimation }],
        borderColor: glowAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: ['#E5E7EB', '#60A5FA'],
        }),
    };

    return (
        <Animated.View style={[styles.container, style, animatedStyle]}>
            {leftIcon && (
                <Icon
                    name={leftIcon}
                    size={20}
                    color={isFocused ? '#60A5FA' : '#9CA3AF'}
                    style={styles.leftIcon}
                />
            )}
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry && !isPasswordVisible}
                keyboardType={keyboardType}
                onFocus={handleFocus}
                onBlur={handleBlur}
            />
            {secureTextEntry && (
                <TouchableOpacity onPress={togglePasswordVisibility} style={styles.rightIcon}>
                    <Icon
                        name={isPasswordVisible ? 'eye-off' : 'eye'}
                        size={20}
                        color={isFocused ? '#60A5FA' : '#9CA3AF'}
                    />
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginVertical: 8,
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        ...Platform.select({
            ios: {
                shadowColor: '#60A5FA',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
            web: {
                boxShadow: '0 2px 4px rgba(96, 165, 250, 0.1)',
            },
        }),
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    leftIcon: {
        marginRight: 10,
    },
    rightIcon: {
        padding: 4,
    },
});

export default CustomInput; 