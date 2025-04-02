import { StyleSheet, Text, View, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Image, TouchableOpacity, Alert } from 'react-native'
import React, { useState, useRef, useEffect } from 'react'
import { GEMINI_API_KEY } from '@env'
import { GoogleGenerativeAI } from '@google/generative-ai'
import CustomInput from '../../Components/InputField/CustomInput'
import PrimaryButton from '../../Components/Buttons/PrimaryButton'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import * as ImagePicker from 'expo-image-picker'
import { StatusBar } from 'expo-status-bar'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { BlurView } from 'expo-blur'

const ChatBot = () => {
    const insets = useSafeAreaInsets();
    const [messages, setMessages] = useState([])
    const [inputMessage, setInputMessage] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [selectedImage, setSelectedImage] = useState(null)
    const scrollViewRef = useRef(null)
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    // Add typing animation dots
    const [typingDots, setTypingDots] = useState('');
    useEffect(() => {
        if (!isTyping) {
            setTypingDots('');
            return;
        }

        const interval = setInterval(() => {
            setTypingDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);

        return () => clearInterval(interval);
    }, [isTyping]);

    // Format timestamp without date-fns
    const formatTime = (dateString) => {
        const date = new Date(dateString)
        let hours = date.getHours()
        const minutes = date.getMinutes()
        const ampm = hours >= 12 ? 'PM' : 'AM'
        hours = hours % 12
        hours = hours ? hours : 12 // the hour '0' should be '12'
        const minutesStr = minutes < 10 ? '0' + minutes : minutes
        return `${hours}:${minutesStr} ${ampm}`
    }

    // Load saved messages on mount
    useEffect(() => {
        const loadMessages = async () => {
            try {
                const savedMessages = await AsyncStorage.getItem('chatMessages')
                if (savedMessages) {
                    setMessages(JSON.parse(savedMessages))
                } else {
                    // Add welcome message if no history exists
                    setMessages([{
                        id: `bot-${Date.now()}`,
                        text: "Hi there! I'm your BudgetWise assistant. Ask me anything about your finances or show me a receipt!",
                        isUser: false,
                        timestamp: new Date().toISOString()
                    }])
                }
            } catch (error) {
                console.error('Failed to load messages:', error)
                // Add error message to chat if loading fails
                setMessages([{
                    id: `bot-error-${Date.now()}`,
                    text: "Sorry, I couldn't load previous messages.",
                    isUser: false,
                    timestamp: new Date().toISOString(),
                    isError: true // Add error flag for styling
                }])
            }
        }
        loadMessages()
    }, [])

    // Save messages whenever they change
    useEffect(() => {
        const saveMessages = async () => {
            // Filter out potential error messages before saving
            const messagesToSave = messages.filter(msg => !msg.isError);
            if (messagesToSave.length > 0) {
                try {
                    await AsyncStorage.setItem('chatMessages', JSON.stringify(messagesToSave))
                } catch (error) {
                    console.error('Failed to save messages:', error)
                }
            } else {
                // If only the welcome message is left after filtering, clear storage
                try {
                    await AsyncStorage.removeItem('chatMessages');
                } catch (error) {
                    console.error('Failed to clear messages:', error);
                }
            }
        }
        // Debounce saving slightly to avoid rapid writes
        const timerId = setTimeout(() => {
            if (messages.length > 0) saveMessages();
        }, 500);
        return () => clearTimeout(timerId);
    }, [messages])

    const scrollToBottom = () => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isTyping])

    useEffect(() => {
        (async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to make this work!');
                return;
            }
        })();
    }, []);

    const handleImagePick = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.7,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setSelectedImage({
                    uri: result.assets[0].uri,
                    type: result.assets[0].mimeType || 'image/jpeg'
                });
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image. Please try again.');
        }
    };

    const generateResponse = async (userMessage, image = null) => {
        setIsTyping(true)
        let botResponseText = "I apologize, but I encountered an error processing your request. Please try again.";
        let isError = true;

        try {
            let prompt = userMessage || (image ? "Describe this image and extract any relevant financial information." : "How can I help?");
            let imagePart = null;

            if (image) {
                console.log("Fetching image for conversion...");
                const response = await fetch(image.uri);
                const blob = await response.blob();
                console.log("Converting image to base64...");
                const reader = new FileReader();
                const base64Data = await new Promise((resolve, reject) => {
                    reader.onerror = reject;
                    reader.onloadend = () => {
                        if (typeof reader.result === 'string') {
                            resolve(reader.result.split(',')[1]);
                        } else {
                            reject(new Error("Failed to read image data as string"));
                        }
                    };
                    reader.readAsDataURL(blob);
                });
                console.log("Image converted successfully.");
                imagePart = { inlineData: { mimeType: image.type, data: base64Data } };
            }

            console.log("Generating content with prompt:", prompt);
            const result = await model.generateContent([prompt, ...(imagePart ? [imagePart] : [])]);
            const response = await result.response;
            console.log("Received response from API.");
            botResponseText = response.text();
            isError = false;

        } catch (error) {
            console.error('Error generating response:', error);
            botResponseText = `Sorry, an error occurred: ${error.message || "Please try again."}`;
            isError = true;
        } finally {
            setMessages(prev => [...prev, {
                id: `bot-${Date.now()}`,
                text: botResponseText,
                isUser: false,
                timestamp: new Date().toISOString(),
                isError: isError
            }]);
            setIsTyping(false);
        }
    }

    const handleSendMessage = async () => {
        const textToSend = inputMessage.trim();
        const imageToSend = selectedImage;

        if (!textToSend && !imageToSend) return;

        setInputMessage('');
        setSelectedImage(null);

        const newUserMessage = {
            id: `user-${Date.now()}`,
            text: textToSend || (imageToSend ? "Sent an image" : ""),
            isUser: true,
            image: imageToSend?.uri,
            timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, newUserMessage]);

        setTimeout(() => {
            generateResponse(textToSend, imageToSend);
        }, 100);
    }

    const clearChat = () => {
        Alert.alert(
            "Clear Chat History",
            "Are you sure you want to permanently delete all messages?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await AsyncStorage.removeItem('chatMessages');
                            setMessages([{
                                id: `bot-${Date.now()}`,
                                text: "Chat cleared. How can I help you?",
                                isUser: false,
                                timestamp: new Date().toISOString()
                            }]);
                        } catch (error) {
                            console.error("Failed to clear chat:", error);
                            Alert.alert("Error", "Could not clear chat history.");
                        }
                    }
                }
            ]
        );
    };

    const renderMessage = (message, index) => (
        <View key={message.id || index} style={[
            styles.messageContainer,
            message.isUser ? styles.userMessage : styles.botMessage
        ]}>
            {/* Add avatar for non-user messages */}
            {!message.isUser && (
                <View style={styles.avatar}>
                    <Icon
                        name="robot-happy-outline"
                        size={24}
                        color="#4B5563"
                    />
                </View>
            )}

            <View style={[
                styles.messageBubble,
                message.isUser ? styles.userBubble : (message.isError ? styles.errorBubble : styles.botBubble)
            ]}>
                {message.image && (
                    <TouchableOpacity
                        onPress={() => Alert.alert("Image", "Show full image modal? (TODO)")}
                        activeOpacity={0.8}
                    >
                        <Image
                            source={{ uri: message.image }}
                            style={styles.messageImage}
                            resizeMode="cover"
                        />
                    </TouchableOpacity>
                )}
                <Text style={[
                    styles.messageText,
                    message.isUser ? styles.userMessageText : (message.isError ? styles.errorMessageText : styles.botMessageText)
                ]}>
                    {message.text}
                </Text>
                <View style={styles.messageFooter}>
                    <Text style={[
                        styles.timestamp,
                        message.isUser ? styles.userTimestamp : styles.botTimestamp,
                        message.isError ? styles.errorTimestamp : null
                    ]}>
                        {message.timestamp ? formatTime(message.timestamp) : ''}
                    </Text>
                    {!message.isUser && (
                        <TouchableOpacity style={styles.feedbackButton}>
                            <Icon name="thumb-up-outline" size={16} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    )

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header with gradient */}
            <BlurView intensity={90} style={styles.header}>
                <Text style={styles.headerTitle}>BudgetWise AI</Text>
                <TouchableOpacity
                    onPress={clearChat}
                    style={styles.headerButton}
                    disabled={isTyping || messages.length <= 1}
                >
                    <Icon
                        name="trash-can-outline"
                        size={24}
                        color={messages.length <= 1 ? "#D1D5DB" : "#6B7280"}
                    />
                </TouchableOpacity>
            </BlurView>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
            >
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={styles.messagesContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {messages.map((message, index) => renderMessage(message, index))}

                    {isTyping && (
                        <View style={styles.typingIndicatorContainer}>
                            <View style={styles.typingBubble}>
                                <View style={styles.typingDots}>
                                    <Text style={styles.typingDot}>•</Text>
                                    <Text style={[styles.typingDot, { opacity: typingDots.length > 0 ? 1 : 0.3 }]}>•</Text>
                                    <Text style={[styles.typingDot, { opacity: typingDots.length > 1 ? 1 : 0.3 }]}>•</Text>
                                </View>
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* Input area with floating effect */}
                <View style={[styles.inputAreaContainer, { marginBottom: insets.bottom }]}>
                    {selectedImage && (
                        <View style={styles.selectedImagePreviewContainer}>
                            <Image
                                source={{ uri: selectedImage.uri }}
                                style={styles.selectedImage}
                            />
                            <TouchableOpacity
                                onPress={() => setSelectedImage(null)}
                                style={styles.removeImageButton}
                            >
                                <Icon name="close-circle" size={20} color="#FDB347" />
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.inputWrapper}>
                        <TouchableOpacity
                            onPress={handleImagePick}
                            style={styles.iconButton}
                            disabled={isTyping}
                        >
                            <Icon
                                name="image-plus"
                                size={24}
                                color={isTyping ? "#D1D5DB" : "#FDB347"}
                            />
                        </TouchableOpacity>

                        <CustomInput
                            placeholder="Ask BudgetWise..."
                            value={inputMessage}
                            onChangeText={setInputMessage}
                            style={styles.input}
                            onSubmitEditing={handleSendMessage}
                            editable={!isTyping}
                            multiline
                        />

                        <TouchableOpacity
                            onPress={handleSendMessage}
                            style={[
                                styles.sendButton,
                                (isTyping || (!inputMessage.trim() && !selectedImage)) && styles.sendButtonDisabled
                            ]}
                            disabled={isTyping || (!inputMessage.trim() && !selectedImage)}
                        >
                            <Icon
                                name="send"
                                size={24}
                                color={isTyping || (!inputMessage.trim() && !selectedImage) ? '#D1D5DB' : '#FFFFFF'}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    )
}

export default ChatBot

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginLeft: 8,
    },
    headerButton: {
        padding: 8,
        marginRight: 4,
    },
    keyboardView: {
        flex: 1,
    },
    messagesContainer: {
        flex: 1,
        paddingBottom: 8,
    },
    messagesContent: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 12,
    },
    messageContainer: {
        marginVertical: 6,
        maxWidth: '82%',
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    userMessage: {
        alignSelf: 'flex-end',
        // marginRight: 16,
    },
    botMessage: {
        alignSelf: 'flex-start',

    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    messageBubble: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    userBubble: {
        backgroundColor: '#FDB347',
        borderTopRightRadius: 4,
    },
    botBubble: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 4,
    },
    errorBubble: {
        backgroundColor: '#FEE2E2',
        borderColor: '#FCA5A5',
        borderWidth: 1,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    userMessageText: {
        color: '#FFFFFF',
    },
    botMessageText: {
        color: '#1F2937',
    },
    errorMessageText: {
        color: '#991B1B',
    },
    messageImage: {
        width: 200,
        height: 200,
        borderRadius: 12,
        marginBottom: 6,
    },
    messageFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 2,
    },
    timestamp: {
        fontSize: 10,
        color: '#9CA3AF',
    },
    userTimestamp: {
        color: '#FDE68A',
    },
    botTimestamp: {
        color: '#9CA3AF',
    },
    errorTimestamp: {
        color: '#DC2626',
    },
    feedbackButton: {
        marginLeft: 10,
    },
    selectedImagePreviewContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 8,
        marginBottom: 10,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    selectedImage: {
        width: 40,
        height: 40,
        borderRadius: 8,
    },
    removeImageButton: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 2,
    },
    inputAreaContainer: {
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 6,
        backgroundColor: 'transparent',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingHorizontal: 12,
        paddingVertical: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    iconButton: {
        padding: 6,
        marginHorizontal: 2,
    },
    input: {
        flex: 1,
        marginHorizontal: 8,
        maxHeight: 100,
        fontSize: 16,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FDB347',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 4,
    },
    sendButtonDisabled: {
        backgroundColor: '#E5E7EB',
    },
    typingIndicatorContainer: {
        marginTop: 8,
    },
    typingBubble: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignSelf: 'flex-start',
    },
    typingDots: {
        flexDirection: 'row',
    },
    typingDot: {
        fontSize: 24,
        color: '#4B5563',
        marginHorizontal: 2,
    },
})