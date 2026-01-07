/**
 * API Route para subir archivos a Google Drive
 * Usa Service Account para acceso server-side
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { google } from 'googleapis';
import { Readable } from 'stream';

const FOLDER_UPLOADS = process.env.DRIVE_FOLDER_UPLOADS || '1q0uVU07tRFOG8mhwl9Zg4rG5RO-eJSCG';

export async function POST(request: NextRequest) {
    try {
        // Verificar autenticación
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
        }

        // Obtener form data
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No se recibió archivo' }, { status: 400 });
        }

        // Validar extensión
        const extension = file.name.split('.').pop()?.toLowerCase();
        const allowedExtensions = ['xlsx', 'xls', 'xlsm', 'xltx', 'xltm', 'ods'];
        if (!extension || !allowedExtensions.includes(extension)) {
            return NextResponse.json({
                success: false,
                error: `Extensión .${extension} no permitida`
            }, { status: 400 });
        }

        // Validar tamaño (10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({
                success: false,
                error: 'Archivo muy grande. Máximo 10MB'
            }, { status: 400 });
        }

        // Verificar credenciales
        const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

        if (!serviceAccountEmail || !serviceAccountKey) {
            console.error('[Upload API] Credenciales de service account no configuradas');
            return NextResponse.json({
                success: false,
                error: 'Credenciales de Google Drive no configuradas'
            }, { status: 500 });
        }

        // Configurar Google Drive API
        const auth2 = new google.auth.GoogleAuth({
            credentials: {
                client_email: serviceAccountEmail,
                private_key: serviceAccountKey.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/drive.file'],
        });

        const drive = google.drive({ version: 'v3', auth: auth2 });

        // Convertir File a stream
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const stream = Readable.from(buffer);

        // Generar nombre único
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const userPrefix = session.user.email.split('@')[0].substring(0, 10);
        const fileName = `CM_${timestamp}_${userPrefix}_${file.name}`;

        console.log(`[Upload API] Subiendo: ${fileName} a carpeta ${FOLDER_UPLOADS}`);

        // Subir a Drive
        const driveResponse = await drive.files.create({
            requestBody: {
                name: fileName,
                parents: [FOLDER_UPLOADS],
            },
            media: {
                mimeType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                body: stream,
            },
            fields: 'id, name, webViewLink',
        });

        if (!driveResponse.data.id) {
            throw new Error('No se pudo obtener ID del archivo subido');
        }

        console.log(`[Upload API] Subido OK: ${driveResponse.data.id}`);

        return NextResponse.json({
            success: true,
            fileId: driveResponse.data.id,
            fileName: driveResponse.data.name,
            webViewLink: driveResponse.data.webViewLink,
        });

    } catch (error) {
        console.error('[Upload API] Error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Error al subir archivo' },
            { status: 500 }
        );
    }
}
