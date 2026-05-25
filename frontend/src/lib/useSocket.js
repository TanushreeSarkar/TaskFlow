import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';

const SOCKET_URL = import.meta.env.PROD 
  ? 'https://taskflow-1-vi32.onrender.com' 
  : (import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');

export function useSocket(projectId, handlers = {}) {
  const socketRef = useRef(null);
  const token = useAuthStore(state => state.token);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!token || !projectId) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join:project', projectId);
    });

    socket.on('task:created', (task) => {
      handlersRef.current.onTaskCreated?.(task);
    });

    socket.on('task:updated', (task) => {
      handlersRef.current.onTaskUpdated?.(task);
    });

    socket.on('task:deleted', (data) => {
      handlersRef.current.onTaskDeleted?.(data);
    });

    socket.on('member:added', (data) => {
      handlersRef.current.onMemberAdded?.(data);
    });

    socket.on('member:removed', (data) => {
      handlersRef.current.onMemberRemoved?.(data);
    });

    socket.on('project:deleted', (data) => {
      handlersRef.current.onProjectDeleted?.(data);
    });

    return () => {
      socket.emit('leave:project', projectId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, projectId]);

  return socketRef;
}
