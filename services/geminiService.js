import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get the Gemini Pro model
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Function to format transactions concisely for the prompt
const formatTransactionsForPrompt = (transactions = []) => {
    if (!transactions || transactions.length === 0) {
        return "No transactions recorded this month.";
    }
    // Sort by date descending
    const sortedTransactions = [...transactions].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    // Format all transactions passed
    return sortedTransactions.map(tx =>
        `- ${tx.createdAt ? tx.createdAt.toLocaleDateString() : 'N/A'}: $${tx.amount?.toFixed(2) || 'N/A'} (${tx.category || 'Uncategorized'})`
    ).join('\n');
};

// Function to format accounts for the prompt
const formatAccountsForPrompt = (accounts = []) => {
    if (!accounts || accounts.length === 0) {
        return "No accounts linked.";
    }
    return accounts.map(acc =>
        `- ${acc.name || 'Unnamed Account'}: $${acc.balance?.toFixed(2) || 'N/A'}`
    ).join('\n');
};

export const extractTransactionsFromDocument = async (base64Image, isStatementImage = true) => {
    try {
        console.log("[Gemini Service LOG] Processing document for transaction extraction");
        // Stronger prompt for extracting ALL transactions
        const prompt = isStatementImage
            ? `Extract every transaction from this bank statement image. For each row in the statement's transaction table, extract the date, description, amount, and category (if available). Output a JSON array, where each element is an object with 'date', 'description', 'amount' (as a number), and 'category'. Do not summarize or skip any transactions. Only output the JSON array, nothing else.`
            : `Extract all transaction details from this receipt image. For each transaction, extract the date, merchant name, total amount, and category if available. Output a JSON array, where each element is an object with 'date', 'description', 'amount' (as a number), and 'category'. Only output the JSON array, nothing else.`;

        // Call the model with the image (model 2.0-flash supports vision)
        const result = await model.generateContent([
            { text: prompt },
            { inlineData: { data: base64Image, mimeType: 'image/jpeg' } }
        ]);

        const response = await result.response;
        const extractedText = response.text();

        // Log the raw Gemini response for debugging
        console.log("[Gemini Service LOG] Raw Gemini response:\n", extractedText);
        console.log("[Gemini Service LOG] Document processing completed");

        // Try to parse the response as JSON
        try {
            // Find JSON in the response (it might be surrounded by markdown code blocks)
            const jsonMatch = extractedText.match(/```json\n([\s\S]*?)\n```/) ||
                extractedText.match(/```\n([\s\S]*?)\n```/) ||
                extractedText.match(/\[\s*\{[\s\S]*\}\s*\]/);

            const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : extractedText;
            const parsedData = JSON.parse(jsonString);

            return {
                success: true,
                transactions: Array.isArray(parsedData) ? parsedData : [parsedData],
                rawResponse: extractedText
            };
        } catch (parseError) {
            console.error("[Gemini Service LOG] Failed to parse JSON response:", parseError);
            // Return the raw text for display if JSON parsing fails
            return {
                success: false,
                transactions: [],
                rawResponse: extractedText
            };
        }
    } catch (error) {
        console.error('Error extracting transactions from document:', error);
        throw error;
    }
};

export const generateResponse = async (prompt) => {
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error generating response:', error);
        throw error;
    }
};

export const generateChatResponse = async (
    currentChatHistory,
    userProfile,
    transactionSummary,
    transactions,
    accounts
) => {
    try {
        console.log("[Gemini Service LOG] generateChatResponse called.");
        // Log received data
        console.log("[Gemini Service LOG] Received User Profile:", JSON.stringify(userProfile));
        console.log("[Gemini Service LOG] Received Transaction Summary:", JSON.stringify(transactionSummary));
        console.log("[Gemini Service LOG] Received Transactions Count:", transactions?.length);
        console.log("[Gemini Service LOG] Received Accounts Count:", accounts?.length);

        const userName = userProfile?.name || 'User';
        const { weeklyTotals = [], totalSpent = 0, topCategories = [], largestTransaction = null } = transactionSummary || {};
        const today = new Date().toLocaleDateString();

        // Format accounts and transactions as JSON for clarity
        const accountsJson = JSON.stringify(accounts, null, 2);
        // Limit to 30 most recent transactions
        const sortedTransactions = [...transactions].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        const recentTransactions = sortedTransactions.slice(0, 30);
        const transactionsJson = JSON.stringify(recentTransactions, null, 2);

        // Human-readable summaries
        const topCategoriesText = topCategories.length
            ? topCategories.map((c, i) => `${i + 1}. ${c.category}: $${c.total.toFixed(2)}`).join('\n')
            : 'No category data.';
        const largestTxText = largestTransaction
            ? `On ${largestTransaction.createdAt ? new Date(largestTransaction.createdAt).toLocaleDateString() : 'N/A'}, you spent $${largestTransaction.amount?.toFixed(2) || 'N/A'} on ${largestTransaction.category || 'Uncategorized'}.`
            : 'No transactions this month.';

        // Detect if this is the first user message in the chat history
        const isFirstUserMessage = currentChatHistory.filter(msg => msg.role === 'user').length === 1;

        // Instruction for the model
        const contextInstruction = `
You are BudgetWise, a smart, friendly, and professional financial assistant. Your job is to help users understand, manage, and optimize their personal finances.

${isFirstUserMessage ? `- Greet the user warmly and use their name if available (here: ${userName}) in your first message only.` : '- Do not greet the user again; focus on answering the user query directly.'}
- Respond in clear, concise, and encouraging language.
- When asked for advice, provide actionable, practical tips tailored to the user's spending patterns, goals, and recent transactions.
- If the user asks for explanations, break down financial concepts in simple terms, using examples when helpful.
- When showing data (like spending summaries or category breakdowns), use bullet points or tables for clarity, using markdown formatting.
- If the user asks for recommendations, suggest realistic steps and offer to set reminders or track progress.
- If you detect concerning trends (e.g., overspending, missed savings goals), gently point them out and offer supportive suggestions.
- Always respect user privacy and never make assumptions about their financial situation.
- End each response with a positive, motivating note or a question to keep the conversation going.
- Use markdown formatting for lists, code, and tables when appropriate.
- Always follow the user's instructions as specifically as possible, unless they are unsafe or unclear.

Today's date: ${today}

User Profile:
${JSON.stringify(userProfile, null, 2)}

Accounts:
${accountsJson}

Transaction Summary:
- Total spent this month: $${totalSpent.toFixed(2)}
- Weekly totals: [${weeklyTotals.join(', ')}]
- Top 3 categories: 
${topCategoriesText}
- Largest transaction: ${largestTxText}

Recent Transactions (JSON array, most recent first, max 30):
${transactionsJson}
`;

        // Get the latest user message
        const latestUserMessage = currentChatHistory[currentChatHistory.length - 1];
        if (!latestUserMessage || latestUserMessage.role !== 'user') {
            throw new Error("Cannot send message, invalid history state.");
        }

        // Prepend the context to the user's message
        const userMessageWithContext = {
            ...latestUserMessage,
            parts: [{ text: `${contextInstruction}\nUser Query: ${latestUserMessage.parts[0].text}` }]
        };

        // Use the rest of the history (excluding the latest user message)
        let historyForChatApi = currentChatHistory.slice(0, -1);

        // Remove all leading non-user messages
        while (historyForChatApi.length > 0 && historyForChatApi[0].role !== 'user') {
            historyForChatApi.shift();
        }

        // Start chat and send the message with context
        const chat = model.startChat({ history: historyForChatApi });
        const result = await chat.sendMessage(userMessageWithContext.parts[0].text);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('[Gemini Service LOG] Error in generateChatResponse:', error);

        // Provide more specific user-facing error messages
        if (error.message && error.message.includes('API key not valid')) {
            return "There seems to be an issue connecting to the AI service (API Key). Please check the configuration or contact support.";
        } else if (error.response && error.response.promptFeedback?.blockReason) {
            // Handle safety blocks
            console.warn(`[Gemini Service] Blocked Response. Reason: ${error.response.promptFeedback.blockReason}`);
            return "I cannot provide a response due to safety guidelines. Could you please rephrase or ask something else?";
        } else {
            // Generic error
            return "Sorry, I encountered an error processing your request. Please try again later.";
        }
    }
}; 