// api/encrypt.ts

import type { VercelRequest, VercelResponse } from '@vercel/node'
import formidable from 'formidable'
import * as crypto from 'crypto'
import path from 'path'
import { Buffer } from 'buffer'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' })
    return
  }

  const form = formidable({ multiples: false })

  form.parse(req, async (err, fields, files) => {
    try {
      if (err || !files.file) {
        console.error('Error al parsear formulario:', err)
        return res.status(500).json({ message: 'Error al procesar el archivo' })
      }

      const file = Array.isArray(files.file) ? files.file[0] : files.file

      const fileBuffer: Buffer = await file.toBuffer?.() ??
        Buffer.from(await file.filepath?.writeStream?.chunks?.[0] ?? '')

      const fileExtension = path.extname(file.originalFilename || '') || '.bin'
      const extensionLengthBuffer = Buffer.alloc(4)
      extensionLengthBuffer.writeUInt32BE(fileExtension.length, 0)
      const extensionBuffer = Buffer.from(fileExtension, 'utf-8')

      const aesKey = crypto.randomBytes(32)
      const iv = crypto.randomBytes(16)

      const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv)
      const encryptedFile = Buffer.concat([cipher.update(fileBuffer), cipher.final()])

      const finalEncryptedFile = Buffer.concat([
        extensionLengthBuffer,
        extensionBuffer,
        iv,
        encryptedFile,
      ])

      const publicKey = process.env.PUBLIC_KEY_PEM || ''
      if (!publicKey.startsWith('-----BEGIN PUBLIC KEY-----')) {
        return res.status(500).json({ message: 'Clave pública inválida o no definida' })
      }

      const encryptedAesKey = crypto.publicEncrypt(
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        },
        aesKey
      )

      res.status(200).json({
        encryptedFile: finalEncryptedFile.toString('base64'),
        encryptedKey: encryptedAesKey.toString('base64'),
      })
    } catch (error: any) {
      console.error('❌ Error al cifrar archivo:', error)
      res.status(500).json({ message: 'Error interno en el servidor', error: error.message })
    }
  })
}
