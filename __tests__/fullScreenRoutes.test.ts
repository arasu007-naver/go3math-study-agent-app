import { isFullScreenRoute } from '../src/layout/fullScreenRoutes';

describe('isFullScreenRoute', () => {
  it('covers the canvas and every tab result screen', () => {
    for (const p of ['/notebook', '/timeline/problems', '/search/topic', '/search/problems', '/chat/solution', '/diary/day', '/diary/solution']) expect(isFullScreenRoute(p)).toBe(true);
  });

  it('keeps tab first screens and other pages with the tab bar and ad', () => {
    for (const p of ['/', '/timeline', '/search', '/chat', '/diary', '/notice', '/profile', '/welcome', '/public-questions']) expect(isFullScreenRoute(p)).toBe(false);
  });
});
