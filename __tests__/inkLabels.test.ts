import fs from 'fs';
import path from 'path';
import { INK_LABELS, strokeColors } from '../src/kit/canvas/note-canvas/canvas-utils';

jest.mock('react-native-webview', () => ({ WebView: () => null }));
jest.mock('react-native-blob-util', () => ({}));
jest.mock('../src/api/rest', () => ({ requestStorageUrl: jest.fn() }));

const read = (f: string) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CANVASES = [
  'src/kit/canvas/note-canvas/hotline-class-canvas.tsx',
  'src/kit/canvas/note-canvas/topic-live-canvas.tsx',
  'src/kit/canvas/note-canvas/notebook.tsx',
];

test('INK_LABELS covers every stored ink value with its Korean name', () => {
  expect(Object.keys(INK_LABELS)).toEqual([...strokeColors]);
  expect(INK_LABELS).toEqual({ orange: '주황', blue: '파랑', black: '검정', red: '빨강', green: '초록' });
});

test.each(CANVASES)('%s shows Korean labels and still stores the ink value', (f) => {
  const src = read(f);
  expect(src).toMatch(/title=\{INK_LABELS\[color\]\}/);
  expect(src).not.toMatch(/title=\{color\}/);
  expect(src).toMatch(/setCanvasStrokeColor\(color\)/);
});

test.each(CANVASES.slice(0, 2))('%s memo close is a labelled IconButton', (f) => {
  const src = read(f);
  expect(src).toMatch(/accessibilityLabel="메모 닫기"/);
  expect(src).not.toMatch(/✕/);
});
