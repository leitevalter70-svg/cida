"use client"

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Svg,
  Path,
  Circle,
} from "@react-pdf/renderer"
import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx"
import { Button } from "@/components/ui/button"
import { PHYSIO_SYMBOL_PATHS } from "@/components/physio-symbol"
import {
  clinicalReportFileBaseName,
  formatSessionLine,
  type ClinicalPdfData,
} from "@/lib/clinical/report-export"

export type { ClinicalPdfData, ClinicalPdfSession } from "@/lib/clinical/report-export"

const BRAND = "#2a6f77"

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1f2a2e",
    lineHeight: 1.25,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#d5e0e0",
  },
  brandIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
    backgroundColor: BRAND,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    flexDirection: "column",
  },
  brandName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
  },
  brandTag: {
    fontSize: 8,
    color: "#5a6b70",
  },
  title: {
    fontSize: 14,
    marginBottom: 2,
    fontFamily: "Helvetica-Bold",
    color: "#1f2a2e",
  },
  subtitle: { fontSize: 8, color: "#5a6b70", marginBottom: 8 },
  section: { marginTop: 8, marginBottom: 2 },
  heading: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
    color: BRAND,
  },
  row: { marginBottom: 2 },
  label: { fontFamily: "Helvetica-Bold" },
  sessionLine: {
    marginBottom: 2,
    fontSize: 8,
    lineHeight: 1.2,
  },
  disclaimer: {
    marginTop: 10,
    fontSize: 8,
    color: "#5a6b70",
    lineHeight: 1.3,
  },
  signature: {
    marginTop: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#d5e0e0",
  },
  signatureName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginBottom: 1,
  },
  signatureMeta: {
    fontSize: 8,
    color: "#5a6b70",
  },
  box: {
    backgroundColor: "#f3f7f7",
    padding: 6,
    borderRadius: 3,
    marginTop: 3,
  },
})

function PhysioSymbolPdf() {
  const p = PHYSIO_SYMBOL_PATHS
  return (
    <View style={styles.brandIcon}>
      <Svg viewBox="0 0 48 48" width={18} height={18}>
        <Path
          d={p.staff}
          stroke="#ffffff"
          strokeWidth={2.8}
          strokeLinecap="round"
        />
        <Circle cx={p.head.cx} cy={p.head.cy} r={p.head.r} fill="#ffffff" />
        <Path d={p.torso} fill="#ffffff" />
        <Path
          d={p.armsLeft}
          stroke="#ffffff"
          strokeWidth={2.4}
          strokeLinecap="round"
        />
        <Path
          d={p.armsRight}
          stroke="#ffffff"
          strokeWidth={2.4}
          strokeLinecap="round"
        />
        <Path
          d={p.base}
          stroke="#ffffff"
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  )
}

function Field({
  label,
  value,
}: {
  label: string
  value: string | number | null | undefined
}) {
  if (value == null || value === "") return null
  return (
    <Text style={styles.row}>
      <Text style={styles.label}>{label}: </Text>
      {String(value)}
    </Text>
  )
}

function ClinicalDocument({ data }: { data: ClinicalPdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.brandRow}>
          <PhysioSymbolPdf />
          <View style={styles.brandText}>
            <Text style={styles.brandName}>Cida</Text>
            <Text style={styles.brandTag}>Fisioterapia · saúde da mulher</Text>
          </View>
        </View>

        <Text style={styles.title}>Relatório clínico</Text>
        <Text style={styles.subtitle}>
          Documento exclusivo para a paciente — sem informações financeiras
        </Text>

        <View style={styles.section}>
          <Text style={styles.heading}>Identificação da paciente</Text>
          <Field label="Nome" value={data.patientName} />
          <Field
            label="Idade"
            value={data.age != null ? `${data.age} anos` : null}
          />
          <Field label="Sexo" value={data.sex} />
          <Field label="Telefone" value={data.phone} />
          <Field label="E-mail" value={data.email} />
          <Field label="Status" value={data.patientStatus} />
          <Field label="Queixa / foco" value={data.complaint} />
          <Field label="Observações do cadastro" value={data.patientNotes} />
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Tratamento</Text>
          <Text style={styles.row}>
            Período: {data.periodStart || "—"} a {data.periodEnd || "—"} ·
            Sessões: {data.sessionsDone ?? 0}/{data.sessionsPlanned ?? 0} ·
            Adesão: {data.adherence ?? 0}% · Escala: {data.scaleStart ?? "—"} →{" "}
            {data.scaleEnd ?? "—"}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Aparelhos / recursos</Text>
          <Text style={styles.row}>
            {data.devicesSummary || "Não registrados"}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Indicador de chances</Text>
          <View style={styles.box}>
            <Text>{data.chanceSummary || "—"}</Text>
          </View>
        </View>

        {data.sessions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.heading}>Histórico das sessões</Text>
            {data.sessions.map((s, i) => (
              <Text key={i} style={styles.sessionLine}>
                {formatSessionLine(i, s)}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.heading}>Síntese da profissional</Text>
          <Text style={styles.row}>{data.synthesis || "—"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Orientação de manutenção</Text>
          <Text style={styles.row}>{data.maintenance || "—"}</Text>
        </View>

        <Text style={styles.disclaimer}>{data.disclaimer}</Text>

        <View style={styles.signature}>
          <Text style={styles.signatureName}>{data.professionalName}</Text>
          <Text style={styles.signatureMeta}>{data.crefitoLine}</Text>
          <Text style={styles.signatureMeta}>Fisioterapeuta</Text>
        </View>
      </Page>
    </Document>
  )
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function DownloadClinicalPdfButton({ data }: { data: ClinicalPdfData }) {
  async function handleDownload() {
    const blob = await pdf(<ClinicalDocument data={data} />).toBlob()
    downloadBlob(blob, `${clinicalReportFileBaseName(data.patientName)}.pdf`)
  }

  return (
    <Button type="button" onClick={handleDownload}>
      Baixar PDF
    </Button>
  )
}

function buildWordDocument(data: ClinicalPdfData) {
  const children: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({ text: "Cida", bold: true, color: "2A6F77", size: 22 }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Fisioterapia · saúde da mulher",
          size: 16,
          color: "5A6B70",
        }),
      ],
      spacing: { after: 120 },
    }),
    new Paragraph({
      text: "Relatório clínico",
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Documento exclusivo para a paciente — sem informações financeiras",
          size: 16,
          color: "5A6B70",
          italics: true,
        }),
      ],
      spacing: { after: 160 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Identificação da paciente", bold: true, size: 20, color: "2A6F77" }),
      ],
      spacing: { before: 80, after: 60 },
    }),
  ]

  const patientFields: [string, string | number | null | undefined][] = [
    ["Nome", data.patientName],
    ["Idade", data.age != null ? `${data.age} anos` : null],
    ["Sexo", data.sex],
    ["Telefone", data.phone],
    ["E-mail", data.email],
    ["Status", data.patientStatus],
    ["Queixa / foco", data.complaint],
    ["Observações do cadastro", data.patientNotes],
  ]

  for (const [label, value] of patientFields) {
    if (value == null || value === "") continue
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${label}: `, bold: true, size: 18 }),
          new TextRun({ text: String(value), size: 18 }),
        ],
        spacing: { after: 20 },
      }),
    )
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Tratamento", bold: true, size: 20, color: "2A6F77" }),
      ],
      spacing: { before: 120, after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Período: ${data.periodStart || "—"} a ${data.periodEnd || "—"} · Sessões: ${data.sessionsDone ?? 0}/${data.sessionsPlanned ?? 0} · Adesão: ${data.adherence ?? 0}% · Escala: ${data.scaleStart ?? "—"} → ${data.scaleEnd ?? "—"}`,
          size: 18,
        }),
      ],
      spacing: { after: 20 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Aparelhos / recursos", bold: true, size: 20, color: "2A6F77" }),
      ],
      spacing: { before: 120, after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: data.devicesSummary || "Não registrados",
          size: 18,
        }),
      ],
      spacing: { after: 20 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Indicador de chances", bold: true, size: 20, color: "2A6F77" }),
      ],
      spacing: { before: 120, after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: data.chanceSummary || "—", size: 18 }),
      ],
      spacing: { after: 20 },
    }),
  )

  if (data.sessions.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Histórico das sessões", bold: true, size: 20, color: "2A6F77" }),
        ],
        spacing: { before: 120, after: 60 },
      }),
    )
    data.sessions.forEach((s, i) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: formatSessionLine(i, s), size: 16 }),
          ],
          spacing: { after: 16 },
        }),
      )
    })
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Síntese da profissional", bold: true, size: 20, color: "2A6F77" }),
      ],
      spacing: { before: 120, after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({ text: data.synthesis || "—", size: 18 })],
      spacing: { after: 20 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Orientação de manutenção", bold: true, size: 20, color: "2A6F77" }),
      ],
      spacing: { before: 120, after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({ text: data.maintenance || "—", size: 18 })],
      spacing: { after: 20 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: data.disclaimer,
          size: 14,
          color: "5A6B70",
          italics: true,
        }),
      ],
      spacing: { before: 160, after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: data.professionalName, bold: true, size: 18 }),
      ],
      spacing: { before: 80 },
      alignment: AlignmentType.LEFT,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: data.crefitoLine, size: 16, color: "5A6B70" }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Fisioterapeuta", size: 16, color: "5A6B70" }),
      ],
    }),
  )

  return new DocxDocument({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children,
      },
    ],
  })
}

export function DownloadClinicalWordButton({ data }: { data: ClinicalPdfData }) {
  async function handleDownload() {
    const doc = buildWordDocument(data)
    const blob = await Packer.toBlob(doc)
    downloadBlob(blob, `${clinicalReportFileBaseName(data.patientName)}.docx`)
  }

  return (
    <Button type="button" variant="outline" onClick={handleDownload}>
      Baixar Word
    </Button>
  )
}
