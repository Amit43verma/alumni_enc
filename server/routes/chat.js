const express = require("express")
const ChatRoom = require("../models/ChatRoom")
const Message = require("../models/Message")
const User = require("../models/User")
const { authenticate } = require("../middleware/auth")
const upload = require("../middleware/upload")

const router = express.Router()

// Get user's chat rooms
router.get("/rooms", authenticate, async (req, res) => {
  try {
    const rooms = await ChatRoom.find({
      members: req.user._id,
    })
      .populate("members", "name avatarUrl isOnline lastSeen")
      .populate("lastMessage")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "name",
        },
      })
      .sort({ updatedAt: -1 })

    // Add unread counts to each room
    const roomsWithUnreadCounts = rooms.map(room => {
      const unreadCount = room.unreadCounts.get(req.user._id.toString()) || 0
      return {
        ...room.toObject(),
        unreadCount,
      }
    })

    res.json({ rooms: roomsWithUnreadCounts })
  } catch (error) {
    console.error("Get rooms error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Create chat room (direct or group)
router.post("/rooms", authenticate, async (req, res) => {
  try {
    const { name, memberIds, isGroup = false } = req.body

    if (!memberIds || memberIds.length === 0) {
      return res.status(400).json({ message: "At least one member is required" })
    }

    // Add current user to members
    const allMembers = [...new Set([req.user._id.toString(), ...memberIds])]

    // For direct chats, check if room already exists
    if (!isGroup && allMembers.length === 2) {
      const existingRoom = await ChatRoom.findOne({
        isGroup: false,
        members: { $all: allMembers, $size: 2 },
      })

      if (existingRoom) {
        await existingRoom.populate("members", "name avatarUrl isOnline lastSeen")
        const unreadCount = existingRoom.unreadCounts.get(req.user._id.toString()) || 0
        return res.json({ 
          room: {
            ...existingRoom.toObject(),
            unreadCount,
          }
        })
      }
    }

    const room = new ChatRoom({
      name: name || (isGroup ? "Group Chat" : "Direct Chat"),
      members: allMembers,
      isGroup,
      admins: isGroup ? [req.user._id] : [],
    })

    await room.save()
    await room.populate("members", "name avatarUrl isOnline lastSeen")

    res.status(201).json({ room })
  } catch (error) {
    console.error("Create room error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get messages for a room
router.get("/rooms/:roomId/messages", authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query
    const { roomId } = req.params

    // Check if user is member of the room
    const room = await ChatRoom.findOne({
      _id: roomId,
      members: req.user._id,
    })

    if (!room) {
      return res.status(403).json({ message: "Access denied" })
    }

    const messages = await Message.find({ roomId })
      .populate("sender", "name avatarUrl")
      .populate("readBy.user", "name")
      .populate("deliveredTo.user", "name")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    // Mark messages as read when user loads them
    const unreadMessageIds = messages
      .filter(msg => 
        msg.sender._id.toString() !== req.user._id.toString() &&
        !msg.readBy.some(read => read.user._id.toString() === req.user._id.toString())
      )
      .map(msg => msg._id)

    if (unreadMessageIds.length > 0) {
      await Message.updateMany(
        { _id: { $in: unreadMessageIds } },
        {
          $push: {
            readBy: {
              user: req.user._id,
              readAt: new Date(),
            },
          },
          $set: { status: "read" },
        }
      )

      // Reset unread count for this room
      room.unreadCounts.set(req.user._id.toString(), 0)
      await room.save()

      // Emit read receipts via socket
      const io = req.app.get('io')
      if (io) {
        const updatedMessages = await Message.find({ _id: { $in: unreadMessageIds } })
        updatedMessages.forEach(message => {
          if (message.sender.toString() !== req.user._id.toString()) {
            io.to(message.sender.toString()).emit("messageRead", {
              messageId: message._id,
              roomId,
              readBy: req.user._id,
              readAt: new Date(),
            })
          }
        })
        
        // Also emit a room update so the sender's ChatList UI updates
        const updatedRoom = await ChatRoom.findById(roomId)
          .populate("members", "name avatarUrl isOnline lastSeen")
          .populate("lastMessage")
        
        if (updatedRoom) {
            updatedRoom.members.forEach(member => {
                io.to(member._id.toString()).emit("roomUpdated", updatedRoom);
            });
        }
      }
    }

    res.json({ messages: messages.reverse() })
  } catch (error) {
    console.error("Get messages error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Mark messages as read
router.post("/rooms/:roomId/read", authenticate, async (req, res) => {
  try {
    const { roomId } = req.params
    const { messageIds } = req.body

    // Check if user is member of the room
    const room = await ChatRoom.findOne({
      _id: roomId,
      members: req.user._id,
    })

    if (!room) {
      return res.status(403).json({ message: "Access denied" })
    }

    if (messageIds && messageIds.length > 0) {
      await Message.updateMany(
        {
          _id: { $in: messageIds },
          roomId,
          sender: { $ne: req.user._id },
          "readBy.user": { $ne: req.user._id },
        },
        {
          $push: {
            readBy: {
              user: req.user._id,
              readAt: new Date(),
            },
          },
          $set: { status: "read" },
        }
      )

      // Reset unread count for this room
      room.unreadCounts.set(req.user._id.toString(), 0)
      await room.save()

      // Emit read receipts via socket
      const io = req.app.get('io')
      if (io) {
        const messages = await Message.find({ _id: { $in: messageIds } })
        messages.forEach(message => {
          if (message.sender.toString() !== req.user._id.toString()) {
            io.to(message.sender.toString()).emit("messageRead", {
              messageId: message._id,
              roomId,
              readBy: req.user._id,
              readAt: new Date(),
            })
          }
        })
      }
    }

    res.json({ success: true })
  } catch (error) {
    console.error("Mark as read error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Send message with media
router.post("/rooms/:roomId/messages", authenticate, upload.single("media"), async (req, res) => {
  try {
    const { roomId } = req.params
    const { text } = req.body

    // Check if user is member of the room
    const room = await ChatRoom.findOne({
      _id: roomId,
      members: req.user._id,
    })

    if (!room) {
      return res.status(403).json({ message: "Access denied" })
    }

    if (!text && !req.file) {
      return res.status(400).json({ message: "Message text or media is required" })
    }

    const messageData = {
      roomId,
      sender: req.user._id,
      text: text || "",
      status: "sent",
    }

    if (req.file) {
      messageData.mediaUrl = req.file.path // Cloudinary URL
      messageData.messageType = req.file.mimetype.startsWith("image/") ? "image" : "video"
    }

    const message = new Message(messageData)
    await message.save()
    await message.populate("sender", "name avatarUrl")

    // Update room's last message and unread counts
    room.lastMessage = message._id
    room.updatedAt = new Date()
    
    // Increment unread count for all members except sender
    room.members.forEach(memberId => {
      if (memberId.toString() !== req.user._id.toString()) {
        const currentCount = room.unreadCounts.get(memberId.toString()) || 0
        room.unreadCounts.set(memberId.toString(), currentCount + 1)
      }
    })
    
    await room.save()

    // Emit via socket to all members' personal rooms
    const io = req.app.get('io')
    if (io) {
      // Emit room update
      const updatedRoom = await ChatRoom.findById(roomId)
        .populate("members", "name avatarUrl isOnline lastSeen")
        .populate({
          path: "lastMessage",
          populate: {
            path: "sender",
            select: "name",
          },
        })

      room.members.forEach(memberId => {
        io.to(memberId.toString()).emit("newMessage", message)
        io.to(memberId.toString()).emit("roomUpdated", updatedRoom)
      })
    }

    res.status(201).json({ message })
  } catch (error) {
    console.error("Send message error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Add members to group
router.post("/rooms/:roomId/members", authenticate, async (req, res) => {
  try {
    const { roomId } = req.params
    const { memberIds } = req.body

    const room = await ChatRoom.findById(roomId)

    if (!room || !room.isGroup) {
      return res.status(404).json({ message: "Group chat not found" })
    }

    // Check if user is an admin
    if (!room.admins.includes(req.user._id)) {
      return res.status(403).json({ message: "Only admins can add members" })
    }

    // Add new members
    const newMembers = memberIds.filter((id) => !room.members.includes(id))
    room.members.push(...newMembers)
    await room.save()

    await room.populate("members", "name avatarUrl isOnline lastSeen")

    res.json({ room })
  } catch (error) {
    console.error("Add members error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Promote a member to admin
router.post("/rooms/:roomId/admins", authenticate, async (req, res) => {
  try {
    const { roomId } = req.params
    const { userId } = req.body
    const room = await ChatRoom.findById(roomId)

    if (!room || !room.isGroup) return res.status(404).json({ message: "Group not found" })
    if (!room.admins.includes(req.user._id)) return res.status(403).json({ message: "Forbidden: Not an admin" })
    if (!room.members.includes(userId)) return res.status(404).json({ message: "User is not a member" })
    if (room.admins.includes(userId)) return res.status(400).json({ message: "User is already an admin" })

    room.admins.push(userId)
    await room.save()
    await room.populate("members", "name avatarUrl isOnline lastSeen").populate("admins", "name avatarUrl")
    res.json({ room })
  } catch (e) {
    res.status(500).json({ message: "Server error" })
  }
})

// Remove member from group
router.delete("/rooms/:roomId/members/:memberId", authenticate, async (req, res) => {
  try {
    const { roomId, memberId } = req.params
    const room = await ChatRoom.findById(roomId)

    if (!room || !room.isGroup) return res.status(404).json({ message: "Group not found" })
    if (!room.admins.includes(req.user._id)) return res.status(403).json({ message: "Forbidden: Not an admin" })
    if (req.user._id.toString() === memberId) return res.status(400).json({ message: "Admin cannot remove themselves" })

    room.members = room.members.filter(id => id.toString() !== memberId)
    room.admins = room.admins.filter(id => id.toString() !== memberId) // Also remove from admins if they were one
    
    await room.save()
    await room.populate("members", "name avatarUrl isOnline lastSeen").populate("admins", "name avatarUrl")
    res.json({ room })
  } catch (e) {
    res.status(500).json({ message: "Server error" })
  }
})

// Leave group
router.delete("/rooms/:roomId/leave", authenticate, async (req, res) => {
  try {
    const { roomId } = req.params

    const room = await ChatRoom.findById(roomId)

    if (!room || !room.members.includes(req.user._id)) {
      return res.status(404).json({ message: "Room not found" })
    }

    // Remove user from members
    room.members = room.members.filter((id) => id.toString() !== req.user._id.toString())

    // If admin leaves, assign new admin
    if (room.admin && room.admin.toString() === req.user._id.toString() && room.members.length > 0) {
      room.admin = room.members[0]
    }

    // Delete room if no members left
    if (room.members.length === 0) {
      await ChatRoom.findByIdAndDelete(roomId)
      await Message.deleteMany({ roomId })
    } else {
      await room.save()
    }

    res.json({ message: "Left room successfully" })
  } catch (error) {
    console.error("Leave room error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
