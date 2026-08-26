import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';
import { REALTIME_EVENTS, type BusinessChange } from './realtime-events';

export type RealtimeConnectionStatus = 'disabled' | 'connecting' | 'connected' | 'reconnecting' | 'error' | 'disconnected';

type RealtimeOptions = {
  token: string;
  companyId: string;
  branchId?: string;
  onStatus: (status: RealtimeConnectionStatus) => void;
  onEvent: (event: string, change: BusinessChange) => void;
};

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export function isRealtimeConfigured() {
  return Boolean(url && key);
}

export function createRealtimeSubscription(options: RealtimeOptions) {
  if (!url || !key) {
    options.onStatus('disabled');
    return () => undefined;
  }

  const client: SupabaseClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const channels: RealtimeChannel[] = [];
  let closed = false;
  const topics = new Set([`company:${options.companyId}:dashboard`]);
  if (options.branchId) topics.add(`branch:${options.branchId}:dashboard`);

  options.onStatus('connecting');
  const connect = async () => {
    try {
      await client.realtime.setAuth(options.token);
      if (closed) return;
      for (const topic of topics) {
        const channel = client.channel(topic, { config: { private: true } });
        for (const event of REALTIME_EVENTS) {
          channel.on('broadcast', { event }, (message) => {
            const payload = message.payload as Partial<BusinessChange>;
            if (payload.company_id !== options.companyId) return;
            if (payload.branch_id && options.branchId && payload.branch_id !== options.branchId) return;
            if (!payload.company_id || !payload.occurred_at) return;
            options.onEvent(event, payload as BusinessChange);
          });
        }
        channel.subscribe((status) => {
          if (closed) return;
          if (status === 'SUBSCRIBED') options.onStatus('connected');
          else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') options.onStatus('error');
          else if (status === 'CLOSED') options.onStatus('disconnected');
          else if (status === 'RECONNECTING') options.onStatus('reconnecting');
        });
        channels.push(channel);
      }
    } catch {
      if (!closed) options.onStatus('error');
    }
  };
  void connect();

  const onOnline = () => {
    if (!closed) {
      options.onStatus('reconnecting');
      void client.realtime.setAuth(options.token);
    }
  };
  const onOffline = () => !closed && options.onStatus('disconnected');
  const onVisibility = () => {
    if (!closed && document.visibilityState === 'visible') {
      void client.realtime.setAuth(options.token);
    }
  };
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    if (closed) return;
    closed = true;
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
    document.removeEventListener('visibilitychange', onVisibility);
    for (const channel of channels) void client.removeChannel(channel);
    void client.removeAllChannels().finally(() => client.realtime.disconnect());
    options.onStatus('disconnected');
  };
}
