function ChatbotButton({ isOpen, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isOpen ? 'Close CareBridge Assistant' : 'Open CareBridge Assistant'}
      className="fixed bottom-6 right-6 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg shadow-blue-300 transition duration-300 hover:scale-105 hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-200"
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
        <path fill="currentColor" d="M12 3C6.477 3 2 6.94 2 11.8c0 2.474 1.173 4.71 3.056 6.31L4 22l4.445-2.095c1.12.31 2.308.475 3.555.475 5.523 0 10-3.94 10-8.58S17.523 3 12 3m-4 10a1.25 1.25 0 1 1 0-2.5A1.25 1.25 0 0 1 8 13m4 0a1.25 1.25 0 1 1 0-2.5A1.25 1.25 0 0 1 12 13m4 0a1.25 1.25 0 1 1 0-2.5A1.25 1.25 0 0 1 16 13" />
      </svg>
    </button>
  )
}

export default ChatbotButton
