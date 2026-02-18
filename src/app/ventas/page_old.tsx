// Ventas.tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
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
import { Add } from '@mui/icons-material'
import { useRouter } from 'next/navigation'

// Tipos

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

interface VentaDet{
  fecha_pago : Date
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

type Propietarios = 'CESAR' | 'JAIME' | 'LC' | 'JESUS' | 'NOVOA'
const propietariosOptions: Propietarios[] = ['CESAR', 'JAIME', 'LC', 'JESUS', 'NOVOA']

export default function VentasPage() {
  const router = useRouter()
  const [filtroPropietario, setFiltroPropietario] = useState<'Todos' | 'JAIME' | 'CESAR' | 'LC' | 'JESUS' | 'NOVOA' >('Todos')
  const [ventas, setVentas] = useState<Venta[]>([])
  const [pagosByVenta, setPagosByVenta] = useState<Record<number, { totalPagado: number; ultimaFechaPago: string | null }>>({})
  const [paginaActual, setPaginaActual] = useState(1)
  const [filasPorPagina] = useState(10)
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [cargandoTabla, setCargandoTabla] = useState(false)

  const [lotesDisponibles, setLotesDisponibles] = useState<Lote[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])

  const [loteSeleccionado, setLoteSeleccionado] = useState<Lote | null>(null)
  const [clienteId, setClienteId] = useState('')
  const [fechaPago, setFechaPago] = useState(dayjs().format('YYYY-MM-DD'))
  const [precioMetroBase, setPrecioMetroBase] = useState<number | ''>('')
  const [numeroPagos, setNumeroPagos] = useState(1)
  const [esquina, setEsquina] = useState(false)
  const [parque, setParque] = useState(false)
  const [bonoVenta, setBonoVenta] = useState(false)
  const [usarEngancheAutomatico, setUsarEngancheAutomatico] = useState(true)
  const [mostrarModal, setMostrarModal] = useState(false)

  const [precioFinalM2, setPrecioFinalM2] = useState(0)
  const [enganche, setEnganche] = useState(0)
  const [totalVenta, setTotalVenta] = useState(0)
  const [totalFinanciar, setTotalFinanciar] = useState(0)
  const [pagoMensual, setPagoMensual] = useState(0)
  const [mensaje, setMensaje] = useState<{ texto: string, tipo: 'success' | 'error' } | null>(null)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [busquedaEtapa, setBusquedaEtapa] = useState('')
  const [busquedaManzana, setBusquedaManzana] = useState('')
  const [busquedaLote, setBusquedaLote] = useState('')
  const [modoEdicion, setModoEdicion] = useState<Venta | null>(null)
  const [verificado, setVerificado] = useState(false)

  useEffect(() => {
    const cookies = document.cookie
    const autorizado = cookies.includes('auth_lagocomo=true')
    if (!autorizado) {
      router.push('/')
    } else {
      setVerificado(true)
    }
  }, [router])


  const cargarDatos = useCallback(async () => {
    setCargandoTabla(true)

    try {
      const from = (paginaActual - 1) * filasPorPagina
      const to = from + filasPorPagina - 1

      // 1) Ventas paginadas + ordenadas por lote (etapa, manzana, lote)
      let q = supabase
        .from('venta')
        .select(
          `
          id,
          total,
          cliente_id,
          lote_id,
          fecha,
          numero_pagos,
          pago_mensual,
          precioMetro,
          bono,
          admin,
          admin_venta,
          cliente:cliente_id ( id, nombre, apellido, correo, telefono ),
          lote:lote_id ( id, folio, manzana, etapa, lote, superficie, estatus, propietario )
        `,
          { count: 'exact' }
        )
        .order('etapa', { foreignTable: 'lote', ascending: true })
        .order('manzana', { foreignTable: 'lote', ascending: true })
        .order('lote', { foreignTable: 'lote', ascending: true })
        .range(from, to)

      // 2) Filtros en servidor
      if (filtroPropietario !== 'Todos') {
        q = q.eq('lote.propietario', filtroPropietario)
      }
      if (busquedaEtapa.trim()) {
        // si etapa es texto
        q = q.ilike('lote.etapa', `%${busquedaEtapa.trim()}%`)
      }
      if (busquedaManzana.trim()) {
        q = q.ilike('lote.manzana', `%${busquedaManzana.trim()}%`)
      }
      if (busquedaLote.trim()) {
        q = q.ilike('lote.lote', `%${busquedaLote.trim()}%`)
      }

      const { data: ventasData, count, error } = await q
      if (error) throw error

      setVentas((ventasData as any) ?? [])
      setTotalRegistros(count ?? 0)

      // 3) Pagos SOLO de las ventas visibles (sum y última fecha)
      const ventaIds = (ventasData ?? []).map(v => v.id)
      if (ventaIds.length === 0) {
        setPagosByVenta({})
        return
      }

      // Traemos detalle mínimo y lo agregamos en JS (simple y rápido para pageSize 10/20/50)
      const { data: pagosData, error: pagosError } = await supabase
        .from('venta_det')
        .select('venta_id, total, fecha_pago')
        .in('venta_id', ventaIds)

      if (pagosError) throw pagosError

      const map: Record<number, { totalPagado: number; ultimaFechaPago: string | null }> = {}
      for (const id of ventaIds) map[id] = { totalPagado: 0, ultimaFechaPago: null }

      for (const p of pagosData ?? []) {
        const vid = p.venta_id as number
        const total = Number(p.total ?? 0)
        const fecha = p.fecha_pago ? dayjs(p.fecha_pago).toISOString() : null

        map[vid].totalPagado += total

        if (fecha) {
          const actual = map[vid].ultimaFechaPago
          if (!actual || dayjs(fecha).isAfter(dayjs(actual))) {
            map[vid].ultimaFechaPago = fecha
          }
        }
      }

      setPagosByVenta(map)

      // 4) Estos sí pueden ser "una vez" (no dependen de paginación)
      // lotes disponibles y clientes (para el modal)
      // Si ya los tienes cargados, puedes mantenerlos aquí o moverlos a otro useEffect una sola vez.
      const [{ data: lotesData }, { data: clientesData }] = await Promise.all([
        supabase.from('lote').select('*').eq('estatus', 'Disponible'),
        supabase.from('cliente').select('*'),
      ])

      if (lotesData) setLotesDisponibles(lotesData as any)
      if (clientesData) setClientes(clientesData as any)
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message ?? 'Error al cargar datos')
    } finally {
      setCargandoTabla(false)
    }
  }, [
    paginaActual,
    filasPorPagina,
    filtroPropietario,
    busquedaEtapa,
    busquedaManzana,
    busquedaLote,
  ])

  useEffect(() => {
    if (verificado) cargarDatos()
  }, [verificado, cargarDatos])

  useEffect(() => {
    setPaginaActual(1)
  }, [filtroPropietario, busquedaEtapa, busquedaManzana, busquedaLote])

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
      await supabase.from('lote').update(nuevaVenta).eq('id', modoEdicion.id)
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
    cargarDatos()
  }

  const formatearMoneda = (valor: number) => `$ ${valor.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`

  const eliminarVenta = async (loteId: number) => {
    const confirmacion = confirm('¿Estás seguro que deseas eliminar la venta, se borraran todos los pagos de la venta?')
    if (!confirmacion) return
  
    const { error } = await supabase.from('venta').delete().eq('id', loteId)
    if (!error) {
      setMensaje({ texto: 'Venta eliminada correctamente.', tipo: 'success' })
      await cargarDatos()
    } else {
      setMensaje({ texto: 'Error al eliminar la venta.', tipo: 'error' })
    }

    setTimeout(() => setMensaje(null), 3000) // Borra el mensaje después de 3s
    setPaginaActual(1)
  }

  // const ventasFiltradas = ventas.filter((venta) => {
  //   const matchEtapa = venta.lote?.etapa.toLowerCase().includes(busquedaEtapa.toLowerCase())
  //   const matchManzana = venta.lote?.manzana.toLowerCase().includes(busquedaManzana.toLowerCase())
  //   const matchLote = venta.lote?.lote.toLowerCase().includes(busquedaLote.toLowerCase())
  //   const matchPropietario = filtroPropietario === 'Todos' || venta.lote?.propietario === filtroPropietario
  //   return matchEtapa && matchManzana && matchLote && matchPropietario
  // })

  const calcularAvancePago = (venta: Venta) => {
    const info = pagosByVenta[venta.id]
    const totalPagado = info?.totalPagado ?? 0

    const valorReal = venta.total - venta.bono - venta.admin - venta.admin_venta
    const porcentaje = valorReal > 0 ? (totalPagado / valorReal) * 100 : 0

    return Math.min(Math.round(porcentaje), 100)
}

  const obtenerEstatusExtendido = (venta: Venta) => {
    const info = pagosByVenta[venta.id]
    const totalPagado = info?.totalPagado ?? 0

    if (totalPagado >= venta.total - venta.bono) return 'Pagado'

    const fechaLimite = dayjs(venta.fecha).add(venta.numero_pagos, 'month')
    const hoy = dayjs()

    return hoy.isAfter(fechaLimite) ? 'Vencido' : 'Pendiente'
  }

  const calcularEstatusYRetraso = (venta: Venta) => {
    const info = pagosByVenta[venta.id]
    const totalPagado = info?.totalPagado ?? 0

    const porcentaje = venta.total > 0 ? (totalPagado / venta.total) * 100 : 0
    if (porcentaje >= 100) return { estatus: 'Pagado', retraso: 0 }

    const ultimaFechaPago = info?.ultimaFechaPago
      ? dayjs(info.ultimaFechaPago)
      : dayjs(venta.fecha)

    const hoy = dayjs()
    const dias = hoy.diff(ultimaFechaPago, 'day')

    if (dias <= 30) return { estatus: 'Al corriente', retraso: dias }
    else if (dias <= 60) return { estatus: 'Atrasado', retraso: dias }
    else return { estatus: 'Vencido', retraso: dias }
  }

  const inicio = (paginaActual - 1) * filasPorPagina
  const fin = inicio + filasPorPagina
  const totalPaginas = Math.ceil(totalRegistros / filasPorPagina)

  // ahora renderizas directamente ventas (ya viene paginada)
  const ventasPaginados = ventas

  const { handleSubmit, reset } = useForm<Partial<Venta>>({
    defaultValues: {
      total: 0, cliente_id: 0, lote_id: 0, fecha: '', numero_pagos: 0, pago_mensual: 0, precioMetro: 0,
      cliente: undefined, lote: undefined, bono: 0, admin: 0, admin_venta: 0, ventasDet: undefined
    }
  })

    // 👉 Aquí ya no se rompe el orden de hooks
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
                <TableRow key={m.id} hover>
                  <TableCell>{m.cliente?.nombre} {m.cliente?.apellido}</TableCell>
                  <TableCell>{m.lote?.propietario}</TableCell>
                  <TableCell>{m.lote?.etapa}</TableCell>
                  <TableCell>{m.lote?.manzana}</TableCell>
                  <TableCell>{m.lote?.lote}</TableCell>
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
                      onClick={() => window.location.href = `/ventas/${m.id}/pagos`}
                    >
                      <Add />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => eliminarVenta(m.id)}>
                      <Trash2 size={18} />
                    </IconButton>
                  </Box>
                </TableCell>                 
              </TableRow>
              ))}
              {ventasPaginados.length === 0 && (
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

        {/* Modal para agregar o editar lote */}
       {mostrarModal && (
        <Dialog open={mostrarModal} onClose={() => setMostrarModal(false)} fullWidth maxWidth="md">
          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>Nueva Venta</DialogTitle>
          <DialogContent dividers>

            {/* Lote */}
            <FormControl fullWidth margin="normal">
              <Autocomplete
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
            <Button onClick={() => setMostrarModal(false)}>Cancelar</Button>
            <Button type="submit" variant="contained">{modoEdicion ? 'Actualizar' : 'Guardar'}</Button>
          </DialogActions>
          </Box>
        </Dialog>
      )}
      </Paper>
    </Box>
  )
}