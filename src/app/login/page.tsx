/**
 * Página de Login Corporativo
 * Solo permite cuentas @transperuana.com.pe
 */
import { signIn, auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function LoginPage(props: {
    searchParams: Promise<{ error?: string; callbackUrl?: string }>
}) {
    const session = await auth()
    if (session) {
        redirect("/")
    }

    const searchParams = await props.searchParams
    const error = searchParams.error

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-md w-full mx-4">
                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
                    {/* Logo */}
                    <div className="text-center">
                        <div className="w-16 h-16 bg-[#CD3529] rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                            <svg viewBox="0 0 40 40" className="w-10 h-10">
                                <g fill="white">
                                    <path d="M20 5C15 5 11 10 11 15C11 18 12 20 14 22C10 22 5 24 5 30C5 32 8 34 12 34C16 34 19 31 20 28C21 31 24 34 28 34C32 34 35 32 35 30C35 24 30 22 26 22C28 20 29 18 29 15C29 10 25 5 20 5Z" opacity="0.95" />
                                </g>
                            </svg>
                        </div>
                        <div className="flex items-center justify-center gap-0.5 mb-2">
                            <span className="text-2xl font-bold text-gray-700">Trans</span>
                            <span className="text-2xl font-bold text-[#CD3529]">peruana</span>
                        </div>
                        <h1 className="text-xl font-semibold text-gray-900">Portal de Monitoreo ETL</h1>
                        <p className="text-sm text-gray-500 mt-1">Sistema de Renovaciones SCTR / VIDA LEY</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="text-sm font-medium text-red-800">
                                        {error === "AccessDenied" || error === "OAuthAccountNotLinked"
                                            ? "Acceso denegado"
                                            : "Error de autenticación"}
                                    </p>
                                    <p className="text-sm text-red-700 mt-1">
                                        {error === "AccessDenied" || error === "OAuthAccountNotLinked"
                                            ? "Solo cuentas @transperuana.com.pe pueden acceder al portal."
                                            : "Ocurrió un error al iniciar sesión. Por favor intente nuevamente."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Login Button */}
                    <form
                        action={async () => {
                            "use server"
                            await signIn("google", { redirectTo: "/" })
                        }}
                    >
                        <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group shadow-sm"
                        >
                            {/* Google Icon */}
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span className="text-gray-700 font-medium group-hover:text-gray-900 transition-colors">
                                Ingresar con Google
                            </span>
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="text-center pt-2">
                        <p className="text-xs text-gray-400">
                            Solo cuentas corporativas <span className="font-medium">@transperuana.com.pe</span>
                        </p>
                    </div>
                </div>

                {/* Company Footer */}
                <p className="text-center text-xs text-gray-400 mt-6">
                    © {new Date().getFullYear()} Transperuana Corredores de Seguros S.A.
                </p>
            </div>
        </div>
    )
}
