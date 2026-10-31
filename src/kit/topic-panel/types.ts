// kit/topic-panel 포트(명세서 §2.7). 데이터는 fetcher로 주입받고, 선택은 콜백으로 올린다.
export type TopicSummary = {
  id: number | string;
  title: string;
  description?: string | null;
  subject?: string;
  unitCount?: number;
  orgType?: string | null;
  founder?: { name?: string; imageUrl?: string | null } | null;
};

export type TopicScript = { id: number; releaseScriptUrl?: string | null; filenames?: string | null };

export type TopicUnit = {
  unitModelId?: number;
  sourceType: string;
  sourceId: number;
  scripts?: TopicScript[] | null;
};

export type TopicDetail = TopicSummary & { units: TopicUnit[] };

export interface TopicPanelFetchers {
  fetchSubjectTopics(a: { subject: string; page: number; pageSize: number }): Promise<TopicSummary[]>;
  fetchTotalPageCount(a: { subject: string; pageSize: number }): Promise<number>;
  fetchTopic(topicId: number): Promise<TopicDetail>;
}

export type SubjectOption = { label: string; value: string };
