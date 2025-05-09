import React, { useState, useEffect, useContext, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Dimensions,
    Platform,
    KeyboardAvoidingView,
    ActivityIndicator,
    FlatList,
    Alert,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import ScreenWrapper from '../../Components/ScreenWrapper';
import { AuthContext } from '../../context/AuthProvider';
import {
    auth,
    firestore,
    collection,
    query,
    where,
    getDocs,
    Timestamp,
    doc,
    getDoc,
    onSnapshot,
    addDoc
} from '../../firebase/firebaseConfig';
import { generateChatResponse, extractTransactionsFromDocument, generateResponse } from '../../services/geminiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Markdown from 'react-native-markdown-display';
// Added imports for document picking and file handling
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

const screenWidth = Dimensions.get('window').width;


// Chart configuration - Updated for exact styling
const chartConfig = {
    backgroundGradientFrom: COLORS.appBackground,
    backgroundGradientTo: COLORS.appBackground,
    color: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
    labelColor: (opacity = 1) => COLORS.textSecondary || `rgba(100, 116, 139, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    propsForDots: {
        r: '4',
        strokeWidth: '2',
        stroke: COLORS.primary,
        fill: COLORS.white,
    },
    propsForBackgroundLines: {
        strokeDasharray: '',
        stroke: COLORS.lightGray || 'rgba(100, 116, 139, 0.15)',
        strokeWidth: 1,
    },
    decimalPlaces: 0,
    paddingRight: 10,
    paddingLeft: 0,
    paddingTop: 16,
    paddingBottom: 8,
};

const AIScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);
    const [message, setMessage] = useState('');
    const [chartData, setChartData] = useState({ labels: [], datasets: [{ data: [] }] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [insightMessage, setInsightMessage] = useState('Analyzing your spending trends...');
    const [chatHistory, setChatHistory] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [showChart, setShowChart] = useState(true);
    const [weeklyTotals, setWeeklyTotals] = useState([]);
    const [totalSpent, setTotalSpent] = useState(0);
    const [userProfile, setUserProfile] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [topCategories, setTopCategories] = useState([]);
    const [largestTransaction, setLargestTransaction] = useState(null);
    const [suggestedQuestions, setSuggestedQuestions] = useState([]);
    const CHAT_STORAGE_KEY = `@budgetwise_ai_chat_${user?.uid || 'guest'}`;
    const INSIGHTS_STORAGE_KEY = '@budgetwise_insights';
    const chatListRef = useRef(null);
    const [isProcessingDocument, setIsProcessingDocument] = useState(false);
    const [extractedTransactions, setExtractedTransactions] = useState([]);
    const [pendingAiTransaction, setPendingAiTransaction] = useState(null);

    // Helper: is timestamp from current month?
    function isCurrentMonth(timestamp) {
        if (!timestamp) return false;
        const now = new Date();
        const ts = new Date(timestamp);
        return now.getFullYear() === ts.getFullYear() && now.getMonth() === ts.getMonth();
    }

    useEffect(() => {
        let unsubscribe = null;
        let didUnmount = false;
        const listenAndFetch = async () => {
            if (!user) {
                setError("User not logged in.");
                setInsightMessage('Login to see your spending insights.');
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);
            setInsightMessage('Loading spending data...');
            // 1. Try to load cached insights
            try {
                const cached = await AsyncStorage.getItem(INSIGHTS_STORAGE_KEY);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (parsed && isCurrentMonth(parsed.timestamp) && parsed.userId === user.uid) {
                        setUserProfile(parsed.userProfile);
                        setAccounts(parsed.accounts);
                        setTransactions(parsed.transactions);
                        setWeeklyTotals(parsed.weeklyTotals);
                        setTotalSpent(parsed.totalSpent);
                        setTopCategories(parsed.topCategories);
                        setLargestTransaction(parsed.largestTransaction);
                        setInsightMessage(parsed.insightMessage);
                        setChartData({
                            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                            datasets: [
                                {
                                    data: parsed.weeklyTotals,
                                    color: (opacity = 1) => COLORS.primary || `rgba(0, 122, 255, ${opacity})`,
                                    strokeWidth: 3,
                                },
                            ],
                        });
                        setIsLoading(false);
                        console.log('[AIScreen Fetch LOG] Loaded insights from cache.');
                        // Set up real-time listener for changes
                    }
                }
            } catch (cacheErr) {
                console.warn('[AIScreen Fetch LOG] Failed to load insights cache:', cacheErr);
            }
            // Set up Firestore real-time listener for transactions
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            const startTimestamp = Timestamp.fromDate(startOfMonth);
            const endTimestamp = Timestamp.fromDate(endOfMonth);
            const transactionsRef = collection(firestore, 'users', user.uid, 'transactions');
            const q = query(transactionsRef,
                where('createdAt', '>=', startTimestamp),
                where('createdAt', '<=', endTimestamp)
            );
            unsubscribe = onSnapshot(q, async (querySnapshot) => {
                if (didUnmount) return;
                const fetchedTransactions = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    fetchedTransactions.push({
                        id: doc.id,
                        ...data,
                        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null
                    });
                });
                // Fetch user profile and accounts as before
                let fetchedUserProfile = null;
                try {
                    const userDocRef = doc(firestore, 'users', user.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        fetchedUserProfile = userDocSnap.data();
                    } else {
                        fetchedUserProfile = { name: 'User' };
                    }
                } catch (profileError) {
                    fetchedUserProfile = { name: 'User' };
                }
                let fetchedAccounts = [];
                try {
                    const accountsRef = collection(firestore, 'users', user.uid, 'accounts');
                    const accountsSnapshot = await getDocs(accountsRef);
                    accountsSnapshot.forEach((doc) => {
                        fetchedAccounts.push({ id: doc.id, ...doc.data() });
                    });
                } catch (accountError) { }
                const currentWeeklyTotals = [0, 0, 0, 0];
                const weekLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
                fetchedTransactions.forEach(tx => {
                    if (tx.amount && typeof tx.amount === 'number' && tx.createdAt) {
                        const dayOfMonth = tx.createdAt.getDate();
                        let weekIndex;
                        if (dayOfMonth <= 7) weekIndex = 0;
                        else if (dayOfMonth <= 14) weekIndex = 1;
                        else if (dayOfMonth <= 21) weekIndex = 2;
                        else weekIndex = 3;
                        currentWeeklyTotals[weekIndex] += tx.amount;
                    }
                });
                setWeeklyTotals(currentWeeklyTotals);
                setChartData({
                    labels: weekLabels,
                    datasets: [
                        {
                            data: currentWeeklyTotals,
                            color: (opacity = 1) => COLORS.primary || `rgba(0, 122, 255, ${opacity})`,
                            strokeWidth: 3,
                        },
                    ],
                });
                const currentTotalSpent = currentWeeklyTotals.reduce((sum, total) => sum + total, 0);
                setTotalSpent(currentTotalSpent);
                let computedInsightMessage = '';
                if (currentTotalSpent > 0) {
                    let maxSpending = 0;
                    let peakWeekIndex = -1;
                    currentWeeklyTotals.forEach((total, index) => {
                        if (total > maxSpending) {
                            maxSpending = total;
                            peakWeekIndex = index;
                        }
                    });
                    if (peakWeekIndex !== -1) {
                        const peakWeekLabel = weekLabels[peakWeekIndex];
                        computedInsightMessage = `Your spending peaked in ${peakWeekLabel} this month. Ask the AI for tips on managing expenses during high-spend periods!`;
                    } else {
                        computedInsightMessage = 'Your spending seems consistent this month. Ask the AI for general budgeting advice!';
                    }
                } else {
                    computedInsightMessage = 'No spending data found for this month. Start tracking transactions or ask the AI how to begin!';
                }
                setInsightMessage(computedInsightMessage);
                // Compute top 3 categories
                const categoryTotals = {};
                fetchedTransactions.forEach(tx => {
                    if (tx.category && typeof tx.amount === 'number') {
                        categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
                    }
                });
                const topCategories = Object.entries(categoryTotals)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([category, total]) => ({ category, total }));
                // Find largest transaction
                let largestTransaction = null;
                if (fetchedTransactions.length > 0) {
                    largestTransaction = fetchedTransactions.reduce((max, tx) =>
                        (max === null || (tx.amount || 0) > (max.amount || 0)) ? tx : max, null);
                }
                setUserProfile(fetchedUserProfile);
                setAccounts(fetchedAccounts);
                setTransactions(fetchedTransactions);
                setTopCategories(topCategories);
                setLargestTransaction(largestTransaction);
                // Cache insights
                try {
                    const insightsToCache = {
                        userId: user.uid,
                        userProfile: fetchedUserProfile,
                        accounts: fetchedAccounts,
                        transactions: fetchedTransactions,
                        weeklyTotals: currentWeeklyTotals,
                        totalSpent: currentTotalSpent,
                        topCategories,
                        largestTransaction,
                        insightMessage: computedInsightMessage,
                        timestamp: new Date().toISOString(),
                    };
                    await AsyncStorage.setItem(INSIGHTS_STORAGE_KEY, JSON.stringify(insightsToCache));
                    console.log('[AIScreen Fetch LOG] Insights cached for this month (real-time update).');
                } catch (cacheErr) {
                    console.warn('[AIScreen Fetch LOG] Failed to cache insights (real-time):', cacheErr);
                }
                setIsLoading(false);
            }, (err) => {
                if (!didUnmount) {
                    setError('Failed to listen for transaction updates.');
                    setIsLoading(false);
                }
            });
        };
        listenAndFetch();
        return () => {
            didUnmount = true;
            if (unsubscribe) unsubscribe();
        };
    }, [user]);

    // Load chat history on mount
    useEffect(() => {
        const loadChat = async () => {
            try {
                const saved = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
                if (saved) {
                    setChatHistory(JSON.parse(saved));
                }
            } catch (e) {
                console.warn('Failed to load chat history:', e);
            }
        };
        if (user) loadChat();
        // Optionally clear on logout
        // else setChatHistory([]);
    }, [user]);

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
    }, [chatHistory, user]);

    // Generate dynamic suggested questions based on user data
    useEffect(() => {
        if (!isLoading && !error) {
            const questions = generateDynamicQuestions();
            setSuggestedQuestions(questions);

            // Set up timer to rotate questions every 30 minutes instead of 10 seconds
            const interval = setInterval(() => {
                setSuggestedQuestions(generateDynamicQuestions());
            }, 30 * 60 * 1000); // 30 minutes in milliseconds

            return () => clearInterval(interval);
        }
    }, [isLoading, error, transactions, totalSpent, topCategories, largestTransaction]);

    // Function to generate dynamic questions based on user's data
    const generateDynamicQuestions = () => {
        const allQuestions = [
            // Budget questions
            `How can I budget better for ${new Date().toLocaleString('default', { month: 'long' })}?`,
            `What's a good monthly budget for someone like me?`,
            // Spending pattern questions
            `Why did I spend more in Week ${weeklyTotals.indexOf(Math.max(...weeklyTotals)) + 1}?`,
            `How can I reduce my ${topCategories[0]?.category || 'top'} spending?`,
            // Saving questions
            `How much should I save each month?`,
            `What's the 50/30/20 budget rule?`,
            // Specific insights
            `How does my spending compare to others?`,
            largestTransaction ? `Was my $${largestTransaction.amount?.toFixed(2)} purchase a good decision?` : null,
            topCategories[0] ? `How can I spend less on ${topCategories[0].category}?` : null,
            topCategories[1] ? `Is my spending on ${topCategories[1].category} normal?` : null,
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

    // Handle clicking on a suggestion bubble
    const handleSuggestionClick = (question) => {
        setMessage(question);
        // Optional: automatically send the message
        // setTimeout(() => handleSend(), 100);
    };

    // Component for suggestion bubbles
    const SuggestionBubbles = () => (
        <View style={styles.suggestionBubblesContainer}>
            {suggestedQuestions.map((item, index) => (
                <TouchableOpacity
                    key={`suggestion-${index}`}
                    style={styles.suggestionBubble}
                    onPress={() => handleSuggestionClick(item)}
                >
                    <Text style={styles.suggestionText}>{item}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    // Function to handle document picking for statements/receipts
    const handleDocumentPick = async () => {
        try {
            // Show file type chooser dialog first
            Alert.alert(
                "Upload Document",
                "What type of document would you like to upload?",
                [
                    {
                        text: "Bank Statement",
                        onPress: () => pickAndProcessDocument(true)
                    },
                    {
                        text: "Receipt",
                        onPress: () => pickAndProcessDocument(false)
                    },
                    {
                        text: "Cancel",
                        style: "cancel"
                    }
                ]
            );
        } catch (error) {
            console.error('Error in document picker dialog:', error);
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
    const processDocumentWithGemini = async (base64Image, fileName, isStatement = true) => {
        try {
            // Add a message to the chat indicating processing
            const documentType = isStatement ? "bank statement" : "receipt";
            const processingMessage = {
                role: 'model',
                parts: [{ text: `📄 Processing your ${documentType}: *${fileName}*...` }]
            };
            setChatHistory(prev => [...prev, processingMessage]);

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
                    const errorMessage = {
                        role: 'model',
                        parts: [{ text: `I couldn't extract any valid transactions from your ${documentType}. Please try uploading a clearer image.` }]
                    };
                    setChatHistory(prev => {
                        const newHistory = [...prev];
                        newHistory.pop(); // Remove processing message
                        return [...newHistory, errorMessage];
                    });
                    return;
                }

                // Add AI message with extraction results
                const resultMessage = {
                    role: 'model',
                    parts: [{ text: `✅ Found ${formattedTransactions.length} transactions in your ${documentType}.\n\n${formatExtractedTransactions(formattedTransactions)}\n\nWould you like me to add these transactions to your account?` }]
                };
                setChatHistory(prev => {
                    // Replace the processing message with the result
                    const newHistory = [...prev];
                    newHistory.pop(); // Remove processing message
                    return [...newHistory, resultMessage];
                });

                // Store the extracted transactions for potential saving
                setExtractedTransactions(formattedTransactions);
            } else {
                // Handle extraction failure
                const errorMessage = {
                    role: 'model',
                    parts: [{ text: `I couldn't extract structured transaction data from your ${documentType}. Here's what I found:\n\n${extractionResult.rawResponse}` }]
                };
                setChatHistory(prev => {
                    const newHistory = [...prev];
                    newHistory.pop(); // Remove processing message
                    return [...newHistory, errorMessage];
                });
            }
        } catch (error) {
            console.error('Error processing document with Gemini:', error);
            const errorMessage = {
                role: 'model',
                parts: [{ text: "I encountered an error while processing your document. Please try again with a clearer image." }]
            };
            setChatHistory(prev => {
                const newHistory = [...prev];
                if (newHistory[newHistory.length - 1].parts[0].text.includes('Processing')) {
                    newHistory.pop(); // Remove processing message
                }
                return [...newHistory, errorMessage];
            });
        } finally {
            setIsProcessingDocument(false);
        }
    };

    // Format extracted transactions for display in chat
    const formatExtractedTransactions = (transactions) => {
        return transactions.map((tx, index) =>
            `${index + 1}. **${tx.date}**: ${tx.description} - $${tx.amount.toFixed(2)} (${tx.category})`
        ).join('\n');
    };

    // Helper function to parse dates from different formats
    const parseTransactionDate = (dateString) => {
        if (!dateString) return new Date();

        // Try various date formats
        // 1. ISO format: YYYY-MM-DD
        // 2. US format: MM/DD/YYYY
        // 3. UK/EU format: DD/MM/YYYY
        // 4. Text format: Jan 1, 2023

        try {
            // Clean the date string (remove any extra characters)
            const cleanDateString = dateString.replace(/[^\w\s\/-:,]/g, '');

            // Try to parse as ISO format
            const isoDate = new Date(cleanDateString);
            if (!isNaN(isoDate) && isoDate.toString() !== 'Invalid Date') {
                return isoDate;
            }

            // Try MM/DD/YYYY or DD/MM/YYYY
            const parts = cleanDateString.split(/[\/-]/);
            if (parts.length === 3) {
                // Check if first part could be month (1-12)
                const firstPart = parseInt(parts[0], 10);

                if (firstPart >= 1 && firstPart <= 12) {
                    // Likely MM/DD/YYYY
                    const usDate = new Date(`${parts[0]}/${parts[1]}/${parts[2]}`);
                    if (!isNaN(usDate)) return usDate;
                } else if (firstPart >= 1 && firstPart <= 31) {
                    // Likely DD/MM/YYYY
                    const euDate = new Date(`${parts[1]}/${parts[0]}/${parts[2]}`);
                    if (!isNaN(euDate)) return euDate;
                }
            }

            // Try to parse text formats (like "Jan 1, 2023")
            const textDate = new Date(cleanDateString);
            if (!isNaN(textDate)) return textDate;

            // If all parsing fails, return current date
            return new Date();
        } catch (error) {
            console.warn('Error parsing date:', dateString);
            return new Date();
        }
    };

    // Function to save extracted transactions to Firestore
    const saveExtractedTransactions = async () => {
        if (!user || extractedTransactions.length === 0) return;

        try {
            setIsProcessingDocument(true); // Show loading state
            // Ensure defaultAccount always has id and name
            const defaultAccount = accounts && accounts.length > 0
                ? { id: accounts[0].id || '', name: accounts[0].name || 'Main' }
                : { id: '', name: 'Main' };

            const transactionsRef = collection(firestore, 'users', user.uid, 'transactions');

            // Process each transaction
            const savedPromises = extractedTransactions.map(async (tx) => {
                try {
                    // Convert date string to Timestamp using our helper
                    const dateObj = parseTransactionDate(tx.date);
                    // Always use YYYY-MM-DD for date string
                    const dateString = dateObj.toISOString().split('T')[0];
                    // Ensure category is not empty
                    let category = tx.category;
                    if (!category || category === 'Uncategorized') {
                        category = await inferCategoryWithGemini(tx.description);
                        if (!category) category = 'Uncategorized';
                    }
                    const transactionData = {
                        accountId: defaultAccount.id,
                        accountName: defaultAccount.name,
                        amount: tx.amount,
                        category: category,
                        description: tx.description,
                        createdAt: Timestamp.fromDate(dateObj), // Use the date from the statement
                        date: dateString, // Always YYYY-MM-DD
                        type: 'Expenses', // Default to Expenses
                        addedVia: 'document-scan'
                    };

                    // Add to Firestore
                    return await addDoc(transactionsRef, transactionData);
                } catch (err) {
                    console.error('Error adding transaction:', err);
                    return null;
                }
            });

            // Wait for all transactions to be saved
            await Promise.all(savedPromises);

            // Add confirmation message to chat
            const confirmationMessage = {
                role: 'model',
                parts: [{ text: `✅ Added ${extractedTransactions.length} transactions to your account.` }]
            };
            setChatHistory(prev => [...prev, confirmationMessage]);

            // Clear the extracted transactions
            setExtractedTransactions([]);
        } catch (error) {
            console.error('Error saving transactions:', error);
            const errorMessage = {
                role: 'model',
                parts: [{ text: "There was an error saving your transactions. Please try again." }]
            };
            setChatHistory(prev => [...prev, errorMessage]);
        } finally {
            setIsProcessingDocument(false);
        }
    };

    // Enhanced parser for natural language (amount, account, description)
    const parseTransactionFromAiResponse = (text, userMsg) => {
        // Try to find a JSON block in the response
        let match = text.match(/```json\n([\s\S]*?)\n```/);
        if (!match) match = text.match(/```\n([\s\S]*?)\n```/);
        if (!match) match = text.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                const parsed = JSON.parse(match[1] || match[0]);
                // If it's an array, take the first element
                return Array.isArray(parsed) ? parsed[0] : parsed;
            } catch (e) { }
        }
        // Amount: $60, 60, cost me 60, for 60, of 60
        let amountMatch = userMsg.match(/\$([0-9]+(\.[0-9]{1,2})?)/);
        if (!amountMatch) amountMatch = userMsg.match(/costs? me ([0-9]+(\.[0-9]{1,2})?)/i);
        if (!amountMatch) amountMatch = userMsg.match(/for ([0-9]+(\.[0-9]{1,2})?)/i);
        if (!amountMatch) amountMatch = userMsg.match(/of ([0-9]+(\.[0-9]{1,2})?)/i);
        if (!amountMatch) amountMatch = userMsg.match(/ ([0-9]+(\.[0-9]{1,2})?) /); // fallback
        let amount = amountMatch ? parseFloat(amountMatch[1]) : null;
        // Account: from main account, from savings, deduct from ...
        let accountName = '';
        const accountMatch = userMsg.match(/from ([a-zA-Z0-9 ]+) account/i) || userMsg.match(/from ([a-zA-Z0-9 ]+)/i) || userMsg.match(/deduct from ([a-zA-Z0-9 ]+)/i);
        if (accountMatch) {
            accountName = accountMatch[1].trim().toLowerCase();
        }
        // Find the account object
        let accountObj = null;
        if (accountName && accounts && accounts.length > 0) {
            accountObj = accounts.find(acc => acc.name && acc.name.toLowerCase().includes(accountName));
        }
        // Description: after 'for', or the whole message minus amount/account
        let description = '';
        const forMatch = userMsg.match(/for ([a-zA-Z0-9 ,.'"-]+)/);
        if (forMatch && (!amountMatch || forMatch.index < amountMatch.index)) {
            description = forMatch[1].trim();
        } else {
            // Remove amount, account, and date phrases
            description = userMsg
                .replace(/\$[0-9]+(\.[0-9]{1,2})?/, '')
                .replace(/costs? me [0-9]+(\.[0-9]{1,2})?/i, '')
                .replace(/for [0-9]+(\.[0-9]{1,2})?/i, '')
                .replace(/of [0-9]+(\.[0-9]{1,2})?/i, '')
                .replace(/from [a-zA-Z0-9 ]+ account/i, '')
                .replace(/from [a-zA-Z0-9 ]+/i, '')
                .replace(/deduct from [a-zA-Z0-9 ]+/i, '')
                .replace(/add/i, '')
                .replace(/for/i, '')
                .trim();
        }
        // Category: after 'category' or 'as' or 'to' or 'for ... as ...'
        let category = '';
        const categoryMatch = userMsg.match(/category ([a-zA-Z ]+)/i) || userMsg.match(/as ([a-zA-Z ]+)/i) || userMsg.match(/to ([a-zA-Z ]+)/i);
        if (categoryMatch) {
            category = categoryMatch[1].trim();
        }
        const dateMatch = userMsg.match(/on ([A-Za-z0-9 ,\/-]+)/);
        if (amount) {
            return {
                amount: amount,
                category: category,
                date: dateMatch ? dateMatch[1].trim() : new Date().toISOString().split('T')[0],
                description: description,
                accountObj: accountObj // Pass the found account object
            };
        }
        return null;
    };

    // Function to infer category using Gemini if missing
    const inferCategoryWithGemini = async (description) => {
        if (!description) return 'Uncategorized';
        try {
            const prompt = `Given the transaction description: '${description}', what is the most likely spending category? Respond with a single word or short phrase.`;
            const result = await generateResponse(prompt);
            // Take the first word/line as the category
            return result.split('\n')[0].replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'Uncategorized';
        } catch (e) {
            return 'Uncategorized';
        }
    };

    // Function to extract concise description keyword using Gemini
    const extractDescriptionKeywordWithGemini = async (sentence) => {
        try {
            const prompt = `Extract the main purchase item or keyword from this sentence: "${sentence}". Respond with only the keyword or short phrase.`;
            const result = await generateResponse(prompt);
            return result.split('\n')[0].replace(/[^a-zA-Z0-9 ]/g, '').trim();
        } catch (e) {
            return sentence; // fallback
        }
    };

    // Modified handleSend to use concise description
    const handleSend = async () => {
        console.log('[AIScreen Send LOG] handleSend called. Checking conditions...');
        console.log(`[AIScreen Send LOG] message: ${message.trim() ? 'OK' : 'Empty'}, userProfile: ${userProfile ? 'OK' : 'NULL'}, accounts: ${accounts ? 'OK' : 'NULL'}`);

        if (message.trim() && userProfile && accounts) {
            try {
                // Hide chart when first message is sent
                if (chatHistory.length === 0) {
                    setShowChart(false);
                }

                // Check if this is a command response
                if (handleCommandInMessage(message)) {
                    const userMessage = {
                        role: 'user',
                        parts: [{ text: message }]
                    };
                    setChatHistory(prev => [...prev, userMessage]);
                    setMessage('');
                    return; // Don't send to AI if it's a command
                }

                const userMessage = {
                    role: 'user',
                    parts: [{ text: message }]
                };
                const currentChatHistory = [...chatHistory, userMessage];

                setChatHistory(currentChatHistory);
                setMessage('');
                setIsTyping(true);

                const transactionSummary = {
                    weeklyTotals,
                    totalSpent,
                    topCategories,
                    largestTransaction
                };

                // Log data being passed
                console.log('[AIScreen Send LOG] Data being passed to generateChatResponse:');
                console.log('[AIScreen Send LOG] - User Profile:', JSON.stringify(userProfile));
                console.log('[AIScreen Send LOG] - Transaction Summary:', JSON.stringify(transactionSummary));
                console.log('[AIScreen Send LOG] - Transactions Count:', transactions?.length);
                console.log('[AIScreen Send LOG] - Accounts Count:', accounts?.length);

                const aiResponse = await generateChatResponse(
                    currentChatHistory,
                    userProfile,
                    transactionSummary,
                    transactions,
                    accounts
                );

                // Try to detect a transaction suggestion in the AI response
                let aiSuggestedTx = parseTransactionFromAiResponse(aiResponse, message);
                if (aiSuggestedTx && aiSuggestedTx.amount) {
                    // If category is missing, infer it from description
                    if (!aiSuggestedTx.category || aiSuggestedTx.category === '') {
                        aiSuggestedTx.category = await inferCategoryWithGemini(aiSuggestedTx.description);
                    }
                    // If description is missing, use category as fallback
                    if (!aiSuggestedTx.description || aiSuggestedTx.description === '') {
                        aiSuggestedTx.description = aiSuggestedTx.category;
                    }
                    // Use Gemini to extract concise keyword for description
                    aiSuggestedTx.description = await extractDescriptionKeywordWithGemini(aiSuggestedTx.description);
                    setPendingAiTransaction(aiSuggestedTx);
                    console.log('Pending AI Transaction:', aiSuggestedTx); // DEBUG LOG
                    const confirmMsg = {
                        role: 'model',
                        parts: [{ text: `📝 I detected a transaction suggestion:\n\n- Amount: $${aiSuggestedTx.amount}\n- Category: ${aiSuggestedTx.category}\n- Description: ${aiSuggestedTx.description}\n- Account: ${aiSuggestedTx.accountObj ? aiSuggestedTx.accountObj.name : (accounts[0]?.name || 'Main')}\n- Date: ${aiSuggestedTx.date}\n\nWould you like me to add this transaction to your account? (yes/no)` }]
                    };
                    setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: aiResponse }] }, confirmMsg]);
                } else {
                    // No transaction detected, just add the AI response
                    const aiMessage = {
                        role: 'model',
                        parts: [{ text: aiResponse }]
                    };
                    setChatHistory(prev => [...prev, aiMessage]);
                }

                // Refresh questions after each message exchange
                setSuggestedQuestions(generateDynamicQuestions());
            } catch (error) {
                console.error('[AIScreen Send LOG] Error in handleSend:', error);
                setChatHistory(prev => [...prev, {
                    role: 'model',
                    // Display the error message from the service if available
                    parts: [{ text: typeof error === 'string' ? error : 'Sorry, I encountered an error. Please try again.' }]
                }]);
            } finally {
                setIsTyping(false);
            }
        } else {
            console.log('[AIScreen Send LOG] Conditions not met, message not sent.');
        }
    };

    // Extend handleCommandInMessage to support AI-suggested transaction confirmation
    const handleCommandInMessage = (text) => {
        const lowerText = text.toLowerCase();
        console.log('handleCommandInMessage', { pendingAiTransaction, text }); // DEBUG LOG
        // Check if user wants to save extracted transactions (from image)
        if (extractedTransactions.length > 0 &&
            (lowerText.includes('yes') ||
                lowerText.includes('save') ||
                lowerText.includes('add transactions') ||
                lowerText.includes('add them'))) {
            saveExtractedTransactions();
            return true; // Command handled
        }
        // Check if user doesn't want to save extracted transactions
        if (extractedTransactions.length > 0 &&
            (lowerText.includes('no') ||
                lowerText.includes('don\'t save') ||
                lowerText.includes('do not save'))) {
            setExtractedTransactions([]);
            const message = {
                role: 'model',
                parts: [{ text: "No problem. The transactions won't be added to your account." }]
            };
            setChatHistory(prev => [...prev, message]);
            return true; // Command handled
        }
        // Check if user wants to confirm AI-suggested transaction
        if (pendingAiTransaction && (lowerText.includes('yes') || lowerText.includes('add'))) {
            saveAiSuggestedTransaction();
            return true;
        }
        // Check if user declines AI-suggested transaction
        if (pendingAiTransaction && (lowerText.includes('no') || lowerText.includes('don\'t') || lowerText.includes('do not'))) {
            setPendingAiTransaction(null);
            const message = {
                role: 'model',
                parts: [{ text: "No problem. The transaction won't be added to your account." }]
            };
            setChatHistory(prev => [...prev, message]);
            return true;
        }
        return false; // No command handled
    };

    // Function to save AI-suggested transaction to Firestore
    const saveAiSuggestedTransaction = async () => {
        console.log('saveAiSuggestedTransaction called', pendingAiTransaction); // DEBUG LOG
        if (!user || !pendingAiTransaction) return;
        let transactionData = null;
        try {
            setIsProcessingDocument(true);
            const transactionsRef = collection(firestore, 'users', user.uid, 'transactions');
            // Use accountObj if present, else fallback
            let defaultAccount = accounts && accounts.length > 0
                ? { id: accounts[0].id || '', name: accounts[0].name || 'Main' }
                : { id: '', name: 'Main' };
            if (pendingAiTransaction.accountObj) {
                defaultAccount = {
                    id: pendingAiTransaction.accountObj.id || '',
                    name: pendingAiTransaction.accountObj.name || 'Main'
                };
            }
            // Date/time logic
            let dateObj;
            let dateString = pendingAiTransaction.date;
            if (dateString) {
                dateObj = parseTransactionDate(dateString);
                // If only a date (no time), set time to now
                if (dateObj && dateObj instanceof Date && dateObj.getHours() === 0 && dateObj.getMinutes() === 0 && dateObj.getSeconds() === 0) {
                    const now = new Date();
                    dateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
                }
            } else {
                dateObj = new Date();
                dateString = dateObj.toISOString();
            }
            transactionData = {
                accountId: defaultAccount.id || '',
                accountName: defaultAccount.name || 'Main',
                amount: pendingAiTransaction.amount,
                category: pendingAiTransaction.category,
                description: pendingAiTransaction.description || '',
                createdAt: Timestamp.fromDate(dateObj),
                date: dateString,
                type: 'Expenses',
                addedVia: 'ai-chat'
            };
            await addDoc(transactionsRef, transactionData);
            setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: '✅ Transaction added to your account.' }] }]);
            setPendingAiTransaction(null);
        } catch (error) {
            console.error('Error saving AI-suggested transaction:', error, transactionData);
            setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: 'There was an error saving your transaction. Please try again.' }] }]);
        } finally {
            setIsProcessingDocument(false);
        }
    };

    // In clearChat, also clear AsyncStorage
    const clearChat = async () => {
        setChatHistory([]);
        setShowChart(true);
        try {
            await AsyncStorage.removeItem(CHAT_STORAGE_KEY);
        } catch (e) {
            console.warn('Failed to clear chat history:', e);
        }
    };

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

    // FlatList renderItem for chat messages
    const renderChatMessage = ({ item, index }) => {
        // Check if this is the latest AI message with extracted transactions
        const isLatestExtractionMsg =
            item.role === 'model' &&
            extractedTransactions.length > 0 &&
            typeof item.parts[0].text === 'string' &&
            item.parts[0].text.startsWith('✅ Found') &&
            index === chatHistory.length - 1;

        return (
            <View
                style={[
                    styles.messageContainer,
                    item.role === 'user' ? styles.userMessage : styles.aiMessage
                ]}
            >
                {item.role === 'model' ? (
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
                {/* Add confirmation buttons for extracted transactions */}
                {isLatestExtractionMsg && (
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
                        <TouchableOpacity
                            style={{
                                backgroundColor: COLORS.primary,
                                borderRadius: 16,
                                paddingVertical: 8,
                                paddingHorizontal: 18,
                                marginRight: 10,
                            }}
                            onPress={saveExtractedTransactions}
                            disabled={isProcessingDocument}
                        >
                            <Text style={{ color: COLORS.white, fontWeight: 'bold' }}>Add to Account</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{
                                backgroundColor: COLORS.cardBackground,
                                borderRadius: 16,
                                paddingVertical: 8,
                                paddingHorizontal: 18,
                                borderWidth: 1,
                                borderColor: COLORS.textGray,
                            }}
                            onPress={() => setExtractedTransactions([])}
                            disabled={isProcessingDocument}
                        >
                            <Text style={{ color: COLORS.textGray, fontWeight: 'bold' }}>Dismiss</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    // FlatList ListHeaderComponent for chart and insights
    const renderChatHeader = () => (
        showChart && (
            <>
                {isLoading ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={styles.loadingIndicator} />
                ) : error ? (
                    <Text style={styles.errorText}>{error}</Text>
                ) : chartData.datasets[0].data.length > 0 ? (
                    <View style={{ marginLeft: -SIZES.padding.xxxlarge, marginTop: SIZES.padding.xlarge }}>
                        <LineChart
                            data={chartData}
                            width={screenWidth - (SIZES.padding.xlarge * 2)}
                            height={240}
                            yAxisInterval={1}
                            chartConfig={chartConfig}
                            bezier
                            style={styles.chart}
                            withVerticalLines={false}
                            withHorizontalLines={true}
                            withShadow={false}
                            fromZero={true}
                            yLabelsOffset={12}
                            xLabelsOffset={-10}
                            segments={5}
                            formatYLabel={(yLabel) => {
                                const num = parseFloat(yLabel.replace('$', ''));
                                if (isNaN(num)) return '$0';
                                if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
                                if (num >= 1000) return `$${(num / 1000).toFixed(0)}k`;
                                return `$${num.toFixed(0)}`;
                            }}
                        />
                    </View>
                ) : (
                    <Text style={styles.noDataText}>No spending data available for this month.</Text>
                )}
                {/* Insight Text */}
                <View style={styles.insightTextContainer}>
                    <Text style={styles.insightText}>
                        {insightMessage}
                    </Text>
                </View>

                {/* Suggestion Bubbles */}
                {!isLoading && !error && <SuggestionBubbles />}
            </>
        )
    );

    return (
        <ScreenWrapper backgroundColor={COLORS.darkBackground} barStyle="light-content">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
            >
                <View style={styles.container}>
                    {/* Top Bar */}
                    <View style={styles.topBar}>
                        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
                            <Icon name="chevron-back" size={28} color={COLORS.text} />
                        </TouchableOpacity>
                        <Text style={styles.topBarTitle}>AI Chat Bot</Text>
                        {chatHistory.length > 0 && (
                            <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
                                <Icon name="trash-outline" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Header Section */}
                    <View style={styles.headerSection}>
                        <Text style={styles.headerTitle}>Insights</Text>
                        <Text style={styles.headerSubtitle}>
                            Enjoy a personalized experience with our carefully curated AI chatting feature
                        </Text>
                    </View>

                    {/* Content Area */}
                    <View style={styles.scrollContainer}>
                        <FlatList
                            ref={chatListRef}
                            data={chatHistory}
                            renderItem={renderChatMessage}
                            keyExtractor={(_, index) => index.toString()}
                            style={{ flexGrow: 1 }}
                            contentContainerStyle={[styles.chatArea, { paddingBottom: 16 }]}
                            ListHeaderComponent={renderChatHeader}
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

                    {/* Input Area with attachment button handler */}
                    <View style={styles.inputContainer}>
                        <TouchableOpacity
                            style={styles.attachButton}
                            onPress={handleDocumentPick}
                            disabled={isProcessingDocument || isTyping}
                        >
                            <Icon
                                name="attach-outline"
                                size={24}
                                color={isProcessingDocument || isTyping ? COLORS.textGrayLight : COLORS.textGray}
                            />
                        </TouchableOpacity>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Type a message"
                            placeholderTextColor={COLORS.placeholder}
                            value={message}
                            onChangeText={setMessage}
                            multiline
                            editable={!isProcessingDocument}
                        />
                        <TouchableOpacity
                            style={[
                                styles.sendButton,
                                (!message.trim() || isProcessingDocument || isTyping) && styles.sendButtonDisabled
                            ]}
                            onPress={handleSend}
                            disabled={!message.trim() || isProcessingDocument || isTyping}
                        >
                            <Icon name="send" size={20} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};

export default AIScreen;

const styles = StyleSheet.create({
    keyboardAvoidingView: {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.darkBackground, // Keep main container dark for top section
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Platform.OS === 'android' ? SIZES.padding.medium : SIZES.padding.small, // Adjusted padding
        paddingBottom: SIZES.padding.small,
        paddingHorizontal: SIZES.padding.large,
        backgroundColor: COLORS.darkBackground, // Ensure top bar is dark
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20, // Make it circular
        backgroundColor: COLORS.white, // White background for back button
        justifyContent: 'center',
        alignItems: 'center',
    },
    topBarTitle: {
        ...FONTS.h3,
        color: COLORS.textLight,
        textAlign: 'center',
        flex: 1, // Allow title to take space and center between buttons
        marginHorizontal: SIZES.padding.small, // Add some margin if flex doesn't center perfectly
    },
    headerSection: {
        paddingHorizontal: SIZES.padding.xlarge,
        paddingBottom: SIZES.padding.xxxxlarge,
        backgroundColor: COLORS.darkBackground, // Ensure header section is dark
        marginTop: 50,
    },
    headerTitle: {
        ...FONTS.largeTitle,
        color: COLORS.textLight,
        marginTop: SIZES.base,
    },
    headerSubtitle: {
        ...FONTS.body2,
        color: COLORS.textGray, // Lighter text for subtitle
        marginTop: SIZES.base / 2,
        marginRight: SIZES.padding.large, // Prevent text from touching edge
    },
    scrollContainer: {
        flex: 1,
        backgroundColor: COLORS.appBackground,
        borderTopLeftRadius: SIZES.radius.large,
        borderTopRightRadius: SIZES.radius.large,
        marginTop: -20, // Add negative margin to create overlap with header
    },
    chart: {
        marginBottom: SIZES.padding.xlarge, // Added margin to space from insight text
        alignSelf: 'center', // Center the chart within the ScrollView padding
    },
    tooltipContainer: {
        paddingHorizontal: SIZES.base,
        paddingVertical: SIZES.base / 2,
        backgroundColor: COLORS.text, // Dark background for tooltip to match image
        borderRadius: SIZES.radius.small,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        // zIndex handled in renderDecorator
    },
    tooltipText: {
        ...FONTS.body3,
        color: COLORS.white,
        fontWeight: '600',
    },
    insightTextContainer: {
        marginBottom: SIZES.padding.large,
        paddingHorizontal: SIZES.padding.medium,
    },
    insightText: {
        ...FONTS.body2,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    chatArea: {
        marginTop: SIZES.padding.large,
        minHeight: 100,
        paddingHorizontal: SIZES.padding.large,
    },
    messageContainer: {
        maxWidth: '82%',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 22,
        marginBottom: 10,
        marginTop: 2,
        marginLeft: 6,
        marginRight: 6,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 3,
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
    sendButtonDisabled: {
        opacity: 0.5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SIZES.padding.medium,
        paddingVertical: SIZES.padding.small,
        backgroundColor: COLORS.appBackground,
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
    },
    attachButton: {
        padding: SIZES.base,
        marginRight: SIZES.base,
    },
    textInput: {
        flex: 1,
        backgroundColor: '#F5F6FA',
        borderRadius: SIZES.radius.large,
        paddingHorizontal: SIZES.padding.large,
        paddingVertical: SIZES.padding.medium,
        minHeight: 44,
        maxHeight: 120,
        ...FONTS.body2,
        color: COLORS.text,
    },
    sendButton: {
        marginLeft: SIZES.base,
        backgroundColor: COLORS.text,
        borderRadius: SIZES.radius.xlarge,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingIndicator: {
        height: 240,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        height: 240,
        textAlign: 'center',
        textAlignVertical: 'center',
        color: COLORS.error || '#FF3B30',
        ...FONTS.body3,
    },
    noDataText: {
        height: 240,
        textAlign: 'center',
        textAlignVertical: 'center',
        color: COLORS.textGray,
        ...FONTS.body3,
    },
    clearButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Suggestion bubbles styles
    suggestionBubblesContainer: {
        marginBottom: SIZES.padding.large,
        paddingHorizontal: SIZES.padding.medium,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SIZES.padding.large,
    },
    suggestionBubble: {
        backgroundColor: COLORS.darkBackground,
        borderRadius: 18,
        paddingHorizontal: SIZES.padding.large,
        paddingVertical: SIZES.padding.medium,
        marginVertical: SIZES.padding.small,
        marginHorizontal: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        maxWidth: screenWidth * 0.8,
        alignSelf: 'center',
    },
    suggestionText: {
        ...FONTS.body3,
        color: COLORS.white,
        fontWeight: '500',
    },
    // Add a style for disabled text
    textGrayLight: {
        color: 'rgba(156, 163, 175, 0.5)', // Lighter gray for disabled state
    },
});