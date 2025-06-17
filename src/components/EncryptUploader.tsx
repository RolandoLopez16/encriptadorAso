// src/components/EncryptUploader.tsx

import React, { useState } from 'react'

const EncryptUploader: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setMessage('')
    }
  }

  const handleEncrypt = async () => {
    if (!selectedFile) {
      setMessage('⚠️ Debes seleccionar un archivo primero.')
      return
    }

    setLoading(true)
    setMessage('')

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const res = await fetch('/api/encrypt', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Error en el servidor.')

      const { encryptedFile, encryptedKey } = await res.json()

      // Generar blobs
      const encBlob = new Blob([Uint8Array.from(atob(encryptedFile), c => c.charCodeAt(0))])
      const keyBlob = new Blob([Uint8Array.from(atob(encryptedKey), c => c.charCodeAt(0))])

      // Obtener nombre original sin extensión
      const originalName = selectedFile.name.split('.').slice(0, -1).join('.') || 'archivo'

      // Descargar automáticamente .enc
      const encLink = document.createElement('a')
      encLink.href = URL.createObjectURL(encBlob)
      encLink.download = `${originalName}.enc`
      document.body.appendChild(encLink)
      encLink.click()
      document.body.removeChild(encLink)

      // Descargar automáticamente .key
      const keyLink = document.createElement('a')
      keyLink.href = URL.createObjectURL(keyBlob)
      keyLink.download = `${originalName}.key`
      document.body.appendChild(keyLink)
      keyLink.click()
      document.body.removeChild(keyLink)

      setMessage('✅ Archivo cifrado y descargado exitosamente.')
    } catch (err) {
      console.error(err)
      setMessage('❌ Error al cifrar el archivo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 border rounded-xl shadow-md max-w-md mx-auto bg-white space-y-4">
      <h2 className="text-xl font-semibold">Cifrar archivo</h2>

      <input
        type="file"
        onChange={handleFileChange}
        className="block w-full border p-2 rounded"
      />

      <button
        onClick={handleEncrypt}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Cifrando...' : 'Cifrar archivo'}
      </button>

      {message && <p className="text-sm">{message}</p>}
    </div>
  )
}

export default EncryptUploader
