import fs from 'fs';
import path from 'path';
import liveClassCanvasTemplate from '../src/kit/canvas/templates/live-class-canvas-template';
import classCanvasTemplate from '../src/kit/canvas/templates/whiteboard-canvas-template';
import topicCanvasTemplate from '../src/kit/canvas/templates/topic-canvas-template';
import { ERASER_WIDTH, eraserWidth, inkWidth, quizPen } from '../src/kit/canvas/note-canvas/canvas-utils';

jest.mock('react-native-blob-util', () => ({ __esModule: true, default: {} }));
jest.mock('../src/api/rest', () => ({ requestStorageUrl: jest.fn() }));

const memStore = () => {
  const m: Record<string, any> = {};
  return {
    set: (k: string, v: number | string) => { m[k] = v; },
    getNumber: (k: string) => m[k] as number | undefined,
    getString: (k: string) => m[k] as string | undefined,
  };
};

describe('지우개 굵기', () => {
  it('지우개를 고르면 72px, 다른 색을 고르면 지우개 전 굵기로 돌아간다', () => {
    const store = memStore();
    expect(eraserWidth(store, 'blue', 9)).toBe(72);
    expect(ERASER_WIDTH).toBe(72);
    expect(inkWidth(store, 'white', 72)).toBe(9);
  });

  it('지우개를 다시 눌러도 지우개 전 굵기를 덮어쓰지 않는다', () => {
    const store = memStore();
    eraserWidth(store, 'red', 4);
    eraserWidth(store, 'white', 72);
    expect(inkWidth(store, 'white', 72)).toBe(4);
  });

  it('지우개가 아니면 색을 바꿔도 굵기는 그대로', () => {
    expect(inkWidth(memStore(), 'orange', 15)).toBe(15);
  });

  it('지우개 전 굵기가 없으면 기본 6', () => {
    expect(inkWidth(memStore(), 'white', 72)).toBe(6);
  });
});

describe('지우개 전 색과 퀴즈 펜', () => {
  it('지우개를 고르면 지우개 전 색도 저장하고, 이미 지우개면 덮어쓰지 않는다', () => {
    const store = memStore();
    expect(eraserWidth(store, 'blue', 9)).toBe(72);
    expect(store.getString('canvasStrokeColorBeforeEraser')).toBe('blue');
    expect(store.getNumber('canvasStrokeWidthBeforeEraser')).toBe(9);
    eraserWidth(store, 'white', 72);
    expect(store.getString('canvasStrokeColorBeforeEraser')).toBe('blue');
    expect(store.getNumber('canvasStrokeWidthBeforeEraser')).toBe(9);
  });
  it('색이 없으면 색을 저장하지 않는다', () => {
    const store = memStore();
    expect(() => eraserWidth(store, undefined as any, 6)).not.toThrow();
    expect(store.getString('canvasStrokeColorBeforeEraser')).toBeUndefined();
  });
  it('quizPen: 일반 색, 빈 store, 지우개 상태', () => {
    const s = memStore();
    expect(quizPen(s)).toEqual({ color: 'orange', width: 6 });
    s.set('canvasStrokeColor', 'blue'); s.set('canvasStrokeWidth', 10);
    expect(quizPen(s)).toEqual({ color: 'blue', width: 10 });
    s.set('canvasStrokeColor', 'white'); s.set('canvasStrokeWidth', 72);
    expect(quizPen(s)).toEqual({ color: 'orange', width: 6 });
    s.set('canvasStrokeColorBeforeEraser', 'green'); s.set('canvasStrokeWidthBeforeEraser', 15);
    expect(quizPen(s)).toEqual({ color: 'green', width: 15 });
  });
});

describe.each([
  ['live-class', liveClassCanvasTemplate(818, 1212, 'orange', 6)],
  ['whiteboard', classCanvasTemplate(818, 1212)],
  ['topic', topicCanvasTemplate(818, 1212)],
])('지우개 커서(%s 템플릿)', (_name, html) => {
  it('주황 2px 점선 원을 터치 지점에 띄우고 손을 떼면 숨긴다', () => {
    expect(html).toContain('border:2px dashed orange');
    expect(html).toContain('border-radius:50%');
    expect(html).toMatch(/canvas\.on\('mouse:down', showEraserCursor\)/);
    expect(html).toMatch(/canvas\.on\('mouse:move', showEraserCursor\)/);
    expect(html).toMatch(/canvas\.on\('mouse:up', hideEraserCursor\)/);
  });
});

describe.each(['hotline-class-canvas.tsx', 'topic-live-canvas.tsx', 'notebook.tsx', 'topic-notebook.tsx'])('%s 펜 옵션', (file) => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src/kit/canvas/note-canvas', file), 'utf8');
  it('지우개는 72px로, 색 버튼은 지우개 전 굵기로 바꾼다', () => {
    expect(src).toContain('setCanvasStrokeWidth(eraserWidth(storage, canvasStrokeColor, canvasStrokeWidth));');
    expect(src).toContain('setCanvasStrokeWidth(inkWidth(storage, canvasStrokeColor, canvasStrokeWidth));');
  });
});
