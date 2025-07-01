'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PASSWORD = '#Admin25'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleLogin = () => {
    if (password === PASSWORD) {
    document.cookie = "auth_lagocomo=true; path=/; SameSite=Lax max-age=3600" // 1 hora
    router.push('/dashboard')
    } else {
      alert('Contraseña incorrecta')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center">Iniciar sesión</h2>
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border rounded mb-4"
        />
        <button
          onClick={handleLogin}
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800"
        >
          Entrar
        </button>
      </div>
    </div>
  )
}
