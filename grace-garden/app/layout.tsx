import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title:'은혜의 정원 · 2026 특별새벽부흥회',description:'뜻을 정하고, 은혜를 입다. 수지 함께하는 교회 특별새벽부흥회 은혜 나눔.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ko"><body>{children}</body></html>}
