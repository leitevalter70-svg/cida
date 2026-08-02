"use client"

import ExcelJS from "exceljs"
import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
} from "docx"
import { Button } from "@/components/ui/button"
import { formatBRL } from "@/lib/format"
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

export type PrestacaoExportTotals = {
  bruto: number
  taxa: number
  clinica: number
  profissional: number
  despesas: number
  saldoClinica: number
}

type PrestacaoExportProps = {
  from: string
  to: string
  professionalName: string
  crefito: string
  periodLabel?: string
  rows: PrestacaoExportRow[]
  totals: PrestacaoExportTotals
}

const CELL_BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 4, color: "D5E0E0" },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: "D5E0E0" },
  left: { style: BorderStyle.SINGLE, size: 4, color: "D5E0E0" },
  right: { style: BorderStyle.SINGLE, size: 4, color: "D5E0E0" },
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function headerCell(text: string, width = 900) {
  return new TableCell({
    borders: CELL_BORDERS,
    width: { size: width, type: WidthType.DXA },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: true,
            size: 14,
            color: "2A6F77",
          }),
        ],
      }),
    ],
  })
}

function textCell(text: string, width = 900) {
  return new TableCell({
    borders: CELL_BORDERS,
    width: { size: width, type: WidthType.DXA },
    children: [
      new Paragraph({
        children: [new TextRun({ text, size: 14 })],
      }),
    ],
  })
}

function moneyCell(value: number, width = 900) {
  return new TableCell({
    borders: CELL_BORDERS,
    width: { size: width, type: WidthType.DXA },
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: formatBRL(value), size: 14 })],
      }),
    ],
  })
}

function buildWordDocument({
  from,
  to,
  professionalName,
  crefito,
  periodLabel = "Período",
  rows,
  totals,
}: PrestacaoExportProps) {
  const headerRow = new TableRow({
    children: [
      headerCell("Tipo", 800),
      headerCell("Pagamento", 1000),
      headerCell("Recebimento", 1000),
      headerCell("Paciente", 1400),
      headerCell("Descrição", 1400),
      headerCell("Forma", 900),
      headerCell("Bruto", 900),
      headerCell("Taxa", 800),
      headerCell("Clínica", 900),
      headerCell("Profissional", 1000),
      headerCell("Despesa", 900),
    ],
  })

  const dataRows = rows.map(
    (r) =>
      new TableRow({
        children: [
          textCell(r.tipo, 800),
          textCell(r.dataPagamento, 1000),
          textCell(r.dataRecebimento, 1000),
          textCell(r.paciente, 1400),
          textCell(r.descricao, 1400),
          textCell(r.formaPagamento, 900),
          moneyCell(r.bruto, 900),
          moneyCell(r.taxaCartao, 800),
          moneyCell(r.clinica, 900),
          moneyCell(r.profissional, 1000),
          moneyCell(r.despesa, 900),
        ],
      }),
  )

  const totalLines: [string, number][] = [
    ["Bruto", totals.bruto],
    ["Taxa cartão", totals.taxa],
    ["Valor clínica", totals.clinica],
    ["Valor profissional", totals.profissional],
    ["Despesas", totals.despesas],
    ["Saldo clínica (clínica − despesas)", totals.saldoClinica],
  ]

  return new DocxDocument({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 576, bottom: 720, left: 576 },
          },
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "Prestação de contas — Clínica",
                bold: true,
                size: 28,
                color: "2A6F77",
              }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Profissional: ${professionalName}`,
                size: 20,
              }),
            ],
            spacing: { after: 20 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: formatCrefitoLine(crefito),
                size: 18,
                color: "5A6B70",
              }),
            ],
            spacing: { after: 20 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `${periodLabel}: ${from} a ${to}`,
                size: 18,
              }),
            ],
            spacing: { after: 200 },
          }),
          new Table({
            width: { size: 11000, type: WidthType.DXA },
            rows: [headerRow, ...dataRows],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Totais",
                bold: true,
                size: 22,
                color: "2A6F77",
              }),
            ],
            spacing: { before: 240, after: 80 },
          }),
          ...totalLines.map(
            ([label, value]) =>
              new Paragraph({
                children: [
                  new TextRun({ text: `${label}: `, bold: true, size: 18 }),
                  new TextRun({ text: formatBRL(value), size: 18 }),
                ],
                spacing: { after: 20 },
              }),
          ),
          new Paragraph({
            children: [
              new TextRun({ text: professionalName, bold: true, size: 18 }),
            ],
            spacing: { before: 280 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: formatCrefitoLine(crefito),
                size: 16,
                color: "5A6B70",
              }),
            ],
          }),
        ],
      },
    ],
  })
}

export function PrestacaoExcelButton({
  from,
  to,
  professionalName,
  crefito,
  periodLabel = "Período",
  rows,
  totals,
}: PrestacaoExportProps) {
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
    downloadBlob(blob, `prestacao-contas-${from}_${to}.xlsx`)
  }

  return (
    <Button type="button" onClick={handleExport}>
      Exportar Excel
    </Button>
  )
}

export function PrestacaoWordButton(props: PrestacaoExportProps) {
  async function handleExport() {
    const doc = buildWordDocument(props)
    const blob = await Packer.toBlob(doc)
    downloadBlob(blob, `prestacao-contas-${props.from}_${props.to}.docx`)
  }

  return (
    <Button type="button" variant="outline" onClick={handleExport}>
      Baixar Word
    </Button>
  )
}
