import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { CalculationResult } from './calculator'

export interface InvoiceDetails {
  issueDate: string
  payerName: string
  payerIdCardNumber: string
  sellerName: string
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
    styles: { fontSize: 8 },
    headStyles: { fillColor: [47, 85, 151] },
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

export function exportCustomerInvoiceToPDF(
  calc: CalculationResult,
  itemCategory: string,
  itemDescription: string,
  invoiceDetails: InvoiceDetails
) {
  const filePrefix = itemCategory.replaceAll(' ', '_')
  const customerDoc = new jsPDF({ orientation: 'portrait', format: 'a5' })
  const pageWidth = customerDoc.internal.pageSize.getWidth()
  const pageHeight = customerDoc.internal.pageSize.getHeight()

  customerDoc.setFontSize(12)
  customerDoc.text('CUSTOMER PAYMENT SCHEDULE / INVOICE', pageWidth / 2, 18, {
    align: 'center',
  })

  customerDoc.setFontSize(8)
  customerDoc.text(
    `Invoice Issue Date: ${invoiceDetails.issueDate || '-'}`,
    14,
    28
  )
  customerDoc.text(`Description: ${itemCategory} - ${itemDescription}`, 14, 35)

  customerDoc.setDrawColor(180, 180, 180)
  customerDoc.line(14, 41, pageWidth - 14, 41)
  customerDoc.text(`Full Price: $${calc.fullPrice.toFixed(2)}`, 14, 49)
  customerDoc.text(`Total Months: ${calc.totalMonths}`, 80, 49)
  customerDoc.text(`Down Payment: $${calc.downPayment.toFixed(2)}`, 14, 56)
  customerDoc.text(
    `Remain Payment: $${calc.financedPrincipal.toFixed(2)}`,
    80,
    56
  )

  const customerTableData = calc.customerSchedule.map((row) => [
    row.month,
    row.paymentDate,
    `$${row.startingBalance.toFixed(2)}`,
    `$${row.totalMonthlyPayment.toFixed(2)}`,
  ])

  ;(customerDoc as any).autoTable({
    startY: 64,
    head: [
      ['Month', 'Payment Date', 'Starting Balance', 'Total Monthly Payment'],
    ],
    body: customerTableData,
    theme: 'grid',
    styles: { fontSize: 6.5, cellPadding: 1.5 },
    headStyles: { fillColor: [47, 85, 151] },
  })

  const tableEndY = (customerDoc as any).lastAutoTable.finalY
  const footerTop = Math.min(tableEndY + 14, pageHeight - 58)
  const columnGap = 12
  const columnWidth = (pageWidth - 28 - columnGap) / 2
  const rightColumnX = 14 + columnWidth + columnGap

  customerDoc.setFontSize(8)
  customerDoc.setFont('helvetica', 'bold')
  customerDoc.text('INSTALLMENT PAYER', 14, footerTop)
  // customerDoc.text('SELLER', rightColumnX, footerTop)
  customerDoc.setFont('helvetica', 'normal')
  customerDoc.text(
    `Name Payer: ${invoiceDetails.payerName || '-'}`,
    14,
    footerTop + 8
  )
  customerDoc.text(
    `ID Number: ${invoiceDetails.payerIdCardNumber || '-'}`,
    rightColumnX,
    footerTop + 8
  )

  customerDoc.setFont('helvetica', 'bold')
  customerDoc.setFontSize(7)
  customerDoc.text("Installment payer's fingerprint", 14, footerTop + 15)
  customerDoc.text("Seller's fingerprint", rightColumnX, footerTop + 15)
  customerDoc.setFont('helvetica', 'normal')
  customerDoc.rect(14, footerTop + 19, columnWidth, 22)
  customerDoc.rect(rightColumnX, footerTop + 19, columnWidth, 22)

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
    styles: { fontSize: 6.5, cellPadding: 1.5 },
    headStyles: { fillColor: [47, 85, 151] },
  })

  customerDoc.save(`${filePrefix}_Customer_Schedule.pdf`)
}
