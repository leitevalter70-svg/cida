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
  label: { fontFamily: "Helvetica-Bold" },
  sessionCard: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8e8",
  },
  disclaimer: {
    marginTop: 20,
    fontSize: 9,
    color: "#5a6b70",
    lineHeight: 1.4,
  },
  signature: {
    marginTop: 28,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#d5e0e0",
  },
  signatureName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  signatureMeta: {
    fontSize: 10,
    color: "#5a6b70",
  },
  box: {
    backgroundColor: "#f3f7f7",
    padding: 10,
    borderRadius: 4,
    marginTop: 6,
  },
})

export type ClinicalPdfSession = {
  date: string
  scale: number | null
  complaint: string | null
  procedures: string | null
  devices: string[]
  accessRoute: string | null
  deviceNotes: string | null
  patientResponse: string | null
  nextStep: string | null
}

export type ClinicalPdfData = {
  patientName: string
  age: number | null
  sex: string | null
  phone: string | null
  email: string | null
  patientNotes: string | null
  patientStatus: string | null
  protocolName: string | null
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
  professionalName: string
  crefitoLine: string
  sessions: ClinicalPdfSession[]
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
            Período: {data.periodStart || "—"} a {data.periodEnd || "—"}
          </Text>
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

        {data.sessions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.heading}>Histórico completo das sessões</Text>
            {data.sessions.map((s, i) => (
              <View key={i} style={styles.sessionCard} wrap={false}>
                <Text style={styles.row}>
                  <Text style={styles.label}>
                    Sessão {i + 1} — {s.date}
                  </Text>
                  {s.scale != null ? ` · Escala ${s.scale}` : ""}
                </Text>
                <Field label="Queixa / foco do dia" value={s.complaint} />
                <Field label="Condutas realizadas" value={s.procedures} />
                <Field
                  label="Aparelhos"
                  value={s.devices.length > 0 ? s.devices.join(", ") : null}
                />
                <Field label="Via / acessório" value={s.accessRoute} />
                <Field label="Obs. aparelho" value={s.deviceNotes} />
                <Field
                  label="Resposta / observação"
                  value={s.patientResponse}
                />
                <Field label="Próximo passo" value={s.nextStep} />
              </View>
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
