// kit/live-class 포트의 구현(조회만). 기존 LiveClassPanel.loadData와 같은 REST 두 개.
import { getAllHotlineClasses, getTodayLiveClass } from '../api/rest';
import type { HotlineClass, LiveClassFetchers, TopicLiveClass } from '../kit/live-class/LiveClassListPanel';
import { authStore } from '../state/auth';

export function createLiveClassFetchers(): LiveClassFetchers {
  return {
    async fetchHotlineClasses() {
      const res = await getAllHotlineClasses();
      return (res.data?.result ?? []) as HotlineClass[];
    },
    async fetchTopicLiveClasses() {
      const token = authStore.getState().appToken;
      if (!token) return [];
      const res = await getTodayLiveClass(token);
      return (res.data?.result ?? []) as TopicLiveClass[];
    },
  };
}
