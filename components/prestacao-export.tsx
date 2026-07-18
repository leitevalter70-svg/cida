"use client"

import ExcelJS from "exceljs"
import { Button } from "@/components/ui/button"
import { formatCrefitoLine } from "@/lib/professional"

export type PrestacaoExportRow = {
  tipo: "Receita" | "Despesa"
  dataPagamento: string
  dataRecebimento: string
  paciente: string
  descricao: string
  formaPagamento: string
  bruto: number
  taxaCartao: number
  clinica: number
  profissional: number
  despesa: number
}

export function PrestacaoExcelButton({
  from,
  to,
  professionalName,
  crefito,
  periodLabel = "Período",
  rows,
  totals,
}: {
  from: string
  to: string
  professionalName: string
  crefito: string
  periodLabel?: string
  rows: PrestacaoExportRow[]
  totals: {
    bruto: number
    taxa: number
    clinica: number
    profissional: number
    despesas: number
    saldoClinica: number
  }
}) {
  async function handleExport() {
    const wb = new ExcelJS.Workbook()
    wb.creator = professionalName
    const sheet = wb.addWorksheet("Prestação de contas")

    sheet.addRow(["Prestação de contas — Clínica"])
    sheet.addRow([`Profissional: ${professionalName}`])
    sheet.addRow([formatCrefitoLine(crefito)])
    sheet.addRow([`${periodLabel}: ${from} a ${to}`])
    sheet.addRow([])
    sheet.addRow([
      "Tipo",
      "Data pagamento",
      "Data recebimento",
      "Paciente",
      "Descrição",
      "Forma",
      "Bruto",
      "Taxa cartão",
      "Clínica",
      "Profissional",
      "Despesa",
    ])

    for (const r of rows) {
      sheet.addRow([
        r.tipo,
        r.dataPagamento,
        r.dataRecebimento,
        r.paciente,
        r.descricao,
        r.formaPagamento,
        r.bruto || null,
        r.taxaCartao || null,
        r.clinica || null,
        r.profissional || null,
        r.despesa || null,
      ])
    }

    sheet.addRow([])
    sheet.addRow(["Totais"])
    sheet.addRow(["Bruto", totals.bruto])
    sheet.addRow(["Taxa cartão", totals.taxa])
    sheet.addRow(["Valor clínica", totals.clinica])
    sheet.addRow(["Valor profissional", totals.profissional])
    sheet.addRow(["Despesas", totals.despesas])
    sheet.addRow(["Saldo clínica (clínica − despesas)", totals.saldoClinica])
    sheet.addRow([])
    sheet.addRow([professionalName])
    sheet.addRow([formatCrefitoLine(crefito)])

    sheet.getColumn(7).numFmt = '"R$"#,##0.00'
    sheet.getColumn(8).numFmt = '"R$"#,##0.00'
    sheet.getColumn(9).numFmt = '"R$"#,##0.00'
    sheet.getColumn(10).numFmt = '"R$"#,##0.00'
    sheet.getColumn(11).numFmt = '"R$"#,##0.00'

    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `prestacao-contas-${from}_${to}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button type="button" onClick={handleExport}>
      Exportar Excel
    </Button>
  )
}
