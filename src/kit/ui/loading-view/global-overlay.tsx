import React from 'react';
import { StyleSheet, View } from 'react-native';
import { blockingStore, localOverlayStore } from '../../../state/blocking';
import QoollaLogoActivityIndicator from './qoolla-logo-activity-indicator';

// Horizontal wave animation params, sized for a compact overlay bubble.
const WAVE_OFFSET = 16;
const WAVE_DURATION = 700;
const LOGO_WIDTH = 100;
const LOGO_HEIGHT = 30;

const GlobalLoadingOverlay = () => {
    const blockingIds = blockingStore.useStore();
    const localOverlayActive = localOverlayStore.useStore();

    // App-level blocking only (docs/loading-architecture.md).
    // Suppress when a screen owns a full-screen local overlay.
    const blocking = blockingIds.length > 0;
    if (!blocking || localOverlayActive) return null;

    return (
        <View style={styles.overlay} pointerEvents="none">
            <View style={styles.bubble}>
                <QoollaLogoActivityIndicator
                    offset={WAVE_OFFSET}
                    duration={WAVE_DURATION}
                    logoWidth={LOGO_WIDTH}
                    logoHeight={LOGO_HEIGHT}
                    style={styles.indicator}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        elevation: 9999,
    },
    bubble: {
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
    },
    indicator: {
        flex: 0,
    },
});

export default GlobalLoadingOverlay;
