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
  Footer,
  HeadingLevel,
  ShadingType,
  VerticalAlign,
} from "docx"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { formatBRL, formatData } from "@/lib/format"
import {
  DEFAULT_ADDRESS_LINES,
  DEFAULT_PHONE,
  formatCrefitoLine,
} from "@/lib/professional"

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

/** Usable content width on A4 with ~1.6 cm side margins. */
const PAGE_WIDTH = 9360

const THIN = { style: BorderStyle.SINGLE, size: 4, color: "D5E0E0" }
const CELL_BORDERS = { top: THIN, bottom: THIN, left: THIN, right: THIN }

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function formatReportDate(date = new Date()) {
  return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
}

function sectionHeading(text: string) {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        color: "2A6F77",
        size: 24,
      }),
    ],
    spacing: { before: 240, after: 100 },
  })
}

function bodyLine(text: string, after = 40) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20 })],
    spacing: { after },
  })
}

function headerCell(text: string, width: number, align: typeof AlignmentType.LEFT | typeof AlignmentType.RIGHT = AlignmentType.LEFT) {
  return new TableCell({
    borders: CELL_BORDERS,
    width: { size: width, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: "E8F2F2" },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: align,
        children: [
          new TextRun({
            text,
            bold: true,
            size: 16,
            color: "2A6F77",
          }),
        ],
      }),
    ],
  })
}

function textCell(
  text: string,
  width: number,
  opts?: { align?: typeof AlignmentType.LEFT | typeof AlignmentType.RIGHT | typeof AlignmentType.CENTER; bold?: boolean; fill?: string },
) {
  return new TableCell({
    borders: CELL_BORDERS,
    width: { size: width, type: WidthType.DXA },
    shading: opts?.fill
      ? { type: ShadingType.CLEAR, fill: opts.fill }
      : undefined,
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: opts?.align ?? AlignmentType.LEFT,
        children: [
          new TextRun({ text, size: 16, bold: opts?.bold }),
        ],
      }),
    ],
  })
}

function moneyCell(value: number, width: number, opts?: { bold?: boolean; fill?: string }) {
  return textCell(formatBRL(value), width, {
    align: AlignmentType.RIGHT,
    bold: opts?.bold,
    fill: opts?.fill,
  })
}

function emptyNote(text: string) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [
      new TextRun({
        text,
        italics: true,
        size: 18,
        color: "5A6B70",
      }),
    ],
  })
}

function summaryTable(totals: PrestacaoExportTotals) {
  const colLabel = 5200
  const colValue = 3200
  const width = colLabel + colValue
  const lines: [string, number, boolean?][] = [
    ["Bruto faturado / recebido", totals.bruto],
    ["Taxa de cartão", totals.taxa],
    ["Valor da clínica", totals.clinica],
    ["Valor da profissional", totals.profissional],
    ["Despesas do período", totals.despesas],
    ["Saldo da clínica", totals.saldoClinica, true],
  ]

  return new Table({
    width: { size: width, type: WidthType.DXA },
    columnWidths: [colLabel, colValue],
    alignment: AlignmentType.CENTER,
    rows: lines.map(([label, value, highlight], i) => {
      const fill = highlight ? "E8F2F2" : i % 2 === 0 ? "F7FAFA" : "FFFFFF"
      return new TableRow({
        children: [
          textCell(label, colLabel, { bold: highlight, fill }),
          moneyCell(value, colValue, { bold: true, fill }),
        ],
      })
    }),
  })
}

function revenueTable(rows: PrestacaoExportRow[]) {
  const widths = [2100, 1100, 1000, 1700, 1150, 1150, 1160]
  const header = new TableRow({
    children: [
      headerCell("Paciente", widths[0]),
      headerCell("Pagamento", widths[1], AlignmentType.CENTER),
      headerCell("Forma", widths[2], AlignmentType.CENTER),
      headerCell("Descrição", widths[3]),
      headerCell("Bruto", widths[4], AlignmentType.RIGHT),
      headerCell("Clínica", widths[5], AlignmentType.RIGHT),
      headerCell("Você", widths[6], AlignmentType.RIGHT),
    ],
  })

  const body = rows.map((r, i) => {
    const fill = i % 2 === 0 ? "FFFFFF" : "F7FAFA"
    return new TableRow({
      children: [
        textCell(r.paciente, widths[0], { fill, bold: true }),
        textCell(r.dataPagamento, widths[1], {
          fill,
          align: AlignmentType.CENTER,
        }),
        textCell(r.formaPagamento, widths[2], {
          fill,
          align: AlignmentType.CENTER,
        }),
        textCell(r.descricao || "—", widths[3], { fill }),
        moneyCell(r.bruto, widths[4], { fill }),
        moneyCell(r.clinica, widths[5], { fill }),
        moneyCell(r.profissional, widths[6], { fill }),
      ],
    })
  })

  return new Table({
    width: { size: PAGE_WIDTH, type: WidthType.DXA },
    columnWidths: widths,
    alignment: AlignmentType.CENTER,
    rows: [header, ...body],
  })
}

function expenseTable(rows: PrestacaoExportRow[]) {
  const widths = [1400, 2800, 2760, 2400]
  const header = new TableRow({
    children: [
      headerCell("Data", widths[0], AlignmentType.CENTER),
      headerCell("Descrição", widths[1]),
      headerCell("Categoria / paciente", widths[2]),
      headerCell("Valor", widths[3], AlignmentType.RIGHT),
    ],
  })

  const body = rows.map((r, i) => {
    const fill = i % 2 === 0 ? "FFFFFF" : "F7FAFA"
    const category =
      r.paciente && r.paciente !== "—"
        ? `${r.formaPagamento} · ${r.paciente}`
        : r.formaPagamento
    return new TableRow({
      children: [
        textCell(r.dataPagamento, widths[0], {
          fill,
          align: AlignmentType.CENTER,
        }),
        textCell(r.descricao || "—", widths[1], { fill }),
        textCell(category, widths[2], { fill }),
        moneyCell(r.despesa, widths[3], { fill, bold: true }),
      ],
    })
  })

  return new Table({
    width: { size: PAGE_WIDTH, type: WidthType.DXA },
    columnWidths: widths,
    alignment: AlignmentType.CENTER,
    rows: [header, ...body],
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
  const revenues = rows.filter((r) => r.tipo === "Receita")
  const expenses = rows.filter((r) => r.tipo === "Despesa")
  const fromLabel = formatData(from)
  const toLabel = formatData(to)
  const crefitoLine = formatCrefitoLine(crefito)
  const dateLong = formatReportDate()

  const children = [
    new Paragraph({
      children: [
        new TextRun({
          text: "Saúde da mulher",
          bold: true,
          color: "2A6F77",
          size: 30,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      border: {
        bottom: {
          color: "C5D4D4",
          space: 10,
          style: BorderStyle.SINGLE,
          size: 12,
        },
      },
    }),
    new Paragraph({
      text: "PRESTAÇÃO DE CONTAS",
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 280 },
    }),

    sectionHeading("Identificação"),
    bodyLine(`Profissional: ${professionalName}`),
    bodyLine(crefitoLine),
    bodyLine(`${periodLabel}: ${fromLabel} a ${toLabel}`, 160),

    sectionHeading("Resumo do período"),
    summaryTable(totals),

    sectionHeading(
      revenues.length === 1
        ? "Receitas (1 lançamento)"
        : `Receitas (${revenues.length} lançamentos)`,
    ),
    ...(revenues.length === 0
      ? [emptyNote("Nenhuma receita neste período.")]
      : [revenueTable(revenues)]),

    sectionHeading(
      expenses.length === 1
        ? "Despesas (1 lançamento)"
        : `Despesas (${expenses.length} lançamentos)`,
    ),
    ...(expenses.length === 0
      ? [emptyNote("Nenhuma despesa neste período.")]
      : [expenseTable(expenses)]),

    new Paragraph({
      children: [
        new TextRun({
          text: dateLong,
          size: 22,
          color: "5A6B70",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 280 },
      border: {
        top: {
          color: "C5D4D4",
          space: 16,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: professionalName,
          bold: true,
          size: 24,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: crefitoLine,
          size: 22,
          color: "5A6B70",
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: DEFAULT_PHONE,
          size: 22,
          color: "5A6B70",
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Fisioterapeuta",
          size: 22,
          color: "5A6B70",
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
  ]

  return new DocxDocument({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 850, bottom: 1000, left: 850 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                border: {
                  top: {
                    color: "C5D4D4",
                    space: 10,
                    style: BorderStyle.SINGLE,
                    size: 6,
                  },
                },
                alignment: AlignmentType.CENTER,
                spacing: { before: 80, after: 40 },
                children: [
                  new TextRun({
                    text: DEFAULT_ADDRESS_LINES[0],
                    size: 16,
                    color: "5A6B70",
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: DEFAULT_ADDRESS_LINES[1],
                    size: 16,
                    color: "5A6B70",
                  }),
                ],
              }),
            ],
          }),
        },
        children,
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
