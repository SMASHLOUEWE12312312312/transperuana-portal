'use client';

import { useState } from 'react';
import { Search, X, Filter, Calendar } from 'lucide-react';


interface FilterOption {
    value: string;
    label: string;
}

interface FilterPanelProps {
    onFilterChange: (filters: Record<string, string>) => void;
    filters?: {
        search?: boolean;
        dateRange?: boolean;
        compania?: boolean;
        tipoSeguro?: boolean;
        estado?: boolean;
        tipoError?: boolean;
        cliente?: boolean;
    };
    clientes?: string[];
}

const COMPANIAS: FilterOption[] = [
    { value: '', label: 'Todas las compañías' },
    { value: 'RIMAC', label: 'Rímac' },
    { value: 'PACIFICO', label: 'Pacífico' },
    { value: 'MAPFRE', label: 'Mapfre' },
    { value: 'LA_POSITIVA', label: 'La Positiva' },
    { value: 'SANITAS', label: 'Sanitas' },
];

const TIPOS_SEGURO: FilterOption[] = [
    { value: '', label: 'Todos los tipos' },
    { value: 'SCTR', label: 'SCTR' },
    { value: 'VIDA_LEY', label: 'Vida Ley' },
];

const ESTADOS: FilterOption[] = [
    { value: '', label: 'Todos los estados' },
    { value: 'COMPLETADO', label: 'Completado' },
    { value: 'COMPLETADO_CON_ERRORES', label: 'Con Errores' },
    { value: 'ERROR', label: 'Error' },
    { value: 'EN_PROCESO', label: 'En Proceso' },
    { value: 'INICIADO', label: 'Iniciado' },
];

const TIPOS_ERROR: FilterOption[] = [
    { value: '', label: 'Todos los tipos' },
    { value: 'OBLIGATORIO', label: 'Obligatorio' },
    { value: 'FORMATO', label: 'Formato' },
    { value: 'VALIDACION', label: 'Validación' },
    { value: 'LONGITUD', label: 'Longitud' },
    { value: 'DUPLICADO', label: 'Duplicado' },
];

export function FilterPanel({
    onFilterChange,
    filters = { search: true, compania: true, tipoSeguro: true, estado: true },
    clientes = []
}: FilterPanelProps) {
    const [search, setSearch] = useState('');
    const [compania, setCompania] = useState('');
    const [tipoSeguro, setTipoSeguro] = useState('');
    const [estado, setEstado] = useState('');
    const [tipoError, setTipoError] = useState('');
    const [cliente, setCliente] = useState('');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');

    const [showFilters, setShowFilters] = useState(true);

    const handleApply = () => {
        const activeFilters: Record<string, string> = {};
        if (search) activeFilters.search = search;
        if (compania) activeFilters.compania = compania;
        if (tipoSeguro) activeFilters.tipoSeguro = tipoSeguro;
        if (estado) activeFilters.estado = estado;
        if (tipoError) activeFilters.tipoError = tipoError;
        if (cliente) activeFilters.cliente = cliente;
        if (fechaDesde) activeFilters.fechaDesde = fechaDesde;
        if (fechaHasta) activeFilters.fechaHasta = fechaHasta;

        onFilterChange(activeFilters);
    };

    const handleClear = () => {
        setSearch('');
        setCompania('');
        setTipoSeguro('');
        setEstado('');
        setTipoError('');
        setCliente('');
        setFechaDesde('');
        setFechaHasta('');
        onFilterChange({});
    };

    const hasActiveFilters = search || compania || tipoSeguro || estado || tipoError || cliente || fechaDesde || fechaHasta;

    return (
        <div className="card">
            {/* Search Bar */}
            {filters.search && (
                <div className="card-body border-b border-gray-200">
                    <div className="search-input-container">
                        <Search className="search-icon" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por ID de proceso, archivo o cliente..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                            className="input search-input"
                            aria-label="Buscar"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                aria-label="Limpiar búsqueda"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Filter Toggle */}
            <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                    aria-expanded={showFilters}
                >
                    <Filter size={16} />
                    Filtros
                    {hasActiveFilters && (
                        <span className="badge badge-error text-[10px]">
                            {[compania, tipoSeguro, estado, tipoError, cliente, fechaDesde].filter(Boolean).length}
                        </span>
                    )}
                </button>

                {hasActiveFilters && (
                    <button
                        onClick={handleClear}
                        className="text-sm text-[#CD3529] hover:underline"
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>

            {/* Filter Options */}
            {showFilters && (
                <div className="card-body animate-slideIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {/* Date Range */}
                        {filters.dateRange && (
                            <>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                        Desde
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="date"
                                            value={fechaDesde}
                                            onChange={(e) => setFechaDesde(e.target.value)}
                                            className="input pl-10"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                        Hasta
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="date"
                                            value={fechaHasta}
                                            onChange={(e) => setFechaHasta(e.target.value)}
                                            className="input pl-10"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Cliente */}
                        {filters.cliente && clientes.length > 0 && (
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                    Cliente
                                </label>
                                <select
                                    value={cliente}
                                    onChange={(e) => setCliente(e.target.value)}
                                    className="input select"
                                >
                                    <option value="">Todos los clientes</option>
                                    {clientes.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Compañía */}
                        {filters.compania && (
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                    Compañía
                                </label>
                                <select
                                    value={compania}
                                    onChange={(e) => setCompania(e.target.value)}
                                    className="input select"
                                >
                                    {COMPANIAS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Tipo Seguro */}
                        {filters.tipoSeguro && (
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                    Tipo de Seguro
                                </label>
                                <select
                                    value={tipoSeguro}
                                    onChange={(e) => setTipoSeguro(e.target.value)}
                                    className="input select"
                                >
                                    {TIPOS_SEGURO.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Estado */}
                        {filters.estado && (
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                    Estado
                                </label>
                                <select
                                    value={estado}
                                    onChange={(e) => setEstado(e.target.value)}
                                    className="input select"
                                >
                                    {ESTADOS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Tipo Error */}
                        {filters.tipoError && (
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                    Tipo de Error
                                </label>
                                <select
                                    value={tipoError}
                                    onChange={(e) => setTipoError(e.target.value)}
                                    className="input select"
                                >
                                    {TIPOS_ERROR.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Apply Button */}
                    <div className="flex justify-end mt-4">
                        <button onClick={handleApply} className="btn btn-primary">
                            Aplicar Filtros
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
