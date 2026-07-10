import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

interface TokenPayload {
  userId: string
  email: string
}

interface RefreshPayload {
  userId: string
  type: 'refresh'
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload
    return decoded
  } catch {
    return null
  }
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, { expiresIn: '30d' })
}

export function verifyRefreshToken(token: string): RefreshPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as RefreshPayload
    if (decoded.type !== 'refresh') return null
    return decoded
  } catch {
    return null
  }
}
