'use client'

import { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import {
  TextField,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Pagination,
  Alert,
} from "@mui/material"
import { useForm } from 'react-hook-form'
import { useAuthRedirect } from '../../hooks/useAuthRedirect'

// Tipos

type Cliente = {
  id: number
  nombre: string
  apellido: string
  correo: string
  telefono: string
  direccion: string
}

export default function ClientesPage() {
  const isReady = useAuthRedirect()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [modoEdicion, setModoEdicion] = useState<Cliente | null>(null)
  const [mensaje, setMensaje] = useState<{ texto: string, tipo: 'success' | 'error' } | null>(null)
  const [pagina, setPagina] = useState(0)


  const [paginaActual, setPaginaActual] = useState(1)
  const filasPorPagina = 15


  const handleChangePage = (_: unknown, nuevaPagina: number) => {
    setPagina(nuevaPagina)
  }
  

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
      setMensaje({ texto: 'Cliente actualizado correctamente.', tipo: 'success' })
    } else {
      await supabase.from('cliente').insert(formData)
      setMensaje({ texto: 'Cliente agregado exitosamente.', tipo: 'success' })
    }
  
    reset()
    setMostrarFormulario(false)
    setModoEdicion(null)
    await cargarClientes()
  
    setTimeout(() => setMensaje(null), 3000) // Borra el mensaje después de 3s
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

  const clientesMostrados = clienteFiltrado.slice(
    pagina * filasPorPagina,
    pagina * filasPorPagina + filasPorPagina
  )

  const eliminarCliente = async (clienteId: number) => {
    const confirmacion = confirm('¿Estás seguro que deseas eliminar este cliente?')
    if (!confirmacion) return
  
    const { error } = await supabase.from('cliente').delete().eq('id', clienteId)
    if (!error) {
      setMensaje({ texto: 'Cliente eliminado correctamente.', tipo: 'success' })
      await cargarClientes()
    } else {
      setMensaje({ texto: 'Error al eliminar el cliente.', tipo: 'error' })
    }
  }

  const inicio = (paginaActual - 1) * filasPorPagina
  const fin = inicio + filasPorPagina
  const clientesPaginados = clienteFiltrado.slice(inicio, fin)
  const totalPaginas = Math.ceil(clienteFiltrado.length / filasPorPagina)



  return (
    <Box maxWidth="1200px" mx="auto" py={4} px={2}>
      <Typography variant="h4" fontWeight="bold" mb={3}> Clientes </Typography>
      {mensaje && (
        <Alert severity={mensaje.tipo} className="mb-4"> {mensaje.texto} </Alert>
      )}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent={{ md: "space-between" }} gap={2} mb={3} >
          <Box display="flex" flexWrap="wrap" alignItems="center" gap={1}>
            <TextField type="search" placeholder="Buscar cliente" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} size="small" sx={{ minWidth:200, width: 500, maxWidth:900 }} />
          </Box>
          <Button variant="contained" color="primary" onClick={() => {
                setModoEdicion(null)       // Primero limpia el modo edición
                reset({                    // Luego limpia el formulario
                  nombre: '',
                  apellido: '',
                  correo: '',
                  telefono: '',
                  direccion: '',
                })
                setMostrarFormulario(true) // Por último muestra el modal
              }}> Agregar cliente </Button>
        </Box>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                <TableCell>Nombre</TableCell>
                <TableCell>Correo</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell>Dirección</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clientesPaginados.map((m) => (
                <TableRow key={m.id} hover>
                  <TableCell>{m.nombre} {m.apellido}</TableCell>
                  <TableCell>{m.correo}</TableCell>
                  <TableCell>{m.telefono}</TableCell>
                  <TableCell>{m.direccion}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => {
                          reset(m)
                          setModoEdicion(m)
                          setMostrarFormulario(true)
                        }}
                      >
                        <Pencil size={18} />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => eliminarCliente(m.id)}>
                        <Trash2 size={18} />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {clientesPaginados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3, color: "text.secondary" }}>
                    No hay movimientos registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
            <Typography variant="body2">
              Mostrando {inicio + 1}-{Math.min(fin, clienteFiltrado.length)} de {clienteFiltrado.length}
            </Typography>
            <Pagination
              count={totalPaginas}
              page={paginaActual}
              onChange={(_, page) => setPaginaActual(page)}
              color="primary"
              size="small"
            />
          </Box>
        )}

        {/* Modal para agregar/editar movimiento */}
        <Dialog open={mostrarFormulario} fullWidth maxWidth="sm">
          <DialogTitle>{modoEdicion ? "Editar movimiento" : "Agregar movimiento"}
            <DialogContent dividers>
              <Box display="flex" flexDirection="column" gap={2}>
                <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-2">
                  <TextField required id="outlined-select-required" label="Nombre" {...register("nombre", { required: true })}/>
                  <TextField required id="outlined-select-required" label="Apellido" {...register("apellido", { required: true })}/>
                  <TextField type='email' required id="outlined-select-required" label="Correo" {...register("correo", { required: true })}/>
                  <TextField required id="outlined-select-required" label="Telefono" {...register("telefono", { required: true })}/>
                  <TextField className='col-span-2' required id="outlined-select-required" label="Direccion" {...register("direccion", { required: true })}/>

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
              </Box>
            </DialogContent>

          </DialogTitle>
        </Dialog>

      </Paper>



    </Box>

  )
}