import React, { useState, useRef, useEffect } from 'react';
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
    Keyboard,
    Image,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomInput from '../../Components/InputField/CustomInput';
import PrimaryButton from '../../Components/Buttons/PrimaryButton';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import app from '../../firebase/firebaseConfig';

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
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { height } = useWindowDimensions();
    const scrollViewRef = useRef(null);
    const auth = getAuth(app);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is signed in
                console.log('User is signed in:', user.email);
            } else {
                // User is signed out
                console.log('User is signed out');
            }
        });

        // Cleanup subscription
        return unsubscribe;
    }, [auth]);

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        Keyboard.dismiss();
        setIsLoading(true);

        try {
            console.log('Attempting login with email:', email);
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error('Login error:', error);
            let errorMessage = 'An error occurred during login';

            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'This account has been disabled';
                    break;
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect password';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many failed attempts. Please try again later';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Network error. Please check your connection';
                    break;
                default:
                    errorMessage = error.message;
            }
            Alert.alert('Login Error', errorMessage);
        } finally {
            setIsLoading(false);
        }
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
                source={require('../../assets/brand-logo.png')}
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
                                    {/* <Icon name="wallet" size={80} color="#FDB347" />
                                    <Text style={styles.title}>BudgetWise</Text> */}
                                    <Image source={require('../../assets/brand-logo.png')} style={styles.logo} />
                                    {/* <Text style={styles.title}>BudgetWise</Text> */}
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
                                    secureTextEntry={!isPasswordVisible}
                                    leftIcon="lock-outline"
                                    onFocus={() => scrollToInput(300)}
                                    rightIcon={
                                        <TouchableOpacity onPress={togglePasswordVisibility} style={styles.rightIcon}>
                                            <Icon
                                                name={isPasswordVisible ? 'eye-off' : 'eye'}
                                                size={20}
                                                color="#9CA3AF"
                                            />
                                        </TouchableOpacity>
                                    }
                                />

                                <TouchableOpacity
                                    style={styles.forgotPassword}
                                    onPress={() => navigation.navigate('ForgotPassword')}
                                >
                                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                                </TouchableOpacity>

                                <PrimaryButton
                                    title={isLoading ? "Signing in..." : "Sign In"}
                                    onPress={handleLogin}
                                    style={styles.loginButton}
                                    disabled={isLoading}
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
        marginBottom: 8,
        marginTop: Platform.OS === 'ios' ? 10 : 0,
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
        marginBottom: '6%',
    },
    socialButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: '3%',
        flexWrap: 'wrap',
        gap: 8,
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
        marginVertical: '2%',
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
        marginTop: '2%',
        marginBottom: 4,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginTop: 4,
        marginBottom: '3%',
    },
    forgotPasswordText: {
        color: '#9CA3AF',
        fontSize: Platform.OS === 'web' ? 14 : 12,
    },
    loginButton: {
        marginTop: 4,
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '5%',
        paddingBottom: Platform.OS === 'ios' ? 10 : 0,
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
    rightIcon: {
        padding: 4,
    },
    logo: {
        width: 300,
        height: 200,
        resizeMode: 'contain',
        marginBottom: '4%',
    },
});