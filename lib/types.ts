export type ClinicBaseMode = "with_fee" | "without_fee"

export type PaymentMethod =
  | "dinheiro"
  | "pix"
  | "debito"
  | "credito"
  | "outro"

export type PatientStatus = "ativo" | "em_tratamento" | "alta" | "inativo"
export type PatientSex = "feminino" | "masculino" | "outro" | "nao_informado"
export type TreatmentKind = "pacote" | "avulso"
export type TreatmentStatus = "ativo" | "concluido" | "cancelado"
export type InstallmentStatus = "pendente" | "paga" | "atrasada"

export type DeviceAccessRoute =
  | "sonda_vaginal"
  | "sonda_anal"
  | "eletrodo_superficie"
  | "outro"
  | "nao_aplicavel"

export type Profile = {
  id: string
  full_name: string | null
  created_at: string
}

export type FinancialSettings = {
  id: string
  user_id: string
  clinic_percent: number
  card_fee_percent: number
  default_clinic_base_mode: ClinicBaseMode
  default_clinic_shares_card_fee: boolean
  clinical_chance_indicator_enabled: boolean
  card_credit_settlement_days: number
}

export type Patient = {
  id: string
  user_id: string
  full_name: string
  birth_date: string | null
  age_years: number | null
  sex: PatientSex
  phone: string | null
  email: string | null
  complaint_focus: string | null
  notes: string | null
  status: PatientStatus
  created_at: string
}

export type Treatment = {
  id: string
  user_id: string
  patient_id: string
  kind: TreatmentKind
  protocol_name: string
  planned_sessions: number
  total_amount: number
  installment_count: number
  status: TreatmentStatus
  started_at: string
  completed_at: string | null
  created_at: string
}

export type Installment = {
  id: string
  user_id: string
  treatment_id: string
  sequence_number: number
  amount: number
  due_date: string | null
  status: InstallmentStatus
  paid_at: string | null
}

export type Session = {
  id: string
  user_id: string
  patient_id: string
  treatment_id: string | null
  session_date: string
  daily_complaint: string | null
  procedures_done: string | null
  patient_response: string | null
  evolution_scale: number | null
  access_route: DeviceAccessRoute | null
  device_notes: string | null
  next_step: string | null
  created_at: string
}

export type DeviceCatalog = {
  id: string
  user_id: string
  slug: string
  name: string
  description: string | null
  is_active: boolean
  sort_order: number
}

export type Revenue = {
  id: string
  user_id: string
  patient_id: string | null
  treatment_id: string | null
  installment_id: string | null
  session_id: string | null
  revenue_date: string
  settled_at: string
  description: string | null
  gross_amount: number
  payment_method: PaymentMethod
  clinic_percent: number
  card_fee_percent: number
  clinic_base_mode: ClinicBaseMode
  clinic_shares_card_fee: boolean
  card_fee_amount: number
  clinic_base_amount: number
  clinic_gross_share: number
  professional_gross_share: number
  clinic_fee_share: number
  professional_fee_share: number
  clinic_net_amount: number
  professional_net_amount: number
  created_at: string
}

export type Expense = {
  id: string
  user_id: string
  category_id: string | null
  patient_id: string | null
  expense_date: string
  description: string
  amount: number
  created_at: string
}

export type ExpenseCategory = {
  id: string
  user_id: string
  name: string
  is_active: boolean
}

export type ClinicalChanceBand = {
  id: string
  user_id: string
  complaint_type: string
  cure_min_percent: number | null
  cure_max_percent: number | null
  cure_or_improve_min_percent: number | null
  cure_or_improve_max_percent: number | null
  control_min_percent: number | null
  control_max_percent: number | null
  source_text: string | null
  is_active: boolean
}

export type ReportDefaults = {
  id: string
  user_id: string
  disclaimer_text: string
  maintenance_guidance_text: string
  professional_name: string
  crefito: string
}

export type ClinicalReport = {
  id: string
  user_id: string
  patient_id: string
  treatment_id: string
  synthesis_text: string | null
  maintenance_guidance: string | null
  adherence_percent: number | null
  sessions_planned: number | null
  sessions_done: number | null
  scale_start: number | null
  scale_end: number | null
  devices_summary: string | null
  chance_summary: string | null
  complaint_focus: string | null
  treatment_period_start: string | null
  treatment_period_end: string | null
  finalized_at: string | null
}
