import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'معرض نقل الخدمات - الاسناد السريع للاستقدام',
  description: 'اختر من بين مجموعة واسعة من السير الذاتية المتخصصة في نقل الخدمات',
  keywords: 'نقل خدمات، سائقين، توصيل، الاسناد السريع، استقدام، عمالة منزلية',
}

export default function TransferServicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
