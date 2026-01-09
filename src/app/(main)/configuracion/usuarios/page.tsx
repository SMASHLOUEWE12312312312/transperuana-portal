import { redirect } from 'next/navigation';

/**
 * Redirect page for backward compatibility
 * Old route: /configuracion/usuarios
 * New route: /configuracion?tab=usuarios
 */
export default function UsuariosRedirectPage() {
    redirect('/configuracion?tab=usuarios');
}
