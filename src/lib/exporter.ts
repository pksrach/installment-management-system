import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { CalculationResult } from './calculator'
import { AlignCenter } from 'lucide-react'

export interface ReceiptDetails {
  issueDate: string
  payerName: string
  payerIdCardNumber: string
  sellerName: string
}

async function loadLogoDataUrl() {
  const response = await fetch('/rt-phone-house-logo.svg')
  if (!response.ok) throw new Error('Unable to load seller logo')

  const svg = await response.text()
  const image = new Image()
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  await image.decode()

  const canvas = document.createElement('canvas')
  canvas.width = 220
  canvas.height = 220
  canvas.getContext('2d')?.drawImage(image, 0, 0)
  return canvas.toDataURL('image/png')
}

export function exportToExcel(
  calc: CalculationResult,
  itemCategory: string,
  itemDescription: string
) {
  const wb = XLSX.utils.book_new()

  // 1. Store Main Amortization Table
  const storeData = [
    ['Item Category', itemCategory],
    ['Item Description', itemDescription],
    ['Full Price', calc.fullPrice],
    ['Down Payment', calc.downPayment],
    ['Financed Principal', calc.financedPrincipal],
    ['Monthly Rate', `${(calc.monthlyInterestRate * 100).toFixed(2)}%`],
    ['Total Months', calc.totalMonths],
    ['Rounded Payment', calc.roundedPmt],
    [],
    ['1. FULL STORE AMORTIZATION SCHEDULE (INTERNAL ACCOUNTING)'],
    [
      'Month',
      'Payment Date',
      'Starting Balance ($)',
      'Total Payment ($)',
      'Principal Paid ($)',
      'Interest Paid ($)',
      'Total Cost ($)',
      'Ending Balance ($)',
    ],
    ...calc.mainSchedule.map((row) => [
      row.month,
      row.paymentDate,
      row.startingBalance,
      row.totalPayment,
      row.principalPaid,
      row.interestPaid,
      row.totalMonthCost,
      row.endingBalance,
    ]),
    [],
    [
      'Total',
      '',
      '',
      calc.totalInstallmentsPaid,
      calc.financedPrincipal,
      calc.totalInterestAccrued,
      calc.grandTotalPaid,
      0,
    ],
  ]

  const wsStore = XLSX.utils.aoa_to_sheet(storeData)
  XLSX.utils.book_append_sheet(wb, wsStore, 'Store Accounting')

  // 2. Customer Receipt Schedule Table (Month, Starting Balance, Total Monthly Payment)
  const customerData = [
    ['CUSTOMER INSTALLMENT RECEIPT / QUOTATION'],
    ['Item', `${itemCategory} - ${itemDescription}`],
    ['Full Price', `$${calc.fullPrice.toFixed(2)}`],
    ['Down Payment', `$${calc.downPayment.toFixed(2)}`],
    [],
    ['2. CUSTOMER PAYMENT SCHEDULE'],
    [
      'Month',
      'Payment Date',
      'Starting Balance ($)',
      'Total Monthly Payment ($)',
    ],
    ...calc.customerSchedule.map((row) => [
      row.month,
      row.paymentDate,
      row.startingBalance,
      row.totalMonthlyPayment,
    ]),
  ]

  const wsCustomer = XLSX.utils.aoa_to_sheet(customerData)
  XLSX.utils.book_append_sheet(wb, wsCustomer, 'Customer Schedule')

  XLSX.writeFile(
    wb,
    `${itemCategory.replaceAll(' ', '_')}_Installment_Plan.xlsx`
  )
}

export function exportInternalAccountingToPDF(
  calc: CalculationResult,
  itemCategory: string,
  itemDescription: string
) {
  const filePrefix = itemCategory.replaceAll(' ', '_')
  const internalDoc = new jsPDF({ orientation: 'landscape' })

  internalDoc.setFontSize(16)
  internalDoc.text('INTERNAL ACCOUNTING SCHEDULE', 14, 18)

  internalDoc.setFontSize(10)
  internalDoc.text(`Item Category: ${itemCategory}`, 14, 26)
  internalDoc.text(`Description: ${itemDescription}`, 14, 32)
  internalDoc.text(`Full Price: $${calc.fullPrice.toFixed(2)}`, 14, 40)
  internalDoc.text(`Down Payment: $${calc.downPayment.toFixed(2)}`, 14, 46)
  internalDoc.text(
    `Interest Rate: ${(calc.monthlyInterestRate * 100).toFixed(2)}% / month`,
    14,
    52
  )
  internalDoc.text(`Total Months: ${calc.totalMonths}`, 14, 58)
  internalDoc.text(`Rounded Payment: $${calc.roundedPmt.toFixed(2)}`, 14, 64)
  internalDoc.text(
    `Financed Amount: $${calc.financedPrincipal.toFixed(2)}`,
    150,
    40
  )
  internalDoc.text(`Monthly Payment: $${calc.roundedPmt.toFixed(2)}`, 150, 46)
  internalDoc.text(
    `Total Interest Earned: $${calc.totalInterestAccrued.toFixed(2)}`,
    150,
    52
  )

  const internalTableData = calc.mainSchedule.map((row) => [
    row.month,
    row.paymentDate,
    `$${row.startingBalance.toFixed(2)}`,
    `$${row.totalPayment.toFixed(2)}`,
    `$${row.principalPaid.toFixed(2)}`,
    `$${row.interestPaid.toFixed(2)}`,
    `$${row.totalMonthCost.toFixed(2)}`,
    `$${row.endingBalance.toFixed(2)}`,
  ])
  internalTableData.push([
    'Total',
    '',
    '',
    `$${calc.grandTotalPaid.toFixed(2)}`,
    `$${calc.fullPrice.toFixed(2)}`,
    `$${calc.totalInterestAccrued.toFixed(2)}`,
    `$${calc.grandTotalPaid.toFixed(2)}`,
    '$0.00',
  ])

  ;(internalDoc as any).autoTable({
    startY: 72,
    head: [
      [
        'Month',
        'Payment Date',
        'Starting Balance',
        'Total Payment',
        'Principal Paid',
        'Interest',
        'Total Cost',
        'Ending Balance',
      ],
    ],
    body: internalTableData,
    theme: 'grid',
    styles: { fontSize: 8, halign: 'center', valign: 'middle' },
    headStyles: {
      fillColor: [47, 85, 151],
      halign: 'center',
      valign: 'middle',
    },
    didParseCell: (data: {
      section: string
      row: { index: number }
      cell: { styles: { fontStyle: string } }
    }) => {
      if (
        data.section === 'body' &&
        data.row.index === internalTableData.length - 1
      ) {
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })

  internalDoc.save(`${filePrefix}_Internal_Accounting.pdf`)
}

export async function exportCustomerInvoiceToPDF(
  calc: CalculationResult,
  itemCategory: string,
  itemDescription: string,
  receiptDetails: ReceiptDetails
) {
  const filePrefix = itemCategory.replaceAll(' ', '_')
  const customerDoc = new jsPDF({ orientation: 'portrait', format: 'a5' })
  const pageWidth = customerDoc.internal.pageSize.getWidth()
  const pageHeight = customerDoc.internal.pageSize.getHeight()

  let logoDataUrl: string | undefined
  try {
    logoDataUrl = await loadLogoDataUrl()
  } catch {
    // Keep the receipt export usable if the public asset cannot be loaded.
  }

  if (logoDataUrl) {
    customerDoc.addImage(logoDataUrl, 'PNG', (pageWidth - 22) / 2, 6, 22, 22)
  }
  customerDoc.setFont('helvetica', 'bold')
  customerDoc.setFontSize(13)
  customerDoc.setTextColor(120, 78, 18)
  customerDoc.text('RT PHONE HOUSE', pageWidth / 2, 34, { align: 'center' })
  customerDoc.setFont('helvetica', 'normal')
  customerDoc.setFontSize(7)
  customerDoc.setTextColor(70, 70, 70)
  customerDoc.text(
    `Address: Borey Piphup Thmey 1, St 15, Home No. 241, Chomkar Daung, Phnom Penh`,
    pageWidth / 2,
    39,
    { align: 'center' }
  )
  customerDoc.text(`Phone Number: 069 30 6267`, pageWidth / 2, 43, {
    align: 'center',
  })

  customerDoc.setTextColor(0, 0, 0)
  customerDoc.setFont('helvetica', 'bold')
  customerDoc.setFontSize(10)
  customerDoc.text('PAYMENT RECEIPT INSTALLMENT', pageWidth / 2, 52, {
    align: 'center',
  })

  customerDoc.setFont('helvetica', 'normal')
  customerDoc.setFontSize(8)
  customerDoc.text(`Issue Date: ${receiptDetails.issueDate || '-'}`, 14, 59)
  customerDoc.text(`Description: ${itemCategory} - ${itemDescription}`, 14, 66)

  customerDoc.setDrawColor(180, 180, 180)
  customerDoc.line(14, 72, pageWidth - 14, 72)
  customerDoc.text(`Full Price: $${calc.fullPrice.toFixed(2)}`, 14, 80)
  customerDoc.text(`Total Months: ${calc.totalMonths}`, 80, 80)
  customerDoc.text(`Down Payment: $${calc.downPayment.toFixed(2)}`, 14, 87)
  customerDoc.text(
    `Remain Payment: $${calc.financedPrincipal.toFixed(2)}`,
    80,
    87
  )

  const customerTableData = calc.customerSchedule.map((row) => [
    row.month,
    row.paymentDate,
    `$${row.startingBalance.toFixed(2)}`,
    `$${row.totalMonthlyPayment.toFixed(2)}`,
  ])

  const tableStartY = 90
  const tableRowCount = customerTableData.length + 1
  const footerBottomMargin = 8
  const footerHeight = 45
  const maximumFooterTop = pageHeight - footerHeight - footerBottomMargin
  const availableTableHeight = maximumFooterTop - tableStartY - 2
  const rowHeight = availableTableHeight / tableRowCount
  const compactTable = tableRowCount > 12
  const tableFontSize = compactTable ? 6.5 : 8
  const tableCellPadding = compactTable ? 0.25 : 0.5

  ;(customerDoc as any).autoTable({
    startY: tableStartY,
    head: [
      ['Month', 'Payment Date', 'Starting Balance', 'Total Monthly Payment'],
    ],
    body: customerTableData,
    theme: 'grid',
    pageBreak: 'avoid',
    styles: {
      fontSize: tableFontSize,
      cellPadding: tableCellPadding,
      minCellHeight: rowHeight,
      halign: 'center',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [47, 85, 151],
      fontSize: tableFontSize,
      cellPadding: tableCellPadding,
      minCellHeight: rowHeight,
      halign: 'center',
      valign: 'middle',
    },
  })

  const tableEndY = (customerDoc as any).lastAutoTable.finalY
  const footerTop = Math.min(maximumFooterTop, tableEndY + 4)
  const columnGap = 12
  const columnWidth = (pageWidth - 28 - columnGap) / 2
  const rightColumnX = 14 + columnWidth + columnGap

  customerDoc.setFontSize(8)
  customerDoc.setFont('helvetica', 'bold')
  customerDoc.text('INSTALLMENT PAYER', 14, footerTop + 8)
  // customerDoc.text('SELLER', rightColumnX, footerTop)
  customerDoc.setFont('helvetica', 'normal')
  customerDoc.text(
    `Payer Name: ${receiptDetails.payerName || '-'}`,
    14,
    footerTop + 15
  )
  customerDoc.text(
    `ID/Passport Number: ${receiptDetails.payerIdCardNumber || '-'}`,
    rightColumnX,
    footerTop + 15
  )
  // customerDoc.text(
  //   `Name: ${receiptDetails.sellerName || 'RT Phone House'}`,
  //   rightColumnX,
  //   footerTop + 16
  // )

  customerDoc.setFont('helvetica', 'bold')
  customerDoc.setFontSize(7)
  customerDoc.text("Installment payer's fingerprint", 14, footerTop + 23)
  customerDoc.text("Seller's fingerprint", rightColumnX, footerTop + 23)
  customerDoc.setFont('helvetica', 'normal')
  customerDoc.rect(14, footerTop + 27, columnWidth, 18)
  customerDoc.rect(rightColumnX, footerTop + 27, columnWidth, 18)

  customerDoc.save(`${filePrefix}_Customer_Receipt.pdf`)
}

export function exportCustomerScheduleToPDF(
  calc: CalculationResult,
  itemCategory: string,
  itemDescription: string
) {
  const filePrefix = itemCategory.replaceAll(' ', '_')
  const customerDoc = new jsPDF({ orientation: 'portrait', format: 'a5' })
  const pageWidth = customerDoc.internal.pageSize.getWidth()

  customerDoc.setFontSize(13)
  customerDoc.text('CUSTOMER PAYMENT SCHEDULE', pageWidth / 2, 18, {
    align: 'center',
  })
  customerDoc.setFontSize(8)
  customerDoc.text(`Description: ${itemCategory} - ${itemDescription}`, 14, 28)

  const customerTableData = calc.customerSchedule.map((row) => [
    row.month,
    row.paymentDate,
    `$${row.startingBalance.toFixed(2)}`,
    `$${row.totalMonthlyPayment.toFixed(2)}`,
  ])

  ;(customerDoc as any).autoTable({
    startY: 36,
    head: [
      ['Month', 'Payment Date', 'Starting Balance', 'Total Monthly Payment'],
    ],
    body: customerTableData,
    theme: 'grid',
    styles: {
      fontSize: 6.5,
      cellPadding: 1.5,
      halign: 'center',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [47, 85, 151],
      halign: 'center',
      valign: 'middle',
    },
  })

  customerDoc.save(`${filePrefix}_Customer_Schedule.pdf`)
}
