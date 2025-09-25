import { supabase } from './client';

/**
 * Creates a unique channel with proper cleanup of existing channels with the same prefix
 */
export const createUniqueChannel = (prefix: string) => {
  // Remove any existing channels with the same prefix
  supabase.getChannels().forEach((ch) => {
    const channelTopic = (ch as any).topic;
    if (channelTopic && channelTopic.startsWith(prefix)) {
      console.debug(`[Realtime] Removing existing channel: ${channelTopic}`);
      supabase.removeChannel(ch);
    }
  });

  // Create a truly unique channel name
  const uniqueChannelName = `${prefix}-${crypto.randomUUID()}`;
  console.debug(`[Realtime] Creating new channel: ${uniqueChannelName}`);
  
  return supabase.channel(uniqueChannelName);
};