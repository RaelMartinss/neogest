"use client";

import {
  LayoutDashboard,
  ShoppingCart,
  CreditCard,
  Package,
  BarChart3,
  Settings,
  Users,
  Menu,
  X,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useState, useEffect } from "react";

interface SidebarProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
}

export default function Sidebar({
  activeModule,
  setActiveModule,
}: SidebarProps) {
  const { hasPermission } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      module: "dashboard",
    },
    { id: "pdv", label: "PDV", icon: ShoppingCart, module: "pdv" },
    { id: "compras", label: "Compras", icon: Package, module: "compras" },
    { id: "clientes", label: "Clientes", icon: Users, module: "clientes" },
    {
      id: "caixa",
      label: "Controle de Caixa",
      icon: CreditCard,
      module: "caixa",
    },
    { id: "estoque", label: "Estoque", icon: Package, module: "estoque" },
    { id: "trocas", label: "Trocas/Devoluções", icon: RefreshCw, module: "trocas" },
    {
      id: "relatorios",
      label: "Relatórios",
      icon: BarChart3,
      module: "relatorios",
    },
    { id: "usuarios", label: "Usuários", icon: Users, module: "usuarios" },
    {
      id: "configuracoes",
      label: "Configurações",
      icon: Settings,
      module: "configuracoes",
    },
  ];

  // Filter menu items based on user permissions
  const visibleMenuItems = menuItems.filter((item) =>
    hasPermission(item.module, "view")
  );

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById("sidebar");
      const hamburger = document.getElementById("hamburger-button");

      if (
        isOpen &&
        sidebar &&
        hamburger &&
        !sidebar.contains(event.target as Node) &&
        !hamburger.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close sidebar when selecting a menu item on mobile
  const handleMenuClick = (itemId: string) => {
    setActiveModule(itemId);
    setIsOpen(false); // Fecha no mobile após seleção
  };

  return (
    <>
      {/* Hamburger Button - APENAS MOBILE */}
      <button
        id="hamburger-button"
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-md shadow-lg hover:bg-slate-800 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - SEMPRE VISÍVEL EM DESKTOP */}
      <div
        id="sidebar"
        className={`
          fixed inset-y-0 left-0 z-40
          w-64 bg-slate-900 text-white
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Header */}
        <div className="p-6">
          <h1 className="text-xl font-bold">ERP Comércio</h1>
          <p className="text-sm text-slate-400">Sistema Integrado</p>
        </div>

        {/* Navigation */}
        <nav className="mt-6">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`w-full flex items-center px-6 py-3 text-left hover:bg-slate-800 transition-colors ${
                  activeModule === item.id
                    ? "bg-slate-800 border-r-2 border-blue-500"
                    : ""
                }`}
              >
                <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="absolute bottom-4 left-6 right-6">
          <div className="text-xs text-slate-400 border-t border-slate-700 pt-4">
            <p>v1.0.0</p>
            <p>Sistema ERP</p>
          </div>
        </div>
      </div>
    </>
  );
}
