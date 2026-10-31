# qoolla-agent-app

Qoolla 에이전트 주도 수능 수학 학습 앱 (Expo SDK 54, Expo Router). 명세: [qoolla-agent-led-app-spec.md](qoolla-agent-led-app-spec.md)

- EAS 프로젝트: `@arasu0070/go3-math-brand-new-error` (`app.config.ts`의 `extra.eas.projectId`)
- 와이어프레임: https://claude.ai/artifact/5NNE87x4ECpdHegy4sxiAv

## 구조 (현재: M1 일부 + M2 앱 셸)

| 경로 | 역할 |
|---|---|
| `src/protocol` | §5.2 명령/이벤트 zod 스키마(추후 `@qoolla/agent-protocol`로 분리) |
| `src/agent/commandRouter.ts` | 명령 → UI 상태 reducer, ack, 멱등, 튜터 우선(일시정지/재개) |
| `src/agent/session.ts` | seq/ack, `hello.resume` 재개, 지수 백오프, 오프라인 큐 |
| `src/agent/mockAgent.ts` | 서버 없이 쓰는 모의 에이전트 + `WebSocketTransport` |
| `src/layout/deviceMode.ts` | 짧은 변 600 진입 / 560 이탈, 200ms 디바운스, drawer 폭 |
| `src/host` | Stage, 위젯 registry(zod props 검증), 모킹 위젯 |
| `app/(main)` | 에이전트 홈(폰 하단 모달 / 태블릿 drawer·toast) + classic 탭 자리 |

기존 앱(`qoolla-student-app`)에서 옮긴 api · 상태 · 컴포넌트 현황은 [docs/migration.md](docs/migration.md).

`EXPO_PUBLIC_AGENT_URL`을 지정하면 모의 에이전트 대신 WebSocket 서버에 연결한다.

## 명령

```bash
npm run web        # 웹 미리보기
npm start          # 개발 빌드(expo-dev-client) 대상
npm test
npm run typecheck
npm run lint
npx expo-doctor
```
