'use client'

import { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthRedirect } from '../../hooks/useAuthRedirect'
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
  Select,
  MenuItem,
  useMediaQuery,
  useTheme,
  Grid,
  DialogActions
} from "@mui/material"
import { useForm, Controller } from 'react-hook-form'
// Tipos

type Estatus = 'Vendido' | 'Donado' | 'Apartado' | 'Disponible' | 'No disponible'
type Propietarios = 'CESAR' | 'JAIME' | 'LC'
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
const propietariosOptions: Propietarios[] = ['CESAR', 'JAIME', 'LC']

const estatusColors: Record<Estatus, string> = {
  Vendido: 'bg-red-100 text-red-700',
  Donado: 'bg-blue-100 text-blue-700',
  Apartado: 'bg-yellow-100 text-yellow-700',
  Disponible: 'bg-green-100 text-green-700',
  "No disponible": 'bg-gray-200 text-gray-700'
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

  const [paginaActual, setPaginaActual] = useState(1)
  const filasPorPagina = 15
  const [filtroEstatus, setFiltroEstatus] = useState<Estatus | 'Todos'>('Todos')
  const [busquedaLote, setBusquedaLote] = useState('')
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))


  const [mensaje, setMensaje] = useState<{ texto: string, tipo: 'success' | 'error' } | null>(null)

  const { register, handleSubmit, reset, control } = useForm<Partial<Lote>>({
    defaultValues: {
      folio: '',
      etapa: '',
      manzana: '',
      lote: '',
      superficie: 0,
      propietario: 'CESAR',   // ← Valor inicial para propietario
      estatus: 'Disponible',   // ← Valor inicial para estatus
      observacion: '',
    }
  })

  const cargarLotes = async () => {
    const { data, error } = await supabase.from('lote').select('*').order('folio', { ascending: true })
    if (!error && data) setLotes(data as Lote[])
  }



  useEffect(() => {
    cargarLotes()
  }, [])

  const onSubmit = async (nuevoLote: Partial<Lote>) => {
    console.log("Entre")
  
    if (!nuevoLote.folio || !nuevoLote.etapa || !nuevoLote.lote || !nuevoLote.superficie) {
      return alert('Todos los campos obligatorios deben estar completos')
    }
  
    if (modoEdicion) {
      nuevoLote.id = modoEdicion.id
    }
  
    const { data: existente } = await supabase
      .from('lote')
      .select('folio')
      .eq('folio', nuevoLote.folio)
  
    if (!modoEdicion && existente && existente.length > 0) {
      return alert('Ya existe un lote con ese folio')
    }
  
    const { error } = modoEdicion
      ? await supabase.from('lote').update({
          folio: nuevoLote.folio,
          etapa: nuevoLote.etapa,
          manzana: nuevoLote.manzana,
          lote: nuevoLote.lote,
          superficie: nuevoLote.superficie,
          propietario: nuevoLote.propietario,
          estatus: nuevoLote.estatus,
          observacion: nuevoLote.observacion
        }).eq('id', modoEdicion.id)
      : await supabase.from('lote').insert([nuevoLote])
  
    if (error) return alert('Error al guardar: ' + error.message)
  
    setMostrarFormulario(false)
    setModoEdicion(null)
    reset()
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

  const eliminarLote = async (loteId: number) => {
    const confirmacion = confirm('¿Estás seguro que deseas eliminar este lote?')
    if (!confirmacion) return
  
    const { error } = await supabase.from('lote').delete().eq('id', loteId)
    if (!error) {
      setMensaje({ texto: 'Lote eliminado correctamente.', tipo: 'success' })
      await cargarLotes()
    } else {
      setMensaje({ texto: 'Error al eliminar el lote.', tipo: 'error' })
    }

    setTimeout(() => setMensaje(null), 3000) // Borra el mensaje después de 3s
    setPaginaActual(1)
  }

  const inicio = (paginaActual - 1) * filasPorPagina
  const fin = inicio + filasPorPagina
  const lotesPaginados = lotesFiltrados.slice(inicio, fin)
  const totalPaginas = Math.ceil(lotesFiltrados.length / filasPorPagina)

  if (!isReady) return <div className="flex items-center justify-center min-h-screen text-gray-500">Cargando...</div>

  return (
    <Box maxWidth="1200px" mx="auto" py={4} px={2}>
      <Typography variant="h4" fontWeight="bold" mb={3}> Lotes </Typography>
      {mensaje && (
        <Alert severity={mensaje.tipo} className="mb-4"> {mensaje.texto} </Alert>
      )}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent={{ md: "space-between" }} gap={2} mb={3} >
          <Box display="flex" flexDirection={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent={{ md: "space-between" }} gap={2} >
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
                ['Todos', ...estatusOptions].map((estado) => (
                  <button
                    key={estado}
                    onClick={() => setFiltroEstatus(estado as Estatus | 'Todos')}
                    className={`px-4 h-7 rounded-md text-sm font-medium border ${
                      filtroEstatus === estado ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {estado}
                  </button>
                ))
              )}              
            </div>
            <div className='bg-gray-100 rounded-xl px-5 p-5' >
              <h2 className='text-[#637381] pb-3 text-2xl'> Filtro popietario</h2>
              {isMobile ? (
                <Box width="100%">
                  <Select
                    value={filtroPropietario}
                    onChange={(e) => setFiltroEstatus(e.target.value as Estatus | 'Todos')}
                    displayEmpty
                    fullWidth
                  >
                    {['Todos', ...propietariosOptions].map((item) => (
                      <MenuItem key={item} value={item}> {item} </MenuItem> 
                    ))}
                  </Select>
                </Box>
              ) : (
              ['Todos', ...propietariosOptions].map((propietario) => (
                <button
                  key={propietario}
                  onClick={() => setFiltroPropietario(propietario as Propietarios | 'Todos')}
                  className={`px-4 rounded-full text-sm font-medium border ${
                    filtroPropietario === propietario ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {propietario}
                </button>
                ))
              )}
            </div>      
          </Box>
        </Box>
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent={{ md: "space-between" }} gap={2} mb={3} >
          <TextField type="Search" sx={{ minWidth: 200, maxWidth:1200 }} value={busquedaEtapa} onChange={(e) => setBusquedaEtapa(e.target.value)} size="small" placeholder='Buscar etapa' />
          <TextField type="Search" sx={{ minWidth: 200 }} value={busquedaManzana} onChange={(e) => setBusquedaManzana(e.target.value)} size="small" placeholder='Buscar manzana' />
          <TextField type="Search" sx={{ minWidth: 200 }} value={busquedaLote} onChange={(e) => setBusquedaLote(e.target.value)} size="small" placeholder='Buscar lote' />
          <Button variant="contained" color="primary" onClick={() => {
            setModoEdicion(null)
            reset({
              folio: '',
              etapa: '',
              manzana: '',
              lote: '',
              superficie: 0,
              propietario: 'CESAR',
              estatus: 'Disponible'
            })
            setMostrarFormulario(true)
            }}> Agregar lote </Button>
        </Box>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                <TableCell>Folio</TableCell>
                <TableCell>Etapa</TableCell>
                <TableCell>Manzana</TableCell>
                <TableCell>Lote</TableCell>
                <TableCell>Superficie</TableCell>
                <TableCell>Propietario</TableCell>
                <TableCell>Estatus</TableCell>
                <TableCell>Observaciones</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lotesPaginados.map((m) => (
                <TableRow key={m.id} hover>
                  <TableCell>{m.folio} </TableCell>
                  <TableCell>{m.etapa}</TableCell>
                  <TableCell>{m.manzana}</TableCell>
                  <TableCell>{m.lote}</TableCell>
                  <TableCell>{m.superficie.toFixed(2)}</TableCell>
                  <TableCell>{m.propietario}</TableCell>
                  <TableCell><span className={`px-2 py-1 rounded-full text-xs font-medium ${estatusColors[m.estatus]}`}>{m.estatus}</span></TableCell>
                  <TableCell>{m.observacion}</TableCell>
                  <TableCell>
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
                      <IconButton size="small" color="error" onClick={() => eliminarLote(m.id)}>
                        <Trash2 size={18} />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {lotesPaginados.length === 0 && (
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
              Mostrando {inicio + 1}-{Math.min(fin, lotesFiltrados.length)} de {lotesFiltrados.length}
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
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ flexGrow: 1 }}>
            <DialogTitle>{modoEdicion ? "Editar lote" : "Agregar lote"} </DialogTitle>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  {/* FOLIO */}
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      required
                      id="folio"
                      label="Folio"
                      {...register("folio", { required: true })}
                    />
                  </Grid>
                  {/* ETAPA */}
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      required
                      id="etapa"
                      label="Etapa"
                      {...register("etapa", { required: true })}
                    />
                  </Grid>
                  {/* MANZANA */}
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      required
                      id="manzana"
                      label="Manzana"
                      {...register("manzana", { required: true })}
                    />
                  </Grid>

                  {/* LOTE */}
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      required
                      id="lote"
                      label="Lote"
                      {...register("lote", { required: true })}
                    />
                  </Grid>

                  {/* SUPERFICIE */}
                  <Grid size={4}>
                    <TextField
                      fullWidth
                      required
                      id="superficie"
                      label="Superficie"
                      {...register("superficie", { required: true })}
                    />
                  </Grid>

                  {/* PROPIETARIO */}
                  <Grid size={4}>
                    <Controller
                      name="propietario"
                      control={control}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          fullWidth
                          label="Propietario"
                        >
                          {propietariosOptions.map((item) => (
                            <MenuItem key={item} value={item}>
                              {item}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </Grid>

                  {/* ESTATUS */}
                  <Grid size={4}>
                    <Controller
                      name="estatus"
                      control={control}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          fullWidth
                          label="Estatus"
                        >
                          {estatusOptions.map((item) => (
                            <MenuItem key={item} value={item}>
                              {item}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </Grid>
                  <Grid size={12}>
                    <TextField
                        id="observacion"
                        label="Observaciones"
                        {...register("observacion")}
                      />
                    </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button variant="outlined" type="button" onClick={() => setMostrarFormulario(false)}>
                    Cancelar
                  </Button>
                  <Button variant="contained" color="primary" type="submit">
                    {modoEdicion ? "Actualizar" : "Guardar"}
                  </Button>
              
            </DialogActions>
          </Box>
        </Dialog>
      </Paper>
    </Box>    
  )
}