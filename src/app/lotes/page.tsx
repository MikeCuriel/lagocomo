'use client'

import { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthRedirect } from '../../hooks/useAuthRedirect'
import {
  TextField, Button, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent,
  Box, Pagination, Alert, Select, MenuItem, useMediaQuery, useTheme, Grid,
  DialogActions
} from "@mui/material"
import { useForm, Controller } from 'react-hook-form'

// Tipos

type Estatus = 'Vendido' | 'Donado' | 'Apartado' | 'Disponible' | 'No disponible'
type Propietarios = 'CESAR' | 'JAIME' | 'LC' | 'JESUS' | 'NOVOA'

type Lote = {
  id: number
  folio: string
  etapa: string
  manzana: string
  lote: string
  superficie: number
  propietario: Propietarios
  estatus: Estatus
  observacion: string
}

const estatusOptions: Estatus[] = ['Vendido', 'Donado', 'Apartado', 'Disponible', 'No disponible']
const propietariosOptions: Propietarios[] = ['CESAR', 'JAIME', 'LC', 'JESUS', 'NOVOA']

const estatusColors: Record<Estatus, string> = {
  Vendido: 'bg-red-100 text-red-700',
  Donado: 'bg-blue-100 text-blue-700',
  Apartado: 'bg-yellow-100 text-yellow-700',
  Disponible: 'bg-green-100 text-green-700',
  'No disponible': 'bg-gray-200 text-gray-700'
}

export default function LotesPage() {
   const isReady = useAuthRedirect()
  const [lotes, setLotes] = useState<Lote[]>([])
  const [busquedaEtapa, setBusquedaEtapa] = useState('')
  const [busquedaManzana, setBusquedaManzana] = useState('')
  const [busquedaLote, setBusquedaLote] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [modoEdicion, setModoEdicion] = useState<Lote | null>(null)
  const [filtroPropietario, setFiltroPropietario] = useState<Propietarios | 'Todos'>('Todos')
  const [paginaActual, setPaginaActual] = useState(1)
  const filasPorPagina = 15
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [mensaje, setMensaje] = useState<{ texto: string, tipo: 'success' | 'error' } | null>(null)
  const [filtroEstatus, setFiltroEstatus] = useState<Estatus | 'Todos'>('Todos')

  const { register, handleSubmit, reset, control } = useForm<Partial<Lote>>({
    defaultValues: {
      folio: '', etapa: '', manzana: '', lote: '', superficie: 0,
      propietario: 'CESAR', estatus: 'Disponible', observacion: ''
    }
  })

const cargarLotes = async () => {
    const { data, error } = await supabase.from('lote').select('*').order('folio')
    if (!error && data) setLotes(data)
  }

  useEffect(() => { cargarLotes() }, [])

  const onSubmit = async (nuevoLote: Partial<Lote>) => {
    if (!nuevoLote.folio || !nuevoLote.etapa || !nuevoLote.lote || !nuevoLote.superficie) {
      return alert('Todos los campos obligatorios deben estar completos')
    }

    if (!modoEdicion) {
      const { data: existente } = await supabase.from('lote').select('folio').eq('folio', nuevoLote.folio)
      if (existente && existente.length > 0) return alert('Ya existe un lote con ese folio')
    }

    const { error } = modoEdicion
      ? await supabase.from('lote').update(nuevoLote).eq('id', modoEdicion.id)
      : await supabase.from('lote').insert([nuevoLote])

    if (error) return alert('Error al guardar: ' + error.message)

    setMostrarFormulario(false)
    setModoEdicion(null)
    reset()
    cargarLotes()
  }

  const eliminarLote = async (id: number) => {
    if (!confirm('¿Estás seguro que deseas eliminar este lote?')) return
    const { error } = await supabase.from('lote').delete().eq('id', id)
    setMensaje({ texto: error ? 'Error al eliminar el lote.' : 'Lote eliminado correctamente.', tipo: error ? 'error' : 'success' })
    cargarLotes()
    setPaginaActual(1)
    setTimeout(() => setMensaje(null), 3000)
  }

  const lotesFiltrados = lotes.filter(lote =>
    lote.etapa.toLowerCase().includes(busquedaEtapa.toLowerCase()) &&
    lote.manzana.toLowerCase().includes(busquedaManzana.toLowerCase()) &&
    lote.lote.toLowerCase().includes(busquedaLote.toLowerCase()) &&
    (filtroEstatus === 'Todos' || lote.estatus === filtroEstatus) &&
    (filtroPropietario === 'Todos' || lote.propietario === filtroPropietario)
  )

  const inicio = (paginaActual - 1) * filasPorPagina
  const fin = inicio + filasPorPagina
  const totalPaginas = Math.ceil(lotesFiltrados.length / filasPorPagina)
  const lotesPaginados = lotesFiltrados.slice(inicio, fin)

  if (!isReady) return <div className="flex items-center justify-center min-h-screen text-gray-500">Cargando...</div>


  return (
    <Box maxWidth="1200px" mx="auto" py={4} px={2}>
      <Typography variant="h4" fontWeight="bold" mb={3}>Lotes</Typography>
      {mensaje && <Alert severity={mensaje.tipo} className="mb-4">{mensaje.texto}</Alert>}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>

        {/* Filtros */}
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent={{ md: "space-between" }} gap={2}>
          <div className='bg-gray-100 rounded-xl px-5 p-5' >
                <h2 className='text-[#637381] pb-3 text-2xl'> Filtro popietario</h2>
                 {isMobile ? (
                  <Box width="100%">
                    <Select value={filtroPropietario}
                            onChange={(e) => setFiltroPropietario(e.target.value as Propietarios | 'Todos')}
                            displayEmpty
                            fullWidth
                            >
                        {['Todos', ...propietariosOptions].map((item) => (
                          <MenuItem key={item} value={item}> {item} </MenuItem> 
                        ))}
                    </Select>
                  </Box>
                  ) : (
                    <div className="flex flex-row flex-wrap gap-2">
                      {['Todos', ...propietariosOptions].map((propietario) => (
                      <button key={propietario}
                        onClick={() => setFiltroPropietario(propietario as Propietarios | 'Todos')}
                        className={`px-4 h-7 rounded-full text-sm font-medium border ${
                        filtroPropietario === propietario ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      >
                      {propietario}
                      </button>
                      ))}
                    </div>
                  )}             
              </div>
              <div className='bg-gray-100 rounded-xl px-5 p-5' >
              <h2 className='text-[#637381] pb-3 text-2xl'> Filtro estatus</h2>
              {isMobile ? (
                <Box width="100%">
                  <Select
                    value={filtroEstatus}
                    onChange={(e) => setFiltroEstatus(e.target.value as Estatus | 'Todos')}
                    displayEmpty
                    fullWidth
                  >
                    {['Todos', ...estatusOptions].map((item) => (
                      <MenuItem key={item} value={item}> {item} </MenuItem> 
                    ))}
                  </Select>
                </Box>
              ) : (
                <div className="flex flex-row flex-wrap gap-2">
                  {['Todos', ...estatusOptions].map((estado) => (
                    <button
                      key={estado}
                      onClick={() => setFiltroEstatus(estado as Estatus | 'Todos')}
                      className={`px-4 h-7 rounded-full text-sm font-medium border ${
                        filtroEstatus === estado ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {estado}
                    </button>
                  ))}
                </div>
              )}
            </div>
        </Box>

        {/* Buscadores y Agregar */}
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent={{ md: "space-between" }} gap={2} mb={3} padding={1}>
          <TextField size="small" label="Buscar etapa" value={busquedaEtapa} onChange={(e) => setBusquedaEtapa(e.target.value)} />
          <TextField size="small" label="Buscar manzana" value={busquedaManzana} onChange={(e) => setBusquedaManzana(e.target.value)} />
          <TextField size="small" label="Buscar lote" value={busquedaLote} onChange={(e) => setBusquedaLote(e.target.value)} />
          <Button variant="contained" onClick={() => {
            setModoEdicion(null)
            reset()
            setMostrarFormulario(true)
          }}>Agregar lote</Button>
        </Box>

        {/* Tabla */}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Folio', 'Etapa', 'Manzana', 'Lote', 'Superficie', 'Propietario', 'Estatus', 'Observaciones', 'Acciones'].map(h => (
                  <TableCell key={h}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {lotesPaginados.map(l => (
                <TableRow key={l.id} hover>
                  <TableCell>{l.folio}</TableCell>
                  <TableCell>{l.etapa}</TableCell>
                  <TableCell>{l.manzana}</TableCell>
                  <TableCell>{l.lote}</TableCell>
                  <TableCell>{l.superficie.toFixed(2)}</TableCell>
                  <TableCell>{l.propietario}</TableCell>
                  <TableCell><span className={`px-2 py-1 rounded-full text-xs font-medium ${estatusColors[l.estatus]}`}>{l.estatus}</span></TableCell>
                  <TableCell>{l.observacion}</TableCell>
                  <TableCell>
                    <IconButton size="small" color="primary" onClick={() => {
                          reset(l)
                          setModoEdicion(l)
                          setMostrarFormulario(true)
                        }}>
                          <Pencil size={18} />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => eliminarLote(l.id)}><Trash2 size={18} /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {lotesPaginados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">No hay movimientos registrados.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <Box mt={2} display="flex" justifyContent="space-between">
            <Typography variant="body2">
              Mostrando {inicio + 1}-{Math.min(fin, lotesFiltrados.length)} de {lotesFiltrados.length}
            </Typography>
            <Pagination count={totalPaginas} page={paginaActual} onChange={(_, p) => setPaginaActual(p)} />
          </Box>
        )}

{/* Modal para agregar o editar lote */}
        <Dialog open={mostrarFormulario} fullWidth maxWidth="sm" onClose={() => setMostrarFormulario(false)}>
          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <DialogTitle>{modoEdicion ? 'Editar lote' : 'Agregar lote'}</DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                {['folio', 'etapa', 'manzana', 'lote'].map((field) => (
                  <Grid size={{xs: 12, sm: 6}} key={field}>
                    <TextField
                      label={field.charAt(0).toUpperCase() + field.slice(1)}
                      fullWidth
                      {...register(field as keyof Lote, { required: true })}
                    />
                  </Grid>
                ))}

                <Grid size={{xs: 12, sm: 4}}>
                  <TextField
                    label="Superficie"
                    fullWidth
                    inputProps={{ step: "0.01" }}
                    type="number"
                    {...register("superficie", { required: true })}
                  />
                </Grid>

                <Grid size={{xs: 12, sm: 4}}>
                  <Controller
                    name="propietario"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <TextField select fullWidth label="Propietario" {...field}>
                        {propietariosOptions.map((option) => (
                          <MenuItem key={option} value={option}>{option}</MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>

                <Grid size={{xs: 12, sm: 4}}>
                  <Controller
                    name="estatus"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <TextField select fullWidth label="Estatus" {...field}>
                        {estatusOptions.map((option) => (
                          <MenuItem key={option} value={option}>{option}</MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>

                <Grid size={12}>
                  <TextField
                    label="Observaciones"
                    fullWidth
                    multiline
                    minRows={2}
                    {...register("observacion")}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setMostrarFormulario(false)}>Cancelar</Button>
              <Button type="submit" variant="contained">{modoEdicion ? 'Actualizar' : 'Guardar'}</Button>
            </DialogActions>
          </Box>
        </Dialog>
      </Paper>
    </Box>
  )
}
