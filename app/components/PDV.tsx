"use client"

import React, { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  Plus,
  Minus,
  CreditCard,
  DollarSign,
  Smartphone,
  User,
  Calendar,
  Package,
  X,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  Search,
  Printer,
  UserCheck,
  FileText,
  Receipt,
  Info,
  DoorOpenIcon as Enter,
  Edit,
  Phone,
} from "lucide-react"
import type { Product } from "../types/product"
import type { SaleItem, Customer, Sale } from "../types/sale"

// Declaração global do MercadoPago
declare global {
  interface Window {
    MercadoPago: any
  }
}

interface CartItem extends SaleItem {
  product: Product
  itemNumber: number
}

type SaleStatus = "closed" | "open" | "finalizing"

interface OperatorInfo {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
}

type PaymentMethod = "cash" | "credit_card" | "debit_card" | "pix"

interface PaymentOption {
  id: PaymentMethod
  name: string
  icon: React.ReactNode
  shortcut: string
}

export default function PDV() {
  // Inicialização do MercadoPago
  const PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY!
  const [mp, setMp] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && window.MercadoPago && !mp) {
      const mercadopago = new window.MercadoPago(PUBLIC_KEY)
      setMp(mercadopago)
      console.log('✅ MercadoPago inicializado')
    }
  }, [mp, PUBLIC_KEY])

  // Função para criar token do cartão
  const createCardToken = async (form: {
    cardNumber: string
    cardholderName: string
    expirationDate: string // formato MM/YY
    cvv: string
    docType: string
    docNumber: string
  }) => {
    if (!mp) {
      throw new Error('MercadoPago não inicializado')
    }

    const [month, year] = form.expirationDate.split("/")
    
    // Validar dados do cartão antes de enviar
    if (!form.cardNumber || form.cardNumber.length < 13) {
      throw new Error('Número do cartão inválido')
    }
    
    if (!form.cvv || form.cvv.length < 3) {
      throw new Error('CVV inválido')
    }

    try {
      const cardToken = await mp.createCardToken({
        cardNumber: form.cardNumber.replace(/\s/g, ''),
        cardholderName: form.cardholderName,
        expiration_month: Number(month),
        expiration_year: Number(`20${year}`),
        securityCode: form.cvv,
        identification: {
          type: form.docType,
          number: form.docNumber,
        },
      })
      return cardToken.id
    } catch (error) {
      console.error('❌ Erro ao criar token:', error)
      throw new Error(`Erro ao criar token: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [barcode, setBarcode] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [discount, setDiscount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [productsError, setProductsError] = useState<string | null>(null)
  const [saleNumber, setSaleNumber] = useState(1)
  const [saleStatus, setSaleStatus] = useState<SaleStatus>("closed")
  const [includeCpf, setIncludeCpf] = useState(false)
  const [itemCounter, setItemCounter] = useState(0)
  const [completeSaleData, setCompleteSaleData] = useState<any>(null)
  const [showCashPaymentModal, setShowCashPaymentModal] = useState(false)
  const [cashReceived, setCashReceived] = useState("")
  const [cashChange, setCashChange] = useState(0)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [showPixPaymentModal, setShowPixPaymentModal] = useState(false)
  const [pixData, setPixData] = useState<any>(null)
  const [pixStatus, setPixStatus] = useState<"generating" | "pending" | "confirmed" | "expired">("generating")
  const [pixTimer, setPixTimer] = useState(30 * 60) // 30 minutos em segundos
  const [cashRegisterStatus, setCashRegisterStatus] = useState<{
    isOpen: boolean
    isLoading: boolean
    error: string | null
  }>({
    isOpen: false,
    isLoading: true,
    error: null,
  })

  // Estados para navegação por teclado
  const [selectedPaymentIndex, setSelectedPaymentIndex] = useState(0)
  const [showPaymentSelection, setShowPaymentSelection] = useState(false)
  const [keyboardMode, setKeyboardMode] = useState(true)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)

  // Referências para inputs
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const cashInputRef = useRef<HTMLInputElement>(null)

  // Informações do operador
  const [operatorInfo] = useState<OperatorInfo>({
    id: "op001",
    name: "João Silva",
    email: "joao@empresa.com",
    role: "Operador de Caixa",
    avatar: "JS",
  })

  // Estados para configurações fiscais
  const [fiscalSettings] = useState({
    emitirNFCe: true,
    ambienteProducao: false,
    serieNFCe: "001",
    numeroSequencial: 1,
  })

  // Modal states
  const [showStartSaleModal, setShowStartSaleModal] = useState(false)
  const [showCancelSaleModal, setShowCancelSaleModal] = useState(false)
  const [showDeleteProductModal, setShowDeleteProductModal] = useState(false)
  const [showSearchSaleModal, setShowSearchSaleModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [modalMessage, setModalMessage] = useState("")
  const [cpfInput, setCpfInput] = useState("")
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)
  const [searchSaleId, setSearchSaleId] = useState("")
  const [foundSale, setFoundSale] = useState<Sale | null>(null)
  const [lastSale, setLastSale] = useState<Sale | null>(null)

  // Opções de pagamento com atalhos
  const paymentOptions: PaymentOption[] = [
    {
      id: "cash",
      name: "Dinheiro",
      icon: <DollarSign className="w-4 h-4" />,
      shortcut: "D",
    },
    {
      id: "credit_card",
      name: "Cartão Crédito",
      icon: <CreditCard className="w-4 h-4" />,
      shortcut: "C",
    },
    {
      id: "debit_card",
      name: "Cartão Débito",
      icon: <CreditCard className="w-4 h-4" />,
      shortcut: "B",
    },
    {
      id: "pix",
      name: "PIX",
      icon: <Smartphone className="w-4 h-4" />,
      shortcut: "P",
    },
  ]

  // Adicionar estados para o modal de cartão
  const [showCardModal, setShowCardModal] = useState<false | 'credit' | 'debit'>(false)

  // Adicionar estados para o modal de digitação manual dos dados do cartão
  const [showManualCardModal, setShowManualCardModal] = useState(false)
  const [manualCardData, setManualCardData] = useState({
    number: '',
    cvv: '',
    expiry: '',
  })

  // Estados para pagamento com cartão
  const [showCardPaymentModal, setShowCardPaymentModal] = useState(false)
  const [cardStatus, setCardStatus] = useState<'processing' | 'approved' | 'rejected'>('processing')
  const [cardData, setCardData] = useState<any>(null)

  // Otimizar setManualCardData para evitar re-renderizações
  const setManualCardDataOptimized = React.useCallback((data: { number: string; cvv: string; expiry: string }) => {
    setManualCardData(data)
  }, [])

  // Funções auxiliares para o cupom fiscal
  const formatCpf = (cpf: string) => {
    if (!cpf || cpf.length !== 11) return cpf
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

  const money = (v: unknown) => Number(v ?? 0).toFixed(2)

  const formatDate = (dateValue: any) => {
    try {
      if (!dateValue) return new Date().toLocaleString("pt-BR")
      const date = new Date(dateValue)
      if (isNaN(date.getTime())) return new Date().toLocaleString("pt-BR")
      return date.toLocaleString("pt-BR")
    } catch {
      return new Date().toLocaleString("pt-BR")
    }
  }

  const safeString = (value: any, fallback = "N/A") => {
    if (value === null || value === undefined || value === "") return fallback
    return String(value)
  }

  const safeNumber = (value: any, fallback = 0) => {
    const num = Number(value)
    return isNaN(num) ? fallback : num
  }

  const toMoney = (value: unknown) => Number(value ?? 0).toFixed(2)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const checkCashRegisterStatus = async (): Promise<boolean> => {
    return new Promise(async (resolve) => {
      try {
        setCashRegisterStatus((prev) => ({ ...prev, isLoading: true, error: null }))

        // Timeout de 5 segundos
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch("/api/cash-register", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          const isOpen = data.cashRegister?.is_open || false
          setCashRegisterStatus({
            isOpen,
            isLoading: false,
            error: null,
          })
          resolve(isOpen)
        } else {
          // Em caso de erro da API, considerar caixa fechado por segurança
          setCashRegisterStatus({
            isOpen: false,
            isLoading: false,
            error: `Erro ${response.status}: Não foi possível verificar o status do caixa`,
          })
          resolve(false)
        }
      } catch (error) {
        console.error("Erro ao verificar caixa:", error)
        // Em caso de erro, considerar caixa fechado por segurança
        setCashRegisterStatus({
          isOpen: false,
          isLoading: false,
          error: "Erro de conexão: Não foi possível verificar o status do caixa",
        })
        resolve(false)
      }
    })
  }

  // Função para focar no input de código de barras
  const focusBarcodeInput = () => {
    console.log("🎯 Função focusBarcodeInput chamada")

    if (saleStatus !== "open") {
      console.log("❌ Venda não está aberta", { saleStatus })
      return false
    }

    if (!barcodeInputRef.current) {
      console.log("❌ Input de código de barras não encontrado")
      return false
    }

    const input = barcodeInputRef.current
    console.log("📍 Input encontrado:", {
      disabled: input.disabled,
      readOnly: input.readOnly,
      tabIndex: input.tabIndex,
      style: input.style.display,
      offsetParent: input.offsetParent,
      clientHeight: input.clientHeight,
      clientWidth: input.clientWidth,
    })

    // Verificar se o input está visível e habilitado
    if (input.disabled) {
      console.log("❌ Input está desabilitado")
      return false
    }

    if (input.offsetParent === null && input.style.display !== "none") {
      console.log("❌ Input pode estar oculto")
      return false
    }

    try {
      // Tentar múltiplas abordagens para focar
      console.log("🔄 Tentativa 1: focus() direto")
      input.focus()

      if (document.activeElement === input) {
        console.log("✅ Foco aplicado com sucesso na tentativa 1")
        input.select()
        return true
      }

      console.log("🔄 Tentativa 2: focus() com requestAnimationFrame")
      requestAnimationFrame(() => {
        input.focus()
        if (document.activeElement === input) {
          console.log("✅ Foco aplicado com sucesso na tentativa 2")
          input.select()
        } else {
          console.log("🔄 Tentativa 3: click() + focus()")
          input.click()
          input.focus()

          setTimeout(() => {
            if (document.activeElement === input) {
              console.log("✅ Foco aplicado com sucesso na tentativa 3")
              input.select()
            } else {
              console.log("❌ Todas as tentativas falharam. Elemento ativo:", document.activeElement)
            }
          }, 10)
        }
      })

      return true
    } catch (error) {
      console.error("❌ Erro ao tentar focar:", error)
      return false
    }
  }

  useEffect(() => {
    // Verificar status do caixa ao carregar
    checkCashRegisterStatus()

    // Focar no input de código de barras quando a venda estiver aberta
    if (saleStatus === "open" && barcodeInputRef.current) {
      barcodeInputRef.current.focus()
    }

    // Listener para teclas globais
    const handleKeyPress = (event: KeyboardEvent) => {
      console.log("🔑 Tecla pressionada:", event.key, "Target:", event.target)

      // Verificar se estamos digitando em um input ou textarea
      const isTyping = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement

      // Verificar se algum modal está aberto
      const hasModalOpen =
        showPaymentSelection ||
        showCashPaymentModal ||
        showPixPaymentModal ||
        showKeyboardHelp ||
        showStartSaleModal ||
        showCancelSaleModal ||
        showDeleteProductModal ||
        showSearchSaleModal ||
        showErrorModal ||
        showSuccessModal ||
        showReceiptModal

      console.log("🔍 Estado:", { isTyping, hasModalOpen, saleStatus })

      // Teclas F sempre funcionam, independente do contexto
      if (event.key && event.key.startsWith("F")) {
        event.preventDefault()
        handleFunctionKey(event.key)
        return
      }

      // Se estiver na seleção de pagamento, usar navegação específica
      if (showPaymentSelection) {
        handlePaymentSelectionKey(event)
        return
      }

      // Se não estiver digitando e não houver modal aberto, processar atalhos globais
      if (!isTyping && !hasModalOpen) {
        handleGlobalShortcuts(event)
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [
    saleStatus,
    cart.length,
    showPaymentSelection,
    selectedPaymentIndex,
    showCashPaymentModal,
    showPixPaymentModal,
    showKeyboardHelp,
    showStartSaleModal,
    showCancelSaleModal,
    showDeleteProductModal,
    showSearchSaleModal,
    showErrorModal,
    showSuccessModal,
    showReceiptModal,
  ])

  const handleFunctionKey = (key: string) => {
    console.log("🎯 Processando tecla F:", key)
    switch (key) {
      case "F1":
        handleStartSaleClick()
        break
      case "F2":
        if (saleStatus === "open") {
          // Alterar venda - implementar depois
        }
        break
      case "F3":
        // Consultar produto - implementar depois
        break
      case "F4":
        if (saleStatus === "open" && cart.length > 0) {
          handleFinalizeSale()
        }
        break
      case "F5":
        if (saleStatus === "open") {
          setShowDeleteProductModal(true)
        }
        break
      case "F6":
        if (saleStatus === "open") {
          setShowCancelSaleModal(true)
        }
        break
      case "F7":
        setShowSearchSaleModal(true)
        break
      case "F8":
        if (saleStatus === "open") {
          // Alterar quantidade - implementar depois
        }
        break
      case "F9":
        setShowKeyboardHelp(true)
        break
      case "F10":
        if (completeSaleData || lastSale) {
          printReceipt()
        }
        break
    }
  }

  const handleGlobalShortcuts = (event: KeyboardEvent) => {
    const key = event.key?.toLowerCase() || ""
    console.log("⌨️ Processando atalho global:", key)

    switch (key) {
      case "i": // Inserir código
        console.log("🎯 Tecla I pressionada - focando no input de código de barras")
        event.preventDefault()
        focusBarcodeInput()
        break
      case "enter":
        if (saleStatus === "open" && barcode.trim()) {
          event.preventDefault()
          handleBarcodeSubmit(event as any)
        }
        break
      case "escape":
        event.preventDefault()
        // Fechar modais ou voltar
        if (showPaymentSelection) {
          setShowPaymentSelection(false)
          setSaleStatus("open")
        }
        break
    }
  }

  const handlePaymentSelectionKey = (event: KeyboardEvent) => {
    event.preventDefault()

    switch (event.key || "") {
      case "ArrowUp":
        setSelectedPaymentIndex((prev) => (prev > 0 ? prev - 1 : paymentOptions.length - 1))
        break
      case "ArrowDown":
        setSelectedPaymentIndex((prev) => (prev < paymentOptions.length - 1 ? prev + 1 : 0))
        break
      case "Enter":
        const selectedPayment = paymentOptions[selectedPaymentIndex]
        handlePaymentSelection(selectedPayment.id)
        break
      case "Escape":
        setShowPaymentSelection(false)
        setSaleStatus("open")
        break
      default:
        // Atalhos por letra
        const shortcut = event.key?.toUpperCase() || ""
        const paymentByShortcut = paymentOptions.find((p: PaymentOption) => p.shortcut === shortcut)
        if (paymentByShortcut) {
          handlePaymentSelection(paymentByShortcut.id)
        }
        break
    }
  }

  const handleFinalizeSale = () => {
    if (cart.length === 0) {
      showError("Carrinho vazio!")
      return
    }
    setShowPaymentSelection(true)
    setSelectedPaymentIndex(0)
  }

  const handlePaymentSelection = (paymentMethod: PaymentMethod) => {
    setShowPaymentSelection(false)

    switch (paymentMethod) {
      case "cash":
        handleCashPayment()
        break
      case "credit_card":
        setShowCardModal('credit')
        break
      case "debit_card":
        setShowCardModal('debit')
        break
      case "pix":
        handlePixPayment()
        break
    }
  }

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true)
      setProductsError(null)
      console.log("🔄 Buscando produtos para PDV...")

      const response = await fetch("/api/products/direct")

      if (!response.ok) {
        let msg = `Erro ${response.status}`
        try {
          const ct = response.headers.get("content-type") || ""
          msg = ct.includes("application/json") ? ((await response.json()).error ?? msg) : await response.text()
        } catch {
          /* ignore */
        }
        throw new Error(msg)
      }

      const ct = response.headers.get("content-type") || ""
      const data = ct.includes("application/json") ? await response.json() : { success: false, products: [] }

      console.log("📦 Produtos recebidos:", data)

      if (!data.success || !data.products) {
        throw new Error("Formato de dados inválido")
      }

      setProducts(data.products)
      console.log(`✅ ${data.products.length} produtos carregados para PDV`)

      console.log(
        "🏷️ Códigos de barras disponíveis:",
        data.products.map((p: Product) => p.barcode),
      )
    } catch (error) {
      console.error("❌ Erro ao buscar produtos:", error)
      setProductsError(error instanceof Error ? error.message : "Erro desconhecido ao buscar produtos")
    } finally {
      setLoadingProducts(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      console.log("🔄 Buscando clientes para PDV...")
      const response = await fetch("/api/customers")

      if (!response.ok) {
        let msg = `Erro ${response.status}`
        try {
          const ct = response.headers.get("content-type") || ""
          msg = ct.includes("application/json") ? ((await response.json()).error ?? msg) : await response.text()
        } catch {
          /* ignore */
        }
        throw new Error(msg)
      }

      const ct = response.headers.get("content-type") || ""
      const data = ct.includes("application/json") ? await response.json() : { customers: [] }

      console.log("👥 Clientes recebidos:", data.customers?.length || 0)
      console.log("📋 Primeiros clientes:", data.customers?.slice(0, 3).map(c => ({ id: c.id, name: c.name })))

      setCustomers(data.customers || [])
    } catch (error) {
      console.error("❌ Erro ao buscar clientes:", error)
      showError(`Erro ao buscar clientes: ${error instanceof Error ? error.message : "desconhecido"}`)
    }
  }

  const searchSale = async () => {
    if (!searchSaleId.trim()) {
      showError("Digite o número da venda para buscar")
      return
    }

    try {
      const response = await fetch(`/api/sales/by-number/${searchSaleId}`)
      if (response.ok) {
        const sale = await response.json()
        setFoundSale(sale)
      } else {
        showError("Venda não encontrada")
        setFoundSale(null)
      }
    } catch (error) {
      showError("Erro ao buscar venda")
      setFoundSale(null)
    }
  }

  const handleCloseSearchModal = () => {
    setShowSearchSaleModal(false)
    setFoundSale(null)
    setSearchSaleId("")
  }

  const handleStartSaleClick = async () => {
    if (saleStatus !== "closed") return

    // Se ainda estiver carregando, aguardar
    if (cashRegisterStatus.isLoading) {
      showError("Verificando status do caixa, aguarde...")
      return
    }

    try {
      // Verificar o status do caixa e aguardar o resultado
      const isOpen = await checkCashRegisterStatus()

      if (!isOpen) {
        showError("Caixa está fechado! Abra o caixa antes de iniciar uma venda.")
        return
      }

      // Se chegou até aqui, o caixa está aberto
      setShowStartSaleModal(true)
    } catch (error) {
      console.error("Erro ao verificar caixa:", error)
      showError("Erro ao verificar status do caixa. Tente novamente.")
    }
  }

  const handleStartSale = () => {
    // Verificação final antes de iniciar a venda
    if (!cashRegisterStatus.isOpen) {
      showError("Caixa está fechado! Não é possível iniciar a venda.")
      setShowStartSaleModal(false)
      return
    }

    setSaleStatus("open")
    setCart([])
    setItemCounter(0)
    setDiscount(0)
    setSelectedProduct(null)
    setShowStartSaleModal(false)

    fetchProducts()
    fetchCustomers()

    // Focar no input de código de barras
    setTimeout(() => {
      focusBarcodeInput()
    }, 100)
  }

  const handleCancelSale = () => {
    const canceledSale = {
      id: `CANCEL-${Date.now()}`,
      saleNumber,
      items: cart,
      subtotal: getSubtotal(),
      discount,
      total: getTotal(),
      customer: selectedCustomer,
      includeCpf,
      cpf: cpfInput,
      canceledAt: new Date().toISOString(),
      reason: "Cancelada pelo operador",
    }

    console.log("Venda cancelada - Dados:", canceledSale)

    setSaleStatus("closed")
    setCart([])
    setItemCounter(0)
    setSelectedCustomer(null)
    setSelectedProduct(null)
    setDiscount(0)
    setBarcode("")
    setShowCancelSaleModal(false)
    setCpfInput("")
    setIncludeCpf(false)

    showSuccess("Venda cancelada com sucesso!")
  }

  const handleDeleteProduct = () => {
    if (itemToDelete === null) {
      showError("Digite o número do item para excluir")
      return
    }

    const itemExists = cart.find((item) => item.itemNumber === itemToDelete)
    if (!itemExists) {
      showError(`Item ${itemToDelete} não encontrado`)
      return
    }

    removeFromCart(itemToDelete)
    setShowDeleteProductModal(false)
    setItemToDelete(null)
    showSuccess(`Item ${itemToDelete} excluído com sucesso`)
  }

  const showError = (message: string) => {
    setModalMessage(message)
    setShowErrorModal(true)
  }

  const showSuccess = (message: string) => {
    setModalMessage(message)
    setShowSuccessModal(true)
  }

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!barcode.trim() || saleStatus !== "open") return

    const searchCode = barcode.trim()
    console.log(`🔍 Procurando produto com código: "${searchCode}"`)
    console.log(`📦 Produtos disponíveis: ${products.length}`)

    // Buscar por código de barras ou código interno
    const product = products.find((p) => {
      const matchCodigo = p.codigo && p.codigo.toString() === searchCode
      const matchBarcode = p.barcode && p.barcode.toString() === searchCode
      
      if (matchCodigo || matchBarcode) {
        console.log(`✅ Produto encontrado:`, {
          id: p.id,
          name: p.name,
          codigo: p.codigo,
          barcode: p.barcode,
          stockQuantity: p.stockQuantity,
          salePrice: p.salePrice
        })
        return true
      }
      return false
    })

    if (product) {
      addToCart(product)
      setBarcode("")
      // Manter foco no input
      setTimeout(() => {
        focusBarcodeInput()
      }, 100)
    } else {
      console.log("❌ Produto não encontrado nos produtos carregados")
      console.log("🔍 Códigos disponíveis para debug:")
      products.slice(0, 5).forEach((p, i) => {
        console.log(`  ${i + 1}. ID: ${p.id}, Nome: ${p.name}, Código: "${p.codigo}", Barras: "${p.barcode}"`)
      })
      if (products.length > 5) {
        console.log(`  ... e mais ${products.length - 5} produtos`)
      }
      showError(`Produto não encontrado! Código: ${searchCode}`)
      setBarcode("")
    }
  }

  const addToCart = (product: Product) => {
    if (product.stockQuantity <= 0) {
      showError("Produto sem estoque!")
      return
    }

    const existingItem = cart.find((item) => item.productId === product.id)

    if (existingItem) {
      if (existingItem.quantity >= product.stockQuantity) {
        showError(`Estoque insuficiente! Disponível: ${product.stockQuantity}`)
        return
      }
      updateQuantity(existingItem.itemNumber, existingItem.quantity + 1)
    } else {
      const newItemNumber = itemCounter + 1
      const newItem: CartItem = {
        id: Date.now().toString(),
        productId: product.id,
        productName: product.name,
        productBarcode: product.barcode,
        quantity: 1,
        unitPrice: product.salePrice,
        discount: 0,
        total: product.salePrice,
        product,
        itemNumber: newItemNumber,
      }
      setCart([...cart, newItem])
      setItemCounter(newItemNumber)
    }
    setSelectedProduct(product)
  }

  const updateQuantity = (itemNumber: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemNumber)
      return
    }

    const updatedCart = cart.map((item) => {
      if (item.itemNumber === itemNumber) {
        const stockQuantity = item.product.stockQuantity
        const quantity = Math.min(newQuantity, stockQuantity)
        return {
          ...item,
          quantity,
          total: (item.unitPrice - item.discount) * quantity,
        }
      }
      return item
    })

    setCart(updatedCart)
  }

  const removeFromCart = (itemNumber: number) => {
    setCart(cart.filter((item) => item.itemNumber !== itemNumber))
  }

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0)
  }

  const getTotal = () => {
    return getSubtotal() - discount
  }

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }

  const completeSale = async (paymentMethod: "cash" | "credit_card" | "debit_card" | "pix", paymentDetails?: any) => {
    if (cart.length === 0) {
      showError("Carrinho vazio!")
      return
    }

    setIsLoading(true)

    try {
      const saleData = {
        items: cart.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productBarcode: item.productBarcode,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          total: item.total,
        })),
        paymentMethod,
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer?.name,
        discount,
        includeCpf,
        cpfInput,
        saleNumber,
      }

      console.log("📤 Dados sendo enviados para o banco:", saleData)

      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(saleData),
      })

      if (response.ok) {
        const completedSale = await response.json()
        console.log("✅ Resposta do banco:", completedSale)

        const paymentData = {
          saleId: completedSale.sale.id,
          operatorId: "cmbe6dlm6000jcsy4qmjjgvi5",
          totalAmount: getTotal(),
          receivedAmount: paymentDetails?.receivedAmount || getTotal(),
          changeAmount: paymentDetails?.changeAmount || 0,
          paymentMethod: paymentMethod,
          observation: paymentDetails?.observation || null,
        }

        console.log("💰 Registrando pagamento:", paymentData)

        const paymentResponse = await fetch("/api/payments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paymentData),
        })

        if (!paymentResponse.ok) {
          console.warn("⚠️ Erro ao registrar pagamento, mas venda foi concluída")
        }

        const saleDataForCupom = {
          id: completedSale.sale.id,
          saleNumber: completedSale.sale.saleNumber,
          createdAt: completedSale.sale.createdAt || new Date().toISOString(),
          customerName: completedSale.sale.customerName || selectedCustomer?.name || "CLIENTE PADRÃO",
          cpfUsuario: completedSale.sale.cpfUsuario || (includeCpf && cpfInput ? cpfInput.replace(/\D/g, "") : null),
          paymentMethod: completedSale.sale.tipoPagamento || paymentMethod,
          receivedAmount: paymentDetails?.receivedAmount || getTotal(),
          changeAmount: paymentDetails?.changeAmount || 0,
          items: completedSale.sale.items
            ? completedSale.sale.items.map((item: any, index: number) => ({
                itemNumber: index + 1,
                productId: item.product_id || item.productId,
                productName: item.product_name || item.productName,
                productCode: item.product_code || null,
                productBarcode: item.product_barcode || item.productBarcode,
                quantity: item.quantity,
                unitPrice: item.unit_price || item.unitPrice,
                discount: item.discount || 0,
                total: item.totalPrice || item.total,
              }))
            : cart.map((item, index) => ({
                itemNumber: index + 1,
                productId: item.productId,
                productName: item.productName,
                productCode: item.product.codigo,
                productBarcode: item.productBarcode,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: item.discount || 0,
                total: item.total,
              })),
          subtotal: Number(completedSale.sale.subtotal ?? getSubtotal()),
          discount: Number(completedSale.sale.discount ?? discount),
          total: Number(completedSale.sale.totalAmount ?? getTotal()),
          totalItems: Number(
            completedSale.sale.items
              ? completedSale.sale.items.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0)
              : getTotalItems(),
          ),
          operator: operatorInfo.name,
        }

        console.log("🎯 DADOS COMPLETOS PARA CUPOM:", saleDataForCupom)

        setCompleteSaleData(saleDataForCupom)
        setLastSale({
          id: saleDataForCupom.id,
          saleNumber: saleDataForCupom.saleNumber,
          items: saleDataForCupom.items,
          subtotal: saleDataForCupom.subtotal,
          discount: saleDataForCupom.discount,
          totalAmount: saleDataForCupom.total,
          tipoPagamento: saleDataForCupom.paymentMethod,
          customerName: saleDataForCupom.customerName,
          userId: 'system',
          userName: saleDataForCupom.operator || 'Sistema',
          status: 'completed' as const,
          createdAt: saleDataForCupom.createdAt,
          updatedAt: saleDataForCupom.createdAt
        })

        setSaleStatus("closed")
        setCart([])
        setItemCounter(0)
        setSelectedCustomer(null)
        setSelectedProduct(null)
        setDiscount(0)
        setSaleNumber((prev) => prev + 1)
        setCpfInput("")
        setIncludeCpf(false)
        setBarcode("")

        setShowReceiptModal(true)
      } else {
        const ct = response.headers.get("content-type") || ""
        let errorMsg = `Erro ${response.status}`
        try {
          if (ct.includes("application/json")) {
            const err = await response.json()
            errorMsg = err.error || JSON.stringify(err)
          } else {
            errorMsg = await response.text()
          }
        } catch {
          // ignora parsing error
        }
        showError(errorMsg)
      }
    } catch (error) {
      console.error("Erro ao realizar venda:", error)
      showError("Erro ao realizar venda")
    } finally {
      setIsLoading(false)
    }
  }

  const printReceipt = () => {
    const saleData = completeSaleData || lastSale

    if (!saleData) {
      showError("Dados da venda não encontrados!")
      return
    }

    console.log("🧾 Usando dados salvos para cupom:", saleData)

    const receiptContent = `
========================================
          SISTEMA ERP COMERCIAL
========================================
CNPJ: 00.000.000/0001-00
Endereço: Rua Exemplo, 123
Centro - Cidade, Estado
Tel: (11) 1234-5678
========================================

          CUPOM FISCAL NÃO FISCAL
          
Venda Nº: ${saleData.saleNumber || saleData.id}
Data: ${new Date(saleData.createdAt).toLocaleString("pt-BR")}
Operador: ${saleData.operator || "Sistema"}

Cliente: ${saleData.customerName}
${saleData.cpfUsuario ? `CPF: ${saleData.cpfUsuario.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}` : ""}

========================================
CÓDIGO    DESCRIÇÃO           QTD  TOTAL
========================================
${saleData.items
  .map((item: any) => {
    const codigo = (item.productCode || item.productBarcode || "--------").padEnd(8)
    const nome = item.productName.substring(0, 18).padEnd(18)
    const qtd = item.quantity.toFixed(3).padStart(4)
    const total = item.total.toFixed(2).padStart(8)
    return `${codigo} ${nome} ${qtd} ${total}`
  })
  .join("\n")}

========================================
Qtd. Total de Itens:              ${saleData.totalItems.toFixed(3).padStart(6)}

Valor Sub-Total R$:               ${toMoney(saleData.subtotal).padStart(8)}
${saleData.discount > 0 ? `Desconto R$:                      ${toMoney(saleData.discount).padStart(8)}` : ""}
Valor Total R$:                   ${toMoney(saleData.total).padStart(8)}

FORMA DE PAGAMENTO: ${saleData.paymentMethod === "cash" ? "DINHEIRO" : saleData.paymentMethod === "credit_card" ? "CARTÃO DE CRÉDITO" : saleData.paymentMethod === "debit_card" ? "CARTÃO DE DÉBITO" : "PIX"}
${saleData.paymentMethod === "cash" && saleData.receivedAmount ? `Valor Recebido R$:               ${toMoney(saleData.receivedAmount).padStart(8)}` : `Valor Pago R$:                   ${toMoney(saleData.total).padStart(8)}`}
${saleData.paymentMethod === "cash" && saleData.changeAmount > 0 ? `Troco R$:                        ${toMoney(saleData.changeAmount).padStart(8)}` : ""}

========================================
          EMISSÃO: ${new Date().toLocaleString("pt-BR")}
          
${saleData.cpfUsuario ? "" : "CONSUMIDOR NÃO IDENTIFICADO"}

========================================
       OBRIGADO PELA PREFERÊNCIA!
          VOLTE SEMPRE!
========================================
  `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
    <html>
      <head>
        <title>Cupom Fiscal - Venda ${saleData.saleNumber}</title>
        <style>
          body { 
            font-family: 'Courier New', monospace; 
            font-size: 12px; 
            margin: 20px;
            line-height: 1.2;
          }
          pre { 
            white-space: pre-wrap; 
            margin: 0;
          }
          @media print {
            body { margin: 0; }
            @page { margin: 0.5cm; }
          }
        </style>
      </head>
      <body>
        <pre>${receiptContent}</pre>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => window.close(), 1000);
          }
        </script>
      </body>
    </html>
  `)
      printWindow.document.close()
    }

    setShowReceiptModal(false)
  }

  const currentDate = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  // Componente para informações do produto (mobile)
  const ProductInfo = () => (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Produto Selecionado</CardTitle>
      </CardHeader>
      <CardContent>
        {selectedProduct ? (
          <div className="space-y-3">
            <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center h-24 sm:h-32">
              <Package className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
            </div>
            <div>
              <h3 className="font-medium text-sm">{selectedProduct.name}</h3>
              <p className="text-xs text-gray-600">Código: {selectedProduct.codigo || "N/A"}</p>
              <p className="text-xs text-gray-600">Barras: {selectedProduct.barcode || "N/A"}</p>
              <p className="text-xs text-gray-600">Estoque: {selectedProduct.stockQuantity}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-xs text-gray-600">Preço Unitário</div>
              <div className="text-lg font-bold text-blue-600">R$ {selectedProduct.salePrice.toFixed(2)}</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm">
            {saleStatus === "closed" ? "Pressione F1 para iniciar venda" : "Nenhum produto selecionado"}
          </div>
        )}
      </CardContent>
    </Card>
  )

  const handleCashPayment = () => {
    setShowCashPaymentModal(true)
    setCashReceived("")
    setCashChange(0)
    // Focar no input de dinheiro
    setTimeout(() => {
      if (cashInputRef.current) {
        cashInputRef.current.focus()
      }
    }, 100)
  }

  const calculateChange = (received: string) => {
    const receivedValue = Number.parseFloat(received) || 0
    const totalValue = getTotal()
    const change = receivedValue - totalValue
    setCashChange(change >= 0 ? change : 0)
    return change
  }

  const processCashPayment = async () => {
    const receivedValue = Number.parseFloat(cashReceived) || 0
    const totalValue = getTotal()

    if (receivedValue < totalValue) {
      showError("Valor recebido deve ser maior ou igual ao valor da compra!")
      return
    }

    setIsProcessingPayment(true)

    try {
      const paymentDetails = {
        receivedAmount: receivedValue,
        changeAmount: cashChange,
        observation: cashChange > 0 ? `Troco: R$ ${cashChange.toFixed(2)}` : null,
      }

      await completeSale("cash", paymentDetails)
      setShowCashPaymentModal(false)
    } catch (error) {
      showError("Erro ao processar pagamento")
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const handlePixPayment = async () => {
    setShowPixPaymentModal(true)
    setPixStatus("generating")
    setPixData(null)

    try {
      const pixPaymentData = {
        saleId: `temp-${Date.now()}`,
        operatorId: "cmbe6dlm6000jcsy4qmjjgvi5",
        totalAmount: getTotal(),
        customerName: selectedCustomer?.name || "Cliente",
        customerCpf: cpfInput || null,
      }

      console.log("🔥 Gerando PIX:", pixPaymentData)

      const response = await fetch("/api/payments/pix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pixPaymentData),
      })

      if (response.ok) {
        const result = await response.json()
        console.log("✅ PIX gerado:", result)

        setPixData(result.pix)
        setPixStatus("pending")

        setPixTimer(30 * 60)

        setTimeout(() => {
          confirmPixPayment(result.pix.txid)
        }, 10000)
      } else {
        const error = await response.json()
        showError(`Erro ao gerar PIX: ${error.error}`)
        setShowPixPaymentModal(false)
      }
    } catch (error) {
      console.error("Erro ao gerar PIX:", error)
      showError("Erro ao gerar PIX")
      setShowPixPaymentModal(false)
    }
  }

  const confirmPixPayment = async (txid: string) => {
    try {
      const response = await fetch("/api/payments/pix/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          txid,
          payerName: selectedCustomer?.name || "Cliente Teste",
          payerDocument: cpfInput || null,
        }),
      })

      if (response.ok) {
        setPixStatus("confirmed")

        setTimeout(async () => {
          const paymentDetails = {
            txid,
            pixData: pixData,
            observation: `PIX confirmado - TXID: ${txid}`,
          }

          await completeSale("pix", paymentDetails)
          setShowPixPaymentModal(false)
        }, 2000)
      } else {
        console.error("Erro ao confirmar PIX")
      }
    } catch (error) {
      console.error("Erro ao confirmar PIX:", error)
    }
  }

  const copyPixCode = () => {
    if (pixData?.pixCopyPaste) {
      navigator.clipboard.writeText(pixData.pixCopyPaste)
      showSuccess("Código PIX copiado para a área de transferência!")
    }
  }

  // Função para processar pagamento com cartão usando CardForm
  const handleCardPayment = async (cardData: any) => {
    setShowCardPaymentModal(true)
    setCardStatus('processing')
    setCardData(null)

    try {
      console.log('💳 Iniciando processamento de pagamento com cartão...')
      console.log('📋 Dados do CardForm:', {
        ...cardData,
        token: cardData.token ? '***' : null,
      })
      
      // Enviar dados do CardForm para o backend
      const cardPaymentData = {
        saleId: `temp-${Date.now()}`,
        operatorId: 'cmbe6dlm6000jcsy4qmjjgvi5',
        totalAmount: getTotal(),
        customerName: selectedCustomer?.name || 'Cliente',
        customerCpf: cpfInput || null,
        token: cardData.token,
        paymentMethodId: cardData.paymentMethodId,
        installments: cardData.installments || 1,
        email: cardData.cardholderEmail,
        issuer_id: cardData.issuerId,
        identificationType: cardData.identificationType,
      }

      console.log('📤 Enviando dados para API:', {
        ...cardPaymentData,
        token: '***' // Não logar o token por segurança
      })

      const response = await fetch('/api/payments/card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardPaymentData),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('🔥 RETORNO NO PAGAMENTO CARTÃO:', result)
        
        if (result.card?.status === 'approved') {
          setCardData(result.card)
          setCardStatus('approved')

          // Finalizar venda
          setTimeout(async () => {
            await completeSale('credit_card', {
              transactionId: result.card?.transactionId || 'N/A',
              cardData: result.card,
              observation: `Cartão confirmado - Transaction ID: ${result.card?.transactionId || 'N/A'}`,
            })
            setShowCardPaymentModal(false)
          }, 2000)
        } else {
          const errorMessage = result.card?.status_detail || 'Pagamento recusado'
          showError(`Pagamento recusado: ${errorMessage}`)
          setCardStatus('rejected')
        }
      } else {
        const error = await response.json()
        showError(`Erro ao processar pagamento com cartão: ${error.error}`)
        setCardStatus('rejected')
      }
    } catch (error) {
      console.error('❌ Erro ao processar cartão:', error)
      console.error('📋 Detalhes do erro:', {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      })
      showError(`Erro ao processar pagamento com cartão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      setCardStatus('rejected')
    }
  }

  // Modal de pagamento com cartão
  const CardPaymentModal = ({
    open,
    type,
    amount,
    onClose,
    onOk,
    onManual,
  }: {
    open: boolean
    type: 'credit' | 'debit'
    amount: number
    onClose: () => void
    onOk: () => void
    onManual: () => void
  }) => {
    // Fechar com ESC, OK com ENTER, manual com F12
    useEffect(() => {
      if (!open) return
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          onClose()
        } else if (e.key === 'Enter') {
          e.preventDefault()
          onOk()
        } else if (e.key === 'F12') {
          e.preventDefault()
          onManual()
        }
      }
      window.addEventListener('keydown', handleKey)
      return () => window.removeEventListener('keydown', handleKey)
    }, [open, onClose, onOk, onManual])

    return (
      <Dialog open={open} onOpenChange={v => !v && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-bold text-gray-900 flex items-center justify-center gap-2">
              <CreditCard className="w-6 h-6 text-blue-600" />
              Pagamento com Cartão - {type === 'credit' ? 'Crédito' : 'Débito'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Informações da empresa */}
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
              <div className="text-xs text-center text-gray-600">
                60.177.876/0001-30 | CLIENTE HOMOLOGACAO (D) - VENDA FALSA
              </div>
            </div>

            {/* Valor da transação */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">Valor da Transação:</span>
                <span className="text-2xl font-bold text-blue-600">R$ {amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Instruções para o cartão */}
            <div className="bg-white border-2 border-blue-200 rounded-lg p-6 min-h-[80px] flex items-center justify-center text-center">
              <div className="space-y-2">
                <div className="text-blue-600">
                  <CreditCard className="w-8 h-8 mx-auto mb-2" />
                </div>
                <div className="font-semibold text-gray-900 text-lg">
                  APROXIME, INSIRA OU PASSE O CARTÃO
                </div>
                <div className="text-sm text-gray-600">
                  Aguardando leitura do cartão...
                </div>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <Button 
                  onClick={onOk}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold h-10"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  [ENTER] - OK
                </Button>
                <Button 
                  onClick={onManual}
                  variant="outline"
                  className="flex-1 border-yellow-500 text-yellow-600 hover:bg-yellow-50 font-semibold h-10"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  [F12] - DIGITADA
                </Button>
              </div>
              <Button 
                onClick={onClose}
                variant="outline"
                className="w-full border-red-500 text-red-600 hover:bg-red-50 font-semibold h-10"
              >
                <X className="w-4 h-4 mr-2" />
                [ESC] - CANCELAR
              </Button>
            </div>

            {/* Suporte */}
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
              <div className="text-xs text-center text-gray-600">
                <Phone className="w-3 h-3 inline mr-1" />
                Dúvidas - 0800 777 8134
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const CardFormModal = ({
    open,
    onClose,
    onConfirm,
    amount,
  }: {
    open: boolean
    onClose: () => void
    onConfirm: (cardData: any) => void
    amount: number
  }) => {
    const [isProcessing, setIsProcessing] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [isFormReady, setIsFormReady] = React.useState(false)

    // Inicializar CardForm quando o modal abrir
    React.useEffect(() => {
      if (!open || !mp) return

      // Aguardar um pouco para garantir que o DOM está renderizado
      const timer = setTimeout(() => {
        try {
          // Verificar se o elemento existe antes de inicializar
          const formElement = document.getElementById('card-form')
          if (!formElement) {
            console.error('❌ Elemento card-form não encontrado')
            setError('Erro: Elemento do formulário não encontrado')
            return
          }

          console.log('🔍 Inicializando CardForm...')
          const cardForm = mp.cardForm({
            amount: amount.toString(),
            iframe: true,
            form: {
              id: "card-form",
              cardNumber: {
                id: "card-form__cardNumber",
                placeholder: "Número do cartão",
              },
              expirationDate: {
                id: "card-form__expirationDate",
                placeholder: "MM/YY",
              },
              securityCode: {
                id: "card-form__securityCode",
                placeholder: "Código de segurança",
              },
              cardholderName: {
                id: "card-form__cardholderName",
                placeholder: "Titular do cartão",
              },
              issuer: {
                id: "card-form__issuer",
                placeholder: "Banco emissor",
              },
              installments: {
                id: "card-form__installments",
                placeholder: "Parcelas",
              },        
              identificationType: {
                id: "card-form__identificationType",
                placeholder: "Tipo de documento",
              },
              identificationNumber: {
                id: "card-form__identificationNumber",
                placeholder: "Número do documento",
              },
              cardholderEmail: {
                id: "card-form__cardholderEmail",
                placeholder: "E-mail",
              },
            },
            callbacks: {
              onFormMounted: (error: any) => {
                if (error) {
                  console.warn("Form Mounted handling error: ", error);
                  setError('Erro ao carregar formulário: ' + error.message);
                  setIsFormReady(false);
                } else {
                  console.log("✅ Form mounted");
                  setError(null);
                  setIsFormReady(true);
                }
              },
              onSubmit: (event: any) => {
                event.preventDefault();
                setIsProcessing(true);
                setError(null);

                const cardData = cardForm.getCardFormData();
                console.log('📦 Dados do cartão:', {
                  ...cardData,
                  token: cardData.token ? '***' : null,
                });

                onConfirm(cardData);
              },
              onFetching: (resource: any) => {
                console.log("Fetching resource: ", resource);
              }
            },
          });

          console.log('✅ CardForm inicializado com sucesso')
        } catch (error) {
          console.error('❌ Erro ao inicializar CardForm:', error);
          setError('Erro ao inicializar formulário: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
        }
      }, 100); // Aguardar 100ms para garantir que o DOM está pronto

      return () => {
        clearTimeout(timer);
      };
    }, [open, mp, amount]);

    return (
      <Dialog open={open} onOpenChange={v => !v && onClose()}>
        <DialogContent className="max-w-[50rem]">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-bold text-gray-900">
              Pagamento com Cartão - R$ {amount.toFixed(2)}
            </DialogTitle>
          </DialogHeader>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {!isFormReady && !error && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Carregando formulário de pagamento...</span>
              </div>
            </div>
          )}

          <form id="card-form" className="flex flex-col gap-4">
            {/* Sugestões de cartões de teste */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-blue-800 mb-2">💳 Cartões de Teste (MercadoPago):</div>
              <div className="text-xs text-blue-700 space-y-1">
                <div><strong>Visa:</strong> 4509 9535 6623 3704 | CVV: 123 | Val: 11/25</div>
                <div><strong>Mastercard:</strong> 5031 4332 1540 6351 | CVV: 123 | Val: 11/25</div>
                <div><strong>Amex:</strong> 3711 8030 3257 522 | CVV: 1234 | Val: 11/25</div>
                <div><strong>Recusado:</strong> 4000 0000 0000 0002 | CVV: 123 | Val: 11/25</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div id="card-form__cardNumber" className="h-12 border border-gray-300 rounded px-3 py-2 bg-white"></div>
              <div id="card-form__expirationDate" className="h-12 border border-gray-300 rounded px-3 py-2 bg-white"></div>
              <div id="card-form__securityCode" className="h-12 border border-gray-300 rounded px-3 py-2 bg-white"></div>
              <input type="text" id="card-form__cardholderName" placeholder="Nome do titular" className="h-12 border border-gray-300 rounded px-3 py-2" />
              <select id="card-form__issuer" className="h-12 border border-gray-300 rounded px-3 py-2"></select>
              <select id="card-form__installments" className="h-12 border border-gray-300 rounded px-3 py-2"></select>
              <select id="card-form__identificationType" className="h-12 border border-gray-300 rounded px-3 py-2"></select>
              <input type="text" id="card-form__identificationNumber" placeholder="Número do documento" defaultValue="12345678909" className="h-12 border border-gray-300 rounded px-3 py-2" />
              <input type="email" id="card-form__cardholderEmail" placeholder="E-mail" defaultValue="teste@exemplo.com" className="h-12 border border-gray-300 rounded px-3 py-2" />
            </div>

            <button 
              type="submit" 
              id="card-form__submit"
              disabled={isProcessing || !isFormReady}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg text-lg"
            >
              {isProcessing ? 'Processando...' : !isFormReady ? 'Carregando formulário...' : 'Confirmar Pagamento'}
            </button>
          </form>

          <div className="flex gap-2 mt-4">
            <button 
              type="button" 
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex-1" 
              onClick={onClose}
            >
              Cancelar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const [paymentPolling, setPaymentPolling] = useState<{
    id: string;
    type: 'card' | 'pix';
    visible: boolean;
    status: string;
    observacao?: string;
  } | null>(null)

  // Função para iniciar polling
  const startPaymentPolling = (id: string, type: 'card' | 'pix') => {
    setPaymentPolling({ id, type, visible: true, status: 'aguardando' })
  }

  // Polling effect
  useEffect(() => {
    if (!paymentPolling || !paymentPolling.visible) return
    let interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/status?id=${paymentPolling.id}&type=${paymentPolling.type}`)
        if (res.ok) {
          const data = await res.json()
          if (data.status === 'confirmado' || data.status === 'approved') {
            setPaymentPolling(p => p ? { ...p, status: 'confirmado', observacao: data.observacao } : null)
            clearInterval(interval)
            setTimeout(() => setPaymentPolling(null), 2000)
          } else {
            setPaymentPolling(p => p ? { ...p, status: data.status, observacao: data.observacao } : null)
          }
        }
      } catch {}
    }, 3000)
    return () => clearInterval(interval)
  }, [paymentPolling?.id, paymentPolling?.type, paymentPolling?.visible])

  // Exemplo de uso após pagamento manual:
  // startPaymentPolling(paymentId, 'card')
  // Exemplo para pix: startPaymentPolling(paymentId, 'pix')

  // Modal de status de pagamento
  const PaymentStatusModal = ({ open, status, observacao }: { open: boolean; status: string; observacao?: string }) => (
    <Dialog open={open}>
      <DialogContent className="max-w-md text-center">
        {status === 'confirmado' || status === 'approved' ? (
          <div className="text-green-700 font-bold text-lg">Pagamento confirmado!</div>
        ) : (
          <>
            <div className="text-blue-700 font-bold text-lg mb-2">Aguardando confirmação do pagamento...</div>
            <div className="text-gray-600 text-sm">Assim que o pagamento for aprovado, a venda será finalizada automaticamente.</div>
          </>
        )}
        {observacao && <div className="text-xs text-gray-500 mt-2">{observacao}</div>}
      </DialogContent>
    </Dialog>
  )

  // Modal de status do pagamento com cartão
  const CardPaymentStatusModal = () => (
    <Dialog open={showCardPaymentModal} onOpenChange={setShowCardPaymentModal}>
      <DialogContent className="max-w-md text-center">
        {cardStatus === 'processing' && (
          <>
            <div className="text-blue-700 font-bold text-lg mb-2">Processando pagamento...</div>
            <div className="text-gray-600 text-sm">Aguarde enquanto processamos o pagamento com cartão.</div>
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
            </div>
          </>
        )}
        {cardStatus === 'approved' && (
          <>
            <div className="text-green-700 font-bold text-lg mb-2">Pagamento aprovado!</div>
            <div className="text-green-600 text-sm">Cartão processado com sucesso.</div>
            {cardData && (
              <div className="text-xs text-gray-500 mt-2 space-y-1">
                <div>Transaction ID: {cardData.transactionId || 'N/A'}</div>
                <div>Status: {cardData.status || 'N/A'}</div>
                {cardData.status_detail && (
                  <div>Detalhes: {cardData.status_detail}</div>
                )}
              </div>
            )}
          </>
        )}
        {cardStatus === 'rejected' && (
          <>
            <div className="text-red-700 font-bold text-lg mb-2">Pagamento rejeitado!</div>
            <div className="text-red-600 text-sm">Erro ao processar o cartão.</div>
            {cardData && cardData.status_detail && (
              <div className="text-xs text-red-500 mt-2">
                Motivo: {cardData.status_detail}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header - Responsivo */}
      <div className="bg-white border-b border-gray-200 p-2 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">Nº Venda:</span>
            <span className="bg-blue-100 px-2 py-1 rounded text-xs">{saleNumber}</span>
            <span
              className={`px-2 py-1 rounded text-xs ${
                saleStatus === "open"
                  ? "bg-green-100 text-green-700"
                  : saleStatus === "finalizing"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-700"
              }`}
            >
              {saleStatus === "open" ? "ABERTA" : saleStatus === "finalizing" ? "FINALIZANDO" : "FECHADA"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">{currentDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
            <span className="font-medium">Operador:</span>
            <span className="text-blue-600">{operatorInfo.name}</span>
          </div>
          <div className="flex items-center gap-2 col-span-1 sm:col-span-2 lg:col-span-1">
            <User className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Cliente:</span>
            <select
              value={selectedCustomer?.id || ""}
              onChange={(e) => {
                const customer = customers.find((c) => c.id === e.target.value)
                console.log("👤 Cliente selecionado:", customer)
                setSelectedCustomer(customer || null)
              }}
              className="border rounded px-2 py-1 text-xs sm:text-sm flex-1 min-w-0"
              disabled={saleStatus === "closed"}
            >
              <option value="">CLIENTE PADRÃO</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
            {/* Debug info */}
            <div className="text-xs text-gray-500">
              {customers.length > 0 ? `${customers.length} clientes carregados` : "Nenhum cliente"}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-medium">Caixa:</span>
            {cashRegisterStatus.isLoading ? (
              <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">Verificando...</span>
            ) : cashRegisterStatus.isOpen ? (
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">ABERTO</span>
            ) : (
              <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">FECHADO</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-3 h-3 text-green-600" />
            <span className="font-medium">NFC-e:</span>
            <span
              className={`px-2 py-1 rounded text-xs ${fiscalSettings.emitirNFCe ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}
            >
              {fiscalSettings.emitirNFCe ? `Ativa - Série ${fiscalSettings.serieNFCe}` : "Inativa"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Receipt className="w-3 h-3 text-purple-600" />
            <span>CPF na Nota:</span>
            <span
              className={`px-2 py-1 rounded text-xs ${
                includeCpf ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
              }`}
            >
              {includeCpf ? "SIM" : "NÃO"}
            </span>
            {includeCpf && cpfInput && <span className="text-xs text-gray-600">{formatCpf(cpfInput)}</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Modo:</span>
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">TECLADO</span>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setShowKeyboardHelp(true)}>
              F9 - Ajuda
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Layout Responsivo */}
      <div className="flex-1 p-2 sm:p-4">
        {/* Barcode Scanner - Compacto no topo */}
        <div className="mb-4 w-[24rem]">
          <div className="bg-white border border-gray-200 rounded-lg p-3 w-[24rem]">
            <div className="flex items-center gap-3 w-[20rem]">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Package className="w-4 h-4" />
                <span>Código:</span>
              </div>
              <form onSubmit={handleBarcodeSubmit} className="flex-1">
                <Input
                  ref={barcodeInputRef}
                  placeholder="Digite código de barras..."
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  disabled={saleStatus !== "open"}
                  autoFocus={saleStatus === "open"}
                  className="font-mono h-9 w-64"
                />
              </form>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {/* <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">I</kbd>
                <span>focar</span> */}
              </div>
            </div>
            {(loadingProducts || productsError || products.length > 0) && (
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                {loadingProducts && <span className="text-blue-600">Carregando produtos...</span>}
                {productsError && <span className="text-red-600">Erro: {productsError}</span>}
                <span>Produtos: {products.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-4 h-full">
          {/* Left Panel - Product Info */}
          <div className="col-span-3 space-y-4">
            <ProductInfo />

            {/* Sale Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Status da Venda</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span
                      className={`font-medium ${
                        saleStatus === "open"
                          ? "text-green-600"
                          : saleStatus === "finalizing"
                            ? "text-yellow-600"
                            : "text-gray-600"
                      }`}
                    >
                      {saleStatus === "open"
                        ? "Venda Aberta"
                        : saleStatus === "finalizing"
                          ? "Finalizando"
                          : "Venda Fechada"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Operador:</span>
                    <span className="text-blue-600">{operatorInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CPF na Nota:</span>
                    <span>{includeCpf ? "Sim" : "Não"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Itens:</span>
                    <span>{cart.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Cart Items */}
          <div className="col-span-6">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Itens da Venda
                </CardTitle>
              </CardHeader>
              <CardContent>
                {saleStatus === "closed" ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <ShoppingCart className="w-16 h-16 mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">Venda Fechada</h3>
                    <p className="text-sm text-center">Pressione F1 ou clique em "Iniciar Venda" para começar</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-600 border-b pb-2">
                      <div className="col-span-1">Item</div>
                      <div className="col-span-2">Código</div>
                      <div className="col-span-4">Descrição</div>
                      <div className="col-span-1">UN</div>
                      <div className="col-span-1">Qtd</div>
                      <div className="col-span-2">Vl. Unit</div>
                      <div className="col-span-1">Total</div>
                    </div>

                    {/* Items */}
                    <ScrollArea className="h-80">
                      <div className="space-y-1">
                        {cart.map((item) => (
                          <div
                            key={item.id}
                            className="grid grid-cols-12 gap-2 text-xs py-2 border-b hover:bg-gray-50 group"
                          >
                            <div className="col-span-1 font-medium">{item.itemNumber}</div>
                            <div className="col-span-2 font-mono">{item.product.codigo || item.productBarcode}</div>
                            <div className="col-span-4">{item.productName}</div>
                            <div className="col-span-1">UN</div>
                            <div className="col-span-1 flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                                onClick={() => updateQuantity(item.itemNumber, item.quantity - 1)}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-8 text-center">{item.quantity.toFixed(3)}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                                onClick={() => updateQuantity(item.itemNumber, item.quantity + 1)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="col-span-2">{item.unitPrice.toFixed(2)}</div>
                            <div className="col-span-1 flex items-center justify-between">
                              <span>{item.total.toFixed(2)}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                                onClick={() => removeFromCart(item.itemNumber)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    {cart.length === 0 && saleStatus === "open" && (
                      <div className="text-center py-12 text-gray-500">
                        Escaneie ou digite o código de barras para adicionar produtos
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Summary */}
          <div className="col-span-3 space-y-4">
            {/* Totals */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Resumo da Venda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Preço Venda:</span>
                    <span className="font-mono">R$ {getSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Nº Itens:</span>
                    <span className="font-mono">{getTotalItems()}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Desconto:</span>
                      <span className="font-mono">- R$ {discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">TOTAL GERAL:</span>
                      <span className="text-xl font-bold text-green-600 font-mono">R$ {getTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Discount */}
                {saleStatus === "open" && (
                  <div>
                    <label className="block text-xs font-medium mb-1">Desconto (R$)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={discount}
                      onChange={(e) => setDiscount(Number.parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="text-sm"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mobile/Tablet Layout */}
        <div className="lg:hidden space-y-4">
          {/* Product Info - Mobile (Sheet) */}
          <div className="flex gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  <Info className="w-4 h-4 mr-2" />
                  Produto
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Informações do Produto</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <ProductInfo />
                </div>
              </SheetContent>
            </Sheet>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Resumo ({cart.length})
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Resumo da Venda</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Preço Venda:</span>
                      <span className="font-mono">R$ {getSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Nº Itens:</span>
                      <span className="font-mono">{getTotalItems()}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-red-600">
                        <span>Desconto:</span>
                        <span className="font-mono">- R$ {discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">TOTAL GERAL:</span>
                        <span className="text-xl font-bold text-green-600 font-mono">R$ {getTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Discount */}
                  {saleStatus === "open" && (
                    <div>
                      <label className="block text-xs font-medium mb-1">Desconto (R$)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={discount}
                        onChange={(e) => setDiscount(Number.parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Cart Items - Mobile */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Itens da Venda ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {saleStatus === "closed" ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mb-4 text-gray-300" />
                  <h3 className="text-base font-medium mb-2">Venda Fechada</h3>
                  <p className="text-sm text-center">Pressione F1 ou clique em "Iniciar Venda" para começar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      Escaneie ou digite o código de barras para adicionar produtos
                    </div>
                  ) : (
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {cart.map((item) => (
                          <div key={item.id} className="border rounded-lg p-3 bg-white">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="font-medium text-sm">{item.productName}</div>
                                <div className="text-xs text-gray-600">
                                  Item {item.itemNumber} • Código: {item.product.codigo || item.productBarcode}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-500"
                                onClick={() => removeFromCart(item.itemNumber)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0 bg-transparent"
                                  onClick={() => updateQuantity(item.itemNumber, item.quantity - 1)}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="text-sm font-mono w-12 text-center">{item.quantity.toFixed(3)}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0 bg-transparent"
                                  onClick={() => updateQuantity(item.itemNumber, item.quantity + 1)}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-gray-600">R$ {item.unitPrice.toFixed(2)} un</div>
                                <div className="font-medium">R$ {item.total.toFixed(2)}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Total - Mobile */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">TOTAL GERAL:</span>
                <span className="text-2xl font-bold text-green-600 font-mono">R$ {getTotal().toFixed(2)}</span>
              </div>
              {getTotalItems() > 0 && (
                <div className="text-sm text-gray-600 mt-1">
                  {getTotalItems()} {getTotalItems() === 1 ? "item" : "itens"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Function Keys Bar - Responsivo */}
      <div className="bg-white border-t border-gray-200 p-2 sm:p-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-1 sm:gap-2 text-xs">
          <Button
            variant="outline"
            size="sm"
            className="h-8 sm:h-10 text-xs bg-[#0f172a] text-white hover:bg-green-100 border-green-200"
            onClick={handleStartSaleClick}
            disabled={saleStatus !== "closed" || cashRegisterStatus.isLoading}
          >
            <span className="font-bold mr-1">F1</span>
            <span className="hidden sm:inline">Iniciar</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8 sm:h-10 text-xs bg-transparent" disabled>
            <span className="font-bold mr-1">F2</span>
            <span className="hidden sm:inline">Alterar</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8 sm:h-10 text-xs bg-transparent" disabled>
            <span className="font-bold mr-1">F3</span>
            <span className="hidden sm:inline">Consulta</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 sm:h-10 text-xs bg-blue-50 hover:bg-blue-100 border-blue-200"
            onClick={handleFinalizeSale}
            disabled={saleStatus !== "open" || cart.length === 0}
          >
            <span className="font-bold mr-1">F4</span>
            <span className="hidden sm:inline">Finalizar</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 sm:h-10 text-xs bg-red-50 hover:bg-red-100 border-red-200"
            onClick={() => setShowDeleteProductModal(true)}
            disabled={saleStatus !== "open"}
          >
            <span className="font-bold mr-1">F5</span>
            <span className="hidden sm:inline">Excluir</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 sm:h-10 text-xs bg-red-50 hover:bg-red-100 border-red-200"
            onClick={() => setShowCancelSaleModal(true)}
            disabled={saleStatus !== "open"}
          >
            <span className="font-bold mr-1">F6</span>
            <span className="hidden sm:inline">Cancelar</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 sm:h-10 text-xs bg-purple-50 hover:bg-purple-100 border-purple-200"
            onClick={() => setShowSearchSaleModal(true)}
          >
            <span className="font-bold mr-1">F7</span>
            <span className="hidden sm:inline">Buscar</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8 sm:h-10 text-xs bg-transparent" disabled>
            <span className="font-bold mr-1">F8</span>
            <span className="hidden sm:inline">Qtd</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 sm:h-10 text-xs bg-yellow-50 hover:bg-yellow-100 border-yellow-200"
            onClick={() => setShowKeyboardHelp(true)}
          >
            <span className="font-bold mr-1">F9</span>
            <span className="hidden sm:inline">Ajuda</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 sm:h-10 text-xs bg-gray-50 hover:bg-gray-100 border-gray-200"
            onClick={printReceipt}
            disabled={!completeSaleData && !lastSale}
          >
            <span className="font-bold mr-1">F10</span>
            <span className="hidden sm:inline">Imprimir</span>
          </Button>
        </div>
      </div>

      {/* Modals */}

      {/* Start Sale Modal */}
      <Dialog open={showStartSaleModal} onOpenChange={setShowStartSaleModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Enter className="w-5 h-5 text-green-600" />
              Iniciar Nova Venda
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Informações da Venda</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex justify-between">
                  <span>Número da Venda:</span>
                  <span className="font-mono font-bold">{saleNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Operador:</span>
                  <span>{operatorInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Data/Hora:</span>
                  <span>{currentDate}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCpf"
                  checked={includeCpf}
                  onCheckedChange={(checked) => setIncludeCpf(checked as boolean)}
                />
                <Label htmlFor="includeCpf" className="text-sm">
                  Incluir CPF na nota fiscal
                </Label>
              </div>

              {includeCpf && (
                <div>
                  <Label htmlFor="cpf" className="text-sm font-medium">
                    CPF do Cliente
                  </Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={cpfInput}
                    onChange={(e) => setCpfInput(e.target.value)}
                    maxLength={14}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStartSaleModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleStartSale} className="bg-green-600 hover:bg-green-700">
              <Enter className="w-4 h-4 mr-2" />
              Iniciar Venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Sale Modal */}
      <Dialog open={showCancelSaleModal} onOpenChange={setShowCancelSaleModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Cancelar Venda
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Tem certeza que deseja cancelar a venda atual? Todos os itens serão removidos e a venda será encerrada.
            </p>
            {cart.length > 0 && (
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">Itens que serão perdidos:</p>
                <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                  {cart.slice(0, 3).map((item) => (
                    <li key={item.id}>
                      • {item.productName} (Qtd: {item.quantity})
                    </li>
                  ))}
                  {cart.length > 3 && <li>• ... e mais {cart.length - 3} itens</li>}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelSaleModal(false)}>
              Não Cancelar
            </Button>
            <Button variant="destructive" onClick={handleCancelSale}>
              <X className="w-4 h-4 mr-2" />
              Sim, Cancelar Venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Product Modal */}
      <Dialog open={showDeleteProductModal} onOpenChange={setShowDeleteProductModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <X className="w-5 h-5" />
              Excluir Item
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="itemNumber" className="text-sm font-medium">
                Número do Item para Excluir
              </Label>
              <Input
                id="itemNumber"
                type="number"
                placeholder="Digite o número do item"
                value={itemToDelete || ""}
                onChange={(e) => setItemToDelete(Number.parseInt(e.target.value) || null)}
                className="mt-1"
                autoFocus
              />
            </div>
            {cart.length > 0 && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-800 mb-2">Itens disponíveis:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="text-xs text-gray-600 flex justify-between">
                      <span>
                        {item.itemNumber}. {item.productName}
                      </span>
                      <span>Qtd: {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteProductModal(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteProduct}>
              <X className="w-4 h-4 mr-2" />
              Excluir Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search Sale Modal */}
      <Dialog open={showSearchSaleModal} onOpenChange={handleCloseSearchModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              Buscar Venda
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="searchSaleId" className="text-sm font-medium">
                Número da Venda
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="searchSaleId"
                  placeholder="Digite o número da venda"
                  value={searchSaleId}
                  onChange={(e) => setSearchSaleId(e.target.value)}
                  autoFocus
                />
                <Button onClick={searchSale} size="sm">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {foundSale && (
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-2">Venda Encontrada:</p>
                <div className="space-y-1 text-xs text-green-700">
                  <div>Número: {foundSale.saleNumber}</div>
                  <div>Data: {formatDate(foundSale.createdAt)}</div>
                  <div>Cliente: {foundSale.customerName || "CLIENTE PADRÃO"}</div>
                  <div>Total: R$ {safeNumber(foundSale.totalAmount).toFixed(2)}</div>
                  <div>Status: {foundSale.status || "Concluída"}</div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseSearchModal}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Modal */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Erro
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">{modalMessage}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowErrorModal(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Sucesso
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">{modalMessage}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSuccessModal(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Venda Concluída
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <h3 className="font-medium text-green-900">Venda realizada com sucesso!</h3>
              <p className="text-sm text-green-700 mt-1">
                Venda Nº {completeSaleData?.saleNumber} - R$ {completeSaleData?.total?.toFixed(2)}
              </p>
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">Deseja imprimir o cupom fiscal?</p>
              <Button onClick={printReceipt} className="w-full">
                <Printer className="w-4 h-4 mr-2" />
                Imprimir Cupom
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiptModal(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Selection Modal */}
      <Dialog open={showPaymentSelection} onOpenChange={setShowPaymentSelection}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <CreditCard className="w-6 h-6 text-blue-600" />
              Selecionar Forma de Pagamento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Total a pagar */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">Total a Pagar:</span>
                <span className="text-2xl font-bold text-blue-600">R$ {getTotal().toFixed(2)}</span>
              </div>
            </div>

            {/* Opções de pagamento */}
            <div className="space-y-3">
              {paymentOptions.map((option, index) => (
                <Button
                  key={option.id}
                  variant={selectedPaymentIndex === index ? "default" : "outline"}
                  className={`w-full justify-start h-14 text-left transition-all duration-200 ${
                    selectedPaymentIndex === index 
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg scale-105" 
                      : "hover:bg-gray-50 border-gray-300 hover:border-blue-300"
                  }`}
                  onClick={() => handlePaymentSelection(option.id)}
                >
                  <div className="flex items-center gap-4 w-full">
                    <div className={`p-2 rounded-lg ${
                      selectedPaymentIndex === index 
                        ? "bg-white/20" 
                        : "bg-gray-100"
                    }`}>
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-base">{option.name}</div>
                      <div className="text-sm opacity-80">
                        Pressione <kbd className="bg-gray-200 px-1.5 py-0.5 rounded text-xs font-mono">{option.shortcut}</kbd> ou clique aqui
                      </div>
                    </div>
                    {selectedPaymentIndex === index && (
                      <div className="text-blue-600">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </Button>
              ))}
            </div>

            {/* Instruções */}
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Info className="w-4 h-4" />
                <span>Use as setas ↑↓ para navegar, Enter para selecionar ou clique diretamente na opção</span>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowPaymentSelection(false)}
              className="px-6"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cash Payment Modal */}
      <Dialog open={showCashPaymentModal} onOpenChange={setShowCashPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Pagamento em Dinheiro
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total a Pagar:</span>
                <span className="text-xl font-bold text-green-600">R$ {getTotal().toFixed(2)}</span>
              </div>
            </div>
            <div>
              <Label htmlFor="cashReceived" className="text-sm font-medium">
                Valor Recebido
              </Label>
              <Input
                ref={cashInputRef}
                id="cashReceived"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={cashReceived}
                onChange={(e) => {
                  setCashReceived(e.target.value)
                  calculateChange(e.target.value)
                }}
                className="mt-1 text-lg font-mono"
                autoFocus
              />
            </div>
            {cashReceived && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Troco:</span>
                  <span className={`text-xl font-bold ${cashChange >= 0 ? "text-blue-600" : "text-red-600"}`}>
                    R$ {cashChange.toFixed(2)}
                  </span>
                </div>
                {cashChange < 0 && <p className="text-xs text-red-600 mt-1">Valor insuficiente para pagamento</p>}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCashPaymentModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={processCashPayment}
              disabled={isProcessingPayment || !cashReceived || cashChange < 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessingPayment ? "Processando..." : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PIX Payment Modal */}
      <Dialog open={showPixPaymentModal} onOpenChange={setShowPixPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-purple-600" />
              Pagamento PIX
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total a Pagar:</span>
                <span className="text-xl font-bold text-purple-600">R$ {getTotal().toFixed(2)}</span>
              </div>
            </div>

            {pixStatus === "generating" && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">Gerando código PIX...</p>
              </div>
            )}

            {pixStatus === "pending" && pixData && (
              <div className="space-y-4">
                <div className="bg-white border-2 border-purple-200 rounded-lg p-4">
                <div className="text-center">
                  <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 mb-4">
                    <img
                      src={pixData.qrcodeImage ?? "/placeholder.svg"}
                      alt="QR Code PIX"
                      className="mx-auto w-48 h-48"
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Escaneie o QR Code com seu banco ou copie o código PIX</p>

                    <div className="bg-gray-50 p-3 rounded text-xs font-mono break-all">{pixData.pixCopyPaste}</div>

                    <Button onClick={copyPixCode} variant="outline" className="w-full">
                      Copiar Código PIX
                    </Button>
                  </div>
                </div>
                  {/* <div className="space-y-2">
                    <Label className="text-xs font-medium">Código PIX Copia e Cola:</Label>
                    <div className="flex gap-2">
                      <Input
                        value={pixData.pixCopyPaste || ""}
                        readOnly
                        className="text-xs font-mono"
                        placeholder="Código PIX"
                      />
                      <Button size="sm" onClick={copyPixCode}>
                        Copiar
                      </Button>
                    </div>
                  </div> */}
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Aguardando pagamento...</p>
                  <p className="text-xs text-gray-500">Tempo restante: {formatTime(pixTimer)}</p>
                </div>
              </div>
            )}

            {pixStatus === "confirmed" && (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-medium text-green-900 mb-2">Pagamento Confirmado!</h3>
                <p className="text-sm text-green-700">PIX recebido com sucesso</p>
              </div>
            )}

            {pixStatus === "expired" && (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h3 className="font-medium text-red-900 mb-2">PIX Expirado</h3>
                <p className="text-sm text-red-700">O tempo para pagamento expirou</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPixPaymentModal(false)}>
              {pixStatus === "confirmed" ? "Fechar" : "Cancelar"}
            </Button>
            <Button onClick={() => confirmPixPayment(pixData?.txid)} className="w-full sm:w-auto">
                  Simular Confirmação
                </Button>
            {pixStatus === "expired" && (
              <Button onClick={handlePixPayment} className="bg-purple-600 hover:bg-purple-700">
                Gerar Novo PIX
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Keyboard Help Modal */}
      <Dialog open={showKeyboardHelp} onOpenChange={setShowKeyboardHelp}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Atalhos do Teclado
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-3">Teclas de Função</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs">F1</kbd>
                  <span>Iniciar Venda</span>
                </div>
                <div className="flex justify-between">
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs">F2</kbd>
                  <span>Alterar Venda</span>
                </div>
                <div className="flex justify-between">
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs">F3</kbd>
                  <span>Consultar Produto</span>
                </div>
                <div className="flex justify-between">
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs">F4</kbd>
                  <span>Finalizar Venda</span>
                </div>
                <div className="flex justify-between">
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs">F5</kbd>
                  <span>Excluir Item</span>
                </div>
                <div className="flex justify-between">
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs">F6</kbd>
                  <span>Cancelar Venda</span>
                </div>
                <div className="flex justify-between">
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs">F7</kbd>
                  <span>Buscar Venda</span>
                </div>
                <div className="flex justify-between">
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs">F8</kbd>
                  <span>Alterar Quantidade</span>
                </div>
                <div className="flex justify-between">
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs">F9</kbd>
                  <span>Ajuda</span>
                </div>
                <div className="flex justify-between">
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs">F10</kbd>
                  <span>Imprimir Cupom</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Atalhos Gerais</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs">I</kbd>
                  <span>Focar no código de barras</span>
                </div>
                <div className="flex justify-between">
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs">Enter</kbd>
                  <span>Adicionar produto</span>
                </div>
                <div className="flex justify-between">
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs">Esc</kbd>
                  <span>Cancelar/Voltar</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Formas de Pagamento</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs">D</kbd>
                  <span>Dinheiro</span>
                </div>
                <div className="flex justify-between">
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs">C</kbd>
                  <span>Cartão Crédito</span>
                </div>
                <div className="flex justify-between">
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs">B</kbd>
                  <span>Cartão Débito</span>
                </div>
                <div className="flex justify-between">
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs">P</kbd>
                  <span>PIX</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowKeyboardHelp(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CardPaymentModal
        open={!!showCardModal}
        type={showCardModal === 'credit' ? 'credit' : 'debit'}
        amount={getTotal()}
        onClose={() => setShowCardModal(false)}
        onOk={() => {
          setShowCardModal(false)
          // Aqui você pode chamar a função de finalização de venda
          // completeSale('credit_card') ou completeSale('debit_card')
        }}
        onManual={() => {
          setShowCardModal(false)
          setShowManualCardModal(true)
        }}
      />

      <CardFormModal
        open={showManualCardModal}
        onClose={() => setShowManualCardModal(false)}
        onConfirm={async (cardData: any) => {
          setShowManualCardModal(false)
          await handleCardPayment(cardData)
        }}
        amount={getTotal()}
      />

      <PaymentStatusModal
        open={!!paymentPolling?.visible}
        status={paymentPolling?.status || ''}
        observacao={paymentPolling?.observacao}
      />

      <CardPaymentStatusModal />
    </div>
  )
}
