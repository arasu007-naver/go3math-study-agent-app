import { layout, colors } from '../src/ui/theme';

test('stage 3 tokens', () => {
  expect(layout.controlSm).toBe(32);
  expect(layout.railOpacity).toBe(0.88);
  expect(layout.dialogMax).toBe(400);
});

test('existing tokens unchanged', () => {
  expect(layout.hit).toBe(44);
  expect(layout.chatMax).toBe(400);
  expect(colors.accent).toBe('#F97316');
  expect(colors.accentPress).toBe('#EA580C');
});
