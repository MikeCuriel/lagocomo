// Ventas.tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { TextField, MenuItem, FormControlLabel, Checkbox, Button, Autocomplete, FormControl } from '@mui/material'

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
}

export default function VentasPage() {

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
  const [pagoMensual, setPagoMensual] = useState(0)

  const cargarDatos = async () => {
    const [{ data: ventasData }, { data: lotesData }, { data: clientesData }] = await Promise.all([
      supabase.from('venta').select('*, cliente(*), lote(*)'),
      supabase.from('lote').select('*').eq('estatus', 'Disponible'),
      supabase.from('cliente').select('*'),
    ])
    if (ventasData) setVentas(ventasData)
    if (lotesData) setLotesDisponibles(lotesData)
    if (clientesData) setClientes(clientesData)
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
    if (bonoVenta) total -= 15000

    const engancheDefault = total * 0.25
    const engancheUsado = usarEngancheAutomatico ? engancheDefault : enganche
    const restante = total - engancheUsado

    setPrecioFinalM2(precio)
    setTotalVenta(total)
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

    console.log(precioFinal)
    console.log(totalConBono)
    console.log(restante)

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

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Ventas</h1>
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
            <th className="px-4 py-2 text-left">Etapa</th>
            <th className="px-4 py-2 text-left">Manzana</th>
            <th className="px-4 py-2 text-left">Lote</th>
            <th className="px-4 py-2 text-left">Fecha</th>
            <th className="px-4 py-2 text-left">Total</th>
            <th className="px-4 py-2 text-left">Pagos</th>
            <th className="px-4 py-2 text-left">Pago Mensual</th>
            <th className="px-4 py-2 text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {ventas.map((v) => (
            <tr key={v.id} className="border-t">
              <td className="px-4 py-2">{v.cliente?.nombre} {v.cliente?.apellido}</td>
              <td className="px-4 py-2">{v.lote?.etapa}</td>
              <td className="px-4 py-2">{v.lote?.manzana}</td>
              <td className="px-4 py-2">{v.lote?.lote}</td>
              <td className="px-4 py-2">{dayjs(v.fecha).format('DD/MM/YYYY')}</td>
              <td className="px-4 py-2">${v.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="px-4 py-2">{v.numero_pagos}</td>
              <td className="px-4 py-2">${v.pago_mensual.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="px-4 py-2">
                <button
                  className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                  onClick={() => window.location.href = `/ventas/${v.id}/pagos`}
                >
                  Agregar pago
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
              <p>Enganche: <strong>{formatearMoneda(enganche)}</strong></p>
              <p>Total: <strong>{formatearMoneda(totalVenta)}</strong></p>
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