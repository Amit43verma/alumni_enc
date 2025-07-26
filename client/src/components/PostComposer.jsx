"use client"

import { useState, useRef, useEffect } from "react"
import { ImageIcon, Video, X, Smile } from "lucide-react"
import { usePostStore } from "../store/postStore"
import { useAuthStore } from "../store/authStore"
import ReactQuill from "react-quill"
import "react-quill/dist/quill.snow.css"
import Picker from "@emoji-mart/react"

const PostComposer = () => {
  const { createPost } = usePostStore()
  const { user } = useAuthStore()
  const [content, setContent] = useState("")
  const [textLength, setTextLength] = useState(0)
  const [mediaFiles, setMediaFiles] = useState([])
  const [mediaPreviews, setMediaPreviews] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const quillRef = useRef(null)
  const emojiPickerRef = useRef(null)
  const emojiButtonRef = useRef(null)

  useEffect(() => {
    const tooltips = {
      ".ql-header": "Text Styles",
      ".ql-bold": "Bold (Ctrl+B)",
      ".ql-italic": "Italic (Ctrl+I)",
      ".ql-underline": "Underline (Ctrl+U)",
      ".ql-list[value='bullet']": "Bulleted List",
      ".ql-list[value='ordered']": "Numbered List",
      ".ql-link": "Insert Link",
      ".ql-image": "Insert Image",
    };

    const quillEditor = quillRef.current;
    if (quillEditor) {
      const toolbar = quillEditor.getEditor().getModule("toolbar").container;
      Object.entries(tooltips).forEach(([selector, tip]) => {
        const button = toolbar.querySelector(selector);
        if (button) {
          button.classList.add('tooltip', 'tooltip-bottom');
          button.setAttribute('data-tip', tip);
        }
      });
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target)
      ) {
        setShowEmoji(false);
      }
    }

    function handleEscapeKey(event) {
        if (event.key === 'Escape') {
            setShowEmoji(false);
        }
    }

    if (showEmoji) {
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscapeKey);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [showEmoji]);

  const handleTextChange = (value, delta, source, editor) => {
    setContent(value);
    setTextLength(editor.getText().length - 1); // -1 to account for Quill's trailing newline
  };

  const handleMediaSelect = (e) => {
    const files = Array.from(e.target.files)
    const newFiles = [...mediaFiles, ...files]
    setMediaFiles(newFiles)

    // Create previews
    const newPreviews = [...mediaPreviews]
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        newPreviews.push({
          file,
          url: e.target.result,
          type: file.type.startsWith("image/") ? "image" : "video",
        })
        setMediaPreviews([...newPreviews])
      }
      reader.readAsDataURL(file)
    })
    setShowEmoji(false)
  }

  const removeMedia = (index) => {
    const newFiles = mediaFiles.filter((_, i) => i !== index)
    const newPreviews = mediaPreviews.filter((_, i) => i !== index)
    setMediaFiles(newFiles)
    setMediaPreviews(newPreviews)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.replace(/<(.|\n)*?>/g, "").trim() && mediaFiles.length === 0) {
      return
    }
    setIsSubmitting(true)
    const result = await createPost(content, mediaFiles)
    if (result.success) {
      setContent("")
      setTextLength(0)
      setMediaFiles([])
      setMediaPreviews([])
    }
    setIsSubmitting(false)
  }

  const handleEmojiSelect = (emoji) => {
    const quill = quillRef.current.getEditor()
    const range = quill.getSelection(true)
    quill.insertText(range.index, emoji.native)
    setShowEmoji(false)
  }

  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ 'list': 'bullet' }, { 'list': 'ordered' }],
        ['link'],
      ],
    },
    history: {
      delay: 500,
      maxStack: 100,
      userOnly: true,
    },
  };

  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          {/* User Info */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="avatar">
              <div className="w-10 h-10 rounded-full">
                <img src={user?.avatarUrl || "/placeholder.svg?height=40&width=40"} alt={user?.name} />
              </div>
            </div>
            <div>
              <div className="font-semibold">{user?.name}</div>
              <div className="text-sm text-base-content/60">
                {user?.batch} • {user?.center}
              </div>
            </div>
          </div>

          {/* Content Input */}
          <div className="relative mb-2">
            <ReactQuill
              ref={quillRef}
              value={content}
              onChange={handleTextChange}
              placeholder="What's on your mind?"
              modules={modules}
              theme="snow"
              maxLength={2000}
            />
          </div>

          {/* Character Count */}
          <div className="text-right text-sm text-base-content/60 mt-1">
            {textLength}/2000
          </div>

          {/* Media Previews */}
          {mediaPreviews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
              {mediaPreviews.map((preview, index) => (
                <div key={index} className="relative">
                  {preview.type === "image" ? (
                    <img
                      src={preview.url || "/placeholder.svg"}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ) : (
                    <video src={preview.url} className="w-full h-32 object-cover rounded-lg" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="absolute -top-2 -right-2 btn btn-circle btn-sm btn-error"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Actions & Submit */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-1 relative">
              <label className="btn btn-ghost btn-sm" title="Add image">
                <ImageIcon size={18} />
                <input type="file" accept="image/*" multiple onChange={handleMediaSelect} className="hidden" />
              </label>

              <label className="btn btn-ghost btn-sm" title="Add video">
                <Video size={18} />
                <input type="file" accept="video/*" multiple onChange={handleMediaSelect} className="hidden" />
              </label>

              <button
                ref={emojiButtonRef}
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowEmoji((v) => !v)}
                title="Add emoji"
              >
                <Smile size={18} />
              </button>

              {showEmoji && (
                <div ref={emojiPickerRef} className="absolute z-50 top-full mt-2">
                  <Picker onEmojiSelect={handleEmojiSelect} theme="light" />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={(!content.replace(/<(.|\n)*?>/g, "").trim() && mediaFiles.length === 0) || isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Posting...
                </>
              ) : (
                "Post"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PostComposer
