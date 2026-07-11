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

interface FarmerRefreshPayload {
  farmerId: string
  type: 'farmer_refresh'
}

export function generateFarmerRefreshToken(farmerId: string): string {
  return jwt.sign({ farmerId, type: 'farmer_refresh' }, JWT_SECRET, { expiresIn: '90d' })
}

export function verifyFarmerRefreshToken(token: string): FarmerRefreshPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as FarmerRefreshPayload
    if (decoded.type !== 'farmer_refresh' || !decoded.farmerId) return null
    return decoded
  } catch {
    return null
  }
}
