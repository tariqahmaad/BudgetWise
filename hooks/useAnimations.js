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
        tension: 100,
        friction: 8,
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
                // Phase 1: Fade out insights smoothly
                Animated.parallel([
                    Animated.timing(insightOpacity, {
                        toValue: 0,
                        duration: 250,
                        easing: SMOOTH_EASE_IN,
                        useNativeDriver: true,
                    }),
                    Animated.timing(chartScale, {
                        toValue: 0.9,
                        duration: 250,
                        easing: SMOOTH_EASE_IN,
                        useNativeDriver: true,
                    }),
                    Animated.timing(chartSlideY, {
                        toValue: -10,
                        duration: 250,
                        easing: SMOOTH_EASE_IN,
                        useNativeDriver: true,
                    }),
                ]),

                // Phase 2: Collapse header
                Animated.parallel([
                    Animated.timing(headerScale, {
                        toValue: 0,
                        duration: 300,
                        easing: SMOOTH_EASE_IN,
                        useNativeDriver: false,
                    }),
                    Animated.timing(headerOpacity, {
                        toValue: 0,
                        duration: 300,
                        easing: SMOOTH_EASE_IN,
                        useNativeDriver: false,
                    }),
                    Animated.timing(headerHeight, {
                        toValue: 0,
                        duration: 300,
                        easing: SMOOTH_EASE_IN,
                        useNativeDriver: false,
                    }),
                ]),

                // Phase 3: Bring in chat with spring animation
                Animated.parallel([
                    Animated.timing(chatOpacity, {
                        toValue: 1,
                        duration: 400,
                        easing: SMOOTH_EASE_OUT,
                        useNativeDriver: true,
                    }),
                    Animated.spring(chatScaleAnim, {
                        toValue: 1,
                        ...SPRING_CONFIG,
                    }),
                    Animated.spring(chatSlideY, {
                        toValue: 0,
                        ...SPRING_CONFIG,
                    }),
                    // Delayed border highlight for polish
                    Animated.sequence([
                        Animated.delay(150),
                        Animated.timing(borderHighlightOpacity, {
                            toValue: 1,
                            duration: 300,
                            easing: SMOOTH_EASE_OUT,
                            useNativeDriver: true,
                        })
                    ])
                ])
            ]).start((finished) => {
                if (finished) {
                    setShowChart(false);
                    resolve();
                } else {
                    // Handle animation interruption gracefully
                    console.warn('Chat transition animation was interrupted');
                    setShowChart(false);
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
            setShowChart(true);

            // Small delay to ensure state update
            setTimeout(() => {
                Animated.sequence([
                    // Phase 1: Hide chat smoothly
                    Animated.parallel([
                        Animated.timing(chatOpacity, {
                            toValue: 0,
                            duration: 200,
                            easing: SMOOTH_EASE_IN,
                            useNativeDriver: true,
                        }),
                        Animated.timing(chatScaleAnim, {
                            toValue: 0.95,
                            duration: 200,
                            easing: SMOOTH_EASE_IN,
                            useNativeDriver: true,
                        }),
                        Animated.timing(chatSlideY, {
                            toValue: 20,
                            duration: 200,
                            easing: SMOOTH_EASE_IN,
                            useNativeDriver: true,
                        }),
                        Animated.timing(borderHighlightOpacity, {
                            toValue: 0,
                            duration: 150,
                            useNativeDriver: true,
                        })
                    ]),

                    // Phase 2: Restore header with spring
                    Animated.parallel([
                        Animated.spring(headerScale, {
                            toValue: 1,
                            tension: 80,
                            friction: 8,
                            useNativeDriver: false,
                        }),
                        Animated.timing(headerOpacity, {
                            toValue: 1,
                            duration: 350,
                            easing: SMOOTH_EASE_OUT,
                            useNativeDriver: false,
                        }),
                        Animated.spring(headerHeight, {
                            toValue: 180,
                            tension: 80,
                            friction: 8,
                            useNativeDriver: false,
                        }),
                    ]),

                    // Phase 3: Restore chart and insights
                    Animated.parallel([
                        Animated.spring(chartScale, {
                            toValue: 1,
                            ...SPRING_CONFIG,
                        }),
                        Animated.spring(chartSlideY, {
                            toValue: 0,
                            ...SPRING_CONFIG,
                        }),
                        Animated.timing(insightOpacity, {
                            toValue: 1,
                            duration: 350,
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
            }, 50);
        });
    }, [
        chatOpacity, chatScaleAnim, chatSlideY, borderHighlightOpacity,
        headerScale, headerOpacity, headerHeight, chartScale, chartSlideY,
        insightOpacity, SMOOTH_EASE_IN, SMOOTH_EASE_OUT, SPRING_CONFIG
    ]);

    // Set initial animation states for existing chat with better handling
    const initializeWithChatHistory = useCallback((hasChatHistory) => {
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
            chatOpacity.setValue(0);
            chatScaleAnim.setValue(0.95);
            chatSlideY.setValue(20);
            borderHighlightOpacity.setValue(0);
        }
    }, [
        headerScale, headerOpacity, headerHeight, chatOpacity, chartScale,
        chartSlideY, insightOpacity, chatScaleAnim, chatSlideY, borderHighlightOpacity
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
        initializeWithChatHistory
    };
};

export default useAnimations; 