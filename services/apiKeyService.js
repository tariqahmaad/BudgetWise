import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEYS_STORAGE_KEY = '@budgetwise_api_keys';

class APIKeyService {
    constructor() {
        this.storageKey = API_KEYS_STORAGE_KEY;
        this.defaultKeys = {
            gemini: null,
            exchangeRate: null,
            geminiModel: 'gemini-2.5-flash-lite-preview-06-17' // Default model
        };
    }

    // Get all stored API keys
    async getAPIKeys() {
        try {
            const storedKeys = await AsyncStorage.getItem(this.storageKey);
            if (storedKeys) {
                return { ...this.defaultKeys, ...JSON.parse(storedKeys) };
            }
            return this.defaultKeys;
        } catch (error) {
            console.error('Error getting API keys:', error);
            return this.defaultKeys;
        }
    }

    // Save API keys securely
    async saveAPIKeys(keys) {
        try {
            const currentKeys = await this.getAPIKeys();
            const updatedKeys = { ...currentKeys, ...keys };
            await AsyncStorage.setItem(this.storageKey, JSON.stringify(updatedKeys));
            return { success: true };
        } catch (error) {
            console.error('Error saving API keys:', error);
            return { success: false, error: error.message };
        }
    }

    // Get specific API key
    async getAPIKey(keyType) {
        const keys = await this.getAPIKeys();
        return keys[keyType];
    }

    // Save specific API key
    async saveAPIKey(keyType, keyValue) {
        const keys = await this.getAPIKeys();
        keys[keyType] = keyValue;
        return await this.saveAPIKeys(keys);
    }

    // Remove specific API key
    async removeAPIKey(keyType) {
        const keys = await this.getAPIKeys();
        keys[keyType] = null;
        return await this.saveAPIKeys(keys);
    }

    // Clear all API keys
    async clearAllAPIKeys() {
        try {
            await AsyncStorage.removeItem(this.storageKey);
            return { success: true };
        } catch (error) {
            console.error('Error clearing API keys:', error);
            return { success: false, error: error.message };
        }
    }

    // Validate Gemini API key and model
    async validateGeminiKey(apiKey, modelName = null) {
        if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
            return { isValid: false, error: 'API key is required' };
        }

        // Use provided model name or get from storage or use default
        let testModel = modelName;
        if (!testModel) {
            const keys = await this.getAPIKeys();
            testModel = keys.geminiModel || 'gemini-2.5-flash-lite-preview-06-17';
        }

        try {
            const genAI = new GoogleGenerativeAI(apiKey.trim());
            const model = genAI.getGenerativeModel({ model: testModel });

            // Test with a simple prompt
            const result = await model.generateContent("Hello");
            const response = await result.response;
            const text = response.text();

            if (text && text.length > 0) {
                return { isValid: true };
            } else {
                return { isValid: false, error: 'Invalid response from Gemini API' };
            }
        } catch (error) {
            console.error('Gemini API validation error:', error);

            if (error.message.includes('API key not valid')) {
                return { isValid: false, error: 'Invalid API key format or unauthorized' };
            } else if (error.message.includes('quota')) {
                return { isValid: false, error: 'API key quota exceeded' };
            } else if (error.message.includes('model') && error.message.includes('not found')) {
                return { isValid: false, error: `Invalid model name: ${testModel}` };
            } else if (error.message.includes('permission') || error.message.includes('access')) {
                return { isValid: false, error: 'Model access denied - check your API key permissions' };
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                return { isValid: false, error: 'Network error - please check your connection' };
            } else {
                return { isValid: false, error: 'Failed to validate API key or model' };
            }
        }
    }

    // Validate Exchange Rate API key
    async validateExchangeRateKey(apiKey) {
        if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
            return { isValid: false, error: 'API key is required' };
        }

        try {
            const testUrl = `https://v6.exchangerate-api.com/v6/${apiKey.trim()}/latest/USD`;
            const response = await fetch(testUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                timeout: 8000
            });

            if (!response.ok) {
                if (response.status === 401) {
                    return { isValid: false, error: 'Invalid API key or unauthorized' };
                } else if (response.status === 403) {
                    return { isValid: false, error: 'API key access forbidden' };
                } else if (response.status === 429) {
                    return { isValid: false, error: 'API rate limit exceeded' };
                } else {
                    return { isValid: false, error: `HTTP ${response.status}: ${response.statusText}` };
                }
            }

            const data = await response.json();

            if (data.result === 'success' && data.conversion_rates) {
                return { isValid: true };
            } else {
                return { isValid: false, error: data.error || 'Invalid API response' };
            }
        } catch (error) {
            console.error('Exchange Rate API validation error:', error);

            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                return { isValid: false, error: 'Network error - please check your connection' };
            } else {
                return { isValid: false, error: 'Failed to validate API key' };
            }
        }
    }

    // Check if any API keys are configured
    async hasConfiguredKeys() {
        const keys = await this.getAPIKeys();
        return !!(keys.gemini || keys.exchangeRate);
    }

    // Get API key status for display
    async getKeyStatus() {
        const keys = await this.getAPIKeys();
        return {
            gemini: {
                configured: !!keys.gemini,
                masked: keys.gemini ? this.maskAPIKey(keys.gemini) : null,
                model: keys.geminiModel || 'gemini-2.5-flash-lite-preview-06-17'
            },
            exchangeRate: {
                configured: !!keys.exchangeRate,
                masked: keys.exchangeRate ? this.maskAPIKey(keys.exchangeRate) : null
            }
        };
    }



    // Validate model name format
    validateModelName(modelName) {
        if (!modelName || typeof modelName !== 'string') {
            return { isValid: false, error: 'Model name is required' };
        }

        const trimmed = modelName.trim();
        if (trimmed.length === 0) {
            return { isValid: false, error: 'Model name cannot be empty' };
        }

        // Basic format validation for Gemini models
        if (!trimmed.match(/^gemini/i)) {
            return { isValid: false, error: 'Model name should start with "gemini"' };
        }

        return { isValid: true };
    }

    // Utility function to mask API key for display
    maskAPIKey(key) {
        if (!key || key.length < 8) return '••••••••';
        return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
    }
}

// Export singleton instance
export default new APIKeyService(); 