import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import PencilPropsModal from '../src/kit/canvas/note-canvas/pencil-props-modal';

const initialMetrics = {
    frame: { x: 0, y: 0, width: 800, height: 1200 },
    insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

const renderWithProviders = (ui: React.ReactElement) => {
    return render(
        <SafeAreaProvider initialMetrics={initialMetrics}>
            {ui}
        </SafeAreaProvider>
    );
};

describe('PencilPropsModal', () => {
    it('renders width and color options when visible', async () => {
        const onDismiss = jest.fn();
        const renderWidthOptions = () => <Text>Width Option</Text>;
        const renderColorOptions = () => <Text>Color Option</Text>;

        await renderWithProviders(
            <PencilPropsModal
                visible={true}
                onDismiss={onDismiss}
                renderWidthOptions={renderWidthOptions}
                renderColorOptions={renderColorOptions}
            />
        );

        expect(screen.getByText('Width Option')).toBeTruthy();
        expect(screen.getByText('Color Option')).toBeTruthy();
    });

    it('renders children if provided', async () => {
        const onDismiss = jest.fn();
        await renderWithProviders(
            <PencilPropsModal visible={true} onDismiss={onDismiss}>
                <Text>Custom Child Content</Text>
            </PencilPropsModal>
        );

        expect(screen.getByText('Custom Child Content')).toBeTruthy();
    });
});
