import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import Animated, {
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
    useSharedValue,
} from 'react-native-reanimated';
import Go3MathSvgLogo from '../res/Go3MathLoading';
import { useDeviceMode } from '../../../layout/deviceMode';

export interface QoollaLogoActivityIndicatorProps {
    /** Horizontal sway amplitude in pixels (default 60). */
    offset?: number;
    /** Duration of each leg of the wave in ms (default 800). */
    duration?: number;
    /** SVG logo width (default 240, which is 2.4x the 100px base width). */
    logoWidth?: number;
    /** SVG logo height (default 72, which is 2.4x the 30px base height). */
    logoHeight?: number;
    /** Style applied to the outer wrapping View. */
    style?: StyleProp<ViewStyle>;
}

/**
 * Brand activity indicator rendering the Go3Math SVG logo with a smooth left-right wave animation.
 */
export default function QoollaLogoActivityIndicator({
    offset: offsetProp = 60,
    duration = 800,
    logoWidth,
    logoHeight,
    style,
}: QoollaLogoActivityIndicatorProps) {
    const isTablet = useDeviceMode() === 'tablet';

    const resolvedLogoWidth = logoWidth ?? (isTablet ? 600 : 240);
    const resolvedLogoHeight = logoHeight ?? (isTablet ? 180 : 72);

    const offset = useSharedValue<number>(offsetProp);

    const animatedStyles = useAnimatedStyle(() => ({
        transform: [{ translateX: offset.value }],
    }));

    useEffect(() => {
        offset.value = withRepeat(
            withSequence(
                withTiming(offsetProp, { duration, easing: Easing.cubic }),
                withTiming(0, { duration, easing: Easing.cubic }),
                withTiming(-offsetProp, { duration, easing: Easing.cubic }),
            ),
            -1,
            true,
        );
    }, [offsetProp, duration]);

    return (
        <View style={[styles.loadingView, style]}>
            <Animated.View style={[styles.loaderContainer, animatedStyles]}>
                <Go3MathSvgLogo width={resolvedLogoWidth} height={resolvedLogoHeight} />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    loaderContainer: {
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingView: {
        flex: 1,
        padding: 0,
        margin: 0,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
