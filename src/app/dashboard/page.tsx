"use client"

import React, { useEffect, useState } from 'react'
import {
  Tabs,
  Tab,
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Divider,
} from '@mui/material'
import { supabase } from '../../lib/supabase'

interface PropietarioResumen {
  propietario: string
  lotesVendidos: number
  totalVentas: number
  bonos: number
  dosPorciento: number
  tresPorciento: number
  pagos: number
}

export default function DashboardResumen() {
  const [tab, setTab] = useState('Todos')
  const [resumen, setResumen] = useState<PropietarioResumen[]>([])

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: ventas } = await supabase.from('venta').select('id,total,bono,admin,admin_venta,lote:lote_id(propietario)')
      const { data: pagos } = await supabase.from('venta_det').select('venta_id,total')

      const resumenPorPropietario: Record<string, Omit<PropietarioResumen, 'propietario'>> = {}

      ventas?.forEach((v) => {
        const lotes = Array.isArray(v.lote) ? v.lote : v.lote ? [v.lote] : []  // 🔥 aquí forzamos a array
      
        lotes.forEach((lote) => {
          const propietario = lote?.propietario ?? 'Sin propietario'
          const pagosVenta = pagos?.filter(p => p.venta_id === v.id) || []
          const totalPagos = pagosVenta.reduce((sum, p) => sum + Number(p.total), 0)
      
          if (!resumenPorPropietario[propietario]) {
            resumenPorPropietario[propietario] = {
              lotesVendidos: 0,
              totalVentas: 0,
              bonos: 0,
              dosPorciento: 0,
              tresPorciento: 0,
              pagos: 0,
            }
          }
      
          resumenPorPropietario[propietario].lotesVendidos++
          resumenPorPropietario[propietario].totalVentas += v.total || 0
          resumenPorPropietario[propietario].bonos += v.bono || 0
          resumenPorPropietario[propietario].dosPorciento += v.admin || 0
          resumenPorPropietario[propietario].tresPorciento += v.admin_venta || 0
          resumenPorPropietario[propietario].pagos += totalPagos
        })
      })

      setResumen(Object.entries(resumenPorPropietario).map(([propietario, datos]) => ({ propietario, ...datos })))
    }

    cargarDatos()
  }, [])

  const propietarios = ['Todos', ...Array.from(new Set(resumen.map(r => r.propietario)))]
  const resumenFiltrado = tab === 'Todos' ? resumen : resumen.filter(r => r.propietario === tab)

  const sumar = (key: keyof Omit<PropietarioResumen, 'propietario'>) => resumenFiltrado.reduce((a, b) => a + b[key], 0)

  const total = sumar('totalVentas') - sumar('bonos')
  const pagos = sumar('pagos') - sumar('dosPorciento') - sumar('tresPorciento')
  const deuda = total - pagos
  const porcentaje = total > 0 ? (pagos / total) * 100 : 0

  return (
    <div className='bg-white rounded-lg w-full pb-10'>
      <h2 className='flex justify-center text-5xl pt-2'>Resumen</h2>
      <div className='grid grid-cols-1 px-5 pt-5'>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
          {propietarios.map((p) => (
            <Tab key={p} label={p} value={p} sx={{ fontSize: '18px', fontWeight: 'bold' }}/>
          ))}
        </Tabs>
      </div>
      <div className='w-full grid grid-rows-2 gap-4'>
        <div className='flex gap-6 px-5'>
          <Card className='w-64' sx={{ textAlign: 'center', backgroundImage: 'linear-gradient(to right, #2193b0, #6dd5ed)' }}>
            <CardContent>
              <Typography variant="h4">Lotes vendidos</Typography>
              <Typography variant="h1" fontWeight="Bold">{sumar('lotesVendidos')}</Typography>
            </CardContent>
          </Card>
          <Card className='flex-auto' sx={{ background: '#00695f', backgroundImage: 'linear-gradient(135deg, #158c08 0%, #158c08 100%)' }}>
            <CardContent>
              <div className='grid grid-cols-2'>
                <Typography variant='h4' textAlign='right' fontWeight='Bold' color='white'>Ventas totales:</Typography>
                <Typography className='pr-5' variant='h4' textAlign='right' color='white'>$ {sumar('totalVentas').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
              </div>
              <div className='grid grid-cols-2'>
                <Typography variant='h4' textAlign='right' fontWeight='Bold' color='white'>Bonos:</Typography>
                <Typography className='pr-5' variant='h4' textAlign='right' color='white'>$ {sumar('bonos').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
              </div>
              <div className='my-5 ml-5'>
                <Divider  sx={{ my: 1, borderColor: 'white' }} />
              </div>
              <div className='grid grid-cols-2'>
              <Typography variant='h4' textAlign='right' fontWeight='Bold' color='white'>Total real:</Typography>
              <Typography className='pr-5' variant='h4' textAlign='right' color='white'>$ {total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className='flex gap-6 px-5'>
          <Card className='w-64 rounded-2xl' sx={{ background: '#01579b', color: 'white', textAlign: 'center' }}>
            <CardContent>
            <Typography variant="h4">Pendiente</Typography>
            <Typography variant="h5">$ {deuda.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
              <Box display="flex" justifyContent="center" mt={2}>
                <CircularProgress variant="determinate" value={porcentaje} size={80} thickness={6} />
                <Box position="absolute" mt={3}>
                  <Typography variant="body1" color="white">{Math.round(porcentaje)}%</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card className='flex-auto' sx={{ background: '#b71c1c', backgroundImage: 'linear-gradient(135deg, #ff0000 0%, #ff0000 100%)'}}>
            <CardContent>
              <div className='grid grid-cols-2'>
                <Typography variant="h4" textAlign='right' fontWeight='Bold' color="white">Pagos:</Typography>
                <Typography className='pr-5' variant='h4' textAlign='right' color="white">$ {sumar('pagos').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
              </div>
              <div className='grid grid-cols-2'>
                <Typography variant="h4" textAlign='right' fontWeight='Bold' color="white">Administración:</Typography>
                <Typography className='pr-5' variant='h4' textAlign='right' color="white">$ {sumar('dosPorciento').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>

              </div>
              <div className='grid grid-cols-2'>
                <Typography variant="h4" textAlign='right' fontWeight='Bold' color="white">Comisión venta:</Typography>
                <Typography className='pr-5' variant='h4' textAlign='right' color="white">$ {sumar('tresPorciento').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
              </div>
              <div className='my-5 ml-5'>
                <Divider  sx={{ my: 1, borderColor: 'white' }} />
              </div>
              <div className='grid grid-cols-2'>
                <Typography variant="h4" textAlign='right' fontWeight='Bold' color="white">Pago Real: ${pagos.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
                <Typography className='pr-5' variant='h4' textAlign='right' color="white">$ {pagos.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
              </div>       
            </CardContent>
          </Card>
        </div>
      </div>
    </div>    
  )
}