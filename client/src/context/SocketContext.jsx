import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) {
      if (socket) socket.disconnect();
      setSocket(null);
      return;
    }

    const socketInstance = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user?.id]);

  const joinGroupRoom = (groupId) => {
    if (socket) {
      socket.emit('join_group', groupId);
    }
  };

  const leaveGroupRoom = (groupId) => {
    if (socket) {
      socket.emit('leave_group', groupId);
    }
  };

  const emitExpenseChange = (groupId, action, expense) => {
    if (socket) {
      socket.emit('expense_changed', { groupId, action, expense });
    }
  };

  const emitSettlementChange = (groupId, settlement) => {
    if (socket) {
      socket.emit('settlement_changed', { groupId, settlement });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, joinGroupRoom, leaveGroupRoom, emitExpenseChange, emitSettlementChange }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
