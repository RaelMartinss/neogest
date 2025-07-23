"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Camera, AlertCircle } from "lucide-react"

interface BarcodeScannerProps {
  isOpen: boolean
  onClose: () => void
  onScan: (barcode: string) => void
}

export default function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (isOpen && !isScanning) {
      startScanning()
    }
    return () => {
      stopScanning()
    }
  }, [isOpen])

  const startScanning = async () => {
    try {
      setError(null)
      setIsScanning(true)

      // Verificar se o navegador suporta getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Câmera não suportada neste navegador")
      }

      // Solicitar acesso à câmera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Usar câmera traseira se disponível
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      // Iniciar detecção de código de barras
      startBarcodeDetection()
    } catch (err) {
      console.error("Erro ao iniciar câmera:", err)
      setError(err instanceof Error ? err.message : "Erro ao acessar câmera")
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    setIsScanning(false)
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
  }

  const startBarcodeDetection = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) return

    const detectBarcode = () => {
      if (!video.paused && !video.ended) {
        // Desenhar o frame atual no canvas
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Obter dados da imagem para análise
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        
        // Simular detecção de código de barras
        // Em uma implementação real, você usaria uma biblioteca como QuaggaJS
        // Por enquanto, vamos simular com um timeout
        setTimeout(() => {
          // Simular código de barras detectado
          const mockBarcode = "7891234567890"
          onScan(mockBarcode)
          stopScanning()
          onClose()
        }, 2000)
      }

      if (isScanning) {
        requestAnimationFrame(detectBarcode)
      }
    }

    detectBarcode()
  }

  const handleClose = () => {
    stopScanning()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Camera className="w-5 h-5 mr-2" />
              Leitor de Código de Barras
            </span>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={startScanning}>Tentar Novamente</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full h-64 bg-black rounded-lg"
                  autoPlay
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full opacity-0"
                />
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-500 bg-opacity-20">
                      <p className="text-white font-medium">Posicione o código de barras na área</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Posicione o código de barras na área destacada para leitura automática
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button onClick={startScanning} disabled={isScanning}>
                    {isScanning ? "Lendo..." : "Iniciar Leitura"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
