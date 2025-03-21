import React, { useState, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Platform,
    Dimensions,
    KeyboardAvoidingView,
    ScrollView,
    useWindowDimensions,
    ImageBackground,
    Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomInput from '../../Components/InputField/CustomInput';
import PrimaryButton from '../../Components/Buttons/PrimaryButton';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const SocialButton = ({ icon, title, onPress, backgroundColor }) => {
    const { width } = useWindowDimensions();
    const buttonWidth = width < 380 ? '100%' : '48%';

    return (
        <TouchableOpacity
            style={[styles.socialButton, { width: buttonWidth, backgroundColor }]}
            onPress={onPress}
        >
            {icon}
            <Text style={[styles.socialButtonText, { color: backgroundColor === '#FFFFFF' ? '#1F2937' : '#FFFFFF' }]}>{title}</Text>
        </TouchableOpacity>
    );
};

const LoginPage = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { height } = useWindowDimensions();
    const scrollViewRef = useRef(null);

    const handleLogin = () => {
        Keyboard.dismiss();
        // Implement login logic here
        console.log('Login pressed with:', email, password);
    };

    const scrollToInput = (y) => {
        scrollViewRef.current?.scrollTo({
            y: y,
            animated: true
        });
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
            <ImageBackground
                // source={require('../../assets/images/background.jpg')}
                style={styles.backgroundImage}
            >
                <View style={styles.overlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={styles.container}
                        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
                    >
                        <ScrollView
                            ref={scrollViewRef}
                            contentContainerStyle={[
                                styles.scrollContent,
                                { minHeight: height * 0.8 }
                            ]}
                            showsVerticalScrollIndicator={false}
                            bounces={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={styles.formContainer}>
                                <View style={styles.logoContainer}>
                                    <Icon name="wallet" size={48} color="#FDB347" />
                                    <Text style={styles.title}>BudgetWise</Text>
                                </View>
                                <Text style={styles.subtitle}>Welcome back! Please sign in to continue.</Text>

                                <View style={[
                                    styles.socialButtonsContainer,
                                    useWindowDimensions().width < 380 && styles.socialButtonsStacked
                                ]}>
                                    <SocialButton
                                        icon={<Icon name="facebook" size={24} color="#FFFFFF" style={styles.socialIcon} />}
                                        title="Facebook"
                                        onPress={() => console.log('Facebook login')}
                                        backgroundColor="#1877F2"
                                    />
                                    <SocialButton
                                        icon={<Icon name="google" size={24} color="#DB4437" style={styles.socialIcon} />}
                                        title="Google"
                                        onPress={() => console.log('Google login')}
                                        backgroundColor="#FFFFFF"
                                    />
                                </View>

                                <View style={styles.dividerContainer}>
                                    <View style={styles.dividerLine} />
                                    <Text style={styles.dividerText}>Or</Text>
                                    <View style={styles.dividerLine} />
                                </View>

                                <Text style={styles.label}>Email Address</Text>
                                <CustomInput
                                    placeholder="example@gmail.com"
                                    value={email}
                                    onChangeText={setEmail}
                                    leftIcon="email-outline"
                                    keyboardType="email-address"
                                    onFocus={() => scrollToInput(200)}
                                />

                                <Text style={styles.label}>Password</Text>
                                <CustomInput
                                    placeholder="••••••••"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    leftIcon="lock-outline"
                                    onFocus={() => scrollToInput(300)}
                                />

                                <TouchableOpacity
                                    style={styles.forgotPassword}
                                    onPress={() => navigation.navigate('ForgotPassword')}
                                >
                                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                                </TouchableOpacity>

                                <PrimaryButton
                                    title="Sign In"
                                    onPress={handleLogin}
                                    style={styles.loginButton}
                                />

                                <View style={styles.signupContainer}>
                                    <Text style={styles.signupText}>I'm a new user. </Text>
                                    <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                                        <Text style={styles.signupLink}>Sign Up</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </ImageBackground>
        </SafeAreaView>
    );
};

export default LoginPage;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingBottom: Platform.OS === 'ios' ? 100 : 50,
    },
    formContainer: {
        paddingHorizontal: 24,
        paddingVertical: Platform.OS === 'ios' ? 20 : 24,
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        marginTop: Platform.OS === 'ios' ? 20 : 0,
    },
    title: {
        fontSize: Platform.OS === 'web' ? 32 : 28,
        fontWeight: '700',
        color: '#1F2937',
        marginLeft: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: '8%',
    },
    socialButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: '6%',
        flexWrap: 'wrap',
        gap: 12,
    },
    socialButtonsStacked: {
        flexDirection: 'column',
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Platform.OS === 'ios' ? 12 : 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
            web: {
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            },
        }),
    },
    socialIcon: {
        marginRight: 8,
    },
    socialButtonText: {
        fontSize: Platform.OS === 'web' ? 16 : 14,
        color: '#1F2937',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: '6%',
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    dividerText: {
        color: '#9CA3AF',
        paddingHorizontal: 16,
        fontSize: 14,
    },
    label: {
        fontSize: Platform.OS === 'web' ? 16 : 14,
        color: '#9CA3AF',
        marginTop: '5%',
        marginBottom: 8,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginTop: 8,
        marginBottom: '6%',
    },
    forgotPasswordText: {
        color: '#9CA3AF',
        fontSize: Platform.OS === 'web' ? 14 : 12,
    },
    loginButton: {
        marginTop: 8,
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '6%',
        paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    },
    signupText: {
        color: '#9CA3AF',
        fontSize: Platform.OS === 'web' ? 14 : 12,
    },
    signupLink: {
        color: '#FDB347',
        fontSize: Platform.OS === 'web' ? 14 : 12,
        fontWeight: '600',
    },
});