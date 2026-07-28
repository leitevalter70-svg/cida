"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  regenerateUroginecoReportDraft,
  upsertUroginecoAssessment,
  upsertUroginecoReportTexts,
} from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DownloadPhysioReportPdfButton,
  DownloadPhysioReportWordButton,
} from "@/components/physio-report-pdf"
import {
  BOWEL_OPTIONS,
  LEAK_ACTIVITY_OPTIONS,
  MEDICAL_DIAGNOSIS_OPTIONS,
  URINARY_SYMPTOM_OPTIONS,
  buildPhysioReportDraft,
  emptyAnamnese,
  emptyPhysicalExam,
  mergeAnamnese,
  mergePhysicalExam,
  type MedicationRow,
  type UroginecoAnamnese,
  type UroginecoPhysicalExam,
} from "@/lib/clinical/urogineco"
import { complaintLabel } from "@/lib/clinical/complaints"

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <fieldset className="space-y-3 rounded-xl border border-border/70 p-4">
      <legend className="px-1 text-sm font-semibold text-primary">{title}</legend>
      {children}
    </fieldset>
  )
}

function CheckGroup({
  options,
  values,
  onChange,
}: {
  options: readonly { value: string; label: string }[]
  values: string[]
  onChange: (next: string[]) => void
}) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {options.map((o) => {
        const checked = values.includes(o.value)
        return (
          <label
            key={o.value}
            className="flex items-center gap-2 text-sm text-foreground"
          >
            <input
              type="checkbox"
              className="size-4 rounded border-input"
              checked={checked}
              onChange={() => {
                onChange(
                  checked
                    ? values.filter((v) => v !== o.value)
                    : [...values, o.value],
                )
              }}
            />
            {o.label}
          </label>
        )
      })}
    </div>
  )
}

function YesNo({
  value,
  onChange,
  name,
}: {
  value: string
  onChange: (v: string) => void
  name?: string
}) {
  return (
    <div className="flex gap-4 text-sm">
      {["sim", "não"].map((opt) => (
        <label key={opt} className="flex items-center gap-2">
          <input
            type="radio"
            name={name}
            checked={value === opt}
            onChange={() => onChange(opt)}
          />
          {opt}
        </label>
      ))}
    </div>
  )
}

export function UroginecoAssessmentForm({
  patientId,
  patientName,
  patientAge,
  patientSex,
  complaintFocus,
  patientNotes,
  assessmentDate,
  initialAnamnese,
  initialExam,
  initialReport,
  credentials,
}: {
  patientId: string
  patientName: string
  patientAge: number | null
  patientSex: string | null
  complaintFocus: string | null
  patientNotes: string | null
  assessmentDate: string | null
  initialAnamnese: unknown
  initialExam: unknown
  initialReport: {
    openingText: string | null
    anamneseText: string | null
    examText: string | null
    proposalText: string | null
    guidanceText: string | null
  }
  credentials: { professionalName: string; crefitoLine: string }
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)
  const [date, setDate] = useState(
    assessmentDate || new Date().toISOString().slice(0, 10),
  )
  const [anamnese, setAnamnese] = useState<UroginecoAnamnese>(() =>
    mergeAnamnese(initialAnamnese ?? emptyAnamnese()),
  )
  const [exam, setExam] = useState<UroginecoPhysicalExam>(() =>
    mergePhysicalExam(initialExam ?? emptyPhysicalExam()),
  )

  const draft = useMemo(
    () =>
      buildPhysioReportDraft(
        {
          full_name: patientName,
          age_years: patientAge,
          sex: patientSex,
          complaint_focus: complaintFocus,
          notes: patientNotes,
        },
        anamnese,
        exam,
      ),
    [
      patientName,
      patientAge,
      patientSex,
      complaintFocus,
      patientNotes,
      anamnese,
      exam,
    ],
  )

  const [reportOpening, setReportOpening] = useState(
    initialReport.openingText || draft.opening,
  )
  const [reportAnamnese, setReportAnamnese] = useState(
    initialReport.anamneseText || draft.anamneseText,
  )
  const [reportExam, setReportExam] = useState(
    initialReport.examText || draft.examText,
  )
  const [reportProposal, setReportProposal] = useState(
    initialReport.proposalText || draft.proposalText,
  )
  const [reportGuidance, setReportGuidance] = useState(
    initialReport.guidanceText || draft.guidanceText,
  )

  function setA<K extends keyof UroginecoAnamnese>(
    key: K,
    value: UroginecoAnamnese[K],
  ) {
    setAnamnese((prev) => ({ ...prev, [key]: value }))
  }

  function setE<K extends keyof UroginecoPhysicalExam>(
    key: K,
    value: UroginecoPhysicalExam[K],
  ) {
    setExam((prev) => ({ ...prev, [key]: value }))
  }

  function saveClinical() {
    setError(null)
    setOkMsg(null)
    startTransition(async () => {
      try {
        await upsertUroginecoAssessment(patientId, {
          assessment_date: date,
          anamnese,
          physical_exam: exam,
        })
        setOkMsg("Anamnese e avaliação física salvas no Supabase.")
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao salvar.")
      }
    })
  }

  function saveReport() {
    setError(null)
    setOkMsg(null)
    startTransition(async () => {
      try {
        await upsertUroginecoReportTexts(patientId, {
          report_opening_text: reportOpening,
          report_anamnese_text: reportAnamnese,
          report_exam_text: reportExam,
          report_proposal_text: reportProposal,
          report_guidance_text: reportGuidance,
        })
        setOkMsg("Relatório salvo no Supabase.")
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao salvar.")
      }
    })
  }

  function regenerate() {
    setError(null)
    setOkMsg(null)
    startTransition(async () => {
      try {
        const d = await regenerateUroginecoReportDraft(patientId)
        setReportOpening(d.opening)
        setReportAnamnese(d.anamneseText)
        setReportExam(d.examText)
        setReportProposal(d.proposalText)
        setReportGuidance(d.guidanceText)
        setOkMsg("Rascunho do relatório regenerado e salvo.")
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao regenerar.")
      }
    })
  }

  const pdfData = {
    patientName,
    opening: reportOpening,
    anamneseText: reportAnamnese,
    examText: reportExam,
    proposalText: reportProposal,
    guidanceText: reportGuidance,
    professionalName: credentials.professionalName,
    crefitoLine: credentials.crefitoLine,
  }

  function updateMed(i: number, patch: Partial<MedicationRow>) {
    setAnamnese((prev) => {
      const medications = [...prev.medications]
      medications[i] = { ...medications[i], ...patch }
      return { ...prev, medications }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="assessment_date">Data da avaliação</Label>
          <Input
            id="assessment_date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-44"
          />
        </div>
        <p className="pb-2 text-xs text-muted-foreground">
          Cadastro: {patientName}
          {patientAge != null ? ` · ${patientAge} anos` : ""}
          {complaintFocus
            ? ` · ${complaintLabel(complaintFocus)}`
            : ""}{" "}
          (não repetido nos formulários)
        </p>
      </div>

      <Tabs defaultValue="anamnese">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="anamnese">Anamnese</TabsTrigger>
          <TabsTrigger value="exame">Avaliação física</TabsTrigger>
          <TabsTrigger value="relatorio">Relatório</TabsTrigger>
        </TabsList>

        <TabsContent value="anamnese" className="mt-4 space-y-4">
          <Section title="Identificação complementar">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Estado civil</Label>
                <Input
                  value={anamnese.marital_status}
                  onChange={(e) => setA("marital_status", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Profissão</Label>
                <Input
                  value={anamnese.profession}
                  onChange={(e) => setA("profession", e.target.value)}
                />
              </div>
            </div>
          </Section>

          <Section title="Diagnóstico médico">
            <CheckGroup
              options={MEDICAL_DIAGNOSIS_OPTIONS}
              values={anamnese.medical_diagnosis}
              onChange={(v) => setA("medical_diagnosis", v)}
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nome do médico</Label>
                <Input
                  value={anamnese.doctor_name}
                  onChange={(e) => setA("doctor_name", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Retorno médico</Label>
                <Input
                  value={anamnese.doctor_return}
                  onChange={(e) => setA("doctor_return", e.target.value)}
                />
              </div>
            </div>
          </Section>

          <Section title="Sintomas urinários">
            <CheckGroup
              options={URINARY_SYMPTOM_OPTIONS}
              values={anamnese.urinary_symptoms}
              onChange={(v) => setA("urinary_symptoms", v)}
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Frequência (detalhe)</Label>
                <Input
                  value={anamnese.frequency_detail}
                  onChange={(e) => setA("frequency_detail", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Noctúria (detalhe)</Label>
                <Input
                  value={anamnese.nocturia_detail}
                  onChange={(e) => setA("nocturia_detail", e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Dor (local/detalhe)</Label>
                <Input
                  value={anamnese.pain_detail}
                  onChange={(e) => setA("pain_detail", e.target.value)}
                />
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <Label>Garrulitas — contexto</Label>
              <CheckGroup
                options={[
                  { value: "relacao", label: "Na relação sexual" },
                  { value: "caminhar", label: "Ao caminhar" },
                ]}
                values={anamnese.garrulitas_context}
                onChange={(v) => setA("garrulitas_context", v)}
              />
            </div>
          </Section>

          <Section title="Perda urinária">
            <Label className="mb-2 block">Atividades que fazem perder urina</Label>
            <CheckGroup
              options={LEAK_ACTIVITY_OPTIONS}
              values={anamnese.leak_activities}
              onChange={(v) => setA("leak_activities", v)}
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Outros</Label>
                <Input
                  value={anamnese.leak_activities_other}
                  onChange={(e) => setA("leak_activities_other", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Quantidade de perda</Label>
                <select
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                  value={anamnese.leak_amount}
                  onChange={(e) => setA("leak_amount", e.target.value)}
                >
                  <option value="">—</option>
                  <option value="em gotas">Em gotas</option>
                  <option value="em jato">Em jato</option>
                  <option value="contínuo">Contínuo</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Incontinência</Label>
                <select
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                  value={anamnese.iu_severity}
                  onChange={(e) => setA("iu_severity", e.target.value)}
                >
                  <option value="">—</option>
                  <option value="leve">Leve</option>
                  <option value="moderada">Moderada</option>
                  <option value="intensa">Intensa</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Uso de forro</Label>
                <YesNo
                  value={anamnese.pad_use}
                  onChange={(v) => setA("pad_use", v)}
                  name="pad_use"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo de forro</Label>
                <Input
                  value={anamnese.pad_type}
                  onChange={(e) => setA("pad_type", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Trocas / dia</Label>
                <Input
                  value={anamnese.pad_changes_day}
                  onChange={(e) => setA("pad_changes_day", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Trocas / noite</Label>
                <Input
                  value={anamnese.pad_changes_night}
                  onChange={(e) => setA("pad_changes_night", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Trocas de calcinha / 24h</Label>
                <Input
                  value={anamnese.underwear_changes_24h}
                  onChange={(e) =>
                    setA("underwear_changes_24h", e.target.value)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Início dos sintomas</Label>
                <Input
                  value={anamnese.symptoms_onset}
                  onChange={(e) => setA("symptoms_onset", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Segura muito a urina?</Label>
                <YesNo
                  value={anamnese.holds_urine}
                  onChange={(v) => setA("holds_urine", v)}
                  name="holds_urine"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Quanto tempo</Label>
                <Input
                  value={anamnese.holds_urine_how_long}
                  onChange={(e) => setA("holds_urine_how_long", e.target.value)}
                />
              </div>
            </div>
          </Section>

          <Section title="Intestino">
            <CheckGroup
              options={BOWEL_OPTIONS}
              values={anamnese.bowel}
              onChange={(v) => setA("bowel", v)}
            />
          </Section>

          <Section title="Histórico obstétrico">
            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  ["gestations", "Gestação"],
                  ["parity", "Paridade"],
                  ["abortions", "Aborto"],
                  ["vaginal_births", "Normal"],
                  ["cesareans", "Cesárea"],
                  ["forceps", "Fórceps"],
                  ["heaviest_newborn_weight", "Peso RN maior"],
                  ["last_pregnancy_time", "Tempo última gestação"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-1.5">
                  <Label>{label}</Label>
                  <Input
                    value={anamnese[key]}
                    onChange={(e) => setA(key, e.target.value)}
                  />
                </div>
              ))}
              <div className="space-y-1.5">
                <Label>Perda de urina na gravidez?</Label>
                <YesNo
                  value={anamnese.urine_loss_in_pregnancy}
                  onChange={(v) => setA("urine_loss_in_pregnancy", v)}
                  name="urine_loss_in_pregnancy"
                />
              </div>
            </div>
          </Section>

          <Section title="Antecedentes pessoais">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Cirurgia ginecológica</Label>
                <YesNo
                  value={anamnese.gyn_surgery}
                  onChange={(v) => setA("gyn_surgery", v)}
                  name="gyn_surgery"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Quantas</Label>
                <Input
                  value={anamnese.gyn_surgery_count}
                  onChange={(e) => setA("gyn_surgery_count", e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Qual / quando</Label>
                <Textarea
                  value={anamnese.gyn_surgery_details}
                  onChange={(e) => setA("gyn_surgery_details", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Menopausa</Label>
                <Input
                  value={anamnese.menopause}
                  onChange={(e) => setA("menopause", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>DUM</Label>
                <Input
                  type="date"
                  value={anamnese.dum}
                  onChange={(e) => setA("dum", e.target.value)}
                />
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <Label>Método contraceptivo</Label>
              <CheckGroup
                options={[
                  { value: "pilula", label: "Pílula" },
                  { value: "diu", label: "DIU" },
                  { value: "preservativo", label: "Preservativo" },
                ]}
                values={anamnese.contraception}
                onChange={(v) => setA("contraception", v)}
              />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>TRH</Label>
                <select
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                  value={anamnese.hrt_use}
                  onChange={(e) => setA("hrt_use", e.target.value)}
                >
                  <option value="">—</option>
                  <option value="sim">Sim</option>
                  <option value="não">Não</option>
                  <option value="já fez uso">Já fez uso</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Já fez fisioterapia?</Label>
                <YesNo
                  value={anamnese.prior_physio}
                  onChange={(v) => setA("prior_physio", v)}
                  name="prior_physio"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Quando</Label>
                <Input
                  value={anamnese.prior_physio_when}
                  onChange={(e) => setA("prior_physio_when", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Por quanto tempo</Label>
                <Input
                  value={anamnese.prior_physio_duration}
                  onChange={(e) =>
                    setA("prior_physio_duration", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={anamnese.neoplasia}
                  onChange={(e) => setA("neoplasia", e.target.checked)}
                />
                Neoplasias
              </label>
              <Input
                placeholder="Tipo e região"
                value={anamnese.neoplasia_detail}
                onChange={(e) => setA("neoplasia_detail", e.target.value)}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={anamnese.radiotherapy}
                    onChange={(e) => setA("radiotherapy", e.target.checked)}
                  />
                  Radioterapia
                </label>
                <Input
                  placeholder="Tempo"
                  value={anamnese.radiotherapy_time}
                  onChange={(e) => setA("radiotherapy_time", e.target.value)}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={anamnese.chemotherapy}
                    onChange={(e) => setA("chemotherapy", e.target.checked)}
                  />
                  Quimioterapia
                </label>
                <Input
                  placeholder="Tempo"
                  value={anamnese.chemotherapy_time}
                  onChange={(e) => setA("chemotherapy_time", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Outras doenças</Label>
                <Textarea
                  value={anamnese.other_diseases}
                  onChange={(e) => setA("other_diseases", e.target.value)}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Implante metálico / marcapasso</Label>
                  <YesNo
                    value={anamnese.metal_implant_pacemaker}
                    onChange={(v) => setA("metal_implant_pacemaker", v)}
                    name="metal_implant"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Onde</Label>
                  <Input
                    value={anamnese.metal_implant_where}
                    onChange={(e) =>
                      setA("metal_implant_where", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </Section>

          <Section title="AVDs e hábitos">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Atividade física</Label>
                <YesNo
                  value={anamnese.physical_activity}
                  onChange={(v) => setA("physical_activity", v)}
                  name="physical_activity"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Qual e frequência</Label>
                <Input
                  value={anamnese.physical_activity_detail}
                  onChange={(e) =>
                    setA("physical_activity_detail", e.target.value)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Evita atividades por perda urinária?</Label>
                <YesNo
                  value={anamnese.avoids_activities_due_leak}
                  onChange={(v) => setA("avoids_activities_due_leak", v)}
                  name="avoids_activities"
                />
              </div>
              <div className="space-y-1.5">
                <Label>O quê?</Label>
                <Input
                  value={anamnese.avoids_activities_what}
                  onChange={(e) =>
                    setA("avoids_activities_what", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {(
                [
                  ["habits_cigarette", "habits_cigarette_qty", "Cigarro"],
                  ["habits_alcohol", "habits_alcohol_qty", "Álcool"],
                  ["habits_coffee", "habits_coffee_qty", "Café"],
                  ["habits_sweetener", "habits_sweetener_qty", "Adoçante"],
                  ["habits_citrus", "habits_citrus_qty", "Frutas cítricas"],
                  ["habits_soda", "habits_soda_qty", "Refrigerante"],
                  ["habits_pepper", "habits_pepper_qty", "Pimenta"],
                  [
                    "habits_caffeine_tea",
                    "habits_caffeine_tea_qty",
                    "Chás cafeinados",
                  ],
                  ["habits_chocolate", "habits_chocolate_qty", "Chocolate"],
                ] as const
              ).map(([flag, qty, label]) => (
                <div key={flag} className="flex items-center gap-2">
                  <label className="flex w-36 shrink-0 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={anamnese[flag]}
                      onChange={(e) => setA(flag, e.target.checked)}
                    />
                    {label}
                  </label>
                  <Input
                    placeholder="Qde"
                    value={anamnese[qty]}
                    onChange={(e) => setA(qty, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Evita líquidos?</Label>
                <YesNo
                  value={anamnese.avoids_fluids}
                  onChange={(v) => setA("avoids_fluids", v)}
                  name="avoids_fluids"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ingestão diária (ml)</Label>
                <Input
                  value={anamnese.daily_fluid_ml}
                  onChange={(e) => setA("daily_fluid_ml", e.target.value)}
                />
              </div>
            </div>
          </Section>

          <Section title="Atividade sexual">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Atividade sexual</Label>
                <select
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                  value={anamnese.sexual_activity}
                  onChange={(e) => setA("sexual_activity", e.target.value)}
                >
                  <option value="">—</option>
                  <option value="ativa">Ativa</option>
                  <option value="inativa">Inativa</option>
                </select>
              </div>
              {(
                [
                  ["pain_during_sex", "Dor na relação"],
                  ["urge_to_void_during_sex", "Vontade de urinar na relação"],
                  ["leak_during_sex", "Perde urina na relação"],
                  ["partner_knows_leak", "Parceiro sabe da perda"],
                  ["sex_changed_due_leak", "Mudou atividade sexual por perda"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-1.5">
                  <Label>{label}</Label>
                  <YesNo
                    value={anamnese[key]}
                    onChange={(v) => setA(key, v)}
                    name={key}
                  />
                </div>
              ))}
              <div className="space-y-1.5">
                <Label>Vida sexual</Label>
                <select
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                  value={anamnese.sexual_life_quality}
                  onChange={(e) => setA("sexual_life_quality", e.target.value)}
                >
                  <option value="">—</option>
                  <option value="ótima">Ótima</option>
                  <option value="boa">Boa</option>
                  <option value="ruim">Ruim</option>
                  <option value="péssima">Péssima</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Vontade de ter relação</Label>
                <select
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                  value={anamnese.desire_for_sex}
                  onChange={(e) => setA("desire_for_sex", e.target.value)}
                >
                  <option value="">—</option>
                  <option value="sempre">Sempre</option>
                  <option value="muitas vezes">Muitas vezes</option>
                  <option value="às vezes">Às vezes</option>
                  <option value="nunca">Nunca</option>
                </select>
              </div>
            </div>
          </Section>

          <Section title="Medicamentos em uso">
            <div className="space-y-2">
              {anamnese.medications.map((m, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-3">
                  <Input
                    placeholder="Medicamento"
                    value={m.name}
                    onChange={(e) => updateMed(i, { name: e.target.value })}
                  />
                  <Input
                    placeholder="Motivo"
                    value={m.reason}
                    onChange={(e) => updateMed(i, { reason: e.target.value })}
                  />
                  <Input
                    placeholder="Tempo"
                    value={m.duration}
                    onChange={(e) => updateMed(i, { duration: e.target.value })}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setA("medications", [
                    ...anamnese.medications,
                    { name: "", reason: "", duration: "" },
                  ])
                }
              >
                + Medicamento
              </Button>
            </div>
          </Section>

          <Button type="button" disabled={pending} onClick={saveClinical}>
            {pending ? "Salvando…" : "Salvar anamnese e exame no Supabase"}
          </Button>
        </TabsContent>

        <TabsContent value="exame" className="mt-4 space-y-4">
          <Section title="Antropometria">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Peso</Label>
                <Input
                  value={exam.weight}
                  onChange={(e) => setE("weight", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Altura</Label>
                <Input
                  value={exam.height}
                  onChange={(e) => setE("height", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Cirtometria umbilical</Label>
                <Input
                  value={exam.umbilical_girth}
                  onChange={(e) => setE("umbilical_girth", e.target.value)}
                />
              </div>
            </div>
          </Section>

          <Section title="Sensibilidade e neurológicos">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Teste de sensibilidade</Label>
                <select
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                  value={exam.sensitivity}
                  onChange={(e) => setE("sensitivity", e.target.value)}
                >
                  <option value="">—</option>
                  <option value="presente">Presente</option>
                  <option value="diminuída">Diminuída</option>
                  <option value="ausente">Ausente</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Lado</Label>
                <CheckGroup
                  options={[
                    { value: "D", label: "D" },
                    { value: "E", label: "E" },
                  ]}
                  values={exam.sensitivity_side}
                  onChange={(v) => setE("sensitivity_side", v)}
                />
              </div>
              {(
                [
                  ["bulbocavernosus", "Bulbocavernoso"],
                  ["anal_cutaneous", "Cutâneo anal"],
                  ["cough_reflex", "Cavernoso (tosse)"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-1.5">
                  <Label>{label}</Label>
                  <select
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                    value={exam[key]}
                    onChange={(e) => setE(key, e.target.value)}
                  >
                    <option value="">—</option>
                    <option value="presente">Presente</option>
                    <option value="ausente">Ausente</option>
                  </select>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Inspeção">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Consciência perineal</Label>
                <select
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                  value={exam.perineal_awareness}
                  onChange={(e) => setE("perineal_awareness", e.target.value)}
                >
                  <option value="">—</option>
                  <option value="presente">Presente</option>
                  <option value="ausente">Ausente</option>
                  <option value="1ª vez">1ª vez</option>
                  <option value="a partir da 2ª vez">A partir da 2ª vez</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Qualidade</Label>
                <select
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                  value={exam.perineal_awareness_quality}
                  onChange={(e) =>
                    setE("perineal_awareness_quality", e.target.value)
                  }
                >
                  <option value="">—</option>
                  <option value="ótima">Ótima</option>
                  <option value="boa">Boa</option>
                  <option value="regular">Regular</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Musculatura acessória</Label>
                <YesNo
                  value={exam.accessory_muscles}
                  onChange={(v) => setE("accessory_muscles", v)}
                  name="accessory_muscles"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Qual</Label>
                <Input
                  value={exam.accessory_muscles_which}
                  onChange={(e) =>
                    setE("accessory_muscles_which", e.target.value)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Valsalva</Label>
                <YesNo
                  value={exam.valsalva}
                  onChange={(v) => setE("valsalva", v)}
                  name="valsalva"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Episiotomia</Label>
                <YesNo
                  value={exam.episiotomy}
                  onChange={(v) => setE("episiotomy", v)}
                  name="episiotomy"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo episiotomia</Label>
                <select
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                  value={exam.episiotomy_type}
                  onChange={(e) => setE("episiotomy_type", e.target.value)}
                >
                  <option value="">—</option>
                  <option value="mediana">Mediana</option>
                  <option value="médio lateral">Médio lateral</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Rotura perineal</Label>
                <YesNo
                  value={exam.perineal_tear}
                  onChange={(v) => setE("perineal_tear", v)}
                  name="perineal_tear"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Distopia</Label>
                <select
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                  value={exam.dystopia}
                  onChange={(e) => setE("dystopia", e.target.value)}
                >
                  <option value="">—</option>
                  <option value="não">Não</option>
                  <option value="sim">Sim</option>
                </select>
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Anterior</Label>
                <CheckGroup
                  options={[
                    { value: "uretrocele", label: "Uretrocele" },
                    { value: "cistocele", label: "Cistocele" },
                  ]}
                  values={exam.dystopia_anterior}
                  onChange={(v) => setE("dystopia_anterior", v)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Posterior</Label>
                <CheckGroup
                  options={[{ value: "retocele", label: "Retocele" }]}
                  values={exam.dystopia_posterior}
                  onChange={(v) => setE("dystopia_posterior", v)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Apical</Label>
                <CheckGroup
                  options={[
                    { value: "prolapso uterino", label: "Prolapso uterino" },
                    { value: "cúpula vaginal", label: "Cúpula vaginal" },
                  ]}
                  values={exam.dystopia_apical}
                  onChange={(v) => setE("dystopia_apical", v)}
                />
              </div>
            </div>
          </Section>

          <Section title="Palpação e PERFECT">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Aderência cicatricial</Label>
                <YesNo
                  value={exam.scar_adhesion}
                  onChange={(v) => setE("scar_adhesion", v)}
                  name="scar_adhesion"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tônus muscular</Label>
                <select
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                  value={exam.muscle_tone}
                  onChange={(e) => setE("muscle_tone", e.target.value)}
                >
                  <option value="">—</option>
                  <option value="simétrico">Simétrico</option>
                  <option value="assimétrico">Assimétrico</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Maior à</Label>
                <select
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                  value={exam.muscle_tone_side}
                  onChange={(e) => setE("muscle_tone_side", e.target.value)}
                >
                  <option value="">—</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                </select>
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              {(
                [
                  ["perfect_p", "P (power 0–5)"],
                  ["perfect_e", "E (endurance)"],
                  ["perfect_r", "R (repetição)"],
                  ["perfect_f", "F (fast)"],
                  ["ect_e", "E"],
                  ["ect_c", "C"],
                  ["ect_t", "T"],
                  ["perineometer_mmhg", "Perineômetro mmHg"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-1.5">
                  <Label>{label}</Label>
                  <Input
                    value={exam[key]}
                    onChange={(e) => setE(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              P: 0 ausência · 1 esboço · 2 pequena sustentada · 3 moderada · 4
              satisfatória · 5 forte
            </p>
          </Section>

          <Section title="Exames e conduta">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Estudo urodinâmico</Label>
                <Input
                  value={exam.urodynamic_study}
                  onChange={(e) => setE("urodynamic_study", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={exam.urodynamic_date}
                  onChange={(e) => setE("urodynamic_date", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Exame de urina</Label>
                <Input
                  value={exam.urine_exam}
                  onChange={(e) => setE("urine_exam", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={exam.urine_exam_date}
                  onChange={(e) => setE("urine_exam_date", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Conduta</Label>
                <select
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                  value={exam.care_mode}
                  onChange={(e) => setE("care_mode", e.target.value)}
                >
                  <option value="">—</option>
                  <option value="individual">Atendimento individual</option>
                  <option value="grupo">Atendimento em grupo</option>
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Objetivo / conduta</Label>
                <Textarea
                  value={exam.objective_plan}
                  onChange={(e) => setE("objective_plan", e.target.value)}
                />
              </div>
            </div>
          </Section>

          <Button type="button" disabled={pending} onClick={saveClinical}>
            {pending ? "Salvando…" : "Salvar anamnese e exame no Supabase"}
          </Button>
        </TabsContent>

        <TabsContent value="relatorio" className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label>Abertura (identificação e queixa)</Label>
            <Textarea
              rows={3}
              value={reportOpening}
              onChange={(e) => setReportOpening(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Montada com cadastro + anamnese (sintomas, diagnóstico, perda).
              Não usa &quot;Outro&quot; do cadastro. Pode editar à mão.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Texto da anamnese</Label>
            <Textarea
              rows={4}
              value={reportAnamnese}
              onChange={(e) => setReportAnamnese(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Texto da avaliação física</Label>
            <Textarea
              rows={4}
              value={reportExam}
              onChange={(e) => setReportExam(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Proposta de tratamento</Label>
            <Textarea
              rows={4}
              value={reportProposal}
              onChange={(e) => setReportProposal(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Orientações</Label>
            <Textarea
              rows={4}
              value={reportGuidance}
              onChange={(e) => setReportGuidance(e.target.value)}
            />
          </div>
          <Section title="Assinatura (final do relatório)">
            <div className="space-y-1 border-t border-border/60 pt-3">
              <p className="text-sm font-semibold text-foreground">
                {credentials.professionalName}
              </p>
              <p className="text-sm text-muted-foreground">
                {credentials.crefitoLine}
              </p>
              <p className="text-sm text-muted-foreground">Fisioterapeuta</p>
              <p className="pt-1 text-xs text-muted-foreground">
                Nome e CREFITO vêm de Configurações e entram no PDF/Word.
              </p>
            </div>
          </Section>
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={pending} onClick={saveReport}>
              {pending ? "Salvando…" : "Salvar relatório no Supabase"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={regenerate}
            >
              Regenerar rascunho
            </Button>
            <DownloadPhysioReportPdfButton data={pdfData} />
            <DownloadPhysioReportWordButton data={pdfData} />
          </div>
        </TabsContent>
      </Tabs>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {okMsg && (
        <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
          {okMsg}
        </p>
      )}
    </div>
  )
}
