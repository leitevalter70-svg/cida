import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { SetupNotice } from "@/components/setup-notice"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PatientForm } from "@/components/forms/patient-form"
import { resolveComplaintOptions } from "@/lib/clinical/complaints"
import { PatientsList } from "@/components/patients-list"

export default async function PacientesPage() {
  let patients: any[] = []
  let complaintOptions = resolveComplaintOptions()

  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    const [{ data }, { data: bands }] = await Promise.all([
      supabase.from("patients").select("*").order("full_name"),
      supabase
        .from("clinical_chance_bands")
        .select("complaint_type")
        .eq("is_active", true),
    ])
    patients = data ?? []
    complaintOptions = resolveComplaintOptions(
      (bands ?? []).map((b) => b.complaint_type),
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <SetupNotice />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pacientes</h1>
          <p className="text-sm text-muted-foreground">
            Cadastro, status e ficha clínica
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Novo paciente</CardTitle>
          </CardHeader>
          <CardContent>
            <PatientForm complaintOptions={complaintOptions} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Lista</CardTitle>
          </CardHeader>
          <CardContent>
            <PatientsList patients={patients} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
