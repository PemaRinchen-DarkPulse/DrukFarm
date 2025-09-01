import React, { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { Button } from '@/components/ui/button'

export default function Scanner() {
  const videoRef = useRef(null)
  const codeReaderRef = useRef(null)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader()
    codeReaderRef.current = codeReader

    let stopped = false
    async function start() {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices()
        if (!devices || devices.length === 0) {
          setError('No camera found')
          return
        }
        // Prefer back camera if available
        const backCam = devices.find(d => /back|rear|environment/i.test(d.label)) || devices[0]
        const res = await codeReader.decodeFromVideoDevice(backCam.deviceId, videoRef.current, (res, err) => {
          if (stopped) return
          if (res) {
            setResult(res.getText())
          }
          if (err && !(err?.name === 'NotFoundException')) {
            // Non NotFound errors can be noisy; keep last error message
            setError(err?.message || String(err))
          }
        })
        return res
      } catch (e) {
        setError(e?.message || String(e))
      }
    }
    start()
    return () => {
      stopped = true
      try { codeReader.reset() } catch {}
    }
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">Scan QR</h1>
      <div className="rounded-lg overflow-hidden bg-black aspect-video">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
      </div>
      {result && (
        <div className="mt-4 p-3 rounded border border-border bg-card text-card-foreground">
          <div className="text-sm text-muted-foreground mb-1">Result</div>
          <div className="break-words">{result}</div>
          {/^https?:\/\//i.test(result) && (
            <a href={result} target="_blank" rel="noreferrer" className="inline-block mt-3">
              <Button size="sm">Open Link</Button>
            </a>
          )}
        </div>
      )}
      {error && (
        <div className="mt-3 text-sm text-red-600">{error}</div>
      )}
    </div>
  )
}
