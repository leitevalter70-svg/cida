import { packageBalanceFor } from "./package-balance"

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const treatment = { id: "t1", total_amount: 1250 }

// Parcelas pendentes: soma em aberto
{
  const r = packageBalanceFor(
    "t1",
    [treatment],
    [
      { id: "i1", treatment_id: "t1", amount: 625, status: "pendente" },
      { id: "i2", treatment_id: "t1", amount: 625, status: "pendente" },
    ],
    [],
  )
  assert(r.amount === 1250, `pending sum got ${r.amount}`)
  assert(r.count === 2, "count 2")
  assert(!r.alreadyPaid, "not paid")
}

// Uma parcela paga, uma pendente
{
  const r = packageBalanceFor(
    "t1",
    [treatment],
    [
      { id: "i1", treatment_id: "t1", amount: 625, status: "paga" },
      { id: "i2", treatment_id: "t1", amount: 625, status: "pendente" },
    ],
    [
      {
        treatment_id: "t1",
        gross_amount: 625,
        revenue_date: "2026-07-20",
      },
    ],
  )
  assert(r.amount === 625, `remaining got ${r.amount}`)
  assert(r.count === 1, "one pending")
  assert(!r.alreadyPaid, "still open")
}

// Todas parcelas pagas — NÃO oferecer à vista de novo
{
  const r = packageBalanceFor(
    "t1",
    [treatment],
    [{ id: "i1", treatment_id: "t1", amount: 1250, status: "paga" }],
    [
      {
        treatment_id: "t1",
        gross_amount: 1250,
        revenue_date: "2026-07-20",
      },
    ],
  )
  assert(r.amount === 0, `paid amount open got ${r.amount}`)
  assert(r.alreadyPaid === true, "must be already paid")
  assert(r.paidAmount === 1250, "paidAmount")
  assert(r.paidLabel != null && r.paidLabel.includes("1.250"), `label ${r.paidLabel}`)
}

// Sem parcelas, mas receita já cobre o pacote (caso Eliane)
{
  const r = packageBalanceFor(
    "t1",
    [treatment],
    [],
    [
      {
        treatment_id: "t1",
        gross_amount: 1250,
        revenue_date: "2026-07-20",
      },
    ],
  )
  assert(r.alreadyPaid === true, "covered by revenue")
  assert(r.amount === 0, "no new launch")
}

// Sem parcelas e sem receita — pode à vista
{
  const r = packageBalanceFor("t1", [treatment], [], [])
  assert(r.alreadyPaid === false, "can pay full")
  assert(r.amount === 1250, `avista got ${r.amount}`)
  assert(r.count === 0, "no installment rows")
}

// Outro tratamento não interfere
{
  const r = packageBalanceFor(
    "t1",
    [treatment],
    [{ id: "ix", treatment_id: "t2", amount: 100, status: "pendente" }],
    [
      {
        treatment_id: "t2",
        gross_amount: 100,
        revenue_date: "2026-01-01",
      },
    ],
  )
  assert(r.amount === 1250, "other treatment ignored")
  assert(!r.alreadyPaid, "t1 still open")
}

console.log("package-balance tests ok")
