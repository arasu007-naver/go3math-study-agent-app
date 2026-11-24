import type { Client } from 'graphql-ws';

// graphql-ws 연결 복구: 죽은 소켓 감시(pong), 재연결 알림, 4500 오류 재구독, 강제 재연결.

export function retryDelayMs(n: number): number {
  return Math.min(500 * 2 ** n, 3000);
}

type Listener = () => void;

export type WsRecovery = {
  client: Client;
  onReconnected(listener: Listener): () => void;
  forceReconnect(): void;
};

type Options = { pongTimeoutMs?: number; notifyDelayMs?: number; retryDelay?: (attempt: number) => number };

export function attachWsRecovery(
  client: Client,
  { pongTimeoutMs = 5000, notifyDelayMs = 300, retryDelay = retryDelayMs }: Options = {},
): WsRecovery {
  const listeners = new Set<Listener>();
  let pongTimer: ReturnType<typeof setTimeout> | null = null;
  let notifyTimer: ReturnType<typeof setTimeout> | null = null;
  let wasAbnormallyClosed = false;
  let connected = false;

  const clearPong = () => {
    if (pongTimer) clearTimeout(pongTimer);
    pongTimer = null;
  };
  const clearNotify = () => {
    if (notifyTimer) clearTimeout(notifyTimer);
    notifyTimer = null;
  };

  client.on('ping', (received) => {
    if (received !== false || pongTimer) return;
    pongTimer = setTimeout(() => {
      pongTimer = null;
      client.terminate();
    }, pongTimeoutMs);
  });
  client.on('pong', (received) => {
    if (received === true) clearPong();
  });
  client.on('closed', (event) => {
    clearPong();
    clearNotify();
    connected = false;
    const code = (event as { code?: number } | undefined)?.code;
    if (code !== 1000) wasAbnormallyClosed = true;
  });
  client.on('connected', () => {
    connected = true;
    if (!wasAbnormallyClosed) return;
    wasAbnormallyClosed = false;
    clearNotify();
    notifyTimer = setTimeout(() => {
      notifyTimer = null;
      [...listeners].forEach((l) => l());
    }, notifyDelayMs);
  });

  const wrapped: Client = {
    ...client,
    on: client.on.bind(client),
    dispose: client.dispose.bind(client),
    terminate: client.terminate.bind(client),
    iterate: client.iterate.bind(client),
    subscribe: ((payload: any, sink: any) => {
      let attempt = 0;
      let disposed = false;
      let retryTimer: ReturnType<typeof setTimeout> | null = null;
      let unsub: (() => void) | null = null;
      const start = () => {
        unsub = client.subscribe(payload, {
          next: (v: any) => {
            attempt = 0;
            sink.next(v);
          },
          error: (err: any) => {
            if (err && typeof err === 'object' && (err as { code?: unknown }).code === 4500) {
              if (disposed) return;
              const wait = retryDelay(attempt++);
              retryTimer = setTimeout(() => {
                retryTimer = null;
                if (disposed) return;
                unsub?.();
                start();
              }, wait);
              return;
            }
            sink.error(err);
          },
          complete: () => sink.complete(),
        });
      };
      start();
      return () => {
        disposed = true;
        if (retryTimer) clearTimeout(retryTimer);
        retryTimer = null;
        unsub?.();
      };
    }) as Client['subscribe'],
  };

  return {
    client: wrapped,
    onReconnected(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    forceReconnect() {
      if (connected) client.terminate();
    },
  };
}
