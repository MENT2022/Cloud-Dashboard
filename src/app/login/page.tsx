// This page is not currently in active use as Firebase Authentication has been removed.
// It is kept as a placeholder. If login functionality is re-enabled, this page can be updated.
// generateStaticParams is added to attempt to resolve a Next.js build issue.

export async function generateStaticParams() {
  // This page has no dynamic segments, so return an empty array.
  return [];
}

export default function LoginPage() {
  return (
    <div style={{ padding: '20px', textAlign: 'center', minHeight: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <h1>Login Page Not Active</h1>
      <p>User authentication is currently disabled in this application.</p>
      <p>Access to features is typically managed via MQTT connection status.</p>
      <p>If you expected a login prompt, please contact the administrator or check application settings.</p>
    </div>
  );
}
