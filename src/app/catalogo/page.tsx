'use client'

import { supabase } from '../../lib/supabase'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Pencil, Trash2 } from 'lucide-react'
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Checkbox,
  TableContainer,
  IconButton,
  Typography,
  Pagination,
  Alert
} from '@mui/material'

type Gasto = {
  id: number
  descripcion: string
  fijo: boolean
}

export default function GastosPage() {
    const [filtro, setFiltro] = useState<'Todos' | 'Fijos' | 'Variables'>('Todos')
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    // const [descripcion, setDescripcion] = useState('')
    const [fijo, setFijo] = useState(false)
    const [gasto, setGasto] = useState<Gasto[]>([])
    const [modoEdicion, setModoEdicion] = useState<Gasto | null>(null)
    const [mensaje, setMensaje] = useState<{ texto: string, tipo: 'success' | 'error' } | null>(null)
    const [paginaActual, setPaginaActual] = useState(1)
    const filasPorPagina = 15


    const { register, handleSubmit, reset } = useForm<Partial<Gasto>>({
        defaultValues: {
        descripcion: '',
        fijo: false,
        }
    })

    const gastosFiltrados = gasto.filter(gasto => {
        if (filtro === 'Todos') return true
        if (filtro === 'Fijos') return gasto.fijo
        if (filtro === 'Variables') return !gasto.fijo
        return true
    })

    const cargarDatos = async () => {
        const { data, error } = await supabase.from('tipo_gasto').select('*')
        if (!error && data) setGasto(data as Gasto[])
    }

    useEffect(() => {
        cargarDatos()
    }, [])

    const onSubmit = async (nuevoGasto: Partial<Gasto>) => {
        if (!nuevoGasto.descripcion || !nuevoGasto.fijo) {
            return alert('Todos los campos obligatorios deben estar completos')
        }

        const { data: existente } = await supabase
        .from('tipo_gasto')
        .select('folio')
        .eq('descripcion', nuevoGasto.descripcion)

        if (!modoEdicion && existente && existente.length > 0) {
        return alert('Ya existe un tipo de gasto con esa descripción')
        }

        const { error } = modoEdicion
        ? await supabase.from('tipo_gasto').update(nuevoGasto).eq('id', nuevoGasto.id)
        : await supabase.from('tipo_gasto').insert([nuevoGasto])

        if (error) return alert('Error al guardar: ' + error.message)

        setMostrarFormulario(false)
        setModoEdicion(null)
        reset()
        cargarDatos()
    }

    const eliminarGasto = async (gastoId: number) => {
    const confirmacion = confirm('¿Estás seguro que deseas eliminar este tipo de gasto?')
    if (!confirmacion) return
    
    const { error } = await supabase.from('tipo_gasto').delete().eq('id', gastoId)
    if (!error) {
        setMensaje({ texto: 'Lote eliminado correctamente.', tipo: 'success' })
        await cargarDatos()
    } else {
        setMensaje({ texto: 'Error al eliminar el lote.', tipo: 'error' })
    }

    setTimeout(() => setMensaje(null), 3000) // Borra el mensaje después de 3s
    setPaginaActual(1)
    }

  const inicio = (paginaActual - 1) * filasPorPagina
  const fin = inicio + filasPorPagina
  const gastoPaginados = gastosFiltrados.slice(inicio, fin)
  const totalPaginas = Math.ceil(gastosFiltrados.length / filasPorPagina)

  return (
    <Box maxWidth="1200px" mx="auto" py={4} px={2}>
      <Typography variant="h4" fontWeight="bold" mb={3}> Catalogo </Typography>
      {mensaje && (
        <Alert severity={mensaje.tipo} className="mb-4"> {mensaje.texto} </Alert>
      )}
      <Paper>
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent={{ md: "space-between" }} gap={2} mb={3} >
          <Box display="flex" flexDirection={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent={{ md: "space-between" }} gap={2} >
          {['Todos', 'Fijos', 'Variables'].map(tipo => (
            <Button key={tipo} 
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              filtro === tipo 
                ? 'bg-black text-white hover:bg-black'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
              onClick={() => setFiltro(tipo as 'Todos' | 'Fijos' | 'Variables')}> 
              {tipo} 
            </Button>
          ))}
            <Button variant="contained" color="primary" onClick={() => setMostrarFormulario(true)}>
              Agregar gasto
            </Button>
          </Box>
        </Box>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                <TableCell>Descripción</TableCell>
                <TableCell>Fijo</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
            {gastoPaginados.map((m) => (
              <TableRow key={m.id} hover>
                <TableCell>{m.descripcion} </TableCell>
                <TableCell>{m.fijo}</TableCell>                        
                <Box display="flex" gap={1}>
                    <IconButton
                    size="small"
                    color="primary"
                    onClick={() => {
                        setModoEdicion(m)
                        reset(m)
                        setMostrarFormulario(true)
                    }}
                    >
                    <Pencil size={18} />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => eliminarGasto(m.id)}>
                    <Trash2 size={18} />
                    </IconButton>
                </Box>
              </TableRow>
            ))}
            {gastoPaginados.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3, color: "text.secondary" }}>
                  No hay tipo de movimientos registrados.
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
              Mostrando {inicio + 1}-{Math.min(fin, gastosFiltrados.length)} de {gastosFiltrados.length}
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
        {/* Modal Formulario */}
        <Dialog open={mostrarFormulario} fullWidth maxWidth="sm">
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ flexGrow: 1 }}>
            <DialogTitle>Agregar nuevo gasto</DialogTitle>
            
          </Box>

          <DialogContent dividers>
            <Box display="flex" flexDirection="column" gap={2} mt={1} onSubmit={handleSubmit(onSubmit)}>
              <TextField
                label="Descripción"
                fullWidth
                {...register("descripcion", { required: true })}
              />
              <Box display="flex" alignItems="center" gap={1}>
                <Checkbox checked={fijo} onChange={(e) => setFijo(e.target.checked)} />
                Gasto fijo
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
              <Button variant="outlined" type="button" onClick={() => setMostrarFormulario(false)}> Cancelar </Button>
              <Button variant="contained" color="primary" type="submit"> {modoEdicion ? "Actualizar" : "Guardar"} </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  )
}
