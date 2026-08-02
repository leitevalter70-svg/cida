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
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx"
import { Button } from "@/components/ui/button"
import { PHYSIO_SYMBOL_PATHS } from "@/components/physio-symbol"
import {
  clinicalReportFileBaseName,
  type ClinicalPdfData,
  type ClinicalPdfSession,
} from "@/lib/clinical/report-export"
import {
  DEFAULT_ADDRESS_LINES,
  DEFAULT_PHONE,
} from "@/lib/professional"

export type { ClinicalPdfData, ClinicalPdfSession } from "@/lib/clinical/report-export"

const BRAND = "#2a6f77"
const WORD_PAGE_WIDTH = 9360 // twips (~6.5")

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 56,
    paddingHorizontal: 42,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1f2a2e",
    lineHeight: 1.4,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: "#c5d4d4",
  },
  brandIcon: {
    width: 26,
    height: 26,
    marginRight: 10,
    backgroundColor: BRAND,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    flexDirection: "column",
  },
  brandName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
    textAlign: "center",
  },
  brandTag: {
    fontSize: 9,
    color: "#5a6b70",
    textAlign: "center",
  },
  title: {
    fontSize: 16,
    marginTop: 4,
    marginBottom: 16,
    fontFamily: "Helvetica-Bold",
    color: "#1f2a2e",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  section: { marginBottom: 12 },
  heading: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    color: BRAND,
    paddingBottom: 3,
    borderBottomWidth: 0.75,
    borderBottomColor: "#d5e0e0",
  },
  grid2: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 0,
  },
  gridCell: {
    width: "50%",
    paddingRight: 10,
    marginBottom: 4,
  },
  gridCellFull: {
    width: "100%",
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 8,
    color: "#5a6b70",
    marginBottom: 1,
  },
  fieldValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  statsRow: {
    flexDirection: "row",
    gap: 6,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#f3f7f7",
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 4,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 7,
    color: "#5a6b70",
    marginBottom: 2,
    textAlign: "center",
  },
  statValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    color: "#1f2a2e",
  },
  bodyText: {
    fontSize: 10,
    lineHeight: 1.45,
    textAlign: "justify",
  },
  box: {
    backgroundColor: "#f3f7f7",
    padding: 8,
    borderRadius: 4,
  },
  sessionBlock: {
    marginBottom: 8,
    backgroundColor: "#f3f7f7",
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: BRAND,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
    paddingBottom: 5,
    borderBottomWidth: 0.75,
    borderBottomColor: "#d5e0e0",
  },
  sessionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  sessionNumber: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: BRAND,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  sessionNumberText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  sessionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1f2a2e",
  },
  sessionScaleBadge: {
    backgroundColor: BRAND,
    borderRadius: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  sessionScaleText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  sessionDetail: {
    fontSize: 9,
    lineHeight: 1.4,
    marginBottom: 3,
    color: "#1f2a2e",
  },
  sessionDetailLabel: {
    fontFamily: "Helvetica-Bold",
    color: BRAND,
  },
  sessionsSection: {
    marginBottom: 12,
    marginTop: 2,
  },
  sessionsHeading: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    color: BRAND,
    paddingBottom: 4,
    borderBottomWidth: 1.25,
    borderBottomColor: BRAND,
  },
  sessionsCount: {
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#5a6b70",
  },
  disclaimer: {
    marginTop: 8,
    fontSize: 8,
    color: "#5a6b70",
    lineHeight: 1.35,
  },
  signature: {
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#c5d4d4",
    alignItems: "center",
  },
  signatureName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
    textAlign: "center",
  },
  signatureMeta: {
    fontSize: 9,
    color: "#5a6b70",
    textAlign: "center",
    marginBottom: 1,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 42,
    right: 42,
    paddingTop: 6,
    borderTopWidth: 0.75,
    borderTopColor: "#c5d4d4",
    alignItems: "center",
  },
  footerLine: {
    fontSize: 8,
    color: "#5a6b70",
    textAlign: "center",
    marginBottom: 1,
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

function FieldCell({
  label,
  value,
  fullWidth,
}: {
  label: string
  value: string | number | null | undefined
  fullWidth?: boolean
}) {
  if (value == null || value === "") return null
  return (
    <View style={fullWidth ? styles.gridCellFull : styles.gridCell}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{String(value)}</Text>
    </View>
  )
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  )
}

function SessionBlock({
  index,
  session,
}: {
  index: number
  session: ClinicalPdfSession
}) {
  const resources = [
    ...session.devices,
    session.accessRoute,
    session.deviceNotes,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <View style={styles.sessionBlock} wrap={false}>
      <View style={styles.sessionHeader}>
        <View style={styles.sessionHeaderLeft}>
          <View style={styles.sessionNumber}>
            <Text style={styles.sessionNumberText}>{index + 1}</Text>
          </View>
          <Text style={styles.sessionTitle}>{session.date}</Text>
        </View>
        {session.scale != null && (
          <View style={styles.sessionScaleBadge}>
            <Text style={styles.sessionScaleText}>
              Escala {session.scale}
            </Text>
          </View>
        )}
      </View>
      {session.complaint ? (
        <Text style={styles.sessionDetail}>
          <Text style={styles.sessionDetailLabel}>Queixa: </Text>
          {session.complaint}
        </Text>
      ) : null}
      {session.procedures ? (
        <Text style={styles.sessionDetail}>
          <Text style={styles.sessionDetailLabel}>Procedimentos: </Text>
          {session.procedures.replace(/\s+/g, " ").trim()}
        </Text>
      ) : null}
      {resources ? (
        <Text style={styles.sessionDetail}>
          <Text style={styles.sessionDetailLabel}>Recursos: </Text>
          {resources}
        </Text>
      ) : null}
      {session.patientResponse ? (
        <Text style={styles.sessionDetail}>
          <Text style={styles.sessionDetailLabel}>Resposta: </Text>
          {session.patientResponse.replace(/\s+/g, " ").trim()}
        </Text>
      ) : null}
      {session.nextStep ? (
        <Text style={styles.sessionDetail}>
          <Text style={styles.sessionDetailLabel}>Próximo passo: </Text>
          {session.nextStep.replace(/\s+/g, " ").trim()}
        </Text>
      ) : null}
    </View>
  )
}

function ClinicalDocument({ data }: { data: ClinicalPdfData }) {
  const period =
    data.periodStart || data.periodEnd
      ? `${data.periodStart || "—"} a ${data.periodEnd || "—"}`
      : "—"

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.brandRow}>
          <PhysioSymbolPdf />
          <View style={styles.brandText}>
            <Text style={styles.brandName}>FISIOTERAPIA</Text>
            <Text style={styles.brandTag}>Fisioterapia · saúde da mulher</Text>
          </View>
        </View>

        <Text style={styles.title}>RELATÓRIO CLÍNICO</Text>

        <View style={styles.section}>
          <Text style={styles.heading}>Identificação da paciente</Text>
          <View style={styles.grid2}>
            <FieldCell label="Nome" value={data.patientName} />
            <FieldCell
              label="Idade"
              value={data.age != null ? `${data.age} anos` : null}
            />
            <FieldCell label="Sexo" value={data.sex} />
            <FieldCell label="Telefone" value={data.phone} />
            <FieldCell label="E-mail" value={data.email} />
            <FieldCell label="Status" value={data.patientStatus} />
            <FieldCell label="Queixa / foco" value={data.complaint} fullWidth />
            <FieldCell
              label="Observações do cadastro"
              value={data.patientNotes}
              fullWidth
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Tratamento</Text>
          <View style={styles.statsRow}>
            <StatBox label="Período" value={period} />
            <StatBox
              label="Sessões"
              value={`${data.sessionsDone ?? 0}/${data.sessionsPlanned ?? 0}`}
            />
            <StatBox label="Adesão" value={`${data.adherence ?? 0}%`} />
            <StatBox
              label="Escala"
              value={`${data.scaleStart ?? "—"} → ${data.scaleEnd ?? "—"}`}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Aparelhos / recursos</Text>
          <Text style={styles.bodyText}>
            {data.devicesSummary || "Não registrados"}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Indicador de chances</Text>
          <View style={styles.box}>
            <Text style={styles.bodyText}>{data.chanceSummary || "—"}</Text>
          </View>
        </View>

        {data.sessions.length > 0 && (
          <View style={styles.sessionsSection}>
            <Text style={styles.sessionsHeading}>
              Histórico das sessões{" "}
              <Text style={styles.sessionsCount}>
                ({data.sessions.length}{" "}
                {data.sessions.length === 1 ? "sessão" : "sessões"})
              </Text>
            </Text>
            {data.sessions.map((s, i) => (
              <SessionBlock key={i} index={i} session={s} />
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.heading}>Síntese da profissional</Text>
          <Text style={styles.bodyText}>{data.synthesis || "—"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Orientação de manutenção</Text>
          <Text style={styles.bodyText}>{data.maintenance || "—"}</Text>
        </View>

        <Text style={styles.disclaimer}>{data.disclaimer}</Text>

        <View style={styles.signature}>
          <Text style={styles.signatureName}>{data.professionalName}</Text>
          <Text style={styles.signatureMeta}>{data.crefitoLine}</Text>
          <Text style={styles.signatureMeta}>{DEFAULT_PHONE}</Text>
          <Text style={styles.signatureMeta}>Fisioterapeuta</Text>
        </View>

        <View style={styles.footer} fixed>
          {DEFAULT_ADDRESS_LINES.map((line) => (
            <Text key={line} style={styles.footerLine}>
              {line}
            </Text>
          ))}
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

const noBorder = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
}

function wordHeading(text: string) {
  return new Paragraph({
    children: [
      new TextRun({ text, bold: true, size: 22, color: "2A6F77" }),
    ],
    spacing: { before: 200, after: 80 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: "D5E0E0", space: 4 },
    },
  })
}

function wordField(label: string, value: string) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 18, color: "5A6B70" }),
      new TextRun({ text: value, size: 20 }),
    ],
    spacing: { after: 40 },
  })
}

function wordFieldPairs(
  pairs: Array<[string, string | number | null | undefined]>,
) {
  const rows: TableRow[] = []
  for (let i = 0; i < pairs.length; i += 2) {
    const left = pairs[i]
    const right = pairs[i + 1]
    const cells = [left, right].filter(Boolean) as Array<
      [string, string | number | null | undefined]
    >

    rows.push(
      new TableRow({
        children: cells.map(([label, value]) => {
          if (value == null || value === "") {
            return new TableCell({
              borders: noBorder,
              width: { size: WORD_PAGE_WIDTH / 2, type: WidthType.DXA },
              children: [new Paragraph({ children: [] })],
            })
          }
          return new TableCell({
            borders: noBorder,
            width: { size: WORD_PAGE_WIDTH / 2, type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: label,
                    size: 14,
                    color: "5A6B70",
                  }),
                ],
                spacing: { after: 0 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: String(value),
                    bold: true,
                    size: 18,
                  }),
                ],
                spacing: { after: 80 },
              }),
            ],
          })
        }),
      }),
    )
  }
  return new Table({
    width: { size: WORD_PAGE_WIDTH, type: WidthType.DXA },
    columnWidths: [WORD_PAGE_WIDTH / 2, WORD_PAGE_WIDTH / 2],
    rows,
  })
}

function wordStatsRow(data: ClinicalPdfData) {
  const period =
    data.periodStart || data.periodEnd
      ? `${data.periodStart || "—"} a ${data.periodEnd || "—"}`
      : "—"
  const items: [string, string][] = [
    ["Período", period],
    ["Sessões", `${data.sessionsDone ?? 0}/${data.sessionsPlanned ?? 0}`],
    ["Adesão", `${data.adherence ?? 0}%`],
    ["Escala", `${data.scaleStart ?? "—"} → ${data.scaleEnd ?? "—"}`],
  ]
  const colW = WORD_PAGE_WIDTH / 4
  return new Table({
    width: { size: WORD_PAGE_WIDTH, type: WidthType.DXA },
    columnWidths: [colW, colW, colW, colW],
    rows: [
      new TableRow({
        children: items.map(([label, value]) =>
          new TableCell({
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
            width: { size: colW, type: WidthType.DXA },
            shading: { fill: "F3F7F7" },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: label, size: 14, color: "5A6B70" }),
                ],
                spacing: { before: 60, after: 20 },
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: value, bold: true, size: 18 }),
                ],
                spacing: { after: 60 },
              }),
            ],
          }),
        ),
      }),
    ],
  })
}

function buildWordDocument(data: ClinicalPdfData) {
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "FISIOTERAPIA", bold: true, color: "2A6F77", size: 26 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "Fisioterapia · saúde da mulher",
          size: 16,
          color: "5A6B70",
        }),
      ],
      spacing: { after: 120 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 12, color: "C5D4D4", space: 6 },
      },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "RELATÓRIO CLÍNICO",
          bold: true,
          size: 32,
        }),
      ],
      spacing: { before: 120, after: 200 },
    }),
    wordHeading("Identificação da paciente"),
    wordFieldPairs([
      ["Nome", data.patientName],
      ["Idade", data.age != null ? `${data.age} anos` : null],
      ["Sexo", data.sex],
      ["Telefone", data.phone],
      ["E-mail", data.email],
      ["Status", data.patientStatus],
    ]),
  ]

  if (data.complaint) {
    children.push(wordField("Queixa / foco", data.complaint))
  }
  if (data.patientNotes) {
    children.push(wordField("Observações do cadastro", data.patientNotes))
  }

  children.push(
    wordHeading("Tratamento"),
    wordStatsRow(data),
    new Paragraph({ children: [], spacing: { after: 80 } }),
    wordHeading("Aparelhos / recursos"),
    new Paragraph({
      children: [
        new TextRun({
          text: data.devicesSummary || "Não registrados",
          size: 18,
        }),
      ],
      spacing: { after: 40 },
    }),
    wordHeading("Indicador de chances"),
    new Paragraph({
      children: [
        new TextRun({ text: data.chanceSummary || "—", size: 18 }),
      ],
      spacing: { after: 40 },
    }),
  )

  if (data.sessions.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Histórico das sessões",
            bold: true,
            size: 24,
            color: "2A6F77",
          }),
          new TextRun({
            text: `  (${data.sessions.length} ${data.sessions.length === 1 ? "sessão" : "sessões"})`,
            size: 18,
            color: "5A6B70",
          }),
        ],
        spacing: { before: 240, after: 100 },
        border: {
          bottom: {
            style: BorderStyle.SINGLE,
            size: 12,
            color: "2A6F77",
            space: 4,
          },
        },
      }),
    )
    data.sessions.forEach((s, i) => {
      const resources = [...s.devices, s.accessRoute, s.deviceNotes]
        .filter(Boolean)
        .join(" · ")
      const detailParas: Paragraph[] = [
        new Paragraph({
          children: [
            new TextRun({
              text: `Sessão ${i + 1}  ·  ${s.date}`,
              bold: true,
              size: 20,
              color: "2A6F77",
            }),
            ...(s.scale != null
              ? [
                  new TextRun({
                    text: `   ·   Escala ${s.scale}`,
                    bold: true,
                    size: 18,
                    color: "2A6F77",
                  }),
                ]
              : []),
          ],
          spacing: { after: 60 },
        }),
      ]
      const pushDetail = (label: string, value: string) => {
        detailParas.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${label}: `,
                bold: true,
                size: 16,
                color: "2A6F77",
              }),
              new TextRun({ text: value, size: 16 }),
            ],
            spacing: { after: 20 },
          }),
        )
      }
      if (s.complaint) pushDetail("Queixa", s.complaint)
      if (s.procedures)
        pushDetail("Procedimentos", s.procedures.replace(/\s+/g, " ").trim())
      if (resources) pushDetail("Recursos", resources)
      if (s.patientResponse)
        pushDetail("Resposta", s.patientResponse.replace(/\s+/g, " ").trim())
      if (s.nextStep)
        pushDetail("Próximo passo", s.nextStep.replace(/\s+/g, " ").trim())

      children.push(
        new Table({
          width: { size: WORD_PAGE_WIDTH, type: WidthType.DXA },
          columnWidths: [WORD_PAGE_WIDTH],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 4, color: "D5E0E0" },
                    bottom: {
                      style: BorderStyle.SINGLE,
                      size: 4,
                      color: "D5E0E0",
                    },
                    left: {
                      style: BorderStyle.SINGLE,
                      size: 24,
                      color: "2A6F77",
                    },
                    right: {
                      style: BorderStyle.SINGLE,
                      size: 4,
                      color: "D5E0E0",
                    },
                  },
                  width: { size: WORD_PAGE_WIDTH, type: WidthType.DXA },
                  shading: { fill: "F3F7F7" },
                  children: detailParas,
                }),
              ],
            }),
          ],
        }),
        new Paragraph({ children: [], spacing: { after: 100 } }),
      )
    })
  }

  children.push(
    wordHeading("Síntese da profissional"),
    new Paragraph({
      children: [new TextRun({ text: data.synthesis || "—", size: 18 })],
      spacing: { after: 40 },
    }),
    wordHeading("Orientação de manutenção"),
    new Paragraph({
      children: [new TextRun({ text: data.maintenance || "—", size: 18 })],
      spacing: { after: 40 },
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
      spacing: { before: 160, after: 160 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: data.professionalName, bold: true, size: 20 }),
      ],
      spacing: { before: 120 },
      border: {
        top: { style: BorderStyle.SINGLE, size: 6, color: "C5D4D4", space: 10 },
      },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: data.crefitoLine, size: 16, color: "5A6B70" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: DEFAULT_PHONE, size: 16, color: "5A6B70" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
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
            margin: { top: 720, right: 720, bottom: 900, left: 720 },
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
