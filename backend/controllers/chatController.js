const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const FALLBACK_MODEL = 'openai/gpt-4o-mini'

const buildSystemPrompt = ({ role, name }) => {
  const safeName = name || 'CareBridge user'

  if (role === 'doctor') {
    return [
      'You are CareBridge Assistant, a helpful AI copilot for a healthcare web application.',
      `The logged-in user is Dr. or clinician named ${safeName}.`,
      'Your audience is a doctor, so respond with clinically organized, concise, practical support.',
      'Help with patient summaries, documentation structure, prescription wording, follow-up planning, and workflow support.',
      'Do not fabricate patient data or lab values.',
      'Do not claim to have reviewed attachments or reports unless the user described them in text.',
      'If the request is high-risk or requires formal diagnosis, recommend clinical judgment and official review.',
      'Keep answers clear, well-structured, and useful inside a healthcare product UI.',
    ].join(' ')
  }

  return [
    'You are CareBridge Assistant, a helpful AI copilot for a healthcare web application.',
    `The logged-in user is a patient named ${safeName}.`,
    'Respond in simple, supportive language and avoid jargon when possible.',
    'Help explain prescriptions, general health guidance, appointment preparation, and finding the right doctor type.',
    'Do not provide emergency-only reassurance. If symptoms sound urgent, tell the user to contact a doctor or emergency services.',
    'Do not claim to interpret medical images directly unless the user has provided text details.',
    'Do not present your response as a medical diagnosis.',
    'Keep the answer warm, practical, and easy to understand.',
  ].join(' ')
}

const normalizeHistory = (history) => {
  if (!Array.isArray(history)) {
    return []
  }

  return history
    .filter((item) => item && typeof item.text === 'string' && item.text.trim())
    .slice(-8)
    .map((item) => ({
      role: item.sender === 'bot' ? 'assistant' : 'user',
      content: item.text.trim(),
    }))
}

const extractAssistantReply = (data) => {
  const content = data?.choices?.[0]?.message?.content

  if (typeof content === 'string' && content.trim()) {
    return content.trim()
  }

  if (Array.isArray(content)) {
    const textParts = content
      .map((item) => (item?.type === 'text' ? item.text : ''))
      .filter(Boolean)
      .join(' ')
      .trim()

    if (textParts) {
      return textParts
    }
  }

  return ''
}

export const sendChatMessage = async (req, res) => {
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : ''
  const role = req.user?.role || req.body.role || 'patient'
  const context = typeof req.body.context === 'string'
    ? (() => {
        try {
          return JSON.parse(req.body.context)
        } catch {
          return {}
        }
      })()
    : (req.body.context || {})
  const history = typeof req.body.history === 'string'
    ? (() => {
        try {
          return JSON.parse(req.body.history)
        } catch {
          return []
        }
      })()
    : (req.body.history || [])

  if (!message && !req.file) {
    return res.status(400).json({
      message: 'Message text or image is required',
    })
  }

  if (req.file && !message) {
    return res.json({
      reply: `Image received${context?.name ? `, ${context.name}` : ''}. Processing prescription...`,
      meta: {
        role,
        mode: 'image',
        readyForAiProvider: true,
      },
    })
  }

  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    return res.status(500).json({
      message: 'OpenRouter API key is not configured on the backend.',
    })
  }

  const model = process.env.OPENROUTER_MODEL || FALLBACK_MODEL
  const messages = [
    {
      role: 'system',
      content: buildSystemPrompt({
        role,
        name: context?.name || req.user?.name,
      }),
    },
    ...normalizeHistory(history),
    ...(req.file ? [{
      role: 'user',
      content: 'The user uploaded a medical image in the chat, but image analysis is not enabled yet. Be transparent about that limitation and answer only from the text context provided.',
    }] : []),
    {
      role: 'user',
      content: message,
    },
  ]

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:5173',
        'X-Title': 'CareBridge',
      },
      body: JSON.stringify({
        model,
        temperature: 0.5,
        max_tokens: 300,
        messages,
        user: req.user?._id?.toString?.() || undefined,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json({
        message: data?.error?.message || data?.message || 'OpenRouter request failed.',
      })
    }

    const reply = extractAssistantReply(data)

    if (!reply) {
      return res.status(502).json({
        message: 'The AI service returned an empty response.',
      })
    }

    return res.json({
      reply,
      meta: {
        role,
        mode: 'text',
        model: data.model || model,
        readyForAiProvider: true,
      },
    })
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Unable to contact the AI service right now.',
    })
  }
}
