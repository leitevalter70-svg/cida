"use client"

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer"
import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { physioReportFileBaseName } from "@/lib/clinical/urogineco"
import {
  DEFAULT_CREFITO,
  DEFAULT_PHONE,
  DEFAULT_PROFESSIONAL_NAME,
  formatCrefitoLine,
} from "@/lib/professional"

export type PhysioReportPdfData = {
  patientName: string
  reportDate?: string | null
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
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 42,
    fontSize: 12,
    fontFamily: "Helvetica",
    color: "#1f2a2e",
    lineHeight: 1.65,
    flexDirection: "column",
  },
  brandName: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
    textAlign: "center",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: "#c5d4d4",
  },
  title: {
    fontSize: 17,
    fontFamily: "Helvetica-Bold",
    marginTop: 6,
    marginBottom: 22,
    textAlign: "center",
    color: "#1f2a2e",
    letterSpacing: 0.6,
  },
  body: {
    flexGrow: 1,
  },
  section: {
    marginBottom: 16,
  },
  heading: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    color: BRAND,
  },
  paragraph: {
    textAlign: "justify",
    marginBottom: 4,
  },
  signature: {
    marginTop: 28,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#c5d4d4",
    alignItems: "center",
  },
  signaturePlace: {
    fontSize: 11,
    color: "#5a6b70",
    marginBottom: 18,
    textAlign: "center",
  },
  signatureName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    color: "#1f2a2e",
    textAlign: "center",
  },
  signatureMeta: {
    fontSize: 11,
    color: "#5a6b70",
    marginBottom: 2,
    textAlign: "center",
  },
})

function formatReportDate(iso: string | null | undefined) {
  if (!iso?.trim()) {
    return format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  }
  try {
    return format(parseISO(iso), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  } catch {
    return iso
  }
}

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

function PhysioReportDocument({ data }: { data: PhysioReportPdfData }) {
  const signature = resolveSignature(data)
  const dateLong = formatReportDate(data.reportDate)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.brandName}>Saúde da mulher</Text>
        <Text style={styles.title}>RELATÓRIO FISIOTERAPÊUTICO</Text>

        <View style={styles.body}>
          <View style={styles.section}>
            <Text style={styles.heading}>Identificação e queixa</Text>
            <Text style={styles.paragraph}>{data.opening}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.heading}>Anamnese</Text>
            <Text style={styles.paragraph}>{data.anamneseText}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.heading}>Avaliação física</Text>
            <Text style={styles.paragraph}>{data.examText}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.heading}>Proposta de tratamento</Text>
            <Text style={styles.paragraph}>{data.proposalText}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.heading}>Orientações</Text>
            <Text style={styles.paragraph}>{data.guidanceText}</Text>
          </View>
        </View>

        <View style={styles.signature}>
          <Text style={styles.signaturePlace}>{dateLong}</Text>
          <Text style={styles.signatureName}>{signature.professionalName}</Text>
          <Text style={styles.signatureMeta}>{signature.crefitoLine}</Text>
          <Text style={styles.signatureMeta}>{DEFAULT_PHONE}</Text>
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

function bodyParagraph(text: string, after = 120) {
  return new Paragraph({
    children: [new TextRun({ text, size: 24 })],
    alignment: AlignmentType.BOTH,
    spacing: { after, line: 360 },
  })
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
    const dateLong = formatReportDate(data.reportDate)

    const doc = new DocxDocument({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720,
                bottom: 720,
                left: 850,
                right: 850,
              },
            },
          },
          children: [
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
                  style: "single",
                  size: 12,
                },
              },
            }),
            new Paragraph({
              text: "RELATÓRIO FISIOTERAPÊUTICO",
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { before: 80, after: 280 },
            }),
            sectionHeading("Identificação e queixa"),
            bodyParagraph(data.opening),
            sectionHeading("Anamnese"),
            bodyParagraph(data.anamneseText),
            sectionHeading("Avaliação física"),
            bodyParagraph(data.examText),
            sectionHeading("Proposta de tratamento"),
            bodyParagraph(data.proposalText),
            sectionHeading("Orientações"),
            bodyParagraph(data.guidanceText, 360),
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
                  style: "single",
                  size: 6,
                },
              },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: signature.professionalName,
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
                  text: signature.crefitoLine,
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
