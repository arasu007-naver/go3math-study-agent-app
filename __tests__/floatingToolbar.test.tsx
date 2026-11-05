import React from 'react';
import { render, screen } from '@testing-library/react-native';

jest.mock('react-native-webview', () => ({ WebView: () => null }));

import { FloatingToolbar } from '../src/kit/canvas/FloatingToolbar';
import { canvasAction, canvasTool } from '../src/kit/canvas/CanvasChrome';

describe('FloatingToolbar', () => {
    it('renders labels under icons starting from the second item (excluding left arrow)', async () => {
        const actions = [
            canvasAction('exit', '나가기', 'chevron-back', () => {}),
            canvasAction('list', '목록', 'albums-outline', () => {}),
            canvasAction('answer', '해답', 'eye-outline', () => {}),
            canvasAction('workouts', '내 풀이', 'layers-outline', () => {}),
            canvasAction('conceptSearch', '개념', 'search-outline', () => {}),
        ];

        const tools = [
            canvasTool('color', 'Options'),
            canvasTool('clearBoard', '전체 지우기'),
            canvasTool('save', '저장'),
        ];

        await render(
            <FloatingToolbar
                mode="draw"
                actions={actions}
                tools={tools}
                strokeColor="orange"
            />
        );

        // First item (left arrow 'exit') should NOT have text rendered under icon
        expect(screen.queryByText('나가기')).toBeNull();

        // 2nd item onward must have labels rendered
        expect(screen.getByText('목록')).toBeTruthy();
        expect(screen.getByText('해답')).toBeTruthy();
        expect(screen.getByText('내 풀이')).toBeTruthy();
        expect(screen.getByText('개념')).toBeTruthy();
        expect(screen.getByText('Options')).toBeTruthy();
        expect(screen.getByText('전체 지우기')).toBeTruthy();
        expect(screen.getByText('저장')).toBeTruthy();
    });
});
