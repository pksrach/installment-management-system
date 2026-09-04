export interface InstallmentRow {
  month: number | string
  paymentDate: string
  startingBalance: number
  totalPayment: number
  principalPaid: number
  interestPaid: number
  totalMonthCost: number
  endingBalance: number
}

export interface CalculationResult {
  fullPrice: number
  downPayment: number
  financedPrincipal: number
  monthlyInterestRate: number
  totalMonths: number
  exactPmt: number
  roundedPmt: number
  totalInstallmentsPaid: number
  totalInterestAccrued: number
  grandTotalPaid: number
  mainSchedule: InstallmentRow[]
  customerSchedule: Array<{
    month: string
    paymentDate: string
    startingBalance: number
    totalMonthlyPayment: number
  }>
}

function addMonths(dateString: string, months: number): string {
  const [year, month, day] = dateString.split('-').map(Number)
  const target = new Date(year, month - 1 + months, 1)
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0
  ).getDate()
  const result = new Date(
    target.getFullYear(),
    target.getMonth(),
    Math.min(day, lastDay)
  )

  return [
    result.getFullYear(),
    String(result.getMonth() + 1).padStart(2, '0'),
    String(result.getDate()).padStart(2, '0'),
  ].join('-')
}

export function calculateInstallments(
  fullPrice: number,
  downPayment: number,
  monthlyInterestRate: number,
  totalMonths: number,
  customMonthlyPayment?: number,
  paymentStartDate?: string
): CalculationResult {
  const financedPrincipal = fullPrice - downPayment
  const rate = monthlyInterestRate

  // Amortized Payment Formula: PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
  const exactPmt =
    rate > 0
      ? (financedPrincipal * (rate * Math.pow(1 + rate, totalMonths))) /
        (Math.pow(1 + rate, totalMonths) - 1)
      : financedPrincipal / totalMonths

  // Round UP PMT to whole dollar (e.g. $142.46 -> $143.00)
  const roundedPmt = customMonthlyPayment || Math.ceil(exactPmt)

  let currentBalance = financedPrincipal
  const mainSchedule: InstallmentRow[] = []

  // Month 0 (Upfront)
  mainSchedule.push({
    paymentDate: paymentStartDate || '',
    month: 'Upfront',
    startingBalance: fullPrice,
    totalPayment: downPayment,
    principalPaid: downPayment,
    interestPaid: 0,
    totalMonthCost: downPayment,
    endingBalance: financedPrincipal,
  })

  let totalInterest = 0
  let totalInstallments = 0

  for (let m = 1; m <= totalMonths; m++) {
    if (currentBalance <= 0) break

    const startingBal = currentBalance
    const interestPaid = Math.round(startingBal * rate * 100) / 100

    let totalPay = roundedPmt
    let principalPaid = Math.round((totalPay - interestPaid) * 100) / 100

    if (m === totalMonths || principalPaid >= startingBal) {
      // Final Payoff Adjustment so ending balance hits $0.00 cleanly
      principalPaid = startingBal
      totalPay = Math.round((principalPaid + interestPaid) * 100) / 100
    }

    const endingBal = Math.max(
      0,
      Math.round((startingBal - principalPaid) * 100) / 100
    )

    totalInterest += interestPaid
    totalInstallments += totalPay

    mainSchedule.push({
      paymentDate: paymentStartDate ? addMonths(paymentStartDate, m) : '',
      month: m,
      startingBalance: startingBal,
      totalPayment: totalPay,
      principalPaid: principalPaid,
      interestPaid: interestPaid,
      totalMonthCost: Math.round((principalPaid + interestPaid) * 100) / 100,
      endingBalance: endingBal,
    })

    currentBalance = endingBal
  }

  // Simplified Customer Table (Matching Table 2 in Excel: Month, Starting Balance, Total Monthly Payment)
  const customerSchedule = mainSchedule.map((row) => ({
    month: typeof row.month === 'number' ? `Month ${row.month}` : row.month,
    paymentDate: row.paymentDate,
    startingBalance: row.startingBalance,
    totalMonthlyPayment: row.totalPayment,
  }))

  return {
    fullPrice,
    downPayment,
    financedPrincipal,
    monthlyInterestRate,
    totalMonths,
    exactPmt,
    roundedPmt,
    totalInstallmentsPaid: totalInstallments,
    totalInterestAccrued: totalInterest,
    grandTotalPaid: downPayment + totalInstallments,
    mainSchedule,
    customerSchedule,
  }
}
