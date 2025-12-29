# Portal Monitoreo ETL - Transperuana

Sistema de monitoreo y gestión de procesos ETL para tramas de seguros.

## Stack Tecnológico

- **Framework**: Next.js 16 (App Router)
- **Autenticación**: NextAuth v5 (Google OAuth)
- **Estilos**: Tailwind CSS 4
- **Backend**: Google Apps Script

## Setup Local

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd transperuana-portal

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# 4. Ejecutar en desarrollo
npm run dev
```

## Variables de Entorno

| Variable | Descripción |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | ID de cliente OAuth de Google |
| `GOOGLE_CLIENT_SECRET` | Secret de cliente OAuth |
| `AUTH_SECRET` | Secret para NextAuth (generado) |
| `APPS_SCRIPT_URL` | URL del Web App de Apps Script |
| `APPS_SCRIPT_TOKEN` | Token de autenticación para Apps Script |
| `ALLOWED_DOMAIN` | Dominio permitido (ej: transperuana.com.pe) |
| `ADMIN_EMAILS` | Lista de emails admin separados por coma |

## Estructura del Proyecto

```
src/
├── app/                    # App Router pages
│   ├── (auth)/             # Páginas de autenticación
│   ├── (main)/             # Páginas principales
│   └── api/                # API routes
├── components/             # Componentes React
│   ├── ui/                 # Componentes UI genéricos
│   ├── layout/             # Header, Sidebar
│   └── [modulo]/           # Componentes por módulo
├── lib/                    # Utilidades y API
└── auth.ts                 # Configuración NextAuth
```

## Roles de Usuario

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| **ADMIN** | Administrador | Todo + Configuración + Usuarios |
| **EJECUTIVO** | Usuario estándar | Solo sus propios procesos |

## Scripts

```bash
npm run dev      # Desarrollo local
npm run build    # Build de producción
npm run start    # Iniciar producción
npm run lint     # Verificar código
```

## Despliegue

El proyecto está configurado para Vercel. El deploy es automático al hacer push a main.
