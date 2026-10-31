/**
 * Apollo Client 설정 — 기존 `src/libs/apollo/client.ts`에서 이전.
 * 변경점: 토큰을 생성 시점 값이 아니라 getToken()으로 요청마다 읽는다(로그인/토큰 갱신 시 클라이언트 재생성 불필요).
 * 재연결 정책(3회, retries × 2분)은 기존 실황 수업 동작 그대로 유지한다(M9에서 재검토, 명세서 §5.6).
 */
import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client';
import { CombinedGraphQLErrors, CombinedProtocolErrors } from '@apollo/client/errors';
import { SetContextLink } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { GRAPHQL_API_URL, SUBSCRIPTION_ENDPOINT } from '../../config/api.constants';

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
    keepAlive: 30000,
    // 기존 코드는 shouldRetry(retries)로 횟수를 제한하려 했으나 shouldRetry는 오류 이벤트를 받으므로 제한이 동작하지 않았다.
    retryAttempts: 3,
    retryWait: async (retries: number) => {
      await new Promise((resolve) => setTimeout(resolve, retries * 2 * 60 * 1000));
    },
  });

  const wsLink = new GraphQLWsLink(subscriptionsClient);

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
