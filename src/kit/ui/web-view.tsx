import React, { forwardRef, useState, useCallback } from 'react';
import {
    StyleSheet,
    View,
    ViewStyle,
    StyleProp,
} from 'react-native';
import { WebView, WebViewProps } from 'react-native-webview';
import Go3MathFetchingIndicator, {
    Go3MathFetchingIndicatorProps,
} from './loading-view/fetching-animation';

interface QoollaWebViewProps extends WebViewProps {
    /** Style applied to the wrapping View (sizing / positioning). */
    style?: StyleProp<ViewStyle>;
    /** Optional style applied to the inner WebView itself. */
    webViewStyle?: WebViewProps['style'];
    /** Backdrop color shown behind the indicator while loading. */
    loadingBackgroundColor?: string;
    /** Override props for the brand fetching indicator (size/offset/duration). */
    indicatorProps?: Go3MathFetchingIndicatorProps;
}

// Defaults sized for a typical embedded WebView container (smaller than the
// full-screen indicator). Callers can override per-instance via `indicatorProps`.
const DEFAULT_INDICATOR_PROPS: Go3MathFetchingIndicatorProps = {
    logoWidth: 140,
    logoHeight: 43,
    offset: 28,
    duration: 700,
};

/**
 * Wrapper around `react-native-webview` that:
 *   - defaults `javaScriptEnabled` to `true`
 *   - shows the brand `Go3MathFetchingIndicator` (wave-animated logo) until
 *     `onLoadEnd` fires
 *   - re-shows the indicator when the WebView starts loading again
 *     (navigations, reload(), source change, etc.)
 *   - forwards the ref so callers can still call `postMessage`,
 *     `injectJavaScript`, `reload`, etc.
 *   - passes every other prop through to the underlying WebView.
 */
const QoollaWebView = forwardRef<WebView, QoollaWebViewProps>((props, ref) => {
    const {
        onLoadStart,
        onLoadEnd,
        javaScriptEnabled = true,
        style,
        webViewStyle,
        loadingBackgroundColor = 'rgba(255, 255, 255, 0.85)',
        indicatorProps,
        ...rest
    } = props;

    const [loading, setLoading] = useState(true);

    const handleLoadStart = useCallback((event: any) => {
        setLoading(true);
        onLoadStart?.(event);
    }, [onLoadStart]);

    const handleLoadEnd = useCallback((event: any) => {
        setLoading(false);
        onLoadEnd?.(event);
    }, [onLoadEnd]);

    return (
        <View style={[styles.container, style]}>
            <WebView
                ref={ref}
                {...rest}
                javaScriptEnabled={javaScriptEnabled}
                onLoadStart={handleLoadStart}
                onLoadEnd={handleLoadEnd}
                style={[styles.webView, webViewStyle]}
            />
            {loading && (
                <View
                    style={[styles.loadingOverlay, { backgroundColor: loadingBackgroundColor }]}
                    pointerEvents="none"
                >
                    <Go3MathFetchingIndicator {...DEFAULT_INDICATOR_PROPS} {...indicatorProps} />
                </View>
            )}
        </View>
    );
});

QoollaWebView.displayName = 'QoollaWebView';

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    webView: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default QoollaWebView;
