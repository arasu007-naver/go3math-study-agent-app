/**
 * 인증 관련 상태 (기존 src/ctx/auth에서 이전, reducer는 원본 그대로)
 * - 로그인/로그아웃 상태, 토큰, 사용자 정보
 */
import { createStore } from './createStore';

export type AuthState = {
    isLoading: boolean;
    isSignedout: boolean;
    appToken: string | null | undefined;
    isAuthenticated: boolean;
    name: string | null | undefined;
    email: string | null | undefined;
    imageUrl: string | null | undefined;
};

export type AuthAction =
    | { type: 'RESTORE_TOKEN'; item: { token: string } }
    | { type: 'SIGN_IN'; item: { token: string; name: string; email: string; imageUrl?: string } }
    | { type: 'MY_INFO'; item: { name: string; email: string; imageUrl?: string } }
    | { type: 'SIGN_OUT' };

export const defaultAuthState: AuthState = {
    isLoading: true,
    isSignedout: true,
    isAuthenticated: false,
    appToken: null,
    name: null,
    email: null,
    imageUrl: null,
};

export const authReducer = (prevState: AuthState, action: AuthAction): AuthState => {
    switch (action.type) {
        case 'RESTORE_TOKEN':
            return {
                ...prevState,
                isSignedout: false,
                appToken: action.item.token,
                isAuthenticated: true,
                isLoading: false,
            };
        case 'SIGN_IN':
            return {
                ...prevState,
                isSignedout: false,
                appToken: action.item.token,
                isAuthenticated: true,
                name: action.item.name,
                email: action.item.email,
                imageUrl: action.item.imageUrl,
                isLoading: false,
            };
        case 'MY_INFO':
            return {
                ...prevState,
                isSignedout: false,
                name: action.item.name,
                email: action.item.email,
                imageUrl: action.item.imageUrl,
            };
        case 'SIGN_OUT':
            return {
                ...prevState,
                isSignedout: true,
                appToken: null,
                isAuthenticated: false,
                isLoading: false,
            };
        default:
            return prevState;
    }
};

export const authStore = createStore(authReducer, defaultAuthState);
