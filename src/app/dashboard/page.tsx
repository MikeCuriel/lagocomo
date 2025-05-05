"use client"

import React, { useEffect, useState } from 'react'
import {
  Tabs,
  Tab,
  Box,
  Typography,
  CircularProgress,
  Divider,
} from '@mui/material'
import { supabase } from '../../lib/supabase'
import { useMediaQuery, useTheme } from '@mui/material'

interface PropietarioResumen {
  propietario: string
  lotesVendidos: number
  totalVentas: number
  bonos: number
  dosPorciento: number
  tresPorciento: number
  pagos: number
  totalLotes: number
}


export default function DashboardResumen() {
  const [tab, setTab] = useState('Todos')
  const [resumen, setResumen] = useState<PropietarioResumen[]>([])
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [lotes, setLotes] = useState<{ id: number; propietario: string | null }[]>([]);
  const [totalLotes, setTotalLotes] = useState(0);

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: ventas } = await supabase.from('venta').select('id,total,bono,admin,admin_venta,lote:lote_id(propietario)')
      const { data: pagos } = await supabase.from('venta_det').select('venta_id,total')
      const { data: lotesData } = await supabase.from('lote').select('id, propietario');
    
      setLotes(lotesData || []);
      const resumenPorPropietario: Record<string, Omit<PropietarioResumen, 'propietario'>> = {}

      ventas?.forEach((v) => {
        const lotes = Array.isArray(v.lote) ? v.lote : v.lote ? [v.lote] : []  // 🔥 aquí forzamos a array


        lotes.forEach((lote) => {
          const propietario = lote?.propietario ?? 'Sin propietario'
          const pagosVenta = pagos?.filter(p => p.venta_id === v.id) || []
          const totalPagos = pagosVenta.reduce((sum, p) => sum + Number(p.total), 0)
          const totalLotesFiltrado = lotes?.filter(lote => lote.propietario === tab).length || 0;
      
          if (!resumenPorPropietario[propietario]) {
            resumenPorPropietario[propietario] = {
              lotesVendidos: 0,
              totalVentas: 0,
              bonos: 0,
              dosPorciento: 0,
              tresPorciento: 0,
              pagos: 0,
              totalLotes: 0
            }
          }
          resumenPorPropietario[propietario].lotesVendidos++
          resumenPorPropietario[propietario].totalVentas += v.total || 0
          resumenPorPropietario[propietario].bonos += v.bono || 0
          resumenPorPropietario[propietario].dosPorciento += v.admin || 0
          resumenPorPropietario[propietario].tresPorciento += v.admin_venta || 0
          resumenPorPropietario[propietario].pagos += totalPagos
          resumenPorPropietario[propietario].totalLotes = totalLotesFiltrado || 0
        })
      })

      setResumen(Object.entries(resumenPorPropietario).map(([propietario, datos]) => ({ propietario, ...datos })))
    }

    cargarDatos()
  }, [])

  useEffect(() => {
    if (tab === 'Todos') {
      setTotalLotes(lotes.length);
    } else {
      const filtrados = lotes.filter(l => l.propietario === tab);
      setTotalLotes(filtrados.length);
    }
  }, [tab, lotes]);

  const propietarios = ['Todos', ...Array.from(new Set(resumen.map(r => r.propietario)))]
  const resumenFiltrado = tab === 'Todos' ? resumen : resumen.filter(r => r.propietario === tab)
  const sumar = (key: keyof Omit<PropietarioResumen, 'propietario'>) => resumenFiltrado.reduce((a, b) => a + b[key], 0)

  const total = sumar('totalVentas') - sumar('bonos')
  const pagos = sumar('pagos') - sumar('dosPorciento') - sumar('tresPorciento')
  const pagosTotal = sumar('pagos')
  const deuda = total - pagosTotal
  const porcentaje = total > 0 ? 100 - (pagosTotal / total) * 100 : 0


  return (
    <div className='bg-white w-full h-full rounded-xl'>
      <h2 className='flex justify-center text-[9vw] font-bold md:text-[6.8vw] lg:text-[5vw] xl:text-[4.8vw]'>Resumen</h2>
            <div className='flex flex-row pt-3'>
      {isMobile ? (
        <Box px={2} width="100%">
          <select
            value={tab}
            onChange={(e) => setTab(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm mb-5"
          >
            {propietarios.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </Box>
      ) : (
        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 1, minWidth: 80 }}>
          {propietarios.map((p) => (
            <Tab key={p} label={p} value={p} sx={{ fontSize: '1.2vw', fontWeight: 'bold' }} />
          ))}
        </Tabs>
      )}
      </div>
      <div className='flex flex-col gap-3 justify-center items-center my-4 md:grid grid-cols-8 mx-4 lg:grid lg:grid-cols-6 lg:mx-6 xl:grid-cols-4'>

        <div className='bg-gradient-to-r from-[#2193b0] to-[#6dd5ed] rounded-xl w-[54vw] py-2 px-2 grid grid-cols-4 md:grid-cols-3 md:col-span-3 md:w-full md:h-full lg:col-span-2 xl:col-span-1 xl:h-58 2xl:h-64'>
          <h2 className='flex justify-center items-center col-span-4 text-[10vw] font-bold md:text-[5vw] lg:text-[4vw] xl:text-[2.6vw]'>Lotes</h2>
          <h2 className='col-span-3 flex justify-start items-center text-[8vw] font-bold pt-1 text-white md:col-span-2 md:text-[2.8vw] lg:text-[3vw] xl:text-[2.2vw]'>Total</h2>
          <h2 className='text-[8vw] flex justify-end items-center font-bold pt-1 text-black md:text-[4vw] lg:text-[3vw] xl:text-[2.6vw]'>{totalLotes}</h2>
          <h2 className='col-span-3 flex justify-start items-center text-[8vw] font-bold pt-1 text-white md:col-span-2 md:text-[2.8vw] lg:text-[3vw] xl:text-[2.2vw]'>Vendidos</h2>
          <h2 className='text-[8vw] flex justify-end items-center font-bold pt-1 text-black md:text-[4vw] lg:text-[3vw] xl:text-[2.6vw]'>{sumar('lotesVendidos')}</h2>
        </div>
        <div className='bg-gradient-to-r from-[#158c08] to-[#158c08] rounded-xl py-2 w-[54vw] md:col-span-5 md:w-full lg:col-span-4 xl:col-span-1 xl:h-58 2xl:h-64'>
          <div className='grid grid-cols-3 grid-rows-1 items-center px-2'>
            <h2 className='text-[4.4vw] font-bold pt-3 text-white text-right md:text-[3.2vw] lg:text-[3.2vw] xl:text-[1.5vw]'>Ventas:</h2>
            <h2 className='col-span-2 text-[4.4vw] pt-3 text-white text-right md:text-[3vw] lg:text-[3.2vw] xl:text-[1.5vw]'>$ {sumar('totalVentas').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            <h2 className='text-[4.4vw] font-bold pt-3 text-white text-right md:text-[3.2vw] lg:text-[3.7vw] xl:text-[1.5vw]'>Bonos:</h2>
            <h2 className='col-span-2 text-[4.4vw] pt-3 text-white text-right md:text-[3vw] lg:text-[3.7vw] xl:text-[1.5vw]'>$ {sumar('bonos').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            <Divider className='col-span-3'  sx={{ my: 1, borderColor: 'white' }} />
            <h2 className='text-[4.4vw] font-bold pt-3 text-white text-right md:text-[3.2vw] lg:text-[3.7vw] xl:text-[1.5vw]'>Real:</h2>
            <h2 className='col-span-2 text-[4.4vw] pt-3 text-white text-right md:text-[3vw] lg:text-[3.7vw] xl:text-[1.5vw]'>$ {total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          </div>
        </div>
        <div className='bg-gradient-to-r from-[#b71c1c] to-[#b71c1c] rounded-xl w-[54vw] py-2 md:col-span-5 md:w-full lg:col-span-4 xl:col-span-1 xl:h-58 2xl:h-64'>
          <div className='grid grid-cols-3 px-2'>
            <h2 className='text-[4.4vw] font-bold pt-3 text-white text-right md:text-[3.2vw] lg:text-[3.7vw] xl:text-[1.5vw]'>Pagos:</h2>
            <h2 className='col-span-2 text-[4.4vw] pt-3 text-white text-right md:text-[3vw] lg:text-[3.7vw] xl:text-[1.5vw]'>$ {sumar('pagos').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            <h2 className='text-[4.4vw] font-bold pt-3 text-white text-right md:text-[3.2vw] lg:text-[3.7vw] xl:text-[1.5vw]'>3%:</h2>
            <h2 className='col-span-2 text-[4.4vw] pt-3 text-white text-right md:text-[3vw] lg:text-[3.7vw] xl:text-[1.5vw]' >$ {sumar('tresPorciento').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            <h2 className='text-[4.4vw] font-bold pt-3 text-white text-right md:text-[3.2vw] lg:text-[3.7vw] xl:text-[1.5vw]'>2%:</h2>
            <h2 className='col-span-2 text-[4.4vw] pt-3 text-white text-right md:text-[3vw] lg:text-[3.7vw] xl:text-[1.5vw]'>$ {sumar('dosPorciento').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            <Divider className='col-span-3'  sx={{ my: 1, borderColor: 'white' }} />
            <h2 className='text-[4.4vw] font-bold pt-3 text-white text-right md:text-[3.2vw] lg:text-[3.7vw] xl:text-[1.5vw]'>Real:</h2>
            <h2 className='col-span-2 text-[4.4vw] pt-3 text-white text-right md:text-[3vw] lg:text-[3.7vw] xl:text-[1.5vw]'>$ {pagos.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          </div>
        </div>
        <div className='bg-[#01579b] rounded-xl w-[54vw] py-2 flex flex-col justify-center items-center md:col-span-3 md:w-full md:h-full lg:col-span-2 xl:col-span-1 xl:h-58 2xl:h-64' >
          <h2 className='text-[4.4vw] font-bold pt-3 text-white text-right md:text-[3.2vw] lg:text-[3.7vw] xl:text-[1.6vw]'>Por cobrar:</h2>
          <Box display="flex" justifyContent="center" mt={2}>
            <CircularProgress variant="determinate" value={porcentaje} size={100} thickness={6} />
            <Box position="absolute" mt={5}>
              <Typography variant="body1" color="white" fontSize={"24px"}>{Math.round(porcentaje)}%</Typography>
            </Box>
          </Box>
          <h2 className='col-span-2 text-[4.4vw] pt-3 text-white text-right md:text-[2.6vw] lg:text-[3vw] xl:text-[1.5vw]'>$ {deuda.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>

        </div>
      </div>



    </div>   
  )
}