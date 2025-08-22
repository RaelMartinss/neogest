"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import LoginForm from "./components/LoginForm"
import Header from "./components/Header"
import Sidebar from "./components/Sidebar"
import Dashboard from "./components/Dashboard"
import PDV from "./components/PDV"
import ComprasControl from "./components/ComprasControl"
import CaixaControl from "./components/CaixaControl"
import EstoqueControl from "./components/EstoqueControl"
import Relatorios from "./components/Relatorios"
import UserManagement from "./components/UserManagement"
import ProtectedRoute from "./components/ProtectedRoute"
import ClientesControl from "./components/ClientesControl"
import TrocasControl from "./components/TrocasControl"

export default function Home() {
  const { user, isLoading } = useAuth()
  const [activeModule, setActiveModule] = useState("dashboard")

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Só mostrar login se não estiver carregando e não houver usuário
  if (!user) {
    return <LoginForm />
  }

  const renderModule = () => {
    switch (activeModule) {
      case "dashboard":
        return <Dashboard />
      case "pdv":
        return <PDV />
      case "compras":
        return <ComprasControl />
      case "clientes":
        return <ClientesControl />
      case "caixa":
        return <CaixaControl />
      case "estoque":
        return <EstoqueControl />
      case "trocas":
        return <TrocasControl />
      case "relatorios":
        return <Relatorios />
      case "usuarios":
        return <UserManagement />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} />

      {/* Main content - com margem fixa em desktop */}
      <div className="lg:ml-64">
        <Header />
        <main className="p-6">
          <ProtectedRoute module={activeModule}>{renderModule()}</ProtectedRoute>
        </main>
      </div>
    </div>
  )
}
