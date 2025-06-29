import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Animated,
    Easing,
    TouchableOpacity,
    Platform,
    Image,
    Dimensions
} from 'react-native';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import Markdown from 'react-native-markdown-display';
import Icon from 'react-native-vector-icons/Ionicons';

const screenWidth = Dimensions.get('window').width;

/**
 * ChatComponent handles rendering the chat messages and typing indicators
 */
const ChatComponent = React.memo(({
    chatHistory,
    setChatHistory,
    isTyping,
    isProcessingDocument,
    extractedTransactions,
    setExtractedTransactions,
    saveExtractedTransactions,
    chatOpacity,
    chatScale,
    chatSlideY,
    borderHighlightOpacity,
    handleSend,
    retryDocumentProcessing,
}) => {
    const chatListRef = useRef(null);

    // Create interpolated values for animations to avoid direct usage in transforms
    const chatScaleTransform = chatScale ? chatScale.interpolate({
        inputRange: [0.95, 1],
        outputRange: [0.95, 1],
        extrapolate: 'clamp'
    }) : 1;

    const slideYTransform = chatSlideY ? chatSlideY.interpolate({
        inputRange: [0, 20],
        outputRange: [0, 20],
        extrapolate: 'clamp'
    }) : 0;

    const borderTranslateY = borderHighlightOpacity ? borderHighlightOpacity.interpolate({
        inputRange: [0, 1],
        outputRange: [-2, 0],
        extrapolate: 'clamp'
    }) : 0;

    // Render typing or processing indicator
    const renderTypingIndicator = () => (
        <View style={styles.typingIndicator}>
            <View style={styles.typingDots}>
                <View style={[styles.dot, { opacity: 0.4 }]} />
                <View style={[styles.dot, { opacity: 0.6 }]} />
                <View style={[styles.dot, { opacity: 0.8 }]} />
            </View>
            <Text style={styles.typingText}>
                {isProcessingDocument ? 'Processing document' : 'AI is thinking'}
            </Text>
        </View>
    );

    // Function to render image content
    const renderImageContent = (imagePart) => {
        const imageUri = `data:image/jpeg;base64,${imagePart.imageData}`;
        const maxImageWidth = screenWidth * 0.6; // 60% of screen width
        const imageHeight = 200; // Fixed height for consistency

        return (
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: imageUri }}
                    style={[
                        styles.uploadedImage,
                        {
                            width: maxImageWidth,
                            height: imageHeight,
                        }
                    ]}
                    resizeMode="cover"
                />
                {imagePart.text && (
                    <Text style={styles.imageCaption}>{imagePart.text}</Text>
                )}
                {isProcessingDocument && (
                    <View style={styles.processingOverlay}>
                        <View style={styles.processingIndicator}>
                            <Icon name="hourglass-outline" size={16} color={COLORS.primary} />
                            <Text style={styles.processingText}>Processing...</Text>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    // FlatList renderItem for chat messages
    const renderChatMessage = ({ item, index }) => {
        // Check if this is a message with transaction data and action buttons
        const hasTransactionData =
            item.role === 'model' &&
            item.parts[0].showActionButtons &&
            item.parts[0].transactionData;

        // Check if this is a message with retry functionality
        const hasRetryOption =
            item.role === 'model' &&
            item.parts[0].retryable &&
            item.parts[0].retryData &&
            retryDocumentProcessing;

        // Check if this is an image message
        const hasImageContent =
            item.parts[0].type === 'image' &&
            item.parts[0].imageData;

        return (
            <View
                style={[
                    styles.messageContainer,
                    item.role === 'user' ? styles.userMessage : styles.aiMessage,
                    // Add top margin to first message for better spacing
                    index === 0 && { marginTop: 10 },
                    // Adjust styling for image messages
                    hasImageContent && styles.imageMessageContainer
                ]}
            >
                {hasImageContent ? (
                    // Render image content
                    renderImageContent(item.parts[0])
                ) : item.role === 'model' ? (
                    <Markdown
                        style={{
                            body: { ...styles.messageText, color: styles.messageText.color },
                            text: { ...styles.messageText, color: styles.messageText.color },
                            paragraph: { marginBottom: 0 },
                            code_block: { backgroundColor: '#222', color: '#fff', borderRadius: 6, padding: 8, fontSize: 13 },
                            code_inline: { backgroundColor: '#222', color: '#fff', borderRadius: 4, padding: 2, fontSize: 13 },
                            link: { color: '#4F8EF7' },
                            heading1: { fontSize: 20, fontWeight: 'bold', color: styles.messageText.color },
                            heading2: { fontSize: 18, fontWeight: 'bold', color: styles.messageText.color },
                            heading3: { fontSize: 16, fontWeight: 'bold', color: styles.messageText.color },
                            bullet_list: { marginBottom: 0 },
                            ordered_list: { marginBottom: 0 },
                            list_item: { marginBottom: 0 },
                        }}
                    >
                        {item.parts[0].text}
                    </Markdown>
                ) : (
                    <Text style={[styles.messageText, { color: COLORS.text }]}>{item.parts[0].text}</Text>
                )}

                {/* Add transaction action buttons */}
                {hasTransactionData && (
                    <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity
                            style={styles.primaryActionButton}
                            onPress={() => {
                                // Get the transaction data from this specific message
                                const transactionsToSave = item.parts[0].transactionData;

                                // Add a user message indicating the action
                                const userCommandMessage = {
                                    role: 'user',
                                    parts: [{ text: `Yes, please add these transactions.` }]
                                };
                                setChatHistory(prev => [...prev, userCommandMessage]);

                                // Call the saveExtractedTransactions prop directly with the transactions
                                saveExtractedTransactions(transactionsToSave);
                            }}
                        >
                            <Text style={styles.primaryActionButtonText}>Add to Account</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.secondaryActionButton}
                            onPress={() => {
                                // User dismissed. Add a message to chat.
                                const responseMessage = {
                                    role: 'model',
                                    parts: [{ text: "Okay, I won't add these transactions. You can upload another receipt if needed." }]
                                };
                                setChatHistory(prev => [...prev, responseMessage]);
                            }}
                        >
                            <Text style={styles.secondaryActionButtonText}>Dismiss</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Add retry button for retryable errors */}
                {hasRetryOption && (
                    <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity
                            style={styles.retryActionButton}
                            onPress={() => {
                                // Add a user message indicating retry attempt
                                const userRetryMessage = {
                                    role: 'user',
                                    parts: [{ text: `Retrying document processing...` }]
                                };
                                setChatHistory(prev => [...prev, userRetryMessage]);

                                // Call the retry function
                                retryDocumentProcessing(item.parts[0].retryData);
                            }}
                            disabled={isProcessingDocument}
                        >
                            <Icon
                                name="refresh-outline"
                                size={16}
                                color={isProcessingDocument ? COLORS.textGray : COLORS.white}
                            />
                            <Text style={[
                                styles.retryActionButtonText,
                                isProcessingDocument && { color: COLORS.textGray }
                            ]}>
                                {isProcessingDocument ? 'Processing...' : 'Try Again'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.secondaryActionButton}
                            onPress={() => {
                                const responseMessage = {
                                    role: 'model',
                                    parts: [{ text: "No problem! Feel free to try uploading a different document or ask me anything else about your finances." }]
                                };
                                setChatHistory(prev => [...prev, responseMessage]);
                            }}
                        >
                            <Text style={styles.secondaryActionButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <Animated.View style={[styles.chatOverlay, { opacity: chatOpacity, borderTopLeftRadius: SIZES.radius.large, borderTopRightRadius: SIZES.radius.large, transform: [{ translateY: slideYTransform }, { scale: chatScaleTransform }] }]} pointerEvents={chatHistory.length > 0 ? 'auto' : 'none'}        >
            <View style={{
                borderTopLeftRadius: SIZES.radius.large,
                borderTopRightRadius: SIZES.radius.large,
                overflow: 'hidden',
                flex: 1,
                backgroundColor: COLORS.appBackground,
            }}>
                {/* Border highlight for rounded corners */}
                <Animated.View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    borderTopLeftRadius: SIZES.radius.large,
                    borderTopRightRadius: SIZES.radius.large,
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    zIndex: 2,
                    opacity: borderHighlightOpacity,
                    transform: [{
                        translateY: borderTranslateY
                    }]
                }} />

                <FlatList
                    ref={chatListRef}
                    data={chatHistory}
                    renderItem={renderChatMessage}
                    keyExtractor={(_, index) => index.toString()}
                    style={{ flexGrow: 1 }}
                    contentContainerStyle={[
                        styles.chatArea,
                        {
                            paddingTop: 20,
                            paddingBottom: 90,
                        }
                    ]}
                    ListHeaderComponent={
                        <View style={{ height: 15 }} />
                    }
                    ListFooterComponent={isTyping ? renderTypingIndicator : null}
                    keyboardShouldPersistTaps="handled"
                    onContentSizeChange={() => {
                        if (chatListRef.current && chatHistory.length > 0) {
                            setTimeout(() => {
                                if (chatListRef.current) {
                                    chatListRef.current.scrollToEnd({ animated: true });
                                }
                            }, Platform.OS === 'android' ? 80 : 0);
                        }
                    }}
                />
            </View>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    chatOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: COLORS.appBackground,
        borderTopLeftRadius: SIZES.radius.large,
        borderTopRightRadius: SIZES.radius.large,
        paddingTop: 10,
        elevation: 1, // Add slight elevation
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        overflow: 'hidden', // Ensure content doesn't overflow rounded corners
        zIndex: 5, // Ensure it's above other content
    },
    chatArea: {
        minHeight: 100,
        paddingHorizontal: SIZES.padding.medium,
    },
    messageContainer: {
        maxWidth: '85%',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 22,
        marginBottom: 10,
        marginTop: 4,
        marginHorizontal: 6,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    imageMessageContainer: {
        maxWidth: '75%', // Slightly wider for images
        paddingHorizontal: 8,
        paddingVertical: 8,
    },
    userMessage: {
        alignSelf: 'flex-end',
        backgroundColor: COLORS.primary,
        borderTopRightRadius: 6,
        borderTopLeftRadius: 22,
        borderBottomLeftRadius: 22,
        borderBottomRightRadius: 22,
        marginLeft: 40,
        marginRight: 0,
    },
    aiMessage: {
        alignSelf: 'flex-start',
        backgroundColor: COLORS.cardBackground,
        borderTopLeftRadius: 6,
        borderTopRightRadius: 22,
        borderBottomLeftRadius: 22,
        borderBottomRightRadius: 22,
        marginRight: 40,
        marginLeft: 0,
        paddingBottom: 20,
    },
    messageText: {
        ...FONTS.body2,
        color: COLORS.textLight,
        lineHeight: 24,
        fontSize: 16,
        letterSpacing: 0.1,
    },
    imageContainer: {
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: COLORS.cardBackground,
    },
    uploadedImage: {
        borderRadius: 12,
        backgroundColor: COLORS.lightGray,
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    imageLabel: {
        ...FONTS.body3,
        color: COLORS.white,
        marginLeft: 6,
        flex: 1,
        fontSize: 12,
    },
    imageCaption: {
        ...FONTS.body3,
        color: COLORS.textSecondary,
        marginTop: 8,
        marginHorizontal: 8,
        fontSize: 13,
    },
    processingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    processingIndicator: {
        backgroundColor: COLORS.white,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    processingText: {
        ...FONTS.body3,
        color: COLORS.primary,
        marginLeft: 6,
        fontWeight: '600',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 12,
    },
    primaryActionButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        paddingVertical: 8,
        paddingHorizontal: 18,
        marginRight: 10,
    },
    primaryActionButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
    },
    secondaryActionButton: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 16,
        paddingVertical: 8,
        paddingHorizontal: 18,
        borderWidth: 1,
        borderColor: COLORS.textGray,
    },
    secondaryActionButtonText: {
        color: COLORS.textGray,
        fontWeight: 'bold',
    },
    retryActionButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        paddingVertical: 8,
        paddingHorizontal: 18,
        marginRight: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    retryActionButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    typingIndicator: {
        alignSelf: 'flex-start',
        backgroundColor: COLORS.cardBackground,
        paddingHorizontal: SIZES.padding.large,
        paddingVertical: SIZES.padding.medium,
        borderRadius: SIZES.radius.large,
        marginBottom: SIZES.padding.medium,
        marginRight: SIZES.padding.xxxxlarge,
        flexDirection: 'row',
        alignItems: 'center',
    },
    typingText: {
        ...FONTS.body3,
        color: COLORS.textGray,
        fontStyle: 'italic',
        marginLeft: SIZES.padding.medium,
    },
    typingDots: {
        flexDirection: 'row',
        marginLeft: SIZES.padding.medium,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.textGray,
        marginHorizontal: 2,
    },
});

export default ChatComponent; 