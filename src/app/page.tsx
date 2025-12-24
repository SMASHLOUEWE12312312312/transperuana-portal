'use client';

import { useState, useEffect } from 'react';
import { Activity, FileText, CheckCircle, Clock, AlertTriangle, X } from 'lucide-react';
import { KPICard } from '@/components/ui/KPICard';
import { Timeline } from '@/components/ui/Timeline';
import {
  mockKPIStats,
  mockChartData,
  mockCompaniaDistribution,
  mockErrorDistribution,
  mockActivity,
  mockAlerts
} from '@/lib/mock-data';
import { fetchDashboard, isUsingMockData } from '@/lib/api';
import { formatCompanyName, cn } from '@/lib/utils';
import { ActivityItem, Compania, TipoError, EstadoProceso } from '@/lib/types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

const COMPANY_COLORS: Record<string, string> = {
  'RIMAC': '#1E3A8A',
  'PACIFICO': '#0891B2',
  'MAPFRE': '#DC2626',
  'LA_POSITIVA': '#059669',
  'SANITAS': '#7C3AED'
};

const ERROR_COLORS: Record<string, string> = {
  'OBLIGATORIO': '#EF4444',
  'FORMATO': '#F59E0B',
  'VALIDACION': '#F97316',
  'LONGITUD': '#3B82F6',
  'DUPLICADO': '#6B7280'
};

export default function DashboardPage() {
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(true);

  // Data states
  const [kpis, setKpis] = useState(mockKPIStats);
  const [chartData, setChartData] = useState(mockChartData);
  const [companiaDistribution, setCompaniaDistribution] = useState(mockCompaniaDistribution);
  const [errorDistribution, setErrorDistribution] = useState(mockErrorDistribution);
  const [actividadReciente, setActividadReciente] = useState<ActivityItem[]>(mockActivity);

  // Fetch data from API
  useEffect(() => {
    async function loadData() {
      if (isUsingMockData()) {
        console.log('[Dashboard] Usando datos mock (API no configurada)');
        setLoading(false);
        setUsingMock(true);
        return;
      }

      try {
        console.log('[Dashboard] Cargando datos desde API...');
        const data = await fetchDashboard();

        // Update KPIs
        setKpis({
          procesosHoy: data.kpis.procesosHoy,
          procesosTendencia: data.kpis.procesosTendencia,
          registrosProcesados: data.kpis.registrosProcesados,
          registrosTendencia: data.kpis.registrosTendencia,
          tasaExito: data.kpis.tasaExito,
          tasaExitoTendencia: data.kpis.tasaExitoTendencia,
          tiempoPromedio: data.kpis.tiempoPromedio,
          tiempoPromedioTendencia: data.kpis.tiempoPromedioTendencia
        });

        // Update chart data - transform API response to expected format
        setChartData(data.chartData.map(d => ({
          fecha: d.fecha,
          procesos: d.procesos,
          exitosos: d.registros - d.errores, // Calculate exitosos from registros - errores
          errores: d.errores
        })));

        // Update distributions - use type assertions for API data
        setCompaniaDistribution(data.companiaDistribution.map(c => ({
          compania: c.compania as Compania,
          cantidad: c.cantidad,
          porcentaje: parseFloat(c.porcentaje)
        })));

        setErrorDistribution(data.errorDistribution.map(e => ({
          tipoError: e.tipoError as TipoError,
          cantidad: e.cantidad,
          porcentaje: 0 // Will be calculated if needed
        })));

        // Update activity
        setActividadReciente(data.actividadReciente.map(a => ({
          id: a.id,
          tipo: a.tipo as 'proceso' | 'correo' | 'error',
          titulo: a.titulo,
          descripcion: a.descripcion,
          estado: (a.estado || 'COMPLETADO') as EstadoProceso,
          timestamp: new Date(a.timestamp),
          link: `/procesos/${a.id}`
        })));

        setUsingMock(false);
        console.log('[Dashboard] Datos cargados desde API correctamente');
      } catch (error) {
        console.error('[Dashboard] Error cargando API, usando mock:', error);
        setUsingMock(true);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const visibleAlerts = mockAlerts.filter(a => !dismissedAlerts.includes(a.id));

  const dismissAlert = (id: string) => {
    setDismissedAlerts(prev => [...prev, id]);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Resumen del sistema de procesamiento de tramas
          </p>
        </div>
        {usingMock && !loading && (
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
            ⚠️ Datos de ejemplo
          </span>
        )}
      </div>

      {/* Alerts */}
      {visibleAlerts.length > 0 && (
        <div className="space-y-2">
          {visibleAlerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "flex items-center justify-between p-4 rounded-lg animate-slideIn",
                alert.tipo === 'warning' && "bg-yellow-50 border border-yellow-200",
                alert.tipo === 'error' && "bg-red-50 border border-red-200",
                alert.tipo === 'success' && "bg-green-50 border border-green-200",
                alert.tipo === 'info' && "bg-blue-50 border border-blue-200"
              )}
              role="alert"
            >
              <div className="flex items-center gap-3">
                {alert.tipo === 'warning' && <AlertTriangle className="text-yellow-600" size={20} />}
                {alert.tipo === 'error' && <AlertTriangle className="text-red-600" size={20} />}
                {alert.tipo === 'success' && <CheckCircle className="text-green-600" size={20} />}
                {alert.tipo === 'info' && <Activity className="text-blue-600" size={20} />}
                <div>
                  <p className={cn(
                    "font-medium",
                    alert.tipo === 'warning' && "text-yellow-800",
                    alert.tipo === 'error' && "text-red-800",
                    alert.tipo === 'success' && "text-green-800",
                    alert.tipo === 'info' && "text-blue-800"
                  )}>
                    {alert.titulo}
                  </p>
                  <p className={cn(
                    "text-sm",
                    alert.tipo === 'warning' && "text-yellow-700",
                    alert.tipo === 'error' && "text-red-700",
                    alert.tipo === 'success' && "text-green-700",
                    alert.tipo === 'info' && "text-blue-700"
                  )}>
                    {alert.descripcion}
                  </p>
                </div>
              </div>
              {alert.dismissible && (
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  aria-label="Cerrar alerta"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={<FileText size={24} />}
          title="Procesos Hoy"
          value={kpis.procesosHoy}
          trend={kpis.procesosTendencia}
          trendLabel="vs ayer"
          loading={loading}
        />
        <KPICard
          icon={<Activity size={24} />}
          title="Registros Procesados"
          value={kpis.registrosProcesados}
          trend={kpis.registrosTendencia}
          trendLabel="vs ayer"
          loading={loading}
        />
        <KPICard
          icon={<CheckCircle size={24} />}
          title="Tasa de Éxito"
          value={kpis.tasaExito}
          trend={kpis.tasaExitoTendencia}
          format="percent"
          trendLabel="vs ayer"
          loading={loading}
        />
        <KPICard
          icon={<Clock size={24} />}
          title="Tiempo Promedio"
          value={kpis.tiempoPromedio}
          trend={kpis.tiempoPromedioTendencia}
          format="time"
          trendLabel="vs ayer"
          loading={loading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Processes Chart */}
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Procesos por Día</h2>
            <p className="text-sm text-gray-500">Últimos 30 días</p>
          </div>
          <div className="card-body">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorProcesos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#CD3529" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#CD3529" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                  <XAxis
                    dataKey="fecha"
                    tick={{ fontSize: 12, fill: '#666666' }}
                    tickFormatter={(val) => val.slice(5)}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#666666' }}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E5E5',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                    labelFormatter={(val) => `Fecha: ${val}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="procesos"
                    stroke="#CD3529"
                    strokeWidth={2}
                    fill="url(#colorProcesos)"
                    name="Procesos"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Company Distribution */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Por Compañía</h2>
            <p className="text-sm text-gray-500">Distribución de procesos</p>
          </div>
          <div className="card-body">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={companiaDistribution as unknown as Array<{ [key: string]: string | number }>}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="cantidad"
                    nameKey="compania"
                  >
                    {companiaDistribution.map((entry) => (
                      <Cell
                        key={entry.compania}
                        fill={COMPANY_COLORS[entry.compania] || '#999999'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [value, formatCompanyName(name as string)]}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E5E5',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="space-y-2 mt-4">
              {companiaDistribution.map((item) => (
                <div key={item.compania} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COMPANY_COLORS[item.compania] || '#999999' }}
                    />
                    <span className="text-gray-600">{formatCompanyName(item.compania)}</span>
                  </div>
                  <span className="font-medium text-gray-900">{item.porcentaje}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Error Distribution */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Tipos de Error</h2>
            <p className="text-sm text-gray-500">Esta semana</p>
          </div>
          <div className="card-body">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={errorDistribution as unknown as Array<{ [key: string]: string | number }>}
                  layout="vertical"
                  margin={{ left: 0, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#666666' }} />
                  <YAxis
                    type="category"
                    dataKey="tipoError"
                    tick={{ fontSize: 11, fill: '#666666' }}
                    width={80}
                    tickFormatter={(val) => val.charAt(0) + val.slice(1).toLowerCase()}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E5E5',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar
                    dataKey="cantidad"
                    radius={[0, 4, 4, 0]}
                  >
                    {errorDistribution.map((entry) => (
                      <Cell key={entry.tipoError} fill={ERROR_COLORS[entry.tipoError] || '#999999'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="lg:col-span-2 card">
          <div className="card-header flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Actividad Reciente</h2>
              <p className="text-sm text-gray-500">Últimos procesos y eventos</p>
            </div>
            <a href="/procesos" className="text-sm text-[#CD3529] hover:underline">
              Ver todos →
            </a>
          </div>
          <div className="card-body max-h-80 overflow-y-auto">
            <Timeline items={actividadReciente} maxItems={8} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}
