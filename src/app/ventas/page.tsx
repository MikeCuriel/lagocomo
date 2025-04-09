// Ventas.tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { useAuthRedirect } from '../../hooks/useAuthRedirect'

type Venta = {
  id: number
  total: number
  cliente_id: number
  lote_id: number
  fecha: string
  numero_pagos: number
  pago_mensual: number
  precioMetro: number
  cliente?: {
    nombre: string
    apellido: string
  }
  lote?: {
    folio: string
    etapa: string
    manzana: string
    lote: string
    superficie: number
  }
}
type Lote = {
  id: number
  folio: string
  manzana: string
  etapa: string
  lote: string
  superficie: number
  estatus: string
}

type Cliente = {
  id: number
  nombre: string
  apellido: string
  correo: string
  telefono: string
}


export default function VentasPage() {
  const isReady = useAuthRedirect()
  const [ventas, setVentas] = useState<Venta[]>([])
  const [mostrarModal, setMostrarModal] = useState(false)
  const [lotesDisponibles, setLotesDisponibles] = useState<Lote[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])

  const [loteSeleccionado, setLoteSeleccionado] = useState<Lote | null>(null)
  const [clienteId, setClienteId] = useState('')
  const [fechaPago, setFechaPago] = useState(dayjs().format('YYYY-MM-DD'))
  const [precioMetroBase, setPrecioMetroBase] = useState<number | ''>('')
  const [esquina, setEsquina] = useState(false)
  const [parque, setParque] = useState(false)
  const [bonoVenta, setBonoVenta] = useState(false)
  const [numeroPagos, setNumeroPagos] = useState(12)

  const [precioFinalM2, setPrecioFinalM2] = useState(0)
  const [enganche, setEnganche] = useState(0)
  const [pagoMensual, setPagoMensual] = useState(0)
  const [totalVenta, setTotalVenta] = useState(0)

  useEffect(() => {
    cargarVentas()
    cargarLotes()
    cargarClientes()
  }, [])

  const cargarVentas = async () => {
    const { data } = await supabase.from('venta').select('*, cliente(*), lote(*)')
    if (data) setVentas(data)
  }

  const cargarLotes = async () => {
    const { data } = await supabase.from('lote').select('*').eq('estatus', 'Disponible')
    if (data) setLotesDisponibles(data)
  }

  const cargarClientes = async () => {
    const { data } = await supabase.from('cliente').select('*')
    if (data) setClientes(data)
  }

  const calcularPrecioFinal = useCallback(() => {
    if (!loteSeleccionado || !precioMetroBase) return
  
    let precio = Number(precioMetroBase)
  
    if (esquina) precio += 100
    if (parque) precio += 100
    if (numeroPagos <= 12) precio += 100
    else if (numeroPagos <= 24) precio += 200
    else if (numeroPagos <= 36) precio += 300
  
    const superficie = loteSeleccionado.superficie
    let total = precio * superficie
  
    if (bonoVenta) total -= 15000
  
    const enganche = total * 0.25
    const restante = total - enganche
    const mensual = restante / numeroPagos
  
    setPrecioFinalM2(precio)
    setTotalVenta(total)
    setEnganche(enganche)
    setPagoMensual(mensual)
  }, [bonoVenta, esquina, parque, numeroPagos, loteSeleccionado, precioMetroBase])
  
  useEffect(() => {
    calcularPrecioFinal()
  }, [calcularPrecioFinal])

  const guardarVenta = async () => {
    if (!loteSeleccionado || !clienteId || !precioFinalM2 || !fechaPago) return toast.error('Faltan datos')

    const { data: clienteData } = await supabase.from('cliente').select('*').eq('id', clienteId).single()
    const clienteNombre = `${clienteData?.nombre || ''} ${clienteData?.apellido || ''}`

    const { data, error } = await supabase.from('venta').insert({
      lote_id: loteSeleccionado.id,
      cliente_id: clienteId,
      fecha: fechaPago,
      total: totalVenta,
      numero_pagos: numeroPagos,
      pago_mensual: pagoMensual,
      precioMetro: precioFinalM2
    }).select()

    if (error || !data) return toast.error('Error al guardar')

    const ventaId = data[0].id

    await supabase.from('lote').update({ estatus: 'Vendido' }).eq('id', loteSeleccionado.id)

    await supabase.from('movimiento').insert({
      fecha: dayjs().format('YYYY-MM-DD'),
      tipo: 'entrada',
      descripcion: `Compra terreno - ${clienteNombre}`,
      tipoPago: 'transferencia',
      recibo: `VENTA-${ventaId}`,
      monto: enganche
    })

    const ventaDetData = Array.from({ length: numeroPagos }).map((_, index) => {
      return {
        venta_id: ventaId,
        fecha_pago: dayjs(fechaPago).add(index + 1, 'month').format('YYYY-MM-DD'),
        tipoPago: 'pendiente',
        total: pagoMensual,
        observacion: ''
      }
    })

    await supabase.from('venta_det').insert(ventaDetData)

    toast.success('Venta registrada')
    setMostrarModal(false)
    await cargarVentas()
    await cargarLotes()
  }

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Cargando...
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Ventas</h1>
        <button onClick={() => setMostrarModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded">
          Agregar venta
        </button>
      </div>

      <table className="w-full bg-white shadow rounded-xl text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left">Cliente</th>
            <th className="px-4 py-2 text-left">Lote</th>
            <th className="px-4 py-2 text-left">Fecha</th>
            <th className="px-4 py-2 text-left">Total</th>
            <th className="px-4 py-2 text-left">Pagos</th>
            <th className="px-4 py-2 text-left">Pago Mensual</th>
            <th className="px-4 py-2 text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {ventas.map((v) => (
            <tr key={v.id} className="border-t">
              <td className="px-4 py-2">{v.cliente?.nombre} {v.cliente?.apellido}</td>
              <td className="px-4 py-2">{v.lote?.lote}</td>
              <td className="px-4 py-2">{dayjs(v.fecha).format('DD/MM/YYYY')}</td>
              <td className="px-4 py-2">${v.total.toFixed(2)}</td>
              <td className="px-4 py-2">{v.numero_pagos}</td>
              <td className="px-4 py-2">${v.pago_mensual.toFixed(2)}</td>
              <td className="px-4 py-2">
                <button
                  className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                  onClick={() => window.location.href = `/ventas/${v.id}/pagos`}
                >
                  Agregar pago
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {mostrarModal && (
        <div className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl space-y-4">
            <h2 className="text-xl font-semibold">Nueva Venta</h2>

            <select
              value={loteSeleccionado?.id || ''}
              onChange={(e) => {
                const lote = lotesDisponibles.find(l => l.id === Number(e.target.value)) || null
                setLoteSeleccionado(lote)
              }}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="">Seleccionar lote</option>
              {lotesDisponibles.map(l => (
                <option key={l.id} value={l.id}>
                  {l.lote} - Folio: {l.folio} - Manzana: {l.manzana} - Etapa: {l.etapa}
                </option>
              ))}
            </select>

            {loteSeleccionado && (
              <div className="grid grid-cols-2 gap-4">
                <p>Manzana: {loteSeleccionado.manzana}</p>
                <p>Folio: {loteSeleccionado.folio}</p>
                <p>Etapa: {loteSeleccionado.etapa}</p>
                <p>Superficie: {loteSeleccionado.superficie} m²</p>
              </div>
            )}

            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="">Seleccionar cliente</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>
              ))}
            </select>

            <input
              type="date"
              value={fechaPago}
              onChange={(e) => setFechaPago(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />

            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Precio m² base"
                value={precioMetroBase}
                onChange={(e) => setPrecioMetroBase(Number(e.target.value))}
                className="border px-3 py-2 rounded"
              />
              <select
                value={numeroPagos}
                onChange={(e) => setNumeroPagos(Number(e.target.value))}
                className="border px-3 py-2 rounded"
              >
                {[...Array(36).keys()].map(i => (
                  <option key={i + 1} value={i + 1}>{i + 1} pagos</option>
                ))}
              </select>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={esquina}
                  onChange={(e) => setEsquina(e.target.checked)}
                />
                Esquina
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={parque}
                  onChange={(e) => setParque(e.target.checked)}
                />
                Parque
              </label>
              <label className="flex items-center gap-2 col-span-2">
                <input
                  type="checkbox"
                  checked={bonoVenta}
                  onChange={(e) => setBonoVenta(e.target.checked)}
                />
                Aplicar bono de venta (-$15,000)
              </label>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <p>Precio Final m²: <strong>${precioFinalM2}</strong></p>
              <p>Enganche (25%): <strong>${enganche.toFixed(2)}</strong></p>
              <p>Total: <strong>${totalVenta.toFixed(2)}</strong></p>
              <p>Pago mensual: <strong>${pagoMensual.toFixed(2)}</strong></p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setMostrarModal(false)}
                className="px-4 py-2 rounded hover:bg-gray-100"
              >Cancelar</button>
              <button
                onClick={guardarVenta}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >Guardar venta</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}