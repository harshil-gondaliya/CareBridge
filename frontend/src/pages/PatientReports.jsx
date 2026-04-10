import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'

function PatientReports() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [reports, setReports] = useState([])
  const [latestScan, setLatestScan] = useState(null)
  const [editableExtractedText, setEditableExtractedText] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true)
        const { data } = await api.get('/reports/my')
        setReports(data.reports || [])
      } catch (apiError) {
        setError(apiError.response?.data?.message || 'Unable to load scanned prescriptions.')
      } finally {
        setLoading(false)
      }
    }

    loadReports()
  }, [])

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl('')
      return undefined
    }

    const objectUrl = URL.createObjectURL(selectedFile)
    setPreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [selectedFile])

  const latestIsVerified = latestScan?.isVerified !== false

  const extractedLines = useMemo(() => (
    latestScan?.extractedText
      ? latestScan.extractedText.split('\n').filter(Boolean)
      : []
  ), [latestScan])

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    setError('')
    setSuccess('')
    setLatestScan(null)
    setEditableExtractedText('')
    setSelectedFile(file || null)
  }

  const handleScan = async () => {
    if (!selectedFile) {
      setError('Please choose a prescription image first.')
      return
    }

    try {
      setScanning(true)
      setError('')
      setSuccess('')

      const formData = new FormData()
      formData.append('image', selectedFile)

      const { data } = await api.post('/reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setLatestScan(data.report)
      setEditableExtractedText(data.report?.extractedText || '')
      setReports((current) => [data.report, ...current])
      setSuccess('Prescription scanned. Please edit extracted text and verify to generate final output.')
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to scan prescription image.')
    } finally {
      setScanning(false)
    }
  }

  const handleVerify = async () => {
    if (!latestScan?._id) {
      setError('No scan available to verify.')
      return
    }

    if (!editableExtractedText.trim()) {
      setError('Please keep at least some extracted text before verification.')
      return
    }

    try {
      setVerifying(true)
      setError('')
      setSuccess('')

      const { data } = await api.put(`/reports/${latestScan._id}/verify`, {
        extractedText: editableExtractedText,
      })

      setLatestScan(data.report)
      setReports((current) => current.map((report) => (
        report._id === data.report._id ? data.report : report
      )))
      setSuccess('Patient verified the text. Final output is now ready.')
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to verify and generate final output.')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_25%),linear-gradient(180deg,_#eff6ff_0%,_#ecfeff_45%,_#f0fdf4_100%)] px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-2xl shadow-sky-100/60">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">AI Prescription Scanner</p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">Upload handwritten prescriptions</h1>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Turn handwritten prescriptions into structured medicine records.
                CareBridge extracts text, identifies medicines, and stores the
                result in your medical history.
              </p>

              <div className="mt-8 rounded-[1.75rem] border border-dashed border-sky-200 bg-sky-50/80 p-6">
                <label className="block text-sm font-medium text-slate-700">Prescription Image</label>
                <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleFileChange} className="mt-3 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-sky-100 file:px-4 file:py-2 file:font-semibold file:text-sky-700" />

                <button type="button" onClick={handleScan} disabled={!selectedFile || scanning} className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#0284c7,_#16a34a)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-100 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70">
                  {scanning ? 'Scanning Prescription...' : 'Scan Prescription'}
                </button>

                {error ? <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
                {success ? <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-sky-100 bg-slate-50 p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Preview</p>
              <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-white bg-white">
                {previewUrl ? (
                  <img src={previewUrl} alt="Prescription preview" className="h-[24rem] w-full object-cover" />
                ) : (
                  <div className="flex h-[24rem] items-center justify-center bg-[linear-gradient(135deg,_rgba(2,132,199,0.12),_rgba(22,163,74,0.12))] px-8 text-center text-slate-500">
                    Upload a clear image of your prescription to preview it here.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {latestScan ? (
          <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-2xl shadow-sky-100/60">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-700">Latest Scan</p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
                {latestIsVerified ? 'Final verified output' : 'Review extracted text'}
              </h2>
            </div>

            {!latestIsVerified ? (
              <div className="mt-8 rounded-[1.5rem] border border-amber-200 bg-amber-50/70 p-6">
                <p className="text-xs uppercase tracking-[0.24em] text-amber-700">Step 1: Editable OCR Text</p>
                <p className="mt-3 text-sm text-amber-800">
                  Review and edit OCR text if needed. Then click verify to generate final medicines output.
                </p>
                <textarea
                  value={editableExtractedText}
                  onChange={(event) => setEditableExtractedText(event.target.value)}
                  className="mt-4 h-56 w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 focus:border-amber-400 focus:outline-none"
                  placeholder="Editable OCR text appears here after scanning..."
                />
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={verifying || scanning}
                  className="mt-5 inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#d97706,_#16a34a)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-100 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {verifying ? 'Verifying...' : 'Verify & Generate Final Output'}
                </button>
              </div>
            ) : (
              <div className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Verified Extracted Text</p>
                  <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                    {extractedLines.length ? extractedLines.map((line, index) => (
                      <p key={`${line}-${index}`}>{line}</p>
                    )) : (
                      <p>No OCR text was returned.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.5rem] border border-emerald-100 bg-[linear-gradient(180deg,_#f8fafc_0%,_#f0fdf4_100%)] p-6">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Structured Medicines</p>
                    <div className="mt-4 grid gap-4">
                      {latestScan?.medicines?.length ? latestScan.medicines.map((medicine, index) => (
                        <div key={`${medicine.name}-${index}`} className="rounded-2xl bg-white p-4 shadow-sm">
                          <p className="font-semibold text-slate-900">{medicine.name || 'Unnamed medicine'}</p>
                          <p className="mt-2 text-sm text-slate-600">Dosage: {medicine.dosage || 'Not detected'}</p>
                          <p className="mt-1 text-sm text-slate-600">Frequency: {medicine.frequency || 'Not detected'}</p>
                          <p className="mt-1 text-sm text-slate-600">Duration: {medicine.duration || 'Not detected'}</p>
                        </div>
                      )) : (
                        <div className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">
                          No medicines were confidently extracted from this verified text.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Notes</p>
                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      {latestScan?.notes || 'No additional notes were extracted from this prescription.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        ) : null}

        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-2xl shadow-sky-100/60">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Prescription History</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">Your scanned medical records</h2>
          </div>

          {loading ? (
            <p className="mt-8 text-slate-600">Loading scan history...</p>
          ) : reports.length ? (
            <div className="mt-8 grid gap-5">
              {reports.map((report) => {
                const isVerified = report.isVerified !== false

                return (
                  <article key={report._id} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Scanned On</p>
                        <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </h3>
                        <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {isVerified ? 'Verified' : 'Pending verification'}
                        </p>
                      </div>
                      <a href={report.imageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:-translate-y-0.5">
                        View Image
                      </a>
                    </div>

                    <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
                      <div className="rounded-2xl bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Medicines</p>
                        <div className="mt-3 space-y-3">
                          {isVerified && report.medicines?.length ? report.medicines.map((medicine, index) => (
                            <div key={`${report._id}-${medicine.name}-${index}`} className="rounded-2xl bg-slate-50 p-3">
                              <p className="font-semibold text-slate-900">{medicine.name || 'Unnamed medicine'}</p>
                              <p className="mt-1 text-sm text-slate-600">Dosage: {medicine.dosage || 'Not detected'}</p>
                              <p className="mt-1 text-sm text-slate-600">Frequency: {medicine.frequency || 'Not detected'}</p>
                              <p className="mt-1 text-sm text-slate-600">Duration: {medicine.duration || 'Not detected'}</p>
                            </div>
                          )) : (
                            <p className="text-sm text-slate-600">
                              {isVerified
                                ? 'No medicines were extracted for this scan.'
                                : 'Medicines will appear after patient verification.'}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-2xl bg-white p-4">
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Notes</p>
                          <p className="mt-2 text-sm leading-7 text-slate-600">
                            {isVerified
                              ? (report.notes || 'No additional notes were stored for this scan.')
                              : 'Notes will be generated after verification.'}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white p-4">
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Extracted Text</p>
                          <p className="mt-2 line-clamp-6 text-sm leading-7 text-slate-600">
                            {report.extractedText || 'No extracted text was stored.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="mt-8 rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-600">
              No scanned prescriptions yet. Upload your first handwritten prescription to build a searchable medicine history.
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default PatientReports
