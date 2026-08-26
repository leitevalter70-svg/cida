"use client"

import type { ReactNode } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function PatientDetailTabs({
  defaultTab,
  dados,
  financeiro,
  avaliacao,
  tratamento,
  relatorios,
}: {
  defaultTab:
    | "dados"
    | "financeiro"
    | "avaliacao"
    | "tratamento"
    | "relatorios"
  dados: ReactNode
  financeiro: ReactNode
  avaliacao: ReactNode
  tratamento: ReactNode
  relatorios: ReactNode
}) {
  return (
    <Tabs defaultValue={defaultTab} className="gap-4">
      <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
        <TabsTrigger value="dados">Dados pessoais</TabsTrigger>
        <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
        <TabsTrigger value="avaliacao">Avaliação</TabsTrigger>
        <TabsTrigger value="tratamento">Tratamento</TabsTrigger>
        <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
      </TabsList>

      <TabsContent value="dados" className="mt-2 space-y-4">
        {dados}
      </TabsContent>
      <TabsContent value="financeiro" className="mt-2 space-y-4">
        {financeiro}
      </TabsContent>
      <TabsContent value="avaliacao" className="mt-2 space-y-4">
        {avaliacao}
      </TabsContent>
      <TabsContent value="tratamento" className="mt-2 space-y-4">
        {tratamento}
      </TabsContent>
      <TabsContent value="relatorios" className="mt-2 space-y-4">
        {relatorios}
      </TabsContent>
    </Tabs>
  )
}
