import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import api from '../services/api'

const getStoredUser = () => {
  const rawUser = localStorage.getItem('carebridgeUser')

  if (!rawUser) {
    return null
  }

  try {
    return JSON.parse(rawUser)
  } catch {
    localStorage.removeItem('carebridgeUser')
    return null
  }
}

const formatMessageTime = (value) => new Date(value).toLocaleTimeString([], {
  hour: '2-digit',
  minute: '2-digit',
})

const socketBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')

function Chat() {
  const { appointmentId } = useParams()
  const user = getStoredUser()
  const [appointment, setAppointment] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const socketRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    const loadChat = async () => {
      try {
        setLoading(true)
        const { data } = await api.get(`/chat/appointments/${appointmentId}/messages`)
        setAppointment(data.appointment)
        setMessages(data.messages || [])
      } catch (apiError) {
        setError(apiError.response?.data?.message || 'Unable to load this chat conversation.')
      } finally {
        setLoading(false)
      }
    }

    loadChat()
  }, [appointmentId])

  useEffect(() => {
    if (loading || error) {
      return undefined
    }

    const token = localStorage.getItem('carebridgeToken')

    if (!token) {
      return undefined
    }

    const socket = io(socketBaseUrl, {
      auth: { token },
      transports: ['websocket'],
    })

    socketRef.current = socket

    socket.emit('join_room', { appointmentId }, (response) => {
      if (!response?.ok) {
        setError(response?.message || 'Unable to join the real-time chat room.')
      }
    })

    socket.on('receive_message', (incomingMessage) => {
      setMessages((current) => {
        const matchedTempIndex = current.findIndex(
          (item) => item.clientTempId && item.clientTempId === incomingMessage.clientTempId,
        )

        if (matchedTempIndex >= 0) {
          const nextMessages = [...current]
          nextMessages[matchedTempIndex] = {
            ...incomingMessage,
            isOwnMessage: String(incomingMessage.senderId) === String(user?.id),
          }
          return nextMessages
        }

        if (current.some((item) => item._id === incomingMessage._id)) {
          return current
        }

        return [
          ...current,
          {
            ...incomingMessage,
            isOwnMessage: String(incomingMessage.senderId) === String(user?.id),
          },
        ]
      })
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [appointmentId, error, loading, user?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const counterpart = appointment
    ? (String(appointment.patient?._id || appointment.patient?.id) === String(user?.id)
        ? appointment.doctor
        : appointment.patient)
    : null

  const handleSubmit = (event) => {
    event.preventDefault()

    const trimmedMessage = input.trim()

    if (!trimmedMessage || !socketRef.current) {
      return
    }

    setError('')
    setSending(true)

    const clientTempId = `temp-${Date.now()}`
    const optimisticMessage = {
      _id: clientTempId,
      clientTempId,
      appointmentId,
      senderId: user?.id,
      receiverId: counterpart?._id || counterpart?.id || '',
      senderName: user?.name || 'You',
      message: trimmedMessage,
      createdAt: new Date().toISOString(),
      isOwnMessage: true,
    }

    setMessages((current) => [...current, optimisticMessage])
    setInput('')

    socketRef.current.emit('send_message', {
      appointmentId,
      message: trimmedMessage,
      clientTempId,
    }, (response) => {
      setSending(false)

      if (!response?.ok) {
        setMessages((current) => current.filter((item) => item.clientTempId !== clientTempId))
        setInput(trimmedMessage)
        setError(response?.message || 'Unable to send your message right now.')
      }
    })
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#eff6ff_0%,_#f0fdf4_100%)] px-4">
        <p className="text-slate-600">Loading chat...</p>
      </main>
    )
  }

  if (error && !appointment) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#eff6ff_0%,_#f0fdf4_100%)] px-4">
        <div className="w-full max-w-xl rounded-[2rem] border border-rose-200 bg-white p-6 text-center shadow-xl shadow-rose-100/60 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-700">Chat Unavailable</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">This conversation cannot be opened</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">{error}</p>
          <Link to="/" className="mt-6 inline-flex rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700">
            Back to dashboard
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_24%),linear-gradient(180deg,_#eff6ff_0%,_#ecfeff_45%,_#f0fdf4_100%)] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <Link
          to={user?.role === 'doctor' ? '/doctor/appointments' : '/patient/dashboard'}
          className="inline-flex text-sm font-semibold text-sky-700 transition hover:text-sky-800"
        >
          Back to appointments
        </Link>

        <section className="mt-5 overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-2xl shadow-sky-100/70">
          <header className="border-b border-sky-100 bg-[linear-gradient(135deg,_#2563eb,_#16a34a)] px-5 py-5 text-white sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-50">CareBridge Chat</p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight">
                  {counterpart?.name || 'Healthcare conversation'}
                </h1>
                <p className="mt-2 text-sm text-blue-50">
                  Appointment on {appointment?.date ? new Date(appointment.date).toLocaleDateString() : 'scheduled date'} at {appointment?.time || 'scheduled time'}
                </p>
              </div>
              <div className="rounded-2xl bg-white/15 px-4 py-3 text-sm">
                <p className="font-semibold capitalize">{appointment?.status}</p>
                <p className="mt-1 text-blue-50">{user?.role === 'doctor' ? 'Doctor view' : 'Patient view'}</p>
              </div>
            </div>
          </header>

          <div className="h-[65vh] min-h-[26rem] overflow-y-auto bg-[linear-gradient(180deg,_rgba(239,246,255,0.8),_rgba(240,253,244,0.8))] px-4 py-5 sm:px-6">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message._id} className={`flex ${message.isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-[1.5rem] px-4 py-3 shadow-sm sm:max-w-[70%] ${
                    message.isOwnMessage
                      ? 'rounded-br-md bg-[linear-gradient(135deg,_#2563eb,_#0ea5e9)] text-white'
                      : 'rounded-bl-md border border-emerald-100 bg-white text-slate-800'
                  }`}>
                    <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${message.isOwnMessage ? 'text-blue-100' : 'text-emerald-700'}`}>
                      {message.isOwnMessage ? 'You' : message.senderName || 'CareBridge User'}
                    </p>
                    <p className={`mt-2 text-sm leading-7 ${message.isOwnMessage ? 'text-white' : 'text-slate-700'}`}>
                      {message.message}
                    </p>
                    <p className={`mt-2 text-[11px] ${message.isOwnMessage ? 'text-blue-100' : 'text-slate-400'}`}>
                      {formatMessageTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="border-t border-sky-100 bg-white px-4 py-4 sm:px-6">
            {error ? (
              <p className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </p>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm focus-within:border-sky-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-sky-100">
                <textarea
                  rows="2"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Type your message here..."
                  className="w-full resize-none border-none bg-transparent text-sm leading-6 text-slate-800 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#0284c7,_#16a34a)] px-6 text-sm font-semibold text-white shadow-lg shadow-sky-100 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}

export default Chat
