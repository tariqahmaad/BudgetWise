import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateChatResponse, generateResponse } from '../services/geminiService';

/**
 * Custom hook for managing AI chat interactions
 */
const useAIChat = (user, transactions, accounts, userProfile, currencySymbol = '$', formatAmount = null) => {
    const [chatHistory, setChatHistory] = useState([]);
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [suggestedQuestions, setSuggestedQuestions] = useState([]);
    const CHAT_STORAGE_KEY = `@budgetwise_ai_chat_${user?.uid || 'guest'}`;

    // Load chat history on mount
    useEffect(() => {
        const loadChat = async () => {
            try {
                const saved = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
                if (saved) {
                    const parsedChat = JSON.parse(saved);
                    setChatHistory(parsedChat);
                    return parsedChat.length > 0;
                }
                return false;
            } catch (e) {
                console.warn('Failed to load chat history:', e);
                return false;
            }
        };
        if (user) loadChat();
    }, [user, CHAT_STORAGE_KEY]);

    // Save chat history whenever it changes
    useEffect(() => {
        const saveChat = async () => {
            try {
                await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatHistory));
            } catch (e) {
                console.warn('Failed to save chat history:', e);
            }
        };
        if (user) saveChat();
    }, [chatHistory, user, CHAT_STORAGE_KEY]);

    // Generate dynamic suggested questions based on user data
    const generateDynamicQuestions = (weeklyTotals, totalSpent, topCategories, largestTransaction) => {
        const allQuestions = [
            // Budget questions
            `How can I budget better for ${new Date().toLocaleString('default', { month: 'long' })}?`,
            `What's a good monthly budget for someone like me?`,
            // Spending pattern questions
            weeklyTotals?.length > 0 ?
                `Why did I spend more in Week ${weeklyTotals.indexOf(Math.max(...weeklyTotals)) + 1}?` : null,
            topCategories?.[0]?.category ?
                `How can I reduce my ${topCategories[0].category} spending?` : null,
            // Saving questions
            `How much should I save each month?`,
            `What's the 50/30/20 budget rule?`,
            // Specific insights
            `How does my spending compare to others?`,
            `Compare my spending this month to last month.`,
            largestTransaction ?
                `Was my ${formatAmount ? formatAmount(largestTransaction.amount) : `${currencySymbol}${largestTransaction.amount?.toFixed(2)}`} purchase a good decision?` : null,
            topCategories?.[0] ?
                `How can I spend less on ${topCategories[0].category}?` : null,
            topCategories?.[1] ?
                `Is my spending on ${topCategories[1].category} normal?` : null,
            // Financial advice
            `What are some easy ways to save money?`,
            `How can I start investing with a small budget?`,
            // Future planning
            `How should I plan for big purchases?`,
            `What financial goals should I set?`
        ].filter(Boolean); // Remove any null entries

        // Select 3 random questions
        const selectedQuestions = [];
        const questionsCopy = [...allQuestions];

        for (let i = 0; i < 3 && questionsCopy.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * questionsCopy.length);
            selectedQuestions.push(questionsCopy[randomIndex]);
            questionsCopy.splice(randomIndex, 1);
        }

        return selectedQuestions;
    };

    // Function to handle sending a message to the AI
    const handleSend = useCallback(async (
        parseTransactionFromAiResponse,
        extractDescriptionKeywordWithGemini,
        inferCategoryWithGemini,
        setPendingAiTransaction,
        weeklyTotals,
        totalSpent,
        topCategories,
        largestTransaction
    ) => {
        console.log('[AIScreen Send LOG] handleSend called. Checking conditions...');

        if (message.trim() && userProfile && accounts) {
            try {
                const userMessageObj = { // Renamed to avoid conflict with message state
                    role: 'user',
                    parts: [{ text: message }]
                };
                const currentChatHistory = [...chatHistory, userMessageObj];

                setChatHistory(currentChatHistory);
                setMessage('');
                setIsTyping(true);

                const transactionSummary = {
                    weeklyTotals,
                    totalSpent,
                    topCategories,
                    largestTransaction
                };

                const aiResponse = await generateChatResponse(
                    currentChatHistory,
                    userProfile,
                    transactionSummary,
                    transactions, // Prop to useAIChat
                    accounts,    // Prop to useAIChat
                    currencySymbol // Pass currency symbol to AI
                );

                console.log('[AI Chat] Raw AI Response:', aiResponse); // Log raw AI response
                let aiSuggestedTx = parseTransactionFromAiResponse(aiResponse, message);
                console.log('[AI Chat] Parsed AI Suggested TX:', aiSuggestedTx); // Log parsed transaction

                if (aiSuggestedTx && aiSuggestedTx.amount) {
                    console.log('[AI Chat] Valid pending transaction found, attempting to set:', aiSuggestedTx); // Log before setting
                    if (!aiSuggestedTx.category || aiSuggestedTx.category === '') {
                        aiSuggestedTx.category = await inferCategoryWithGemini(aiSuggestedTx.description);
                    }
                    if (!aiSuggestedTx.description || aiSuggestedTx.description === '') {
                        // If description is still empty, use category or a default.
                        aiSuggestedTx.description = aiSuggestedTx.category || 'AI Suggested Transaction';
                    }
                    // Extract keyword only if description is not a generic placeholder
                    if (aiSuggestedTx.description !== 'AI Suggested Transaction') {
                        aiSuggestedTx.description = await extractDescriptionKeywordWithGemini(aiSuggestedTx.description);
                    }
                    setPendingAiTransaction(aiSuggestedTx);

                    // Format date for display in a more user-friendly way
                    let displayDate = aiSuggestedTx.date;
                    try {
                        // Convert YYYY-MM-DD to a more readable format
                        const dateObj = new Date(aiSuggestedTx.date);
                        if (!isNaN(dateObj)) {
                            displayDate = dateObj.toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            });
                        }
                    } catch (e) {
                        // If date formatting fails, just use the original date string
                        console.warn('Error formatting date for display:', e);
                    }

                    const confirmMsg = {
                        role: 'model',
                        parts: [{ text: `📝 I detected a transaction suggestion:\n\n- Amount: ${formatAmount ? formatAmount(aiSuggestedTx.amount) : `${currencySymbol}${aiSuggestedTx.amount}`}\n- Category: ${aiSuggestedTx.category}\n- Description: ${aiSuggestedTx.description}\n- Account: ${aiSuggestedTx.accountObj ? aiSuggestedTx.accountObj.name : (accounts[0]?.name || 'Main')}\n- Date: ${displayDate}\n\nWould you like me to add this transaction to your account? (yes/no)` }]
                    };
                    setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: aiResponse }] }, confirmMsg]);
                } else {
                    const aiMessage = {
                        role: 'model',
                        parts: [{ text: aiResponse }]
                    };
                    setChatHistory(prev => [...prev, aiMessage]);
                }

                const newQuestions = generateDynamicQuestions(weeklyTotals, totalSpent, topCategories, largestTransaction);
                setSuggestedQuestions(newQuestions);
            } catch (error) {
                console.error('[AIScreen Send LOG] Error in handleSend:', error);
                setChatHistory(prev => [...prev, {
                    role: 'model',
                    parts: [{ text: typeof error === 'string' ? error : 'Sorry, I encountered an error. Please try again.' }]
                }]);
            } finally {
                setIsTyping(false);
            }
        } else {
            console.log('[AIScreen Send LOG] Conditions not met, message not sent.');
        }
    }, [
        message, userProfile, accounts, chatHistory, transactions, // State and props used
        setChatHistory, setMessage, setIsTyping, setSuggestedQuestions, // Stable setters
        generateDynamicQuestions // Function from this hook (currently not useCallback-wrapped but stable if not depending on hook state for its own definition)
        // External functions like parseTransactionFromAiResponse, generateChatResponse are dependencies if they change reference.
        // For now, assuming they are stable from their source or their change implies re-render anyway.
    ]);

    // Function to handle command responses (like yes/no to transaction add)
    const handleFollowUpCommand = useCallback((
        text,
        extractedTransactions,
        setExtractedTransactions,
        saveExtractedTransactions,
        pendingAiTransaction,
        saveAiSuggestedTransaction
    ) => {
        const lowerText = text.toLowerCase();
        console.log('[AI Chat] handleFollowUpCommand called. Text:', lowerText, 'Pending AI Tx:', pendingAiTransaction); // Log entry and pending TX

        if (extractedTransactions.length > 0 &&
            (lowerText.includes('yes') || lowerText.includes('save') || lowerText.includes('add transactions') || lowerText.includes('add them'))) {
            saveExtractedTransactions(setChatHistory);
            return true;
        }
        if (extractedTransactions.length > 0 &&
            (lowerText.includes('no') || lowerText.includes('don\'t save') || lowerText.includes('do not save'))) {
            setExtractedTransactions([]);
            const msg = { role: 'model', parts: [{ text: "No problem. The transactions won't be added to your account." }] };
            setChatHistory(prev => [...prev, msg]);
            return true;
        }
        if (pendingAiTransaction && (lowerText.includes('yes') || lowerText.includes('add'))) {
            console.log('[AI Chat] User confirmed AI transaction. Saving...'); // Log confirmation
            saveAiSuggestedTransaction(setChatHistory);
            return true;
        }
        if (pendingAiTransaction && (lowerText.includes('no') || lowerText.includes('don\'t') || lowerText.includes('do not'))) {
            const msg = { role: 'model', parts: [{ text: "No problem. The transaction won\'t be added to your account." }] };
            setChatHistory(prev => [...prev, msg]);
            setPendingAiTransaction(null); // Clear the pending transaction
            console.log('[AI Chat] User denied AI transaction. Cleared pending transaction.'); // Log denial
            return true;
        }
        return false;
    }, [setChatHistory]); // Added setPendingAiTransaction to dependencies as it's now called here.
    // Other args are direct inputs, not from hook closure.

    // Function to handle slash commands entered by the user
    const handleSlashCommand = useCallback((
        currentMessage,
        saveTransactionsFunction,
        pendingTransaction,
        savePendingTransactionFunction
    ) => {
        const lowerCaseMessage = currentMessage.toLowerCase();
        console.log('[AI Chat] handleSlashCommand called with message:', lowerCaseMessage, 'Pending transaction:', pendingTransaction);

        if (lowerCaseMessage.startsWith('/addtransactions')) {
            const jsonString = currentMessage.substring('/addtransactions'.length).trim();
            if (jsonString) {
                try {
                    const transactionsToAdd = JSON.parse(jsonString);
                    if (transactionsToAdd && transactionsToAdd.length > 0) {
                        saveTransactionsFunction(transactionsToAdd, setChatHistory);
                        return true;
                    } else {
                        const errMessage = { role: 'model', parts: [{ text: "No transactions provided to add." }] };
                        setChatHistory(prev => [...prev, errMessage]);
                        return true;
                    }
                } catch (e) {
                    console.error("Failed to parse transactions from /addtransactions command:", e);
                    const errMessage = { role: 'model', parts: [{ text: "Error: Could not understand the transaction data provided." }] };
                    setChatHistory(prev => [...prev, errMessage]);
                    return true;
                }
            } else {
                const errMessage = { role: 'model', parts: [{ text: "Usage: /addtransactions [json_array_of_transactions]" }] };
                setChatHistory(prev => [...prev, errMessage]);
                return true;
            }
        }
        if (lowerCaseMessage.startsWith('/addnewtransaction')) {
            if (pendingTransaction) {
                savePendingTransactionFunction(setChatHistory);
                return true;
            }
        }

        // If it's not a specific slash command, check if it's a follow-up command (yes/no to pending transaction)
        return handleFollowUpCommand(
            currentMessage,
            [], // Empty array for extractedTransactions as it's not relevant here
            () => { }, // Empty function for setExtractedTransactions as it's not used
            saveTransactionsFunction,
            pendingTransaction,
            savePendingTransactionFunction
        );
    }, [setChatHistory, handleFollowUpCommand]); // Add handleFollowUpCommand to dependencies

    // Function to clear chat history
    const clearChat = useCallback(async (resetAnimations) => {
        await resetAnimations(); // resetAnimations is an external function passed as arg
        setChatHistory([]);
        try {
            await AsyncStorage.removeItem(CHAT_STORAGE_KEY);
        } catch (e) {
            console.warn('Failed to clear chat history:', e);
        }
    }, [CHAT_STORAGE_KEY, setChatHistory]); // CHAT_STORAGE_KEY depends on user prop

    return {
        chatHistory,
        setChatHistory,
        message,
        setMessage,
        isTyping,
        setIsTyping,
        suggestedQuestions,
        setSuggestedQuestions,
        generateDynamicQuestions,
        handleSend,
        handleFollowUpCommand,
        handleSlashCommand,
        clearChat
    };
};

export default useAIChat; 