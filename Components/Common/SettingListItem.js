import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

const SettingListItem = ({
    icon,
    iconColor = COLORS.primary,
    title,
    onPress,
    rightIcon = 'chevron-forward',
    rightComponent,
    badgeCount,
    style,
    textStyle,
}) => {
    return (
        <TouchableOpacity
            style={[styles.container, style]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Left icon */}
            <View style={[styles.iconContainer, { backgroundColor: iconColor === COLORS.danger ? '#FEE2E2' : '#F3F4F6' }]}>
                <Ionicons name={icon} size={22} color={iconColor} />
            </View>

            {/* Title */}
            <Text style={[styles.title, textStyle]}>{title}</Text>

            {/* Right side - either badge, custom component, or chevron */}
            <View style={styles.rightContainer}>
                {badgeCount > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{badgeCount}</Text>
                    </View>
                )}

                {rightComponent ? rightComponent : (
                    <Ionicons name={rightIcon} size={18} color={COLORS.gray} />
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        marginBottom: 12,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    title: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text,
        fontFamily: 'Poppins-Medium',
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    badge: {
        backgroundColor: COLORS.danger,
        borderRadius: 999,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontFamily: 'Poppins-Medium',
        paddingHorizontal: 6,
    }
});

export default SettingListItem; 