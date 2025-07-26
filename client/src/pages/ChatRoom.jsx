// "use client"

// import { useEffect, useState, useRef } from "react"
// import { useParams, Link, useNavigate } from "react-router-dom"
// import {
//   ArrowLeft,
//   Send,
//   ImageIcon,
//   MoreHorizontal,
//   Info,
//   Users,
//   UserPlus,
//   LogOut,
//   MessageCircle,
//   X,
//   Check,
//   CheckCheck,
// } from "lucide-react"
// import useChatStore from "../store/chatStore"
// import { useAuthStore } from "../store/authStore"
// import { useUserStore } from "../store/userStore"

// import {
//   importPublicKey,
//   deriveSharedKey,
//   decryptMessage,
//   keyStore
// } from "../utils/cryptoUtils"; // Import crypto utils

// import axios from "axios"; 


// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";


// const ChatRoom = () => {
//   const { roomId } = useParams()
//   const navigate = useNavigate()
//   const { user } = useAuthStore()
//   const {
//     currentRoom,
//     messages,
//     loading,
//     joinRoom,
//     leaveRoom,
//     sendMessage,
//     loadMessages,
//     addMembersToGroup,
//     leaveGroup,
//     rooms,
//     loadRooms,
//     startTyping,
//     stopTyping,
//     getTypingUsers,
//     getMessageStatus,
//     isUserOnline,
//   } = useChatStore()
//   const { searchUsers, searchResults } = useUserStore()
//   const [messageText, setMessageText] = useState("")
//   const [mediaFile, setMediaFile] = useState(null)
//   const [mediaPreview, setMediaPreview] = useState(null)
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const [showAddMembers, setShowAddMembers] = useState(false)
//   const [showGroupInfo, setShowGroupInfo] = useState(false)
//   const [searchQuery, setSearchQuery] = useState("")
//   const [selectedUsers, setSelectedUsers] = useState([])
//   const [notification, setNotification] = useState(null)
//   const [expandedMedia, setExpandedMedia] = useState(null)
//   const messagesEndRef = useRef(null)
//   const chatContainerRef = useRef(null)
//   const shouldScrollToBottomRef = useRef(true)
//   const typingTimeoutRef = useRef(null)

//  const { addSharedKey, sharedKeys } = useChatStore(); // get currentRoom from store
//   // const { user } = useAuthStore();
//   // const [isSecuring, setIsSecuring] = useState(true); // New state to manage session setup
//    const [isSecuring, setIsSecuring] = useState(false);

// // This effect will run once to establish the secure session for the chat
//   //  useEffect(() => {
//   //   if (!currentRoom) return;

//   //   const establishSecureSession = async () => {
//   //     setIsSecuring(true);

//   //     // 1. If key already exists in Zustand, we're done
//   //     if (sharedKeys[currentRoom._id]) {
//   //       setIsSecuring(false);
//   //       return;
//   //     }
      
//   //     // For group chats, a different key management is needed (see section 3)
//   //     // This example focuses on one-to-one chats
//   //     if (currentRoom.isGroup) {
//   //       toast.error("Group chat encryption is not yet implemented.");
//   //       setIsSecuring(false); // Or handle group key exchange
//   //       return;
//   //     }

//   //     try {
//   //       // 2. Get your own private key from IndexedDB
//   //       const privateKey = await keyStore.get('privateKey');
//   //       if (!privateKey) throw new Error("Private key not found.");

//   //       // 3. Get the other user's ID and fetch their public key
//   //       const otherUser = currentRoom.members.find(m => m._id !== user.id);
//   //       if (!otherUser) throw new Error("Chat partner not found.");
        
//   //       const response = await axios.get(`${API_URL}/users/keys/${otherUser._id}`);
//   //       const theirPublicKeyJWK = JSON.parse(response.data.publicKey);
//   //       const theirPublicKey = await importPublicKey(theirPublicKeyJWK);

//   //       // 4. Derive the shared secret key
//   //       const derivedKey = await deriveSharedKey(privateKey, theirPublicKey);
        
//   //       // 5. Store it in Zustand for this session
//   //       addSharedKey(currentRoom._id, derivedKey);
//   //     } catch (error) {
//   //       console.error("Failed to establish secure session:", error);
//   //       toast.error("Could not establish a secure chat session.");
//   //     } finally {
//   //       setIsSecuring(false);
//   //     }
//   //   };

//   //   establishSecureSession();
//   // }, [currentRoom, sharedKeys, addSharedKey, user]);
  
//   // // You need to update your socket 'newMessage' listener in chatStore.js
//   // // to decrypt incoming messages before adding them to the state.

//   // // In your UI rendering:
//   // if (isSecuring) {
//   //   return (
//   //     <div className="flex justify-center items-center h-full">
//   //       <span className="loading loading-spinner loading-lg"></span>
//   //       <p className="ml-4">Establishing secure connection...</p>
//   //     </div>
//   //   );
//   // }






//   // 1. Ensure rooms are loaded
//   useEffect(() => {
//     if (!rooms.length) {
//       loadRooms();
//     }
//   }, [rooms.length, loadRooms]);

//   // 2. Join room and load messages when rooms are loaded and roomId changes
//   useEffect(() => {
//     if (!rooms.length) return;
//     const room = rooms.find((r) => r._id === roomId);
//     if (room) {
//       joinRoom(roomId);
//       loadMessages(roomId);
//     }
//     return () => leaveRoom();
//   }, [roomId, rooms.length, joinRoom, leaveRoom, loadMessages]);



//    // FIX 2: Replace your old secure session useEffect with this improved version.
//   useEffect(() => {
//     // Don't do anything if the room data isn't loaded yet.
//     if (!currentRoom) return;

//     const establishSecureSession = async () => {
//       // If we already have a key for this room, we're done.
//       if (sharedKeys[currentRoom._id]) {
//         setIsSecuring(false);
//         return;
//       }

//       // Start the loading state now that we are ready to proceed.
//       setIsSecuring(true);

//       if (currentRoom.isGroup) {
//         toast.error("Group chat encryption is not yet implemented.");
//         setIsSecuring(false);
//         return;
//       }

//       try {
//         const privateKey = await keyStore.get('privateKey');
//         if (!privateKey) throw new Error("Your private key is not available.");

//         const otherUser = currentRoom.members.find(m => m._id !== user.id);
//         if (!otherUser) throw new Error("Could not find the other user in this chat.");

//         const response = await axios.get(`${API_URL}/users/keys/${otherUser._id}`);
        
//         if (!response.data || !response.data.publicKey) {
//           throw new Error(`${otherUser.name} has not set up their encryption keys yet.`);
//         }

//         const theirPublicKeyJWK = JSON.parse(response.data.publicKey);
//         const theirPublicKey = await importPublicKey(theirPublicKeyJWK);

//         const derivedKey = await deriveSharedKey(privateKey, theirPublicKey);
        
//         addSharedKey(currentRoom._id, derivedKey);

//       } catch (error) {
//         console.error("Failed to establish secure session:", error);
//         toast.error(error.message || "Could not establish a secure chat session.");
//         // If it fails, navigate the user back to the chat list to prevent a broken state.
//         navigate("/chat");
//       } finally {
//         // IMPORTANT: This ensures the loading state is always turned off.
//         setIsSecuring(false);
//       }
//     };

//     establishSecureSession();
    
//   }, [currentRoom, user, roomId, navigate, addSharedKey, sharedKeys]);


//   // In your UI rendering, check for general loading AND the securing state
//   if (loading || !currentRoom) {
//       return (
//           <div className="flex justify-center items-center h-full">
//               <span className="loading loading-spinner loading-lg"></span>
//           </div>
//       );
//   }

//   if (isSecuring) {
//       return (
//           <div className="flex justify-center items-center h-full">
//               <span className="loading loading-spinner loading-lg"></span>
//               <p className="ml-4">🔒 Establishing secure connection...</p>
//           </div>
//       );
//   }




//   // Track if user is at the bottom
//   const handleScroll = () => {
//     const container = chatContainerRef.current
//     if (!container) return
//     const threshold = 80 // px
//     shouldScrollToBottomRef.current = container.scrollHeight - container.scrollTop - container.clientHeight < threshold
//   }

//   useEffect(() => {
//     const container = chatContainerRef.current
//     if (!container) return
//     container.addEventListener('scroll', handleScroll)
//     return () => container.removeEventListener('scroll', handleScroll)
//   }, [])

//   useEffect(() => {
//     // Only scroll to bottom if user was at the bottom or just sent a message
//     if (shouldScrollToBottomRef.current) {
//       messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
//     }
//   }, [messages])

//   // Handle typing indicators
//   useEffect(() => {
//     if (typingTimeoutRef.current) {
//       clearTimeout(typingTimeoutRef.current)
//     }

//     if (messageText.trim()) {
//       startTyping(roomId)
//       typingTimeoutRef.current = setTimeout(() => {
//         stopTyping(roomId)
//       }, 3000)
//     } else {
//       stopTyping(roomId)
//     }

//     return () => {
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }
//   }, [messageText, roomId, startTyping, stopTyping])

//   const handleMediaSelect = (e) => {
//     const file = e.target.files[0]
//     if (file) {
//       setMediaFile(file)
//       const reader = new FileReader()
//       reader.onload = (e) => {
//         setMediaPreview(e.target.result)
//       }
//       reader.readAsDataURL(file)
//     }
//   }

//   const removeMedia = () => {
//     setMediaFile(null)
//     setMediaPreview(null)
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     if ((!messageText.trim() && !mediaFile) || isSubmitting) return

//     setIsSubmitting(true)
//     try {
//       await sendMessage(messageText, mediaFile)
//       setMessageText("")
//       setMediaFile(null)
//       setMediaPreview(null)
//       stopTyping(roomId)
//       // Always scroll to bottom after sending
//       shouldScrollToBottomRef.current = true
//     } catch (error) {
//       setNotification({
//         type: "error",
//         message: "Failed to send message",
//       })
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   const handleSearch = async (query) => {
//     setSearchQuery(query)
//     if (query.trim()) {
//       await searchUsers(query)
//     }
//   }

//   const toggleUserSelection = (selectedUser) => {
//     if (selectedUsers.some((u) => u._id === selectedUser._id)) {
//       setSelectedUsers(selectedUsers.filter((u) => u._id !== selectedUser._id))
//     } else {
//       setSelectedUsers([...selectedUsers, selectedUser])
//     }
//   }

//   const handleAddMembers = async () => {
//     if (selectedUsers.length === 0) return

//     try {
//       const memberIds = selectedUsers.map((u) => u._id)
//       const result = await addMembersToGroup(roomId, memberIds)
//       if (result.success) {
//         setNotification({
//           type: "success",
//           message: "Members added successfully!",
//         })
//         setShowAddMembers(false)
//         setSelectedUsers([])
//       }
//     } catch (error) {
//       setNotification({
//         type: "error",
//         message: "Failed to add members",
//       })
//     }
//   }

//   const handleLeaveGroup = async () => {
//     if (window.confirm("Are you sure you want to leave this group?")) {
//       try {
//         const result = await leaveGroup(roomId)
//         if (result.success) {
//           navigate("/chat")
//         }
//       } catch (error) {
//         setNotification({
//           type: "error",
//           message: "Failed to leave group",
//         })
//       }
//     }
//   }

//   const formatTime = (timestamp) => {
//     if (!timestamp) return ""

//     const date = new Date(timestamp)
//     return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
//   }

//   const formatDate = (timestamp) => {
//     if (!timestamp) return ""

//     const date = new Date(timestamp)
//     return date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })
//   }

//   const isOwnMessage = (message) => {
//     return message.sender._id === user?.id
//   }

//   const getMessageStatusIcon = (message) => {
//     if (!isOwnMessage(message)) return null
    
//     const status = getMessageStatus(message._id)
    
//     switch (status) {
//       case "sent":
//         return <Check size={12} className="text-base-content/40" />
//       case "delivered":
//         return <CheckCheck size={12} className="text-base-content/60" />
//       case "read":
//         return <CheckCheck size={12} className="text-blue-500" />
//       default:
//         return null
//     }
//   }

//   const getOtherUser = () => {
//     if (!currentRoom || currentRoom.isGroup) return null
//     return currentRoom.members.find((member) => member._id !== user?.id)
//   }

//   const otherUser = getOtherUser()
//   const typingUsers = getTypingUsers(roomId)

//   // Handle Escape key and browser back for expanded media
//   useEffect(() => {
//     if (!expandedMedia) return

//     const handleKeyDown = (e) => {
//       if (e.key === "Escape") {
//         setExpandedMedia(null)
//       }
//     }
//     const handlePopState = () => {
//       setExpandedMedia(null)
//     }
//     window.addEventListener("keydown", handleKeyDown)
//     window.addEventListener("popstate", handlePopState)
//     // Push a new state to history so back button closes modal
//     window.history.pushState({ expandedMedia: true }, "")
//     return () => {
//       window.removeEventListener("keydown", handleKeyDown)
//       window.removeEventListener("popstate", handlePopState)
//       // Only go back if modal is still open (prevents double pop)
//       if (window.history.state && window.history.state.expandedMedia) {
//         window.history.back()
//       }
//     }
//   }, [expandedMedia])

//   const room = rooms.find((r) => r._id === roomId)
//   if (loading || !rooms.length) {
//     return (
//       <div className="flex justify-center items-center min-h-[60vh]">
//         <span className="loading loading-spinner loading-lg"></span>
//       </div>
//     )
//   }
//   if (!room) {
//     return (
//       <div className="flex flex-col justify-center items-center min-h-[60vh] text-center">
//         <div className="text-2xl font-bold mb-2">Room not found</div>
//         <div className="text-base-content/60 mb-4">The chat room you are looking for does not exist or you do not have access.</div>
//         <button className="btn btn-primary" onClick={() => navigate('/chat')}>Go to Messages</button>
//       </div>
//     )
//   }

//   return (
//     <div className="flex flex-col h-[calc(100vh-8rem)] bg-base-100 border border-base-300 rounded-lg shadow-lg overflow-hidden">
//       {notification && (
//         <div className={`alert ${notification.type === "success" ? "alert-success" : "alert-error"} shadow-lg m-4`}>
//           <div>
//             {notification.type === "success" ? (
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 className="stroke-current flex-shrink-0 h-6 w-6"
//                 fill="none"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth="2"
//                   d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
//                 />
//               </svg>
//             ) : (
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 className="stroke-current flex-shrink-0 h-6 w-6"
//                 fill="none"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth="2"
//                   d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
//                 />
//               </svg>
//             )}
//             <span>{notification.message}</span>
//           </div>
//         </div>
//       )}

//       {/* Chat Header */}
//       <div className="flex items-center justify-between p-4 border-b border-base-300 bg-base-200">
//         <div className="flex items-center space-x-3">
//           <button onClick={() => navigate("/chat")} className="btn btn-ghost btn-sm">
//             <ArrowLeft size={18} />
//           </button>
//           <div className="avatar">
//             <div className="w-10 h-10 rounded-full relative">
//               {currentRoom?.isGroup ? (
//                 <div className="bg-primary text-primary-content rounded-full flex items-center justify-center">
//                   <Users size={20} />
//                 </div>
//               ) : (
//                 <img src={otherUser?.avatarUrl || "/placeholder.svg?height=40&width=40"} alt={currentRoom?.name} />
//               )}
//               {/* Online indicator */}
//               {!currentRoom?.isGroup && otherUser && (
//                 <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-base-100 ${
//                   isUserOnline(otherUser._id) ? 'bg-green-500' : 'bg-gray-400'
//                 }`} />
//               )}
//             </div>
//           </div>
//           <div>
//             <div className="font-semibold">{currentRoom?.isGroup ? currentRoom?.name : otherUser?.name}</div>
//             <div className="text-xs text-base-content/60">
//               {currentRoom?.isGroup ? (
//                 `${currentRoom?.members?.length || 0} members`
//               ) : (
//                 isUserOnline(otherUser?._id) ? "Online" : "Offline"
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Room Menu */}
//         <div className="dropdown dropdown-end">
//           <label tabIndex={0} className="btn btn-ghost btn-sm">
//             <MoreHorizontal size={18} />
//           </label>
//           <ul
//             tabIndex={0}
//             className="dropdown-content menu p-2 shadow-xl bg-base-100 border border-base-300 rounded-box w-52 z-50"
//           >
//             {currentRoom?.isGroup && (
//               <>
//                 <li>
//                   <button onClick={() => setShowGroupInfo(true)} className="flex items-center space-x-2">
//                     <Info size={16} />
//                     <span>Group Info</span>
//                   </button>
//                 </li>
//                 <li>
//                   <button onClick={() => setShowAddMembers(true)} className="flex items-center space-x-2">
//                     <UserPlus size={16} />
//                     <span>Add Members</span>
//                   </button>
//                 </li>
//                 <li>
//                   <button onClick={handleLeaveGroup} className="flex items-center space-x-2 text-error">
//                     <LogOut size={16} />
//                     <span>Leave Group</span>
//                   </button>
//                 </li>
//               </>
//             )}
//             {!currentRoom?.isGroup && otherUser && (
//               <li>
//                 <Link to={`/profile/${otherUser._id}`} className="flex items-center space-x-2">
//                   <Info size={16} />
//                   <span>View Profile</span>
//                 </Link>
//               </li>
//             )}
//           </ul>
//         </div>
//       </div>

//       {/* Messages */}
//       <div className="flex-1 overflow-y-auto p-4 bg-base-50" ref={chatContainerRef}>
//         {loading ? (
//           <div className="flex justify-center items-center h-full">
//             <span className="loading loading-spinner loading-lg"></span>
//           </div>
//         ) : messages.length === 0 ? (
//           <div className="flex flex-col items-center justify-center h-full text-base-content/60">
//             <div className="avatar">
//               <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center">
//                 <MessageCircle size={32} />
//               </div>
//             </div>
//             <p className="mt-4">No messages yet</p>
//             <p className="text-sm">Start the conversation!</p>
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {messages.map((message, index) => {
//               // Check if we need to show date separator
//               const showDate =
//                 index === 0 ||
//                 new Date(message.createdAt).toDateString() !== new Date(messages[index - 1].createdAt).toDateString()

//               return (
//                 <div key={message._id}>
//                   {showDate && (
//                     <div className="flex justify-center my-4">
//                       <div className="badge badge-neutral">{formatDate(message.createdAt)}</div>
//                     </div>
//                   )}

//                   <div className={`flex ${isOwnMessage(message) ? "justify-end" : "justify-start"}`}>
//                     {!isOwnMessage(message) && currentRoom?.isGroup && (
//                       <div className="avatar mr-2 self-end mb-1">
//                         <div className="w-6 h-6 rounded-full relative">
//                           <img
//                             src={message.sender.avatarUrl || "/placeholder.svg?height=24&width=24"}
//                             alt={message.sender.name}
//                           />
//                           <div className={`absolute -bottom-1 -right-1 w-2 h-2 rounded-full border border-base-100 ${
//                             isUserOnline(message.sender._id) ? 'bg-green-500' : 'bg-gray-400'
//                           }`} />
//                         </div>
//                       </div>
//                     )}

//                     <div className={`max-w-xs lg:max-w-md message-bubble ${isOwnMessage(message) ? "own" : "other"}`}>
//                       {!isOwnMessage(message) && currentRoom?.isGroup && (
//                         <div className="text-xs font-medium mb-1">{message.sender.name}</div>
//                       )}

//                       <div
//                         className={`rounded-lg overflow-hidden ${
//                           isOwnMessage(message)
//                             ? "bg-primary text-primary-content"
//                             : "bg-base-200 text-base-content border border-base-300"
//                         }`}
//                       >
//                         {message.mediaUrl && (
//                           <div className="mb-1 cursor-pointer" onClick={() => setExpandedMedia(message.mediaUrl)}>
//                             {message.messageType === "image" ? (
//                               <img
//                                 src={message.mediaUrl || "/placeholder.svg"}
//                                 alt="Shared media"
//                                 className="w-full max-h-60 object-cover hover:opacity-90 transition-opacity"
//                               />
//                             ) : (
//                               <video src={message.mediaUrl} controls className="w-full max-h-60 object-cover" />
//                             )}
//                           </div>
//                         )}

//                         {message.text && <div className="p-3">{message.text}</div>}
//                       </div>

//                       <div
//                         className={`text-xs text-base-content/60 mt-1 flex items-center gap-1 ${
//                           isOwnMessage(message) ? "justify-end" : "justify-start"
//                         }`}
//                       >
//                         {formatTime(message.createdAt)}
//                         {getMessageStatusIcon(message)}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )
//             })}

//             {/* Typing indicator */}
//             {typingUsers.length > 0 && (
//               <div className="flex justify-start">
//                 <div className="max-w-xs lg:max-w-md message-bubble other">
//                   <div className="bg-base-200 text-base-content border border-base-300 rounded-lg p-3">
//                     <div className="flex items-center space-x-1">
//                       <div className="flex space-x-1">
//                         <div className="w-2 h-2 bg-base-content/40 rounded-full typing-dot"></div>
//                         <div className="w-2 h-2 bg-base-content/40 rounded-full typing-dot"></div>
//                         <div className="w-2 h-2 bg-base-content/40 rounded-full typing-dot"></div>
//                       </div>
//                       <span className="text-xs text-base-content/60 ml-2">
//                         {typingUsers.length === 1 ? "typing..." : `${typingUsers.length} typing...`}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}

//             <div ref={messagesEndRef} />
//           </div>
//         )}
//       </div>

//       {/* Message Input */}
//       <div className="p-4 border-t border-base-300 bg-base-200">
//         {/* Media Preview */}
//         {mediaPreview && (
//           <div className="mb-2 relative">
//             <div className="bg-base-100 p-2 rounded-lg inline-block relative border border-base-300">
//               <button
//                 type="button"
//                 onClick={removeMedia}
//                 className="absolute -top-2 -right-2 btn btn-circle btn-xs btn-error"
//               >
//                 <X size={12} />
//               </button>
//               {mediaFile?.type.startsWith("image/") ? (
//                 <img src={mediaPreview || "/placeholder.svg"} alt="Preview" className="h-20 rounded" />
//               ) : (
//                 <video src={mediaPreview} className="h-20 rounded" />
//               )}
//             </div>
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="flex items-center space-x-2">
//           <label className="btn btn-ghost btn-circle">
//             <ImageIcon size={20} />
//             <input type="file" accept="image/*,video/*" onChange={handleMediaSelect} className="hidden" />
//           </label>

//           <input
//             type="text"
//             value={messageText}
//             onChange={(e) => setMessageText(e.target.value)}
//             placeholder="Type a message..."
//             className="input input-bordered flex-1 border-base-300 focus:border-primary"
//             disabled={isSubmitting}
//           />

//           <button
//             type="submit"
//             disabled={(!messageText.trim() && !mediaFile) || isSubmitting}
//             className="btn btn-primary btn-circle"
//           >
//             {isSubmitting ? <span className="loading loading-spinner loading-xs"></span> : <Send size={18} />}
//           </button>
//         </form>
//       </div>

//       {/* Add Members Modal */}
//       {showAddMembers && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md border border-base-300">
//             <div className="p-4 border-b border-base-300 flex justify-between items-center">
//               <h3 className="text-lg font-semibold">Add Members</h3>
//               <button onClick={() => setShowAddMembers(false)} className="btn btn-ghost btn-sm">
//                 <X size={20} />
//               </button>
//             </div>

//             <div className="p-4">
//               {/* Search Users */}
//               <div className="form-control mb-4">
//                 <div className="input-group">
//                   <span>
//                     <Users size={18} />
//                   </span>
//                   <input
//                     type="text"
//                     value={searchQuery}
//                     onChange={(e) => handleSearch(e.target.value)}
//                     placeholder="Search users..."
//                     className="input input-bordered w-full border-base-300"
//                   />
//                 </div>
//               </div>

//               {/* Selected Users */}
//               {selectedUsers.length > 0 && (
//                 <div className="flex flex-wrap gap-2 mb-4">
//                   {selectedUsers.map((user) => (
//                     <div key={user._id} className="badge badge-primary gap-1">
//                       {user.name}
//                       <button onClick={() => toggleUserSelection(user)}>
//                         <X size={12} />
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               )}

//               {/* Search Results */}
//               <div className="max-h-60 overflow-y-auto">
//                 {searchResults.map((user) => (
//                   <div
//                     key={user._id}
//                     onClick={() => toggleUserSelection(user)}
//                     className={`flex items-center space-x-3 p-3 hover:bg-base-200 cursor-pointer rounded-lg border border-base-300 mb-2 ${
//                       selectedUsers.some((u) => u._id === user._id) ? "bg-base-200" : ""
//                     }`}
//                   >
//                     <div className="avatar">
//                       <div className="w-6 h-6 rounded-full">
//                         <img src={user.avatarUrl || "/placeholder.svg?height=24&width=24"} alt={user.name} />
//                       </div>
//                     </div>
//                     <div>
//                       <div className="font-medium">{user.name}</div>
//                       <div className="text-sm text-base-content/60">
//                         {user.batch} • {user.center}
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               {/* Add Button */}
//               <div className="mt-4 flex justify-end">
//                 <button onClick={handleAddMembers} disabled={selectedUsers.length === 0} className="btn btn-primary">
//                   Add to Group
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Group Info Modal */}
//       {showGroupInfo && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md border border-base-300">
//             <div className="p-4 border-b border-base-300 flex justify-between items-center">
//               <h3 className="text-lg font-semibold">Group Members</h3>
//               <button onClick={() => setShowGroupInfo(false)} className="btn btn-ghost btn-sm">
//                 <X size={20} />
//               </button>
//             </div>

//             <div className="p-4 max-h-96 overflow-y-auto">
//               <ul className="space-y-1">
//                 {currentRoom?.members?.map((member) => (
//                   <li key={member._id}>
//                     <Link
//                       to={`/profile/${member._id}`}
//                       onClick={() => setShowGroupInfo(false)}
//                       className="flex items-center justify-between p-2 rounded-lg hover:bg-base-200 transition-colors"
//                     >
//                       <div className="flex items-center space-x-3">
//                         <div className="avatar relative">
//                           <div className="w-10 h-10 rounded-full">
//                             <img src={member.avatarUrl || "/placeholder.svg?height=40&width=40"} alt={member.name} />
//                           </div>
//                           <div
//                             className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-base-100 ${
//                               isUserOnline(member._id) ? "bg-green-500" : "bg-gray-400"
//                             }`}
//                           />
//                         </div>
//                         <span>{member.name}</span>
//                       </div>
//                       <div className="flex items-center space-x-2">
//                         {currentRoom.admins?.includes(member._id) && (
//                           <span className="badge badge-primary badge-sm">Admin</span>
//                         )}
//                         {currentRoom.admins?.includes(user.id) && member._id !== user.id && (
//                           <div className="dropdown dropdown-left">
//                             <label tabIndex={0} className="btn btn-ghost btn-xs">
//                               <MoreHorizontal size={16} />
//                             </label>
//                             <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-300 rounded-box w-48">
//                               {!currentRoom.admins?.includes(member._id) && (
//                                 <li>
//                                   <button onClick={() => promoteToAdmin(currentRoom._id, member._id)}>
//                                     Promote to Admin
//                                   </button>
//                                 </li>
//                               )}
//                               <li>
//                                 <button
//                                   onClick={() => removeMember(currentRoom._id, member._id)}
//                                   className="text-error"
//                                 >
//                                   Remove from Group
//                                 </button>
//                               </li>
//                             </ul>
//                           </div>
//                         )}
//                       </div>
//                     </Link>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Expanded Media Modal */}
//       {expandedMedia && (
//         <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
//           <div className="relative w-full h-full flex items-center justify-center">
//             <button
//               onClick={() => setExpandedMedia(null)}
//               className="absolute top-4 right-4 btn btn-circle btn-ghost text-white z-10"
//             >
//               <X size={24} />
//             </button>
//             {expandedMedia.includes(".mp4") || expandedMedia.includes(".mov") || expandedMedia.includes(".avi") ? (
//               <video src={expandedMedia} controls className="max-w-screen max-h-screen" />
//             ) : (
//               <img src={expandedMedia || "/placeholder.svg"} alt="Expanded media" className="max-w-screen max-h-screen object-contain" />
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// export default ChatRoom








"use client"

import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Send, ImageIcon, MoreHorizontal, Info, Users,
  UserPlus, LogOut, MessageCircle, X, Check, CheckCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

import useChatStore from "../store/chatStore";
import { useAuthStore } from "../store/authStore";
import { useUserStore } from "../store/userStore";
import {
  importPublicKey,
  deriveSharedKey,
  keyStore
} from "../utils/cryptoUtils";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ChatRoom = () => {
  // =================================================================
  // 1. ALL HOOKS ARE CALLED AT THE TOP, UNCONDITIONALLY
  // =================================================================
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentRoom, messages, loading, rooms, joinRoom, leaveRoom, sendMessage,
    loadMessages, addMembersToGroup, leaveGroup, loadRooms, startTyping,
    stopTyping, getTypingUsers, getMessageStatus, isUserOnline, addSharedKey, sharedKeys
  } = useChatStore();
  const { searchUsers, searchResults } = useUserStore();

  // State Hooks
  const [messageText, setMessageText] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [notification, setNotification] = useState(null);
  const [expandedMedia, setExpandedMedia] = useState(null);
  const [isSecuring, setIsSecuring] = useState(false);

  // Ref Hooks
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const shouldScrollToBottomRef = useRef(true);
  const typingTimeoutRef = useRef(null);

  // Effect Hooks
  useEffect(() => {
    if (!rooms.length) {
      loadRooms();
    }
  }, [rooms.length, loadRooms]);

  useEffect(() => {
    const room = rooms.find((r) => r._id === roomId);
    if (room) {
      joinRoom(roomId);
      loadMessages(roomId);
    }
    return () => leaveRoom();
  }, [roomId, rooms.length]);

  useEffect(() => {
    const establishSecureSession = async () => {
      if (!currentRoom) return;
      if (sharedKeys[currentRoom._id]) {
        setIsSecuring(false);
        return;
      }

      setIsSecuring(true);

      if (currentRoom.isGroup) {
        toast.error("Group chat encryption is not yet implemented.");
        setIsSecuring(false);
        return;
      }

      try {
        const privateKey = await keyStore.get('privateKey');
        if (!privateKey) throw new Error("Your private key is not available.");

        const otherUser = currentRoom.members.find(m => m._id !== user.id);
        if (!otherUser) throw new Error("Could not find the other user in this chat.");

        const response = await axios.get(`${API_URL}/users/keys/${otherUser._id}`);
        if (!response.data?.publicKey) {
          throw new Error(`${otherUser.name} has not set up their encryption keys yet.`);
        }

        const theirPublicKey = await importPublicKey(JSON.parse(response.data.publicKey));
        const derivedKey = await deriveSharedKey(privateKey, theirPublicKey);
        addSharedKey(currentRoom._id, derivedKey);
      } catch (error) {
        console.error("Failed to establish secure session:", error);
        toast.error(error.message || "Could not establish a secure chat session.");
        navigate("/chat");
      } finally {
        setIsSecuring(false);
      }
    };
    establishSecureSession();
  }, [currentRoom]);

  const handleScroll = () => {
    const container = chatContainerRef.current;
    if (container) {
      shouldScrollToBottomRef.current = container.scrollHeight - container.scrollTop - container.clientHeight < 80;
    }
  };

  useEffect(() => {
    const container = chatContainerRef.current;
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (shouldScrollToBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    clearTimeout(typingTimeoutRef.current);
    if (messageText.trim()) {
      startTyping(roomId);
      typingTimeoutRef.current = setTimeout(() => stopTyping(roomId), 3000);
    } else {
      stopTyping(roomId);
    }
    return () => clearTimeout(typingTimeoutRef.current);
  }, [messageText, roomId]);

  useEffect(() => {
    if (!expandedMedia) return;
    const handleKeyDown = (e) => e.key === "Escape" && setExpandedMedia(null);
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expandedMedia]);

  // =================================================================
  // 2. LOGIC AND EVENT HANDLERS
  // =================================================================
  const room = rooms.find((r) => r._id === roomId);
  const otherUser = currentRoom && !currentRoom.isGroup ? currentRoom.members.find((m) => m._id !== user?.id) : null;
  const typingUsers = getTypingUsers(roomId);

  const handleMediaSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setMediaPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!messageText.trim() && !mediaFile) || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await sendMessage(messageText, mediaFile);
      setMessageText("");
      setMediaFile(null);
      setMediaPreview(null);
      stopTyping(roomId);
      shouldScrollToBottomRef.current = true;
    } catch (error) {
      setNotification({ type: "error", message: "Failed to send message" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      await searchUsers(query);
    }
  };

  const toggleUserSelection = (selectedUser) => {
    if (selectedUsers.some((u) => u._id === selectedUser._id)) {
      setSelectedUsers(selectedUsers.filter((u) => u._id !== selectedUser._id));
    } else {
      setSelectedUsers([...selectedUsers, selectedUser]);
    }
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) return;
    try {
      const memberIds = selectedUsers.map((u) => u._id);
      const result = await addMembersToGroup(roomId, memberIds);
      if (result.success) {
        setNotification({ type: "success", message: "Members added successfully!" });
        setShowAddMembers(false);
        setSelectedUsers([]);
      }
    } catch (error) {
      setNotification({ type: "error", message: "Failed to add members" });
    }
  };

  const handleLeaveGroup = async () => {
    if (window.confirm("Are you sure you want to leave this group?")) {
      try {
        const result = await leaveGroup(roomId);
        if (result.success) {
          navigate("/chat");
        }
      } catch (error) {
        setNotification({ type: "error", message: "Failed to leave group" });
      }
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  };

  const isOwnMessage = (message) => message.sender._id === user?.id;

  const getMessageStatusIcon = (message) => {
    if (!isOwnMessage(message)) return null;
    const status = getMessageStatus(message._id);
    switch (status) {
      case "sent": return <Check size={12} className="text-base-content/40" />;
      case "delivered": return <CheckCheck size={12} className="text-base-content/60" />;
      case "read": return <CheckCheck size={12} className="text-blue-500" />;
      default: return null;
    }
  };

  // =================================================================
  // 3. CONDITIONAL RENDERING LOGIC
  // =================================================================
  if (loading && !currentRoom) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (isSecuring) {
    return (
      <div className="flex justify-center items-center h-full">
        <span className="loading loading-spinner loading-lg"></span>
        <p className="ml-4">🔒 Establishing secure connection...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] text-center">
        <div className="text-2xl font-bold mb-2">Room not found</div>
        <div className="text-base-content/60 mb-4">The chat room you are looking for does not exist or you do not have access.</div>
        <button className="btn btn-primary" onClick={() => navigate('/chat')}>Go to Messages</button>
      </div>
    );
  }

  // =================================================================
  // 4. MAIN JSX RETURN
  // =================================================================
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-base-100 border border-base-300 rounded-lg shadow-lg overflow-hidden">
      {notification && (
        <div className={`alert ${notification.type === "success" ? "alert-success" : "alert-error"} shadow-lg m-4`}>
            {/* Notification content */}
        </div>
      )}

      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-base-300 bg-base-200">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate("/chat")} className="btn btn-ghost btn-sm">
            <ArrowLeft size={18} />
          </button>
          <div className="avatar">
            <div className="w-10 h-10 rounded-full relative">
              {currentRoom?.isGroup ? (
                <div className="bg-primary text-primary-content rounded-full flex items-center justify-center">
                  <Users size={20} />
                </div>
              ) : (
                <img src={otherUser?.avatarUrl || "/placeholder.svg?height=40&width=40"} alt={currentRoom?.name} />
              )}
              {!currentRoom?.isGroup && otherUser && (
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-base-100 ${
                  isUserOnline(otherUser._id) ? 'bg-green-500' : 'bg-gray-400'
                }`} />
              )}
            </div>
          </div>
          <div>
            <div className="font-semibold">{currentRoom?.isGroup ? currentRoom?.name : otherUser?.name}</div>
            <div className="text-xs text-base-content/60">
              {currentRoom?.isGroup ? `${currentRoom?.members?.length || 0} members` : (isUserOnline(otherUser?._id) ? "Online" : "Offline")}
            </div>
          </div>
        </div>
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost btn-sm"><MoreHorizontal size={18} /></label>
          <ul tabIndex={0} className="dropdown-content menu p-2 shadow-xl bg-base-100 border border-base-300 rounded-box w-52 z-50">
            {currentRoom?.isGroup && (
              <>
                <li><button onClick={() => setShowGroupInfo(true)} className="flex items-center space-x-2"><Info size={16} /><span>Group Info</span></button></li>
                <li><button onClick={() => setShowAddMembers(true)} className="flex items-center space-x-2"><UserPlus size={16} /><span>Add Members</span></button></li>
                <li><button onClick={handleLeaveGroup} className="flex items-center space-x-2 text-error"><LogOut size={16} /><span>Leave Group</span></button></li>
              </>
            )}
            {!currentRoom?.isGroup && otherUser && (
              <li><Link to={`/profile/${otherUser._id}`} className="flex items-center space-x-2"><Info size={16} /><span>View Profile</span></Link></li>
            )}
          </ul>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-base-50" ref={chatContainerRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-base-content/60">
            <div className="avatar"><div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center"><MessageCircle size={32} /></div></div>
            <p className="mt-4">No messages yet</p><p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const showDate = index === 0 || new Date(message.createdAt).toDateString() !== new Date(messages[index - 1].createdAt).toDateString();
              return (
                <div key={message._id}>
                  {showDate && (
                    <div className="flex justify-center my-4"><div className="badge badge-neutral">{formatDate(message.createdAt)}</div></div>
                  )}
                  <div className={`flex ${isOwnMessage(message) ? "justify-end" : "justify-start"}`}>
                    {!isOwnMessage(message) && currentRoom?.isGroup && (
                      <div className="avatar mr-2 self-end mb-1"><div className="w-6 h-6 rounded-full relative"><img src={message.sender.avatarUrl || "/placeholder.svg?height=24&width=24"} alt={message.sender.name} /><div className={`absolute -bottom-1 -right-1 w-2 h-2 rounded-full border border-base-100 ${isUserOnline(message.sender._id) ? 'bg-green-500' : 'bg-gray-400'}`} /></div></div>
                    )}
                    <div className={`max-w-xs lg:max-w-md message-bubble ${isOwnMessage(message) ? "own" : "other"}`}>
                      {!isOwnMessage(message) && currentRoom?.isGroup && (<div className="text-xs font-medium mb-1">{message.sender.name}</div>)}
                      <div className={`rounded-lg overflow-hidden ${isOwnMessage(message) ? "bg-primary text-primary-content" : "bg-base-200 text-base-content border border-base-300"}`}>
                        {message.mediaUrl && (<div className="mb-1 cursor-pointer" onClick={() => setExpandedMedia(message.mediaUrl)}>{message.messageType === "image" ? (<img src={message.mediaUrl || "/placeholder.svg"} alt="Shared media" className="w-full max-h-60 object-cover hover:opacity-90 transition-opacity" />) : (<video src={message.mediaUrl} controls className="w-full max-h-60 object-cover" />)}</div>)}
                        {message.text && <div className="p-3">{message.text}</div>}
                      </div>
                      <div className={`text-xs text-base-content/60 mt-1 flex items-center gap-1 ${isOwnMessage(message) ? "justify-end" : "justify-start"}`}>{formatTime(message.createdAt)}{getMessageStatusIcon(message)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
            {typingUsers.length > 0 && (
              <div className="flex justify-start"><div className="max-w-xs lg:max-w-md message-bubble other"><div className="bg-base-200 text-base-content border border-base-300 rounded-lg p-3"><div className="flex items-center space-x-1"><div className="flex space-x-1"><div className="w-2 h-2 bg-base-content/40 rounded-full typing-dot"></div><div className="w-2 h-2 bg-base-content/40 rounded-full typing-dot"></div><div className="w-2 h-2 bg-base-content/40 rounded-full typing-dot"></div></div><span className="text-xs text-base-content/60 ml-2">{typingUsers.length === 1 ? "typing..." : `${typingUsers.length} typing...`}</span></div></div></div></div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-base-300 bg-base-200">
        {mediaPreview && (
          <div className="mb-2 relative"><div className="bg-base-100 p-2 rounded-lg inline-block relative border border-base-300"><button type="button" onClick={removeMedia} className="absolute -top-2 -right-2 btn btn-circle btn-xs btn-error"><X size={12} /></button>{mediaFile?.type.startsWith("image/") ? (<img src={mediaPreview || "/placeholder.svg"} alt="Preview" className="h-20 rounded" />) : (<video src={mediaPreview} className="h-20 rounded" />)}</div></div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <label className="btn btn-ghost btn-circle"><ImageIcon size={20} /><input type="file" accept="image/*,video/*" onChange={handleMediaSelect} className="hidden" /></label>
          <input type="text" value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Type a message..." className="input input-bordered flex-1 border-base-300 focus:border-primary" disabled={isSubmitting} />
          <button type="submit" disabled={(!messageText.trim() && !mediaFile) || isSubmitting} className="btn btn-primary btn-circle">{isSubmitting ? <span className="loading loading-spinner loading-xs"></span> : <Send size={18} />}</button>
        </form>
      </div>

      {/* All Modals */}
      {showAddMembers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            {/* Add Members Modal Content */}
        </div>
      )}
      {showGroupInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            {/* Group Info Modal Content */}
        </div>
      )}
      {expandedMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            {/* Expanded Media Modal Content */}
        </div>
      )}
    </div>
  );
};

export default ChatRoom;


