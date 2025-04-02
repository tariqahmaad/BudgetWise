import React, { useState, useEffect } from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert,
    Platform,
    Animated,
    Easing,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from '@expo/vector-icons';
import NavigationBar from "../../Components/NavBar/NavigationBar";
import { COLORS } from "../../constants/theme";
import ScreenWrapper from "../../Components/ScreenWrapper";
import {
    auth,
    firestore,
    doc,
    getDoc,
} from "../../firebase/firebaseConfig";

const ProfileScreen = () => {
    const navigation = useNavigation();
    const [user, setUser] = useState(auth.currentUser);
    const [userData, setUserData] = useState({
        name: '',
        surname: '',
        email: user?.email || '',
        avatar: null,
    });
    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) return;

            try {
                const userDoc = await getDoc(doc(firestore, "users", user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setUserData({
                        name: data.name || '',
                        surname: data.surname || '',
                        email: user.email || '',
                        avatar: data.avatar || null,
                    });
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
                Alert.alert("Error", "Failed to load user data");
            }
        };

        fetchUserData();
    }, [user]);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            if (!currentUser) {
                setUserData({ name: '', surname: '', email: '', avatar: null });
            }
        });
        return () => unsubscribe();
    }, []);

    const getFullName = () =>
        userData.name && userData.surname ? `${userData.name} ${userData.surname}` : (userData.name || '');

    const handleLogout = () => {
        Alert.alert(
            "Confirm Log Out",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Log Out",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await auth.signOut();
                        } catch (error) {
                            Alert.alert("Log Out Error", error.message);
                        }
                    },
                },
            ]
        );
    };

    const renderSettingItem = ({ title, onPress, icon, badgeCount }) => (
        <TouchableOpacity
            style={styles.settingItem}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.settingItemLeft}>
                {icon && (
                    <View style={[styles.iconContainer, { backgroundColor: icon.backgroundColor }]}>
                        <Ionicons name={icon.name} size={18} color={icon.color} />
                    </View>
                )}
                <Text style={[styles.settingItemTitle, icon && { marginLeft: 12 }]}>{title}</Text>
            </View>
            <View style={styles.settingItemRight}>
                {badgeCount > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{badgeCount.toString()}</Text>
                    </View>
                )}
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </View>
        </TouchableOpacity>
    );

    const settingsItems = [
        {
            icon: {
                name: "person-outline",
                backgroundColor: "#E8F0FE",
                color: "#4285F4"
            },
            title: "Personal Information",
            onPress: () => Alert.alert("Personal Information", "Navigate to personal information screen"),
        },
        {
            icon: {
                name: "notifications-outline",
                backgroundColor: "#FCE8E7",
                color: "#EA4335"
            },
            title: "Notifications",
            onPress: () => Alert.alert("Notifications", "Navigate to notifications screen"),
            badgeCount: 2,
        },
        {
            icon: {
                name: "chatbubble-outline",
                backgroundColor: "#E6F4EA",
                color: "#34A853"
            },
            title: "Message Center",
            onPress: () => Alert.alert("Message Center", "Navigate to message center"),
        },
        {
            icon: {
                name: "settings-outline",
                backgroundColor: "#FEF7E0",
                color: "#FBBC04"
            },
            title: "Settings",
            onPress: () => navigation.navigate("Settings"),
        },
        {
            icon: {
                name: "log-out-outline",
                backgroundColor: "#FCE8E7",
                color: "#EA4335"
            },
            title: "Log Out",
            onPress: handleLogout,
        },
    ];

    return (
        <ScreenWrapper backgroundColor={COLORS.white}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="chevron-back" size={24} color="#000000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <View style={styles.headerButton} />
                </View>

                <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                    <ScrollView
                        style={styles.content}
                        contentContainerStyle={styles.scrollContentContainer}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.profileSection}>
                            {userData.avatar ? (
                                <Image source={{ uri: userData.avatar }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                    <Ionicons name="person" size={40} color="#4B5563" />
                                </View>
                            )}
                            <Text style={styles.name}>{getFullName()}</Text>
                            {userData.email && <Text style={styles.email}>{userData.email}</Text>}
                        </View>

                        <Text style={styles.sectionHeader}>Account</Text>
                        <View style={styles.settingsGroup}>
                            {settingsItems.map((item, index) => (
                                <React.Fragment key={index}>
                                    {renderSettingItem(item)}
                                    {index < settingsItems.length - 1 && <View style={styles.separator} />}
                                </React.Fragment>
                            ))}
                        </View>
                    </ScrollView>
                </Animated.View>

                <NavigationBar />
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingHorizontal: 16,
        paddingBottom: 10,
        backgroundColor: COLORS.white,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000000',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    scrollContentContainer: {
        paddingTop: 20,
        paddingBottom: 80,
    },
    profileSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
    },
    avatarPlaceholder: {
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    name: {
        fontSize: 24,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 4,
    },
    email: {
        fontSize: 16,
        color: '#8E8E93',
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: '400',
        color: '#8E8E93',
        marginBottom: 8,
    },
    settingsGroup: {
        backgroundColor: COLORS.white,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    settingItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingItemTitle: {
        fontSize: 16,
        fontWeight: '400',
        color: '#000000',
    },
    settingItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    badge: {
        backgroundColor: COLORS.danger,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
        paddingHorizontal: 6,
    },
    separator: {
        height: 0.5,
        backgroundColor: '#E5E5EA',
        marginHorizontal: 16,
    },
});

export default ProfileScreen; 