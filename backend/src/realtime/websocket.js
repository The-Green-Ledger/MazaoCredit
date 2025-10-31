const socketIO = require('socket.io');

class WebSocketService {
  constructor() {
    this.io = null;
    this.connections = new Map();
  }

  initialize(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Join user to their room
      socket.on('join_user', (userId) => {
        socket.join(`user_${userId}`);
        this.connections.set(userId, socket.id);
        console.log(`User ${userId} joined room user_${userId}`);
      });

      // Join product room for updates
      socket.on('join_product', (productId) => {
        socket.join(`product_${productId}`);
        console.log(`Socket ${socket.id} joined product room: ${productId}`);
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Remove from connections
        for (let [userId, socketId] of this.connections.entries()) {
          if (socketId === socket.id) {
            this.connections.delete(userId);
            break;
          }
        }
      });
    });

    console.log('✅ WebSocket service initialized');
    return this.io;
  }

  notifyUser(userId, event, data) {
    this.io.to(`user_${userId}`).emit(event, data);
  }

  notifyProductUpdate(productId, data) {
    this.io.to(`product_${productId}`).emit('product_updated', data);
  }

  sendPriceAlert(userId, product) {
    this.notifyUser(userId, 'price_alert', {
      productId: product.id,
      productName: product.name,
      oldPrice: product.original_price,
      newPrice: product.price,
      message: `Price dropped for ${product.name}!`
    });
  }
}

module.exports = new WebSocketService();