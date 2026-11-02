// @ts-nocheck
/* eslint-disable react/display-name, no-var, react/jsx-key -- 기존 코드를 그대로 옮긴 파일 */
// 기존 qoolla-student-app `src/components/wrappers/screen-wrapper.tsx`를 그대로 옮김(note-canvas 전이용, import 경로만 맞춤).
import React, { useEffect, useContext, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { motion } from '../../../ui/theme';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';

type Edge = 'top' | 'bottom' | 'left' | 'right';

// Default edges keep the previous behavior (apply top, skip bottom) so
// existing callers don't break. Callers rendered INSIDE the MainStacks
// outer SafeAreaView (e.g. Drawer screens like share/questions-view.tsx)
// should pass `edges={['left', 'right']}` to avoid double-counting the
// top inset against the outer's already-applied top padding.
const DEFAULT_EDGES: Edge[] = ['top', 'left', 'right'];

const FullScreenWrapper = ({
    children,
    edges = DEFAULT_EDGES,
}: { children: any; edges?: Edge[] }) => {

    const insets = useSafeAreaInsets();
    // design-spec P3-1: RN Animated → reanimated. 포커스 때 motion.slow(320, 기존과 같음)로 나타나고 떠날 때 사라진다. 동작 줄이기면 즉시.
    const reduce = useReducedMotion();
    const fadeAnim = useSharedValue(0);
    const fadeStyle = useAnimatedStyle(() => ({ opacity: fadeAnim.value }));

    useFocusEffect(
        React.useCallback(() => {
            fadeAnim.value = reduce ? 1 : withTiming(1, { duration: motion.slow });
            return () => {
                fadeAnim.value = reduce ? 0 : withTiming(0, { duration: motion.slow });
            }
        }, [fadeAnim, reduce])
    );

    return (
        // `edges` is controlled by the caller (see DEFAULT_EDGES above).
        // Drawer screens that sit INSIDE the MainStacks outer SafeAreaView
        // should pass `edges={['left', 'right']}` to avoid double-counting
        // the top inset and creating wasted space above their content.
        <SafeAreaView style={styles.container} edges={edges}>
            <Animated.View style={[styles.wrapper, fadeStyle]} >
                <View style={styles.pannel}>
                    {children}
                </View>
            </Animated.View>
        </SafeAreaView>
    );
};
const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        padding: 0,
        margin: 0,
        backgroundColor: 'white',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pannel: {
        flex: 1,
        margin: 0,
        padding: 0,
        backgroundColor: 'white'
    },
    container: {
        flex: 1,
        backgroundColor: 'white'
    },
});

export default FullScreenWrapper;