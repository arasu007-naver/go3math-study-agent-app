import moment from 'moment';

// startedAt: 서버가 준 최초 On Air epoch ms 문자열. 기기 현지 시각 24시간제 HH:mm로 바꾼다
export function formatStartTime(startedAt: string | number | null | undefined): string {
  if (startedAt === null || startedAt === undefined || startedAt === '') return '--:--';
  const ms = Number(startedAt);
  if (!Number.isFinite(ms)) return '--:--';
  return moment(ms).format('HH:mm');
}
