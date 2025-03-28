import React from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    Text,
    Modal,
    Animated,
    Platform,
    TouchableWithoutFeedback // Import TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { COLORS, SIZES } from '../../constants/theme';

const DropUpMenu = ({ visible, onClose, onOptionPress }) => {
    const [animation] = React.useState(new Animated.Value(0));
    const [fadeAnimation] = React.useState(new Animated.Value(0));

    const menuItems = [
        {
            key: 'add_transaction',
            icon: 'swap-horizontal-outline',
            label: 'Add Transactions',
            hapticType: 'medium',
        },
        {
            key: 'debt_tracking',
            icon: 'people-outline',
            label: 'Debt Tracking',
            hapticType: 'medium',
        },

    ];

    React.useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(animation, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 65,
                    friction: 8,
                    velocity: 0.5,
                }),
                Animated.timing(fadeAnimation, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(animation, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnimation, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [visible]);

    const handlePress = async (item) => {
        try {
            if (Platform.OS === 'ios') {
                switch (item.hapticType) {
                    case 'light':
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        break;
                    case 'medium':
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        break;
                    case 'heavy':
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        break;
                }
            }
        } catch (error) {
            console.log('Haptics not supported');
        }

        onOptionPress(item.label);
    };

    const translateY = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [300, 0],
    });

    const opacity = fadeAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
                <BlurView
                    tint="systemChromeMaterialDark"
                    style={StyleSheet.absoluteFill}
                    experimentalBlurMethod="dimezisBlurView"
                    blurReductionFactor={15}
                />
                <TouchableOpacity
                    style={styles.touchableOverlay}
                    activeOpacity={1}
                    onPress={onClose}
                >
                    <TouchableWithoutFeedback>
                        <View style={styles.contentContainer}>
                            <Animated.View
                                style={[
                                    styles.menuContainer,
                                    {
                                        transform: [{ translateY }],
                                        opacity: fadeAnimation
                                    }
                                ]}
                            >
                                {menuItems.map((item, index) => (
                                    <React.Fragment key={item.key}>
                                        <TouchableOpacity
                                            style={styles.menuItem}
                                            onPress={() => handlePress(item)}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons
                                                name={item.icon}
                                                size={28}
                                                color="#fff"
                                                style={styles.icon}
                                            />
                                            <Text style={styles.menuText}>{item.label}</Text>
                                        </TouchableOpacity>
                                        {index < menuItems.length - 1 && <View style={styles.divider} />}
                                    </React.Fragment>
                                ))}
                            </Animated.View>

                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={onClose}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Animated.View>
        </Modal>
    );
};

// --- Keep styles exactly the same as the previous correct version ---
const styles = StyleSheet.create({
    touchableOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    contentContainer: {
        paddingHorizontal: 15,
        paddingBottom: Platform.OS === 'ios' ? 40 : 70,
    },
    menuContainer: {
        backgroundColor: '#1C1C1E',
        borderRadius: 10,
        marginBottom: 8,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        minHeight: 64,
    },
    icon: {
        marginRight: 12,
        width: 28,
    },
    menuText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '400',
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    cancelButton: {
        backgroundColor: '#F2F2F7',
        borderRadius: 12,
        minHeight: 50,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 3,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    cancelButtonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 20,
    },
});

export default DropUpMenu;