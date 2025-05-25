import React from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, Animated, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import Icon from 'react-native-vector-icons/Ionicons';

const screenWidth = Dimensions.get('window').width;

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
}) => {
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

    return (
        <Animated.View
            style={{
                opacity: insightOpacity,
                flex: 1,
                transform: [{ translateY: slideTransform }]
            }}
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
                                const num = parseFloat(yLabel.replace('$', ''));
                                if (isNaN(num)) return '$0';
                                if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
                                if (num >= 1000) return `$${(num / 1000).toFixed(0)}k`;
                                return `$${num.toFixed(0)}`;
                            }}
                        />
                    </Animated.View>
                </>
            ) : (
                <EmptyState />
            )}

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
            {!isLoading && !error && children}
        </Animated.View>
    );
});

const styles = StyleSheet.create({
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