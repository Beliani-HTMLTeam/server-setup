import { Head } from 'nextra/components'
import 'nextra-theme-docs/style.css'
import '../styles/main.css'

export const metadata = {
    title: "Auth Wall - HTML Team Docs",
    description: "Documentation for all HTML Team projects.",
}

export default function RootLayout({ children }) {
    return (
        <html lang="en" dir="ltr" suppressHydrationWarning>
            <Head />
            <body className="body">{children}</body>
        </html>
    )
}
