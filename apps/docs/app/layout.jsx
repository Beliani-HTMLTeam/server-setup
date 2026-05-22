import { Head } from 'nextra/components'
import 'nextra-theme-docs/style.css'
import '../styles/main.css'

export const metadata = {
    title: "dokjumentas",
    description: "documentation"
}

export default function RootLayout({ children }) {
    return (
        <html lang="en" dir="ltr" suppressHydrationWarning>
            <Head />
            <body className="body">{children}</body>
        </html>
    )
}
