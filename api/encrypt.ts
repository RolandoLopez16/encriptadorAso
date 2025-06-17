// api/encrypt.ts

import { IncomingMessage, ServerResponse } from 'http'
import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import formidable from 'formidable'

export const config = {
  api: {
    bodyParser: false,
  },
}

// Ruta absoluta a la llave pública
const publicKeyPath = path.resolve(process.cwd(), 'secrets', 'public_key.pem')

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ message: 'Method not allowed' }))
    return
  }

  const form = formidable({ multiples: false })

  form.parse(req, async (err, fields, files) => {
    if (err || !files.file) {
      console.error('Error al parsear formulario:', err)
      res.statusCode = 500
      res.end(JSON.stringify({ message: 'Error al procesar el archivo' }))
      return
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file
    const fileBuffer = fs.readFileSync(file.filepath)
    const fileExtension = path.extname(file.originalFilename || '') || '.bin'

    // 1. Extensión en bytes
    const extensionLengthBuffer = Buffer.alloc(4)
    extensionLengthBuffer.writeUInt32BE(fileExtension.length, 0)
    const extensionBuffer = Buffer.from(fileExtension, 'utf-8')

    // 2. Clave AES y IV
    const aesKey = crypto.randomBytes(32)
    const iv = crypto.randomBytes(16)

    // 3. Cifrado AES
    const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv)
    const encryptedFile = Buffer.concat([
      cipher.update(fileBuffer),
      cipher.final(),
    ])

    // 4. Construir archivo cifrado final
    const finalEncryptedFile = Buffer.concat([
      extensionLengthBuffer,
      extensionBuffer,
      iv,
      encryptedFile,
    ])

    // 5. Cifrar clave AES con RSA pública
    const publicKey = fs.readFileSync(publicKeyPath, 'utf-8')
    const encryptedAesKey = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      aesKey
    )

    // 6. Responder en base64
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      encryptedFile: finalEncryptedFile.toString('base64'),
      encryptedKey: encryptedAesKey.toString('base64'),
    }))
  })
}
