/**
 * Apollo Client 설정 — 기존 `src/libs/apollo/client.ts`에서 이전.
 * 변경점: 토큰을 생성 시점 값이 아니라 getToken()으로 요청마다 읽는다(로그인/토큰 갱신 시 클라이언트 재생성 불필요).
 * 재연결 정책: 무한 재시도(0.5·1·2·3초 상한 + 0~500ms 지터), keepAlive 10초, pong 감시·4500 재구독·앱 복귀 시 강제 재연결은 wsRecovery.ts.
 */
import { AppState } from 'react-native';
import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client';
import { CombinedGraphQLErrors, CombinedProtocolErrors } from '@apollo/client/errors';
import { SetContextLink } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { GRAPHQL_API_URL, SUBSCRIPTION_ENDPOINT } from '../../config/api.constants';
import { attachWsRecovery, retryDelayMs } from './wsRecovery';

const pendingListeners = new Set<() => void>();

// 웹소켓이 끊겼다 다시 연결됐을 때 알림을 받는다(클라이언트가 나중에 만들어져도 등록된다)
export function onWsReconnected(listener: () => void): () => void {
  pendingListeners.add(listener);
  return () => {
    pendingListeners.delete(listener);
  };
}

export type DevType = 'PHONE' | 'TABLET';

function createIsomorphLink(getToken: () => string | null | undefined, devType: () => DevType) {
  const authLink = new SetContextLink((prevContext) => {
    const token = getToken();
    return { headers: { ...prevContext.headers, authorization: token ? `Bearer ${token}` : '' } };
  });

  const timestamp = new Date().getTime();
  const httpLink = new HttpLink({ uri: GRAPHQL_API_URL });

  const subscriptionsClient = createClient({
    url: SUBSCRIPTION_ENDPOINT,
    connectionParams: () => ({ authToken: `${getToken() ?? ''}` }),
    keepAlive: 10000,
    retryAttempts: Infinity,
    shouldRetry: () => true,
    retryWait: async (retries: number) => {
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs(retries) + Math.random() * 500));
    },
  });
  const recovery = attachWsRecovery(subscriptionsClient);
  recovery.onReconnected(() => [...pendingListeners].forEach((l) => l()));

  // 앱이 5초 이상 background였다가 돌아오면 죽은 소켓을 바로 끊어 재연결한다
  let backgroundAt: number | null = null;
  AppState.addEventListener('change', (state) => {
    if (state === 'background') backgroundAt = Date.now();
    else if (state === 'active') {
      if (backgroundAt !== null && Date.now() - backgroundAt >= 5000) recovery.forceReconnect();
      backgroundAt = null;
    }
  });

  const wsLink = new GraphQLWsLink(recovery.client);

  return ApolloLink.split(
    (operation) => {
      operation.setContext({ params: { authorization: 'Bearer ' + getToken(), timestamp, devType: devType() } });
      const definition = getMainDefinition(operation.query);
      return (
        definition.kind === 'OperationDefinition' &&
        (definition.operation === 'query' || definition.operation === 'mutation')
      );
    },
    ApolloLink.from([authLink, httpLink]),
    wsLink,
  );
}

function createErrorLink() {
  return new ErrorLink(({ error }) => {
    if (CombinedGraphQLErrors.is(error)) {
      error.errors.forEach(({ message, locations, path }) =>
        console.log(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`),
      );
    } else if (CombinedProtocolErrors.is(error)) {
      error.errors.forEach(({ message, extensions }) =>
        console.log(`[Protocol error]: Message: ${message}, Extensions: ${JSON.stringify(extensions)}`),
      );
    } else {
      console.error(`[Network error]: ${error}`);
    }
  });
}

export function createApolloClient(getToken: () => string | null | undefined, devType: () => DevType = () => 'PHONE') {
  return new ApolloClient({
    link: ApolloLink.from([createErrorLink(), createIsomorphLink(getToken, devType)]),
    cache: new InMemoryCache(),
  });
}
