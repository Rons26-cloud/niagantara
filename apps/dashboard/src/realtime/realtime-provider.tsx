import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  createRealtimeSubscription,
  type RealtimeConnectionStatus,
} from './realtime-client';
import {
  resourcesForEvent,
  type BusinessChange,
  type InvalidationResource,
} from './realtime-events';

type RealtimeContextValue = {
  status: RealtimeConnectionStatus;
  lastEventAt: string | null;
  revision: number;
  invalidated: (resource: InvalidationResource) => boolean;
};

const RealtimeContext = createContext<RealtimeContextValue>({
  status: 'disabled',
  lastEventAt: null,
  revision: 0,
  invalidated: () => false,
});

export function RealtimeProvider({
  token,
  companyId,
  branchId,
  children,
}: {
  token: string;
  companyId: string;
  branchId?: string;
  children: ReactNode;
}) {
  const [status, setStatus] = useState<RealtimeConnectionStatus>('disabled');
  const [lastEventAt, setLastEventAt] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [resources, setResources] = useState<Set<InvalidationResource>>(
    new Set(),
  );
  const clearTimer = useRef<number | null>(null);
  const dispatchTimer = useRef<number | null>(null);
  const pendingResources = useRef<Set<InvalidationResource>>(new Set());
  const lastChangeKey = useRef('');

  useEffect(() => {
    const cleanup = createRealtimeSubscription({
      token,
      companyId,
      branchId,
      onStatus: setStatus,
      onEvent: (event: string, change: BusinessChange) => {
        const changeKey = `${event}:${change.id ?? ''}:${change.occurred_at}`;
        if (lastChangeKey.current === changeKey) return;
        lastChangeKey.current = changeKey;
        const eventResources = resourcesForEvent(event);
        setLastEventAt(change.occurred_at);
        setRevision((current) => current + 1);
        setResources((current) => new Set([...current, ...eventResources]));
        for (const resource of eventResources)
          pendingResources.current.add(resource);
        if (dispatchTimer.current) window.clearTimeout(dispatchTimer.current);
        dispatchTimer.current = window.setTimeout(() => {
          const batchedResources = [...pendingResources.current];
          pendingResources.current.clear();
          window.dispatchEvent(
            new CustomEvent('niagantara:realtime', {
              detail: { event, change, resources: batchedResources },
            }),
          );
        }, 350);
        if (clearTimer.current) window.clearTimeout(clearTimer.current);
        clearTimer.current = window.setTimeout(
          () => setResources(new Set()),
          1200,
        );
      },
    });
    return () => {
      cleanup();
      if (clearTimer.current) window.clearTimeout(clearTimer.current);
      if (dispatchTimer.current) window.clearTimeout(dispatchTimer.current);
      pendingResources.current.clear();
      setResources(new Set());
    };
  }, [token, companyId, branchId]);

  const value = useMemo(
    () => ({
      status,
      lastEventAt,
      revision,
      invalidated: (resource: InvalidationResource) => resources.has(resource),
    }),
    [status, lastEventAt, revision, resources],
  );
  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  return useContext(RealtimeContext);
}
