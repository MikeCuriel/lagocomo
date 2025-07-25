'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

const estadosColores = {
  Vendido: '#f87171',
  Donado: '#51a2ff',
  Apartado: '#facc15',
  Disponible: '#34d399',
  'No disponible': '#A2A2A2',
}
type Estatus = 'Vendido' | 'Donado' | 'Apartado' | 'Disponible' | 'No disponible'

type Lote = {
  id: number
  manzana: string
  lote: string
  superficie: number
  estatus: Estatus
  observacion: string
}

export default function PlanoLotes() {
  const [svgContent, setSvgContent] = useState<string | null>(null)
  // const [selectedLote, setSelectedLote] = useState<string | null>(null)
  const [lotes, setLotes] = useState<Lote[]>([])
  const [viewBox, setViewBox] = useState<[number, number, number, number]>([1000, 2500, 650000, 475000]) // Valores base de tu SVG
  const isPanning = useRef(false)
  const startPoint = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    fetch('/lgcomo9.svg')
      .then((res) => res.text())
      .then(setSvgContent)
  }, [])

  const cargarLotes = async () => {
      const { data, error } = await supabase.from('lote').select('*').order('folio')

      if (!error && data) setLotes(data)
    }
  
      useEffect(() => {
        cargarLotes()

    }, [])

  useEffect(() => {
    if (!svgContent) return

  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
  const svgElement = svgDoc.documentElement as unknown as SVGSVGElement; // <-- cast correcto
  svgElement.setAttribute('viewBox', viewBox.join(' '));

    svgElement.querySelectorAll('polygon, path').forEach((el, index) => {
      const element = el as SVGElement
      const id = element.getAttribute('id') || `lote-${index}`
      // console.log(id)

      // Buscar el lote correspondiente en Supabase por manzana + lote
      const idNormalizado = id.replace(/\s/g, '').toUpperCase()
      const loteData = lotes.find((l) => `${l.manzana}${l.lote}`.replace(/\s/g, '').toUpperCase() === idNormalizado
      )

      const estado = loteData?.estatus || 'No disponible'
      element.setAttribute('fill', estadosColores[estado])
      element.style.cursor = 'pointer'

      // element.addEventListener('click', () => {
      //   console.log('🟢 Lote seleccionado:', id, loteData)
      //   setSelectedLote(id)
      // })
    })

  const container = containerRef.current;
  if (container) {
    container.innerHTML = '';
    container.appendChild(svgElement);

    svgElement.addEventListener('wheel', (e) => handleWheel(e, svgElement), { passive: false });
    svgElement.addEventListener('mousedown', handleMouseDown);
    svgElement.addEventListener('mousemove', handleMouseMove);
    svgElement.addEventListener('mouseup', handleMouseUp);
    svgElement.addEventListener('mouseleave', handleMouseUp);
    }
    
    return () => {
      if (container) container.innerHTML = '';
    };

  }, [svgContent, lotes, viewBox])

  // const cambiarEstado = (estado: keyof typeof estadosColores) => {
  //   if (!selectedLote) return
  //   const el = document.getElementById(selectedLote)
  //   if (el) {
  //     el.setAttribute('fill', estadosColores[estado])
  //     el.setAttribute('stroke-width', '50')
  //   }
  // }
  
    // Función para convertir coordenadas del mouse a coordenadas SVG
  const getSvgPoint = (svg: SVGSVGElement, event: WheelEvent | MouseEvent) => {
    const rect = svg.getBoundingClientRect()
    const scaleX = viewBox[2] / rect.width
    const scaleY = viewBox[3] / rect.height
    const svgX = viewBox[0] + (event.clientX - rect.left) * scaleX
    const svgY = viewBox[1] + (event.clientY - rect.top) * scaleY
    return { svgX, svgY }
  }

  // Zoom con scroll, centrado en el puntero
  const handleWheel = (e: WheelEvent, svgElement: SVGSVGElement) => {
    e.preventDefault()
    const zoomFactor = 1.1
    const { svgX, svgY } = getSvgPoint(svgElement, e)

    setViewBox(([x, y, w, h]) => {
      const direction = e.deltaY > 0 ? zoomFactor : 1 / zoomFactor
      const newW = w * direction
      const newH = h * direction

      // Ajuste para que el punto del puntero sea el centro del zoom
      const newX = svgX - (svgX - x) * (newW / w)
      const newY = svgY - (svgY - y) * (newH / h)

      return [newX, newY, newW, newH]
    })
  }

  // Pan con mouse
  const handleMouseDown = (e: MouseEvent) => {
    isPanning.current = true
    startPoint.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isPanning.current) return
    const dx = (e.clientX - startPoint.current.x) * (viewBox[2] / 1000)
    const dy = (e.clientY - startPoint.current.y) * (viewBox[3] / 1000)
    setViewBox(([x, y, w, h]) => [x - dx, y - dy, w, h])
    startPoint.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseUp = () => {
    isPanning.current = false
  }



  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Plano de Lotes</h2>
      <div ref={containerRef} className="border border-gray-300 rounded-xl overflow-auto max-h-[700px] w-3/4" />



      {/* {selectedLote && (
        <div className="mt-4 p-4 border rounded-xl bg-white shadow">
          <p className="mb-2"><strong>Lote:</strong> {selectedLote}</p>
          <div className="flex gap-2">
            {Object.entries(estadosColores).map(([estado, color]) => (
              <button
                key={estado}
                onClick={() => cambiarEstado(estado as keyof typeof estadosColores)}
                className="px-4 py-2 rounded font-semibold text-white"
                style={{ backgroundColor: color }}
              >
                {estado}
              </button>
            ))}
          </div>
        </div>
      )} */}
    </div>
  )
}
