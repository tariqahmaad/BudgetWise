import { StyleSheet, View, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useNavigationState } from '@react-navigation/native'
import { COLORS, SIZES, NAV_ITEMS } from '../../constants/theme'
import DropUpMenu from './DropUpMenu'

const NavigationBar = () => {
    const navigation = useNavigation();
    const currentRoute = useNavigationState(state => state?.routes[state.index]?.name);
    const [isMenuVisible, setIsMenuVisible] = useState(false);

    const handlePress = (routeName) => {
        if (routeName === 'Add') {
            setIsMenuVisible(true);
            return;
        }

        // Get the current navigator state
        const state = navigation.getState();

        // If we're in the AuthStack, navigate to DashboardStack first
        if (state.routes[0].name === 'Home') {
            navigation.navigate('Dashboard', { screen: routeName });

        } else {
            navigation.navigate(routeName);
        }
    };

    const handleMenuOptionPress = (option) => {
        switch (option) {
            case 'Add Transactions':
                navigation.navigate('addTransaction');
                setIsMenuVisible(false);
                break;
            case 'Debt Tracking':
                navigation.navigate('debtTracking');
                setIsMenuVisible(false);
                break;
            default:
                console.log('Unknown option:', option);
                setIsMenuVisible(false);
        }
    };

    const getIconProps = ({ name, icon, isAddButton }) => {
        const isActive = currentRoute === name || (currentRoute === 'Home' && name === 'HomeScreen');
        return {
            name: isActive ? icon : `${icon}-outline`,
            color: isAddButton ? COLORS.white : (isActive ? COLORS.active : COLORS.inactive),
            size: isAddButton ? SIZES.large : SIZES.regular
        };
    };

    const renderNavItem = (item) => {
        const { name, isAddButton } = item;
        const iconProps = getIconProps(item);

        return (
            <TouchableOpacity
                key={name}
                style={[
                    isAddButton ? styles.addButton : styles.iconContainer,
                    currentRoute === name && !isAddButton && styles.activeIconContainer
                ]}
                onPress={() => handlePress(name)}
            >
                <Ionicons {...iconProps} />
            </TouchableOpacity>
        );
    };

    return (
        <>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {NAV_ITEMS.map(renderNavItem)}
                </View>
            </View>
            <DropUpMenu
                visible={isMenuVisible}
                onClose={() => setIsMenuVisible(false)}
                onOptionPress={handleMenuOptionPress}
            />
        </>
    );
};

export default NavigationBar;

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 999,
    },
    container: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        paddingVertical: SIZES.padding.small,
        paddingBottom: SIZES.padding.small,
        borderTopWidth: 0.2,
        borderTopColor: COLORS.border,
    },
    iconContainer: {
        padding: SIZES.padding.medium,
        borderRadius: SIZES.radius.medium,
    },
    addButton: {
        backgroundColor: COLORS.active,
        width: SIZES.button,
        height: SIZES.button,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: COLORS.active,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    }
});