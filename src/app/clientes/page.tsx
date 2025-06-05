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
  DialogActions,
  Box,
  Pagination,
  Alert,
} from '@mui/material'
import { useForm } from 'react-hook-form'
import { useAuthRedirect } from '../../hooks/useAuthRedirect'

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
  const [paginaActual, setPaginaActual] = useState(1)
  const filasPorPagina = 15
  const [ordenColumna, setOrdenColumna] = useState<keyof Cliente | null>(null)
  const [ordenAscendente, setOrdenAscendente] = useState(true)

  const { register, handleSubmit, reset } = useForm<Partial<Cliente>>()

  useEffect(() => {
    cargarClientes()
  }, [])

  const cargarClientes = async () => {
    const { data } = await supabase.from('cliente').select('*')
    if (data) setClientes(data)
  }

  const mostrarMensajeTemporal = (texto: string, tipo: 'success' | 'error') => {
    setMensaje({ texto, tipo })
    setTimeout(() => setMensaje(null), 3000)
  }

  const onSubmit = async (formData: Partial<Cliente>) => {
    if (modoEdicion) {
      await supabase.from('cliente').update(formData).eq('id', modoEdicion.id)
      mostrarMensajeTemporal('Cliente actualizado correctamente.', 'success')
    } else {
      await supabase.from('cliente').insert(formData)
      mostrarMensajeTemporal('Cliente agregado exitosamente.', 'success')
    }

    reset()
    setMostrarFormulario(false)
    setModoEdicion(null)
    await cargarClientes()
  }

  const eliminarCliente = async (clienteId: number) => {
    if (!confirm('¿Estás seguro que deseas eliminar este cliente?')) return
    const { error } = await supabase.from('cliente').delete().eq('id', clienteId)
    if (error) mostrarMensajeTemporal('Error al eliminar el cliente.', 'error')
    else {
      mostrarMensajeTemporal('Cliente eliminado correctamente.', 'success')
      await cargarClientes()
    }
  }

  const ordenarClientes = (lista: Cliente[]) => {
    if (!ordenColumna) return lista
    const normalizar = (texto: string) =>
      texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

    return [...lista].sort((a, b) => {
      const valA = normalizar(`${a[ordenColumna] ?? ''}`)
      const valB = normalizar(`${b[ordenColumna] ?? ''}`)
      return ordenAscendente ? valA.localeCompare(valB) : valB.localeCompare(valA)
    })
  }

  const clienteFiltrado = ordenarClientes(
    clientes.filter(c =>
      `${c.nombre} ${c.apellido}`.toLowerCase().includes(busqueda.toLowerCase())
    )
  )

  useEffect(() => {
    setPaginaActual(1)
  }, [busqueda])

  if (!isReady) return <div className="flex items-center justify-center min-h-screen text-gray-500">Cargando...</div>

  const inicio = (paginaActual - 1) * filasPorPagina
  const fin = inicio + filasPorPagina
  const clientesPaginados = clienteFiltrado.slice(inicio, fin)
  const totalPaginas = Math.ceil(clienteFiltrado.length / filasPorPagina)

  return (
    <Box maxWidth="1200px" mx="auto" py={4} px={2}>
      <Typography variant="h4" fontWeight="bold" mb={3}>Clientes</Typography>
      {mensaje && <Alert severity={mensaje.tipo} className="mb-4">{mensaje.texto}</Alert>}

      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
          <TextField
            type="search"
            placeholder="Buscar cliente"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            size="small"
            sx={{ width: 300 }}
          />
          <Button variant="contained" onClick={() => {
            setModoEdicion(null)
            reset()
            setMostrarFormulario(true)
          }}>Agregar cliente</Button>
        </Box>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                {[
                  { label: 'Nombre', key: 'nombre' },
                  { label: 'Correo', key: 'correo' },
                  { label: 'Teléfono', key: 'telefono' },
                  { label: 'Dirección', key: 'direccion' },
                ].map(({ label, key }) => (
                  <TableCell
                    key={key}
                    onClick={() => {
                      setOrdenColumna(key as keyof Cliente)
                      setOrdenAscendente(prev => ordenColumna === key ? !prev : true)
                    }}
                    sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    {label} {ordenColumna === key && (ordenAscendente ? '▲' : '▼')}
                  </TableCell>
                ))}
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clientesPaginados.length > 0 ? (
                clientesPaginados.map((m) => (
                  <TableRow key={m.id} hover>
                    <TableCell>{m.nombre} {m.apellido}</TableCell>
                    <TableCell>{m.correo}</TableCell>
                    <TableCell>{m.telefono}</TableCell>
                    <TableCell>{m.direccion}</TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <IconButton size="small" color="primary" onClick={() => {
                          reset(m)
                          setModoEdicion(m)
                          setMostrarFormulario(true)
                        }}>
                          <Pencil size={18} />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => eliminarCliente(m.id)}>
                          <Trash2 size={18} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    No hay movimientos registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

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
      </Paper>

      <Dialog open={mostrarFormulario} fullWidth maxWidth="sm" onClose={() => setMostrarFormulario(false)}>
        <DialogTitle>{modoEdicion ? 'Editar cliente' : 'Agregar cliente'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent dividers>
            <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2}>
              <TextField label="Nombre" {...register('nombre', { required: true })} required />
              <TextField label="Apellido" {...register('apellido', { required: true })} required />
              <TextField label="Correo" type="email" {...register('correo', { required: true })} required />
              <TextField label="Teléfono" {...register('telefono', { required: true })} required />
              <TextField label="Dirección" {...register('direccion', { required: true })} required fullWidth sx={{ gridColumn: 'span 2' }} />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMostrarFormulario(false)}>Cancelar</Button>
            <Button type="submit" variant="contained">{modoEdicion ? 'Actualizar' : 'Guardar'}</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  )
}
