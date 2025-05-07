'use client'

import { useEffect, useState } from 'react'
import { Pencil } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthRedirect } from '../../hooks/useAuthRedirect'
import { TablePagination } from '@mui/material'

// Tipos

type Estatus = 'Vendido' | 'Donado' | 'Apartado' | 'Disponible'
type Propietarios = 'CESAR' | 'JAIME' | 'LC'
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
const propietariosOptions: Propietarios[] = ['CESAR', 'JAIME', 'LC']

const estatusColors: Record<Estatus, string> = {
  Vendido: 'bg-red-100 text-red-700',
  Donado: 'bg-blue-100 text-blue-700',
  Apartado: 'bg-yellow-100 text-yellow-700',
  Disponible: 'bg-green-100 text-green-700',
}

export default function LotesPage() {
  const isReady = useAuthRedirect()
  const [lotes, setLotes] = useState<Lote[]>([])
  const [busqueda] = useState('')
  const [busquedaEtapa, setBusquedaEtapa] = useState('')
  const [busquedaManzana, setBusquedaManzana] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [modoEdicion, setModoEdicion] = useState<Lote | null>(null)
  const [filtroPropietario, setFiltroPropietario] = useState<Propietarios | 'Todos'>('Todos')
  const [nuevoLote, setNuevoLote] = useState<Partial<Lote>>({
    folio: '', etapa: '', manzana: '', lote: '', superficie: '', propietario: 'CESAR', estatus: 'Disponible'
  })

  const [paginaActual, setPaginaActual] = useState(0)
  const [filasPorPagina, setFilasPorPagina] = useState(10)
  const [filtroEstatus, setFiltroEstatus] = useState<Estatus | 'Todos'>('Todos')
  const [busquedaLote, setBusquedaLote] = useState('')

  useEffect(() => {
    const cargarLotes = async () => {
      const { data, error } = await supabase.from('lote').select('*').order('folio', { ascending: true })
      if (!error && data) setLotes(data as Lote[])
    }
    cargarLotes()
  }, [])

  useEffect(() => {
    setPaginaActual(0)
  }, [busqueda, busquedaEtapa, busquedaManzana, busquedaLote, filtroEstatus, filtroPropietario])

  const handleGuardarLote = async () => {
    if (!nuevoLote.folio || !nuevoLote.etapa || !nuevoLote.lote || !nuevoLote.superficie) {
      return alert('Todos los campos obligatorios deben estar completos')
    }

    const { data: existente } = await supabase
      .from('lote')
      .select('folio')
      .eq('folio', nuevoLote.folio)

    if (!modoEdicion && existente && existente.length > 0) {
      return alert('Ya existe un lote con ese folio')
    }

    const { error } = modoEdicion
      ? await supabase.from('lote').update(nuevoLote).eq('id', nuevoLote.id)
      : await supabase.from('lote').insert([nuevoLote])

    if (error) return alert('Error al guardar: ' + error.message)

    setMostrarFormulario(false)
    setModoEdicion(null)
    setNuevoLote({ folio: '', etapa: '', manzana: '', lote: '', superficie: '', propietario: 'CESAR', estatus: 'Disponible' })
    const { data } = await supabase.from('lote').select('*').order('folio', { ascending: true })
    if (data) setLotes(data as Lote[])
  }

  const lotesFiltrados = lotes.filter((lote) => {
    const matchBusqueda = lote.folio.toLowerCase().includes(busqueda.toLowerCase()) ||
      lote.propietario.toLowerCase().includes(busqueda.toLowerCase())
    const matchEtapa = lote.etapa.toLowerCase().includes(busquedaEtapa.toLowerCase())
    const matchManzana = lote.manzana.toLowerCase().includes(busquedaManzana.toLowerCase())
    const matchLote = lote.lote.toLowerCase().includes(busquedaLote.toLowerCase())
    const matchEstatus = filtroEstatus === 'Todos' || lote.estatus === filtroEstatus
    const matchPropietario = filtroPropietario === 'Todos' || lote.propietario === filtroPropietario
    return matchBusqueda && matchEtapa && matchManzana && matchLote && matchEstatus && matchPropietario
  })

  const totalPaginas = Math.ceil(lotesFiltrados.length / filasPorPagina)
  const paginaAUsar = Math.min(paginaActual, totalPaginas - 1)
  const lotesPaginados = lotesFiltrados.slice(
    paginaAUsar * filasPorPagina,
    paginaAUsar * filasPorPagina + filasPorPagina
  )

  if (!isReady) return <div className="flex items-center justify-center min-h-screen text-gray-500">Cargando...</div>

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Lotes</h2>
      </div>

      <div className="bg-white shadow rounded-xl overflow-hidden">
        <div className="flex gap-2 flex-wrap mt-4 ml-2">
          <div className='bg-gray-100 rounded-xl px-5 p-5' >
            <h2 className='text-[#637381] pb-3 text-2xl'> Filtro estatus</h2>
            {['Todos', ...estatusOptions].map((estado) => (
              <button
                key={estado}
                onClick={() => setFiltroEstatus(estado as Estatus | 'Todos')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border ${
                  filtroEstatus === estado ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {estado}
              </button>
            ))}
          </div>
          <div className='bg-gray-100 rounded-xl px-5 p-5' >
            <h2 className='text-[#637381] pb-3 text-2xl'> Filtro popietario</h2>
            {['Todos', ...propietariosOptions].map((propietario) => (
              <button
                key={propietario}
                onClick={() => setFiltroPropietario(propietario as Propietarios | 'Todos')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border ${
                  filtroPropietario === propietario ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {propietario}
              </button>
              ))}
          </div>
          <div></div>
        </div>
        <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Buscar etapa"
              value={busquedaEtapa}
              onChange={(e) => setBusquedaEtapa(e.target.value)}
              className="px-4 py-2 border rounded-lg text-base w-full"
            />
            <input
              type="text"
              placeholder="Buscar manzana"
              value={busquedaManzana}
              onChange={(e) => setBusquedaManzana(e.target.value)}
              className="px-4 py-2 border rounded-lg text-base w-full"
            />
            <input
              type="text"
              placeholder="Buscar lote"
              value={busquedaLote}
              onChange={(e) => setBusquedaLote(e.target.value)}
              className="px-4 py-2 border rounded-lg text-base w-full"
            />
          </div>
          <button
            onClick={() => {
              setMostrarFormulario(true)
              setModoEdicion(null)
              setNuevoLote({ folio: '', etapa: '', manzana: '', lote: '', superficie: '', propietario: 'CESAR', estatus: 'Disponible' })
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
            {lotesPaginados.map((lote) => (
              <tr key={lote.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">{lote.folio}</td>
                <td className="px-4 py-3">{lote.etapa}</td>
                <td className="px-4 py-3">{lote.manzana}</td>
                <td className="px-4 py-3">{lote.lote}</td>
                <td className="px-4 py-3">{lote.superficie}</td>
                <td className="px-4 py-3">{lote.propietario}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${estatusColors[lote.estatus]}`}>{lote.estatus}</span>
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
                <td colSpan={8} className="text-center py-6 text-gray-500">No se encontraron lotes.</td>
              </tr>
            )}
          </tbody>
        </table>

        <TablePagination
          component="div"
          count={lotesFiltrados.length}
          page={paginaAUsar}
          onPageChange={(_, newPage) => setPaginaActual(newPage)}
          rowsPerPage={filasPorPagina}
          onRowsPerPageChange={(event) => {
            setFilasPorPagina(parseInt(event.target.value, 10))
            setPaginaActual(0)
          }}
          labelRowsPerPage="Lotes por página:"
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </div>

      {/* Modal */}
      {mostrarFormulario && (
        <div className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold">{modoEdicion ? 'Editar lote' : 'Agregar lote'}</h2>

            <div className="space-y-3">
              {["folio", "etapa", "manzana", "lote", "superficie"].map((field) => (
                <input
                  key={field}
                  type="text"
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  value={nuevoLote[field as keyof Lote] as string || ''}
                  onChange={(e) => setNuevoLote({ ...nuevoLote, [field]: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              ))}
              <select
                value={nuevoLote.propietario}
                onChange={(e) => setNuevoLote({ ...nuevoLote, propietario: e.target.value as Propietarios })}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                {propietariosOptions.map((item) => (
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
              >Cancelar</button>
              <button
                onClick={handleGuardarLote}
                className="bg-blue-600 text-white px-4 py-2 text-sm rounded hover:bg-blue-700"
              >{modoEdicion ? 'Actualizar' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}