import { z } from 'zod';
import type { DeviceMode } from '../layout/deviceMode';

// 명세서 §4.4: show_component는 registry에 있는 id만 허용하고 props를 zod로 검증한다.
// M3: topic_list / problem_preview / exam_search / research가 kit 패널 + 실데이터(조회 전용)로 동작한다. 나머지 id는 unsupported.
export type RegistryEntry = { propsSchema: z.ZodTypeAny; mode: 'both' | DeviceMode };

export const registry: Record<string, RegistryEntry> = {
  topic_list: {
    mode: 'both',
    propsSchema: z.object({
      subject: z.string().optional(),
      filter: z.object({ year: z.number(), month: z.number(), tag: z.string().optional() }).partial().optional(),
      pageSize: z.number().int().positive().optional(),
    }),
  },
  problem_preview: {
    mode: 'both',
    propsSchema: z.object({ topicId: z.number().int() }),
  },
  exam_search: {
    mode: 'both',
    propsSchema: z.object({
      mode: z.enum(['this_year', 'pre_exam']).default('this_year'),
      preset: z
        .object({
          subject: z.string(),
          years: z.array(z.number()),
          months: z.array(z.number()),
          numbers: z.array(z.number()),
        })
        .partial()
        .optional(),
    }),
  },
  // 검색 카테고리 칩 + 세부 선택(기존 research 화면). drawer '검색' 메뉴에 에이전트가 띄운다.
  research: {
    mode: 'both',
    propsSchema: z.object({ category: z.enum(['recent', 'pre', 'mentor']).optional() }),
  },
};

export type ResolveResult =
  | { ok: true; props: Record<string, unknown> }
  | { ok: false; code: 'unsupported' | 'invalid_props'; message: string };

export function resolveComponent(componentId: string, props: unknown, mode: DeviceMode): ResolveResult {
  const entry = registry[componentId];
  if (!entry) return { ok: false, code: 'unsupported', message: `unknown component: ${componentId}` };
  if (entry.mode !== 'both' && entry.mode !== mode) {
    return { ok: false, code: 'unsupported', message: `${componentId} is ${entry.mode}-only` };
  }
  const parsed = entry.propsSchema.safeParse(props);
  if (!parsed.success) return { ok: false, code: 'invalid_props', message: parsed.error.message };
  return { ok: true, props: parsed.data as Record<string, unknown> };
}
