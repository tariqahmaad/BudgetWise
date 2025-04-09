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
import Images from "../../constants/Images";
import {
    auth,
    firestore,
    doc,
    getDoc,
} from "../../firebase/firebaseConfig";
import BackButton from "../../Components/Buttons/BackButton";
import SettingListItem from "../../Components/Common/SettingListItem";

const ProfileScreen = () => {
    const navigation = useNavigation();
    const [user, setUser] = useState(auth.currentUser);
    const [userData, setUserData] = useState({
        name: '',
        surname: '',
        email: user?.email || '',
        avatar: Images.profilePic,

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
                        avatar: data.avatar || Images.profilePic,
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
                    <View style={styles.leftContainer}>
                        <BackButton onPress={() => navigation.goBack()} />
                    </View>
                    <View style={styles.centerContainer}>
                        <Text style={styles.headerTitle}>Profile</Text>
                    </View>
                    <View style={styles.rightContainer} />
                </View>

                <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                    <ScrollView
                        style={styles.content}
                        contentContainerStyle={styles.scrollContentContainer}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.profileSection}>
                            {userData.avatar ? (
                                <Image source={userData.avatar} style={styles.avatar} />
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
                                    <SettingListItem
                                        icon={item.icon?.name}
                                        iconColor={item.icon?.color}
                                        iconBackgroundColor={item.icon?.backgroundColor}
                                        title={item.title}
                                        onPress={item.onPress}
                                        badgeCount={item.badgeCount}
                                    />
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
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingHorizontal: 16,
        paddingBottom: 10,
        backgroundColor: COLORS.white,
    },
    leftContainer: {
        flex: 1,
        alignItems: 'flex-start',
    },
    centerContainer: {
        flex: 2,
        alignItems: 'center',
    },
    rightContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: "Poppins-SemiBold",
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
        marginBottom: 20,
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#E5E5EA',
        marginLeft: 16,
    },
});

export default ProfileScreen; 