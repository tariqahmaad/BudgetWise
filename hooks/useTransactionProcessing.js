import { useState, useCallback } from 'react';
import { firestore, collection, addDoc, Timestamp, doc, getDoc, updateDoc, query, where, getDocs, serverTimestamp } from '../firebase/firebaseConfig';
import { CATEGORY_ICONS, DEFAULT_CATEGORY_COLORS } from '../constants/theme';
import { cleanupEmptyCategories } from '../services/transactionService';

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

    // Function to infer category using Gemini, but only from predefined categories
    const inferCategoryWithGemini = useCallback(async (description) => {
        if (!description) return 'Uncategorized';

        // Get the list of predefined category labels
        const predefinedCategories = CATEGORY_ICONS.map(cat => cat.label);
        const categoriesString = predefinedCategories.join(', ');

        try {
            const prompt = `Given the transaction description: '${description}', which of these predefined categories best matches? Choose ONLY from this list: ${categoriesString}. If none match well, respond with "Uncategorized". Respond with only the category name, nothing else.`;
            const result = await generateResponse(prompt);

            // Clean and normalize the result
            const suggestedCategory = result.split('\n')[0].replace(/[^a-zA-Z0-9 &]/g, '').trim();

            // Check if the suggested category exists in our predefined list (case-insensitive)
            const matchedCategory = predefinedCategories.find(cat =>
                cat.toLowerCase() === suggestedCategory.toLowerCase()
            );

            if (matchedCategory) {
                console.log(`[AI Category] Matched predefined category: "${matchedCategory}" for description: "${description}"`);
                return matchedCategory;
            } else {
                console.log(`[AI Category] No predefined match found for: "${suggestedCategory}", using Uncategorized`);
                return 'Uncategorized';
            }
        } catch (e) {
            console.error('[AI Category] Error inferring category:', e);
            return 'Uncategorized';
        }
    }, [generateResponse]);

    // Function to extract concise description keyword using Gemini
    const extractDescriptionKeywordWithGemini = useCallback(async (sentence) => {
        try {
            const prompt = `Extract the main purchase item or keyword from this sentence: "${sentence}". Respond with only the keyword or short phrase, maximum 3-4 words.`;
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
        let dateStr = new Date().toISOString(); // Default to today with full timestamp

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
        if (dateStr !== new Date().toISOString()) {
            try {
                const parsedDate = parseTransactionDate(dateStr);
                if (parsedDate && !isNaN(parsedDate)) {
                    dateStr = parsedDate.toISOString();
                }
            } catch (e) {
                console.warn('Error parsing extracted date:', dateStr, e);
                // Fall back to today's date if parsing fails
                dateStr = new Date().toISOString();
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
                    // Always use full ISO string to match manual transaction format
                    const dateString = dateObj.toISOString();
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
                        createdAt: Timestamp.now(), // Use current upload time
                        date: dateString, // Keep original receipt date as full ISO string
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

            // Clean up any empty categories that might have been created but not used
            try {
                await cleanupEmptyCategories(user.uid);
                console.log('[Document Extract] Category cleanup completed');
            } catch (cleanupError) {
                console.error('[Document Extract] Error during category cleanup:', cleanupError);
                // Don't let cleanup errors affect the main transaction flow
            }

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

    // Enhanced helper function to check if a category exists with case-insensitive and trimmed matching
    const checkCategoryExists = useCallback(async (categoryName) => {
        if (!user || !categoryName) return { exists: false };

        try {
            // Normalize the category name: trim whitespace and convert to lowercase for comparison
            const normalizedCategoryName = categoryName.trim();
            const lowerCaseCategoryName = normalizedCategoryName.toLowerCase();

            const categoriesRef = collection(firestore, "users", user.uid, "categories");

            // Get all categories for this user to perform comprehensive checking
            const allCategoriesSnapshot = await getDocs(categoriesRef);

            // Check for any matching category using various field names and case-insensitive comparison
            for (const categoryDoc of allCategoriesSnapshot.docs) {
                const data = categoryDoc.data();

                // Check multiple possible field names that might contain the category name
                const fieldsToCheck = [
                    data.name,
                    data.label,
                    data.Category,
                    data.categoryName
                ];

                for (const fieldValue of fieldsToCheck) {
                    if (fieldValue && typeof fieldValue === 'string') {
                        const normalizedFieldValue = fieldValue.trim().toLowerCase();
                        if (normalizedFieldValue === lowerCaseCategoryName) {
                            console.log(`[Category Check] Found existing category: "${fieldValue}" matches "${categoryName}"`);
                            return { exists: true, doc: categoryDoc, exactMatch: fieldValue };
                        }
                    }
                }
            }

            console.log(`[Category Check] No existing category found for: "${categoryName}"`);
            return { exists: false };
        } catch (error) {
            console.error("Error checking category existence:", error);
            return { exists: false, error };
        }
    }, [user]);

    // Enhanced function to create a new category if it doesn't exist, but only for predefined categories
    const createCategoryIfNeeded = useCallback(async (categoryName) => {
        if (!user || !categoryName) return null;

        try {
            // Normalize the category name by trimming whitespace
            const normalizedCategoryName = categoryName.trim();

            if (!normalizedCategoryName) {
                console.warn("[AI Tx] Category name is empty after trimming, skipping creation");
                return null;
            }

            // Check if this category is in our predefined list (case-insensitive)
            const predefinedCategory = CATEGORY_ICONS.find(cat =>
                cat.label.toLowerCase() === normalizedCategoryName.toLowerCase()
            );

            if (!predefinedCategory) {
                console.warn(`[AI Tx] Category "${normalizedCategoryName}" is not in predefined list, skipping creation`);
                return null; // Don't create categories that aren't predefined
            }

            // Check if category already exists (case-insensitive)
            const { exists, doc, exactMatch } = await checkCategoryExists(normalizedCategoryName);

            // If category exists, return its ID and use the existing name format
            if (exists && doc) {
                console.log("[AI Tx] Category already exists:", exactMatch || normalizedCategoryName, "with ID:", doc.id);
                return doc.id;
            }

            // Use the exact predefined category data for consistency
            const iconName = predefinedCategory.name;
            const backgroundColor = DEFAULT_CATEGORY_COLORS
                ? DEFAULT_CATEGORY_COLORS[0].value
                : '#4CAF50'; // Default green color

            // Use the exact predefined label for consistency
            const properCaseName = predefinedCategory.label;

            const categoryData = {
                userId: user.uid,
                name: properCaseName,          // Primary identifier (use predefined label)
                iconName: iconName,            // Use predefined icon
                backgroundColor: backgroundColor, // For UI display
                createdAt: serverTimestamp(),
                label: properCaseName,         // Some parts might look for this
                Category: properCaseName,      // For compatibility with HomeScreen
                lastUpdated: serverTimestamp()
            };

            // Add the category to Firestore
            const docRef = await addDoc(collection(firestore, "users", user.uid, "categories"), categoryData);
            console.log("[AI Tx] Created new predefined category:", properCaseName, "with ID:", docRef.id);

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
                // Always use full ISO string to match manual transaction format
                dateString = dateObj.toISOString();
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

            // Add unique timestamp to prevent duplicates
            const uniqueTimestamp = Date.now();

            transactionData = {
                accountId: defaultAccount.id || '',
                accountName: defaultAccount.name || 'Main',
                amount: pendingAiTransaction.amount,
                category: categoryName,
                description: pendingAiTransaction.description || '',
                createdAt: Timestamp.now(), // Use current time when transaction is created
                date: dateString, // Keep user-specified or parsed date
                type: transactionType, // Use the determined type instead of hardcoding "Expenses"
                addedVia: 'ai-chat',
                clientTimestamp: uniqueTimestamp // Add unique client timestamp
            };

            // Check for recent duplicates before saving
            const recentTransactionsQuery = query(
                transactionsRef,
                where("amount", "==", pendingAiTransaction.amount),
                where("description", "==", pendingAiTransaction.description || ''),
                where("type", "==", transactionType),
                where("accountId", "==", defaultAccount.id || '')
            );

            const recentTransactions = await getDocs(recentTransactionsQuery);
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);

            const isDuplicate = recentTransactions.docs.some(doc => {
                const data = doc.data();
                const docTimestamp = data.clientTimestamp || (data.createdAt?.seconds * 1000) || 0;
                return docTimestamp > fiveMinutesAgo;
            });

            if (isDuplicate) {
                console.log("Duplicate AI transaction detected, skipping save");
                setChatHistory(prev => [...prev, {
                    role: 'model',
                    parts: [{ text: '⚠️ This transaction appears to have been saved already within the last 5 minutes.' }]
                }]);
                setPendingAiTransaction(null);
                return;
            }

            // Save transaction with retry logic
            let transactionDoc = null;
            let retryCount = 0;
            const maxRetries = 3;

            while (retryCount < maxRetries) {
                try {
                    transactionDoc = await addDoc(transactionsRef, transactionData);
                    break; // Success, exit retry loop
                } catch (saveError) {
                    retryCount++;
                    console.log(`AI transaction save attempt ${retryCount} failed:`, saveError.message);

                    if (saveError.code === 'already-exists' || saveError.message.includes('Document already exists')) {
                        console.warn("AI transaction might already exist, treating as duplicate");
                        setChatHistory(prev => [...prev, {
                            role: 'model',
                            parts: [{ text: '⚠️ This transaction may have already been saved. Please check your transaction history.' }]
                        }]);
                        setPendingAiTransaction(null);
                        return;
                    }

                    if (retryCount >= maxRetries) {
                        throw saveError; // Re-throw after max retries
                    }

                    // Wait before retry with exponential backoff
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
                }
            }

            if (!transactionDoc) {
                throw new Error("Failed to save AI transaction after multiple attempts");
            }

            // Update category timestamp if we have a valid categoryId (don't update amounts - let HomeScreen calculate dynamically)
            if (categoryId) {
                const categoryRef = doc(firestore, 'users', user.uid, 'categories', categoryId);
                // Update only the timestamp, not the amount (amounts are calculated dynamically)
                await updateDoc(categoryRef, {
                    lastUpdated: serverTimestamp()
                });
                console.log('[AI Tx Save] Updated category timestamp for:', categoryName);
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

            // Clean up any empty categories that might have been created but not used
            try {
                await cleanupEmptyCategories(user.uid);
                console.log('[AI Tx Save] Category cleanup completed');
            } catch (cleanupError) {
                console.error('[AI Tx Save] Error during category cleanup:', cleanupError);
                // Don't let cleanup errors affect the main transaction flow
            }

        } catch (error) {
            console.error('Error saving AI-suggested transaction:', error, transactionData);

            // Provide more specific error messages
            let errorMessage = 'There was an error saving your transaction. Please try again.';
            if (error.code === 'already-exists' || error.message.includes('Document already exists')) {
                errorMessage = '⚠️ This transaction may have already been saved. Please check your transaction history.';
            } else if (error.code === 'permission-denied') {
                errorMessage = '⚠️ Permission denied. Please check your account permissions.';
            } else if (error.code === 'network-request-failed') {
                errorMessage = '⚠️ Network error. Please check your connection and try again.';
            }

            setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: errorMessage }] }]);
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