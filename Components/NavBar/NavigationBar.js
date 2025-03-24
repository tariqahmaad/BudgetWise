import { StyleSheet, View, TouchableOpacity } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useNavigationState } from '@react-navigation/native'
import { COLORS, SIZES, NAV_ITEMS } from '../../constants/theme'

const NavigationBar = () => {
    const navigation = useNavigation();
    const currentRoute = useNavigationState(state => state?.routes[state.index]?.name);

    const handlePress = (routeName) => {
        if (routeName === 'Add') {
            console.log('Add button pressed');
            return;
        }
        navigation.navigate(routeName);
    };

    const getIconProps = ({ name, icon, isAddButton }) => {
        const isActive = currentRoute === name;
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
                style={isAddButton ? styles.addButton : styles.iconContainer}
                onPress={() => handlePress(name)}
            >
                <Ionicons {...iconProps} />
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.overlay}>
            <View style={styles.container}>
                {NAV_ITEMS.map(renderNavItem)}
            </View>
        </View>
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