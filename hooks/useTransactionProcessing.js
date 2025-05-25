import { useState, useCallback } from 'react';
import { firestore, collection, addDoc, Timestamp, doc, getDoc, updateDoc, query, where, getDocs, serverTimestamp } from '../firebase/firebaseConfig';
import { CATEGORY_ICONS, DEFAULT_CATEGORY_COLORS } from '../constants/theme';

/**
 * Custom hook for transaction processing and management
 * Handles transaction extraction, saving, suggestions, and more
 */
const useTransactionProcessing = (user, accounts, generateResponse) => {
    const [extractedTransactions, setExtractedTransactions] = useState([]);
    const [pendingAiTransaction, setPendingAiTransaction] = useState(null);
    const [isProcessingDocument, setIsProcessingDocument] = useState(false);

    // Format extracted transactions for display in chat
    const formatExtractedTransactions = useCallback((transactions) => {
        return transactions.map((tx, index) =>
            `${index + 1}. **${tx.date}**: ${tx.description} - $${tx.amount.toFixed(2)} (${tx.category})`
        ).join('\n');
    }, []);

    // Helper function to parse dates from different formats
    const parseTransactionDate = useCallback((dateString) => {
        if (!dateString) return new Date();

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
    }, []);

    // Function to infer category using Gemini if missing
    const inferCategoryWithGemini = useCallback(async (description) => {
        if (!description) return 'Uncategorized';
        try {
            const prompt = `Given the transaction description: '${description}', what is the most likely spending category? Respond with a single word or short phrase.`;
            const result = await generateResponse(prompt);
            // Take the first word/line as the category
            return result.split('\n')[0].replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'Uncategorized';
        } catch (e) {
            return 'Uncategorized';
        }
    }, [generateResponse]);

    // Function to extract concise description keyword using Gemini
    const extractDescriptionKeywordWithGemini = useCallback(async (sentence) => {
        try {
            const prompt = `Extract the main purchase item or keyword from this sentence: "${sentence}". Respond with only the keyword or short phrase.`;
            const result = await generateResponse(prompt);
            return result.split('\n')[0].replace(/[^a-zA-Z0-9 ]/g, '').trim();
        } catch (e) {
            return sentence; // fallback
        }
    }, [generateResponse]);

    // Enhanced parser for natural language (amount, account, description)
    const parseTransactionFromAiResponse = useCallback((text, userMsg) => {
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

        // Enhanced date extraction - try multiple date patterns
        let dateStr = new Date().toISOString().split('T')[0]; // Default to today

        // Pattern: "on [date]" - e.g., "on January 15" or "on 01/15/2023"
        const onDateMatch = userMsg.match(/on ([A-Za-z0-9 ,\/-]+)/i);
        if (onDateMatch) {
            dateStr = onDateMatch[1].trim();
        }

        // Pattern: "for [date]" - e.g., "for January 15" 
        else if (!forMatch) { // Only if not already used for description
            const forDateMatch = userMsg.match(/for ([A-Za-z0-9 ,\/-]+)/i);
            if (forDateMatch && forDateMatch[1].match(/[0-9]/)) { // Must contain at least one number to be a date
                dateStr = forDateMatch[1].trim();
            }
        }

        // Pattern: "dated [date]" - e.g., "dated 2023-01-15"
        const datedMatch = userMsg.match(/dated ([A-Za-z0-9 ,\/-]+)/i);
        if (datedMatch) {
            dateStr = datedMatch[1].trim();
        }

        // Pattern: "[date]" with common date formats - e.g., "01/15/2023" or "2023-01-15"
        const standaloneDateMatch = userMsg.match(/\b(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})\b/) ||
            userMsg.match(/\b(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})\b/);
        if (standaloneDateMatch) {
            dateStr = standaloneDateMatch[1].trim();
        }

        // Pattern: Month name and day - e.g., "January 15" or "Jan 15"
        const monthDayMatch = userMsg.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i);
        if (monthDayMatch) {
            const month = monthDayMatch[1];
            const day = monthDayMatch[2];
            const year = new Date().getFullYear(); // Default to current year
            dateStr = `${month} ${day}, ${year}`;
        }

        // If date string found, try to parse it properly
        if (dateStr !== new Date().toISOString().split('T')[0]) {
            try {
                const parsedDate = parseTransactionDate(dateStr);
                if (parsedDate && !isNaN(parsedDate)) {
                    dateStr = parsedDate.toISOString().split('T')[0];
                }
            } catch (e) {
                console.warn('Error parsing extracted date:', dateStr, e);
                // Fall back to today's date if parsing fails
                dateStr = new Date().toISOString().split('T')[0];
            }
        }

        if (amount) {
            return {
                amount: amount,
                category: category,
                date: dateStr,
                description: description,
                accountObj: accountObj // Pass the found account object
            };
        }
        return null;
    }, [accounts, parseTransactionDate]);

    // Function to save extracted transactions to Firestore
    const saveExtractedTransactions = useCallback(async (transactionsToSave, setChatHistoryCallback) => {
        if (!user || !transactionsToSave || transactionsToSave.length === 0) {
            if (setChatHistoryCallback) {
                setChatHistoryCallback(prev => [...prev, {
                    role: 'model',
                    parts: [{ text: "No transactions were provided to save." }]
                }]);
            }
            return;
        }

        try {
            setIsProcessingDocument(true); // Show loading state
            const defaultAccount = accounts && accounts.length > 0
                ? { id: accounts[0].id || '', name: accounts[0].name || 'Main' }
                : { id: '', name: 'Main' };

            const transactionsRef = collection(firestore, 'users', user.uid, 'transactions');

            // Process each transaction from the passed argument
            const savedPromises = transactionsToSave.map(async (tx) => {
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

                    // Determine transaction type based on context
                    // Default to Expenses, but check if there are keywords indicating income
                    let transactionType = 'Expenses'; // Default
                    const description = tx.description || '';
                    const incomeKeywords = ['income', 'salary', 'paycheck', 'deposit', 'received', 'refund', 'reimbursement'];

                    // Check if any income keywords appear in the description
                    if (incomeKeywords.some(keyword => description.toLowerCase().includes(keyword))) {
                        transactionType = 'Income';
                    }

                    // Allow explicit type if provided
                    if (tx.type) {
                        transactionType = tx.type;
                    }

                    const transactionData = {
                        accountId: defaultAccount.id,
                        accountName: defaultAccount.name,
                        amount: tx.amount,
                        category: category,
                        description: tx.description,
                        createdAt: Timestamp.fromDate(dateObj), // Use the date from the statement
                        date: dateString, // Always YYYY-MM-DD
                        type: transactionType, // Use dynamic type rather than hardcoded
                        addedVia: 'document-extract'
                    };

                    // Add transaction to Firestore
                    const docRef = await addDoc(transactionsRef, transactionData);

                    // Create category if it doesn't exist and update it
                    const categoryId = await createCategoryIfNeeded(category);
                    if (categoryId && transactionType === 'Expenses') { // Only update categories for expenses
                        const categoryRef = doc(firestore, 'users', user.uid, 'categories', categoryId);
                        await updateDoc(categoryRef, {
                            lastUpdated: serverTimestamp()
                        });
                    }

                    // Update account balance based on transaction type
                    const accountRef = doc(firestore, 'users', user.uid, 'accounts', defaultAccount.id);
                    const accountDoc = await getDoc(accountRef);

                    if (accountDoc.exists()) {
                        const accountData = accountDoc.data();
                        const currentBalance = accountData.currentBalance || 0;
                        const totalIncome = accountData.totalIncome || 0;
                        const totalExpenses = accountData.totalExpenses || 0;

                        if (transactionType === 'Income') {
                            // For income, increase balance and totalIncome
                            await updateDoc(accountRef, {
                                currentBalance: currentBalance + tx.amount,
                                totalIncome: totalIncome + tx.amount
                            });
                        } else { // Expense
                            // For expenses, decrease balance and increase totalExpenses
                            await updateDoc(accountRef, {
                                currentBalance: currentBalance - tx.amount,
                                totalExpenses: totalExpenses + tx.amount
                            });
                        }
                    }

                    return docRef.id;
                } catch (error) {
                    console.error('Error saving transaction:', error, tx);
                    return null;
                }
            });

            // Wait for all transactions to be saved
            const results = await Promise.all(savedPromises);
            const successCount = results.filter(id => id !== null).length;

            // Add confirmation message to chat
            if (setChatHistoryCallback) {
                const confirmationMessage = {
                    role: 'model',
                    parts: [{ text: `✅ Added ${successCount} of ${transactionsToSave.length} transactions to your account.` }]
                };
                setChatHistoryCallback(prev => [...prev, confirmationMessage]);
            }

            // Clear the main extractedTransactions state in the hook
            setExtractedTransactions([]);
        } catch (error) {
            console.error('Error saving transactions:', error);
            if (setChatHistoryCallback) {
                const errorMessage = {
                    role: 'model',
                    parts: [{ text: "There was an error saving your transactions. Please try again." }]
                };
                setChatHistoryCallback(prev => [...prev, errorMessage]);
            }
        } finally {
            setIsProcessingDocument(false);
        }
    }, [user, accounts, setIsProcessingDocument, setExtractedTransactions, parseTransactionDate, inferCategoryWithGemini, createCategoryIfNeeded]);

    // Helper function to check if a category exists
    const checkCategoryExists = useCallback(async (categoryName) => {
        if (!user) return false;

        try {
            // Query both by name and by label to catch all possible matches
            const categoriesRef = collection(firestore, "users", user.uid, "categories");

            // Check by name field (primary field)
            const nameQuery = query(categoriesRef, where("name", "==", categoryName));
            const nameSnapshot = await getDocs(nameQuery);

            if (!nameSnapshot.empty) {
                return { exists: true, doc: nameSnapshot.docs[0] };
            }

            // Also check by label field (some categories might use this field)
            const labelQuery = query(categoriesRef, where("label", "==", categoryName));
            const labelSnapshot = await getDocs(labelQuery);

            if (!labelSnapshot.empty) {
                return { exists: true, doc: labelSnapshot.docs[0] };
            }

            return { exists: false };
        } catch (error) {
            console.error("Error checking category existence:", error);
            return { exists: false, error };
        }
    }, [user]);

    // Function to create a new category if it doesn't exist
    const createCategoryIfNeeded = useCallback(async (categoryName) => {
        if (!user) return null;

        try {
            // Check if category already exists
            const { exists, doc } = await checkCategoryExists(categoryName);

            // If category exists, return its ID
            if (exists && doc) {
                console.log("[AI Tx] Category already exists:", categoryName, "with ID:", doc.id);
                return doc.id;
            }

            // Find the matching category icon from theme (imported from constants/theme)
            // First check if we can find a match in the predefined categories
            const categoryMatch = CATEGORY_ICONS.find(cat =>
                cat.label.toLowerCase() === categoryName.toLowerCase());

            // Use matched icon or default to a generic icon
            const iconName = categoryMatch?.name || 'pricetag-outline'; // Default if not found
            const backgroundColor = DEFAULT_CATEGORY_COLORS
                ? DEFAULT_CATEGORY_COLORS[0].value
                : '#4CAF50'; // Default green color

            // Create the category data with a consistent structure
            const categoryData = {
                userId: user.uid,
                name: categoryName,      // Primary identifier 
                iconName: iconName,      // For rendering category icons
                backgroundColor: backgroundColor, // For UI display
                createdAt: serverTimestamp(),
                label: categoryName,     // Some parts might look for this
                Category: categoryName,  // For compatibility
                amount: "$0.00",        // Initialize with zero amount
                description: "Created by AI", // Default description
                lastUpdated: serverTimestamp()
            };

            // Add the category to Firestore
            const docRef = await addDoc(collection(firestore, "users", user.uid, "categories"), categoryData);
            console.log("[AI Tx] Created new category:", categoryName, "with ID:", docRef.id);

            return docRef.id;
        } catch (error) {
            console.error("[AI Tx] Error creating category:", error);
            return null;
        }
    }, [user, checkCategoryExists]);

    // Function to save AI-suggested transaction to Firestore
    const saveAiSuggestedTransaction = useCallback(async (setChatHistory) => {
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
            console.log('[AI Tx Save] Determined Default Account:', defaultAccount); // Log the default account

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

            // Process category - check if it exists or create new one if needed
            let categoryName = pendingAiTransaction.category;
            if (!categoryName) {
                categoryName = await inferCategoryWithGemini(pendingAiTransaction.description);
                if (!categoryName) categoryName = 'Uncategorized';
            }

            // Create or find the category, and get its ID
            const categoryId = await createCategoryIfNeeded(categoryName);
            console.log('[AI Tx Save] Using category:', categoryName, 'with ID:', categoryId);

            // Determine transaction type based on context
            // Default to Expenses, but check if there are keywords indicating income
            let transactionType = 'Expenses';
            const description = pendingAiTransaction.description || '';
            const incomeKeywords = ['income', 'salary', 'paycheck', 'deposit', 'received', 'refund', 'reimbursement'];

            // Check if any income keywords appear in the description
            if (incomeKeywords.some(keyword => description.toLowerCase().includes(keyword))) {
                transactionType = 'Income';
            }

            // Allow user to explicitly set type through pendingAiTransaction
            if (pendingAiTransaction.type) {
                transactionType = pendingAiTransaction.type;
            }

            transactionData = {
                accountId: defaultAccount.id || '',
                accountName: defaultAccount.name || 'Main',
                amount: pendingAiTransaction.amount,
                category: categoryName,
                description: pendingAiTransaction.description || '',
                createdAt: Timestamp.fromDate(dateObj),
                date: dateString,
                type: transactionType, // Use the determined type instead of hardcoding "Expenses"
                addedVia: 'ai-chat'
            };

            // Add transaction to Firestore
            await addDoc(transactionsRef, transactionData);

            // Update category amount if we have a valid categoryId
            if (categoryId) {
                const categoryRef = doc(firestore, 'users', user.uid, 'categories', categoryId);
                // First get the current category data
                const categoryDoc = await getDoc(categoryRef);

                if (categoryDoc.exists()) {
                    // Update the category with the new transaction amount
                    await updateDoc(categoryRef, {
                        amount: `$${pendingAiTransaction.amount.toFixed(2)}`,
                        description: pendingAiTransaction.description || 'AI transaction',
                        lastUpdated: serverTimestamp()
                    });
                    console.log('[AI Tx Save] Updated category amount for:', categoryName);
                }
            }

            // Update the account balance
            console.log('[AI Tx Save] Attempting to update account ID:', defaultAccount.id);
            if (!defaultAccount.id) {
                console.error('[AI Tx Save] CRITICAL: defaultAccount.id is empty. Cannot update balance.');
                // Potentially inform the user via chat history if appropriate
                setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: '⚠️ Error: Could not identify account to update balance. Transaction saved but balance may be incorrect.' }] }]);
                // Do not proceed to updateDoc if id is missing
            } else {
                const accountRef = doc(firestore, 'users', user.uid, 'accounts', defaultAccount.id);
                const accountDoc = await getDoc(accountRef);

                if (accountDoc.exists()) {
                    const accountData = accountDoc.data();
                    const currentBalance = accountData.currentBalance || 0;
                    const totalIncome = accountData.totalIncome || 0;
                    const totalExpenses = accountData.totalExpenses || 0;

                    // Update account based on transaction type
                    if (transactionType === 'Income') {
                        // For income, increase balance and totalIncome
                        await updateDoc(accountRef, {
                            currentBalance: currentBalance + pendingAiTransaction.amount,
                            totalIncome: totalIncome + pendingAiTransaction.amount
                        });
                        console.log('[AI Tx Save] Income added to account balance for ID:', defaultAccount.id);
                    } else {
                        // For expenses, decrease balance and increase totalExpenses
                        await updateDoc(accountRef, {
                            currentBalance: currentBalance - pendingAiTransaction.amount,
                            totalExpenses: totalExpenses + pendingAiTransaction.amount
                        });
                        console.log('[AI Tx Save] Expense deducted from account balance for ID:', defaultAccount.id);
                    }
                } else {
                    console.warn('[AI Tx Save] Account document not found for ID:', defaultAccount.id, '. Balance not updated.');
                    setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: `⚠️ Warning: Account (ID: ${defaultAccount.id}) not found. Balance not updated.` }] }]);
                }
            }

            setChatHistory(prev => [...prev, {
                role: 'model',
                parts: [{
                    text: `✅ ${transactionType} transaction of $${pendingAiTransaction.amount.toFixed(2)} added to your account.`
                }]
            }]);
            setPendingAiTransaction(null);
        } catch (error) {
            console.error('Error saving AI-suggested transaction:', error, transactionData);
            setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: 'There was an error saving your transaction. Please try again.' }] }]);
        } finally {
            setIsProcessingDocument(false);
        }
    }, [user, pendingAiTransaction, accounts, setIsProcessingDocument, setPendingAiTransaction, parseTransactionDate, inferCategoryWithGemini, createCategoryIfNeeded]);

    return {
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
        saveExtractedTransactions,
        saveAiSuggestedTransaction
    };
};

export default useTransactionProcessing; 