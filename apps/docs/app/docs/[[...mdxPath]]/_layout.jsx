"use client"
import { Layout } from 'nextra-theme-docs'

const LayoutCSR = ({ banner, navbar, pagemap, footer, docsRepositoryBase, children }) => {
    return <Layout
        banner={banner}
        navbar={navbar}
        pageMap={pagemap}
        docsRepositoryBase={docsRepositoryBase}
        footer={footer}
    >
        {children}
    </Layout >
}

export default LayoutCSR