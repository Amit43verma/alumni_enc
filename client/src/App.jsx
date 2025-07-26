"use client"

import { useEffect, useState, lazy, Suspense } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import { useAuthStore } from "./store/authStore"
import useChatStore from "./store/chatStore"
import { usePostStore } from "./store/postStore"

// Components
import Layout from "./components/Layout"
import ProtectedRoute from "./components/ProtectedRoute"

import { generateKeyPair, exportKey, keyStore } from "./utils/cryptoUtils";
import axios from "axios";


// Lazy load pages for better performance
const Login = lazy(() => import("./pages/Login"))
const Signup = lazy(() => import("./pages/Signup"))
const Feed = lazy(() => import("./pages/Feed"))
const PostDetail = lazy(() => import("./pages/PostDetail"))
const Profile = lazy(() => import("./pages/Profile"))
const EditProfile = lazy(() => import("./pages/EditProfile"))
const ChatList = lazy(() => import("./pages/ChatList"))
const ChatRoom = lazy(() => import("./pages/ChatRoom"))
const Groups = lazy(() => import("./pages/Groups"))
const Search = lazy(() => import("./pages/Search"))
const OtpVerification = lazy(() => import("./pages/OtpVerification"))
const SavedPosts = lazy(() => import("./pages/SavedPosts"))
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"))
const ResetPassword = lazy(() => import("./pages/ResetPassword"))

// Loading component
const LoadingPage = () => (
  <div className="flex justify-center items-center min-h-screen">
    <span className="loading loading-spinner loading-lg"></span>
  </div>
)

function App() {
  const { loadFromStorage, user } = useAuthStore()
  const { initializeSocket: initializeChatSocket, disconnectSocket: disconnectChatSocket } = useChatStore()
  const { initializeSocket: initializePostSocket, disconnectSocket: disconnectPostSocket } = usePostStore()
  const [authLoaded, setAuthLoaded] = useState(false)


    useEffect(() => {
    const setupKeys = async () => {
      try {
        let privateKey = await keyStore.get('privateKey');
        if (!privateKey) {
          console.log("No keys found, generating new key pair...");
          const keyPair = await generateKeyPair();
          await keyStore.set('privateKey', keyPair.privateKey);
          await keyStore.set('publicKey', keyPair.publicKey);

          const exportedPublicKey = await exportKey(keyPair.publicKey);
          // Assuming your API client is setup to include auth token
          await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/users/keys/upload`, {
            publicKey: JSON.stringify(exportedPublicKey),
          });
          console.log("Public key uploaded successfully.");
        }
      } catch (error) {
        console.error("Key setup failed:", error);
        toast.error("Could not set up secure keys for chat.");
      }
    };

    if (user) {
      initializeChatSocket();
      initializePostSocket();
      setupKeys(); // Run key setup when user is logged in
    } else {
      disconnectChatSocket();
      disconnectPostSocket();
    }
    // ...
  }, [user]);






  useEffect(() => {
    loadFromStorage().then(() => setAuthLoaded(true))
  }, [loadFromStorage])

  useEffect(() => {
    if (user) {
      initializeChatSocket()
      initializePostSocket()
    } else {
      disconnectChatSocket()
      disconnectPostSocket()
    }

    return () => {
      disconnectChatSocket()
      disconnectPostSocket()
    }
  }, [user, initializeChatSocket, disconnectChatSocket, initializePostSocket, disconnectPostSocket])

  if (!authLoaded) {
    return <LoadingPage />
  }

  return (
    <div className="min-h-screen bg-base-100">
      <Router>
        <Suspense fallback={<LoadingPage />}>
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/feed" /> : <Login />} />
            <Route path="/signup" element={user ? <Navigate to="/feed" /> : <Signup />} />
            <Route path="/verify-otp" element={<OtpVerification />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/feed" />} />
              <Route path="feed" element={<Feed />} />
              <Route path="post/:id" element={<PostDetail />} />
              <Route path="profile/:id" element={<Profile />} />
              <Route path="edit-profile" element={<EditProfile />} />
              <Route path="chat" element={<ChatList />} />
              <Route path="chat/:roomId" element={<ChatRoom />} />
              <Route path="groups" element={<Groups />} />
              <Route path="search" element={<Search />} />
              <Route path="saved-posts" element={<SavedPosts />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "var(--fallback-b1,oklch(var(--b1)/1))",
            color: "var(--fallback-bc,oklch(var(--bc)/1))",
          },
        }}
      />
    </div>
  )
}

export default App
