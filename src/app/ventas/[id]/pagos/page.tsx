// app/ventas/[id]/pagos/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import dayjs from 'dayjs'
import { Plus } from 'lucide-react'

type Pago = {
  id: number
  fecha_pago: string
  tipo_pago: string
  total: number
  observacion?: string
}

type Venta = {
  id: number
  total: number
  pago_mensual: number
  cliente?: {
    nombre: string
    apellido: string
    correo: string
    telefono: string
  }
  lote?: {
    folio: string
    etapa: string
    superficie: number
  }
}

export default function PagosPorVenta() {
  const obtenerPagosPorVenta = async (ventaId: string | number) => {
    const { data, error } = await supabase
      .from('venta_det')
      .select('*')
      .eq('venta_id', ventaId)
      .order('fecha_pago', { ascending: true })
    if (error) console.error('Error cargando pagos:', error.message)
    return data || []
  }
  
  const obtenerVentaConClienteYLote= async(ventaId: string | number) => {
    const { data, error } = await supabase
      .from('venta')
      .select('*, cliente(*), lote(*)')
      .eq('id', ventaId)
      .single()
    if (error) console.error('Error cargando venta:', error.message)
    return data
  }

  const { id } = useParams()
  const [pagos, setPagos] = useState<Pago[]>([])
  const [venta, setVenta] = useState<Venta | null>(null)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [ventaResumen, setVentaResumen] = useState<{
    total: number
    mensualidad: number
    abonos: number
    restante: number
  } | null>(null)
  const [nuevoPago, setNuevoPago] = useState({
    fecha_pago: dayjs().format('YYYY-MM-DD'),
    tipo_pago: 'transferencia',
    total: '',
    observacion: ''
  })

  useEffect(() => {

    const cargarVentaResumen = async () => {
      const { data: venta } = await supabase
        .from('venta')
        .select('id, total, pago_mensual, venta_det(total)')
        .order('id', { ascending: true })
        .limit(1)
        .single()
  
      const sumaAbonos = venta?.venta_det?.reduce((sum, a) => sum + Number(a.total), 0) || 0
      setVentaResumen({
        total: venta?.total || 0,
        mensualidad: venta?.pago_mensual || 0,
        abonos: sumaAbonos,
        restante: (venta?.total || 0) - sumaAbonos
      })
    }

    if (typeof id === 'string') {
      const idNum = parseInt(id)
      obtenerVentaConClienteYLote(idNum).then(setVenta)
      obtenerPagosPorVenta(idNum).then(setPagos)
    }

    cargarVentaResumen()
  }, [id])

  const guardarPago = async () => {
    if (!id || !nuevoPago.total || !nuevoPago.fecha_pago || !nuevoPago.tipo_pago) return

    const { error } = await supabase.from('venta_det').insert({
      venta_id: id,
      ...nuevoPago,
      total: parseFloat(nuevoPago.total.toString())
    })

    if (!error) {
      setMostrarModal(false)
      setNuevoPago({
        fecha_pago: dayjs().format('YYYY-MM-DD'),
        tipo_pago: 'transferencia',
        total: '',
        observacion: ''
      })
      const actualizados = await obtenerPagosPorVenta(parseInt(id as string))
      setPagos(actualizados)
    }
  }

  console.log(ventaResumen)


  return (
    <div className="max-w-6xl mx-auto p-6">
      {ventaResumen  && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <p className="text-sm text-gray-500">Precio del terreno</p>
          <p className="text-xl font-bold text-gray-800">${ventaResumen.total.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <p className="text-sm text-gray-500">Suma de abonos</p>
          <p className="text-xl font-bold text-green-600">${ventaResumen.abonos.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <p className="text-sm text-gray-500">Total a pagar</p>
          <p className="text-xl font-bold text-gray-800">${ventaResumen.restante.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <p className="text-sm text-gray-500">Pago mensual</p>
          <p className="text-xl font-bold text-blue-600">${ventaResumen.mensualidad.toFixed(2)}</p>
        </div>
      </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Información</h2>
          {venta && (
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <p className="font-medium">Cliente:</p>
                <p>{venta.cliente?.nombre} {venta.cliente?.apellido}</p>
              </div>
              <div>
                <p className="font-medium">Correo:</p>
                <p>{venta.cliente?.correo}</p>
              </div>
              <div>
                <p className="font-medium">Teléfono:</p>
                <p>{venta.cliente?.telefono}</p>
              </div>
              <hr className="my-4" />
              <div>
                <p className="font-medium">Lote:</p>
                <p>{venta.lote?.folio} — Etapa {venta.lote?.etapa}</p>
              </div>
              <div>
                <p className="font-medium">Superficie:</p>
                <p>{venta.lote?.superficie} m²</p>
              </div>
              <div>
                <p className="font-medium">Total:</p>
                <p>${venta.total.toFixed(2)}</p>
              </div>
              <div>
                <p className="font-medium">Mensualidad:</p>
                <p>${venta.pago_mensual.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Pagos</h2>
            <button
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              onClick={() => setMostrarModal(true)}
            >
              <Plus size={18} /> Agregar pago
            </button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Fecha de pago</th>
                <th className="px-4 py-3 text-left">Tipo de pago</th>
                <th className="px-4 py-3 text-left">Total</th>
                <th className="px-4 py-3 text-left">Observación</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((pago, index) => (
                <tr key={pago.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3">{dayjs(pago.fecha_pago).format('DD/MM/YYYY')}</td>
                  <td className="px-4 py-3">{pago.tipo_pago}</td>
                  <td className="px-4 py-3">${pago.total.toFixed(2)}</td>
                  <td className="px-4 py-3">{pago.observacion || '-'}</td>
                </tr>
              ))}
              {pagos.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-500 py-6">
                    No hay pagos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {mostrarModal && (
        <div className="fixed inset-0 z-50 backdrop-brightness-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Agregar nuevo pago</h2>
            <div className="space-y-4">
              <input
                type="date"
                value={nuevoPago.fecha_pago}
                onChange={(e) => setNuevoPago({ ...nuevoPago, fecha_pago: e.target.value })}
                className="w-full border px-3 py-2 rounded text-sm"
              />
              <select
                value={nuevoPago.tipo_pago}
                onChange={(e) => setNuevoPago({ ...nuevoPago, tipo_pago: e.target.value })}
                className="w-full border px-3 py-2 rounded text-sm"
              >
                <option value="transferencia">Transferencia</option>
                <option value="efectivo">Efectivo</option>
                <option value="cheque">Cheque</option>
              </select>
              <input
                type="number"
                placeholder="Monto total"
                value={nuevoPago.total}
                onChange={(e) => setNuevoPago({ ...nuevoPago, total: e.target.value })}
                className="w-full border px-3 py-2 rounded text-sm"
              />
              <input
                type="text"
                placeholder="Observación"
                value={nuevoPago.observacion}
                onChange={(e) => setNuevoPago({ ...nuevoPago, observacion: e.target.value })}
                className="w-full border px-3 py-2 rounded text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setMostrarModal(false)}
                className="px-4 py-2 text-sm rounded hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={guardarPago}
                className="bg-blue-600 text-white px-4 py-2 text-sm rounded hover:bg-blue-700"
              >
                Guardar pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}