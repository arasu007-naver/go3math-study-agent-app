import React, { FC, ReactNode } from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { Modal, Portal } from 'react-native-paper';

export interface PencilPropsModalProps {
    visible: boolean;
    onDismiss: () => void;
    renderWidthOptions?: () => ReactNode;
    renderColorOptions?: () => ReactNode;
    children?: ReactNode;
    style?: StyleProp<ViewStyle>;
    contentContainerStyle?: StyleProp<ViewStyle>;
    wrapWithPortal?: boolean;
}

export const PencilPropsModal: FC<PencilPropsModalProps> = ({
    visible,
    onDismiss,
    renderWidthOptions,
    renderColorOptions,
    children,
    style,
    contentContainerStyle,
    wrapWithPortal = false,
}) => {
    const modalContent = (
        <Modal
            visible={visible}
            onDismiss={onDismiss}
            style={[styles.modalWrapper, style]}
            contentContainerStyle={[styles.modalContent, contentContainerStyle]}
        >
            <View style={styles.body}>
                {renderWidthOptions && (
                    <View style={styles.chipRow}>
                        {renderWidthOptions()}
                    </View>
                )}
                {renderColorOptions && (
                    <View style={styles.chipRow}>
                        {renderColorOptions()}
                    </View>
                )}
                {children}
            </View>
        </Modal>
    );

    if (wrapWithPortal) {
        return <Portal>{modalContent}</Portal>;
    }

    return modalContent;
};

const styles = StyleSheet.create({
    modalWrapper: {
        position: 'absolute',
        top: 36,
        left: 18,
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
    },
    modalContent: {
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: 'orange',
        borderRadius: 12,
        padding: 12,
        alignSelf: 'flex-start',
    },
    body: {
        flexDirection: 'column',
        gap: 10,
    },
    chipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
});

export default PencilPropsModal;
