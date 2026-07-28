/** Schema tipado da avaliação uroginecológica (persistido em JSONB no Supabase). */

export type MedicationRow = {
  name: string
  reason: string
  duration: string
}

export type UroginecoAnamnese = {
  marital_status: string
  profession: string
  medical_diagnosis: string[]
  doctor_name: string
  doctor_return: string
  urinary_symptoms: string[]
  frequency_detail: string
  nocturia_detail: string
  pain_detail: string
  garrulitas_context: string[]
  leak_activities: string[]
  leak_activities_other: string
  leak_amount: string
  iu_severity: string
  pad_use: string
  pad_type: string
  pad_changes_day: string
  pad_changes_night: string
  underwear_changes_24h: string
  symptoms_onset: string
  holds_urine: string
  holds_urine_how_long: string
  bowel: string[]
  gestations: string
  parity: string
  abortions: string
  vaginal_births: string
  cesareans: string
  forceps: string
  heaviest_newborn_weight: string
  last_pregnancy_time: string
  urine_loss_in_pregnancy: string
  gyn_surgery: string
  gyn_surgery_count: string
  gyn_surgery_details: string
  menopause: string
  dum: string
  contraception: string[]
  hrt_use: string
  prior_physio: string
  prior_physio_when: string
  prior_physio_duration: string
  neoplasia: boolean
  neoplasia_detail: string
  radiotherapy: boolean
  radiotherapy_time: string
  chemotherapy: boolean
  chemotherapy_time: string
  other_diseases: string
  metal_implant_pacemaker: string
  metal_implant_where: string
  physical_activity: string
  physical_activity_detail: string
  avoids_activities_due_leak: string
  avoids_activities_what: string
  habits_cigarette: boolean
  habits_cigarette_qty: string
  habits_alcohol: boolean
  habits_alcohol_qty: string
  habits_coffee: boolean
  habits_coffee_qty: string
  habits_sweetener: boolean
  habits_sweetener_qty: string
  habits_citrus: boolean
  habits_citrus_qty: string
  habits_soda: boolean
  habits_soda_qty: string
  habits_pepper: boolean
  habits_pepper_qty: string
  habits_caffeine_tea: boolean
  habits_caffeine_tea_qty: string
  habits_chocolate: boolean
  habits_chocolate_qty: string
  avoids_fluids: string
  daily_fluid_ml: string
  sexual_activity: string
  pain_during_sex: string
  urge_to_void_during_sex: string
  leak_during_sex: string
  partner_knows_leak: string
  sexual_life_quality: string
  desire_for_sex: string
  sex_changed_due_leak: string
  medications: MedicationRow[]
}

export type UroginecoPhysicalExam = {
  weight: string
  height: string
  umbilical_girth: string
  sensitivity: string
  sensitivity_side: string[]
  bulbocavernosus: string
  anal_cutaneous: string
  cough_reflex: string
  perineal_awareness: string
  perineal_awareness_quality: string
  accessory_muscles: string
  accessory_muscles_which: string
  valsalva: string
  episiotomy: string
  episiotomy_type: string
  perineal_tear: string
  dystopia: string
  dystopia_anterior: string[]
  dystopia_posterior: string[]
  dystopia_apical: string[]
  scar_adhesion: string
  muscle_tone: string
  muscle_tone_side: string
  perfect_p: string
  perfect_e: string
  perfect_r: string
  perfect_f: string
  ect_e: string
  ect_c: string
  ect_t: string
  perineometer_mmhg: string
  urodynamic_study: string
  urodynamic_date: string
  urine_exam: string
  urine_exam_date: string
  care_mode: string
  objective_plan: string
}

export type UroginecoAssessment = {
  id: string
  user_id: string
  patient_id: string
  assessment_date: string
  anamnese: UroginecoAnamnese
  physical_exam: UroginecoPhysicalExam
  report_anamnese_text: string | null
  report_exam_text: string | null
  report_proposal_text: string | null
  report_guidance_text: string | null
  created_at: string
  updated_at: string
}

export const emptyAnamnese = (): UroginecoAnamnese => ({
  marital_status: "",
  profession: "",
  medical_diagnosis: [],
  doctor_name: "",
  doctor_return: "",
  urinary_symptoms: [],
  frequency_detail: "",
  nocturia_detail: "",
  pain_detail: "",
  garrulitas_context: [],
  leak_activities: [],
  leak_activities_other: "",
  leak_amount: "",
  iu_severity: "",
  pad_use: "",
  pad_type: "",
  pad_changes_day: "",
  pad_changes_night: "",
  underwear_changes_24h: "",
  symptoms_onset: "",
  holds_urine: "",
  holds_urine_how_long: "",
  bowel: [],
  gestations: "",
  parity: "",
  abortions: "",
  vaginal_births: "",
  cesareans: "",
  forceps: "",
  heaviest_newborn_weight: "",
  last_pregnancy_time: "",
  urine_loss_in_pregnancy: "",
  gyn_surgery: "",
  gyn_surgery_count: "",
  gyn_surgery_details: "",
  menopause: "",
  dum: "",
  contraception: [],
  hrt_use: "",
  prior_physio: "",
  prior_physio_when: "",
  prior_physio_duration: "",
  neoplasia: false,
  neoplasia_detail: "",
  radiotherapy: false,
  radiotherapy_time: "",
  chemotherapy: false,
  chemotherapy_time: "",
  other_diseases: "",
  metal_implant_pacemaker: "",
  metal_implant_where: "",
  physical_activity: "",
  physical_activity_detail: "",
  avoids_activities_due_leak: "",
  avoids_activities_what: "",
  habits_cigarette: false,
  habits_cigarette_qty: "",
  habits_alcohol: false,
  habits_alcohol_qty: "",
  habits_coffee: false,
  habits_coffee_qty: "",
  habits_sweetener: false,
  habits_sweetener_qty: "",
  habits_citrus: false,
  habits_citrus_qty: "",
  habits_soda: false,
  habits_soda_qty: "",
  habits_pepper: false,
  habits_pepper_qty: "",
  habits_caffeine_tea: false,
  habits_caffeine_tea_qty: "",
  habits_chocolate: false,
  habits_chocolate_qty: "",
  avoids_fluids: "",
  daily_fluid_ml: "",
  sexual_activity: "",
  pain_during_sex: "",
  urge_to_void_during_sex: "",
  leak_during_sex: "",
  partner_knows_leak: "",
  sexual_life_quality: "",
  desire_for_sex: "",
  sex_changed_due_leak: "",
  medications: [{ name: "", reason: "", duration: "" }],
})

export const emptyPhysicalExam = (): UroginecoPhysicalExam => ({
  weight: "",
  height: "",
  umbilical_girth: "",
  sensitivity: "",
  sensitivity_side: [],
  bulbocavernosus: "",
  anal_cutaneous: "",
  cough_reflex: "",
  perineal_awareness: "",
  perineal_awareness_quality: "",
  accessory_muscles: "",
  accessory_muscles_which: "",
  valsalva: "",
  episiotomy: "",
  episiotomy_type: "",
  perineal_tear: "",
  dystopia: "",
  dystopia_anterior: [],
  dystopia_posterior: [],
  dystopia_apical: [],
  scar_adhesion: "",
  muscle_tone: "",
  muscle_tone_side: "",
  perfect_p: "",
  perfect_e: "",
  perfect_r: "",
  perfect_f: "",
  ect_e: "",
  ect_c: "",
  ect_t: "",
  perineometer_mmhg: "",
  urodynamic_study: "",
  urodynamic_date: "",
  urine_exam: "",
  urine_exam_date: "",
  care_mode: "",
  objective_plan: "",
})

export function mergeAnamnese(raw: unknown): UroginecoAnamnese {
  const base = emptyAnamnese()
  if (!raw || typeof raw !== "object") return base
  const o = raw as Partial<UroginecoAnamnese>
  return {
    ...base,
    ...o,
    medical_diagnosis: Array.isArray(o.medical_diagnosis) ? o.medical_diagnosis : [],
    urinary_symptoms: Array.isArray(o.urinary_symptoms) ? o.urinary_symptoms : [],
    garrulitas_context: Array.isArray(o.garrulitas_context) ? o.garrulitas_context : [],
    leak_activities: Array.isArray(o.leak_activities) ? o.leak_activities : [],
    bowel: Array.isArray(o.bowel) ? o.bowel : [],
    contraception: Array.isArray(o.contraception) ? o.contraception : [],
    medications:
      Array.isArray(o.medications) && o.medications.length > 0
        ? o.medications
        : base.medications,
  }
}

export function mergePhysicalExam(raw: unknown): UroginecoPhysicalExam {
  const base = emptyPhysicalExam()
  if (!raw || typeof raw !== "object") return base
  const o = raw as Partial<UroginecoPhysicalExam>
  return {
    ...base,
    ...o,
    sensitivity_side: Array.isArray(o.sensitivity_side) ? o.sensitivity_side : [],
    dystopia_anterior: Array.isArray(o.dystopia_anterior) ? o.dystopia_anterior : [],
    dystopia_posterior: Array.isArray(o.dystopia_posterior) ? o.dystopia_posterior : [],
    dystopia_apical: Array.isArray(o.dystopia_apical) ? o.dystopia_apical : [],
  }
}

const ROMAN: Record<string, string> = {
  "0": "0",
  "1": "I",
  "2": "II",
  "3": "III",
  "4": "IV",
  "5": "V",
}

function joinList(items: string[], conj = " e ") {
  const clean = items.map((s) => s.trim()).filter(Boolean)
  if (clean.length === 0) return ""
  if (clean.length === 1) return clean[0]
  return `${clean.slice(0, -1).join(", ")}${conj}${clean[clean.length - 1]}`
}

function sexLabel(sex: string | null | undefined) {
  if (sex === "feminino") return "feminino"
  if (sex === "masculino") return "masculino"
  if (sex === "outro") return "outro"
  return "não informado"
}

export type PhysioReportPatientInput = {
  full_name: string
  age_years: number | null
  sex: string | null
  complaint_focus: string | null
}

export type PhysioReportDraft = {
  opening: string
  anamneseText: string
  examText: string
  proposalText: string
  guidanceText: string
}

/** Monta rascunho narrativo no tom do RELATÓRIO FISIOTERAPÊUTICO. */
export function buildPhysioReportDraft(
  patient: PhysioReportPatientInput,
  anamnese: UroginecoAnamnese,
  exam: UroginecoPhysicalExam,
): PhysioReportDraft {
  const agePart =
    patient.age_years != null ? `${patient.age_years} anos` : "idade não informada"
  const complaint =
    patient.complaint_focus?.trim() ||
    joinList(anamnese.urinary_symptoms) ||
    "queixa a esclarecer"

  const opening = `Paciente, ${patient.full_name}, ${agePart}, sexo ${sexLabel(patient.sex)}, com queixa de ${complaint}.`

  const anamneseBits: string[] = []
  const obst: string[] = []
  if (anamnese.cesareans) obst.push(`${anamnese.cesareans} cesárea(s)`)
  if (anamnese.vaginal_births) obst.push(`${anamnese.vaginal_births} parto(s) normal(is)`)
  if (anamnese.forceps) obst.push(`${anamnese.forceps} fórceps`)
  if (anamnese.gestations) obst.push(`${anamnese.gestations} gestação(ões)`)
  if (obst.length) anamneseBits.push(joinList(obst))
  if (anamnese.symptoms_onset)
    anamneseBits.push(`sintomas há ${anamnese.symptoms_onset}`)
  if (anamnese.urine_loss_in_pregnancy === "sim")
    anamneseBits.push("perda de urina durante a gravidez")
  if (anamnese.gyn_surgery === "sim")
    anamneseBits.push(
      anamnese.gyn_surgery_details
        ? `cirurgia(s) ginecológica(s): ${anamnese.gyn_surgery_details}`
        : "cirurgia(s) ginecológica(s)",
    )
  if (anamnese.iu_severity)
    anamneseBits.push(`incontinência ${anamnese.iu_severity}`)
  if (anamnese.leak_activities.length)
    anamneseBits.push(
      `perda aos esforços (${joinList(anamnese.leak_activities)})`,
    )
  if (anamnese.prior_physio === "sim")
    anamneseBits.push("já realizou fisioterapia previamente")

  const anamneseText = anamneseBits.length
    ? `Inicialmente fizemos uma anamnese onde a paciente relatou ${joinList(anamneseBits)}.`
    : "Inicialmente fizemos uma anamnese com a paciente."

  const examBits: string[] = []
  const p = exam.perfect_p.trim()
  if (p !== "") {
    const roman = ROMAN[p] ?? p
    examBits.push(
      `grau ${roman} de força muscular perineal (P=${p} na escala PERFECT)`,
    )
  }
  if (exam.perfect_f)
    examBits.push(`contrações rápidas (F=${exam.perfect_f})`)
  if (exam.accessory_muscles === "sim")
    examBits.push(
      exam.accessory_muscles_which
        ? `utiliza musculatura acessória (${exam.accessory_muscles_which})`
        : "utiliza musculatura acessória",
    )
  if (exam.valsalva === "sim") examBits.push("realiza Valsalva / apneia no esforço")
  if (exam.perineal_awareness)
    examBits.push(`consciência perineal ${exam.perineal_awareness}`)
  if (exam.perineometer_mmhg)
    examBits.push(`perineômetro ${exam.perineometer_mmhg} mmHg`)
  if (exam.objective_plan) examBits.push(`conduta: ${exam.objective_plan}`)

  const examText = examBits.length
    ? `Na avaliação física, foi constatado que a paciente apresenta ${joinList(examBits)}.`
    : "Na avaliação física, os achados foram registrados na ficha."

  const proposalText =
    exam.objective_plan?.trim() ||
    "Eletroestimulação superficial e exercícios de Kegel que visam melhorar a consciência perineal e fortalecer os músculos do assoalho pélvico."

  const guidanceText =
    "Ajudar a paciente na compreensão dos exercícios, no tempo correto dos exercícios respiratórios. Durante o tratamento a paciente será reavaliada para comparar sua evolução. Será lembrada da importância da realização dos exercícios propostos em casa, pois são a base do tratamento."

  return { opening, anamneseText, examText, proposalText, guidanceText }
}

export function physioReportFileBaseName(patientName: string) {
  return `relatorio-fisioterapeutico-${patientName.replace(/\s+/g, "-").toLowerCase()}`
}

export const MEDICAL_DIAGNOSIS_OPTIONS = [
  { value: "IUE", label: "IUE" },
  { value: "Urgência", label: "Urgência" },
  { value: "Mista", label: "Mista" },
  { value: "Distopia", label: "Distopia" },
] as const

export const URINARY_SYMPTOM_OPTIONS = [
  { value: "frequencia", label: "Frequência" },
  { value: "nocturia", label: "Noctúria" },
  { value: "disuria", label: "Disúria" },
  { value: "esvaziamento_incompleto", label: "Sensação de esvaziamento incompleto" },
  { value: "enurese_noturna", label: "Enurese noturna" },
  { value: "itu_repeticao", label: "ITU de repetição" },
  { value: "dor", label: "Dor" },
  { value: "dor_replecao", label: "Dor à repleção vesical" },
  { value: "alargamento_vaginal", label: "Sensação de alargamento do canal vaginal" },
  { value: "esforco_urinar", label: "Esforço para urinar" },
  { value: "hesitacao", label: "Hesitação" },
  { value: "gotejamento_pos", label: "Gotejamento pós-miccional" },
  { value: "hematuria", label: "Hematúria" },
  { value: "garrulitas", label: "Garrulitas (flato vaginal)" },
] as const

export const LEAK_ACTIVITY_OPTIONS = [
  { value: "tosse", label: "Tosse" },
  { value: "espirro", label: "Espirro" },
  { value: "agachar", label: "Agachar" },
  { value: "erguer_peso", label: "Erguer peso" },
  { value: "risada", label: "Risada" },
  { value: "caminhando", label: "Caminhando" },
  { value: "contato_agua", label: "Contato com água" },
  { value: "relacao_sexual", label: "Relação sexual" },
  { value: "outros", label: "Outros" },
] as const

export const BOWEL_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "constipacao", label: "Constipação" },
  { value: "perde_gazes", label: "Perde gazes" },
  { value: "perde_fezes", label: "Perde fezes" },
  { value: "hemorroida", label: "Hemorróida" },
] as const
