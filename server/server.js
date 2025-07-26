const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const { createServer } = require("http")
const { Server } = require("socket.io")
require("dotenv").config()

const authRoutes = require("./routes/auth")
const userRoutes = require("./routes/users")
const postRoutes = require("./routes/posts")
const chatRoutes = require("./routes/chat")
const { authenticateSocket } = require("./middleware/auth")
const Post = require("./models/Post")
const Comment = require("./models/Comment")
const User = require("./models/User")
const ChatRoom = require("./models/ChatRoom")

const app = express()
const httpServer = createServer(app)

// Socket.io setup
// const io = new Server(httpServer, {
//   cors: {
//     origin: process.env.CLIENT_URL || "http://localhost:3000",
//     methods: ["GET", "POST"],
//   },
// })

const io = new Server(httpServer, {
  cors: {
    origin: [
      process.env.CLIENT_URL || "http://localhost:3000",
      "https://alumni-portal-frontend-vdvb.onrender.com"  // Add your frontend URL here
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: [
    "https://alumni-portal-frontend-vdvb.onrender.com",
    "http://localhost:3000"
  ],
  credentials: true
}))
app.use(express.json())
app.use("/uploads", express.static("uploads"))

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/posts", postRoutes)
app.use("/api/chat", chatRoutes)

// Database connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err))

// Attach io to app for access in routes
app.set('io', io)

// Socket.io connection handling
io.use(authenticateSocket)

io.on("connection", async (socket) => {
  console.log("User connected:", socket.userId)
  socket.join(socket.userId)

  // Update user's online status
  try {
    await User.findByIdAndUpdate(socket.userId, {
      isOnline: true,
      lastSeen: new Date(),
      socketId: socket.id,
    })

    // Notify other users that this user is online
    socket.broadcast.emit("userOnline", socket.userId)
  } catch (error) {
    console.error("Error updating user online status:", error)
  }

  socket.on("joinRoom", async (roomId) => {
    try {
      socket.join(roomId)
      console.log(`User ${socket.userId} joined room ${roomId}`)

      // Mark messages as delivered when user joins room
      const Message = require("./models/Message")
      const room = await ChatRoom.findById(roomId)
      
      if (room && room.members.includes(socket.userId)) {
        // Mark unread messages as delivered
        const unreadMessages = await Message.find({
          roomId,
          sender: { $ne: socket.userId },
          "deliveredTo.user": { $ne: socket.userId },
        })

        for (const message of unreadMessages) {
          message.deliveredTo.push({
            user: socket.userId,
            deliveredAt: new Date(),
          })
          message.status = "delivered"
          await message.save()
        }

        // Emit delivery receipts
        if (unreadMessages.length > 0) {
          socket.emit("messagesDelivered", {
            roomId,
            messageIds: unreadMessages.map(m => m._id),
          })
        }

        // Reset unread count for this user
        room.unreadCounts.set(socket.userId.toString(), 0)
        await room.save()
      }
    } catch (error) {
      console.error("Error joining room:", error)
    }
  })

  socket.on("leaveRoom", (roomId) => {
    socket.leave(roomId)
    console.log(`User ${socket.userId} left room ${roomId}`)
  })

  // socket.on("sendMessage", async (data) => {
  //   try {
  //     const { roomId, text, mediaUrl } = data
  //     const Message = require("./models/Message")

  //     const message = await Message.create({
  //       roomId,
  //       sender: socket.userId,
  //       text,
  //       mediaUrl,
  //       messageType: mediaUrl ? (mediaUrl.match(/\.(jpeg|jpg|gif|png)$/) ? "image" : "video") : "text",
  //       status: "sent",
  //     })

  //     await message.populate("sender", "name avatarUrl")

  //     // Update room's last message and unread counts
  //     const room = await ChatRoom.findById(roomId)
  //     if (room) {
  //       room.lastMessage = message._id
  //       room.updatedAt = new Date()
        
  //       // Increment unread count for all members except sender
  //       room.members.forEach(memberId => {
  //         if (memberId.toString() !== socket.userId) {
  //           const currentCount = room.unreadCounts.get(memberId.toString()) || 0
  //           room.unreadCounts.set(memberId.toString(), currentCount + 1)
  //         }
  //       })
        
  //       await room.save()

  //       // Emit new message and room update to all members via their personal rooms
  //       const updatedRoom = await ChatRoom.findById(roomId)
  //         .populate("members", "name avatarUrl isOnline lastSeen")
  //         .populate({
  //           path: "lastMessage",
  //           populate: {
  //             path: "sender",
  //             select: "name",
  //           },
  //         })

  //       room.members.forEach(memberId => {
  //         io.to(memberId.toString()).emit("newMessage", message)
  //         io.to(memberId.toString()).emit("roomUpdated", updatedRoom)
  //       })
  //     }
  //   } catch (error) {
  //     console.error("Send message error:", error)
  //     socket.emit("error", { message: "Failed to send message" })
  //   }
  // })


//  socket.on("sendMessage", async (data) => {
//     try {
//       const { roomId, encryptedContent } = data; // Receive encrypted content
//       const Message = require("./models/Message");

//       // --- THE FIX IS HERE ---
//       // Save the encryptedContent into the 'text' field of the database.
//       const message = await Message.create({
//         roomId,
//         sender: socket.userId,
//         text: encryptedContent, // This was missing before
//         messageType: "text",
//         status: "sent",
//       });

//       // The rest of the logic remains the same.
//       await message.populate("sender", "name avatarUrl");

//       const room = await ChatRoom.findById(roomId);
//       if (room) {
//         room.lastMessage = message._id;
//         room.updatedAt = new Date();
        
//         room.members.forEach(memberId => {
//           if (memberId.toString() !== socket.userId) {
//             const currentCount = room.unreadCounts.get(memberId.toString()) || 0;
//             room.unreadCounts.set(memberId.toString(), currentCount + 1);
//           }
//         });
        
//         await room.save();

//         const updatedRoom = await ChatRoom.findById(roomId)
//           .populate("members", "name avatarUrl isOnline lastSeen")
//           .populate({
//             path: "lastMessage",
//             populate: { path: "sender", select: "name" },
//           });
        
//         const messagePayload = {
//             ...message.toObject(),
//             encryptedContent: message.text,
//             text: undefined 
//         };

//         room.members.forEach(memberId => {
//           io.to(memberId.toString()).emit("newMessage", messagePayload);
//           io.to(memberId.toString()).emit("roomUpdated", updatedRoom);
//         });
//       }
//     } catch (error) {
//       console.error("Send message error:", error);
//       socket.emit("error", { message: "Failed to send message" });
//     }
//   });

socket.on("sendMessage", async (data) => {
  try {
    // Add tempId to the destructuring
    const { roomId, encryptedContent, tempId } = data; 
    const Message = require("./models/Message");

    const message = await Message.create({
      roomId,
      sender: socket.userId,
      text: encryptedContent,
      messageType: "text",
      status: "sent",
    });

    await message.populate("sender", "name avatarUrl");

    const room = await ChatRoom.findById(roomId);
    if (room) {
      room.lastMessage = message._id;
      room.updatedAt = new Date();
      
      room.members.forEach(memberId => {
        if (memberId.toString() !== socket.userId) {
          const currentCount = room.unreadCounts.get(memberId.toString()) || 0;
          room.unreadCounts.set(memberId.toString(), currentCount + 1);
        }
      });
      
      await room.save();

      const updatedRoom = await ChatRoom.findById(roomId)
        .populate("members", "name avatarUrl isOnline lastSeen")
        .populate({
          path: "lastMessage",
          populate: { path: "sender", select: "name" },
        });
      
      const messagePayload = {
          ...message.toObject(),
          encryptedContent: message.text,
          text: undefined,
          tempId: tempId // Include the tempId in the broadcast
      };

      // THE FIX: Emit to the room ID so active listeners get the message immediately.
      // Also continue to emit to each member for notifications.
      io.to(roomId).emit("newMessage", messagePayload);
      room.members.forEach(memberId => {
        if (memberId.toString() !== socket.userId) { // Don't send a separate roomUpdated to the sender
          io.to(memberId.toString()).emit("roomUpdated", updatedRoom);
        }
      });
    }
  } catch (error) {
    console.error("Send message error:", error);
    socket.emit("error", { message: "Failed to send message" });
  }
});

  socket.on("markAsRead", async (data) => {
    try {
      const { roomId, messageIds } = data
      const Message = require("./models/Message")

      // Mark messages as read
      await Message.updateMany(
        {
          _id: { $in: messageIds },
          roomId,
          sender: { $ne: socket.userId },
          "readBy.user": { $ne: socket.userId },
        },
        {
          $push: {
            readBy: {
              user: socket.userId,
              readAt: new Date(),
            },
          },
          $set: { status: "read" },
        }
      )

      // Update room's unread count
      const room = await ChatRoom.findById(roomId)
      if (room) {
        room.unreadCounts.set(socket.userId.toString(), 0)
        await room.save()
      }

      // For group chats, check if all members have read the message
      const messages = await Message.find({ _id: { $in: messageIds } }).populate("readBy.user")
      const chatRoom = await ChatRoom.findById(roomId)

      for (const message of messages) {
        const otherMembers = chatRoom.members.filter(
          (memberId) => memberId.toString() !== message.sender.toString()
        )
        const haveAllRead = otherMembers.every((memberId) =>
          message.readBy.some((reader) => reader.user._id.toString() === memberId.toString())
        )

        if (haveAllRead) {
          message.status = "read"
          await message.save()
        }
      }

      // Emit read receipts to message senders
      messages.forEach(message => {
        if (message.sender.toString() !== socket.userId) {
          io.to(message.sender.toString()).emit("messageRead", {
            messageId: message._id,
            roomId,
            readBy: socket.userId,
            readAt: new Date(),
          })
        }
      })

      // Emit room update to all members
      const updatedRoom = await ChatRoom.findById(roomId)
        .populate("members", "name avatarUrl isOnline lastSeen")
        .populate({
          path: "lastMessage",
          populate: {
            path: "sender",
            select: "name",
          },
        })

      if (updatedRoom) {
        updatedRoom.members.forEach(member => {
          io.to(member._id.toString()).emit("roomUpdated", updatedRoom)
        })
      }
    } catch (error) {
      console.error("Mark as read error:", error)
    }
  })

  socket.on("typingStart", async (roomId) => {
    try {
      const room = await ChatRoom.findById(roomId)
      if (room && room.members.includes(socket.userId)) {
        // Add user to typing list
        const existingTyping = room.typingUsers.find(
          t => t.user.toString() === socket.userId
        )
        
        if (!existingTyping) {
          room.typingUsers.push({
            user: socket.userId,
            startedAt: new Date(),
          })
          await room.save()
        }

        // Emit to other users in the room
        socket.to(roomId).emit("userTyping", {
          roomId,
          userId: socket.userId,
          isTyping: true,
        })
      }
    } catch (error) {
      console.error("Typing start error:", error)
    }
  })

  // socket.on("typingStop", async (roomId) => {
  //   try {
  //     const room = await ChatRoom.findById(roomId)
  //     if (room) {
  //       // Remove user from typing list
  //       room.typingUsers = room.typingUsers.filter(
  //         t => t.user.toString() !== socket.userId
  //       )
  //       await room.save()

  //       // Emit to other users in the room
  //       socket.to(roomId).emit("userTyping", {
  //         roomId,
  //         userId: socket.userId,
  //         isTyping: false,
  //       })
  //     }
  //   } catch (error) {
  //     console.error("Typing stop error:", error)
  //   }
  // })



  // In server/server.js

socket.on("typingStop", async (roomId) => {
  try {
    // THE FIX: Use an atomic update to prevent VersionError
    await ChatRoom.findByIdAndUpdate(roomId, {
      $pull: { typingUsers: { user: socket.userId } }
    });

    // Emit to other users in the room
    socket.to(roomId).emit("userTyping", {
      roomId,
      userId: socket.userId,
      isTyping: false,
    });
  } catch (error) {
    // The VersionError will no longer occur, but keep the catch block
    console.error("Typing stop error:", error);
  }
});


  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.userId)
    
    try {
      // Update user's offline status
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date(),
        socketId: null,
      })

      // Remove user from all typing lists
      const rooms = await ChatRoom.find({
        members: socket.userId,
        "typingUsers.user": socket.userId,
      })

      for (const room of rooms) {
        room.typingUsers = room.typingUsers.filter(
          t => t.user.toString() !== socket.userId
        )
        await room.save()

        // Notify other users that typing stopped
        io.to(room._id.toString()).emit("userTyping", {
          roomId: room._id,
          userId: socket.userId,
          isTyping: false,
        })
      }

      // Notify other users that this user is offline
      socket.broadcast.emit("userOffline", socket.userId)
    } catch (error) {
      console.error("Error handling disconnect:", error)
    }
  })

  socket.on("getOnlineUsers", async (callback) => {
    try {
      const onlineUsers = await User.find({ isOnline: true }).select("_id")
      const onlineUserIds = onlineUsers.map(user => user._id.toString())
      callback(onlineUserIds)
    } catch (error) {
      console.error("Error getting online users:", error)
      callback([])
    }
  })

  // Post and comment like events
  socket.on("joinPost", (postId) => {
    socket.join(`post:${postId}`)
    console.log(`User ${socket.userId} joined post ${postId}`)
  })

  socket.on("leavePost", (postId) => {
    socket.leave(`post:${postId}`)
    console.log(`User ${socket.userId} left post ${postId}`)
  })

  socket.on("postLiked", async (data) => {
    const { postId } = data
    try {
      const post = await Post.findById(postId)
      const likedUserIds = post.likes.map(id => id.toString())
      const likesCount = post.likes.length
      io.to(`post:${postId}`).emit("postLikeUpdate", { postId, likesCount, likedUserIds })
    } catch (err) {
      console.error("Error in postLiked socket event:", err)
    }
  })

  socket.on("commentLiked", async (data) => {
    const { commentId, postId } = data
    try {
      const comment = await Comment.findById(commentId)
      const likedUserIds = comment.likes.map(id => id.toString())
      const likesCount = comment.likes.length
      io.to(`post:${postId}`).emit("commentLikeUpdate", { commentId, likesCount, likedUserIds })
    } catch (err) {
      console.error("Error in commentLiked socket event:", err)
    }
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: "Something went wrong!" })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" })
})

const PORT = process.env.PORT || 5000
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})


// can you add functionality in which if a user forgot its password , user can reset the password using email via sending a otp.
// also remove login and signup funtionality using phone