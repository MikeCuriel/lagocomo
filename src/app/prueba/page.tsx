'use client'

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
  DialogActions,
  FormControl,
  Autocomplete,
  FormControlLabel,
  Checkbox,
  CircularProgress
} from "@mui/material"
import { useCallback, useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import dayjs from 'dayjs'
import { Add } from '@mui/icons-material'
import { Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type Propietarios = 'CESAR' | 'JAIME' | 'LC' | 'JESUS' | 'NOVOA'
const propietariosOptions: Propietarios[] = ['CESAR', 'JAIME', 'LC', 'JESUS', 'NOVOA']

interface Resumen {
  venta_id: number
  nombre: string
  apellido: string
  propietario: string
  etapa: string
  manzana: string
  lote: string
  fecha: string
  total: number
  numero_pagos: number
  pago_mensual: number
  total_pagado: number
  total_real: number
  etapa_num: number
  lote_num: number
  ultimo_pago_fecha: Date
}

interface Cliente {
  id: number
  nombre: string
  apellido: string
  correo: string
  telefono: string
}

interface Lote {
  id: number
  folio: string
  manzana: string
  etapa: string
  lote: string
  superficie: number
  estatus: string
  propietario: string
}

interface Venta {
  id: number
  total: number
  cliente_id: number
  lote_id: number
  fecha: string
  numero_pagos: number
  pago_mensual: number
  precioMetro: number
  cliente?: Cliente
  lote?: Lote
  bono: number
  admin: number
  admin_venta: number
  ventasDet? : VentaDet
}

interface VentaDet{
  fecha_pago : Date
}

export default function VentasPage() {
    const router = useRouter()
    const [paginaActual, setPaginaActual] = useState(1)
    const [filasPorPagina] = useState(10)
    const [totalRegistros, setTotalRegistros] = useState(0)
    const [filtroPropietario, setFiltroPropietario] = useState<'Todos' | 'JAIME' | 'CESAR' | 'LC' | 'JESUS' | 'NOVOA' >('Todos')
    const [mensaje, setMensaje] = useState<{ texto: string, tipo: 'success' | 'error' } | null>(null)
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true })
    const [busquedaEtapa, setBusquedaEtapa] = useState('')
    const [busquedaManzana, setBusquedaManzana] = useState('')
    const [busquedaLote, setBusquedaLote] = useState('')
    const [mostrarModal, setMostrarModal] = useState(false)
    const [cargandoTabla, setCargandoTabla] = useState(false)
    const [ventas, setVentas] = useState<Resumen[]>([])
    const [modoEdicion, setModoEdicion] = useState<Resumen | null>(null)
    const [lotesDisponibles, setLotesDisponibles] = useState<Lote[]>([])
    const [clientes, setClientes] = useState<Cliente[]>([])
    const [loteSeleccionado, setLoteSeleccionado] = useState<Lote | null>(null)
    const [clienteId, setClienteId] = useState('')
    const [fechaPago, setFechaPago] = useState(dayjs().format('YYYY-MM-DD'))
    const [esquina, setEsquina] = useState(false)
    const [parque, setParque] = useState(false)
    const [bonoVenta, setBonoVenta] = useState(false)
    const [precioFinalM2, setPrecioFinalM2] = useState(0)
    const [enganche, setEnganche] = useState(0)
    const [totalVenta, setTotalVenta] = useState(0)
    const [totalFinanciar, setTotalFinanciar] = useState(0)
    const [pagoMensual, setPagoMensual] = useState(0)
    const [usarEngancheAutomatico, setUsarEngancheAutomatico] = useState(true)
    const [numeroPagos, setNumeroPagos] = useState(1)
    const [precioMetroBase, setPrecioMetroBase] = useState<number | ''>('')
    const [verificado, setVerificado] = useState<boolean | null>(null)

    useEffect(() => {
    const autorizado = document.cookie.includes('auth_lagocomo=true')
    if (!autorizado) {
        setVerificado(false)
        router.replace('/') // mejor que push para auth
        return
    }
    setVerificado(true)
    }, [router])

   const cargarResumen = useCallback(async () => {
    setCargandoTabla(true)
    const from = (paginaActual - 1) * filasPorPagina
    const to = from + filasPorPagina - 1

    try {
        let query = supabase
        .from('vw_resumen')
        .select('*', { count: 'exact' })

        if (filtroPropietario !== 'Todos')
        query = query.eq('propietario', filtroPropietario)

        if (busquedaEtapa)
        query = query.ilike('etapa', `%${busquedaEtapa}%`)

        if (busquedaManzana)
        query = query.ilike('manzana', `%${busquedaManzana}%`)

        if (busquedaLote)
        query = query.ilike('lote', `%${busquedaLote}%`)

        const { data, count, error } = await query
        .order('etapa_num', { ascending: true, nullsFirst: true })
        .order('manzana', { ascending: true, nullsFirst: true })
        .order('lote_num', { ascending: true, nullsFirst: true })
        .range(from, to)

        if (error) throw error

        setVentas((data as Resumen[]) ?? [])
        setTotalRegistros(count ?? 0)
    } catch (e) {
        console.error(e)
    } finally {
        setCargandoTabla(false)
    }
    }, [paginaActual, filasPorPagina, filtroPropietario, busquedaEtapa, busquedaManzana, busquedaLote])


    const cargarCatalogos = useCallback(async () => {
    const [{ data: lotesData }, { data: clientesData }] = await Promise.all([
        supabase.from('lote').select('*').eq('estatus', 'Disponible'),
        supabase.from('cliente').select('*'),
    ])

    setLotesDisponibles((lotesData as Lote[]) ?? [])
    setClientes((clientesData as Cliente[]) ?? [])
    }, [])

    useEffect(() => {
        if (verificado) cargarResumen()
    }, [verificado, cargarResumen])

    useEffect(() => {
        if (mostrarModal) cargarCatalogos()
    }, [mostrarModal, cargarCatalogos])

    const inicio = (paginaActual - 1) * filasPorPagina
    const fin = inicio + filasPorPagina
    const totalPaginas = Math.ceil(totalRegistros / filasPorPagina)
    const ventasPaginados = ventas

    const obtenerEstatusExtendido = (venta: Resumen) => {
        const totalPagado = venta.total_pagado ?? 0
        if(totalPagado === venta.total) return 'Pagado'

        const fechaLimite = dayjs(venta.fecha).add(venta.numero_pagos, 'month')
        const hoy = dayjs()

        return hoy.isAfter(fechaLimite) ? 'Vencido' : 'Pendiente'
    }

    const calcularAvancePago = (venta: Resumen) => {
        const porcentaje = (venta.total_pagado / venta.total_real) * 100;
        return Math.min(Math.round(porcentaje), 100)
    }

      const calcularEstatusYRetraso = (venta: Resumen) => {

        const porcentaje = (venta.total_pagado / venta.total_real) * 100;
        if (porcentaje >= 100) return { estatus: 'Pagado', retraso: 0 }
    
        const ultimaFechaPago = venta.ultimo_pago_fecha
          ? dayjs(venta.ultimo_pago_fecha)
          : dayjs(venta.fecha)    
        const hoy = dayjs()
        const dias = hoy.diff(ultimaFechaPago, 'day')
    
        if (dias <= 30) return { estatus: 'Al corriente', retraso: dias }
        else if (dias <= 60) return { estatus: 'Atrasado', retraso: dias }
        else return { estatus: 'Vencido', retraso: dias }
      }

    const eliminarVenta = async (loteId: number) => {
      const confirmacion = confirm('¿Estás seguro que deseas eliminar la venta, se borraran todos los pagos de la venta?')
      if (!confirmacion) return
    
      const { error } = await supabase.from('venta').delete().eq('id', loteId)
      if (!error) {
        setMensaje({ texto: 'Venta eliminada correctamente.', tipo: 'success' })
        await cargarResumen()
      } else {
        setMensaje({ texto: 'Error al eliminar la venta.', tipo: 'error' })
      }
  
      setTimeout(() => setMensaje(null), 3000) // Borra el mensaje después de 3s
      setPaginaActual(1)
    }

    const { handleSubmit, reset } = useForm<Partial<Venta>>(
      {
      
    defaultValues: {
        total: 0, id: 0, lote_id: 0, fecha: '', numero_pagos: 0, pago_mensual: 0, precioMetro: 0,
        cliente: undefined, lote: undefined, bono: 0, admin: 0, admin_venta: 0, ventasDet: undefined
    },
    
    }
  )

  const calcularPrecio = useCallback(() => {
        if (!loteSeleccionado || precioMetroBase === '') return
        let precio = precioMetroBase
        if (esquina) precio += 100
        if (parque) precio += 100
        if (numeroPagos >= 2 && numeroPagos <= 12) precio += 100
        else if ( numeroPagos >= 2 && numeroPagos <= 24) precio += 200
        else if (numeroPagos >= 2 && numeroPagos <= 36) precio += 300

        const superficie = loteSeleccionado.superficie
        let total = precio * superficie
        setTotalVenta(total)
        if (bonoVenta) total -= 15000

        const engancheDefault = total * 0.25
        const engancheUsado = usarEngancheAutomatico ? engancheDefault : enganche
        const restante = total - engancheUsado

        setTotalFinanciar(restante)
        setPrecioFinalM2(precio)
        setEnganche(usarEngancheAutomatico ? engancheDefault : enganche)
        setPagoMensual(restante / numeroPagos)
      }, [loteSeleccionado, precioMetroBase, esquina, parque, numeroPagos, bonoVenta, usarEngancheAutomatico, enganche])

    useEffect(() => {
      calcularPrecio()
    }, [calcularPrecio])


    const onSubmit = async (nuevaVenta: Partial<Venta>) => {
        if (!loteSeleccionado || !clienteId || precioMetroBase === '' || !fechaPago) {
        toast.error('Faltan datos para guardar la venta')
        return
        }
         if (!modoEdicion) {
              const { data: existente } = await supabase.from('venta').select('lote_id').eq('lote_id', nuevaVenta.lote_id)
              if (existente && existente.length > 0) return alert('Ya existe una venta con ese lote')
            }
        
            if(modoEdicion) {
              await supabase.from('lote').update(nuevaVenta).eq('id', modoEdicion.venta_id)
            }
            else{
              const superficie = loteSeleccionado.superficie
              const precioFinal = precioFinalM2 * superficie
              const bonoAplicado = bonoVenta ? 15000 : 0
              const totalConBono = precioFinal - bonoAplicado
              const usadoEnganche = usarEngancheAutomatico ? totalConBono * 0.25 : enganche
              const restante = totalConBono - usadoEnganche
        
              const { data, error } = await supabase.from('venta').insert({
                lote_id: loteSeleccionado.id,
                cliente_id: Number(clienteId),
                fecha: fechaPago,
                total: precioFinal,
                numero_pagos: numeroPagos,
                pago_mensual: restante / numeroPagos,
                precioMetro: precioFinalM2,
                bono: bonoAplicado,
                admin: totalConBono * 0.02,
                admin_venta: totalConBono * 0.03,
              }).select()
        
              if (error || !data) return toast.error('Error al guardar')
            }
        
            await supabase.from('lote').update({ estatus: 'Vendido' }).eq('id', loteSeleccionado.id)
            toast.success('Venta registrada')
            setMostrarModal(false)
            cargarResumen()
          }

    const formatearMoneda = (valor: number) => `$ ${valor.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`

    if (verificado === null) {
      return (
        <Box className="w-full h-screen flex items-center justify-center">
          <CircularProgress />
        </Box>
      )
    }


    return (
    <Box maxWidth="1800px" mx="auto" py={2} px={2}>
      <Typography variant="h4" fontWeight="bold" mb={3}> Ventas </Typography>
      {mensaje && (
        <Alert severity={mensaje.tipo} className="mb-4"> {mensaje.texto} </Alert>
      )}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent={{ md: "space-between" }} gap={2} mb={3} >
          <Box display="flex" flexDirection={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent={{ md: "space-between" }} gap={2} >
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
            <TextField type="Search" sx={{ minWidth: 200, maxWidth:1200 }} value={busquedaEtapa} onChange={(e) => setBusquedaEtapa(e.target.value)} size="small" placeholder='Buscar etapa' />
            <TextField type="Search" sx={{ minWidth: 200 }} value={busquedaManzana} onChange={(e) => setBusquedaManzana(e.target.value)} size="small" placeholder='Buscar manzana' />
            <TextField type="Search" sx={{ minWidth: 200 }} value={busquedaLote} onChange={(e) => setBusquedaLote(e.target.value)} size="small" placeholder='Buscar lote' />
            <Button variant="contained" color="primary" onClick={() => {
                reset()
                setMostrarModal(true)
                setModoEdicion(null)
              }}> Agregar venta </Button>
          </Box>
        </Box>

        {cargandoTabla && (
          <Box p={2} display="flex" gap={1} alignItems="center">
            <CircularProgress size={18} />
            <Typography variant="body2">Cargando...</Typography>
          </Box>
        )}

         <TableContainer component={Paper} variant="outlined">
            <Table size="small">
                <TableHead>
                    <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                        <TableCell>Cliente</TableCell>
                        <TableCell>Propietario</TableCell>
                        <TableCell>Etapa</TableCell>
                        <TableCell>Manzana</TableCell>
                        <TableCell>Lote</TableCell>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Total</TableCell>
                        <TableCell>Pagos</TableCell>
                        <TableCell>Pago Mensual</TableCell>
                        <TableCell>Pago %</TableCell>
                        <TableCell>Atraso</TableCell>
                        <TableCell>Acciones</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                {ventasPaginados.map((m) => (
                <TableRow key={m.venta_id} hover>
                  <TableCell>{m.nombre} {m.apellido}</TableCell>
                  <TableCell>{m.propietario}</TableCell>
                  <TableCell>{m.etapa}</TableCell>
                  <TableCell>{m.manzana}</TableCell>
                  <TableCell>{m.lote}</TableCell>
                  <TableCell>{dayjs(m.fecha).format('DD/MM/YYYY')}</TableCell>
                  <TableCell>{m.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell>{m.numero_pagos}</TableCell>
                  <TableCell>
                      {m.numero_pagos === 1 ? 'PAGADO' : m.pago_mensual.toLocaleString('en-US', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                  </TableCell>
                  <TableCell><span className={`px-2 py-1 rounded-t-lg text-xs font-medium ${
                    obtenerEstatusExtendido(m) === 'Pagado'
                      ? 'bg-green-100 text-green-700'
                      : obtenerEstatusExtendido(m) === 'Vencido'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {obtenerEstatusExtendido(m)}
                  </span>
                  <div className="pt-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          calcularAvancePago(m) === 100
                            ? 'bg-green-500'
                            : obtenerEstatusExtendido(m) === 'Vencido'
                            ? 'bg-red-500'
                            : 'bg-yellow-400'
                        }`}
                        style={{ width: `${calcularAvancePago(m)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 text-right">{calcularAvancePago(m)}%</div>
                  </div>
                </TableCell>
                <TableCell>
                  {(() => {
                  const { estatus, retraso } = calcularEstatusYRetraso(m)
                  return (
                    <div className="space-y-1 text-center">
                      <span className={`block text-xs font-semibold px-2 py-1
                        ${estatus === 'Pagado' ? 'bg-green-100 text-green-700'
                        : estatus === 'Al corriente' ? 'bg-blue-100 text-blue-700'
                        : estatus === 'Atrasado' ? 'bg-yellow-100 text-yellow-700'
                        : estatus === 'Vencido' ? 'bg-red-100 text-red-700'
                        : ''}`}>
                        {estatus}
                      </span>

                      {(estatus === 'Atrasado' || estatus === 'Vencido') && (
                        <span className={`block text-xs font-medium
                          ${estatus === 'Atrasado' ? ' text-yellow-700' : 'text-red-700'}`}>
                          {retraso} días
                        </span>
                      )}
                    </div>
                  )
                })()}
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => window.location.href = `/ventas/${m.venta_id}/pagos`}
                    >
                      <Add />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => eliminarVenta(m.venta_id)}>
                      <Trash2 size={18} />
                    </IconButton>
                  </Box>
                </TableCell>                 
              </TableRow>
              ))}
                </TableBody>
            </Table>
         </TableContainer>

        {totalPaginas > 1 && (
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
            <Typography variant="body2">
            Mostrando {totalRegistros === 0 ? 0 : inicio + 1}-{Math.min(fin, totalRegistros)} de {totalRegistros}
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


       {mostrarModal && (
        <Dialog
            open={mostrarModal}
            onClose={() => setMostrarModal(false)}
            fullWidth
            maxWidth="md"
            disablePortal
            keepMounted
            >
          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>Nueva Venta</DialogTitle>
          <DialogContent dividers>

            {/* Lote */}
            <FormControl fullWidth margin="normal">
              <Autocomplete
                disablePortal
                options={[...lotesDisponibles].sort((a, b) =>
                  a.manzana.localeCompare(b.manzana) ||
                  a.etapa.localeCompare(b.etapa) ||
                  a.lote.localeCompare(b.lote)
                )}
                getOptionLabel={(lote) =>
                  `Folio: ${lote.folio} -- Manzana: ${lote.manzana} -- Etapa: ${lote.etapa} -- Lote: ${lote.lote}`
                }
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={loteSeleccionado}
                onChange={(e, newValue) => setLoteSeleccionado(newValue)}
                renderInput={(params) => <TextField {...params} label="Seleccionar Lote" fullWidth />}
              />
            </FormControl>

            {loteSeleccionado && (
              <Grid container spacing={2}>
                <Grid size={4}><Typography>Folio: {loteSeleccionado.folio}</Typography></Grid>
                <Grid size={4}><Typography>Superficie: {loteSeleccionado.superficie} m²</Typography></Grid>
                <Grid size={4}><Typography>Propietario: {loteSeleccionado.propietario}</Typography></Grid>
                <Grid size={4}><Typography>Etapa: {loteSeleccionado.etapa}</Typography></Grid>
                <Grid size={4}><Typography>Manzana: {loteSeleccionado.manzana}</Typography></Grid>
                <Grid size={4}><Typography>Lote: {loteSeleccionado.lote}</Typography></Grid>
              </Grid>
            )}

            {/* Cliente */}
            <FormControl fullWidth margin="normal">
              <Autocomplete
                options={clientes}
                getOptionLabel={(cliente) => `${cliente.nombre} ${cliente.apellido}`}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={clientes.find(c => c.id === Number(clienteId)) || null}
                onChange={(e, newValue) => setClienteId(newValue ? newValue.id.toString() : '')}
                renderInput={(params) => <TextField {...params} label="Seleccionar Cliente" fullWidth />}
              />
            </FormControl>

            {/* Fecha */}
            <TextField
              fullWidth
              label="Fecha de venta"
              type="date"
              value={fechaPago}
              onChange={(e) => setFechaPago(e.target.value)}
              InputLabelProps={{ shrink: true }}
              margin="normal"
            />

            {/* Precio y pagos */}
            <Grid container spacing={2}>
              <Grid size={4}>
                <TextField
                  label="Precio m² base"
                  type="number"
                  value={precioMetroBase}
                  onChange={(e) => setPrecioMetroBase(e.target.value === '' ? '' : Number(e.target.value))}
                  fullWidth
                  margin="normal"
                />
              </Grid>
              <Grid size={4}>
                <TextField
                  label="Enganche personalizado"
                  type="number"
                  value={enganche}
                  disabled={usarEngancheAutomatico}
                  onChange={(e) => setEnganche(Number(e.target.value))}
                  fullWidth
                  margin="normal"
                />
              </Grid>
              <Grid size={4}>
                <TextField
                  label="Número de pagos"
                  select
                  value={numeroPagos}
                  onChange={(e) => setNumeroPagos(Number(e.target.value))}
                  fullWidth
                  margin="normal"
                >
                  {[...Array(36)].map((_, idx) => (
                    <MenuItem key={idx + 1} value={idx + 1}>{idx + 1} pagos</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            {/* Checkboxes */}
            <Grid container spacing={2}>
              <Grid size={3}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={usarEngancheAutomatico}
                      onChange={(e) => setUsarEngancheAutomatico(e.target.checked)}
                    />
                  }
                  label="Enganche Automático"
                />
              </Grid>
              <Grid size={3}>
                <FormControlLabel
                  control={<Checkbox checked={esquina} onChange={(e) => setEsquina(e.target.checked)} />}
                  label="Esquina"
                />
              </Grid>
              <Grid size={3}>
                <FormControlLabel
                  control={<Checkbox checked={parque} onChange={(e) => setParque(e.target.checked)} />}
                  label="Parque"
                />
              </Grid>
              <Grid size={3}>
                <FormControlLabel
                  control={<Checkbox checked={bonoVenta} onChange={(e) => setBonoVenta(e.target.checked)} />}
                  label="Bono de venta"
                />
              </Grid>
            </Grid>

            {/* Resumen */}
            <Box mt={3}>
              <Typography variant="body2">Precio Final m²: <strong>{formatearMoneda(precioFinalM2)}</strong></Typography>
              <Typography variant="body2">Total: <strong>{formatearMoneda(totalVenta)}</strong></Typography>
              <Typography variant="body2">Bono: <strong>{formatearMoneda(bonoVenta ? 15000 : 0)}</strong></Typography>
              <Typography variant="body2">Enganche: <strong>{formatearMoneda(enganche)}</strong></Typography>
              <Typography variant="body2">Total a financiar: <strong>{formatearMoneda(totalFinanciar)}</strong></Typography>
              <Typography variant="body2">Pago mensual: <strong>{formatearMoneda(pagoMensual)}</strong></Typography>
            </Box>

          </DialogContent>
          <DialogActions>
            <Button onClick={() => {reset(); setMostrarModal(false);
            }}>Cancelar</Button>
            <Button type="submit" variant="contained">{modoEdicion ? 'Actualizar' : 'Guardar'}</Button>
          </DialogActions>
          </Box>
        </Dialog>
      )}
      </Paper>
    </Box>
    )
}