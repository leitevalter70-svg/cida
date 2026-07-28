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
} from "docx"
import { Button } from "@/components/ui/button"
import { PHYSIO_SYMBOL_PATHS } from "@/components/physio-symbol"
import { physioReportFileBaseName } from "@/lib/clinical/urogineco"
import {
  DEFAULT_CREFITO,
  DEFAULT_PROFESSIONAL_NAME,
  formatCrefitoLine,
} from "@/lib/professional"

export type PhysioReportPdfData = {
  patientName: string
  opening: string
  anamneseText: string
  examText: string
  proposalText: string
  guidanceText: string
  professionalName: string
  crefitoLine: string
}

const BRAND = "#2a6f77"

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#1f2a2e",
    lineHeight: 1.45,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 8,
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
  brandName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
  },
  brandTag: { fontSize: 8, color: "#5a6b70" },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#1f2a2e",
  },
  paragraph: { marginBottom: 10, textAlign: "justify" },
  heading: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 8,
    marginBottom: 4,
    color: BRAND,
  },
  signature: {
    marginTop: 36,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#d5e0e0",
  },
  signatureName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
    color: "#1f2a2e",
  },
  signatureMeta: { fontSize: 10, color: "#5a6b70", marginBottom: 2 },
})

function resolveSignature(data: PhysioReportPdfData) {
  const professionalName =
    data.professionalName?.trim() || DEFAULT_PROFESSIONAL_NAME
  const crefitoRaw = data.crefitoLine?.trim()
  const crefitoLine = crefitoRaw
    ? /^CREFITO/i.test(crefitoRaw)
      ? crefitoRaw
      : formatCrefitoLine(crefitoRaw)
    : formatCrefitoLine(DEFAULT_CREFITO)
  return { professionalName, crefitoLine }
}

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

function PhysioReportDocument({ data }: { data: PhysioReportPdfData }) {
  const signature = resolveSignature(data)
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.brandRow}>
          <PhysioSymbolPdf />
          <View>
            <Text style={styles.brandName}>FISIOTERAPIA</Text>
            <Text style={styles.brandTag}>Saúde da mulher · assoalho pélvico</Text>
          </View>
        </View>

        <Text style={styles.title}>RELATÓRIO FISIOTERAPÊUTICO</Text>

        <Text style={styles.paragraph}>{data.opening}</Text>
        <Text style={styles.paragraph}>{data.anamneseText}</Text>
        <Text style={styles.paragraph}>{data.examText}</Text>

        <Text style={styles.heading}>Proposta de tratamento:</Text>
        <Text style={styles.paragraph}>{data.proposalText}</Text>
        <Text style={styles.paragraph}>{data.guidanceText}</Text>

        <View style={styles.signature}>
          <Text style={styles.signatureName}>{signature.professionalName}</Text>
          <Text style={styles.signatureMeta}>{signature.crefitoLine}</Text>
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

export function DownloadPhysioReportPdfButton({
  data,
}: {
  data: PhysioReportPdfData
}) {
  async function handleDownload() {
    const blob = await pdf(<PhysioReportDocument data={data} />).toBlob()
    downloadBlob(blob, `${physioReportFileBaseName(data.patientName)}.pdf`)
  }

  return (
    <Button type="button" variant="outline" onClick={handleDownload}>
      Baixar PDF
    </Button>
  )
}

export function DownloadPhysioReportWordButton({
  data,
}: {
  data: PhysioReportPdfData
}) {
  async function handleDownload() {
    const signature = resolveSignature(data)
    const doc = new DocxDocument({
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "FISIOTERAPIA",
                  bold: true,
                  color: "2A6F77",
                  size: 22,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Saúde da mulher · assoalho pélvico",
                  size: 16,
                  color: "5A6B70",
                }),
              ],
              spacing: { after: 200 },
            }),
            new Paragraph({
              text: "RELATÓRIO FISIOTERAPÊUTICO",
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 200 },
            }),
            new Paragraph({ text: data.opening, spacing: { after: 160 } }),
            new Paragraph({ text: data.anamneseText, spacing: { after: 160 } }),
            new Paragraph({ text: data.examText, spacing: { after: 160 } }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Proposta de tratamento:",
                  bold: true,
                  color: "2A6F77",
                }),
              ],
              spacing: { after: 80 },
            }),
            new Paragraph({ text: data.proposalText, spacing: { after: 160 } }),
            new Paragraph({ text: data.guidanceText, spacing: { after: 280 } }),
            new Paragraph({
              children: [
                new TextRun({
                  text: signature.professionalName,
                  bold: true,
                  size: 22,
                }),
              ],
              spacing: { before: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: signature.crefitoLine,
                  size: 20,
                  color: "5A6B70",
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Fisioterapeuta", size: 20, color: "5A6B70" }),
              ],
            }),
          ],
        },
      ],
    })
    const blob = await Packer.toBlob(doc)
    downloadBlob(blob, `${physioReportFileBaseName(data.patientName)}.docx`)
  }

  return (
    <Button type="button" variant="outline" onClick={handleDownload}>
      Baixar Word
    </Button>
  )
}
