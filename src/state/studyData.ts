// 학생이 학습 데이터를 바꾼 횟수(학습장 저장, 캔버스 종료, 풀이·퀴즈 답 올리기).
// 타임라인과 Study Log 학습장 목록은 이 값을 refreshKey로 받아, 바뀌면 다시 조회한다(docs/superpowers/specs/2026-11-15-study-log-review-design.md §6).
import { createStore } from './createStore';

export const studyDataStore = createStore((n: number, _action: 'bump') => n + 1, 0);

export const bumpStudyData = () => studyDataStore.dispatch('bump');

export const useStudyDataVersion = () => studyDataStore.useStore();
