"use client"

import Link from "next/link"
import {
  DownloadClinicalPdfButton,
  DownloadClinicalWordButton,
} from "@/components/clinical-pdf"
import {
  DownloadPhysioReportPdfButton,
  DownloadPhysioReportWordButton,
} from "@/components/physio-report-pdf"
import { DownloadReceiptButton } from "@/components/receipt-pdf"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import type { ClinicalPdfData } from "@/lib/clinical/report-export"
import type { PhysioReportPdfData } from "@/components/physio-report-pdf"
import { cn } from "@/lib/utils"

type ClinicalReportItem = {
  treatmentId: string
  protocolName: string
  treatmentStatus: string
  finalizedAt: string | null
  updatedAt: string | null
  pdfData: ClinicalPdfData
}

type ReceiptItem = {
  id: string
  label: string
  meta: string
  amountLabel: string
  receiptData: {
    patientName: string
    revenueDate: string
    settledAt: string
    paymentMethodLabel: string
    description: string | null
    grossAmountLabel: string
    professionalName: string
    crefito: string
  }
}

export function PatientReportsPanel({
  clinicalReports,
  physioReport,
  receipts,
}: {
  clinicalReports: ClinicalReportItem[]
  physioReport: {
    hasContent: boolean
    assessmentDate: string | null
    pdfData: PhysioReportPdfData
  } | null
  receipts: ReceiptItem[]
}) {
  const empty =
    clinicalReports.length === 0 &&
    !physioReport?.hasContent &&
    receipts.length === 0

  if (empty) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            Ainda não há relatórios ou recibos gerados para esta paciente.
            Relatórios clínicos aparecem após “Alta + relatório clínico”; o
            relatório de avaliação fica na aba Avaliação; recibos saem dos
            lançamentos financeiros.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Relatórios clínicos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {clinicalReports.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum relatório clínico gerado. Conclua um tratamento com “Alta +
              relatório clínico”.
            </p>
          ) : (
            clinicalReports.map((item) => (
              <div
                key={item.treatmentId}
                className="rounded-lg border border-border px-3 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{item.protocolName}</p>
                    <p className="text-xs text-muted-foreground">
                      Status do tratamento: {item.treatmentStatus}
                      {item.finalizedAt
                        ? ` · finalizado ${item.finalizedAt}`
                        : item.updatedAt
                          ? ` · atualizado ${item.updatedAt}`
                          : ""}
                    </p>
                  </div>
                  <Badge variant="secondary">Clínico</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/relatorios/clinico/${item.treatmentId}`}
                    className={cn(
                      buttonVariants({ size: "sm", variant: "outline" }),
                    )}
                  >
                    Abrir / revisar
                  </Link>
                  <DownloadClinicalPdfButton data={item.pdfData} />
                  <DownloadClinicalWordButton data={item.pdfData} />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Relatório de avaliação (uroginecológica)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!physioReport?.hasContent ? (
            <p className="text-sm text-muted-foreground">
              Relatório de avaliação ainda não preenchido. Edite na aba
              Avaliação → Relatório.
            </p>
          ) : (
            <div className="rounded-lg border border-border px-3 py-3">
              <p className="text-sm font-medium">
                Relatório fisioterapêutico
              </p>
              <p className="text-xs text-muted-foreground">
                {physioReport.assessmentDate
                  ? `Data da avaliação: ${physioReport.assessmentDate}`
                  : "Textos salvos na avaliação"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <DownloadPhysioReportPdfButton data={physioReport.pdfData} />
                <DownloadPhysioReportWordButton data={physioReport.pdfData} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recibos de pagamento</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {receipts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum recibo ainda. Lance uma receita na aba Financeiro.
            </p>
          ) : (
            receipts.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.label}</p>
                  <p className="text-xs text-muted-foreground">{r.meta}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{r.amountLabel}</span>
                  <DownloadReceiptButton data={r.receiptData} />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
