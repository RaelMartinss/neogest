"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Download, Copy, RefreshCw } from "lucide-react"

interface BarcodeGeneratorProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (barcode: string) => void
}

export default function BarcodeGenerator({ isOpen, onClose, onGenerate }: BarcodeGeneratorProps) {
  const [barcodeText, setBarcodeText] = useState("")
  const [barcodeType, setBarcodeType] = useState("CODE128")
  const [generatedBarcode, setGeneratedBarcode] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (isOpen && !barcodeText) {
      // Gerar um código de barras padrão
      const defaultBarcode = generateRandomBarcode()
      setBarcodeText(defaultBarcode)
    }
  }, [isOpen])

  useEffect(() => {
    if (barcodeText) {
      generateBarcode()
    }
  }, [barcodeText, barcodeType])

  const generateRandomBarcode = () => {
    // Gerar um código de barras EAN-13 válido
    const prefix = "789" // Prefixo brasileiro
    const middle = Math.floor(Math.random() * 10000000).toString().padStart(7, "0")
    
    // Calcular dígito verificador
    const digits = (prefix + middle).split("").map(Number)
    const oddSum = digits.filter((_, i) => i % 2 === 0).reduce((sum, digit) => sum + digit, 0)
    const evenSum = digits.filter((_, i) => i % 2 === 1).reduce((sum, digit) => sum + digit, 0)
    const total = oddSum + evenSum * 3
    const checkDigit = (10 - (total % 10)) % 10
    
    return prefix + middle + checkDigit
  }

  const generateBarcode = () => {
    if (!canvasRef.current || !barcodeText) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Configurar canvas
    canvas.width = 300
    canvas.height = 100

    // Desenhar código de barras simples (simulação)
    const barWidth = 2
    const barHeight = 60
    let x = 10

    // Gerar padrão de barras baseado no texto
    const bars = barcodeText.split("").map(char => {
      const code = char.charCodeAt(0)
      return code % 2 === 0 ? 1 : 0 // Alternar barras pretas e brancas
    })

    bars.forEach((bar, index) => {
      if (bar === 1) {
        ctx.fillStyle = "#000"
        ctx.fillRect(x, 20, barWidth, barHeight)
      }
      x += barWidth * 2
    })

    // Adicionar texto abaixo do código de barras
    ctx.fillStyle = "#000"
    ctx.font = "12px monospace"
    ctx.textAlign = "center"
    ctx.fillText(barcodeText, canvas.width / 2, 95)

    setGeneratedBarcode(canvas.toDataURL())
  }

  const handleGenerate = () => {
    if (barcodeText) {
      onGenerate(barcodeText)
      onClose()
    }
  }

  const handleRandomGenerate = () => {
    const newBarcode = generateRandomBarcode()
    setBarcodeText(newBarcode)
  }

  const handleCopy = () => {
    if (barcodeText) {
      navigator.clipboard.writeText(barcodeText)
      alert("Código de barras copiado!")
    }
  }

  const handleDownload = () => {
    if (generatedBarcode) {
      const link = document.createElement("a")
      link.download = `barcode-${barcodeText}.png`
      link.href = generatedBarcode
      link.click()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Gerador de Código de Barras</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="barcodeText">Código de Barras</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="barcodeText"
                value={barcodeText}
                onChange={(e) => setBarcodeText(e.target.value)}
                placeholder="Digite o código de barras"
              />
              <Button variant="outline" size="sm" onClick={handleRandomGenerate}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="barcodeType">Tipo de Código</Label>
            <select
              id="barcodeType"
              value={barcodeType}
              onChange={(e) => setBarcodeType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1"
            >
              <option value="CODE128">Code 128</option>
              <option value="EAN13">EAN-13</option>
              <option value="CODE39">Code 39</option>
              <option value="UPC">UPC</option>
            </select>
          </div>

          {generatedBarcode && (
            <div className="border rounded-lg p-4 bg-white">
              <canvas
                ref={canvasRef}
                className="w-full h-auto border"
                style={{ maxWidth: "100%" }}
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleGenerate} className="flex-1">
              Usar Código
            </Button>
            <Button variant="outline" onClick={handleCopy}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="w-4 h-4" />
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            <p>O código de barras será usado no produto</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 