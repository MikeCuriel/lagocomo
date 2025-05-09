// Ventas.tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { TextField, MenuItem, FormControlLabel, Checkbox, Button, Autocomplete, FormControl, TablePagination, IconButton, Typography, Alert } from '@mui/material'

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

export default function VentasPage() {

  const [filtroPropietario, setFiltroPropietario] = useState<'Todos' | 'JAIME' | 'CESAR' | 'LC' | 'NOVOA' >('Todos')
  const [ventas, setVentas] = useState<Venta[]>([])
  const [lotesDisponibles, setLotesDisponibles] = useState<Lote[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])

  const [mostrarModal, setMostrarModal] = useState(false)

  const [loteSeleccionado, setLoteSeleccionado] = useState<Lote | null>(null)
  const [clienteId, setClienteId] = useState('')
  const [fechaPago, setFechaPago] = useState(dayjs().format('YYYY-MM-DD'))
  const [precioMetroBase, setPrecioMetroBase] = useState<number | ''>('')
  const [numeroPagos, setNumeroPagos] = useState(12)
  const [esquina, setEsquina] = useState(false)
  const [parque, setParque] = useState(false)
  const [bonoVenta, setBonoVenta] = useState(false)
  const [usarEngancheAutomatico, setUsarEngancheAutomatico] = useState(true)

  const [precioFinalM2, setPrecioFinalM2] = useState(0)
  const [enganche, setEnganche] = useState(0)
  const [totalVenta, setTotalVenta] = useState(0)
  const [totalFinanciar, setTotalFinanciar] = useState(0)
  const [pagoMensual, setPagoMensual] = useState(0)
  const [paginaActual, setPaginaActual] = useState(0)
  const [filasPorPagina, setFilasPorPagina] = useState(10)
  const [pagos, setPagos] = useState<{ venta_id: number, total: number, fecha_pago: Date }[]>([])
  const [mensaje, setMensaje] = useState<{ texto: string, tipo: 'success' | 'error' } | null>(null)
  

  const cargarDatos = async () => {
    const [{ data: ventasData }, { data: lotesData }, { data: clientesData }, { data: pagosData }] = await Promise.all([
      supabase.from('venta').select('*, cliente(*), lote(*)'),
      supabase.from('lote').select('*').eq('estatus', 'Disponible'),
      supabase.from('cliente').select('*'),
      supabase.from('venta_det').select('venta_id, total, fecha_pago')
    ])
    
    if (ventasData) setVentas(ventasData)
    if (lotesData) setLotesDisponibles(lotesData)
    if (clientesData) setClientes(clientesData)
    if (pagosData) setPagos(pagosData)
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const calcularPrecio = useCallback(() => {
    if (!loteSeleccionado || precioMetroBase === '') return
    let precio = precioMetroBase
    if (esquina) precio += 100
    if (parque) precio += 100
    if (numeroPagos <= 12) precio += 100
    else if (numeroPagos <= 24) precio += 200
    else if (numeroPagos <= 36) precio += 300

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

  const guardarVenta = async () => {
    if (!loteSeleccionado || !clienteId || precioMetroBase === '' || !fechaPago) {
      toast.error('Faltan datos para guardar la venta')
      return
    }

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

    await supabase.from('lote').update({ estatus: 'Vendido' }).eq('id', loteSeleccionado.id)
    toast.success('Venta registrada')
    setMostrarModal(false)
    cargarDatos()
  }

  const formatearMoneda = (valor: number) => `$ ${valor.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`

  const resetFormularioVenta = () => {
    setLoteSeleccionado(null)
    setClienteId('')
    setFechaPago(dayjs().format('YYYY-MM-DD'))
    setPrecioMetroBase('')
    setEsquina(false)
    setParque(false)
    setBonoVenta(false)
    setNumeroPagos(12)
    setPrecioFinalM2(0)
    setEnganche(0)
    setPagoMensual(0)
    setTotalVenta(0)
  }

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

  const ventasFiltradas = ventas.filter(v => {
    if (filtroPropietario === 'Todos') return true
    return v.lote?.propietario === filtroPropietario
  })

  const ventasOrdenadas = [...ventasFiltradas].sort((a, b) => {
    if (a.lote?.etapa !== b.lote?.etapa) {
      return (a.lote?.etapa || '').localeCompare(b.lote?.etapa || '')
    }
    if (a.lote?.manzana !== b.lote?.manzana) {
      return (a.lote?.manzana || '').localeCompare(b.lote?.manzana || '')
    }
    return (a.lote?.lote || '').localeCompare(b.lote?.lote || '')
  })
  
  const totalPaginas = Math.ceil(ventasOrdenadas.length / filasPorPagina)
  const paginaAUsar = Math.min(paginaActual, Math.max(totalPaginas - 1, 0))
  
  const ventasPaginadas = ventasOrdenadas.slice(
    paginaAUsar * filasPorPagina,
    paginaAUsar * filasPorPagina + filasPorPagina
  )

  const calcularAvancePago = (venta: Venta) => {
    const pagosVenta = pagos.filter(p => p.venta_id === venta.id)
    const totalPagado = pagosVenta.reduce((sum, p) => sum + Number(p.total), 0)
  
    const valorReal = venta.total - venta.bono - venta.admin - venta.admin_venta
    const porcentaje = valorReal > 0 ? (totalPagado / valorReal) * 100 : 0
  
    return Math.min(Math.round(porcentaje), 100)
  }

  const obtenerEstatusExtendido = (venta: Venta) => {
    const pagosVenta = pagos.filter(p => p.venta_id === venta.id)
    const totalPagado = pagosVenta.reduce((sum, p) => sum + Number(p.total), 0)
  
    if (totalPagado >= venta.total - venta.bono) return 'Pagado'
  
    const fechaLimite = dayjs(venta.fecha).add(venta.numero_pagos, 'month')
    const hoy = dayjs()
  
    if (hoy.isAfter(fechaLimite)) {
      return 'Vencido'
    }
  
    return 'Pendiente'
  }

  const calcularEstatusYRetraso = (venta: Venta) => {
    const pagosVenta = pagos
      .filter(p => p.venta_id === venta.id)
      .sort((a, b) => dayjs(b.fecha_pago).diff(dayjs(a.fecha_pago))) // más reciente primero
  
    const totalPagado = pagosVenta.reduce((sum, p) => sum + Number(p.total), 0)
    const porcentaje = venta.total > 0 ? (totalPagado / venta.total) * 100 : 0
  
    if (porcentaje >= 100) return { estatus: 'Pagado', retraso: 0 }
  
    const ultimaFechaPago = pagosVenta.length > 0 ? dayjs(pagosVenta[0].fecha_pago) : dayjs(venta.fecha)
    const hoy = dayjs()
    const dias = hoy.diff(ultimaFechaPago, 'day')
  
    if (dias <= 30) return { estatus: 'Al corriente', retraso: dias }
    else if (dias <= 60) return { estatus: 'Atrasado', retraso: dias }
    else return { estatus: 'Vencido', retraso: dias }
  }

  return (
    <div className="max-w-8xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Ventas</h2>
              <Typography variant="h4" fontWeight="bold" mb={3}> Lotes </Typography>
              {mensaje && (
                <Alert severity={mensaje.tipo} className="mb-4"> {mensaje.texto} </Alert>
              )}
      </div>
      <div className="bg-white shadow rounded-xl overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex gap-2 w-full sm:w-auto">
            {['Todos', 'JAIME', 'CESAR', 'LC'].map((propietario) => (
              <button
                key={propietario}
                onClick={() => setFiltroPropietario(propietario as 'Todos' | 'JAIME' | 'CESAR' | 'LC' | 'NOVOA')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border ${
                  filtroPropietario === propietario ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {propietario}
              </button>
            ))}
          </div>
          <button onClick={() => {
              resetFormularioVenta()
              setMostrarModal(true)
            }} className="bg-blue-600 text-white px-4 py-2 rounded">
            Agregar venta
          </button>
        </div>

        <table className="w-full bg-white shadow rounded-xl text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left">Cliente</th>
            <th className="px-4 py-2 text-left">Propietario</th>
            <th className="px-4 py-2 text-left">Etapa</th>
            <th className="px-4 py-2 text-left">Manzana</th>
            <th className="px-4 py-2 text-left">Lote</th>
            <th className="px-4 py-2 text-left">Fecha</th>
            <th className="px-4 py-2 text-left">Total</th>
            <th className="px-4 py-2 text-left">Pagos</th>
            <th className="px-4 py-2 text-left">Pago Mensual</th>
            <th className="px-4 py-2 text-left">Pago %</th>
            <th className="px-4 py-2 text-left">Atraso</th>
            <th className="px-4 py-2 text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
        {ventasPaginadas.map((v) => (
            <tr key={v.id} className="border-t">
              <td className="px-4 py-2">{v.cliente?.nombre} {v.cliente?.apellido}</td>
              <td className="px-4 py-2">{v.lote?.propietario}</td>
              <td className="px-4 py-2">{v.lote?.etapa}</td>
              <td className="px-4 py-2">{v.lote?.manzana}</td>
              <td className="px-4 py-2">{v.lote?.lote}</td>
              <td className="px-4 py-2">{dayjs(v.fecha).format('DD/MM/YYYY')}</td>
              <td className="px-4 py-2">${v.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="px-4 py-2">{v.numero_pagos}</td>
              <td className="px-4 py-2">${v.pago_mensual.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="px-4 py-2 space-y-1">
                <span className={`px-2 py-1 rounded-t-lg text-xs font-medium ${
                  obtenerEstatusExtendido(v) === 'Pagado'
                    ? 'bg-green-100 text-green-700'
                    : obtenerEstatusExtendido(v) === 'Vencido'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {obtenerEstatusExtendido(v)}
                </span>
                <div className="pt-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        calcularAvancePago(v) === 100
                          ? 'bg-green-500'
                          : obtenerEstatusExtendido(v) === 'Vencido'
                          ? 'bg-red-500'
                          : 'bg-yellow-400'
                      }`}
                      style={{ width: `${calcularAvancePago(v)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 text-right">{calcularAvancePago(v)}%</div>
                </div>
              </td>
              <td className="px-4 py-2">
                {(() => {
                  const { estatus, retraso } = calcularEstatusYRetraso(v)
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
              </td>
              <td className="px-4 py-2">
                <button
                  className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                  onClick={() => window.location.href = `/ventas/${v.id}/pagos`}
                >
                  Nuevo pago
                </button>
                <IconButton size="small" color="error" onClick={() => eliminarVenta(v.id)}>
                  <Trash2 size={18} />
                </IconButton>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <TablePagination
          component="div"
          count={ventasFiltradas.length}
          page={paginaActual}
          onPageChange={(_, newPage) => setPaginaActual(newPage)}
          rowsPerPage={filasPorPagina}
          onRowsPerPageChange={(event) => {
            setFilasPorPagina(parseInt(event.target.value, 10))
            setPaginaActual(0)
          }}
          labelRowsPerPage="Ventas por página:"
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </div>
      {mostrarModal && (
        <div className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl space-y-4">
            <h2 className="text-xl font-semibold">Nueva Venta</h2>

            <FormControl fullWidth margin="normal">
              <Autocomplete
                options={[...lotesDisponibles].sort((a, b) =>
                  a.manzana.localeCompare(b.manzana) ||
                  a.etapa.localeCompare(b.etapa) ||
                  a.lote.localeCompare(b.lote)
                )}
                getOptionLabel={(lote) => `Folio: ${lote.folio} -- Manzana: ${lote.manzana} -- Etapa: ${lote.etapa} -- Lote: ${lote.lote}`}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={loteSeleccionado}
                onChange={(event, newValue) => {
                  setLoteSeleccionado(newValue)
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Seleccionar Lote" fullWidth />
                )}
              />
            </FormControl>

            {loteSeleccionado && (
              <div className="grid grid-cols-3 gap-4">
                  <p>Folio: {loteSeleccionado.folio}</p>
                  <p>Superficie: {loteSeleccionado.superficie} m²</p> 
                  <p>Propietario: {loteSeleccionado.propietario}</p> 
                  <p>Etapa: {loteSeleccionado.etapa}</p>
                  <p>Manzana: {loteSeleccionado.manzana}</p>
                  <p>Lote: {loteSeleccionado.lote}</p>
              </div>


            )}

            <FormControl fullWidth margin="normal">
              <Autocomplete
                options={clientes}
                getOptionLabel={(cliente) => `${cliente.nombre} ${cliente.apellido}`}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={clientes.find(c => c.id === Number(clienteId)) || null}
                onChange={(event, newValue) => {
                  setClienteId(newValue ? newValue.id.toString() : '')
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Seleccionar Cliente" fullWidth />
                )}
              />
            </FormControl>

            <TextField
              fullWidth
              label="Fecha de venta"
              type="date"
              value={fechaPago}
              onChange={(e) => setFechaPago(e.target.value)}
              InputLabelProps={{ shrink: true }}
              margin="normal"
            />

            <div className="grid grid-cols-3 gap-4">
              <TextField
                label="Precio m² base"
                type="number"
                value={precioMetroBase}
                onChange={(e) => setPrecioMetroBase(e.target.value === '' ? '' : Number(e.target.value))}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Enganche personalizado"
                type="number"
                value={enganche}
                disabled={usarEngancheAutomatico}
                onChange={(e) => setEnganche(Number(e.target.value))}
                fullWidth
                margin="normal"
              />
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
            </div>
            <div className="grid grid-cols-4 gap-4">
            <FormControlLabel
              control={
                <Checkbox
                  checked={usarEngancheAutomatico}
                  onChange={(e) => setUsarEngancheAutomatico(e.target.checked)}
                />
              }
              label="Enganche Automático"
            />
              <FormControlLabel
                control={<Checkbox checked={esquina} onChange={(e) => setEsquina(e.target.checked)} />}
                label="Esquina"
              />
              <FormControlLabel
                control={<Checkbox checked={parque} onChange={(e) => setParque(e.target.checked)} />}
                label="Parque"
              />
              <FormControlLabel
                control={<Checkbox checked={bonoVenta} onChange={(e) => setBonoVenta(e.target.checked)} />}
                label="Bono de venta"
              />
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <p>Precio Final m²: <strong>{formatearMoneda(precioFinalM2)}</strong></p>
              <p>Total: <strong>{formatearMoneda(totalVenta)}</strong></p>
              <p>Bono: <strong>{bonoVenta ? formatearMoneda(15000) : formatearMoneda(0)}</strong></p>
              <p>Enganche: <strong>{formatearMoneda(enganche)}</strong></p>
              <p>Total a financiar: <strong>{formatearMoneda(totalFinanciar)}</strong></p>
              <p>Pago mensual: <strong>{formatearMoneda(pagoMensual)}</strong></p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button onClick={() => setMostrarModal(false)} variant="outlined">Cancelar</Button>
              <Button onClick={guardarVenta} variant="contained" color="primary">Guardar Venta</Button>
            </div>
            
            </div>
          </div>
      )}
    </div>
  )
}