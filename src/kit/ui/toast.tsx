import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { WebView } from 'react-native-webview';
import Go3MathLoader from './loading-view';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ToastProps {
    message: string;
    isVisible: boolean;
    onHide: () => void;
    duration?: number; // How long the toast is visible in ms (default: 3000)
}

const ActivityIndicatorElement = () => {
    return (
        <Go3MathLoader />
    );
};

const ScriptMessageToast: React.FC<ToastProps> = ({ message, isVisible, onHide, duration = 3000 }) => {
    const animatedValue = useRef(new Animated.Value(0)).current; // For fade in/out animation
    const [pageLoadProgress, setPageLoadProgress] = useState(0);
    useEffect(() => {
        if (isVisible) {
            // Show animation (fade in)
            console.log('msg: ', message)
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: 300, // Fade in duration
                useNativeDriver: true,
            }).start(() => {
                // After fade-in, start auto-hide timer
                const timer = setTimeout(() => {
                    // Hide animation (fade out)
                    Animated.timing(animatedValue, {
                        toValue: 0,
                        duration: 500, // Fade out duration
                        useNativeDriver: true,
                    }).start(() => onHide()); // Call onHide after fade-out completes
                }, duration); // Visible duration

                return () => clearTimeout(timer); // Clear timer if component unmounts or becomes invisible
            });
        } else {
            // If `isVisible` becomes false externally, ensure it fades out
            Animated.timing(animatedValue, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [isVisible, duration, animatedValue, onHide]);

    // If not visible, don't render to optimize
    if (!isVisible && (animatedValue as unknown as { __getValue(): number }).__getValue() === 0) {
        return null;
    }

    // Calculate dynamic dimensions
    const toastWidth = screenWidth * (2 / 3);
    const toastHeight = screenHeight * (1 / 2);

    return (
        <View
            style={styles.toastContainer}
        >
            {/* TouchableWithoutFeedback to make the toast itself dismissible on tap */}
            <TouchableWithoutFeedback onPress={onHide}>
                <View style={styles.contentWrapper}>
                    <WebView
                        originWhitelist={['*']}
                        source={{ uri: 'https://m-cache.qoolla.com/popup/statement/520' }}
                        style={{ flex: 1,  width: toastWidth - 12, height: toastHeight - 12 }}
                        onLoadStart={() => setPageLoadProgress(0)}
                        startInLoadingState={true}
                        nestedScrollEnabled={true}
                        renderLoading={ActivityIndicatorElement}
                        onLoadProgress={({ nativeEvent }) => { console.log(nativeEvent.progress); setPageLoadProgress(nativeEvent.progress) }}
                    />
                </View>
            </TouchableWithoutFeedback>
        </View>
    );
};

const styles = StyleSheet.create({
    toastContainer: {
        position: 'absolute', // Position absolutely
        top: 0,               // Top-left corner
        left: 0,              // Top-left corner
        padding: 3,
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Semi-transparent black background
        borderRadius: 8,
        zIndex: 1000,         // Ensure it's above other content
        justifyContent: 'flex-start', // Center content vertically
        alignItems: 'flex-start',   // Center content horizontally
        elevation: 5,           // Android shadow
        shadowColor: '#000',    // iOS shadow
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    contentWrapper: {
        flex: 1, // Ensure content takes up all space inside the container
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        height: screenHeight * (1 / 2),
        width: screenWidth * (2 / 3)
    },
    messageText: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
    },
});

export default ScriptMessageToast;