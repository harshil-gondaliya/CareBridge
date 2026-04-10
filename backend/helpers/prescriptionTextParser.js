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
}

const dosagePattern = /\b\d+(?:\.\d+)?\s?(?:mg|mcg|g|ml|units?)\b/i
const durationPattern = /\b\d+\s?(?:day|days|week|weeks|month|months)\b/i
const leadingTokenPattern = /^(?:tab(?:let)?|cap(?:sule)?|syp|inj|rx|medicine|med)\s+/i

const normalizeWhitespace = (value = '') => value.replace(/\s+/g, ' ').trim()

const toReadableFrequency = (rawValue = '') => {
  const normalized = rawValue.toUpperCase().replace(/[^A-Z]/g, '')
  return frequencyMap[normalized] || rawValue.trim()
}

const extractFrequency = (line) => {
  const tokens = line.split(/[\s,|/-]+/)

  for (const token of tokens) {
    const normalized = token.toUpperCase().replace(/[^A-Z]/g, '')
    if (frequencyMap[normalized]) {
      return frequencyMap[normalized]
    }
  }

  const scheduleMatch = line.match(/\b\d-\d-\d\b/)

  if (!scheduleMatch) {
    return ''
  }

  const scheduleText = scheduleMatch[0]

  if (scheduleText === '1-0-1') {
    return 'Morning and night'
  }

  if (scheduleText === '1-1-1') {
    return 'Three times daily'
  }

  if (scheduleText === '1-0-0') {
    return 'Once daily in the morning'
  }

  if (scheduleText === '0-0-1') {
    return 'Once daily at night'
  }

  return scheduleText
}

const sanitizeMedicineName = (line, dosage, duration, frequency) => {
  let cleaned = normalizeWhitespace(line)
    .replace(leadingTokenPattern, '')
    .replace(dosage || '', '')
    .replace(duration || '', '')
    .replace(/\b\d-\d-\d\b/i, '')

  if (frequency) {
    const shorthand = Object.entries(frequencyMap).find(([, readable]) => readable === frequency)?.[0]
    if (shorthand) {
      cleaned = cleaned.replace(new RegExp(`\\b${shorthand}\\b`, 'i'), '')
    }
  }

  cleaned = cleaned
    .replace(/[|:,]/g, ' ')
    .replace(/\b(before|after|food|meals|daily|days?)\b/gi, ' ')

  const words = normalizeWhitespace(cleaned).split(' ')
  return words.slice(0, 4).join(' ').trim()
}

export const parsePrescriptionText = (ocrPayload = {}) => {
  const sourceText = [
    ocrPayload.correctedPrescriptionText,
    ocrPayload.prescriptionText,
    ocrPayload.text,
    ocrPayload.fullText,
  ]
    .filter(Boolean)
    .join('\n')

  const lines = sourceText
    .split('\n')
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean)

  const rawMedicineRows = Array.isArray(ocrPayload.medicineRows)
    ? ocrPayload.medicineRows
    : []

  const candidateLines = rawMedicineRows.length
    ? rawMedicineRows.map((row) => normalizeWhitespace(row.rawText || row.suggestedMedicine || ''))
    : lines

  const medicines = candidateLines
    .map((line, index) => {
      const linkedRow = rawMedicineRows[index]
      const dosage = line.match(dosagePattern)?.[0] || ''
      const duration = line.match(durationPattern)?.[0] || ''
      const frequency = extractFrequency(line) || toReadableFrequency(linkedRow?.frequency || '')
      const parsedName = linkedRow?.suggestedMedicine || sanitizeMedicineName(line, dosage, duration, frequency)

      if (!parsedName) {
        return null
      }

      return {
        name: parsedName,
        dosage,
        frequency,
        duration,
      }
    })
    .filter((medicine) => medicine && medicine.name)

  const notes = normalizeWhitespace([
    ocrPayload.doctorInfo,
    ocrPayload.footerText,
  ].filter(Boolean).join('\n'))

  return {
    extractedText: normalizeWhitespace(sourceText.replace(/\n{2,}/g, '\n')),
    medicines,
    notes,
  }
}
