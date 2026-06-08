import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'

function getKey(): Buffer {
  const key = process.env.PASSWORD_ENCRYPTION_KEY
  if (!key || key.length !== 64) {
    throw new Error('PASSWORD_ENCRYPTION_KEY debe ser un hex de 64 caracteres (32 bytes)')
  }
  return Buffer.from(key, 'hex')
}

export function encrypt(text: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

export function decrypt(encryptedText: string): string {
  const key = getKey()
  const [ivHex, encHex] = encryptedText.split(':')
  if (!ivHex || !encHex) throw new Error('Formato de texto cifrado inválido')
  const iv = Buffer.from(ivHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()])
  return decrypted.toString('utf8')
}
