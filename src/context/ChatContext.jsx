import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuth } from './AuthContext';
import { API_BASE_URL, tokenStore } from '../utils/constants';
import { chatApi, normalizeChatMessage } from '../services/api';
import { API_V1 } from '../utils/constants';
import toast from 'react-hot-toast';

const ChatContext = createContext(null);

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const { isLoggedIn, user } = useAuth();
  const [connection, setConnection] = useState(null);
  const [activeChatGroupId, setActiveChatGroupId] = useState(null);
  const [groups, setGroups] = useState([]);
  const [messages, setMessages] = useState({}); // { chatGroupId: [messages] }
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});

  const connectionRef = useRef(null);

  const [studentImages, setStudentImages] = useState({});

  const fetchStudentImage = async (studentId) => {
    if (!studentId || studentImages[studentId]) return;
    try {
      const { accessToken } = tokenStore.get();
      const res = await fetch(`${API_V1}/images/students/${studentId}`, {
        headers: { 
          "Authorization": `Bearer ${accessToken}`,
          "ngrok-skip-browser-warning": "69420"
        }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setStudentImages(prev => ({ ...prev, [studentId]: url }));
      }
    } catch (err) {
      // Fail silently
    }
  };

  // 1. Fetch Chat Groups (Inbox)
  const fetchGroups = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      setLoadingGroups(true);
      const data = await chatApi.getGroups();
      setGroups(data.items);
      
      // Fetch images for each student in groups
      data.items.forEach(group => {
        if (group.otherStudentId) fetchStudentImage(group.otherStudentId);
      });
    } catch (err) {
      console.error('Failed to fetch chat groups:', err);
    } finally {
      setLoadingGroups(false);
    }
  }, [isLoggedIn]);

  // 2. Fetch Messages for a group
  const fetchMessages = useCallback(async (chatGroupId) => {
    if (!isLoggedIn) return;
    setLoadingMessages(true);
    try {
      const res = await chatApi.getMessages(chatGroupId);
      // Backend returns newest first, we want oldest first for chat flow usually
      const reversed = [...res.items].reverse();
      setMessages(prev => ({ ...prev, [chatGroupId]: reversed }));
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [isLoggedIn]);

  // 3. Mark as read
  const markAsRead = useCallback(async (chatGroupId) => {
    if (!isLoggedIn) return;
    try {
      await chatApi.markAsRead(chatGroupId);
      setUnreadCounts(prev => ({ ...prev, [chatGroupId]: 0 }));
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  }, [isLoggedIn]);

  // 4. Send Message
  const sendMessage = useCallback(async (receiverId, content) => {
    if (!isLoggedIn) return;
    try {
      const res = await chatApi.sendMessage(receiverId, content);
      // Optimistically or after response? The guide says "optimistically"
      // But let's wait for response to get the real ID and metadata
      // The response is ChatMessageDto
      // Normalize and Update local state
      const newMsg = normalizeChatMessage(res);
      if (newMsg.chatGroupId) {
        setMessages(prev => {
          const groupMsgs = prev[newMsg.chatGroupId] || [];
          if (groupMsgs.some(m => m.id === newMsg.id)) return prev;
          return {
            ...prev,
            [newMsg.chatGroupId]: [...groupMsgs, newMsg]
          };
        });
      }
      
      // Trigger group list update if it's a new conversation
      if (!groups.some(g => g.chatGroupId === newMsg.chatGroupId)) {
        fetchGroups();
      }

      return newMsg;
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('فشل إرسال الرسالة');
      throw err;
    }
  }, [isLoggedIn, groups, fetchGroups]);

  // 5. SignalR Connection
  useEffect(() => {
    if (isLoggedIn && !connectionRef.current) {
      const { accessToken } = tokenStore.get();
      
      const newConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${API_BASE_URL}/chat-hub`, {
          accessTokenFactory: () => accessToken
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.None)
        .build();

      newConnection.on('ReceiveMessage', (rawMessage) => {
        const message = normalizeChatMessage(rawMessage);
        
        // Update messages state
        setMessages(prev => {
          const groupMsgs = prev[message.chatGroupId] || [];
          if (groupMsgs.some(m => m.id === message.id)) return prev; 
          return {
            ...prev,
            [message.chatGroupId]: [...groupMsgs, message]
          };
        });

        // Update unread count if not active chat
        if (message.chatGroupId !== activeChatGroupId) {
          setUnreadCounts(prev => ({
            ...prev,
            [message.chatGroupId]: (prev[message.chatGroupId] || 0) + 1
          }));
        }

        fetchGroups();
      });

      newConnection.on('MessageRead', (messageId) => {
        setMessages(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(groupId => {
            updated[groupId] = updated[groupId].map(m => 
              m.id === messageId ? { ...m, isRead: true } : m
            );
          });
          return updated;
        });
      });

      const start = async () => {
        try {
          await newConnection.start();
          console.log('SignalR Chat Connected!');
          setConnection(newConnection);
          connectionRef.current = newConnection;
        } catch (err) {
          console.error('SignalR Connection Error: ', err);
          setTimeout(start, 5000);
        }
      };

      start();

      return () => {
        if (connectionRef.current) {
          connectionRef.current.stop();
          connectionRef.current = null;
        }
      };
    }
  }, [isLoggedIn, activeChatGroupId, fetchGroups]);

  // Fetch groups on login
  useEffect(() => {
    if (isLoggedIn) {
      fetchGroups();
    }
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
    fetchStudentImage
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatProvider;
