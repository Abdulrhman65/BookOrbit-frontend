import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import * as signalR from "@microsoft/signalr";
import { useAuth } from "./AuthContext";
import { API_BASE_URL, tokenStore } from "../utils/constants";
import { chatApi, normalizeChatMessage } from "../services/api";
import { API_V1 } from "../utils/constants";
import toast from "react-hot-toast";

const ChatContext = createContext(null);

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const [connection, setConnection] = useState(null);
  const [activeChatGroupId, setActiveChatGroupId] = useState(null);
  const [groups, setGroups] = useState([]);
  const [messages, setMessages] = useState({});
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [studentImages, setStudentImages] = useState({});

  // Refs — never cause re-renders, safe to use inside closures
  const connectionRef = useRef(null);
  const activeChatGroupIdRef = useRef(null);
  const retryTimerRef = useRef(null);

  // Keep ref in sync with state (no re-render side-effects)
  useEffect(() => {
    activeChatGroupIdRef.current = activeChatGroupId;
  }, [activeChatGroupId]);

  // ── 1. Fetch student image ────────────────────────────────────────────────
  const fetchStudentImage = useCallback(async (studentId) => {
    if (!studentId) return;
    setStudentImages((prev) => {
      if (prev[studentId]) return prev; // already fetched
      return prev;
    });
    try {
      const { accessToken } = tokenStore.get();
      const res = await fetch(`${API_V1}/images/students/${studentId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "ngrok-skip-browser-warning": "69420",
        },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setStudentImages((prev) => {
          if (prev[studentId]) return prev; // double-check
          return { ...prev, [studentId]: url };
        });
      }
    } catch {
      // Fail silently
    }
  }, []);

  // ── 2. Fetch Chat Groups ──────────────────────────────────────────────────
  const fetchGroups = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      setLoadingGroups(true);
      const data = await chatApi.getGroups();
      setGroups(data.items ?? []);
      (data.items ?? []).forEach((group) => {
        if (group.otherStudentId) fetchStudentImage(group.otherStudentId);
      });
    } catch (err) {
      // Fail silently — not critical
    } finally {
      setLoadingGroups(false);
    }
  }, [isLoggedIn, fetchStudentImage]);

  // ── 3. Fetch Messages ─────────────────────────────────────────────────────
  const fetchMessages = useCallback(
    async (chatGroupId) => {
      if (!isLoggedIn) return;
      setLoadingMessages(true);
      try {
        const res = await chatApi.getMessages(chatGroupId);
        const reversed = [...(res.items ?? [])].reverse();
        setMessages((prev) => ({ ...prev, [chatGroupId]: reversed }));
      } catch {
        // Fail silently
      } finally {
        setLoadingMessages(false);
      }
    },
    [isLoggedIn],
  );

  // ── 4. Mark as read ───────────────────────────────────────────────────────
  const markAsRead = useCallback(
    async (chatGroupId) => {
      if (!isLoggedIn) return;
      try {
        await chatApi.markAsRead(chatGroupId);
        setUnreadCounts((prev) => ({ ...prev, [chatGroupId]: 0 }));
      } catch {
        // Fail silently
      }
    },
    [isLoggedIn],
  );

  // ── 5. Send Message ───────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (receiverId, content) => {
      if (!isLoggedIn) return;
      try {
        const res = await chatApi.sendMessage(receiverId, content);
        const newMsg = normalizeChatMessage(res);
        if (newMsg.chatGroupId) {
          setMessages((prev) => {
            const groupMsgs = prev[newMsg.chatGroupId] || [];
            if (groupMsgs.some((m) => m.id === newMsg.id)) return prev;
            return { ...prev, [newMsg.chatGroupId]: [...groupMsgs, newMsg] };
          });
          setGroups((prev) => {
            if (!prev.some((g) => g.chatGroupId === newMsg.chatGroupId)) {
              fetchGroups();
            }
            return prev;
          });
        }
        return newMsg;
      } catch (err) {
        toast.error("فشل إرسال الرسالة");
        throw err;
      }
    },
    [isLoggedIn, fetchGroups],
  );

  // ── 6. SignalR — ONE connection, never recreated unless logged out ─────────
  useEffect(() => {
    if (!isLoggedIn) return;
    if (connectionRef.current) return; // Already connected — do nothing

    let isMounted = true;

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/chat-hub`, {
        // Always fetches the LATEST token — fixes the 401 on reconnect
        accessTokenFactory: () => tokenStore.get().accessToken,
        // WebSocket only — avoids the constant Long Polling (_=timestamp) requests
        transport: signalR.HttpTransportType.WebSockets,
        skipNegotiation: true,
      })
      .withAutomaticReconnect({
        // Stop retrying after ~1 minute of failures (prevents infinite 401 loop)
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.previousRetryCount >= 5) return null; // Give up
          return [0, 3000, 5000, 10000, 15000][retryContext.previousRetryCount];
        },
      })
      .configureLogging(signalR.LogLevel.Error)
      .build();

    newConnection.on("ReceiveMessage", (rawMessage) => {
      const message = normalizeChatMessage(rawMessage);
      setMessages((prev) => {
        const groupMsgs = prev[message.chatGroupId] || [];
        if (groupMsgs.some((m) => m.id === message.id)) return prev;
        return { ...prev, [message.chatGroupId]: [...groupMsgs, message] };
      });
      if (message.chatGroupId !== activeChatGroupIdRef.current) {
        setUnreadCounts((prev) => ({
          ...prev,
          [message.chatGroupId]: (prev[message.chatGroupId] || 0) + 1,
        }));
      }
      // Refresh groups list when a message arrives
      chatApi
        .getGroups()
        .then((data) => {
          if (isMounted) setGroups(data.items ?? []);
        })
        .catch(() => {});
    });

    newConnection.on("MessageRead", (messageId) => {
      setMessages((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((groupId) => {
          updated[groupId] = updated[groupId].map((m) =>
            m.id === messageId ? { ...m, isRead: true } : m,
          );
        });
        return updated;
      });
    });

    const start = async () => {
      if (!isMounted || connectionRef.current) return;
      try {
        await newConnection.start();
        if (!isMounted) {
          newConnection.stop();
          return;
        }
        connectionRef.current = newConnection;
        setConnection(newConnection);
      } catch {
        // If start fails, withAutomaticReconnect handles retries
        // Do NOT call start() again manually — that's what causes the flood
      }
    };

    start();

    return () => {
      isMounted = false;
      clearTimeout(retryTimerRef.current);
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
        setConnection(null);
      }
    };
  }, [isLoggedIn]); // ← ONLY isLoggedIn. Nothing else.

  // ── 7. Fetch groups once on login ─────────────────────────────────────────
  useEffect(() => {
    if (isLoggedIn) fetchGroups();
  }, [isLoggedIn, fetchGroups]);

  const value = {
    connection,
    groups,
    messages,
    loadingGroups,
    loadingMessages,
    unreadCounts,
    fetchGroups,
    fetchMessages,
    sendMessage,
    markAsRead,
    activeChatGroupId,
    setActiveChatGroupId,
    studentImages,
    fetchStudentImage,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatProvider;
