import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, ScrollView } from 'react-native';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import Icon from 'react-native-vector-icons/Ionicons';

const screenWidth = Dimensions.get('window').width;

// Categorize suggestions for better organization
const categorizeSuggestions = (suggestions) => {
    const categories = {
        insights: [],
        actions: [],
        analysis: []
    };

    suggestions.forEach(suggestion => {
        const lower = suggestion.toLowerCase();
        if (lower.includes('analyze') || lower.includes('breakdown') || lower.includes('compare')) {
            categories.analysis.push(suggestion);
        } else if (lower.includes('add') || lower.includes('set') || lower.includes('create')) {
            categories.actions.push(suggestion);
        } else {
            categories.insights.push(suggestion);
        }
    });

    return categories;
};

// Individual suggestion bubble component
const SuggestionBubble = React.memo(({ suggestion, onPress, index }) => {
    const [scaleAnim] = useState(new Animated.Value(0));
    const [pressAnim] = useState(new Animated.Value(1));

    useEffect(() => {
        // Staggered entrance animation
        Animated.spring(scaleAnim, {
            toValue: 1,
            delay: index * 100,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
        }).start();
    }, [scaleAnim, index]);

    const handlePressIn = () => {
        Animated.spring(pressAnim, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(pressAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    const handlePress = () => {
        // Haptic feedback would go here if available
        onPress(suggestion);
    };

    return (
        <Animated.View
            style={[
                styles.suggestionBubble,
                {
                    transform: [
                        { scale: scaleAnim },
                        { scale: pressAnim }
                    ]
                }
            ]}
        >
            <TouchableOpacity
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={styles.suggestionTouchable}
                accessibilityRole="button"
                accessibilityLabel={`Suggestion: ${suggestion}`}
                accessibilityHint="Tap to use this suggestion"
            >
                <Icon name="bulb-outline" size={16} color={COLORS.primary} style={styles.suggestionIcon} />
                <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
});

/**
 * SuggestionComponent renders suggestion bubbles for the AI chat
 */
const SuggestionComponent = React.memo(({
    suggestedQuestions,
    onSuggestionClick,
    maxVisible = 6, // Limit visible suggestions to prevent overwhelming UI
    scrollEnabled = false // Prop to know if parent is scrollable
}) => {
    const [showAll, setShowAll] = useState(false);
    const [fadeAnim] = useState(new Animated.Value(1));

    if (!suggestedQuestions || suggestedQuestions.length === 0) {
        return null;
    }

    const visibleSuggestions = showAll
        ? suggestedQuestions
        : suggestedQuestions.slice(0, maxVisible);

    const toggleShowAll = () => {
        Animated.sequence([
            Animated.timing(fadeAnim, {
                toValue: 0.7,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            })
        ]).start();

        setShowAll(!showAll);
    };

    return (
        <Animated.View style={[styles.suggestionBubblesContainer, { opacity: fadeAnim }]}>
            {/* Scroll indicator hint for many suggestions - only show if parent is scrollable */}
            {scrollEnabled && suggestedQuestions.length > 4 && !showAll && (
                <View style={styles.scrollHintContainer}>
                    <Icon name="chevron-down" size={16} color={COLORS.textGray} />
                    <Text style={styles.scrollHintText}>Scroll to see more suggestions</Text>
                </View>
            )}

            {visibleSuggestions.map((suggestion, index) => (
                <SuggestionBubble
                    key={`suggestion-${index}`}
                    suggestion={suggestion}
                    onPress={onSuggestionClick}
                    index={index}
                />
            ))}

            {suggestedQuestions.length > maxVisible && (
                <TouchableOpacity
                    style={styles.toggleButton}
                    onPress={toggleShowAll}
                    accessibilityRole="button"
                    accessibilityLabel={showAll ? "Show fewer suggestions" : "Show more suggestions"}
                >
                    <Text style={styles.toggleButtonText}>
                        {showAll ? 'Show Less' : `+${suggestedQuestions.length - maxVisible} More`}
                    </Text>
                    <Icon
                        name={showAll ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={COLORS.primary}
                    />
                </TouchableOpacity>
            )}
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    suggestionBubblesContainer: {
        marginBottom: SIZES.padding.large,
        paddingHorizontal: SIZES.padding.medium,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SIZES.padding.large,
        minHeight: 'auto', // Allow container to size based on content
        paddingBottom: SIZES.padding.medium, // Extra bottom padding for scroll
    },
    suggestionBubble: {
        backgroundColor: COLORS.darkBackground,
        borderRadius: 18,
        paddingHorizontal: SIZES.padding.large,
        paddingVertical: SIZES.padding.medium,
        marginVertical: SIZES.padding.small,
        marginHorizontal: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        maxWidth: screenWidth * 0.8,
        alignSelf: 'center',
        // Optimize for scrolling
        shouldRasterizeIOS: true,
        renderToHardwareTextureAndroid: true,
    },
    suggestionText: {
        ...FONTS.body3,
        color: COLORS.white,
        fontWeight: '500',
    },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SIZES.padding.medium,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 18,
        marginTop: SIZES.padding.medium,
        backgroundColor: COLORS.darkBackground,
    },
    toggleButtonText: {
        ...FONTS.body3,
        color: COLORS.white,
        fontWeight: 'bold',
        marginRight: SIZES.padding.small,
    },
    suggestionTouchable: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    suggestionIcon: {
        marginRight: SIZES.padding.small,
    },
    scrollHintContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SIZES.padding.medium,
        opacity: 0.7,
    },
    scrollHintText: {
        ...FONTS.body3,
        color: COLORS.textGray,
        marginLeft: SIZES.padding.small,
        fontSize: 12,
        fontStyle: 'italic',
    },
});

export default SuggestionComponent; 