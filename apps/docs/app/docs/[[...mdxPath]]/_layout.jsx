"use client"
import { Layout } from 'nextra-theme-docs'
import { usePathname } from 'next/navigation';

const LayoutCSR = ({ banner, navbar, pagemap, footer, docsRepositoryBase, children }) => {
    return <Layout
        banner={banner}
        navbar={navbar}
        pageMap={pagemap}
        docsRepositoryBase={docsRepositoryBase}
        footer={footer}
        editLink={
            <a href={`${docsRepositoryBase}/content/edit/main${usePathname().replace("docs/", "")}.mdx`} target="_blank" rel="noopener noreferrer">
                Edit this page
            </a>
        }
    >
        {children}
    </Layout >
}

export default LayoutCSR