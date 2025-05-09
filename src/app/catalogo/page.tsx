// 'use client'

// import { supabase } from '../../lib/supabase'
// import { useEffect, useState } from 'react'
// import { useForm } from 'react-hook-form'
// import { Pencil, Trash2 } from 'lucide-react'
// import { useAuthRedirect } from '../../hooks/useAuthRedirect'
// import {UserTableToolbar, UserTableRow} from '../../hooks/user/list'
// import {

//   Table,

//   TableContainer,

//   useMediaQuery,
//   useTheme,

//   Card,
//   Tabs,
//   Tab,
//   Container,
//   Divider,
  
 

// } from '@mui/material'

// import {
//   useTable,
//   getComparator,
//   emptyRows,
//   TableNoData,
//   TableEmptyRows,
//   TableHeadCustom,
//   TableSelectedAction,
//   TablePaginationCustom,
// } from '../../components/table';
// import { Description } from '@mui/icons-material'

// type Estatus = 'Todos' | 'Fijos' | 'Variables'

// type Gasto = {
//   id: number
//   descripcion: string
//   fijo: boolean
// }

// const estatusOptions: Estatus[] = ['Todos', 'Fijos', 'Variables']
// const TABLE_HEAD = [
//   { id: 'descripcion', label: 'Descripcion', align: 'left' },
//   { id: 'fijo', label: 'Fijo', align: 'left' },
//   { id: '' },
// ];

export default function GastosPage() {
  
  // const {
  //   dense,
  //   page,
  //   order,
  //   orderBy,
  //   rowsPerPage,
  //   setPage,
  //   //
  //   selected,
  //   setSelected,
  //   onSelectRow,
  //   onSelectAllRows,
  //   //
  //   onSort,
  //   onChangeDense,
  //   onChangePage,
  //   onChangeRowsPerPage,
  // } = useTable();

    // const [filtro, setFiltro] = useState<'Todos' | 'Fijos' | 'Variables'>('Todos')
    // const [mostrarFormulario, setMostrarFormulario] = useState(false)
    // const [descripcion, setDescripcion] = useState('')
    // const [fijo, setFijo] = useState(false)
    // const [gasto, setGasto] = useState<Gasto[]>([])
    // const [modoEdicion, setModoEdicion] = useState<Gasto | null>(null)
    // const [mensaje, setMensaje] = useState<{ texto: string, tipo: 'success' | 'error' } | null>(null)
    // const [paginaActual, setPaginaActual] = useState(1)
    // const filasPorPagina = 15
    // const theme = useTheme()
    // const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    // const [tableData, setTableData] = useState<Gasto[]>([])
    // const [filterDesc, setFilterDesc] = useState('');
    // const denseHeight = dense ? 52 : 72;

    // const { register, handleSubmit, reset } = useForm<Partial<Gasto>>({
    //     defaultValues: {
    //     descripcion: '',
    //     fijo: false,
    //     }
    // })

    // const gastosFiltrados = gasto.filter(gasto => {
    //     if (filtro === 'Todos') return true
    //     if (filtro === 'Fijos') return gasto.fijo
    //     if (filtro === 'Variables') return !gasto.fijo
    //     return true
    // })

  //   const cargarDatos = async () => {
  //       const { data, error } = await supabase.from('tipo_gasto').select('*')
  //       if (!error && data) setTableData(data as Gasto[])
  //   }

  //   useEffect(() => {
  //       cargarDatos()
  //   }, [])

  //   const onSubmit = async (nuevoGasto: Partial<Gasto>) => {
  //       if (!nuevoGasto.descripcion || !nuevoGasto.fijo) {
  //           return alert('Todos los campos obligatorios deben estar completos')
  //       }

  //       const { data: existente } = await supabase
  //       .from('tipo_gasto')
  //       .select('folio')
  //       .eq('descripcion', nuevoGasto.descripcion)

  //       if (!modoEdicion && existente && existente.length > 0) {
  //       return alert('Ya existe un tipo de gasto con esa descripción')
  //       }

  //       const { error } = modoEdicion
  //       ? await supabase.from('tipo_gasto').update(nuevoGasto).eq('id', nuevoGasto.id)
  //       : await supabase.from('tipo_gasto').insert([nuevoGasto])

  //       if (error) return alert('Error al guardar: ' + error.message)

  //       setMostrarFormulario(false)
  //       setModoEdicion(null)
  //       reset()
  //       cargarDatos()
  //   }

  //   const eliminarGasto = async (gastoId: number) => {
  //   const confirmacion = confirm('¿Estás seguro que deseas eliminar este tipo de gasto?')
  //   if (!confirmacion) return
    
  //   const { error } = await supabase.from('tipo_gasto').delete().eq('id', gastoId)
  //   if (!error) {
  //       setMensaje({ texto: 'Lote eliminado correctamente.', tipo: 'success' })
  //       await cargarDatos()
  //   } else {
  //       setMensaje({ texto: 'Error al eliminar el lote.', tipo: 'error' })
  //   }

  //   setTimeout(() => setMensaje(null), 3000) // Borra el mensaje después de 3s
  //   setPaginaActual(1)
  //   }

  //   // const handleFilterDesc = (event: Gasto) => {
  //   //   setPage(0);
  //   //   setFilterDesc(event.target.value);
  //   // };

  //   const handleFilterStatus = (newValue : Estatus) => {
  //     setPaginaActual(0);
  //     setFiltro(newValue);
  //   };

  //   const handleDeleteRow = (gastoId: Gasto) => {
  //     const deleteRow = tableData.filter((row) => row.id !== gastoId.id);
  //     setSelected([]);
  //     setTableData(deleteRow);  
  //     setPage(0);
  //   };

  // const inicio = (paginaActual - 1) * filasPorPagina
  // const fin = inicio + filasPorPagina
  // const gastoPaginados = gastosFiltrados.slice(inicio, fin)
  // const totalPaginas = Math.ceil(gastosFiltrados.length / filasPorPagina)
  
  // const isNotFound =
  // (!gastosFiltrados.length && !!filterDesc)

  return (
    <div>

    </div>
    // <Container maxWidth="xl">
    //   <Card>
    //     <Tabs value={filtro}
    //       onChange={(e, v) => handleFilterStatus(v)}
    //       sx={{
    //         px: 2,
    //         bgcolor: 'background.neutral',
    //       }}>
    //       {estatusOptions.map((tab) => (
    //         <Tab key={tab} label={tab} value={tab} />
    //       ))}
    //     </Tabs>
    //     <Divider />

    //     <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
    //       <Table size={'medium'} sx={{ minWidth: 800 }}>


    //       </Table>            
    //     </TableContainer>
    //   </Card>
    // </Container>

    
  )
}
