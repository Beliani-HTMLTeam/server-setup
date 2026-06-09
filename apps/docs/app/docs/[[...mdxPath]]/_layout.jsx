"use client";
import { Layout } from "nextra-theme-docs";
import { usePathname } from "next/navigation";

const LayoutCSR = ({
  banner,
  navbar,
  pagemap,
  footer,
  docsRepositoryBase,
  children,
}) => {
  return (
    <Layout
      banner={banner}
      navbar={navbar}
      pageMap={pagemap}
      docsRepositoryBase={docsRepositoryBase}
      footer={footer}
      editLink={
        <a
          href={`${docsRepositoryBase}/content/edit/main${usePathname().replace("docs/", "")}.mdx`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Edit this page
        </a>
      }
      feedback={{
        content: (
          <a
            href={`https://github.com/Beliani-HTMLTeam/server-setup/issues/new?title=<few words of the problem> in ${usePathname().replace("docs/", "")}&body=Describe the issue you found in ${usePathname().replace("docs/", "")} here.`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Report an issue
          </a>
        ),
      }}
    >
      {children}
    </Layout>
  );
};

export default LayoutCSR;
