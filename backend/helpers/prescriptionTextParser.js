const frequencyMap = {
  OD: 'Once daily',
  BD: 'Twice daily',
  TDS: 'Three times daily',
  QID: 'Four times daily',
  HS: 'At bedtime',
  SOS: 'As needed',
  STAT: 'Immediately',
  OM: 'Every morning',
  ON: 'Every night',
  MWF: 'Monday, Wednesday, Friday',
}

const dosagePatterns = [
  /\b\d+(?:\.\d+)?\s?(?:mg|mcg|g|kg|ml|units?|iu|meq|drops?)\b/i,
  /\b\d+(?:\.\d+)?\s?(?:tab(?:let)?s?|caps?(?:ule)?s?|puffs?|sprays?|teaspoons?|tsp|spoons?)\b/i,
]
const durationPattern = /\b\d+\s?(?:day|days|week|weeks|month|months)\b/i
const schedulePattern = /\b[0-3]-[0-3]-[0-3]\b/
const sectionHeadingPattern = /^(?:doctor\s*\/\s*clinic info|prescription\s*\/\s*medicines|medicine suggestions|footer\s*\/\s*contact info|full page text)\s*:?\s*$/i
const linePrefixPattern = /^(?:\d+[.)-]?\s*|[-*]\s*)/
const leadingTokenPattern = /^(?:tab(?:let)?|cap(?:sule)?|syp|syrup|inj|rx|medicine|med)\s+/i
const instructionPattern = /\b(?:before food|after food|with food|after meals|before meals|empty stomach|at bedtime|bedtime|morning|night|afternoon|evening|after breakfast|after lunch|after dinner|with water|as needed)\b/gi
const noteNoisePattern = /\b(?:doctor|clinic|hospital|appointment|phone|email|road|street|floor|centre|complex)\b/i

const normalizeWhitespace = (value = '') => value.replace(/\s+/g, ' ').trim()

const uniqueList = (values = []) => [...new Set(values.filter(Boolean))]

const normalizeForCompare = (value = '') => value.toLowerCase().replace(/[^a-z0-9]+/g, '')

const toReadableFrequency = (rawValue = '') => {
  const normalized = rawValue.toUpperCase().replace(/[^A-Z]/g, '')
  return frequencyMap[normalized] || normalizeWhitespace(rawValue)
}

const describeSchedule = (scheduleText = '') => {
  const scheduleMap = {
    '1-0-1': 'Morning and night',
    '1-1-1': 'Three times daily',
    '1-0-0': 'Once daily in the morning',
    '0-0-1': 'Once daily at night',
    '0-1-0': 'Once daily in the afternoon',
    '1-1-0': 'Morning and afternoon',
    '0-1-1': 'Afternoon and night',
  }

  return scheduleMap[scheduleText] || scheduleText
}

const splitIntoLines = (value = '') => value
  .split('\n')
  .map((line) => normalizeWhitespace(line))
  .filter(Boolean)

const extractDosage = (line = '') => {
  for (const pattern of dosagePatterns) {
    const match = line.match(pattern)
    if (match) {
      return match[0]
    }
  }

  return ''
}

const extractDuration = (line = '') => line.match(durationPattern)?.[0] || ''

const extractFrequency = (line = '', fallback = '') => {
  const scheduleMatch = line.match(schedulePattern)
  if (scheduleMatch) {
    return describeSchedule(scheduleMatch[0])
  }

  const tokenMatches = line.match(/\b[A-Za-z]{2,4}\b/g) || []
  for (const token of tokenMatches) {
    const normalized = token.toUpperCase().replace(/[^A-Z]/g, '')
    if (frequencyMap[normalized]) {
      return frequencyMap[normalized]
    }
  }

  const naturalLanguagePatterns = [
    [/\bonce daily\b|\bonce a day\b/i, 'Once daily'],
    [/\btwice daily\b|\btwice a day\b/i, 'Twice daily'],
    [/\bthree times daily\b|\bthrice daily\b/i, 'Three times daily'],
    [/\bfour times daily\b/i, 'Four times daily'],
    [/\bevery morning\b/i, 'Every morning'],
    [/\bevery night\b/i, 'Every night'],
    [/\bat bedtime\b/i, 'At bedtime'],
    [/\bas needed\b/i, 'As needed'],
  ]

  for (const [pattern, label] of naturalLanguagePatterns) {
    if (pattern.test(line)) {
      return label
    }
  }

  return toReadableFrequency(fallback)
}

const extractInstructions = (line = '') => uniqueList(
  Array.from(line.matchAll(instructionPattern), (match) => normalizeWhitespace(match[0].toLowerCase())),
)

const removeKnownFragments = (line = '', fragments = []) => {
  let cleaned = line
  for (const fragment of fragments.filter(Boolean)) {
    cleaned = cleaned.replace(fragment, ' ')
  }

  return cleaned
}

const normalizePrescriptionLine = (line = '') => {
  const normalized = normalizeWhitespace(line)

  if (!normalized) {
    return ''
  }

  if (sectionHeadingPattern.test(normalized)) {
    return ''
  }

  const withoutPrefix = normalized.replace(linePrefixPattern, '')
  const chosenSegment = withoutPrefix.includes('| OCR:')
    ? withoutPrefix.split('| OCR:')[0]
    : withoutPrefix

  return normalizeWhitespace(chosenSegment)
}

const sanitizeMedicineName = (line, dosage, duration, frequency, instructionMatches = []) => {
  let cleaned = normalizePrescriptionLine(line)
    .replace(leadingTokenPattern, '')
    .replace(schedulePattern, ' ')

  cleaned = removeKnownFragments(cleaned, [dosage, duration, frequency, ...instructionMatches])

  cleaned = cleaned
    .replace(/[|:,]/g, ' ')
    .replace(/\b(?:take|for|x|days?|daily|tablet|tablets|capsule|capsules|syrup|inj(?:ection)?|ml|mg)\b/gi, ' ')

  const words = normalizeWhitespace(cleaned)
    .split(' ')
    .filter((word) => /^[A-Za-z][A-Za-z0-9-]*$/.test(word))

  return words.slice(0, 5).join(' ').trim()
}

const isLikelyMedicineLine = (line = '', linkedRow = null) => {
  const normalized = normalizePrescriptionLine(line)

  if (!normalized || noteNoisePattern.test(normalized)) {
    return false
  }

  const hasMedicineSignal = Boolean(
    linkedRow?.suggestedMedicine
    || extractDosage(normalized)
    || extractDuration(normalized)
    || extractFrequency(normalized)
    || schedulePattern.test(normalized)
    || /\b(?:tab|tablet|cap|capsule|syp|syrup|inj|drop|drops)\b/i.test(normalized),
  )

  if (hasMedicineSignal) {
    return true
  }

  return /^[A-Za-z][A-Za-z0-9-]*(?:\s+[A-Za-z0-9-]+){0,3}$/.test(normalized)
}

const buildCandidateLines = (ocrPayload = {}) => {
  const rawMedicineRows = Array.isArray(ocrPayload.medicineRows) ? ocrPayload.medicineRows : []

  if (rawMedicineRows.length) {
    return rawMedicineRows
      .map((row) => ({
        line: normalizeWhitespace(row.rawText || row.suggestedMedicine || ''),
        row,
      }))
      .filter(({ line, row }) => isLikelyMedicineLine(line, row))
  }

  const primaryText = ocrPayload.correctedPrescriptionText
    || ocrPayload.prescriptionText
    || ocrPayload.text
    || ocrPayload.fullText
    || ''

  return splitIntoLines(primaryText)
    .filter((line) => isLikelyMedicineLine(line))
    .map((line) => ({ line, row: null }))
}

const dedupeMedicines = (medicines = []) => {
  const seen = new Set()

  return medicines.filter((medicine) => {
    const key = [
      normalizeForCompare(medicine.name),
      normalizeForCompare(medicine.dosage),
      normalizeForCompare(medicine.frequency),
      normalizeForCompare(medicine.duration),
    ].join('|')

    if (!medicine.name || seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

const parseMedicineLine = ({ line, row }) => {
  const normalizedLine = normalizePrescriptionLine(line)
  if (!normalizedLine) {
    return null
  }

  const dosage = extractDosage(normalizedLine)
  const duration = extractDuration(normalizedLine)
  const frequency = extractFrequency(normalizedLine, row?.frequency || '')
  const instructionMatches = extractInstructions(normalizedLine)
  const suggestedMedicine = normalizeWhitespace(row?.suggestedMedicine || '')
  const suggestionConfidence = Number(row?.suggestionConfidence || 0)
  const rawConfidence = Number(row?.confidence || 0)

  let name = sanitizeMedicineName(normalizedLine, dosage, duration, frequency, instructionMatches)

  if (suggestedMedicine && (
    suggestionConfidence >= 78
    || !name
    || name.length < 4
  )) {
    name = suggestedMedicine
  }

  name = normalizeWhitespace(name)

  if (!name || noteNoisePattern.test(name)) {
    return null
  }

  const reviewReasons = []
  if (!dosage) reviewReasons.push('Dosage not detected')
  if (!frequency) reviewReasons.push('Frequency not detected')
  if (!duration) reviewReasons.push('Duration not detected')
  if (suggestedMedicine && suggestionConfidence > 0 && suggestionConfidence < 78) {
    reviewReasons.push('Medicine name confidence is low')
  }
  if (!suggestedMedicine && rawConfidence > 0 && rawConfidence < 70) {
    reviewReasons.push('OCR text confidence is low')
  }

  const completenessBonus = [dosage, frequency, duration].filter(Boolean).length * 8
  const confidence = Math.max(
    25,
    Math.min(
      99,
      Math.round(((suggestionConfidence || rawConfidence || 55) * 0.7) + completenessBonus),
    ),
  )

  return {
    name,
    dosage,
    frequency,
    duration,
    instructions: instructionMatches.join(', '),
    confidence,
    sourceText: normalizedLine,
    needsReview: reviewReasons.length > 0,
    reviewReasons,
  }
}

export const parsePrescriptionText = (ocrPayload = {}) => {
  const primaryText = ocrPayload.correctedPrescriptionText
    || ocrPayload.prescriptionText
    || ocrPayload.text
    || ocrPayload.fullText
    || ''

  const medicines = dedupeMedicines(
    buildCandidateLines(ocrPayload)
      .map(parseMedicineLine)
      .filter(Boolean),
  )

  const noteSections = [
    ocrPayload.doctorInfo,
    ocrPayload.footerText,
  ]
    .flatMap((section) => splitIntoLines(section || ''))
    .filter((line) => !sectionHeadingPattern.test(line))

  const reviewFlags = uniqueList([
    medicines.length ? '' : 'No medicines were confidently extracted. Manual review is required.',
    ...medicines
      .filter((medicine) => medicine.needsReview)
      .map((medicine) => `${medicine.name}: ${medicine.reviewReasons.join(', ')}`),
  ])

  const safetySummary = uniqueList([
    'Use the scan as a review aid only. Confirm medicine names and directions with a doctor or pharmacist before taking or changing treatment.',
    medicines.some((medicine) => medicine.needsReview)
      ? 'One or more medicines have missing or low-confidence details. Review the original prescription carefully before verification.'
      : '',
    !ocrPayload.bodyAverageConfidence || ocrPayload.bodyAverageConfidence < 75
      ? 'The prescription image appears harder to read than ideal. A clearer, flatter, well-lit photo can improve accuracy.'
      : '',
  ])

  return {
    extractedText: splitIntoLines(primaryText).join('\n'),
    medicines,
    notes: noteSections.join('\n'),
    reviewFlags,
    safetySummary,
  }
}
