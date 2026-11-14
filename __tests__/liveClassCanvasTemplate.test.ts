import liveClassCanvasTemplate from '../src/kit/canvas/templates/live-class-canvas-template';

// '전체 지우기'(CLEAN_BOARD → resetCanvas)와 SNAPSHOT은 지우기 전 판서를 이미지로 떠서 풀이로 올린다.
// 배율이 1920/classScale(수천 배)이면 캔버스 한도를 넘어 toDataURL이 빈 "data:,"를 돌려주고 0바이트 풀이가 저장됐다.
describe('live class canvas template snapshot scale', () => {
  const html = liveClassCanvasTemplate(818, 1212, 'orange', 6);
  const body = (name: string) => html.slice(html.indexOf(`function ${name}(`)).split('\n').slice(0, 8).join('\n');

  it('resetCanvas and uploadSnapshot scale the board to the 1920 reference height', () => {
    for (const name of ['resetCanvas', 'uploadSnapshot']) {
      expect(body(name)).toContain('multiplier: 1/classScale');
    }
    expect(html).not.toContain('1920/classScale');
  });
});
