import { auth } from "../app/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import styles from "./page.module.scss";
import { GitHubLoginButton } from "../components/GitHubLoginButton";
import { GitHubLogoutButton } from "../components/GitHubLogoutButton";

import { isValidUser } from "./lib/isValidUser";

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const email = session?.user?.email ?? "";

  const canAccess = isValidUser(email);

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginMain}>
        <h1>
          {canAccess ? (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <img
                src={session?.user?.image}
                width="32"
                height="32"
                style={{ borderRadius: "50%" }}
                alt="Favicon"
              />
              Welcome, {session?.user?.name?.split(" ")[0] ?? "there"}!
            </div>
          ) : (
            "Welcome to the Documentation"
          )}
        </h1>

        {canAccess && (
          <p>
            You have access to the documentation. Feel free to explore and find
            <br />
            the information you need.
          </p>
        )}

        {!canAccess && (
          <p>
            In order to access the documentation, please log in with your GitHub
            <br />
            account. If you don&apos;t have access, please contact the
            administrator.
          </p>
        )}

        {canAccess && session ? (
          <div className={styles.actionRow}>
            <Link href="/docs" className={styles.docsLink}>
              Go to docs
            </Link>
            <GitHubLogoutButton />
          </div>
        ) : (
          <GitHubLoginButton />
        )}
        {/* {session && <pre>{JSON.stringify(session, null, 2)}</pre>} */}
      </div>
    </div>
  );
}
