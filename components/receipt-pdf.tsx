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
import { formatCrefitoLine } from "@/lib/professional"

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#1f2a2e",
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    color: "#2a6f77",
  },
  subtitle: { fontSize: 10, color: "#5a6b70", marginBottom: 24 },
  row: { marginBottom: 6, lineHeight: 1.4 },
  label: { fontFamily: "Helvetica-Bold" },
  amountBox: {
    marginTop: 16,
    marginBottom: 16,
    padding: 14,
    backgroundColor: "#f3f7f7",
    borderRadius: 4,
  },
  amount: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#2a6f77",
  },
  signature: {
    marginTop: 36,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#d5e0e0",
  },
  signatureName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  signatureMeta: { fontSize: 10, color: "#5a6b70" },
})

export type ReceiptPdfData = {
  patientName: string
  revenueDate: string
  settledAt: string
  paymentMethodLabel: string
  description: string | null
  grossAmountLabel: string
  professionalName: string
  crefito: string
}

function ReceiptDocument({ data }: { data: ReceiptPdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Recibo de pagamento</Text>
        <Text style={styles.subtitle}>
          Comprovante para a paciente — serviço de fisioterapia
        </Text>

        <Text style={styles.row}>
          <Text style={styles.label}>Recebi de: </Text>
          {data.patientName}
        </Text>
        <Text style={styles.row}>
          <Text style={styles.label}>Data do pagamento: </Text>
          {data.revenueDate}
        </Text>
        <Text style={styles.row}>
          <Text style={styles.label}>Forma de pagamento: </Text>
          {data.paymentMethodLabel}
        </Text>
        {data.description ? (
          <Text style={styles.row}>
            <Text style={styles.label}>Referente a: </Text>
            {data.description}
          </Text>
        ) : null}
        <Text style={styles.row}>
          <Text style={styles.label}>Recebimento financeiro previsto: </Text>
          {data.settledAt}
        </Text>

        <View style={styles.amountBox}>
          <Text style={styles.row}>Valor</Text>
          <Text style={styles.amount}>{data.grossAmountLabel}</Text>
        </View>

        <Text style={styles.row}>
          Declaro ter recebido o valor acima referente a atendimento de
          fisioterapia.
        </Text>

        <View style={styles.signature}>
          <Text style={styles.signatureName}>{data.professionalName}</Text>
          <Text style={styles.signatureMeta}>
            {formatCrefitoLine(data.crefito)}
          </Text>
          <Text style={styles.signatureMeta}>Fisioterapeuta</Text>
        </View>
      </Page>
    </Document>
  )
}

export function DownloadReceiptButton({
  data,
  size = "sm",
  variant = "outline",
}: {
  data: ReceiptPdfData
  size?: "sm" | "default"
  variant?: "outline" | "default" | "secondary" | "ghost"
}) {
  async function handleDownload() {
    const blob = await pdf(<ReceiptDocument data={data} />).toBlob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `recibo-${data.patientName.replace(/\s+/g, "-").toLowerCase()}-${data.revenueDate.replace(/\//g, "-")}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button type="button" size={size} variant={variant} onClick={handleDownload}>
      Recibo PDF
    </Button>
  )
}
