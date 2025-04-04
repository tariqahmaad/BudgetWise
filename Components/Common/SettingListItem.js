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
            <View style={styles.iconContainer}>
                <Ionicons name={icon} size={22} color={iconColor} />
            </View>

            {/* Title */}
            <Text style={[styles.title, textStyle]}>{title}</Text>

            {/* Right side */}
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
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: '#E5E5EA',
        backgroundColor: 'transparent',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    title: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'Poppins-Regular',
        color: COLORS.text,
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    badge: {
        backgroundColor: COLORS.danger,
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginRight: 8,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontFamily: 'Poppins-Medium',
    },
});

export default SettingListItem; 