// src/components/EncryptUploader.tsx

import React, { useState } from 'react'

const EncryptUploader: React.FC = () => {
  const [files, setFiles] = useState<File[]>([])
  const [nit, setNit] = useState('')
  const [tipo, setTipo] = useState('CRC')
  const [mantenerNombreOriginal, setMantenerNombreOriginal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [downloadLinks, setDownloadLinks] = useState<{ enc: string; key: string } | null>(null)

  const handleEncrypt = async () => {
    if (files.length === 0 || !nit) {
      setMessage('⚠️ NIT y archivo(s) requeridos.')
      return
    }

    setLoading(true)
    setMessage('')
    setDownloadLinks(null)

    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    formData.append('nit', nit)
    formData.append('tipo', tipo)
    formData.append('nombreOriginal', mantenerNombreOriginal.toString())

    try {
      const res = await fetch('/api/encrypt', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) throw new Error('Error al encriptar.')

      const { encryptedFile, encryptedKey } = await res.json()

      const encBlob = new Blob([Uint8Array.from(atob(encryptedFile), c => c.charCodeAt(0))])
      const keyBlob = new Blob([Uint8Array.from(atob(encryptedKey), c => c.charCodeAt(0))])

      setDownloadLinks({
        enc: URL.createObjectURL(encBlob),
        key: URL.createObjectURL(keyBlob)
      })

      setMessage('✅ Archivo cifrado exitosamente.')
    } catch (err) {
      console.error(err)
      setMessage('❌ Error al cifrar el archivo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 p-6 bg-white rounded-xl shadow max-w-xl mx-auto">
      <h2 className="text-xl font-bold text-green-800">🔒 Encriptador ASOPREVISUAL</h2>

      <div>
        <label className="block font-medium text-gray-700">Digite su NIT:</label>
        <input
          type="text"
          value={nit}
          onChange={e => setNit(e.target.value)}
          className="w-full border p-2 rounded mt-1"
        />
      </div>

      <div className="flex gap-4 items-center">
        <label className="font-medium text-gray-700">Tipo:</label>
        <select value={tipo} onChange={e => setTipo(e.target.value)} className="border p-2 rounded">
          <option>CRC</option>
          <option>CUV</option>
          <option>FEV</option>
          <option>RIPS</option>
        </select>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={mantenerNombreOriginal}
            onChange={() => setMantenerNombreOriginal(!mantenerNombreOriginal)}
          />
          Nombre original
        </label>
      </div>

      <div>
        <input
          type="file"
          multiple
          onChange={e => setFiles(e.target.files ? Array.from(e.target.files) : [])}
          className="block w-full border p-2 rounded"
        />
      </div>

      <button
        onClick={handleEncrypt}
        disabled={loading}
        className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? 'Cifrando...' : 'Encriptar archivos'}
      </button>

      {message && <p className="text-sm">{message}</p>}

      {downloadLinks && (
        <div className="space-y-2">
          <a href={downloadLinks.enc} download="archivo.enc" className="text-blue-600 underline">
            Descargar .enc
          </a>
          <a href={downloadLinks.key} download="clave.key" className="text-blue-600 underline">
            Descargar .key
          </a>
        </div>
      )}
    </div>
  )
}

export default EncryptUploader
