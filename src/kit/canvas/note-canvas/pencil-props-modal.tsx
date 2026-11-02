import React, { FC, ReactNode } from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { ToolPopover } from '../ToolPopover';
import { space } from '../../../ui/theme';

// 펜 굵기·색 선택 카드. design-spec P2-1: paper Modal 대신 FloatingToolbar 위에 뜨는 ToolPopover로 그린다(바깥 탭 = onDismiss).
// 캔버스 컨테이너 안(CanvasChrome children)에 둬야 툴바와 같은 좌표계가 된다. 기존 props는 그대로 받는다.
export interface PencilPropsModalProps {
    visible: boolean;
    onDismiss: () => void;
    renderWidthOptions?: () => ReactNode;
    renderColorOptions?: () => ReactNode;
    children?: ReactNode;
    style?: StyleProp<ViewStyle>;
    contentContainerStyle?: StyleProp<ViewStyle>;
    /** paper Portal 시절 옵션 — 이제 쓰지 않는다(호환용) */
    wrapWithPortal?: boolean;
}

export const PencilPropsModal: FC<PencilPropsModalProps> = ({
    visible,
    onDismiss,
    renderWidthOptions,
    renderColorOptions,
    children,
    contentContainerStyle,
}) => (
    <ToolPopover visible={visible} onDismiss={onDismiss} style={contentContainerStyle}>
        <View style={styles.body}>
            {renderWidthOptions && <View style={styles.chipRow}>{renderWidthOptions()}</View>}
            {renderColorOptions && <View style={styles.chipRow}>{renderColorOptions()}</View>}
            {children}
        </View>
    </ToolPopover>
);

const styles = StyleSheet.create({
    body: {
        flexDirection: 'column',
        gap: space.sm,
    },
    chipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: space.sm,
    },
});

export default PencilPropsModal;
