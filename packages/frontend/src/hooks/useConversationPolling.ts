import React, { useEffect } from 'react';
import { Conversation, ChatMessage } from '../types';
import { api } from '../services/api';

/**
 * Polls the currently selected conversation's messages and the conversation
 * list every second, skipping while the tab is hidden or a previous request
 * is still in flight, and only updating state when the fetched data actually
 * differs (via JSON.stringify comparison) to avoid unnecessary re-renders.
 *
 * Extracted from the identical logic previously duplicated in ChatView.tsx
 * and CoachDashboardView.tsx.
 */
export function useConversationPolling(
  selectedConv: Conversation | null,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>
) {
  useEffect(() => {
    if (!selectedConv) return;

    let isFetching = false;
    const interval = setInterval(async () => {
      if (document.hidden || isFetching) return; // Skip if tab is hidden or previous request is still in flight
      isFetching = true;

      try {
        const [latestMsgs, latestConvs] = await Promise.all([
          api.getMessages(selectedConv.id),
          api.getConversations(),
        ]);

        setMessages((prev) => {
          if (JSON.stringify(prev) !== JSON.stringify(latestMsgs)) {
            return latestMsgs;
          }
          return prev;
        });

        setConversations((prev) => {
          if (JSON.stringify(prev) !== JSON.stringify(latestConvs)) {
            return latestConvs;
          }
          return prev;
        });
      } catch (err) {
        // Silently ignore background polling errors
      } finally {
        isFetching = false;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedConv]);
}
