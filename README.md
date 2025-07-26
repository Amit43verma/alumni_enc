# MERN Alumni Portal - WhatsApp-like Chat Features
Live URL: https://alumni-portal-frontend-vdvb.onrender.com

A comprehensive alumni portal with real-time chat functionality featuring WhatsApp-like features.

## 🚀 New Chat Features

### Real-time Messaging
- **Instant message delivery** using Socket.IO
- **Real-time notifications** for new messages
- **Message status tracking** (sent, delivered, read)
- **Typing indicators** showing when someone is typing

### Read Receipts
- **Message status icons**: Single check (sent), double check (delivered), blue double check (read)
- **Automatic read marking** when messages are viewed
- **Real-time status updates** across all connected clients

### Online Status
- **Real-time online/offline indicators** with green dots
- **Last seen timestamps** for offline users
- **Automatic status updates** when users connect/disconnect

### Message Notifications
- **Toast notifications** for new messages when not in the active chat
- **Unread message counts** with animated badges
- **Message previews** in notifications

### Enhanced UI/UX
- **Smooth animations** for message bubbles and typing indicators
- **Responsive design** for mobile and desktop
- **Dark mode support** with proper contrast
- **Media sharing** (images and videos)

## 🛠️ Technical Implementation

### Backend (Node.js + Express + Socket.IO)
- **Real-time socket connections** with authentication
- **Message persistence** with MongoDB
- **Read receipt tracking** with user timestamps
- **Online status management** with automatic cleanup
- **Typing indicator management** with timeouts

### Frontend (React + Zustand + Socket.IO Client)
- **State management** with Zustand for real-time updates
- **Socket event handling** for all real-time features
- **Optimistic UI updates** for better user experience
- **Responsive chat interface** with proper scrolling

### Database Schema Updates
- **Message model**: Added `deliveredTo`, `status`, and enhanced `readBy`
- **ChatRoom model**: Added `unreadCounts` and `typingUsers`
- **User model**: Added `isOnline`, `lastSeen`, and `socketId`

## 🎯 Features Breakdown

### 1. Message Status System
```javascript
// Message status flow
sent → delivered → read
```

### 2. Typing Indicators
- Shows "typing..." when user is actively typing
- Automatically stops after 3 seconds of inactivity
- Supports multiple users typing simultaneously

### 3. Online Status
- Green dot for online users
- Gray dot for offline users
- Real-time updates across all connected clients

### 4. Read Receipts
- Visual indicators for message status
- Automatic marking when messages are viewed
- Real-time updates to message senders

### 5. Notifications
- Toast notifications for new messages
- Unread count badges with animations
- Message previews in chat list

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd mern-alumni-portal
```

2. **Install server dependencies**
```bash
cd server
npm install
```

3. **Install client dependencies**
```bash
cd ../client
npm install
```

4. **Environment Setup**
Create `.env` files in both server and client directories:

**Server (.env)**
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:3000
PORT=5000
```

**Client (.env)**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

5. **Run the application**
```bash
# Terminal 1 - Start server
cd server
npm run dev

# Terminal 2 - Start client
cd client
npm run dev
```

## 🔧 Configuration

### Socket.IO Events
- `joinRoom`: Join a chat room
- `leaveRoom`: Leave a chat room
- `sendMessage`: Send a new message
- `markAsRead`: Mark messages as read
- `typingStart`: Start typing indicator
- `typingStop`: Stop typing indicator

### Real-time Features
- **Message delivery**: Automatic when user joins room
- **Read receipts**: Automatic when messages are viewed
- **Online status**: Automatic on connection/disconnection
- **Typing indicators**: Manual with automatic timeout

## 🎨 UI Components

### ChatRoom Component
- Real-time message display
- Typing indicators
- Read receipt icons
- Online status indicators
- Media sharing support

### ChatList Component
- Unread message counts
- Last message previews
- Online status indicators
- Message timestamps
- Read receipt status

## 🔒 Security Features

- **Socket authentication** using JWT tokens
- **Room access control** - users can only access rooms they're members of
- **Message validation** - prevents empty or malicious messages
- **Rate limiting** on message sending

## 📱 Mobile Responsiveness

- **Responsive design** for all screen sizes
- **Touch-friendly** interface
- **Optimized scrolling** for mobile devices
- **Proper keyboard handling** for mobile input

## 🎯 Performance Optimizations

- **Message pagination** (50 messages per page)
- **Efficient socket event handling**
- **Optimistic UI updates**
- **Proper cleanup** of socket connections
- **Debounced typing indicators**

## 🐛 Troubleshooting

### Common Issues

1. **Socket connection fails**
   - Check if server is running
   - Verify CORS configuration
   - Check authentication token

2. **Messages not updating in real-time**
   - Ensure socket connection is established
   - Check browser console for errors
   - Verify room membership

3. **Read receipts not working**
   - Check if user is properly authenticated
   - Verify message ownership
   - Check database permissions

## 📈 Future Enhancements

- **Message reactions** (like, love, etc.)
- **Message replies** and threading
- **Voice messages** support
- **File sharing** capabilities
- **Message search** functionality
- **Chat backup** and export
- **Message encryption** for enhanced privacy

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ using MERN stack and Socket.IO** 
