"use client"

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer"
import { Button } from "@/components/ui/button"

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#1f2a2e",
  },
  title: { fontSize: 18, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 10, color: "#5a6b70", marginBottom: 16 },
  section: { marginTop: 14, marginBottom: 4 },
  heading: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    color: "#2a6f77",
  },
  row: { marginBottom: 4, lineHeight: 1.4 },
  disclaimer: {
    marginTop: 20,
    fontSize: 9,
    color: "#5a6b70",
    lineHeight: 1.4,
  },
  box: {
    backgroundColor: "#f3f7f7",
    padding: 10,
    borderRadius: 4,
    marginTop: 6,
  },
})

export type ClinicalPdfData = {
  patientName: string
  age: number | null
  complaint: string | null
  periodStart: string | null
  periodEnd: string | null
  sessionsPlanned: number | null
  sessionsDone: number | null
  adherence: number | null
  scaleStart: number | null
  scaleEnd: number | null
  devicesSummary: string | null
  chanceSummary: string | null
  synthesis: string | null
  maintenance: string | null
  disclaimer: string
  sessionNotes: { date: string; scale: number | null; text: string | null }[]
}

function ClinicalDocument({ data }: { data: ClinicalPdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Relatório clínico</Text>
        <Text style={styles.subtitle}>
          Documento exclusivo para a paciente — sem informações financeiras
        </Text>

        <View style={styles.section}>
          <Text style={styles.heading}>Identificação</Text>
          <Text style={styles.row}>Nome: {data.patientName}</Text>
          {data.age != null && (
            <Text style={styles.row}>Idade: {data.age} anos</Text>
          )}
          {data.complaint && (
            <Text style={styles.row}>Queixa / foco: {data.complaint}</Text>
          )}
          <Text style={styles.row}>
            Período: {data.periodStart || "—"} a {data.periodEnd || "—"}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Percurso</Text>
          <Text style={styles.row}>
            Sessões: {data.sessionsDone ?? 0} de {data.sessionsPlanned ?? 0}{" "}
            previstas
          </Text>
          <Text style={styles.row}>Adesão: {data.adherence ?? 0}%</Text>
          <Text style={styles.row}>
            Escala início → fim: {data.scaleStart ?? "—"} →{" "}
            {data.scaleEnd ?? "—"}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Aparelhos / recursos utilizados</Text>
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

        {data.sessionNotes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.heading}>Principais condutas</Text>
            {data.sessionNotes.slice(0, 8).map((s, i) => (
              <Text key={i} style={styles.row}>
                {s.date}
                {s.scale != null ? ` (escala ${s.scale})` : ""}:{" "}
                {s.text || "—"}
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
      </Page>
    </Document>
  )
}

export function DownloadClinicalPdfButton({ data }: { data: ClinicalPdfData }) {
  async function handleDownload() {
    const blob = await pdf(<ClinicalDocument data={data} />).toBlob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `relatorio-clinico-${data.patientName.replace(/\s+/g, "-").toLowerCase()}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button type="button" onClick={handleDownload}>
      Baixar PDF clínico
    </Button>
  )
}
