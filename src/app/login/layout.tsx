/**
 * Layout especial para página de login
 * Sin Header ni Sidebar
 */
export default function LoginLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
