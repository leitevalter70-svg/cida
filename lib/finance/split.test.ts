import { calculateSplit } from "./split"

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

// bruto 100, cartão 10%, clínica 30%, SEM taxa na base, NÃO rateia
{
  const r = calculateSplit({
    grossAmount: 100,
    clinicPercent: 30,
    cardFeePercent: 10,
    paymentMethod: "credito",
    clinicBaseMode: "without_fee",
    clinicSharesCardFee: false,
  })
  assert(r.cardFeeAmount === 10, "fee")
  assert(r.clinicBaseAmount === 100, "base")
  assert(r.clinicGrossShare === 30, "clinic gross")
  assert(r.clinicNetAmount === 30, "clinic net")
  assert(r.professionalNetAmount === 50, `prof net got ${r.professionalNetAmount}`)
}

// COM taxa, RATEIA
{
  const r = calculateSplit({
    grossAmount: 100,
    clinicPercent: 30,
    cardFeePercent: 10,
    paymentMethod: "credito",
    clinicBaseMode: "with_fee",
    clinicSharesCardFee: true,
  })
  assert(r.clinicGrossShare === 27, "clinic gross with fee")
  assert(r.clinicFeeShare === 3, "clinic fee share")
  assert(r.clinicNetAmount === 24, "clinic final")
  assert(r.professionalNetAmount === 56, `prof final got ${r.professionalNetAmount}`)
}

// PIX — sem taxa
{
  const r = calculateSplit({
    grossAmount: 100,
    clinicPercent: 30,
    cardFeePercent: 10,
    paymentMethod: "pix",
    clinicBaseMode: "without_fee",
    clinicSharesCardFee: false,
  })
  assert(r.cardFeeAmount === 0, "no card fee")
  assert(r.clinicNetAmount === 30, "clinic")
  assert(r.professionalNetAmount === 70, "professional")
}

console.log("split tests ok")
