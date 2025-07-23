"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginForm() {
  const { login, error } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault()
        await login({ email, password })
      }}
    >
      <Input placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
      <Input
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        required
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full">
        Entrar
      </Button>
    </form>
  )
}
