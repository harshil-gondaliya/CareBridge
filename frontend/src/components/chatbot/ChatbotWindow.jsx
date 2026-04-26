import { useEffect, useRef, useState } from 'react'
import api from '../../services/api'
import ChatMessage from './ChatMessage'

const createTimestamp = () => new Date().toLocaleTimeString([], {
  hour: '2-digit',
  minute: '2-digit',
})

const buildWelcomeMessage = (user) => ({
  id: `welcome-${user?.role || 'guest'}`,
  sender: 'bot',
  type: 'text',
  text: `Hello ${user?.name || 'there'}, how can I help you today?`,
  timestamp: createTimestamp(),
})

function ChatbotWindow({ isOpen, onClose, user }) {
  const [messages, setMessages] = useState(() => [buildWelcomeMessage(user)])
  const [input, setInput] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    setMessages([buildWelcomeMessage(user)])
  }, [user])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setSpeechSupported(false)
      return undefined
    }

    setSpeechSupported(true)

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || '')
        .join(' ')
        .trim()

      setInput(transcript)
    }

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.stop()
      recognitionRef.current = null
    }
  }, [])

  useEffect(() => () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setSelectedImage(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const clearSelectedImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setSelectedImage(null)
    setPreviewUrl('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const sendMessage = async () => {
    const trimmedInput = input.trim()

    if (!trimmedInput && !selectedImage) {
      return
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      type: selectedImage ? 'image' : 'text',
      text: trimmedInput || 'Shared an image for review.',
      imagePreview: previewUrl,
      timestamp: createTimestamp(),
    }

    setMessages((current) => [...current, userMessage])
    setInput('')
    setLoading(true)

    try {
      let response

      if (selectedImage) {
        const formData = new FormData()
        formData.append('image', selectedImage)
        formData.append('message', trimmedInput)
        formData.append('role', user.role)
        formData.append('context', JSON.stringify({
          name: user.name,
          role: user.role,
        }))
        formData.append('history', JSON.stringify(messages))

        response = await api.post('/chat', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      } else {
        response = await api.post('/chat', {
          message: trimmedInput,
          role: user.role,
          context: {
            name: user.name,
            role: user.role,
          },
          history: messages,
        })
      }

      setMessages((current) => [
        ...current,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          type: 'text',
          text: response.data.reply,
          timestamp: createTimestamp(),
        },
      ])
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `bot-error-${Date.now()}`,
          sender: 'bot',
          type: 'text',
          text: error.response?.data?.message || 'The assistant is temporarily unavailable. Please try again shortly.',
          timestamp: createTimestamp(),
        },
      ])
    } finally {
      setLoading(false)
      clearSelectedImage()
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    await sendMessage()
  }

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      return
    }

    recognitionRef.current.start()
  }

  return (
    <div
      className={`fixed bottom-24 right-6 z-40 w-[calc(100vw-2rem)] max-w-sm origin-bottom-right transition duration-300 sm:max-w-md ${
        isOpen ? 'pointer-events-auto scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
      }`}
    >
      <section className="overflow-hidden rounded-[2rem] border border-sky-100 bg-[linear-gradient(180deg,_rgba(239,246,255,0.98)_0%,_rgba(240,253,244,0.98)_100%)] shadow-2xl shadow-sky-200/60 backdrop-blur-xl">
        <header className="flex items-start justify-between gap-4 bg-[linear-gradient(135deg,_#2563eb,_#16a34a)] px-5 py-4 text-white">
          <div>
            <p className="text-lg font-bold tracking-tight">CareBridge Assistant</p>
            <p className="mt-1 text-xs uppercase tracking-[0.24em] text-blue-50">
              {user.role === 'doctor' ? 'Doctor support' : 'Patient support'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25"
            aria-label="Close chatbot"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path fill="currentColor" d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.29 19.7 2.88 18.3 9.17 12 2.88 5.71 4.29 4.3l6.3 6.29 6.29-6.3z" />
            </svg>
          </button>
        </header>

        <div className="h-96 overflow-y-auto px-4 py-4">
          <div className="space-y-3">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                sender={message.sender}
                type={message.type}
              />
            ))}
            {loading ? (
              <div className="flex justify-start">
                <div className="rounded-[1.5rem] rounded-bl-md border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                  CareBridge Assistant is typing...
                </div>
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="border-t border-sky-100 bg-white/70 p-4">
          {previewUrl ? (
            <div className="mb-3 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3">
              <div className="flex items-start gap-3">
                <img src={previewUrl} alt="Selected upload" className="h-16 w-16 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{selectedImage?.name}</p>
                  <p className="mt-1 text-xs text-slate-500">Image ready to send for mock assistant processing.</p>
                </div>
                <button
                  type="button"
                  onClick={clearSelectedImage}
                  className="rounded-full bg-white p-2 text-slate-500 shadow-sm transition hover:text-rose-600"
                  aria-label="Remove selected image"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                    <path fill="currentColor" d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.29 19.7 2.88 18.3 9.17 12 2.88 5.71 4.29 4.3l6.3 6.29 6.29-6.3z" />
                  </svg>
                </button>
              </div>
            </div>
          ) : null}

          <div className="flex items-end gap-3">
            <label className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-700 transition hover:bg-sky-100">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleImageChange}
                className="hidden"
              />
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path fill="currentColor" d="M19 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m0 12H5V7h14zM8.5 11A1.5 1.5 0 1 0 7 9.5 1.5 1.5 0 0 0 8.5 11m1.5 2-2 2.5h8L13.5 12 10 16.5z" />
              </svg>
            </label>

            <div className="flex-1 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-2 shadow-sm focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-100">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={user.role === 'doctor' ? 'Ask for documentation or prescription help...' : 'Ask about care, prescriptions, or doctors...'}
                className="h-8 w-full border-none bg-transparent text-sm text-slate-800 outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleMicClick}
              disabled={!speechSupported || loading}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition ${
                isListening
                  ? 'border-emerald-300 bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                  : 'border-slate-200 bg-white text-slate-600 shadow-sm hover:border-sky-200 hover:text-sky-700'
              } disabled:cursor-not-allowed disabled:opacity-50`}
              aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
              title={speechSupported ? (isListening ? 'Listening...' : 'Use microphone') : 'Speech input is not supported in this browser'}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path fill="currentColor" d="M12 15a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3m5-3a1 1 0 1 1 2 0 7 7 0 0 1-6 6.93V21h3a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2h3v-2.07A7 7 0 0 1 5 12a1 1 0 1 1 2 0 5 5 0 0 0 10 0" />
              </svg>
            </button>

            <button
              type="submit"
              disabled={loading || (!input.trim() && !selectedImage)}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#2563eb,_#16a34a)] text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Send message"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path fill="currentColor" d="M3.4 20.4 20.85 12 3.4 3.6 3.37 10l12.5 2-12.5 2z" />
              </svg>
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default ChatbotWindow
