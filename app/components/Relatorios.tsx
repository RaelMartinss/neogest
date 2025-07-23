"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Package,
  Users,
  FileText,
  FileSpreadsheet,
  FileIcon as FilePdf,
  Loader2,
} from "lucide-react"

// Importar bibliotecas para exportação
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import "jspdf-autotable"

export default function Relatorios() {
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [selectedTab, setSelectedTab] = useState("vendas")
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [reportData, setReportData] = useState({
    vendas: [],
    estoque: [],
    financeiro: [],
    clientes: [],
  })

  // Dados de exemplo para os relatórios
  const salesData = [
    { period: "Jan", vendas: 45000, lucro: 12000 },
    { period: "Fev", vendas: 52000, lucro: 15000 },
    { period: "Mar", vendas: 48000, lucro: 13500 },
    { period: "Abr", vendas: 61000, lucro: 18000 },
    { period: "Mai", vendas: 55000, lucro: 16500 },
    { period: "Jun", vendas: 67000, lucro: 20000 },
    { period: "Jul", vendas: 58000, lucro: 17200 },
    { period: "Ago", vendas: 63000, lucro: 19000 },
    { period: "Set", vendas: 59000, lucro: 17800 },
    { period: "Out", vendas: 64000, lucro: 19500 },
    { period: "Nov", vendas: 68000, lucro: 21000 },
    { period: "Dez", vendas: 72000, lucro: 23000 },
  ]

  const topProducts = [
    { name: "Coca-Cola 350ml", vendas: 245, receita: 1102.5 },
    { name: "Pão de Açúcar 500g", vendas: 189, receita: 604.8 },
    { name: "Leite Integral 1L", vendas: 156, receita: 904.8 },
    { name: "Arroz Branco 5kg", vendas: 89, receita: 1682.1 },
    { name: "Feijão Preto 1kg", vendas: 78, receita: 741.0 },
    { name: "Açúcar Cristal 1kg", vendas: 67, receita: 321.6 },
    { name: "Café Tradicional 500g", vendas: 62, receita: 868.0 },
    { name: "Óleo de Soja 900ml", vendas: 58, receita: 522.0 },
  ]

  const stockData = [
    { name: "Coca-Cola 350ml", estoque: 120, minimo: 50, status: "Normal" },
    { name: "Pão de Açúcar 500g", estoque: 15, minimo: 20, status: "Baixo" },
    { name: "Leite Integral 1L", estoque: 45, minimo: 30, status: "Normal" },
    { name: "Arroz Branco 5kg", estoque: 25, minimo: 10, status: "Normal" },
    { name: "Feijão Preto 1kg", estoque: 8, minimo: 15, status: "Baixo" },
    { name: "Açúcar Cristal 1kg", estoque: 0, minimo: 20, status: "Esgotado" },
    { name: "Café Tradicional 500g", estoque: 18, minimo: 15, status: "Normal" },
    { name: "Óleo de Soja 900ml", estoque: 12, minimo: 10, status: "Normal" },
  ]

  const financialData = [
    { mes: "Janeiro", receita: 45000, despesas: 32000, lucro: 13000 },
    { mes: "Fevereiro", receita: 52000, despesas: 35000, lucro: 17000 },
    { mes: "Março", receita: 48000, despesas: 33000, lucro: 15000 },
    { mes: "Abril", receita: 61000, despesas: 40000, lucro: 21000 },
    { mes: "Maio", receita: 55000, despesas: 37000, lucro: 18000 },
    { mes: "Junho", receita: 67000, despesas: 42000, lucro: 25000 },
  ]

  const customerData = [
    { nome: "João Silva", compras: 12, valorTotal: 1250.5, ultimaCompra: "15/05/2024" },
    { nome: "Maria Santos", compras: 8, valorTotal: 980.75, ultimaCompra: "22/05/2024" },
    { nome: "Pedro Almeida", compras: 15, valorTotal: 1875.3, ultimaCompra: "10/05/2024" },
    { nome: "Ana Oliveira", compras: 6, valorTotal: 750.2, ultimaCompra: "28/05/2024" },
    { nome: "Carlos Souza", compras: 10, valorTotal: 1120.9, ultimaCompra: "18/05/2024" },
    { nome: "Fernanda Lima", compras: 4, valorTotal: 520.4, ultimaCompra: "30/05/2024" },
  ]

  // Carregar dados quando o período ou a aba mudar
  useEffect(() => {
    loadReportData()
  }, [selectedPeriod, selectedTab])

  // Função para carregar dados do relatório
  const loadReportData = async () => {
    setIsLoading(true)

    try {
      // Em um ambiente real, aqui faríamos uma chamada à API
      // const response = await fetch(`/api/reports/${selectedTab}?period=${selectedPeriod}`)
      // const data = await response.json()

      // Simulando uma chamada à API com dados mockados
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Dados mockados para cada tipo de relatório
      const mockData = {
        vendas: selectedPeriod === "year" ? salesData : salesData.slice(0, 6),
        estoque: stockData,
        financeiro: selectedPeriod === "year" ? financialData.concat(financialData) : financialData,
        clientes: customerData,
      }

      setReportData(mockData)
    } catch (error) {
      console.error("Erro ao carregar dados do relatório:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Função para exportar para Excel
  const exportToExcel = async () => {
    setIsExporting(true)

    try {
      let dataToExport = []
      let fileName = ""

      // Preparar dados baseados na aba selecionada
      switch (selectedTab) {
        case "vendas":
          dataToExport = reportData.vendas.map((item) => ({
            Período: item.period,
            "Vendas (R$)": item.vendas.toFixed(2),
            "Lucro (R$)": item.lucro.toFixed(2),
            "Margem (%)": ((item.lucro / item.vendas) * 100).toFixed(2),
          }))
          fileName = `Relatório_Vendas_${selectedPeriod}_${new Date().toISOString().split("T")[0]}`
          break

        case "estoque":
          dataToExport = reportData.estoque.map((item) => ({
            Produto: item.name,
            "Estoque Atual": item.estoque,
            "Estoque Mínimo": item.minimo,
            Status: item.status,
          }))
          fileName = `Relatório_Estoque_${new Date().toISOString().split("T")[0]}`
          break

        case "financeiro":
          dataToExport = reportData.financeiro.map((item) => ({
            Mês: item.mes,
            "Receita (R$)": item.receita.toFixed(2),
            "Despesas (R$)": item.despesas.toFixed(2),
            "Lucro (R$)": item.lucro.toFixed(2),
            "Margem (%)": ((item.lucro / item.receita) * 100).toFixed(2),
          }))
          fileName = `Relatório_Financeiro_${selectedPeriod}_${new Date().toISOString().split("T")[0]}`
          break

        case "clientes":
          dataToExport = reportData.clientes.map((item) => ({
            Nome: item.nome,
            Compras: item.compras,
            "Valor Total (R$)": item.valorTotal.toFixed(2),
            "Média por Compra (R$)": (item.valorTotal / item.compras).toFixed(2),
            "Última Compra": item.ultimaCompra,
          }))
          fileName = `Relatório_Clientes_${new Date().toISOString().split("T")[0]}`
          break
      }

      // Criar planilha Excel
      const worksheet = XLSX.utils.json_to_sheet(dataToExport)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório")

      // Exportar arquivo
      XLSX.writeFile(workbook, `${fileName}.xlsx`)
    } catch (error) {
      console.error("Erro ao exportar para Excel:", error)
      alert("Erro ao exportar para Excel. Tente novamente.")
    } finally {
      setIsExporting(false)
    }
  }

  // Função para exportar para PDF
  const exportToPDF = async () => {
    setIsExporting(true)

    try {
      const doc = new jsPDF()

      // Título do relatório
      let title = ""
      let columns = []
      let rows = []

      // Preparar dados baseados na aba selecionada
      switch (selectedTab) {
        case "vendas":
          title = `Relatório de Vendas - ${selectedPeriod === "month" ? "Mensal" : "Anual"}`
          columns = [
            { header: "Período", dataKey: "period" },
            { header: "Vendas (R$)", dataKey: "vendas" },
            { header: "Lucro (R$)", dataKey: "lucro" },
            { header: "Margem (%)", dataKey: "margem" },
          ]
          rows = reportData.vendas.map((item) => ({
            period: item.period,
            vendas: item.vendas.toLocaleString("pt-BR"),
            lucro: item.lucro.toLocaleString("pt-BR"),
            margem: ((item.lucro / item.vendas) * 100).toFixed(2) + "%",
          }))
          break

        case "estoque":
          title = "Relatório de Estoque"
          columns = [
            { header: "Produto", dataKey: "name" },
            { header: "Estoque Atual", dataKey: "estoque" },
            { header: "Estoque Mínimo", dataKey: "minimo" },
            { header: "Status", dataKey: "status" },
          ]
          rows = reportData.estoque
          break

        case "financeiro":
          title = `Relatório Financeiro - ${selectedPeriod === "month" ? "Mensal" : "Anual"}`
          columns = [
            { header: "Mês", dataKey: "mes" },
            { header: "Receita (R$)", dataKey: "receita" },
            { header: "Despesas (R$)", dataKey: "despesas" },
            { header: "Lucro (R$)", dataKey: "lucro" },
            { header: "Margem (%)", dataKey: "margem" },
          ]
          rows = reportData.financeiro.map((item) => ({
            mes: item.mes,
            receita: item.receita.toLocaleString("pt-BR"),
            despesas: item.despesas.toLocaleString("pt-BR"),
            lucro: item.lucro.toLocaleString("pt-BR"),
            margem: ((item.lucro / item.receita) * 100).toFixed(2) + "%",
          }))
          break

        case "clientes":
          title = "Relatório de Clientes"
          columns = [
            { header: "Nome", dataKey: "nome" },
            { header: "Compras", dataKey: "compras" },
            { header: "Valor Total (R$)", dataKey: "valorTotal" },
            { header: "Média (R$)", dataKey: "media" },
            { header: "Última Compra", dataKey: "ultimaCompra" },
          ]
          rows = reportData.clientes.map((item) => ({
            nome: item.nome,
            compras: item.compras,
            valorTotal: item.valorTotal.toLocaleString("pt-BR"),
            media: (item.valorTotal / item.compras).toFixed(2),
            ultimaCompra: item.ultimaCompra,
          }))
          break
      }

      // Adicionar título
      doc.setFontSize(18)
      doc.text(title, 14, 22)

      // Adicionar data de geração
      doc.setFontSize(10)
      doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`, 14, 30)

      // Adicionar tabela
      doc.autoTable({
        startY: 35,
        head: [columns.map((col) => col.header)],
        body: rows.map((row) => columns.map((col) => row[col.dataKey])),
        theme: "striped",
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 10, cellPadding: 3 },
      })

      // Salvar PDF
      const fileName = `Relatório_${selectedTab}_${new Date().toISOString().split("T")[0]}.pdf`
      doc.save(fileName)
    } catch (error) {
      console.error("Erro ao exportar para PDF:", error)
      alert("Erro ao exportar para PDF. Tente novamente.")
    } finally {
      setIsExporting(false)
    }
  }

  const reports = [
    {
      id: "vendas",
      title: "Relatório de Vendas",
      description: "Análise detalhada das vendas por período",
      icon: DollarSign,
      color: "bg-green-500",
    },
    {
      id: "estoque",
      title: "Relatório de Estoque",
      description: "Posição atual e movimentação do estoque",
      icon: Package,
      color: "bg-blue-500",
    },
    {
      id: "financeiro",
      title: "Relatório Financeiro",
      description: "Fluxo de caixa e análise financeira",
      icon: TrendingUp,
      color: "bg-purple-500",
    },
    {
      id: "clientes",
      title: "Relatório de Clientes",
      description: "Análise do comportamento dos clientes",
      icon: Users,
      color: "bg-orange-500",
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios e Analytics</h1>
          <p className="text-gray-600">Análises e insights do seu negócio</p>
        </div>

        {/* Botões de exportação */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel} disabled={isExporting || isLoading}>
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 mr-2" />
            )}
            Exportar Excel
          </Button>

          <Button variant="outline" onClick={exportToPDF} disabled={isExporting || isLoading}>
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FilePdf className="w-4 h-4 mr-2" />}
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Filtros de Período */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Período de Análise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "today", label: "Hoje" },
              { value: "week", label: "Esta Semana" },
              { value: "month", label: "Este Mês" },
              { value: "quarter", label: "Trimestre" },
              { value: "year", label: "Ano" },
              { value: "custom", label: "Personalizado" },
            ].map((period) => (
              <Button
                key={period.value}
                variant={selectedPeriod === period.value ? "default" : "outline"}
                onClick={() => setSelectedPeriod(period.value)}
              >
                {period.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Relatórios */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
        <TabsList className="grid grid-cols-4 mb-4">
          {reports.map((report) => (
            <TabsTrigger key={report.id} value={report.id} className="flex items-center gap-2">
              <report.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{report.title}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Conteúdo das Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{reports.find((r) => r.id === selectedTab)?.title}</span>
              <Button variant="outline" size="sm" onClick={loadReportData}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                Atualizar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                {/* Conteúdo do Relatório de Vendas */}
                <TabsContent value="vendas" className="mt-0">
                  <div className="space-y-6">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-2 text-left">Período</th>
                            <th className="border p-2 text-right">Vendas (R$)</th>
                            <th className="border p-2 text-right">Lucro (R$)</th>
                            <th className="border p-2 text-right">Margem (%)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.vendas.map((data, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="border p-2">{data.period}</td>
                              <td className="border p-2 text-right">{data.vendas.toLocaleString("pt-BR")}</td>
                              <td className="border p-2 text-right text-green-600">
                                {data.lucro.toLocaleString("pt-BR")}
                              </td>
                              <td className="border p-2 text-right">
                                {((data.lucro / data.vendas) * 100).toFixed(2)}%
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-gray-100 font-bold">
                            <td className="border p-2">Total</td>
                            <td className="border p-2 text-right">
                              {reportData.vendas.reduce((sum, item) => sum + item.vendas, 0).toLocaleString("pt-BR")}
                            </td>
                            <td className="border p-2 text-right text-green-600">
                              {reportData.vendas.reduce((sum, item) => sum + item.lucro, 0).toLocaleString("pt-BR")}
                            </td>
                            <td className="border p-2 text-right">
                              {(
                                (reportData.vendas.reduce((sum, item) => sum + item.lucro, 0) /
                                  reportData.vendas.reduce((sum, item) => sum + item.vendas, 0)) *
                                100
                              ).toFixed(2)}
                              %
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Produtos Mais Vendidos</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border p-2 text-left">Produto</th>
                              <th className="border p-2 text-right">Vendas (un)</th>
                              <th className="border p-2 text-right">Receita (R$)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {topProducts.map((product, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="border p-2">{product.name}</td>
                                <td className="border p-2 text-right">{product.vendas}</td>
                                <td className="border p-2 text-right">{product.receita.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Conteúdo do Relatório de Estoque */}
                <TabsContent value="estoque" className="mt-0">
                  <div className="space-y-6">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-2 text-left">Produto</th>
                            <th className="border p-2 text-right">Estoque Atual</th>
                            <th className="border p-2 text-right">Estoque Mínimo</th>
                            <th className="border p-2 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.estoque.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="border p-2">{item.name}</td>
                              <td className="border p-2 text-right">{item.estoque}</td>
                              <td className="border p-2 text-right">{item.minimo}</td>
                              <td className="border p-2 text-center">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    item.status === "Normal"
                                      ? "bg-green-100 text-green-800"
                                      : item.status === "Baixo"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Produtos em Estoque</p>
                            <p className="text-2xl font-bold">
                              {reportData.estoque.filter((item) => item.estoque > 0).length}
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Produtos com Estoque Baixo</p>
                            <p className="text-2xl font-bold text-yellow-600">
                              {reportData.estoque.filter((item) => item.status === "Baixo").length}
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Produtos Esgotados</p>
                            <p className="text-2xl font-bold text-red-600">
                              {reportData.estoque.filter((item) => item.status === "Esgotado").length}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                {/* Conteúdo do Relatório Financeiro */}
                <TabsContent value="financeiro" className="mt-0">
                  <div className="space-y-6">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-2 text-left">Mês</th>
                            <th className="border p-2 text-right">Receita (R$)</th>
                            <th className="border p-2 text-right">Despesas (R$)</th>
                            <th className="border p-2 text-right">Lucro (R$)</th>
                            <th className="border p-2 text-right">Margem (%)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.financeiro.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="border p-2">{item.mes}</td>
                              <td className="border p-2 text-right">{item.receita.toLocaleString("pt-BR")}</td>
                              <td className="border p-2 text-right text-red-600">
                                {item.despesas.toLocaleString("pt-BR")}
                              </td>
                              <td className="border p-2 text-right text-green-600">
                                {item.lucro.toLocaleString("pt-BR")}
                              </td>
                              <td className="border p-2 text-right">
                                {((item.lucro / item.receita) * 100).toFixed(2)}%
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-gray-100 font-bold">
                            <td className="border p-2">Total</td>
                            <td className="border p-2 text-right">
                              {reportData.financeiro
                                .reduce((sum, item) => sum + item.receita, 0)
                                .toLocaleString("pt-BR")}
                            </td>
                            <td className="border p-2 text-right text-red-600">
                              {reportData.financeiro
                                .reduce((sum, item) => sum + item.despesas, 0)
                                .toLocaleString("pt-BR")}
                            </td>
                            <td className="border p-2 text-right text-green-600">
                              {reportData.financeiro.reduce((sum, item) => sum + item.lucro, 0).toLocaleString("pt-BR")}
                            </td>
                            <td className="border p-2 text-right">
                              {(
                                (reportData.financeiro.reduce((sum, item) => sum + item.lucro, 0) /
                                  reportData.financeiro.reduce((sum, item) => sum + item.receita, 0)) *
                                100
                              ).toFixed(2)}
                              %
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>

                {/* Conteúdo do Relatório de Clientes */}
                <TabsContent value="clientes" className="mt-0">
                  <div className="space-y-6">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-2 text-left">Nome</th>
                            <th className="border p-2 text-right">Compras</th>
                            <th className="border p-2 text-right">Valor Total (R$)</th>
                            <th className="border p-2 text-right">Média por Compra (R$)</th>
                            <th className="border p-2 text-center">Última Compra</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.clientes.map((cliente, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="border p-2">{cliente.nome}</td>
                              <td className="border p-2 text-right">{cliente.compras}</td>
                              <td className="border p-2 text-right">{cliente.valorTotal.toFixed(2)}</td>
                              <td className="border p-2 text-right">
                                {(cliente.valorTotal / cliente.compras).toFixed(2)}
                              </td>
                              <td className="border p-2 text-center">{cliente.ultimaCompra}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Total de Clientes</p>
                            <p className="text-2xl font-bold">{reportData.clientes.length}</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Total de Compras</p>
                            <p className="text-2xl font-bold">
                              {reportData.clientes.reduce((sum, cliente) => sum + cliente.compras, 0)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Valor Total</p>
                            <p className="text-2xl font-bold text-green-600">
                              R$ {reportData.clientes.reduce((sum, cliente) => sum + cliente.valorTotal, 0).toFixed(2)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
              </>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
}
