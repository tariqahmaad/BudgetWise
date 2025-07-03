import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform, Animated, Text, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SIZES, FONTS } from '../../constants/theme';

// Get device dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');



// Smart input suggestions based on common patterns
const getSmartSuggestions = (text) => {
    const suggestions = [];
    const lowerText = text.toLowerCase();

    if (lowerText.includes('spent') || lowerText.includes('$')) {
        suggestions.push('Add this as a transaction');
    }
    if (lowerText.includes('budget') || lowerText.includes('limit')) {
        suggestions.push('Set spending limit');
    }
    if (lowerText.includes('save') || lowerText.includes('goal')) {
        suggestions.push('Create savings goal');
    }

    return suggestions;
};

/**
 * ChatInputComponent renders the input area for the AI chat
 */
const ChatInputComponent = React.memo(({
    message,
    setMessage,
    handleSend,
    handleDocumentPick,
    isProcessingDocument,
    isTyping,
    keyboardHeight,
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [smartSuggestions, setSmartSuggestions] = useState([]);
    const [deviceDimensions, setDeviceDimensions] = useState({ width: screenWidth, height: screenHeight });
    const inputRef = useRef(null);
    const focusAnim = useRef(new Animated.Value(0)).current;
    const sendButtonScale = useRef(new Animated.Value(1)).current;

    // Listen for device orientation changes
    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            setDeviceDimensions({ width: window.width, height: window.height });
        });

        return () => subscription?.remove();
    }, []);

    // Get responsive dimensions based on current device size
    const getResponsiveDimensionsForDevice = () => {
        const { width, height } = deviceDimensions;
        const isTablet = width > 768;
        const isLandscape = width > height;
        const screenScale = Math.min(width / 375, 1.3); // Base scale on iPhone 11 width, max 1.3x

        return {
            isTablet,
            isLandscape,
            screenScale,
            // Font sizes
            inputFontSize: Math.min(Math.max(14 * screenScale, 14), isTablet ? 18 : 16),
            placeholderFontSize: Math.min(Math.max(14 * screenScale, 14), isTablet ? 18 : 16),
            suggestionFontSize: Math.min(Math.max(12 * screenScale, 12), isTablet ? 15 : 13),
            counterFontSize: Math.min(Math.max(10 * screenScale, 10), isTablet ? 12 : 11),
            // Icon sizes
            iconSize: Math.min(Math.max(20 * screenScale, 20), isTablet ? 28 : 24),
            attachIconSize: Math.min(Math.max(22 * screenScale, 22), isTablet ? 28 : 24),
            // Container dimensions
            minHeight: isTablet ? 60 : 50,
            maxHeight: isTablet ? 140 : 120,
            buttonSize: isTablet ? 50 : 44,
            padding: isTablet ? SIZES.padding.large : SIZES.padding.medium,
            borderRadius: isTablet ? SIZES.radius.xlarge : SIZES.radius.large,
            // Line height for better text display
            lineHeight: Math.min(Math.max(18 * screenScale, 18), isTablet ? 24 : 20),
        };
    };

    const responsiveDimensions = getResponsiveDimensionsForDevice();

    // Handle input focus animations
    useEffect(() => {
        Animated.timing(focusAnim, {
            toValue: isFocused ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [isFocused, focusAnim]);

    // Update smart suggestions based on input
    useEffect(() => {
        if (message.trim().length > 3) {
            const suggestions = getSmartSuggestions(message);
            setSmartSuggestions(suggestions);
            setShowSuggestions(suggestions.length > 0);
        } else {
            setShowSuggestions(false);
        }
    }, [message]);

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleBlur = () => {
        setIsFocused(false);
        // Delay hiding suggestions to allow for tap
        setTimeout(() => setShowSuggestions(false), 200);
    };

    const handleSendPress = () => {
        // Animate send button
        Animated.sequence([
            Animated.timing(sendButtonScale, {
                toValue: 0.9,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(sendButtonScale, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            })
        ]).start();

        handleSend();
    };

    const handleSuggestionPress = (suggestion) => {
        setMessage(prev => `${prev} ${suggestion}`);
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    const canSend = message.trim() && !isProcessingDocument && !isTyping;

    const borderColor = focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [COLORS.border || '#38383A', COLORS.primary || '#FDB347'],
    });

    return (
        <View style={[
            styles.container,
            Platform.OS === 'ios' && { paddingBottom: 20 },
            { marginBottom: keyboardHeight > 0 ? 0 : Platform.OS === 'ios' ? 20 : 0 }
        ]}>
            {/* Smart Suggestions */}
            {showSuggestions && smartSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                    {smartSuggestions.map((suggestion, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.suggestionChip}
                            onPress={() => handleSuggestionPress(suggestion)}
                        >
                            <Icon name="add-circle-outline" size={responsiveDimensions.suggestionFontSize + 2} color={COLORS.primary} />
                            <Text style={[
                                styles.suggestionChipText,
                                { fontSize: responsiveDimensions.suggestionFontSize }
                            ]}>{suggestion}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Input Container */}
            <Animated.View style={[
                styles.inputContainer,
                {
                    borderColor,
                    minHeight: responsiveDimensions.minHeight,
                    maxHeight: responsiveDimensions.maxHeight,
                    borderRadius: responsiveDimensions.borderRadius,
                    paddingHorizontal: responsiveDimensions.padding,
                }
            ]}>
                {/* Attach Button */}
                <TouchableOpacity
                    style={[
                        styles.attachButton,
                        {
                            width: responsiveDimensions.buttonSize * 0.8,
                            height: responsiveDimensions.buttonSize * 0.8,
                        }
                    ]}
                    onPress={handleDocumentPick}
                    disabled={isProcessingDocument || isTyping}
                    accessibilityRole="button"
                    accessibilityLabel="Attach document"
                    accessibilityHint="Upload a receipt or bank statement"
                >
                    <Icon
                        name={isProcessingDocument ? "hourglass-outline" : "attach-outline"}
                        size={responsiveDimensions.attachIconSize}
                        color={isProcessingDocument || isTyping ? COLORS.textGrayLight : COLORS.textGray}
                    />
                </TouchableOpacity>

                {/* Text Input */}
                <TextInput
                    ref={inputRef}
                    style={[
                        styles.textInput,
                        {
                            fontSize: responsiveDimensions.inputFontSize,
                            lineHeight: responsiveDimensions.lineHeight,
                            minHeight: responsiveDimensions.minHeight - 12, // Adjust for container padding
                            maxHeight: responsiveDimensions.maxHeight - 20,
                        }
                    ]}
                    placeholder="Ask me about your finances..."
                    placeholderTextColor={COLORS.textGray}
                    value={message}
                    onChangeText={setMessage}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    multiline
                    maxLength={500}
                    editable={!isProcessingDocument}
                    accessibilityRole="text"
                    accessibilityLabel="Message input"
                    accessibilityHint="Type your question or request here"
                />

                {/* Character Counter */}
                {message.length > 400 && (
                    <Text style={[
                        styles.characterCounter,
                        { fontSize: responsiveDimensions.counterFontSize }
                    ]}>
                        {500 - message.length}
                    </Text>
                )}

                {/* Send Button */}
                <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            !canSend && styles.sendButtonDisabled,
                            {
                                width: responsiveDimensions.buttonSize,
                                height: responsiveDimensions.buttonSize,
                                borderRadius: responsiveDimensions.buttonSize / 2,
                                padding: responsiveDimensions.padding * 0.6,
                            }
                        ]}
                        onPress={handleSendPress}
                        disabled={!canSend}
                        accessibilityRole="button"
                        accessibilityLabel="Send message"
                        accessibilityHint="Send your message to the AI assistant"
                    >
                        <Icon
                            name={isTyping ? "hourglass-outline" : "send"}
                            size={responsiveDimensions.iconSize}
                            color={COLORS.white}
                        />
                    </TouchableOpacity>
                </Animated.View>
            </Animated.View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.appBackground,
        paddingHorizontal: SIZES.padding.medium,
        paddingVertical: SIZES.padding.medium,
        // Add subtle top border
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.05)',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: COLORS.darkBackground,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingVertical: SIZES.padding.small,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        // borderRadius, paddingHorizontal, minHeight, maxHeight are set dynamically via responsiveDimensions
    },
    attachButton: {
        padding: SIZES.padding.small,
        marginRight: SIZES.padding.small,
        borderRadius: SIZES.radius.medium,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SIZES.padding.small,
        // width, height are set dynamically via responsiveDimensions
    },
    textInput: {
        flex: 1,
        ...FONTS.body2,
        color: COLORS.textLight,
        paddingVertical: SIZES.padding.medium,
        paddingHorizontal: SIZES.padding.small,
        textAlignVertical: 'center',
        // fontSize, lineHeight, minHeight, maxHeight are set dynamically via responsiveDimensions
    },
    sendButton: {
        backgroundColor: COLORS.primary,
        marginLeft: SIZES.padding.small,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
        // width, height, borderRadius, padding are set dynamically via responsiveDimensions
    },
    sendButtonDisabled: {
        backgroundColor: COLORS.textGray,
        opacity: 0.5,
        shadowOpacity: 0,
        elevation: 0,
    },
    suggestionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: SIZES.padding.small,
        paddingHorizontal: SIZES.padding.small,
        backgroundColor: COLORS.darkBackground,
        borderRadius: SIZES.radius.medium,
        padding: SIZES.padding.small,
    },
    suggestionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SIZES.padding.small,
        backgroundColor: COLORS.cardBackground,
        borderRadius: SIZES.radius.medium,
        marginRight: SIZES.padding.small,
        marginBottom: SIZES.padding.small,
        borderWidth: 1,
        borderColor: COLORS.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    suggestionChipText: {
        ...FONTS.body3,
        color: COLORS.primary,
        marginLeft: SIZES.padding.small,
        fontWeight: '500',
        // fontSize is set dynamically via responsiveDimensions
    },
    characterCounter: {
        position: 'absolute',
        top: 8,
        right: 60,
        ...FONTS.body3,
        color: COLORS.textGray,
        backgroundColor: COLORS.darkBackground,
        paddingHorizontal: 4,
        borderRadius: 8,
        // fontSize is set dynamically via responsiveDimensions
    },
});

export default ChatInputComponent; 