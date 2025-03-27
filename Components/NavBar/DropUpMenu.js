import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Modal, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, SIZES } from '../../constants/theme';

const DropUpMenu = ({ visible, onClose, onOptionPress }) => {
    const [animation] = React.useState(new Animated.Value(0));

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
            Animated.spring(animation, {
                toValue: 1,
                useNativeDriver: true,
                tension: 50,
                friction: 5,
            }).start();
        } else {
            Animated.timing(animation, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const handlePress = async (item) => {
        try {
            // Trigger haptic feedback based on platform
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

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPressOut={onClose}
            >
                <TouchableOpacity activeOpacity={1} style={styles.innerContainer}>
                    <Animated.View
                        style={[
                            styles.menuContainer,
                            { transform: [{ translateY }] }
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
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
    },
    innerContainer: {
        paddingHorizontal: 15,
        paddingBottom: 75,
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
        borderWidth: 3,
        borderColor: 'rgba(113, 113, 113, 0.92)',
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
        fontWeight: 'bold',
        fontSize: 20,
    },
});

export default DropUpMenu; 