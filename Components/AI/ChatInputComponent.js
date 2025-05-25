import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform, Animated, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SIZES, FONTS } from '../../constants/theme';

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
    const inputRef = useRef(null);
    const focusAnim = useRef(new Animated.Value(0)).current;
    const sendButtonScale = useRef(new Animated.Value(1)).current;

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
                            <Icon name="add-circle-outline" size={16} color={COLORS.primary} />
                            <Text style={styles.suggestionChipText}>{suggestion}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Input Container */}
            <Animated.View style={[
                styles.inputContainer,
                { borderColor }
            ]}>
                {/* Attach Button */}
                <TouchableOpacity
                    style={styles.attachButton}
                    onPress={handleDocumentPick}
                    disabled={isProcessingDocument || isTyping}
                    accessibilityRole="button"
                    accessibilityLabel="Attach document"
                    accessibilityHint="Upload a receipt or bank statement"
                >
                    <Icon
                        name={isProcessingDocument ? "hourglass-outline" : "attach-outline"}
                        size={24}
                        color={isProcessingDocument || isTyping ? COLORS.textGrayLight : COLORS.textGray}
                    />
                </TouchableOpacity>

                {/* Text Input */}
                <TextInput
                    ref={inputRef}
                    style={styles.textInput}
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
                    <Text style={styles.characterCounter}>
                        {500 - message.length}
                    </Text>
                )}

                {/* Send Button */}
                <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            !canSend && styles.sendButtonDisabled
                        ]}
                        onPress={handleSendPress}
                        disabled={!canSend}
                        accessibilityRole="button"
                        accessibilityLabel="Send message"
                        accessibilityHint="Send your message to the AI assistant"
                    >
                        <Icon
                            name={isTyping ? "hourglass-outline" : "send"}
                            size={20}
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
        borderRadius: SIZES.radius.large,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: SIZES.padding.medium,
        paddingVertical: SIZES.padding.small,
        minHeight: 50,
        maxHeight: 120,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    attachButton: {
        padding: SIZES.padding.small,
        marginRight: SIZES.padding.small,
        borderRadius: SIZES.radius.medium,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        width: 36,
        height: 36,
        marginBottom: SIZES.padding.small,
    },
    textInput: {
        flex: 1,
        ...FONTS.body2,
        color: COLORS.textLight,
        paddingVertical: SIZES.padding.medium,
        paddingHorizontal: SIZES.padding.small,
        textAlignVertical: 'center',
        minHeight: 44,
        maxHeight: 100,
        fontSize: 16,
        lineHeight: 20,
    },
    sendButton: {
        backgroundColor: COLORS.primary,
        borderRadius: SIZES.radius.large,
        padding: SIZES.padding.medium,
        marginLeft: SIZES.padding.small,
        justifyContent: 'center',
        alignItems: 'center',
        width: 44,
        height: 44,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
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
    },
    characterCounter: {
        position: 'absolute',
        top: 8,
        right: 60,
        ...FONTS.body3,
        color: COLORS.textGray,
        fontSize: 12,
        backgroundColor: COLORS.darkBackground,
        paddingHorizontal: 4,
        borderRadius: 8,
    },
});

export default ChatInputComponent; 