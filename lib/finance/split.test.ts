import { calculateSplit } from "./split"

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

function assertSum100(
  clinic: number,
  professional: number,
  card: number,
  msg: string,
) {
  assert(
    Math.round((clinic + professional + card) * 100) / 100 === 100,
    `${msg}: ${clinic}+${professional}+${card}`,
  )
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
  assert(r.professionalNetAmount === 60, `prof net got ${r.professionalNetAmount}`)
  assertSum100(r.clinicNetAmount, r.professionalNetAmount, r.cardFeeAmount, "case1")
}

// COM taxa na base, RATEIA
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
  assert(r.professionalNetAmount === 66, `prof final got ${r.professionalNetAmount}`)
  assertSum100(r.clinicNetAmount, r.professionalNetAmount, r.cardFeeAmount, "case2")
}

// SEM taxa na base, RATEIA
{
  const r = calculateSplit({
    grossAmount: 100,
    clinicPercent: 30,
    cardFeePercent: 10,
    paymentMethod: "credito",
    clinicBaseMode: "without_fee",
    clinicSharesCardFee: true,
  })
  assert(r.clinicNetAmount === 27, "clinic shares fee")
  assert(r.professionalNetAmount === 63, `prof got ${r.professionalNetAmount}`)
  assertSum100(r.clinicNetAmount, r.professionalNetAmount, r.cardFeeAmount, "case3")
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
  assertSum100(r.clinicNetAmount, r.professionalNetAmount, r.cardFeeAmount, "pix")
}

console.log("split tests ok")
