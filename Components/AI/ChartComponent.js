import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, Animated, TouchableOpacity, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import Icon from 'react-native-vector-icons/Ionicons';
import { useCurrency } from '../../contexts/CurrencyContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Enhanced chart configuration with better accessibility
const chartConfig = {
    backgroundColor: COLORS.appBackground,
    backgroundGradientFrom: COLORS.appBackground,
    backgroundGradientTo: COLORS.appBackground,
    decimalPlaces: 0,
    color: (opacity = 1) => COLORS.primary || `rgba(253, 179, 71, ${opacity})`,
    labelColor: (opacity = 1) => COLORS.textSecondary || `rgba(107, 114, 128, ${opacity})`,
    style: {
        borderRadius: 0,
    },
    propsForDots: {
        r: '6',
        strokeWidth: '3',
        stroke: COLORS.primary || '#FDB347',
        fill: COLORS.primary || '#FDB347',
    },
    propsForBackgroundLines: {
        strokeDasharray: '',
        stroke: COLORS.lightGray || '#E5E7EB',
        strokeWidth: 1,
    },
    fillShadowGradient: COLORS.primary || '#FDB347',
    fillShadowGradientOpacity: 0.1,
};

// Error state component
const ErrorState = ({ error, onRetry }) => (
    <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={48} color={COLORS.error || '#FF3B30'} />
        <Text style={styles.errorTitle}>Unable to Load Chart</Text>
        <Text style={styles.errorText}>{error}</Text>
        {onRetry && (
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                <Icon name="refresh-outline" size={20} color={COLORS.white} />
                <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
        )}
    </View>
);

// Empty state component
const EmptyState = () => (
    <View style={styles.emptyContainer}>
        <Icon name="bar-chart-outline" size={64} color={COLORS.textGray} />
        <Text style={styles.emptyTitle}>No Data Available</Text>
        <Text style={styles.emptyText}>Start tracking transactions to see your spending trends</Text>
    </View>
);

/**
 * ChartComponent renders the spending chart and insights
 */
const ChartComponent = React.memo(({
    isLoading,
    error,
    chartData,
    insightMessage,
    insightOpacity,
    chartScale,
    chartSlideY,
    monthName,
    children, // For SuggestionBubbles component
    onRetry, // New prop for retry functionality
    suggestedQuestions = [], // Pass suggestions to help determine scroll need
}) => {
    // Currency context hook
    const { getCurrencySymbol } = useCurrency();
    const [scrollEnabled, setScrollEnabled] = useState(false);
    const [contentHeight, setContentHeight] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);
    const [deviceDimensions, setDeviceDimensions] = useState({ width: screenWidth, height: screenHeight });
    const scrollViewRef = useRef(null);

    // Listen for device orientation changes
    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            setDeviceDimensions({ width: window.width, height: window.height });
        });

        return () => subscription?.remove();
    }, []);

    // Force scroll check when suggestions change
    useEffect(() => {
        if (suggestedQuestions.length > 4) {
            console.log('[ChartComponent] Many suggestions detected, enabling scroll');
            setScrollEnabled(true);
        } else if (suggestedQuestions.length <= 3 && contentHeight > 0 && containerHeight > 0) {
            // Only disable if we have valid measurements and few suggestions
            const needsScrolling = contentHeight > (containerHeight - 20);
            setScrollEnabled(needsScrolling);
        }
    }, [suggestedQuestions.length, contentHeight, containerHeight]);

    // Create interpolated transforms for smoother animations
    const chartTransform = chartScale ? chartScale.interpolate({
        inputRange: [0, 1],
        outputRange: [0.9, 1],
        extrapolate: 'clamp'
    }) : 1;

    const slideTransform = chartSlideY ? chartSlideY.interpolate({
        inputRange: [-10, 0],
        outputRange: [-10, 0],
        extrapolate: 'clamp'
    }) : 0;

    // Calculate available height more accurately
    const calculateAvailableHeight = useCallback(() => {
        // Approximate heights of other UI elements
        const topBarHeight = 70; // From AIScreen topBar style
        const headerHeight = 140; // Approximate header section height
        const inputAreaHeight = 120; // Approximate input area height
        const statusBarHeight = 50; // Approximate status bar
        const safePadding = 40; // Additional safe area padding

        const totalUsedHeight = topBarHeight + headerHeight + inputAreaHeight + statusBarHeight + safePadding;
        const availableHeight = deviceDimensions.height - totalUsedHeight;

        return Math.max(availableHeight, 200); // Minimum height fallback
    }, [deviceDimensions.height]);

    // Handle content size change to determine if scrolling is needed
    const handleContentSizeChange = useCallback((contentWidth, contentHeight) => {
        console.log('[ChartComponent] Content size changed:', { contentHeight, containerHeight });
        setContentHeight(contentHeight);

        const availableHeight = containerHeight > 0 ? containerHeight : calculateAvailableHeight();
        const threshold = 20; // Slightly larger threshold for better detection

        // Force scrolling if we have many suggestions (fallback logic)
        const hasManyItems = suggestedQuestions.length > 4;
        const needsScrolling = contentHeight > (availableHeight - threshold) || hasManyItems;

        console.log('[ChartComponent] Scroll calculation:', {
            contentHeight,
            availableHeight,
            needsScrolling,
            threshold,
            hasManyItems,
            suggestionsCount: suggestedQuestions.length
        });

        setScrollEnabled(needsScrolling);
    }, [containerHeight, calculateAvailableHeight, suggestedQuestions.length]);

    // Handle container layout to get available height
    const handleContainerLayout = useCallback((event) => {
        const { height } = event.nativeEvent.layout;
        console.log('[ChartComponent] Container layout:', { height });
        setContainerHeight(height);

        if (contentHeight > 0) {
            const threshold = 20;
            const hasManyItems = suggestedQuestions.length > 4;
            const needsScrolling = contentHeight > (height - threshold) || hasManyItems;
            console.log('[ChartComponent] Layout scroll calculation:', {
                contentHeight,
                containerHeight: height,
                needsScrolling,
                hasManyItems,
                suggestionsCount: suggestedQuestions.length
            });
            setScrollEnabled(needsScrolling);
        }
    }, [contentHeight, suggestedQuestions.length]);

    return (
        <Animated.View
            style={{
                opacity: insightOpacity,
                flex: 1,
                transform: [{ translateY: slideTransform }]
            }}
            onLayout={handleContainerLayout}
        >
            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollViewContainer}
                contentContainerStyle={[
                    styles.scrollContentContainer,
                    !scrollEnabled && { flex: 1, justifyContent: 'flex-start' } // Take full height when not scrolling
                ]}
                scrollEnabled={scrollEnabled}
                showsVerticalScrollIndicator={scrollEnabled}
                bounces={scrollEnabled}
                alwaysBounceVertical={false}
                onContentSizeChange={handleContentSizeChange}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
            >
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>Loading your insights...</Text>
                    </View>
                ) : error ? (
                    <ErrorState error={error} onRetry={onRetry} />
                ) : chartData.datasets[0].data.length > 0 ? (
                    <>
                        {monthName && (
                            <Text style={styles.monthNameText} accessibilityRole="header">
                                {monthName} Spending Overview
                            </Text>
                        )}
                        <Animated.View
                            style={{
                                marginLeft: -SIZES.padding.xxlarge,
                                transform: [
                                    { scale: chartTransform },
                                    { translateY: slideTransform }
                                ],
                                overflow: 'hidden'
                            }}
                            accessibilityLabel={`Spending chart for ${monthName}`}
                            accessibilityHint="Shows weekly spending trends for the current month"
                        >
                            <LineChart
                                data={chartData}
                                width={screenWidth - (SIZES.padding.xlarge * 2)}
                                height={240}
                                yAxisInterval={1}
                                chartConfig={chartConfig}
                                bezier
                                style={styles.chart}
                                withVerticalLines={false}
                                withHorizontalLines={true}
                                withShadow={false}
                                fromZero={true}
                                yLabelsOffset={12}
                                xLabelsOffset={-10}
                                segments={4}
                                formatYLabel={(yLabel) => {
                                    const currencySymbol = getCurrencySymbol();
                                    const num = parseFloat(yLabel.replace(currencySymbol, '').replace('$', ''));
                                    if (isNaN(num)) return `${currencySymbol}0`;
                                    if (num >= 1000000) return `${currencySymbol}${(num / 1000000).toFixed(1)}M`;
                                    if (num >= 1000) return `${currencySymbol}${(num / 1000).toFixed(0)}k`;
                                    return `${currencySymbol}${num.toFixed(0)}`;
                                }}
                            />
                        </Animated.View>

                        {/* Insight Text */}
                        <View style={styles.insightTextContainer}>
                            <Text
                                style={styles.insightText}
                                accessibilityRole="text"
                                accessibilityLabel="Spending insight"
                            >
                                {insightMessage}
                            </Text>
                        </View>

                        {/* Children for SuggestionBubbles */}
                        {!isLoading && !error && children && React.isValidElement(children)
                            ? React.cloneElement(children, { scrollEnabled })
                            : children
                        }
                    </>
                ) : (
                    <>
                        <EmptyState />
                        {/* Still show suggestions even when there's no chart data */}
                        {!isLoading && !error && children && React.isValidElement(children)
                            ? React.cloneElement(children, { scrollEnabled })
                            : children
                        }
                    </>
                )}
            </ScrollView>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    scrollViewContainer: {
        flex: 1,
    },
    scrollContentContainer: {
        flexGrow: 1,
        paddingBottom: SIZES.padding.large, // Padding at bottom for suggestions
    },
    chart: {
        marginBottom: SIZES.padding.xlarge,
        alignSelf: 'center',
    },
    monthNameText: {
        ...FONTS.h3,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SIZES.padding.small,
        marginTop: SIZES.padding.xlarge,
    },
    insightTextContainer: {
        marginBottom: SIZES.padding.large,
        paddingHorizontal: SIZES.padding.medium,
    },
    insightText: {
        ...FONTS.body2,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 300, // Ensure minimum height for loading state
    },
    loadingText: {
        ...FONTS.body3,
        color: COLORS.textSecondary,
        marginTop: SIZES.padding.small,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SIZES.padding.medium,
        minHeight: 300, // Ensure minimum height for error state
    },
    errorTitle: {
        ...FONTS.h3,
        color: COLORS.textSecondary,
        marginBottom: SIZES.padding.small,
    },
    errorText: {
        ...FONTS.body3,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        padding: SIZES.padding.medium,
        borderRadius: SIZES.radius.medium,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SIZES.padding.medium,
    },
    retryButtonText: {
        ...FONTS.body2,
        color: COLORS.white,
        marginLeft: SIZES.padding.small,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SIZES.padding.medium,
        minHeight: 300, // Ensure minimum height for empty state
    },
    emptyTitle: {
        ...FONTS.h3,
        color: COLORS.textSecondary,
        marginBottom: SIZES.padding.small,
    },
    emptyText: {
        ...FONTS.body3,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
});

export default ChartComponent; 