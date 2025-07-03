import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    ScrollView,
    Platform,
    TextInput,
    Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import ScreenWrapper from '../../Components/ScreenWrapper';
import BackButton from '../../Components/Buttons/BackButton';
import APIKeyService from '../../services/apiKeyService';

// Predefined Gemini models
const PREDEFINED_MODELS = [
    {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        description: 'Most capable model for complex tasks',
        value: 'gemini-2.5-pro'
    },
    {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        description: 'Fast and efficient for most tasks',
        value: 'gemini-2.5-flash'
    },
    {
        id: 'gemini-2.5-flash-lite-preview-06-17',
        name: 'Gemini 2.5 Flash Lite',
        description: 'Lightweight preview version',
        value: 'gemini-2.5-flash-lite-preview-06-17'
    }
];

const APIKeysScreen = () => {
    const navigation = useNavigation();

    // Refs for TextInputs
    const geminiKeyRef = useRef(null);
    const geminiModelRef = useRef(null);
    const exchangeRateKeyRef = useRef(null);

    // API Key states
    const [geminiKey, setGeminiKey] = useState('');
    const [exchangeRateKey, setExchangeRateKey] = useState('');
    const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash-lite-preview-06-17');
    const [originalGeminiKey, setOriginalGeminiKey] = useState('');
    const [originalExchangeRateKey, setOriginalExchangeRateKey] = useState('');
    const [originalGeminiModel, setOriginalGeminiModel] = useState('gemini-2.5-flash-lite-preview-06-17');

    // Loading states
    const [isLoadingKeys, setIsLoadingKeys] = useState(true);
    const [isTestingGemini, setIsTestingGemini] = useState(false);
    const [isTestingExchangeRate, setIsTestingExchangeRate] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Status states
    const [geminiStatus, setGeminiStatus] = useState(null);
    const [exchangeRateStatus, setExchangeRateStatus] = useState(null);
    const [modelStatus, setModelStatus] = useState(null);

    // Model selection states
    const [useCustomModel, setUseCustomModel] = useState(false);
    const [customModel, setCustomModel] = useState('');

    // Load existing API keys
    const loadAPIKeys = useCallback(async () => {
        setIsLoadingKeys(true);
        try {
            const keys = await APIKeyService.getAPIKeys();

            setGeminiKey(keys.gemini || '');
            setExchangeRateKey(keys.exchangeRate || '');

            const loadedModel = keys.geminiModel || 'gemini-2.5-flash-lite-preview-06-17';
            setGeminiModel(loadedModel);
            setOriginalGeminiModel(loadedModel);

            // Check if loaded model is a predefined one
            const isPredefined = PREDEFINED_MODELS.some(model => model.value === loadedModel);
            setUseCustomModel(!isPredefined);
            if (!isPredefined) {
                setCustomModel(loadedModel);
            }

            setOriginalGeminiKey(keys.gemini || '');
            setOriginalExchangeRateKey(keys.exchangeRate || '');
        } catch (error) {
            console.error('Error loading API keys:', error);
            Alert.alert('Error', 'Failed to load API keys');
        } finally {
            setIsLoadingKeys(false);
        }
    }, []);

    useEffect(() => {
        loadAPIKeys();
    }, [loadAPIKeys]);

    // Handle predefined model selection
    const selectPredefinedModel = useCallback((modelValue) => {
        setGeminiModel(modelValue);
        setUseCustomModel(false);
        setModelStatus(null);
    }, []);

    // Handle custom model toggle
    const toggleCustomModel = useCallback(() => {
        const newUseCustom = !useCustomModel;
        setUseCustomModel(newUseCustom);

        if (newUseCustom) {
            // Switching to custom model
            setGeminiModel(customModel);
        } else {
            // Switching back to predefined, use the first predefined model
            setGeminiModel(PREDEFINED_MODELS[0].value);
        }
        setModelStatus(null);
    }, [useCustomModel, customModel]);

    // Handle custom model input change
    const handleCustomModelChange = useCallback((text) => {
        setCustomModel(text);
        setGeminiModel(text);
        setModelStatus(null);
    }, []);

    // Test Gemini API key
    const testGeminiKey = useCallback(async () => {
        if (!geminiKey.trim()) {
            Alert.alert('Error', 'Please enter a Gemini API key first');
            return;
        }

        // Validate model name first
        const modelValidation = APIKeyService.validateModelName(geminiModel);
        if (!modelValidation.isValid) {
            setModelStatus({ type: 'error', message: modelValidation.error });
            Alert.alert('Invalid Model', modelValidation.error);
            return;
        }

        setIsTestingGemini(true);
        setGeminiStatus(null);
        setModelStatus(null);

        try {
            const result = await APIKeyService.validateGeminiKey(geminiKey, geminiModel);
            if (result.isValid) {
                setGeminiStatus({ type: 'success', message: `API key and model "${geminiModel}" are working!` });
                setModelStatus({ type: 'success', message: 'Model is valid and accessible' });
                Alert.alert('Success', `Gemini API key and model "${geminiModel}" are valid and working!`);
            } else {
                setGeminiStatus({ type: 'error', message: result.error });
                if (result.error.includes('model')) {
                    setModelStatus({ type: 'error', message: result.error });
                }
                Alert.alert('Validation Failed', result.error);
            }
        } catch (error) {
            const errorMessage = 'Failed to test API key and model. Please try again.';
            setGeminiStatus({ type: 'error', message: errorMessage });
            Alert.alert('Test Failed', errorMessage);
        } finally {
            setIsTestingGemini(false);
        }
    }, [geminiKey, geminiModel]);

    // Test Exchange Rate API key
    const testExchangeRateKey = useCallback(async () => {
        if (!exchangeRateKey.trim()) {
            Alert.alert('Error', 'Please enter an Exchange Rate API key first');
            return;
        }

        setIsTestingExchangeRate(true);
        setExchangeRateStatus(null);

        try {
            const result = await APIKeyService.validateExchangeRateKey(exchangeRateKey);
            if (result.isValid) {
                setExchangeRateStatus({ type: 'success', message: 'API key is valid and working!' });
                Alert.alert('Success', 'Exchange Rate API key is valid and working!');
            } else {
                setExchangeRateStatus({ type: 'error', message: result.error });
                Alert.alert('Invalid API Key', result.error);
            }
        } catch (error) {
            const errorMessage = 'Failed to test API key. Please try again.';
            setExchangeRateStatus({ type: 'error', message: errorMessage });
            Alert.alert('Test Failed', errorMessage);
        } finally {
            setIsTestingExchangeRate(false);
        }
    }, [exchangeRateKey]);

    // Save API keys
    const saveAPIKeys = useCallback(async () => {
        setIsSaving(true);
        try {
            const keysToSave = {};

            // Only save if keys have changed
            if (geminiKey !== originalGeminiKey) {
                keysToSave.gemini = geminiKey.trim() || null;
            }
            if (exchangeRateKey !== originalExchangeRateKey) {
                keysToSave.exchangeRate = exchangeRateKey.trim() || null;
            }
            if (geminiModel !== originalGeminiModel) {
                keysToSave.geminiModel = geminiModel.trim();
            }

            if (Object.keys(keysToSave).length === 0) {
                Alert.alert('No Changes', 'No changes to save');
                return;
            }

            const result = await APIKeyService.saveAPIKeys(keysToSave);
            if (result.success) {
                setOriginalGeminiKey(geminiKey);
                setOriginalExchangeRateKey(exchangeRateKey);
                setOriginalGeminiModel(geminiModel);
                Alert.alert('Success', 'API configuration saved successfully!');
            } else {
                Alert.alert('Error', result.error || 'Failed to save API keys');
            }
        } catch (error) {
            console.error('Error saving API keys:', error);
            Alert.alert('Error', 'Failed to save API keys');
        } finally {
            setIsSaving(false);
        }
    }, [geminiKey, exchangeRateKey, geminiModel, originalGeminiKey, originalExchangeRateKey, originalGeminiModel]);

    // Save only the Gemini model
    const saveGeminiModel = useCallback(async () => {
        if (geminiModel === originalGeminiModel) {
            Alert.alert('No Changes', 'No model changes to save');
            return;
        }

        // Validate model name before saving
        const modelValidation = APIKeyService.validateModelName(geminiModel);
        if (!modelValidation.isValid) {
            setModelStatus({ type: 'error', message: modelValidation.error });
            Alert.alert('Invalid Model', modelValidation.error);
            return;
        }

        setIsSaving(true);
        try {
            const result = await APIKeyService.saveAPIKeys({ geminiModel: geminiModel.trim() });
            if (result.success) {
                setOriginalGeminiModel(geminiModel);
                setModelStatus({ type: 'success', message: 'Model saved successfully!' });
                Alert.alert('Success', 'Gemini model saved successfully!');
            } else {
                setModelStatus({ type: 'error', message: result.error || 'Failed to save model' });
                Alert.alert('Error', result.error || 'Failed to save model');
            }
        } catch (error) {
            console.error('Error saving Gemini model:', error);
            setModelStatus({ type: 'error', message: 'Failed to save model' });
            Alert.alert('Error', 'Failed to save Gemini model');
        } finally {
            setIsSaving(false);
        }
    }, [geminiModel, originalGeminiModel]);

    // Clear all API keys
    const clearAllKeys = useCallback(() => {
        Alert.alert(
            'Clear All API Keys',
            'Are you sure you want to clear all saved API keys? This will revert to using environment variables.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await APIKeyService.clearAllAPIKeys();
                            setGeminiKey('');
                            setExchangeRateKey('');
                            setGeminiModel('gemini-2.5-flash-lite-preview-06-17');
                            setOriginalGeminiKey('');
                            setOriginalExchangeRateKey('');
                            setOriginalGeminiModel('gemini-2.5-flash-lite-preview-06-17');
                            setUseCustomModel(false);
                            setCustomModel('');
                            setGeminiStatus(null);
                            setExchangeRateStatus(null);
                            setModelStatus(null);
                            Alert.alert('Success', 'All API configuration cleared successfully');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to clear API keys');
                        }
                    }
                }
            ]
        );
    }, []);

    // Open API documentation
    const openGeminiDocs = () => {
        Linking.openURL('https://ai.google.dev/gemini-api/docs/api-key');
    };

    const openExchangeRateDocs = () => {
        Linking.openURL('https://www.exchangerate-api.com/');
    };

    // Stable input handlers
    const handleGeminiKeyChange = useCallback((text) => {
        setGeminiKey(text);
        setGeminiStatus(null);
    }, []);

    const handleExchangeRateKeyChange = useCallback((text) => {
        setExchangeRateKey(text);
        setExchangeRateStatus(null);
    }, []);



    // Check if there are unsaved changes
    const hasUnsavedChanges = geminiKey !== originalGeminiKey || exchangeRateKey !== originalExchangeRateKey || geminiModel !== originalGeminiModel;

    const StatusIndicator = React.memo(({ status }) => {
        if (!status) return null;

        return (
            <View style={[styles.statusContainer, status.type === 'success' ? styles.successStatus : styles.errorStatus]}>
                <Ionicons
                    name={status.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                    size={16}
                    color={status.type === 'success' ? COLORS.success : COLORS.danger}
                />
                <Text style={[styles.statusText, { color: status.type === 'success' ? COLORS.success : COLORS.danger }]}>
                    {status.message}
                </Text>
            </View>
        );
    });

    const APIKeySection = React.memo(({ title, description, value, onChangeText, onTest, isTestLoading, status, docLink, placeholder }) => (
        <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>
                <TouchableOpacity onPress={docLink} style={styles.helpButton}>
                    <Ionicons name="help-circle-outline" size={20} color={COLORS.primary} />
                </TouchableOpacity>
            </View>
            <Text style={styles.sectionDescription}>{description}</Text>

            <View style={styles.inputContainer}>
                <TextInput
                    ref={title.includes('Gemini') ? geminiKeyRef : exchangeRateKeyRef}
                    style={styles.textInput}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.textSecondary}
                    multiline={false}
                    secureTextEntry={true}
                    autoCapitalize="none"
                    autoCorrect={false}
                    blurOnSubmit={false}
                    returnKeyType="done"
                    enablesReturnKeyAutomatically={false}
                    editable={true}
                    selectTextOnFocus={false}
                />
                <TouchableOpacity
                    style={[styles.testButton, isTestLoading && styles.testButtonDisabled]}
                    onPress={onTest}
                    disabled={isTestLoading || !value.trim()}
                >
                    {isTestLoading ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                        <Text style={styles.testButtonText}>Test</Text>
                    )}
                </TouchableOpacity>
            </View>

            <StatusIndicator status={status} />
        </View>
    ));

    if (isLoadingKeys) {
        return (
            <ScreenWrapper backgroundColor={COLORS.white}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <BackButton onPress={() => navigation.goBack()} />
                        <View style={styles.centerContainer}>
                            <Text style={styles.headerTitle}>API Configuration</Text>
                        </View>
                        <View style={styles.rightContainer} />
                    </View>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>Loading API configuration...</Text>
                    </View>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper backgroundColor={COLORS.white}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <BackButton onPress={() => navigation.goBack()} />
                    <View style={styles.centerContainer}>
                        <Text style={styles.headerTitle}>API Configuration</Text>
                    </View>
                    <View style={styles.rightContainer} />
                </View>

                <View style={styles.animatedContainer}>
                    <ScrollView
                        style={styles.content}
                        contentContainerStyle={styles.scrollContentContainer}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="none"
                        scrollEnabled={true}
                        removeClippedSubviews={false}
                        nestedScrollEnabled={false}
                        bounces={false}
                        overScrollMode="never"
                    >
                        {/* Info Section */}
                        <View style={styles.infoContainer}>
                            <Ionicons name="information-circle" size={24} color={COLORS.primary} />
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoTitle}>Configure Your API Keys</Text>
                                <Text style={styles.infoText}>
                                    Add your own API keys to enable advanced features. If not configured, the app will use built-in keys with limited usage.
                                </Text>
                            </View>
                        </View>

                        {/* Gemini API Section */}
                        <APIKeySection
                            title="Gemini AI API Key"
                            description="Required for AI-powered transaction analysis, chat assistance, and document processing features."
                            value={geminiKey}
                            onChangeText={handleGeminiKeyChange}
                            onTest={testGeminiKey}
                            isTestLoading={isTestingGemini}
                            status={geminiStatus}
                            docLink={openGeminiDocs}
                            placeholder="Enter your Gemini AI API key..."
                        />

                        {/* Gemini Model Selection */}
                        <View style={styles.modelSelectorContainer}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Gemini Model</Text>
                                <TouchableOpacity
                                    onPress={() => Linking.openURL('https://ai.google.dev/gemini-api/docs/models/gemini')}
                                    style={styles.helpButton}
                                >
                                    <Ionicons name="help-circle-outline" size={20} color={COLORS.primary} />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.sectionDescription}>
                                Choose from popular models or enter a custom model name. Different models offer varying capabilities and performance.
                            </Text>

                            {/* Predefined Models */}
                            {!useCustomModel && (
                                <View style={styles.predefinedModelsContainer}>
                                    <Text style={styles.predefinedModelsLabel}>Popular Models:</Text>
                                    <View style={styles.modelChipsContainer}>
                                        {PREDEFINED_MODELS.map((model) => (
                                            <TouchableOpacity
                                                key={model.id}
                                                style={[
                                                    styles.modelChip,
                                                    geminiModel === model.value && styles.modelChipSelected
                                                ]}
                                                onPress={() => selectPredefinedModel(model.value)}
                                            >
                                                <Text style={[
                                                    styles.modelChipTitle,
                                                    geminiModel === model.value && styles.modelChipTitleSelected
                                                ]}>
                                                    {model.name}
                                                </Text>
                                                <Text style={[
                                                    styles.modelChipDescription,
                                                    geminiModel === model.value && styles.modelChipDescriptionSelected
                                                ]}>
                                                    {model.description}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Custom Model Input */}
                            {useCustomModel && (
                                <View style={styles.customModelContainer}>
                                    <Text style={styles.predefinedModelsLabel}>Custom Model:</Text>
                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            ref={geminiModelRef}
                                            style={styles.textInput}
                                            value={customModel}
                                            onChangeText={handleCustomModelChange}
                                            placeholder="Enter custom model name (e.g., gemini-2.5-pro-experimental)"
                                            placeholderTextColor={COLORS.textSecondary}
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            blurOnSubmit={false}
                                            returnKeyType="done"
                                            enablesReturnKeyAutomatically={false}
                                            editable={true}
                                            selectTextOnFocus={false}
                                            keyboardType="default"
                                            textContentType="none"
                                            importantForAutofill="no"
                                            multiline={false}
                                        />
                                    </View>
                                </View>
                            )}

                            {/* Toggle Custom Model Button */}
                            <TouchableOpacity
                                style={styles.toggleCustomButton}
                                onPress={toggleCustomModel}
                            >
                                <Ionicons
                                    name={useCustomModel ? "list-outline" : "create-outline"}
                                    size={16}
                                    color={COLORS.primary}
                                />
                                <Text style={styles.toggleCustomButtonText}>
                                    {useCustomModel ? 'Choose from popular models' : 'Use custom model'}
                                </Text>
                            </TouchableOpacity>

                            {/* Save Button */}
                            <TouchableOpacity
                                style={[
                                    styles.modelSaveButton,
                                    (geminiModel === originalGeminiModel || isSaving || !geminiModel.trim()) && styles.saveButtonDisabled
                                ]}
                                onPress={saveGeminiModel}
                                disabled={geminiModel === originalGeminiModel || isSaving || !geminiModel.trim()}
                            >
                                {isSaving ? (
                                    <ActivityIndicator size="small" color={COLORS.white} />
                                ) : (
                                    <>
                                        <Ionicons name="save-outline" size={16} color={COLORS.white} />
                                        <Text style={styles.saveButtonText}>Save Model</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <StatusIndicator status={modelStatus} />
                        </View>

                        {/* Exchange Rate API Section */}
                        <APIKeySection
                            title="Exchange Rate API Key"
                            description="Required for real-time currency conversion and exchange rate data."
                            value={exchangeRateKey}
                            onChangeText={handleExchangeRateKeyChange}
                            onTest={testExchangeRateKey}
                            isTestLoading={isTestingExchangeRate}
                            status={exchangeRateStatus}
                            docLink={openExchangeRateDocs}
                            placeholder="Enter your Exchange Rate API key..."
                        />

                        {/* Action Buttons */}
                        <View style={styles.actionButtonsContainer}>
                            <TouchableOpacity
                                style={[styles.saveButton, (!hasUnsavedChanges || isSaving) && styles.saveButtonDisabled]}
                                onPress={saveAPIKeys}
                                disabled={!hasUnsavedChanges || isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator size="small" color={COLORS.white} />
                                ) : (
                                    <>
                                        <Ionicons name="save-outline" size={20} color={COLORS.white} />
                                        <Text style={styles.saveButtonText}>Save Changes</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.clearButton} onPress={clearAllKeys}>
                                <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                                <Text style={styles.clearButtonText}>Clear All Keys</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Security Notice */}
                        <View style={styles.securityNotice}>
                            <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
                            <Text style={styles.securityText}>
                                Your API keys are stored securely on your device and are never shared with third parties.
                            </Text>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    animatedContainer: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingHorizontal: SIZES.padding.large,
        paddingVertical: SIZES.padding.large,
        backgroundColor: COLORS.white,
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
    },
    rightContainer: {
        width: 44,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: 'Poppins-SemiBold',
        color: COLORS.text,
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    scrollContentContainer: {
        paddingTop: 8,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: COLORS.textSecondary,
        fontFamily: 'Poppins-Regular',
    },
    infoContainer: {
        flexDirection: 'row',
        backgroundColor: '#F0F9FF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E0F2FE',
    },
    infoTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    infoTitle: {
        fontSize: 16,
        fontFamily: 'Poppins-SemiBold',
        color: COLORS.text,
        marginBottom: 4,
    },
    infoText: {
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    sectionContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'Poppins-SemiBold',
        color: COLORS.text,
    },
    helpButton: {
        padding: 4,
    },
    sectionDescription: {
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        color: COLORS.textSecondary,
        lineHeight: 20,
        marginBottom: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        backgroundColor: '#F9FAFB',
    },
    textInput: {
        flex: 1,
        height: 50,
        paddingHorizontal: 16,
        fontSize: 16,
        fontFamily: 'Poppins-Regular',
        color: COLORS.text,
    },
    testButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        marginRight: 4,
        minWidth: 60,
        alignItems: 'center',
    },
    testButtonDisabled: {
        backgroundColor: COLORS.textSecondary,
    },
    testButtonText: {
        color: COLORS.white,
        fontSize: 14,
        fontFamily: 'Poppins-SemiBold',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        padding: 12,
        borderRadius: 8,
    },
    successStatus: {
        backgroundColor: '#F0FDF4',
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    errorStatus: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    statusText: {
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        marginLeft: 8,
        flex: 1,
    },
    actionButtonsContainer: {
        marginTop: 8,
        gap: 12,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    saveButtonDisabled: {
        backgroundColor: COLORS.textSecondary,
    },
    saveButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontFamily: 'Poppins-SemiBold',
    },
    clearButton: {
        backgroundColor: 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.danger,
        gap: 8,
    },
    clearButtonText: {
        color: COLORS.danger,
        fontSize: 16,
        fontFamily: 'Poppins-SemiBold',
    },
    securityNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        borderRadius: 8,
        padding: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    securityText: {
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        color: COLORS.textSecondary,
        marginLeft: 12,
        flex: 1,
        lineHeight: 20,
    },
    modelSelectorContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    predefinedModelsContainer: {
        marginBottom: 16,
    },
    predefinedModelsLabel: {
        fontSize: 14,
        fontFamily: 'Poppins-Medium',
        color: COLORS.text,
        marginBottom: 12,
    },
    modelChipsContainer: {
        gap: 12,
    },
    modelChip: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    modelChipSelected: {
        backgroundColor: '#F0F9FF',
        borderColor: COLORS.primary,
    },
    modelChipTitle: {
        fontSize: 16,
        fontFamily: 'Poppins-SemiBold',
        color: COLORS.text,
        marginBottom: 4,
    },
    modelChipTitleSelected: {
        color: COLORS.primary,
    },
    modelChipDescription: {
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        color: COLORS.textSecondary,
        lineHeight: 18,
    },
    modelChipDescriptionSelected: {
        color: COLORS.primary,
    },
    customModelContainer: {
        marginBottom: 16,
    },
    toggleCustomButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.primary,
        backgroundColor: 'transparent',
        marginBottom: 16,
        gap: 8,
    },
    toggleCustomButtonText: {
        fontSize: 14,
        fontFamily: 'Poppins-Medium',
        color: COLORS.primary,
    },
    modelSaveButton: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 8,
        gap: 8,
        marginTop: 8,
    },
});

export default APIKeysScreen; 