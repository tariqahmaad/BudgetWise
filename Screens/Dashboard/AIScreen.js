import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    Platform,
    KeyboardAvoidingView,
    Keyboard,
    Animated,
    Modal,
    FlatList,
    TextInput,
    Button,
} from 'react-native';
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
} from '../../firebase/firebaseConfig';
import { generateResponse, extractTransactionsFromDocument } from '../../services/geminiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import custom components
import ChatComponent from '../../Components/AI/ChatComponent';
import ChartComponent from '../../Components/AI/ChartComponent';
import SuggestionComponent from '../../Components/AI/SuggestionComponent';
import ChatInputComponent from '../../Components/AI/ChatInputComponent';
import DocumentProcessorComponent from '../../Components/AI/DocumentProcessorComponent';

// Import custom hooks
import useTransactionProcessing from '../../hooks/useTransactionProcessing';
import useAnimations from '../../hooks/useAnimations';
import useAIChat from '../../hooks/useAIChat';

const screenWidth = Dimensions.get('window').width;

const AIScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);
    const [chartData, setChartData] = useState({ labels: [], datasets: [{ data: [] }] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [insightMessage, setInsightMessage] = useState('Analyzing your spending trends...');
    const [weeklyTotals, setWeeklyTotals] = useState([]);
    const [totalSpent, setTotalSpent] = useState(0);
    const [userProfile, setUserProfile] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [topCategories, setTopCategories] = useState([]);
    const [largestTransaction, setLargestTransaction] = useState(null);
    const INSIGHTS_STORAGE_KEY = '@budgetwise_insights';
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [currentDisplayMonthName, setCurrentDisplayMonthName] = useState('');

    // Enhanced error and loading states
    const [networkError, setNetworkError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const [isRefreshing, setIsRefreshing] = useState(false);

    // Use custom hooks
    const {
        extractedTransactions,
        setExtractedTransactions,
        pendingAiTransaction,
        setPendingAiTransaction,
        isProcessingDocument,
        setIsProcessingDocument,
        formatExtractedTransactions,
        parseTransactionDate,
        inferCategoryWithGemini,
        extractDescriptionKeywordWithGemini,
        parseTransactionFromAiResponse,
        saveExtractedTransactions: actualSaveFunctionFromHook,
        saveAiSuggestedTransaction
    } = useTransactionProcessing(user, accounts, generateResponse);

    const {
        showChart,
        setShowChart,
        headerScale,
        headerOpacity,
        headerHeight,
        chatOpacity,
        chartScale,
        insightOpacity,
        borderHighlightOpacity,
        chatScale,
        chatSlideY,
        chartSlideY,
        animateChatTransition,
        resetAnimations,
        initializeWithChatHistory
    } = useAnimations();

    const {
        chatHistory,
        setChatHistory,
        message,
        setMessage,
        isTyping,
        setIsTyping,
        suggestedQuestions,
        setSuggestedQuestions,
        generateDynamicQuestions,
        handleSend: handleAIChat,
        handleSlashCommand,
        clearChat: clearChatHistory
    } = useAIChat(user, transactions, accounts, userProfile);

    // Memoize expensive data for AI chat
    const memoizedTransactionSummary = useMemo(() => ({
        weeklyTotals,
        totalSpent,
        topCategories,
        largestTransaction
    }), [weeklyTotals, totalSpent, topCategories, largestTransaction]);

    // Memoize stable functions to prevent unnecessary re-renders
    const stableFunctions = useMemo(() => ({
        parseTransactionFromAiResponse,
        extractDescriptionKeywordWithGemini,
        inferCategoryWithGemini,
        actualSaveFunctionFromHook,
        saveAiSuggestedTransaction
    }), [
        parseTransactionFromAiResponse,
        extractDescriptionKeywordWithGemini,
        inferCategoryWithGemini,
        actualSaveFunctionFromHook,
        saveAiSuggestedTransaction
    ]);

    // Error recovery function
    const handleRetry = useCallback(async () => {
        if (retryCount < 3) {
            setRetryCount(prev => prev + 1);
            setNetworkError(false);
            setError(null);
            setIsLoading(true);
            // Trigger data refetch
        }
    }, [retryCount]);

    // Reset error states when user is available
    useEffect(() => {
        if (user) {
            setNetworkError(false);
            setRetryCount(0);
        }
    }, [user]);

    // Helper function to get the start of a week (Sunday)
    const getWeekStartBoundary = (date) => {
        const d = new Date(date);
        const dayOfWeek = d.getDay(); // 0 for Sunday
        d.setDate(d.getDate() - dayOfWeek);
        d.setHours(0, 0, 0, 0); // Normalize to start of day
        return d;
    };

    // Helper function to get the end of a week (Saturday)
    const getWeekEndBoundary = (date) => {
        const d = new Date(date);
        const dayOfWeek = d.getDay(); // 0 for Sunday
        d.setDate(d.getDate() + (6 - dayOfWeek));
        d.setHours(23, 59, 59, 999); // Normalize to end of day
        return d;
    };

    // Load and manage transaction data
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
            setNetworkError(false);
            setInsightMessage('Loading spending data...');

            try {
                // 1. Try to load cached insights
                const cached = await AsyncStorage.getItem(INSIGHTS_STORAGE_KEY);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    const cacheDate = new Date(parsed.timestamp);
                    const nowDate = new Date();

                    if (parsed &&
                        cacheDate.getFullYear() === nowDate.getFullYear() &&
                        cacheDate.getMonth() === nowDate.getMonth() &&
                        parsed.userId === user.uid) {

                        // Load cached data
                        setUserProfile(parsed.userProfile);
                        setAccounts(parsed.accounts);
                        setTransactions(parsed.transactions);
                        setWeeklyTotals(parsed.weeklyTotals);
                        setTotalSpent(parsed.totalSpent);
                        setTopCategories(parsed.topCategories);
                        setLargestTransaction(parsed.largestTransaction);
                        setInsightMessage(parsed.insightMessage);
                        setCurrentDisplayMonthName(parsed.currentDisplayMonthName || new Date().toLocaleString('default', { month: 'long' }));
                        setChartData({
                            labels: parsed.chartData?.labels || ['W1', 'W2', 'W3', 'W4'],
                            datasets: [
                                {
                                    data: parsed.weeklyTotals,
                                    color: (opacity = 1) => COLORS.primary || `rgba(0, 122, 255, ${opacity})`,
                                    strokeWidth: 3,
                                },
                            ],
                        });
                        setIsLoading(false);
                        console.log('[AIScreen Fetch LOG] Loaded insights from cache for the current month.');
                    }
                }
            } catch (cacheErr) {
                console.warn('[AIScreen Fetch LOG] Failed to load insights cache:', cacheErr);
                // Don't set error state for cache failures, continue with fresh fetch
            }

            try {
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

                    try {
                        const fetchedTransactions = [];
                        querySnapshot.forEach((doc) => {
                            const data = doc.data();
                            fetchedTransactions.push({
                                id: doc.id,
                                ...data,
                                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : null)
                            });
                        });

                        // Fetch user profile and accounts with timeout
                        const fetchWithTimeout = (promise, timeout = 10000) => {
                            return Promise.race([
                                promise,
                                new Promise((_, reject) =>
                                    setTimeout(() => reject(new Error('Request timeout')), timeout)
                                )
                            ]);
                        };

                        let fetchedUserProfile = null;
                        try {
                            const userDocRef = doc(firestore, 'users', user.uid);
                            const userDocSnap = await fetchWithTimeout(getDoc(userDocRef));
                            fetchedUserProfile = userDocSnap.exists() ? userDocSnap.data() : { name: 'User' };
                        } catch (profileError) {
                            console.warn('[AIScreen] Failed to fetch user profile:', profileError);
                            fetchedUserProfile = { name: 'User' };
                        }

                        let fetchedAccounts = [];
                        try {
                            const accountsRef = collection(firestore, 'users', user.uid, 'accounts');
                            const accountsSnapshot = await fetchWithTimeout(getDocs(accountsRef));
                            accountsSnapshot.forEach((accDoc) => fetchedAccounts.push({ id: accDoc.id, ...accDoc.data() }));
                        } catch (accountError) {
                            console.warn('[AIScreen] Failed to fetch accounts:', accountError);
                        }

                        // --- Dynamic Week Calculation Logic --- V2 ---
                        const nowForMonth = new Date(); // Defines the current month for the chart
                        const currentYear = nowForMonth.getFullYear();
                        const currentMonth = nowForMonth.getMonth(); // 0-indexed
                        setCurrentDisplayMonthName(nowForMonth.toLocaleString('default', { month: 'long' }));

                        const generatedWeekLabels = [];
                        const generatedWeekDateRanges = [];

                        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
                        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
                        const numDaysInMonth = lastDayOfMonth.getDate();

                        let weekStart = new Date(firstDayOfMonth);
                        let weekNumber = 1;

                        // Generate exactly 4 weeks
                        for (let i = 0; i < 4; i++) {
                            generatedWeekLabels.push(`Week ${weekNumber}`);
                            let weekEnd = new Date(weekStart);
                            // Set weekEnd to be 6 days after weekStart, but not exceeding the end of the month
                            weekEnd.setDate(weekStart.getDate() + 6);
                            if (weekEnd.getMonth() !== currentMonth || weekEnd.getDate() > numDaysInMonth) {
                                weekEnd = new Date(lastDayOfMonth);
                            }
                            // Ensure weekEnd is at the end of its day
                            weekEnd.setHours(23, 59, 59, 999);

                            generatedWeekDateRanges.push({
                                start: new Date(weekStart.setHours(0, 0, 0, 0)), // Ensure start is at the beginning of its day
                                end: new Date(weekEnd)
                            });

                            // Move to the start of the next week
                            weekStart.setDate(weekEnd.getDate() + 1);
                            // Ensure weekStart is at the beginning of its day for the next iteration
                            weekStart.setHours(0, 0, 0, 0);
                            weekNumber++;
                        }

                        // If the last week spills into the next month but started in the current one,
                        // ensure its end date is capped at the last day of the current month.
                        // The loop condition `weekStart.getMonth() === currentMonth` should handle this.
                        // The logic to set weekEnd = new Date(lastDayOfMonth) also helps.

                        const newCurrentWeeklyTotals = Array(generatedWeekDateRanges.length).fill(0);

                        fetchedTransactions.forEach(tx => {
                            if (tx.amount && typeof tx.amount === 'number' && tx.createdAt) {
                                const txDate = tx.createdAt;
                                // Ensure transaction is within the current month (already filtered by Firestore query, but good for safety)
                                if (txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth) {
                                    for (let i = 0; i < generatedWeekDateRanges.length; i++) {
                                        const week = generatedWeekDateRanges[i];
                                        if (txDate >= week.start && txDate <= week.end) {
                                            newCurrentWeeklyTotals[i] += tx.amount;
                                            break; // Transaction belongs to one week only
                                        }
                                    }
                                }
                            }
                        });

                        setWeeklyTotals(newCurrentWeeklyTotals);
                        setChartData({
                            labels: generatedWeekLabels,
                            datasets: [
                                {
                                    data: newCurrentWeeklyTotals,
                                    color: (opacity = 1) => COLORS.primary || `rgba(0, 122, 255, ${opacity})`,
                                    strokeWidth: 3,
                                },
                            ],
                        });
                        // --- End of Dynamic Week Calculation Logic ---

                        const currentTotalSpent = newCurrentWeeklyTotals.reduce((sum, total) => sum + total, 0);
                        setTotalSpent(currentTotalSpent);

                        let computedInsightMessage = '';
                        if (currentTotalSpent > 0) {
                            let maxSpending = -1; // Use -1 to correctly find max if all totals are 0 or positive
                            let peakWeekIndex = -1;
                            newCurrentWeeklyTotals.forEach((total, index) => {
                                if (total > maxSpending) {
                                    maxSpending = total;
                                    peakWeekIndex = index;
                                }
                            });

                            if (peakWeekIndex !== -1 && peakWeekIndex < generatedWeekLabels.length) {
                                const peakWeekLabel = generatedWeekLabels[peakWeekIndex];
                                computedInsightMessage = `Your spending peaked in ${peakWeekLabel} this month. Ask the AI for tips on managing expenses!`;
                            } else if (newCurrentWeeklyTotals.every(total => total === newCurrentWeeklyTotals[0]) && currentTotalSpent > 0) {
                                computedInsightMessage = 'Your spending is consistent across the weeks this month. Good job budgeting!';
                            }
                            else {
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
                                weeklyTotals: newCurrentWeeklyTotals,
                                totalSpent: currentTotalSpent,
                                topCategories,
                                largestTransaction,
                                insightMessage: computedInsightMessage,
                                timestamp: new Date().toISOString(),
                                currentDisplayMonthName: nowForMonth.toLocaleString('default', { month: 'long' }),
                                chartData: { labels: generatedWeekLabels, datasets: [{ data: newCurrentWeeklyTotals }] }
                            };
                            await AsyncStorage.setItem(INSIGHTS_STORAGE_KEY, JSON.stringify(insightsToCache));
                            console.log('[AIScreen Fetch LOG] Insights cached for this month (real-time update).');
                        } catch (cacheErr) {
                            console.warn('[AIScreen Fetch LOG] Failed to cache insights (real-time):', cacheErr);
                        }
                        setIsLoading(false);
                    } catch (fetchErr) {
                        if (!didUnmount) {
                            setError('Failed to fetch transaction data.');
                            setIsLoading(false);
                        }
                    }
                }, (err) => {
                    if (!didUnmount) {
                        setError('Failed to listen for transaction updates.');
                        setIsLoading(false);
                    }
                });
            } catch (fetchErr) {
                if (!didUnmount) {
                    setError('Failed to fetch transaction data.');
                    setIsLoading(false);
                }
            }
        };
        listenAndFetch();
        return () => {
            didUnmount = true;
            if (unsubscribe) unsubscribe();
        };
    }, [user]);

    // Initialize chat UI state based on chat history
    useEffect(() => {
        // This effect now runs when chatHistory is loaded/updated from AsyncStorage,
        // or when the component mounts.
        if (chatHistory && chatHistory.length > 0) {
            initializeWithChatHistory(true); // Hide insights, show chat mode
        } else {
            // If chatHistory is empty (either initially, after loading, or after being cleared)
            initializeWithChatHistory(false); // Show insights, reset to initial mode (which calls resetAnimations)
        }
    }, [chatHistory, initializeWithChatHistory]); // React to changes in chatHistory and ensure initializeWithChatHistory is stable

    // Effect to handle transactions - now transactions are displayed in the chat directly
    useEffect(() => {
        // We still need this effect to make sure no duplicates are handled
        // and clear extractedTransactions state after document processing
        if (extractedTransactions && extractedTransactions.length > 0) {
            // No action needed here since transactions are now handled in the chat
            // with action buttons through the DocumentProcessorComponent
            // Don't clear extractedTransactions here - they need to be accessible
            // to the saveExtractedTransactions function
        }
    }, [extractedTransactions]);

    // Generate suggestions when data changes
    useEffect(() => {
        if (!isLoading && !error) {
            const questions = generateDynamicQuestions(weeklyTotals, totalSpent, topCategories, largestTransaction);
            setSuggestedQuestions(questions);

            // Set up timer to rotate questions every 30 minutes
            const interval = setInterval(() => {
                setSuggestedQuestions(generateDynamicQuestions(weeklyTotals, totalSpent, topCategories, largestTransaction));
            }, 30 * 60 * 1000); // 30 minutes in milliseconds

            return () => clearInterval(interval);
        }
    }, [isLoading, error, transactions, totalSpent, topCategories, largestTransaction]);

    // Handle clicking on a suggestion bubble
    const handleSuggestionClick = useCallback((question) => {
        setMessage(question);
        // Optional: automatically send the message
        // setTimeout(() => handleSend(), 100);
    }, [setMessage]);

    // Handle sending messages
    const handleSend = useCallback(async () => {
        console.log('[AIScreen handleSend] Current message from user:', message);
        console.log('[AIScreen handleSend] Value of pendingAiTransaction BEFORE handleSlashCommand:', pendingAiTransaction);

        // Use the handleSlashCommand from useAIChat hook
        if (handleSlashCommand(
            message,
            stableFunctions.actualSaveFunctionFromHook,
            pendingAiTransaction,
            stableFunctions.saveAiSuggestedTransaction
        )) {
            const userMessage = {
                role: 'user',
                parts: [{ text: message }]
            };
            setChatHistory(prev => [...prev, userMessage]);
            setMessage('');
            return;
        }

        // Animate transition when first message is sent
        if (chatHistory.length === 0) {
            await animateChatTransition();
        }

        // Use memoized data and functions
        await handleAIChat(
            stableFunctions.parseTransactionFromAiResponse,
            stableFunctions.extractDescriptionKeywordWithGemini,
            stableFunctions.inferCategoryWithGemini,
            setPendingAiTransaction,
            memoizedTransactionSummary.weeklyTotals,
            memoizedTransactionSummary.totalSpent,
            memoizedTransactionSummary.topCategories,
            memoizedTransactionSummary.largestTransaction
        );
    }, [
        message,
        handleSlashCommand,
        pendingAiTransaction,
        setChatHistory,
        setMessage,
        chatHistory.length, // Only track length for animation trigger
        animateChatTransition,
        handleAIChat,
        setPendingAiTransaction,
        stableFunctions,
        memoizedTransactionSummary
    ]);

    // Document processor instance
    const documentProcessor = DocumentProcessorComponent({
        setIsProcessingDocument,
        extractTransactionsFromDocument,
        inferCategoryWithGemini,
        setChatHistory,
        setExtractedTransactions,
        parseTransactionDate,
        formatExtractedTransactions,
    });

    // Clear chat and reset UI
    const clearChat = async () => {
        console.log('[AIScreen] Clear button clicked'); // Debug log
        Keyboard.dismiss(); // Dismiss keyboard when clearing chat
        try {
            console.log('[AIScreen] Calling clearChatHistory'); // Debug log
            await clearChatHistory(resetAnimations);
            console.log('[AIScreen] Clear chat completed'); // Debug log
        } catch (error) {
            console.error('[AIScreen] Error clearing chat:', error);
        }
    };

    // Add keyboard listeners
    useEffect(() => {
        const keyboardWillShow = Platform.OS === 'ios'
            ? Keyboard.addListener('keyboardWillShow', (e) => {
                setKeyboardHeight(e.endCoordinates.height);
            })
            : Keyboard.addListener('keyboardDidShow', (e) => {
                setKeyboardHeight(e.endCoordinates.height);
            });

        const keyboardWillHide = Platform.OS === 'ios'
            ? Keyboard.addListener('keyboardWillHide', () => {
                setKeyboardHeight(0);
            })
            : Keyboard.addListener('keyboardDidHide', () => {
                setKeyboardHeight(0);
            });

        return () => {
            keyboardWillShow.remove();
            keyboardWillHide.remove();
        };
    }, []);

    return (
        <ScreenWrapper backgroundColor={COLORS.darkBackground} barStyle="light-content">
            <View style={styles.mainContainer}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.keyboardAvoidingView}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                >
                    <View style={styles.container}>
                        {/* Top Bar */}
                        <View style={styles.topBar}>
                            <TouchableOpacity
                                onPress={() => navigation?.goBack()}
                                style={styles.backButton}
                                activeOpacity={0.7}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Icon name="chevron-back" size={28} color={COLORS.text} />
                            </TouchableOpacity>
                            <Text style={styles.topBarTitle}>AI Chat Bot</Text>
                            {chatHistory.length > 0 && (
                                <TouchableOpacity
                                    onPress={clearChat}
                                    style={styles.clearButton}
                                    activeOpacity={0.7}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Icon name="trash-outline" size={24} color={COLORS.text} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Header Section */}
                        <Animated.View
                            style={[
                                styles.headerSection,
                                {
                                    opacity: headerOpacity,
                                    transform: [
                                        { scale: headerScale },
                                        {
                                            translateY: headerOpacity.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [-30, 0],
                                                extrapolate: 'clamp'
                                            })
                                        }
                                    ],
                                    height: headerHeight,
                                }
                            ]}
                        >
                            <Animated.Text
                                style={[
                                    styles.headerTitle,
                                    {
                                        transform: [{
                                            translateY: headerOpacity.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [-10, 0],
                                                extrapolate: 'clamp'
                                            })
                                        }]
                                    }
                                ]}
                            >
                                Insights
                            </Animated.Text>
                            <Animated.Text
                                style={[
                                    styles.headerSubtitle,
                                    {
                                        transform: [{
                                            translateY: headerOpacity.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [-5, 0],
                                                extrapolate: 'clamp'
                                            })
                                        }]
                                    }
                                ]}
                            >
                                Enjoy a personalized experience with our carefully curated AI chatting feature
                            </Animated.Text>
                        </Animated.View>

                        {/* Content Area */}
                        <View style={[
                            styles.scrollContainer,
                            {
                                marginTop: 20,
                                borderTopLeftRadius: SIZES.radius.large,
                                borderTopRightRadius: SIZES.radius.large,
                                flex: 1,
                            }
                        ]}>
                            {/* Network Status Indicator */}
                            {networkError && (
                                <View style={styles.networkErrorBanner}>
                                    <Icon name="wifi-outline" size={20} color={COLORS.white} />
                                    <Text style={styles.networkErrorText}>
                                        Connection issues detected
                                    </Text>
                                    <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
                                        <Text style={styles.retryButtonText}>Retry</Text>
                                    </TouchableOpacity>
                                </View>
                            )}



                            {/* Conditionally render EITHER insights/chart view OR chat view, not both */}
                            {showChart ? (
                                // Insights/Chart View - Made Scrollable
                                <View style={styles.chartViewContainer}>
                                    <ChartComponent
                                        isLoading={isLoading}
                                        error={error}
                                        chartData={chartData}
                                        insightMessage={insightMessage}
                                        insightOpacity={insightOpacity}
                                        chartScale={chartScale}
                                        chartSlideY={chartSlideY}
                                        monthName={currentDisplayMonthName}
                                        onRetry={handleRetry}
                                        suggestedQuestions={suggestedQuestions}
                                    >
                                        {/* Passing SuggestionComponent as children */}
                                        <SuggestionComponent
                                            suggestedQuestions={suggestedQuestions}
                                            onSuggestionClick={handleSuggestionClick}
                                        />
                                    </ChartComponent>
                                </View>
                            ) : (
                                // Chat View
                                <ChatComponent
                                    chatHistory={chatHistory}
                                    setChatHistory={setChatHistory}
                                    isTyping={isTyping}
                                    isProcessingDocument={isProcessingDocument}
                                    extractedTransactions={extractedTransactions}
                                    setExtractedTransactions={setExtractedTransactions}
                                    saveExtractedTransactions={(transactionsToSave) =>
                                        stableFunctions.actualSaveFunctionFromHook(transactionsToSave, setChatHistory)
                                    }
                                    chatOpacity={chatOpacity}
                                    chatScale={chatScale}
                                    chatSlideY={chatSlideY}
                                    borderHighlightOpacity={borderHighlightOpacity}
                                    handleSend={handleSend}
                                    retryDocumentProcessing={documentProcessor.retryDocumentProcessing}
                                />
                            )}
                        </View>

                        {/* Input Area */}
                        <ChatInputComponent
                            message={message}
                            setMessage={setMessage}
                            handleSend={handleSend}
                            handleDocumentPick={documentProcessor.handleDocumentPick}
                            isProcessingDocument={isProcessingDocument}
                            isTyping={isTyping}
                            keyboardHeight={keyboardHeight}
                        />
                    </View>
                </KeyboardAvoidingView>
            </View>
        </ScreenWrapper>
    );
};

export default AIScreen;

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: COLORS.darkBackground,
    },
    keyboardAvoidingView: {
        flex: 1,
        backgroundColor: COLORS.darkBackground,
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.darkBackground,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Platform.OS === 'android' ? SIZES.padding.medium : SIZES.padding.small,
        paddingBottom: SIZES.padding.small,
        paddingHorizontal: SIZES.padding.xxlarge,
        backgroundColor: COLORS.darkBackground,
        height: 70,
        zIndex: 1000,
        position: 'relative',
    },
    backButton: {
        width: 45,
        height: 45,
        borderRadius: 50,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        zIndex: 1002,
    },
    topBarTitle: {
        ...FONTS.h3,
        color: COLORS.textLight,
        textAlign: 'center',
        fontSize: SIZES.font.xlarge,
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        textAlignVertical: 'center',
        zIndex: 1001,
        pointerEvents: 'none',
    },
    headerSection: {
        paddingHorizontal: SIZES.padding.xlarge,
        backgroundColor: COLORS.darkBackground,
        marginTop: 20,
        paddingBottom: SIZES.padding.medium,
        // Add subtle gradient overlay
        position: 'relative',
    },
    headerTitle: {
        ...FONTS.largeTitle,
        color: COLORS.textLight,
        marginTop: 70,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    headerSubtitle: {
        ...FONTS.body2,
        color: COLORS.textGray,
        marginTop: SIZES.padding.small,
        marginRight: SIZES.padding.large,
        lineHeight: 22,
        opacity: 0.9,
        letterSpacing: 0.2,
    },
    scrollContainer: {
        flex: 1,
        backgroundColor: COLORS.appBackground,
        borderTopLeftRadius: SIZES.radius.large,
        borderTopRightRadius: SIZES.radius.large,
        marginTop: -20,
        overflow: 'hidden',
        position: 'relative',
        // Enhanced shadow for better depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 8,
        // Add subtle border for definition
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.05)',
    },
    clearButton: {
        width: 45,
        height: 45,
        borderRadius: 50,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        zIndex: 1002,
    },
    // Styles for Review Modal
    modalCenteredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: 'rgba(0,0,0,0.5)', // Dimmed background
    },
    modalView: {
        margin: 20,
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius.medium,
        padding: SIZES.padding.large,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '90%',
        maxHeight: '80%',
    },
    modalTitle: {
        ...FONTS.h3,
        marginBottom: SIZES.padding.medium,
        color: COLORS.textDark,
    },
    modalFlatList: {
        width: '100%',
        marginBottom: SIZES.padding.medium,
    },
    modalTransactionItem: {
        paddingVertical: SIZES.padding.small,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        width: '100%',
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginTop: SIZES.padding.small,
    },
    modalButton: {
        borderRadius: SIZES.radius.small,
        paddingVertical: SIZES.padding.small,
        paddingHorizontal: SIZES.padding.large,
        elevation: 2,
        minWidth: 120,
        alignItems: 'center',
    },
    modalButtonConfirm: {
        backgroundColor: COLORS.primary,
    },
    modalButtonDiscard: {
        backgroundColor: COLORS.accent,
    },
    modalButtonText: {
        color: COLORS.white,
        ...FONTS.body3_bold,
    },
    networkErrorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SIZES.padding.small,
        backgroundColor: COLORS.accent,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    networkErrorText: {
        ...FONTS.body3,
        color: COLORS.white,
        marginLeft: SIZES.padding.small,
    },
    retryButton: {
        padding: SIZES.padding.small,
        borderRadius: SIZES.radius.small,
        backgroundColor: COLORS.primary,
    },
    retryButtonText: {
        ...FONTS.body3_bold,
        color: COLORS.white,
    },
    chartViewContainer: {
        flex: 1,
        backgroundColor: COLORS.appBackground,
    },

});