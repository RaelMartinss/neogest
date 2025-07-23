import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

const JWT_SECRET = process.env.JWT_SECRET || "HJSJAJSDJjdjdskJ22112!@#$$%^^&*()_+"

export function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return decoded
  } catch (error) {
    console.error("Token inválido:", error)
    return null
  }
}

export function generateToken(payload: { userId: string; email: string; role: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return bcrypt.hash(password, saltRounds)
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}
