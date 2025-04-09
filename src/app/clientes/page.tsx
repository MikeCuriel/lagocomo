'use client'

import { useEffect, useState } from 'react'
import { Pencil } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { TextField, Alert } from '@mui/material'
import { useForm } from 'react-hook-form'
import { useAuthRedirect } from '../../hooks/useAuthRedirect'

// Tipos

type Cliente = {
  id: number
  nombre: string
  apellido: string
  correo: string
  telefono: string
}

export default function ClientesPage() {
  const isReady = useAuthRedirect()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [modoEdicion, setModoEdicion] = useState<Cliente | null>(null)
  const [mensaje, setMensaje] = useState('')

  const {
    register,
    handleSubmit,
    reset,
  } = useForm<Partial<Cliente>>()

  const cargarClientes = async () => {
    const { data } = await supabase.from('cliente').select('*')
    if (data) setClientes(data)
  }

  useEffect(() => {
    cargarClientes()
  }, [])

  const onSubmit = async (formData: Partial<Cliente>) => {
    if (modoEdicion) {
      await supabase.from('cliente').update(formData).eq('id', modoEdicion.id)
      setMensaje('Cliente actualizado correctamente.')
    } else {
      await supabase.from('cliente').insert(formData)
      setMensaje('Cliente agregado exitosamente.')
    }
  
    reset()
    setMostrarFormulario(false)
    setModoEdicion(null)
    await cargarClientes()
  
    setTimeout(() => setMensaje(''), 3000) // Borra el mensaje después de 3s
  }

  const clienteFiltrado = clientes.filter((c) =>
    `${c.nombre} ${c.apellido}`.toLowerCase().includes(busqueda.toLowerCase())
  )

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Cargando...
      </div>
    )
  }

  return (
    <div className="bg-gray-100 min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Clientes</h1>
        {mensaje && (
          <Alert severity="success" className="mb-4">
            {mensaje}
          </Alert>
        )}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full sm:max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <button
              onClick={() => {
                setModoEdicion(null)       // Primero limpia el modo edición
                reset({                    // Luego limpia el formulario
                  nombre: '',
                  apellido: '',
                  correo: '',
                  telefono: '',
                })
                setMostrarFormulario(true) // Por último muestra el modal
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Agregar cliente
            </button>
          </div>

          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-2">Nombre completo</th>
                <th className="px-4 py-2">Correo</th>
                <th className="px-4 py-2">Teléfono</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clienteFiltrado.map((c) => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{c.nombre} {c.apellido}</td>
                  <td className="px-4 py-2">{c.correo}</td>
                  <td className="px-4 py-2">{c.telefono}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => {
                        reset(c)
                        setModoEdicion(c)
                        setMostrarFormulario(true)
                      }}
                      className="text-gray-500 hover:text-blue-600"
                    >
                      <Pencil size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {clienteFiltrado.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-gray-500 py-6">
                    No se encontraron clientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {mostrarFormulario && (
          <div className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl space-y-4">
              <h2 className="text-lg font-semibold">
                {modoEdicion ? 'Editar cliente' : 'Agregar cliente'}
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-2">
                <TextField required id="outlined-select-required" label="Nombre" {...register("nombre", { required: true })}/>
                <TextField required id="outlined-select-required" label="Apellido" {...register("apellido", { required: true })}/>
                <TextField type='email' required id="outlined-select-required" label="Correo" {...register("correo", { required: true })}/>
                <TextField required id="outlined-select-required" label="Telefono" {...register("telefono", { required: true })}/>

                <div className="flex justify-end col-span-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMostrarFormulario(false)}
                    className="px-4 py-2 text-sm rounded hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 text-sm rounded hover:bg-blue-700"
                  >
                    {modoEdicion ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}