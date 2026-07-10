import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

interface FarmerTokenPayload {
  farmerId: string
  cooperativeId: string
  phone: string
}

export function generateFarmerToken(payload: FarmerTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' })
}

export function verifyFarmerToken(token: string): FarmerTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as FarmerTokenPayload
    if (!decoded.farmerId || !decoded.phone) return null
    return decoded
  } catch {
    return null
  }
}
