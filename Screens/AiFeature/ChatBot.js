import { StyleSheet, Text, View, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Image, TouchableOpacity, Alert } from 'react-native'
import React, { useState, useRef, useEffect } from 'react'
import { GEMINI_API_KEY } from '@env'
import { GoogleGenerativeAI } from '@google/generative-ai'
import CustomInput from '../../Components/InputField/CustomInput'
import PrimaryButton from '../../Components/Buttons/PrimaryButton'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import * as ImagePicker from 'expo-image-picker'
import { StatusBar } from 'expo-status-bar'

const ChatBot = () => {
    const [messages, setMessages] = useState([])
    const [inputMessage, setInputMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [selectedImage, setSelectedImage] = useState(null)
    const scrollViewRef = useRef(null)
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const scrollToBottom = () => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

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
                quality: 0.8,
            });

            if (!result.canceled) {
                setSelectedImage({
                    uri: result.assets[0].uri,
                    type: 'image/jpeg'
                });
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image. Please try again.');
        }
    };

    const generateResponse = async (userMessage, imageUri = null) => {
        setIsLoading(true)
        try {
            let prompt = userMessage;
            let imageData = null;

            if (imageUri) {
                // Convert image to base64
                const response = await fetch(imageUri);
                const blob = await response.blob();
                const reader = new FileReader();
                imageData = await new Promise((resolve) => {
                    reader.onloadend = () => resolve(reader.result.split(',')[1]);
                    reader.readAsDataURL(blob);
                });
            }

            const result = await model.generateContent([
                prompt,
                ...(imageData ? [{ inlineData: { mimeType: "image/jpeg", data: imageData } }] : [])
            ]);

            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Error:', error);
            return "I apologize, but I encountered an error. Please try again.";
        } finally {
            setIsLoading(false);
        }
    }

    const handleSendMessage = async () => {
        if (!inputMessage.trim() && !selectedImage) return;

        const userMessage = inputMessage.trim();
        setInputMessage('');

        // Add user message to chat
        setMessages(prev => [...prev, {
            text: userMessage || "Sent an image",
            isUser: true,
            image: selectedImage?.uri
        }]);

        // Get and add bot response
        const botResponse = await generateResponse(userMessage || "Extract the data/values from the image", selectedImage?.uri);
        setMessages(prev => [...prev, { text: botResponse, isUser: false }]);

        // Clear selected image
        setSelectedImage(null);
    }

    const renderMessage = (message, index) => (
        <View key={index} style={[
            styles.messageContainer,
            message.isUser ? styles.userMessage : styles.botMessage
        ]}>
            <View style={[
                styles.messageBubble,
                message.isUser ? styles.userBubble : styles.botBubble
            ]}>
                {message.image && (
                    <Image
                        source={{ uri: message.image }}
                        style={styles.messageImage}
                        resizeMode="cover"
                    />
                )}
                <Text style={[
                    styles.messageText,
                    message.isUser ? styles.userMessageText : styles.botMessageText
                ]}>
                    {message.text}
                </Text>
            </View>
        </View>
    )

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <StatusBar style="dark" />
            <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
            >
                {messages.map((message, index) => renderMessage(message, index))}
                {isLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#FDB347" />
                        <Text style={styles.loadingText}>Thinking...</Text>
                    </View>
                )}
            </ScrollView>

            <View style={styles.inputContainer}>
                <TouchableOpacity
                    onPress={handleImagePick}
                    style={styles.imageButton}
                >
                    <Icon name="image-plus" size={24} color="#FDB347" />
                </TouchableOpacity>
                <CustomInput
                    placeholder="Type your message..."
                    value={inputMessage}
                    onChangeText={setInputMessage}
                    leftIcon="message-text-outline"
                    style={styles.input}
                    onSubmitEditing={handleSendMessage}
                />
                {selectedImage && (
                    <View style={styles.selectedImageContainer}>
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
                <PrimaryButton
                    title="Send"
                    onPress={handleSendMessage}
                    style={styles.sendButton}
                    disabled={isLoading || (!inputMessage.trim() && !selectedImage)}
                />
            </View>
        </KeyboardAvoidingView>
    )
}

export default ChatBot

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 16,
        paddingBottom: 80,
    },
    messageContainer: {
        marginVertical: 4,
        maxWidth: '80%',
    },
    userMessage: {
        alignSelf: 'flex-end',
    },
    botMessage: {
        alignSelf: 'flex-start',
    },
    messageBubble: {
        padding: 12,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    userBubble: {
        backgroundColor: '#FDB347',
    },
    botBubble: {
        backgroundColor: '#F3F4F6',
    },
    messageText: {
        fontSize: 16,
    },
    userMessageText: {
        color: '#FFFFFF',
    },
    botMessageText: {
        color: '#1F2937',
    },
    messageImage: {
        width: 200,
        height: 200,
        borderRadius: 8,
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        alignItems: 'center',
    },
    imageButton: {
        padding: 8,
        marginRight: 8,
    },
    input: {
        flex: 1,
        marginRight: 8,
    },
    sendButton: {
        width: 80,
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    loadingText: {
        marginLeft: 8,
        color: '#6B7280',
        fontSize: 14,
    },
    selectedImageContainer: {
        position: 'absolute',
        bottom: 80,
        left: 16,
        right: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 8,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    selectedImage: {
        width: 60,
        height: 60,
        borderRadius: 4,
        marginRight: 8,
    },
    removeImageButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
    },
})