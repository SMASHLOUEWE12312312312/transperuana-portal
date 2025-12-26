export default function Loading() {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-[#CD3529] border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 text-sm">Cargando...</p>
            </div>
        </div>
    );
}
