import React from 'react';
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * DocumentProcessorComponent provides methods for document processing
 * This is a presentational component (no UI)
 */
const DocumentProcessorComponent = ({
    setIsProcessingDocument,
    extractTransactionsFromDocument,
    inferCategoryWithGemini,
    setChatHistory,
    setExtractedTransactions,
    parseTransactionDate,
    formatExtractedTransactions,
}) => {

    // Function to handle document picking for statements/receipts
    const handleDocumentPick = async () => {
        try {
            // Directly pick and process the document, defaulting to not a statement (e.g., a receipt)
            pickAndProcessDocument(false);
        } catch (error) {
            console.error('Error in document pick and process initiation:', error);
            // Optionally, inform the user about the error if the process couldn't even start
            Alert.alert(
                "Error",
                "Could not initiate document upload. Please try again.",
                [{ text: "OK" }]
            );
        }
    };

    // Handle document picking and processing after user selects document type
    const pickAndProcessDocument = async (isStatement) => {
        try {
            // Pick document (image or PDF)
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'],
                copyToCacheDirectory: true,
            });

            if (result.canceled) {
                console.log('Document picking was canceled');
                return;
            }

            setIsProcessingDocument(true);

            // Get the picked asset
            const asset = result.assets[0];
            console.log('Picked document:', asset);

            // Determine if it's an image or PDF
            const isImage = asset.mimeType.startsWith('image/');
            const isPDF = asset.mimeType === 'application/pdf';

            if (isImage) {
                // For images, we need to resize/compress to make sure it's not too large for the API
                const manipResult = await ImageManipulator.manipulateAsync(
                    asset.uri,
                    [{ resize: { width: 1500 } }],
                    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
                );

                // Read the file as base64
                const base64Image = await FileSystem.readAsStringAsync(manipResult.uri, {
                    encoding: FileSystem.EncodingType.Base64,
                });

                // Extract transactions using Gemini Vision API
                processDocumentWithGemini(base64Image, asset.name, isStatement);
            } else if (isPDF) {
                // For PDFs, we'd need to convert to images first
                // This would typically be done on a server, as React Native doesn't have good PDF->image conversion
                // For now, inform user about PDF limitation
                setIsProcessingDocument(false);
                Alert.alert(
                    "PDF Processing",
                    "Currently we can only process images directly. For PDFs, please take screenshots of your statement pages and upload them as images.",
                    [{ text: "OK" }]
                );
            } else {
                setIsProcessingDocument(false);
                Alert.alert(
                    "Unsupported File Type",
                    "Please upload an image or PDF file.",
                    [{ text: "OK" }]
                );
            }
        } catch (error) {
            console.error('Error picking document:', error);
            setIsProcessingDocument(false);
            Alert.alert(
                "Error",
                "Failed to process your document. Please try again.",
                [{ text: "OK" }]
            );
        }
    };

    // Process document with Gemini and handle the result
    const processDocumentWithGemini = async (base64Image, fileName, isStatement = true, addImageMessage = true) => {
        try {
            // Add the uploaded image to the chat history (only if not a retry)
            if (addImageMessage) {
                const documentType = isStatement ? "bank statement" : "receipt";
                const imageMessage = {
                    role: 'user',
                    parts: [{
                        type: 'image',
                        imageData: base64Image,
                        fileName: fileName,
                        text: `📄 Uploaded ${documentType}`,
                        documentType: documentType
                    }]
                };
                setChatHistory(prev => [...prev, imageMessage]);
            }

            // Extract transactions using Gemini
            const extractionResult = await extractTransactionsFromDocument(base64Image, isStatement);
            console.log('Extraction result:', extractionResult);

            let formattedTransactions = [];
            if (extractionResult.success && extractionResult.transactions.length > 0) {
                // Format transactions for display and validate data
                for (const tx of extractionResult.transactions) {
                    // Parse and validate amount
                    let amount = 0;
                    if (typeof tx.amount === 'number') {
                        amount = tx.amount;
                    } else if (typeof tx.amount === 'string') {
                        // Remove currency symbols and commas, then parse
                        const cleanAmount = tx.amount.replace(/[$,£€]/g, '').trim();
                        amount = parseFloat(cleanAmount);
                    }

                    // Only include transactions with valid amounts
                    if (!isNaN(amount) && amount !== 0) {
                        // Always use YYYY-MM-DD for date
                        let dateStr = tx.date;
                        if (!dateStr) {
                            dateStr = new Date().toISOString().split('T')[0];
                        } else {
                            // Try to parse and reformat
                            const d = parseTransactionDate(tx.date);
                            dateStr = d.toISOString().split('T')[0];
                        }
                        // Add with possibly missing category for now
                        formattedTransactions.push({
                            date: dateStr,
                            description: tx.description || 'Unknown',
                            amount: Math.abs(amount), // Ensure positive amount
                            currency: tx.currency || 'USD', // Default to USD if not provided
                            category: tx.category || '',
                        });
                    }
                }

                // Infer category for any missing/empty/Uncategorized
                for (let i = 0; i < formattedTransactions.length; i++) {
                    if (!formattedTransactions[i].category || formattedTransactions[i].category === 'Uncategorized') {
                        const inferred = await inferCategoryWithGemini(formattedTransactions[i].description);
                        formattedTransactions[i].category = inferred || 'Uncategorized';
                    }
                }

                if (formattedTransactions.length === 0) {
                    // No valid transactions found
                    const documentType = isStatement ? "bank statement" : "receipt";
                    const errorMessage = {
                        role: 'model',
                        parts: [{ text: `I couldn't extract any valid transactions from your ${documentType}. Please try uploading a clearer image.` }]
                    };
                    setChatHistory(prev => [...prev, errorMessage]);
                    return;
                }

                // Instead of setting extractedTransactions for a modal,
                // directly display the transactions in the chat with action buttons
                const transactionsDisplay = formattedTransactions.map((tx, index) =>
                    `${index + 1}. Date: ${tx.date}\n   Description: ${tx.description}\n   Amount: ${tx.amount} ${tx.currency}\n   Category: ${tx.category}`
                ).join('\n\n');

                // Create a chat message with the transaction details and action buttons
                const documentType = isStatement ? "bank statement" : "receipt";
                const transactionsMessage = {
                    role: 'model',
                    parts: [{
                        text: `✅ I extracted the following transactions from your ${documentType}:\n\n${transactionsDisplay}\n\nWould you like to add these transactions to your account?`,
                        transactionData: formattedTransactions,
                        showActionButtons: true // This flag will be used in ChatComponent to display buttons
                    }]
                };

                setChatHistory(prev => [...prev, transactionsMessage]);

            } else {
                // Handle extraction failure with specific error handling
                let errorMessage;

                if (extractionResult.error) {
                    const { type, message, retryable } = extractionResult.error;

                    let displayMessage = message;
                    let showRetryButton = retryable;
                    let icon = '❌';

                    switch (type) {
                        case 'service_unavailable':
                            icon = '⏳';
                            displayMessage = `${message}\n\nThe AI service is experiencing high demand. This usually resolves within a few minutes.`;
                            break;
                        case 'rate_limit':
                            icon = '⏱️';
                            displayMessage = `${message}\n\nWe've temporarily reached our processing limit.`;
                            break;
                        case 'network_error':
                            icon = '🌐';
                            displayMessage = `${message}\n\nPlease ensure you have a stable internet connection.`;
                            break;
                        case 'auth_error':
                            icon = '🔐';
                            displayMessage = `${message}\n\nThis appears to be a configuration issue that requires attention from our team.`;
                            showRetryButton = false;
                            break;
                        case 'parse_error':
                            icon = '📄';
                            displayMessage = `I received a response but couldn't interpret it as transaction data.\n\nPlease try uploading a clearer image of your ${documentType}.`;
                            showRetryButton = false;
                            break;
                        default:
                            icon = '❌';
                            displayMessage = `${message}\n\nPlease try again or contact support if the issue persists.`;
                    }

                    errorMessage = {
                        role: 'model',
                        parts: [{
                            text: `${icon} **Processing Failed**\n\n${displayMessage}`,
                            errorType: type,
                            retryable: showRetryButton,
                            retryData: showRetryButton ? { base64Image, fileName, isStatement } : null
                        }]
                    };
                } else {
                    // Fallback for missing error details
                    const documentType = isStatement ? "bank statement" : "receipt";
                    errorMessage = {
                        role: 'model',
                        parts: [{
                            text: `I couldn't extract structured transaction data from your ${documentType}. Please ensure the image is clear and legible.\n\nIf the issue persists, the document format might be too complex for automated extraction at this time.`
                        }]
                    };
                }

                setChatHistory(prev => [...prev, errorMessage]);
            }
        } catch (error) {
            console.error('Error processing document with Gemini:', error);

            // Create error message with retry option for unexpected errors
            const errorMessage = {
                role: 'model',
                parts: [{
                    text: "❌ **Unexpected Error**\n\nI encountered an unexpected error while processing your document. This might be a temporary issue.\n\nPlease try again with a clearer image.",
                    errorType: 'unexpected_error',
                    retryable: true,
                    retryData: { base64Image, fileName, isStatement }
                }]
            };

            setChatHistory(prev => [...prev, errorMessage]);
        } finally {
            setIsProcessingDocument(false);
        }
    };

    // Function to retry document processing (can be called from chat UI)
    const retryDocumentProcessing = async (retryData) => {
        if (!retryData || !retryData.base64Image) {
            console.error('Invalid retry data provided');
            return;
        }

        console.log('[Document Processor] Retrying document processing...');
        setIsProcessingDocument(true);

        // Add the image message again for the retry attempt
        const documentType = retryData.isStatement ? "bank statement" : "receipt";
        const retryImageMessage = {
            role: 'user',
            parts: [{
                type: 'image',
                imageData: retryData.base64Image,
                fileName: retryData.fileName,
                text: `📄 Retrying ${documentType}`,
                documentType: documentType
            }]
        };
        setChatHistory(prev => [...prev, retryImageMessage]);

        // Don't add another image message since we just added one above
        await processDocumentWithGemini(retryData.base64Image, retryData.fileName, retryData.isStatement, false);
    };

    return {
        handleDocumentPick,
        retryDocumentProcessing,
    };
};

export default DocumentProcessorComponent; 