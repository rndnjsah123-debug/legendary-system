import "./globals.css";

export const metadata = {
  title: "2026년 하반기 교리학교",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
