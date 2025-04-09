'use client'

import { useEffect, useState } from 'react'
import { Search, Pencil } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthRedirect } from '../../hooks/useAuthRedirect'

// Tipos

type Estatus = 'Vendido' | 'Donado' | 'Apartado' | 'Disponible'
type Propietarios = 'Cesar' | 'Jaime' | 'Javier' | 'Sebastian'

type Lote = {
  id: string
  folio: string
  etapa: string
  manzana: string
  lote: string
  superficie: string
  propietario: Propietarios
  estatus: Estatus
}

const estatusOptions: Estatus[] = ['Vendido', 'Donado', 'Apartado', 'Disponible']
const propietariosOptions: Propietarios[] = ['Cesar', 'Jaime', 'Javier', 'Sebastian']

const estatusColors: Record<Estatus, string> = {
  Vendido: 'bg-red-100 text-red-700',
  Donado: 'bg-blue-100 text-blue-700',
  Apartado: 'bg-yellow-100 text-yellow-700',
  Disponible: 'bg-green-100 text-green-700'
}

export default function LotesPage() {
  const isReady = useAuthRedirect()
  const [lotes, setLotes] = useState<Lote[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [modoEdicion, setModoEdicion] = useState<Lote | null>(null)
  const [nuevoLote, setNuevoLote] = useState<Partial<Lote>>({
    folio: '',
    etapa: '',
    manzana: '',
    lote: '',
    superficie: '',
    propietario: 'Cesar',
    estatus: 'Disponible',
  })

  const [filtroEstatus, setFiltroEstatus] = useState<Estatus | 'Todos'>('Todos')

  const cargarLotes = async () => {
    const { data, error } = await supabase.from('lote').select('*').order('folio', {ascending: true} )
    if (error) {
      console.error('Error al cargar lotes:', error.message)
    } else {
      setLotes(data as Lote[])
    }
  }

  useEffect(() => {
    cargarLotes()
  }, [])

  const handleGuardarLote = async () => {
    if (!nuevoLote.folio || !nuevoLote.etapa || !nuevoLote.lote || !nuevoLote.superficie) {
      alert('Todos los campos obligatorios deben estar completos')
      return
    }

    // Validar folio único
    const { data: existente } = await supabase
      .from('lote')
      .select('folio')
      .eq('folio', nuevoLote.folio)

    if (!modoEdicion && existente && existente.length > 0) {
      alert('Ya existe un lote con ese folio')
      return
    }

    if (modoEdicion) {
      const { error } = await supabase
        .from('lote')
        .update(nuevoLote)
        .eq('id', nuevoLote.id)

      if (error) {
        alert('Error al actualizar el lote: ' + error.message)
        return
      }
    } else {
      const { error } = await supabase.from('lote').insert([nuevoLote])
      if (error) {
        alert('Error al guardar el lote: ' + error.message)
        return
      }
    }

    await cargarLotes()
    setMostrarFormulario(false)
    setModoEdicion(null)
    setNuevoLote({
      folio: '', etapa: '', manzana: '', lote: '', superficie: '', propietario: 'Cesar', estatus: 'Disponible',
    })
  }

  const lotesFiltrados = lotes.filter((lote) => {
    const coincideBusqueda =
      lote.folio.toLowerCase().includes(busqueda.toLowerCase()) ||
      lote.propietario.toLowerCase().includes(busqueda.toLowerCase())
  
    const coincideEstatus =
      filtroEstatus === 'Todos' || lote.estatus === filtroEstatus
  
    return coincideBusqueda && coincideEstatus
  })

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Cargando...
      </div>
    )
  }
  
  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Lotes</h2>

      </div>

      <div className="bg-white shadow rounded-xl overflow-hidden">
        <div className="flex gap-2 flex-wrap mt-4  ml-2">
              {['Todos', ...estatusOptions].map((estado) => (
                <button
                  key={estado}
                  onClick={() => setFiltroEstatus(estado as Estatus | 'Todos')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border ${
                    filtroEstatus === estado
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {estado}
                </button>
              ))}
            </div>
        <div className="p-4 flex justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por folio o propietario"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9 pr-4 py-2 border rounded-lg text-sm w-full"
            />
          </div>
          <button
          onClick={() => {
            setMostrarFormulario(true)
            setModoEdicion(null)
            setNuevoLote({ folio: '', etapa: '', manzana: '', lote: '', superficie: '', propietario: 'Cesar', estatus: 'Disponible' })
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Agregar lote
        </button>

        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">Folio</th>
              <th className="px-4 py-3 text-left">Etapa</th>
              <th className="px-4 py-3 text-left">Manzana</th>
              <th className="px-4 py-3 text-left">Lote</th>
              <th className="px-4 py-3 text-left">Superficie</th>
              <th className="px-4 py-3 text-left">Propietario</th>
              <th className="px-4 py-3 text-left">Estatus</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lotesFiltrados.map((lote) => (
              <tr key={lote.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">{lote.folio}</td>
                <td className="px-4 py-3">{lote.etapa}</td>
                <td className="px-4 py-3">{lote.manzana}</td>
                <td className="px-4 py-3">{lote.lote}</td>
                <td className="px-4 py-3">{lote.superficie}</td>
                <td className="px-4 py-3">{lote.propietario}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${estatusColors[lote.estatus]}`}>
                    {lote.estatus}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => {
                      setNuevoLote(lote)
                      setModoEdicion(lote)
                      setMostrarFormulario(true)
                    }}
                    className="text-gray-500 hover:text-blue-600"
                  >
                    <Pencil size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {lotesFiltrados.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-6 text-gray-500">
                  No se encontraron lotes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {mostrarFormulario && (
        <div className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold">
              {modoEdicion ? 'Editar lote' : 'Agregar lote'}
            </h2>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Folio"
                value={nuevoLote.folio}
                onChange={(e) => setNuevoLote({ ...nuevoLote, folio: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <select
                value={nuevoLote.etapa}
                onChange={(e) => setNuevoLote({ ...nuevoLote, etapa: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="">Selecciona una etapa</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
              <input
                type="text"
                placeholder="Manzana"
                value={nuevoLote.manzana}
                onChange={(e) => setNuevoLote({ ...nuevoLote, manzana: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Lote"
                value={nuevoLote.lote}
                onChange={(e) => setNuevoLote({ ...nuevoLote, lote: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Superficie (m²)"
                value={nuevoLote.superficie}
                onChange={(e) => setNuevoLote({ ...nuevoLote, superficie: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <select
                value={nuevoLote.propietario}
                onChange={(e) => setNuevoLote({ ...nuevoLote, propietario: e.target.value as Propietarios })}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                {propietariosOptions.map((item)=>(
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <select
                value={nuevoLote.estatus}
                onChange={(e) => setNuevoLote({ ...nuevoLote, estatus: e.target.value as Estatus })}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                {estatusOptions.map((op) => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setMostrarFormulario(false)
                  setModoEdicion(null)
                }}
                className="px-4 py-2 text-sm rounded hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarLote}
                className="bg-blue-600 text-white px-4 py-2 text-sm rounded hover:bg-blue-700"
              >
                {modoEdicion ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
