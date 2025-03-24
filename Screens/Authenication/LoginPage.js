import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Platform,
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
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const SocialButton = ({ icon, title, onPress, backgroundColor }) => {
    const { width } = useWindowDimensions();
    const buttonWidth = width < 380 ? '100%' : '48%';

    return (
        <TouchableOpacity
            style={[styles.socialButton, { width: buttonWidth, backgroundColor }]}
            onPress={onPress}
        >
            {icon}
            <Text style={[styles.socialButtonText, { color: backgroundColor === COLORS.white ? COLORS.text : COLORS.white }]}>
                {title}
            </Text>
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
                console.log('User is signed in:', user.email);
            } else {
                console.log('User is signed out');
            }
        });

        return unsubscribe;
    }, [auth]);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        Keyboard.dismiss();
        setIsLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            const errorMessages = {
                'auth/invalid-email': 'Invalid email address',
                'auth/user-disabled': 'This account has been disabled',
                'auth/user-not-found': 'No account found with this email',
                'auth/wrong-password': 'Incorrect password',
                'auth/too-many-requests': 'Too many failed attempts. Please try again later',
                'auth/network-request-failed': 'Network error. Please check your connection'
            };

            Alert.alert('Login Error', errorMessages[error.code] || error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const scrollToInput = (y) => {
        scrollViewRef.current?.scrollTo({
            y,
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
                            contentContainerStyle={[styles.scrollContent, { minHeight: height * 0.8 }]}
                            showsVerticalScrollIndicator={false}
                            bounces={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={styles.formContainer}>
                                <View style={styles.logoContainer}>
                                    <Image source={require('../../assets/brand-logo.png')} style={styles.logo} />
                                </View>
                                <Text style={styles.subtitle}>Welcome back! Please sign in to continue.</Text>

                                <View style={[
                                    styles.socialButtonsContainer,
                                    useWindowDimensions().width < 380 && styles.socialButtonsStacked
                                ]}>
                                    <SocialButton
                                        icon={<Icon name="facebook" size={SIZES.socialIcon} color={COLORS.white} style={styles.socialIcon} />}
                                        title="Facebook"
                                        onPress={() => console.log('Facebook login')}
                                        backgroundColor={COLORS.social.facebook}
                                    />
                                    <SocialButton
                                        icon={<Icon name="google" size={SIZES.socialIcon} color={COLORS.social.google} style={styles.socialIcon} />}
                                        title="Google"
                                        onPress={() => console.log('Google login')}
                                        backgroundColor={COLORS.white}
                                    />
                                </View>

                                <View style={styles.dividerContainer}>
                                    <View style={styles.dividerLine} />
                                    <Text style={styles.dividerText}>OR</Text>
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
                                        <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.rightIcon}>
                                            <Icon
                                                name={isPasswordVisible ? 'eye-off' : 'eye'}
                                                size={SIZES.inputIcon}
                                                color={COLORS.textTertiary}
                                            />
                                        </TouchableOpacity>
                                    }
                                />

                                <TouchableOpacity
                                    style={styles.forgotPassword}
                                    onPress={() => navigation.navigate('Forgot')}
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
        paddingHorizontal: SIZES.padding.xxlarge,
        paddingVertical: Platform.OS === 'ios' ? 20 : SIZES.padding.xxlarge,
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SIZES.padding.small,
        marginTop: Platform.OS === 'ios' ? 10 : 0,
    },
    subtitle: {
        fontSize: SIZES.font.large,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: '6%',
    },
    socialButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: '3%',
        flexWrap: 'wrap',
        gap: SIZES.padding.medium,
    },
    socialButtonsStacked: {
        flexDirection: 'column',
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Platform.OS === 'ios' ? 12 : 10,
        paddingHorizontal: SIZES.padding.xlarge,
        borderRadius: 12,
        ...Platform.select({
            ios: SHADOWS.small,
            android: { elevation: 3 },
            web: { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
        }),
    },
    socialIcon: {
        marginRight: SIZES.padding.medium,
    },
    socialButtonText: {
        fontSize: Platform.OS === 'web' ? SIZES.font.large : SIZES.font.medium,
        color: COLORS.text,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: '2%',
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.divider,
    },
    dividerText: {
        color: COLORS.textTertiary,
        paddingHorizontal: SIZES.padding.xlarge,
        fontSize: SIZES.font.medium,
    },
    label: {
        fontSize: Platform.OS === 'web' ? SIZES.font.large : SIZES.font.medium,
        color: COLORS.textTertiary,
        marginTop: '2%',
        marginBottom: 4,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginTop: 4,
        marginBottom: '3%',
    },
    forgotPasswordText: {
        color: COLORS.textTertiary,
        fontSize: Platform.OS === 'web' ? SIZES.font.medium : SIZES.font.small,
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
        color: COLORS.textTertiary,
        fontSize: Platform.OS === 'web' ? SIZES.font.medium : SIZES.font.small,
    },
    signupLink: {
        color: COLORS.primary,
        fontSize: Platform.OS === 'web' ? SIZES.font.medium : SIZES.font.small,
        fontWeight: '600',
    },
    rightIcon: {
        padding: SIZES.padding.small,
    },
    logo: {
        width: 300,
        height: 200,
        resizeMode: 'contain',
        marginBottom: '4%',
    },
});