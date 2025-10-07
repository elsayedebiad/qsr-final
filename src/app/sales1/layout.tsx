import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الإسناد السريع",
  description: "عرض وتصفح السير الذاتية المتاحة للتوظيف",
};

export default function Sales1Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}