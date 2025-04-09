'use client'

import {
  Users,
  Map,
  ShoppingCart,
  CreditCard,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { JSX, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import dayjs from 'dayjs'
import { useAuthRedirect } from '../../hooks/useAuthRedirect'

type Stat = {
  title: string
  icon: JSX.Element
  value: number | string
  color: string
}

type VentaPorMes = {
  año: number
  mes: string
  total: number
}

type PagoReciente = {
  cliente: string
  monto: string
  fecha: string
}

type PagoConCliente = {
  fecha_pago: string
  total: number
  venta: {
    cliente: {
      nombre?: string
      apellido?: string
    }
  }
}

export default function DashboardPage() {
  const isReady = useAuthRedirect()

  const [stats, setStats] = useState<Stat[]>([])
  const [ventasTotales, setVentasTotales] = useState<VentaPorMes[]>([])
  const [pagos, setPagos] = useState<PagoReciente[]>([])
  const [añoSeleccionado, setAñoSeleccionado] = useState(dayjs().year())
  const añosDisponibles = [...new Set(ventasTotales.map(v => v.año))]
  const ventasFiltradas = ventasTotales.filter(v => v.año === añoSeleccionado)
  
  const MES_NUMERO: Record<string, number> = {
    Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
    Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12
  }

  useEffect(() => {
    const cargarStats = async () => {
      const [clientes, lotes, ventas, pagos] = await Promise.all([
        supabase.from('cliente').select('*', { count: 'exact', head: true }),
        supabase.from('lote').select('*', { count: 'exact', head: true }),
        supabase.from('venta').select('*', { count: 'exact', head: true }),
        supabase.from('venta_det').select('total')
      ])

      const totalPagos = pagos.data?.reduce((sum, p) => sum + Number(p.total), 0) || 0

      setStats([
        { title: 'Clientes', icon: <Users className="w-6 h-6" />, value: clientes.count ?? 0, color: 'bg-blue-100 text-blue-700' },
        { title: 'Lotes', icon: <Map className="w-6 h-6" />, value: lotes.count ?? 0, color: 'bg-green-100 text-green-700' },
        { title: 'Ventas', icon: <ShoppingCart className="w-6 h-6" />, value: ventas.count ?? 0, color: 'bg-yellow-100 text-yellow-700' },
        { title: 'Pagos', icon: <CreditCard className="w-6 h-6" />, value: totalPagos, color: 'bg-purple-100 text-purple-700' },
      ])
      
    }

    const cargarVentas = async () => {
      const { data } = await supabase.from('venta').select('fecha, total')
      const agrupadas: Record<string, number> = {}
      data?.forEach(v => {
        const fecha = dayjs(v.fecha)
        const clave = `${fecha.year()}-${fecha.format('MMM')}`
        agrupadas[clave] = (agrupadas[clave] || 0) + Number(v.total)
      })


      const datos = Object.entries(agrupadas).map(([k, v]) => {
        const [año, mes] = k.split('-')
        return { año: parseInt(año), mes, total: v }
      })
      
      // Ordenar por año y mes numérico
      datos.sort((a, b) => {
        if (a.año !== b.año) return a.año - b.año
        return MES_NUMERO[a.mes] - MES_NUMERO[b.mes]
      })

      setVentasTotales(datos)
    }

    const cargarUltimosPagos = async () => {
      const { data } = await supabase
      .from('venta_det')
      .select(`
        fecha_pago,
        total,
        venta:venta_id!inner (
          cliente:cliente_id!inner (
            nombre,
            apellido
          )
        )
      `)
      .order('fecha_pago', { ascending: false })
      .limit(5)
    
    
      const formateados = (data as unknown as PagoConCliente[]).map((p) => {
        const cliente = p.venta?.cliente
        const nombre = cliente
          ? `${cliente.nombre ?? ''} ${cliente.apellido ?? ''}`.trim()
          : 'Sin cliente'
      
        return {
          cliente: nombre,
          monto: `$${parseFloat(p.total.toString()).toFixed(2)}`,
          fecha: dayjs(p.fecha_pago).format('YYYY-MM-DD')
        }
      })
        setPagos(formateados)
    }
    

    cargarStats()
    cargarVentas()
    cargarUltimosPagos()
  }, [MES_NUMERO])


  useEffect(() => {
    if (ventasTotales.length > 0) {
      const años = [...new Set(ventasTotales.map(v => v.año))].sort()
      if (!años.includes(añoSeleccionado)) {
        setAñoSeleccionado(años[años.length - 1]) // Selecciona el último año disponible
      }
    }
  }, [ventasTotales, añoSeleccionado])
  

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Cargando...
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="bg-white p-6 rounded-2xl shadow-md flex items-center gap-4"
          >
            <div className={`p-3 rounded-full ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm text-gray-500">{stat.title}</p>
              <p className="text-xl font-semibold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico de ventas con filtros */}
      <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Ventas por mes</h2>
          <select
            value={añoSeleccionado}
            onChange={(e) => setAñoSeleccionado(parseInt(e.target.value))}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          >
            {añosDisponibles.map((año) => (
              <option key={año} value={año}>{año}</option>
            ))}
          </select>
        </div>

        {ventasFiltradas.length === 0 ? (
  <p className="text-center text-gray-500 py-10">
    No hay ventas registradas para el año seleccionado.
  </p>
) : (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={ventasFiltradas}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="mes" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="total" fill="#3b82f6" radius={[8, 8, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
)}

      </div>

      {/* Tabla de pagos */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Últimos pagos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 font-semibold">Cliente</th>
                <th className="p-3 font-semibold">Monto</th>
                <th className="p-3 font-semibold">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((pago, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="p-3">{pago.cliente}</td>
                  <td className="p-3">{pago.monto}</td>
                  <td className="p-3">{pago.fecha}</td>
                </tr>
              ))}
              {pagos.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center text-gray-500 p-6">
                    No hay pagos recientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}