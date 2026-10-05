function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    // Join a group room
    socket.on('join_group', (groupId) => {
      socket.join(`group:${groupId}`);
    });

    // Leave a group room
    socket.on('leave_group', (groupId) => {
      socket.leave(`group:${groupId}`);
    });

    // Broadcast expense added/updated/deleted
    socket.on('expense_changed', ({ groupId, action, expense }) => {
      io.to(`group:${groupId}`).emit('group_updated', {
        type: 'expense',
        action,
        expense,
        timestamp: new Date()
      });
    });

    // Broadcast settlement created
    socket.on('settlement_changed', ({ groupId, settlement }) => {
      io.to(`group:${groupId}`).emit('group_updated', {
        type: 'settlement',
        action: 'created',
        settlement,
        timestamp: new Date()
      });
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });
}

module.exports = { setupSocketHandlers };
