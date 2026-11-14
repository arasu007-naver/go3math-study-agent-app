import React from 'react';
import { render } from '@testing-library/react-native';

// 루트 Stack이 받는 screenOptions와 Stack.Screen 선언을 모은다
const mockStack: { screenOptions?: any; screens: Record<string, any> } = { screens: {} };
jest.mock('expo-router', () => {
  const React = require('react');
  const Stack = ({ screenOptions, children }: any) => {
    mockStack.screenOptions = screenOptions;
    React.Children.forEach(children, (c: any) => {
      mockStack.screens[c.props.name] = c.props.options;
    });
    return null;
  };
  Stack.Screen = () => null;
  return { Stack, usePathname: () => '/' };
});
jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('@apollo/client/react', () => ({ ApolloProvider: ({ children }: any) => children }));
jest.mock('@gorhom/bottom-sheet', () => ({ BottomSheetModalProvider: ({ children }: any) => children }));
// 네이티브 inset을 기다리지 않고 자식을 바로 그리게 한다
jest.mock('react-native-safe-area-context', () => ({ SafeAreaProvider: ({ children }: any) => children }));
jest.mock('react-native-gesture-handler', () => ({ GestureHandlerRootView: ({ children }: any) => children }));
jest.mock('../src/state/bootstrap', () => ({ apolloClient: {}, bootstrap: () => {} }));
jest.mock('../src/ui/AdSlot', () => ({ AdSlotFrame: ({ children }: any) => children, initMobileAds: () => Promise.resolve() }));
jest.mock('../src/ui/TabletLaunchOverlay', () => ({ TabletLaunchOverlay: () => null }));
jest.mock('../src/kit/ui/loading-view/global-overlay', () => ({ __esModule: true, default: () => null }));

import RootLayout from '../app/_layout';
import { CANVAS_ROUTES } from '../src/layout/fullScreenRoutes';

describe('canvas portrait lock', () => {
  beforeAll(async () => {
    await render(<RootLayout />);
  });

  it('locks every canvas screen to portrait while it is shown', () => {
    expect([...CANVAS_ROUTES].sort()).toEqual(['hotline-class', 'notebook', 'topic-live-class']);
    for (const name of CANVAS_ROUTES) expect(mockStack.screens[name]).toEqual({ orientation: 'portrait' });
  });

  it('leaves every other screen unlocked, so leaving the canvas releases the lock', () => {
    expect(mockStack.screenOptions.orientation).toBeUndefined();
    expect(Object.keys(mockStack.screens).sort()).toEqual([...CANVAS_ROUTES].sort());
  });
});
