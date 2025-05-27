import { useRef, useState, useCallback } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Custom hook for managing animations in the AI screen
 * Handles transitions between chart view and chat view with improved UX
 */
const useAnimations = () => {
    const [showChart, setShowChart] = useState(true);

    // Animation values with better initial states
    const headerScale = useRef(new Animated.Value(1)).current;
    const headerOpacity = useRef(new Animated.Value(1)).current;
    const headerHeight = useRef(new Animated.Value(180)).current;
    const chatOpacity = useRef(new Animated.Value(0)).current;
    const chartScale = useRef(new Animated.Value(1)).current;
    const insightOpacity = useRef(new Animated.Value(1)).current;
    const borderHighlightOpacity = useRef(new Animated.Value(0)).current;
    const chatScaleAnim = useRef(new Animated.Value(0.95)).current;

    // Add slide animation for smoother transitions
    const chatSlideY = useRef(new Animated.Value(20)).current;
    const chartSlideY = useRef(new Animated.Value(0)).current;

    // Improved easing curves for better feel
    const SMOOTH_EASE_OUT = Easing.bezier(0.25, 0.46, 0.45, 0.94);
    const SMOOTH_EASE_IN = Easing.bezier(0.55, 0.06, 0.68, 0.19);
    const SPRING_CONFIG = {
        tension: 120,
        friction: 10,
        useNativeDriver: true,
    };

    // Function to animate the transition when chat starts
    const animateChatTransition = useCallback(() => {
        return new Promise((resolve) => {
            // Reset initial values for consistent animation
            borderHighlightOpacity.setValue(0);
            chatScaleAnim.setValue(0.95);
            chatSlideY.setValue(20);

            // Staggered animation sequence for better UX
            Animated.sequence([
                // Phase 1 & 2: Fade out insights, scale/slide chart, and collapse header smoothly
                Animated.parallel([
                    Animated.timing(insightOpacity, {
                        toValue: 0,
                        duration: 400,
                        easing: SMOOTH_EASE_IN,
                        useNativeDriver: true,
                    }),
                    Animated.timing(chartScale, {
                        toValue: 0.9,
                        duration: 400,
                        easing: SMOOTH_EASE_IN,
                        useNativeDriver: true,
                    }),
                    Animated.timing(chartSlideY, {
                        toValue: -10,
                        duration: 400,
                        easing: SMOOTH_EASE_IN,
                        useNativeDriver: true,
                    }),
                    Animated.timing(headerScale, {
                        toValue: 0,
                        duration: 450,
                        easing: SMOOTH_EASE_IN,
                        useNativeDriver: false,
                    }),
                    Animated.timing(headerOpacity, {
                        toValue: 0,
                        duration: 450,
                        easing: SMOOTH_EASE_IN,
                        useNativeDriver: false,
                    }),
                    Animated.timing(headerHeight, {
                        toValue: 0,
                        duration: 450,
                        easing: SMOOTH_EASE_IN,
                        useNativeDriver: false,
                    }),
                ]),

                // Phase 3: Bring in chat with spring animation AFTER state update
                // Update state here to swap views just before the new view animates in
                Animated.timing(new Animated.Value(0), { toValue: 1, duration: 0, useNativeDriver: true }).start(() => {
                    setShowChart(false);
                }),

                Animated.parallel([
                    Animated.timing(chatOpacity, {
                        toValue: 1,
                        duration: 500,
                        easing: SMOOTH_EASE_OUT,
                        useNativeDriver: true,
                    }),
                    Animated.spring(chatScaleAnim, {
                        toValue: 1,
                        ...SPRING_CONFIG,
                        useNativeDriver: true,
                    }),
                    Animated.spring(chatSlideY, {
                        toValue: 0,
                        ...SPRING_CONFIG,
                        useNativeDriver: true,
                    }),
                    // Delayed border highlight for polish
                    Animated.sequence([
                        Animated.delay(200),
                        Animated.timing(borderHighlightOpacity, {
                            toValue: 1,
                            duration: 400,
                            easing: SMOOTH_EASE_OUT,
                            useNativeDriver: true,
                        })
                    ])
                ])
            ]).start((finished) => {
                if (finished) {
                    resolve();
                } else {
                    // Handle animation interruption gracefully
                    console.warn('Chat transition animation was interrupted');
                    resolve();
                }
            });
        });
    }, [
        borderHighlightOpacity, chatScaleAnim, chatSlideY, insightOpacity,
        chartScale, chartSlideY, headerScale, headerOpacity, headerHeight,
        chatOpacity, SMOOTH_EASE_IN, SMOOTH_EASE_OUT, SPRING_CONFIG
    ]);

    // Function to reset animations with improved smoothness
    const resetAnimations = useCallback(() => {
        return new Promise((resolve) => {
            // Phase 1: Hide chat smoothly
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(chatOpacity, {
                        toValue: 0,
                        duration: 350,
                        easing: SMOOTH_EASE_IN,
                        useNativeDriver: true,
                    }),
                    Animated.timing(chatScaleAnim, {
                        toValue: 0.95,
                        duration: 350,
                        easing: SMOOTH_EASE_IN,
                        useNativeDriver: true,
                    }),
                    Animated.timing(chatSlideY, {
                        toValue: 20,
                        duration: 350,
                        easing: SMOOTH_EASE_IN,
                        useNativeDriver: true,
                    }),
                    Animated.timing(borderHighlightOpacity, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    })
                ]),

                // Update state here to swap views just before the old view animates out
                Animated.timing(new Animated.Value(0), { toValue: 1, duration: 0, useNativeDriver: true }).start(() => {
                    setShowChart(true);
                }),

                // Phase 2 & 3: Restore header, chart and insights with spring
                Animated.parallel([
                    Animated.spring(headerScale, {
                        toValue: 1,
                        tension: 90,
                        friction: 10,
                        useNativeDriver: false,
                    }),
                    Animated.timing(headerOpacity, {
                        toValue: 1,
                        duration: 500,
                        easing: SMOOTH_EASE_OUT,
                        useNativeDriver: false,
                    }),
                    Animated.spring(headerHeight, {
                        toValue: 180,
                        tension: 90,
                        friction: 10,
                        useNativeDriver: false,
                    }),
                    Animated.spring(chartScale, {
                        toValue: 1,
                        ...SPRING_CONFIG,
                        useNativeDriver: true,
                    }),
                    Animated.spring(chartSlideY, {
                        toValue: 0,
                        ...SPRING_CONFIG,
                        useNativeDriver: true,
                    }),
                    Animated.timing(insightOpacity, {
                        toValue: 1,
                        duration: 500,
                        easing: SMOOTH_EASE_OUT,
                        useNativeDriver: true,
                    }),
                ])
            ]).start((finished) => {
                if (finished) {
                    resolve();
                } else {
                    console.warn('Reset animation was interrupted');
                    resolve();
                }
            });
        });
    }, [
        chatOpacity, chatScaleAnim, chatSlideY, borderHighlightOpacity,
        headerScale, headerOpacity, headerHeight, chartScale, chartSlideY,
        insightOpacity, SMOOTH_EASE_IN, SMOOTH_EASE_OUT, SPRING_CONFIG
    ]);

    // Set initial animation states for existing chat with better handling
    const initializeWithChatHistory = useCallback((hasChatHistory) => {
        // Use requestAnimationFrame to ensure state update is processed before setting values
        requestAnimationFrame(() => {
            if (hasChatHistory) {
                // Set showChart first to prevent flicker
                setShowChart(false);

                // Set all values immediately for chat mode
                headerScale.setValue(0);
                headerOpacity.setValue(0);
                headerHeight.setValue(0);
                chatOpacity.setValue(1);
                chartScale.setValue(0.9);
                chartSlideY.setValue(-10);
                insightOpacity.setValue(0);
                chatScaleAnim.setValue(1);
                chatSlideY.setValue(0);
                borderHighlightOpacity.setValue(1);
            } else {
                // Set showChart first for insights mode
                setShowChart(true);

                // Reset all values for insights mode
                headerScale.setValue(1);
                headerOpacity.setValue(1);
                headerHeight.setValue(180);
                chartScale.setValue(1);
                chartSlideY.setValue(0);
                insightOpacity.setValue(1);
                chatScaleAnim.setValue(0.95);
                chatSlideY.setValue(20);
                borderHighlightOpacity.setValue(0);
            }
        });
    }, [
        headerScale, headerOpacity, headerHeight, chatOpacity, chartScale,
        insightOpacity, borderHighlightOpacity, chatScaleAnim, chatSlideY,
        chartSlideY,
    ]);

    return {
        showChart,
        setShowChart,
        headerScale,
        headerOpacity,
        headerHeight,
        chatOpacity,
        chartScale,
        insightOpacity,
        borderHighlightOpacity,
        chatScale: chatScaleAnim,
        chatSlideY,
        chartSlideY,
        animateChatTransition,
        resetAnimations,
        initializeWithChatHistory,
    };
};

export default useAnimations; 