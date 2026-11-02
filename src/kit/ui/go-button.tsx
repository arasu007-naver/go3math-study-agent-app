import { useRef, useState } from 'react';
import {
    StyleSheet,
    Pressable,
    Text,
    Platform,
    ActivityIndicator,
    View,
    ViewStyle,
    TextStyle,
    StyleProp,
    Animated,
} from 'react-native';
import { colors, fontFamily } from '../../ui/theme';

type Variant = 'outline' | 'filled';
type Size = 'xSmall' | 'small' | 'medium';

interface GoButtonProps {
    onPress?: () => void | Promise<unknown>;
    title?: string;
    variant?: Variant;
    color?: string;
    textColor?: string;
    size?: Size;
    rippleColor?: string;
    disabled?: boolean;
    loading?: boolean;
    debounceMs?: number;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
}

const SIZE_MAP: Record<Size, { height: number; paddingHorizontal: number; fontSize: number; borderRadius: number }> = {
    xSmall: { height: 26, paddingHorizontal: 10, fontSize: 12, borderRadius: 13 },
    small:  { height: 32, paddingHorizontal: 12, fontSize: 14, borderRadius: 16 },
    medium: { height: 38, paddingHorizontal: 18, fontSize: 16, borderRadius: 19 },
};

const GoButton = ({
    onPress,
    title,
    variant = 'outline',
    color = colors.accent,
    textColor,
    size = 'small',
    rippleColor = colors.accentSoftPress,
    disabled = false,
    loading = false,
    debounceMs = 400,
    style,
    textStyle,
}: GoButtonProps) => {
    const sizing = SIZE_MAP[size];
    const isOutline = variant === 'outline';
    const labelColor = textColor ?? (isOutline ? colors.accentText : colors.onAccent);

    const [internalLoading, setInternalLoading] = useState(false);
    const lastPressRef = useRef(0);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const isLoading = loading || internalLoading;
    const isInactive = disabled || isLoading;

    const handlePress = async () => {
        if (isInactive) return;
        const now = Date.now();
        if (now - lastPressRef.current < debounceMs) return;
        lastPressRef.current = now;
        if (!onPress) return;

        try {
            const result = onPress();
            if (result && typeof (result as Promise<unknown>).then === 'function') {
                setInternalLoading(true);
                await result;
            }
        } finally {
            setInternalLoading(false);
        }
    };

    const handlePressIn = () => {
        if (isInactive) return;
        Animated.spring(scaleAnim, {
            toValue: 1.05,
            useNativeDriver: true,
            tension: 60,
            friction: 4,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 60,
            friction: 4,
        }).start();
    };

    return (
        <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
            <Pressable
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                android_ripple={isInactive ? undefined : { color: rippleColor, borderless: false }}
                style={({ pressed }) => [
                    styles.base,
                    {
                        height: sizing.height,
                        paddingHorizontal: sizing.paddingHorizontal,
                        borderRadius: sizing.borderRadius,
                        backgroundColor: isOutline ? 'transparent' : color,
                        borderWidth: isOutline ? 2 : 0,
                        borderColor: isOutline ? color : 'transparent',
                        opacity: disabled ? 0.5 : 1,
                    },
                    Platform.OS === 'ios' && pressed && !isInactive && { backgroundColor: rippleColor },
                ]}
            >
                <Text
                    style={[
                        {
                            color: labelColor,
                            fontSize: sizing.fontSize,
                            fontFamily: fontFamily.semibold,
                            fontWeight: '600',
                            opacity: isLoading ? 0 : 1,
                        },
                        textStyle,
                    ]}
                >
                    {title}
                </Text>
                {isLoading && (
                    <View style={styles.spinnerOverlay} pointerEvents="none">
                        <ActivityIndicator size="small" color={labelColor} />
                    </View>
                )}
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    base: {
        marginRight: 9,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    spinnerOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default GoButton;
