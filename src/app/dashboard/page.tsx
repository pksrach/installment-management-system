'use client'

import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { calculateInstallments, CalculationResult } from '@/lib/calculator'
import { exportToExcel, exportToPDF } from '@/lib/exporter'
import {
  Smartphone,
  Laptop,
  Monitor,
  Bike,
  ShoppingBag,
  Download,
  FileSpreadsheet,
  FileText,
  LogOut,
  Calculator,
  RefreshCw,
} from 'lucide-react'

export default function DashboardPage() {
  const { data: session } = useSession()

  // Inputs
  const [itemCategory, setItemCategory] = useState<string>('Phone')
  const [customCategory, setCustomCategory] = useState<string>('')
  const [itemDescription, setItemDescription] = useState<string>(
    'iPhone 17 Pro Max 512GB (LL/A)'
  )
  const [fullPrice, setFullPrice] = useState<number>(1500)
  const [downPayment, setDownPayment] = useState<number>(500)
  const [monthlyInterestRate, setMonthlyInterestRate] = useState<number>(3) // 3%
  const [totalMonths, setTotalMonths] = useState<number>(8)
  const [customMonthlyPayment, setCustomMonthlyPayment] = useState<string>('')
  const [paymentStartDate, setPaymentStartDate] = useState<string>('')

  const activeCategory =
    itemCategory === 'Other' ? customCategory || 'General Item' : itemCategory

  // Calculation state
  const calculation: CalculationResult = calculateInstallments(
    fullPrice,
    downPayment,
    monthlyInterestRate / 100,
    totalMonths,
    customMonthlyPayment ? parseFloat(customMonthlyPayment) : undefined,
    paymentStartDate
  )

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      {/* Header Bar */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 pb-8 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calculator className="text-blue-500 w-7 h-7" />
            Installment Payment System
          </h1>
          <p className="text-slate-400 text-sm">
            Calculate, track, and export phone & electronic device financing
            schedules.
          </p>
        </div>

        <div className="flex items-center space-x-4 bg-slate-800 p-2 px-4 rounded-xl border border-slate-700">
          <img
            src={
              session?.user?.image ||
              'https://api.dicebear.com/7.x/bottts/svg?seed=user'
            }
            alt="Profile"
            className="w-9 h-9 rounded-full border border-blue-500"
          />
          <div className="text-xs">
            <p className="font-semibold text-white">
              {session?.user?.name || 'Store Admin'}
            </p>
            <p className="text-slate-400">{session?.user?.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-slate-400 hover:text-red-400 p-2 transition"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Left Column: Input Panel */}
        <div className="lg:col-span-4 bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-5 h-fit shadow-xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-700 pb-3">
            <span>Installment Parameters</span>
          </h2>

          {/* Item Category Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              Item Category ("Installment pay for what?")
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Phone', label: 'Phone', icon: Smartphone },
                { id: 'Laptop', label: 'Laptop', icon: Laptop },
                { id: 'Computer', label: 'Computer', icon: Monitor },
                { id: 'Motorbike', label: 'Motorbike', icon: Bike },
                { id: 'Other', label: 'Other', icon: ShoppingBag },
              ].map((cat) => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.id}
                    onClick={() => setItemCategory(cat.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition ${
                      itemCategory === cat.id
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                        : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span>{cat.label}</span>
                  </button>
                )
              })}
            </div>
            {itemCategory === 'Other' && (
              <input
                type="text"
                placeholder="Enter custom category..."
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-blue-500 mt-2"
              />
            )}
          </div>

          {/* Item Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              Item Description / Model
            </label>
            <input
              type="text"
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Full Price & Down Payment */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Full Price ($)
              </label>
              <input
                type="number"
                value={fullPrice}
                onChange={(e) => setFullPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Down Payment ($)
              </label>
              <input
                type="number"
                value={downPayment}
                onChange={(e) =>
                  setDownPayment(parseFloat(e.target.value) || 0)
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              First Payment Date (Optional)
            </label>
            <input
              type="date"
              value={paymentStartDate}
              onChange={(e) => setPaymentStartDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Interest Rate & Total Months */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Interest Rate (% / Mo)
              </label>
              <input
                type="number"
                step="0.1"
                value={monthlyInterestRate}
                onChange={(e) =>
                  setMonthlyInterestRate(parseFloat(e.target.value) || 0)
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Total Months
              </label>
              <input
                type="number"
                value={totalMonths}
                onChange={(e) => setTotalMonths(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Custom Rounded Override */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              Optional Rounded PMT Override ($)
            </label>
            <input
              type="number"
              placeholder={`Auto-calculated: $${calculation.roundedPmt}`}
              value={customMonthlyPayment}
              onChange={(e) => setCustomMonthlyPayment(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
            />
            <p className="text-[10px] text-slate-500">
              Defaults to whole-dollar roundup (e.g. $143/mo for $142.46).
            </p>
          </div>

          {/* Quick Stats Box */}
          <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Financed Amount:</span>
              <span className="font-bold text-blue-400">
                ${calculation.financedPrincipal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Monthly Payment:</span>
              <span className="font-bold text-amber-400">
                ${calculation.roundedPmt.toFixed(2)} / mo
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Interest Earned:</span>
              <span className="font-bold text-emerald-400">
                +${calculation.totalInterestAccrued.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() =>
                exportToExcel(calculation, activeCategory, itemDescription)
              }
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium p-3 rounded-xl transition shadow-lg text-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export to Excel (.XLSX)</span>
            </button>

            <button
              onClick={() =>
                exportToPDF(calculation, activeCategory, itemDescription)
              }
              className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-medium p-3 rounded-xl transition shadow-lg text-sm"
            >
              <FileText className="w-4 h-4" />
              <span>Export Customer PDF Receipt</span>
            </button>
          </div>
        </div>

        {/* Right Column: Calculations & Tables */}
        <div className="lg:col-span-8 space-y-8">
          {/* Table 1: Internal Store Accounting Table */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">
                  1. Full Store Amortization Schedule (Internal Accounting)
                </h2>
                <p className="text-xs text-slate-400">
                  Includes principal breakdown, {monthlyInterestRate}% interest
                  profit, and ending balances.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full">
                Internal
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-200 border-b border-slate-700 font-semibold">
                  <tr>
                    <th className="p-3">Month</th>
                    <th className="p-3">Payment Date</th>
                    <th className="p-3">Starting Balance</th>
                    <th className="p-3">Total Payment</th>
                    <th className="p-3">Principal Paid</th>
                    <th className="p-3">Interest ({monthlyInterestRate}%)</th>
                    <th className="p-3">Ending Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {calculation.mainSchedule.map((row, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 1 ? 'bg-slate-900/30' : ''}
                    >
                      <td className="p-3 font-semibold text-white">
                        {row.month}
                      </td>
                      <td className="p-3">{row.paymentDate}</td>
                      <td className="p-3">${row.startingBalance.toFixed(2)}</td>
                      <td className="p-3 text-amber-400 font-bold">
                        ${row.totalPayment.toFixed(2)}
                      </td>
                      <td className="p-3">${row.principalPaid.toFixed(2)}</td>
                      <td className="p-3 text-emerald-400">
                        ${row.interestPaid.toFixed(2)}
                      </td>
                      <td className="p-3 text-white font-medium">
                        ${row.endingBalance.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-900 font-bold text-white border-t-2 border-slate-700">
                    <td className="p-3">Total</td>
                    <td className="p-3">-</td>
                    <td className="p-3">-</td>
                    <td className="p-3 text-amber-400">
                      ${calculation.grandTotalPaid.toFixed(2)}
                    </td>
                    <td className="p-3">${calculation.fullPrice.toFixed(2)}</td>
                    <td className="p-3 text-emerald-400">
                      ${calculation.totalInterestAccrued.toFixed(2)}
                    </td>
                    <td className="p-3">$0.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Simplified Customer Schedule Table (Requested explicitly below main) */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">
                  2. Customer Payment Schedule (Simplified for Customer)
                </h2>
                <p className="text-xs text-slate-400">
                  Shows ONLY Month, Starting Balance, and Total Monthly Payment
                  for customer receipts/quotes.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                Customer View
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-200 border-b border-slate-700 font-semibold">
                  <tr>
                    <th className="p-3">Month</th>
                    <th className="p-3">Payment Date</th>
                    <th className="p-3">Starting Balance</th>
                    <th className="p-3">Total Monthly Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {calculation.customerSchedule.map((row, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 1 ? 'bg-slate-900/30' : ''}
                    >
                      <td className="p-3 font-semibold text-white">
                        {row.month}
                      </td>
                      <td className="p-3">{row.paymentDate}</td>
                      <td className="p-3 text-slate-300">
                        ${row.startingBalance.toFixed(2)}
                      </td>
                      <td className="p-3 text-emerald-400 font-bold text-sm">
                        ${row.totalMonthlyPayment.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-900 font-bold text-white border-t-2 border-slate-700">
                    <td className="p-3">Total Paid by Customer</td>
                    <td className="p-3">-</td>
                    <td className="p-3">-</td>
                    <td className="p-3 text-emerald-400 text-base">
                      ${calculation.grandTotalPaid.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
