function ChatMessage({ message, sender, type }) {
  const isUser = sender === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-[1.5rem] px-4 py-3 shadow-sm ${
          isUser
            ? 'rounded-br-md bg-[linear-gradient(135deg,_#2563eb,_#0ea5e9)] text-white'
            : 'rounded-bl-md border border-emerald-100 bg-white text-slate-800'
        }`}
      >
        {type === 'image' && message.imagePreview ? (
          <img
            src={message.imagePreview}
            alt={message.text || 'Uploaded medical image'}
            className="mb-3 max-h-52 w-full rounded-2xl object-cover"
          />
        ) : null}
        {message.text ? (
          <p className={`text-sm leading-6 ${isUser ? 'text-white' : 'text-slate-700'}`}>{message.text}</p>
        ) : null}
        <p className={`mt-2 text-[11px] font-medium ${isUser ? 'text-blue-100' : 'text-slate-400'}`}>
          {message.timestamp}
        </p>
      </div>
    </div>
  )
}

export default ChatMessage
