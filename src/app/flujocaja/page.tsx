// ControlFlujoCaja.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import dayjs from 'dayjs'
import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthRedirect } from '../../hooks/useAuthRedirect'

type Movimiento = {
  id: number
  tipo: 'entrada' | 'salida'
  descripcion: string
  monto: number
  fecha: string
  recibo: string
  tipoPago: string
}

type AgrupacionMensual = {
  mes: string
  entrada: number
  salida: number
}

export default function ControlFlujoCaja() {
  const isReady = useAuthRedirect()
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [tipo, setTipo] = useState<'entrada' | 'salida'>('entrada')
  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState<number | ''>('')
  const [fecha, setFecha] = useState(dayjs().format('YYYY-MM-DD'))
  const [recibo, setRecibo] = useState('')
  const [tipoPago, setTipoPago] = useState('')
  const [mostrarModal, setMostrarModal] = useState(false)
  const [editando, setEditando] = useState<Movimiento | null>(null)
  const [paginaActual, setPaginaActual] = useState(1)
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'entrada' | 'salida'>('todos')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const filasPorPagina = 15
  const [anioSeleccionado] = useState<string>('todos')
  
  const opcionesEntrada = ['Deposito', 'Transferencia', 'Efectivo', 'Traspaso']
  const opcionesSalida = ['Pagos', 'Administración', 'Cargos']
  const [autenticado, setAutenticado] = useState(false);
  const [contrasena, setContrasena] = useState('');

  const cargarMovimientos = async () => {
    const { data, error } = await supabase.from('movimientos').select('*')
    if (!error && data) setMovimientos(data)
  }

  useEffect(() => {
    cargarMovimientos()
  }, [])

  const movimientosFiltrados = movimientos.filter((m) => {
    const cumpleTipo = filtroTipo === 'todos' || m.tipo === filtroTipo
    const cumpleInicio = fechaInicio ? dayjs(m.fecha).isAfter(dayjs(fechaInicio).subtract(1, 'day')) : true
    const cumpleFin = fechaFin ? dayjs(m.fecha).isBefore(dayjs(fechaFin).add(1, 'day')) : true
    return cumpleTipo && cumpleInicio && cumpleFin
  })

  const guardarMovimiento = async () => {
    if (!descripcion || !monto || !tipoPago || !fecha) return toast.error('Todos los campos son obligatorios')

    const payload = { tipo, descripcion, monto: Number(monto), fecha, recibo, tipoPago }

    if (editando) {
      const { error } = await supabase.from('movimientos').update(payload).eq('id', editando.id)
      if (error) return toast.error('Error al actualizar: ' + error.message)
      toast.success('Movimiento actualizado correctamente')
    } else {
      const { error } = await supabase.from('movimientos').insert([payload])
      if (error) return toast.error('Error al guardar: ' + error.message)
      toast.success('Movimiento agregado correctamente')
    }

    await cargarMovimientos()
    limpiarFormulario()
  }

  const eliminarMovimiento = async (id: number) => {
    if (confirm('¿Deseas eliminar este movimiento?')) {
      await supabase.from('movimientos').delete().eq('id', id)
      await cargarMovimientos()
      toast.success('Movimiento eliminado')
    }
  }

  const limpiarFormulario = () => {
    setDescripcion('')
    setMonto('')
    setRecibo('')
    setTipoPago('')
    setFecha(dayjs().format('YYYY-MM-DD'))
    setTipo('entrada')
    setMostrarModal(false)
    setEditando(null)
  }

  const movimientosPorAnio = anioSeleccionado === 'todos'
  ? movimientos
  : movimientos.filter((m) => dayjs(m.fecha).year().toString() === anioSeleccionado)

const datosAgrupados: AgrupacionMensual[] = movimientosPorAnio.reduce((acc: AgrupacionMensual[], mov) => {
  const mesLabel = dayjs(mov.fecha).format('MMM YYYY')
  let item = acc.find((d) => d.mes === mesLabel)
  if (!item) {
    item = { mes: mesLabel, entrada: 0, salida: 0 }
    acc.push(item)
  }

  if (mov.tipo === 'entrada') item.entrada += mov.monto
  if (mov.tipo === 'salida') item.salida += mov.monto

  return acc
}, [])

datosAgrupados.sort((a, b) =>
  dayjs(a.mes, 'MMM YYYY').toDate().getTime() - dayjs(b.mes, 'MMM YYYY').toDate().getTime()
)
  

  const inicio = (paginaActual - 1) * filasPorPagina
  const fin = inicio + filasPorPagina
  const movimientosPaginados = movimientosFiltrados.slice(inicio, fin)
  const totalPaginas = Math.ceil(movimientosFiltrados.length / filasPorPagina)

  if (!autenticado) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 p-6">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-6 text-center">Acceso restringido</h2>
          <input
            type="password"
            placeholder="Ingresa la contraseña"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            className="w-full mb-4 border px-3 py-2 rounded text-sm"
          />
          <button
            onClick={() => {
              if (contrasena === '#lc_2025') { // <-- aquí defines la contraseña
                setAutenticado(true);
              } else {
                alert('Contraseña incorrecta');
                setContrasena('');
              }
            }}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Entrar
          </button>
        </div>
      </div>
    )
  }

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Cargando...
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Control de Entradas y Salidas</h1>
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Filtrar:</span>
            <select
              value={filtroTipo}
              onChange={(e) => {
                setFiltroTipo(e.target.value as 'todos' | 'entrada' | 'salida')
                setPaginaActual(1)
              }}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="todos">Todos</option>
              <option value="entrada">Entradas</option>
              <option value="salida">Salidas</option>
            </select>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => {
                setFechaInicio(e.target.value)
                setPaginaActual(1)
              }}
              className="border rounded px-2 py-1 text-sm"
              placeholder="Desde"
            />
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => {
                setFechaFin(e.target.value)
                setPaginaActual(1)
              }}
              className="border rounded px-2 py-1 text-sm"
              placeholder="Hasta"
            />
          </div>
          <button
            onClick={() => setMostrarModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Agregar movimiento
          </button>
        </div>

        {/* Tabla de movimientos */}
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-2 text-left">Fecha</th>
                <th className="px-4 py-2 text-left">Tipo</th>
                <th className="px-4 py-2 text-left">Descripción</th>
                <th className="px-4 py-2 text-left">Tipo de Pago</th>
                <th className="px-4 py-2 text-left">Recibo</th>
                <th className="px-4 py-2 text-left">Monto</th>
                <th className="px-4 py-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {movimientosPaginados.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="px-4 py-2">{dayjs(m.fecha).format('DD/MM/YYYY')}</td>
                  <td className="px-4 py-2 capitalize">{m.tipo}</td>
                  <td className="px-4 py-2">{m.descripcion}</td>
                  <td className="px-4 py-2">{m.tipoPago}</td>
                  <td className="px-4 py-2">{m.recibo}</td>
                  <td className={`px-4 py-2 font-medium ${m.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>${m.monto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={() => {
                        setEditando(m)
                        setTipo(m.tipo)
                        setDescripcion(m.descripcion)
                        setMonto(m.monto)
                        setFecha(m.fecha)
                        setRecibo(m.recibo)
                        setTipoPago(m.tipoPago)
                        setMostrarModal(true)
                      }}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => eliminarMovimiento(m.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {movimientosPaginados.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-gray-500 py-6">
                    No hay movimientos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex justify-between items-center mt-4 text-sm">
            <div>Mostrando {inicio + 1}-{Math.min(fin, movimientosFiltrados.length)} de {movimientosFiltrados.length}</div>
            <div className="flex gap-2">
              <button
                onClick={() => setPaginaActual(paginaActual - 1)}
                disabled={paginaActual === 1}
                className="px-2 py-1 border rounded disabled:opacity-50"
              >◀</button>
              <button
                onClick={() => setPaginaActual(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                className="px-2 py-1 border rounded disabled:opacity-50"
              >▶</button>
            </div>
          </div>
        )}

{mostrarModal && (
  <div className="fixed inset-0 backdrop-brightness-50 z-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl">
      <h2 className="text-lg font-semibold mb-4">{editando ? 'Editar movimiento' : 'Agregar movimiento'}</h2>

      <div className="space-y-4">
        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
          <select
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value as 'entrada' | 'salida')
              setTipoPago('') // limpiar selección
            }}
            className="w-full border px-3 py-2 rounded text-sm"
          >
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
          </select>
        </div>

        {/* Tipo de pago */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de pago</label>
          <select
            value={tipoPago}
            onChange={(e) => setTipoPago(e.target.value)}
            className="w-full border px-3 py-2 rounded text-sm"
          >
            <option value="">Selecciona una opción</option>
            {(tipo === 'entrada' ? opcionesEntrada : opcionesSalida).map((op) => (
              <option key={op} value={op}>{op}</option>
            ))}
          </select>
        </div>

        {/* Descripción */}
        <input
          type="text"
          placeholder="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="w-full border px-3 py-2 rounded text-sm"
        />

        {/* Monto */}
        <input
          type="number"
          placeholder="Monto"
          value={monto}
          onChange={(e) => setMonto(Number(e.target.value))}
          className="w-full border px-3 py-2 rounded text-sm"
        />

        {/* Fecha */}
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="w-full border px-3 py-2 rounded text-sm"
        />

        {/* Recibo */}
        <input
          type="text"
          placeholder="Recibo"
          value={recibo}
          onChange={(e) => setRecibo(e.target.value)}
          className="w-full border px-3 py-2 rounded text-sm"
        />
      </div>

      {/* Acciones */}
      <div className="flex justify-end gap-2 mt-6">
        <button
          onClick={limpiarFormulario}
          className="px-4 py-2 text-sm rounded hover:bg-gray-100"
        >
          Cancelar
        </button>
        <button
          onClick={guardarMovimiento}
          className="bg-blue-600 text-white px-4 py-2 text-sm rounded hover:bg-blue-700"
        >
          {editando ? 'Actualizar' : 'Guardar'}
        </button>
      </div>
    </div>
  </div>
)}

      </div>
    </div>
  )
}
