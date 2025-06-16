function str2ab(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return await file.arrayBuffer();
}

export async function importPublicKey(pem: string): Promise<CryptoKey> {
  const binaryDer = str2ab(pem.replace(/(-----(BEGIN|END) PUBLIC KEY-----|\n)/g, ''));
  return await crypto.subtle.importKey(
    'spki',
    binaryDer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256'
    },
    true,
    ['encrypt']
  );
}

export async function encryptFile(
  file: File,
  publicKey: CryptoKey,
  nit: string,
  tipo: string,
  mantenerNombreOriginal: boolean
) {
  const fileBuffer = await file.arrayBuffer();

  const extension = file.name.split('.').pop() || 'bin';
  const originalName = file.name.replace(/\.[^/.]+$/, '');
  const fileExtension = `.${extension}`;
  const extensionBytes = new TextEncoder().encode(fileExtension);
  const extensionLengthBuffer = new Uint8Array(4);
  new DataView(extensionLengthBuffer.buffer).setUint32(0, extensionBytes.length, false);

  const fileNameBase = mantenerNombreOriginal
    ? `${originalName}.${extension}`
    : `${tipo}_${nit}_${originalName}.${extension}`;

  const aesKey = await crypto.subtle.generateKey(
    { name: 'AES-CBC', length: 256 },
    true,
    ['encrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(16));

  const encryptedContent = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    aesKey,
    fileBuffer
  );

  const finalEncryptedFile = new Uint8Array(
    4 + extensionBytes.length + iv.length + encryptedContent.byteLength
  );
  finalEncryptedFile.set(extensionLengthBuffer, 0);
  finalEncryptedFile.set(extensionBytes, 4);
  finalEncryptedFile.set(iv, 4 + extensionBytes.length);
  finalEncryptedFile.set(
    new Uint8Array(encryptedContent),
    4 + extensionBytes.length + iv.length
  );

  const rawKey = await crypto.subtle.exportKey('raw', aesKey);
  const encryptedAesKey = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    rawKey
  );

  downloadFile(finalEncryptedFile.buffer, `${fileNameBase}.enc`);
  downloadFile(encryptedAesKey, `${fileNameBase}.key`);
}

function downloadFile(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer]);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
