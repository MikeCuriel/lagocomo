"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "../../lib/supabase"
import dayjs from "dayjs"
import { Pencil, Trash2, Eye, Upload } from "lucide-react"
import { toast } from "sonner"
import { useAuthRedirect } from "../../hooks/useAuthRedirect"
import {
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
  DialogActions,
  Box,
  Pagination,
  FormHelperText,
} from "@mui/material"
import { useDropzone } from "react-dropzone"
import imageCompression from "browser-image-compression"
import Image from "next/image"

type Movimiento = {
  id: number
  tipo: "ingreso" | "egreso"
  descripcion: string
  monto: number
  fecha: string
  recibo: string
  tipoPago: string
  imagen?: string
}

type AgrupacionMensual = {
  mes: string
  entrada: number
  salida: number
}

export default function ControlFlujoCaja() {
  const isReady = useAuthRedirect()
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [tipo, setTipo] = useState<"ingreso" | "egreso">("ingreso")
  const [descripcion, setDescripcion] = useState("")
  const [monto, setMonto] = useState<number | "">("")
  const [fecha, setFecha] = useState(dayjs().format("YYYY-MM-DD"))
  const [recibo, setRecibo] = useState("")
  const [tipoPago, setTipoPago] = useState("")
  const [mostrarModal, setMostrarModal] = useState(false)
  const [editando, setEditando] = useState<Movimiento | null>(null)
  const [paginaActual, setPaginaActual] = useState(1)
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "ingreso" | "egreso">("todos")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const filasPorPagina = 15
  const [anioSeleccionado] = useState<string>("todos")
  const [imagen, setImagen] = useState<File | null>(null)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const [mostrarImagenModal, setMostrarImagenModal] = useState(false)
  const [imagenSeleccionada, setImagenSeleccionada] = useState<string | null>(null)

  const opcionesEntrada = ["Deposito", "Transferencia", "Efectivo", "Traspaso"]
  const opcionesSalida = ["Pagos", "Administración", "Cargos"]
  const descripcionEntrada = ["Enganche", "Mensualidad", "Finiquito", "Aportaciones", "Prestamo"]
  const descripcionSalida = ["Pago Fraccionamiento", "Administracion", "Comisiones", "Sueldos", "Viaticos", "Gratificaciones", "Servicios", "Oficina", "Prestamos socios", "Primera etapa", "Segunda etapa", "Tercera etapa", "Cuarta etapa", "Generales", "Construcción", "Pavimentación", "Jardinería", "Electrificación", "GATCE"]

  const [autenticado, setAutenticado] = useState(false)
  const [contrasena, setContrasena] = useState("")

  const cargarMovimientos = async () => {
    const { data, error } = await supabase.from("movimientos").select("*").order('fecha')
    if (!error && data) setMovimientos(data)
  }

  useEffect(() => {
    cargarMovimientos()
  }, [])

  // Función para comprimir la imagen
  const comprimirImagen = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    }

    try {
      return await imageCompression(file, options)
    } catch (error) {
      console.error("Error al comprimir la imagen:", error)
      return file
    }
  }

  // Configuración del dropzone para arrastrar y soltar imágenes
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]

      // Comprimir la imagen
      const compressedFile = await comprimirImagen(file)
      setImagen(compressedFile)

      // Crear una URL para previsualizar la imagen
      const previewUrl = URL.createObjectURL(compressedFile)
      setImagenPreview(previewUrl)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
    maxFiles: 1,
  })

  const movimientosFiltrados = movimientos.filter((m) => {
    const cumpleTipo = filtroTipo === "todos" || m.tipo === filtroTipo
    const cumpleInicio = fechaInicio ? dayjs(m.fecha).isAfter(dayjs(fechaInicio).subtract(1, "day")) : true
    const cumpleFin = fechaFin ? dayjs(m.fecha).isBefore(dayjs(fechaFin).add(1, "day")) : true
    return cumpleTipo && cumpleInicio && cumpleFin
  })

  const subirImagen = async (file: File): Promise<string | null> => {
    if (!file) return null

    const fileExt = file.name.split(".").pop()
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `movimientos/${fileName}`

    const { error: uploadError } = await supabase.storage.from("imagenes").upload(filePath, file)

    if (uploadError) {
      toast.error("Error al subir la imagen: " + uploadError.message)
      return null
    }

    const { data } = supabase.storage.from("imagenes").getPublicUrl(filePath)
    return data.publicUrl
  }

  const guardarMovimiento = async () => {
    if (!descripcion || !monto || !tipoPago || !fecha) {
      return toast.error("Todos los campos son obligatorios")
    }
  
    let imagenUrl = null
    if (imagen) {
      imagenUrl = await subirImagen(imagen)
    }
  
    const payload: Partial<Movimiento> = {
      tipo,
      descripcion,
      monto: Number(monto),
      fecha,
      recibo,
      tipoPago,
    }
  
    if (imagenUrl) {
      payload.imagen = imagenUrl
    } else if (editando?.imagen) {
      payload.imagen = editando.imagen
    }
  
    if (editando) {
      const { error } = await supabase.from("movimientos").update(payload).eq("id", editando.id)
      if (error) return toast.error("Error al actualizar: " + error.message)
      toast.success("Movimiento actualizado correctamente")
    } else {
      const { error } = await supabase.from("movimientos").insert([payload])
      if (error) return toast.error("Error al guardar: " + error.message)
      toast.success("Movimiento agregado correctamente")
    }
  
    await cargarMovimientos()
    limpiarFormulario()
  }

  const eliminarMovimiento = async (id: number) => {
    if (confirm("¿Deseas eliminar este movimiento?")) {
      await supabase.from("movimientos").delete().eq("id", id)
      await cargarMovimientos()
      toast.success("Movimiento eliminado")
    }
  }

  const limpiarFormulario = () => {
    setDescripcion("")
    setMonto("")
    setRecibo("")
    setTipoPago("")
    setFecha(dayjs().format("YYYY-MM-DD"))
    setTipo("ingreso")
    setMostrarModal(false)
    setEditando(null)
    setImagen(null)
    setImagenPreview(null)
  }

  const verImagen = (url: string) => {
    setImagenSeleccionada(url)
    setMostrarImagenModal(true)
  }

  const movimientosPorAnio =
    anioSeleccionado === "todos"
      ? movimientos
      : movimientos.filter((m) => dayjs(m.fecha).year().toString() === anioSeleccionado)

  const datosAgrupados: AgrupacionMensual[] = movimientosPorAnio.reduce((acc: AgrupacionMensual[], mov) => {
    const mesLabel = dayjs(mov.fecha).format("MMM YYYY")
    let item = acc.find((d) => d.mes === mesLabel)
    if (!item) {
      item = { mes: mesLabel, entrada: 0, salida: 0 }
      acc.push(item)
    }

    if (mov.tipo === "ingreso") item.entrada += mov.monto
    if (mov.tipo === "egreso") item.salida += mov.monto

    return acc
  }, [])

  datosAgrupados.sort(
    (a, b) => dayjs(a.mes, "MMM YYYY").toDate().getTime() - dayjs(b.mes, "MMM YYYY").toDate().getTime(),
  )

  const inicio = (paginaActual - 1) * filasPorPagina
  const fin = inicio + filasPorPagina
  const movimientosPaginados = movimientosFiltrados.slice(inicio, fin)
  const totalPaginas = Math.ceil(movimientosFiltrados.length / filasPorPagina)

  if (!autenticado) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="#f5f5f5"
        p={3}
      >
        <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: "100%" }}>
          <Typography variant="h5" fontWeight="bold" mb={3} textAlign="center">
            Acceso restringido
          </Typography>
          <TextField
            type="password"
            placeholder="Ingresa la contraseña"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
            size="small"
          />
          <Button
            onClick={() => {
              if (contrasena === "Admin25!") {
                setAutenticado(true)
              } else {
                alert("Contraseña incorrecta")
                setContrasena("")
              }
            }}
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
          >
            Entrar
          </Button>
        </Paper>
      </Box>
    )
  }

  if (!isReady) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh">
        <Typography color="text.secondary">Cargando...</Typography>
      </Box>
    )
  }

  return (
    <Box maxWidth="1200px" mx="auto" py={4} px={2}>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Control de Entradas y Salidas
      </Typography>

      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Box
          display="flex"
          flexDirection={{ xs: "column", md: "row" }}
          alignItems={{ md: "center" }}
          justifyContent={{ md: "space-between" }}
          gap={2}
          mb={3}
        >
          <Box display="flex" flexWrap="wrap" alignItems="center" gap={1}>
            <Typography variant="body2" fontWeight="medium" color="text.secondary">
              Filtrar:
            </Typography>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={filtroTipo}
                onChange={(e) => {
                  setFiltroTipo(e.target.value as "todos" | "ingreso" | "egreso")
                  setPaginaActual(1)
                }}
                displayEmpty
                size="small"
              >
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="ingreso">Ingreso</MenuItem>
                <MenuItem value="egreso">Egreso</MenuItem>
              </Select>
            </FormControl>

            <TextField
              type="date"
              value={fechaInicio}
              onChange={(e) => {
                setFechaInicio(e.target.value)
                setPaginaActual(1)
              }}
              size="small"
              InputLabelProps={{ shrink: true }}
              label="Desde"
            />

            <TextField
              type="date"
              value={fechaFin}
              onChange={(e) => {
                setFechaFin(e.target.value)
                setPaginaActual(1)
              }}
              size="small"
              InputLabelProps={{ shrink: true }}
              label="Hasta"
            />
          </Box>

          <Button variant="contained" color="primary" onClick={() => setMostrarModal(true)}>
            Agregar movimiento
          </Button>
        </Box>

        {/* Tabla de movimientos */}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                <TableCell>Fecha</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Tipo de Pago</TableCell>
                <TableCell>Recibo</TableCell>
                <TableCell>Monto</TableCell>
                <TableCell>Imagen</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {movimientosPaginados.map((m) => (
                <TableRow key={m.id} hover>
                  <TableCell>{dayjs(m.fecha).format("DD/MM/YYYY")}</TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>{m.tipo}</TableCell>
                  <TableCell>{m.descripcion}</TableCell>
                  <TableCell>{m.tipoPago}</TableCell>
                  <TableCell>{m.recibo}</TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "medium",
                      color: m.tipo === "ingreso" ? "success.main" : "error.main",
                    }}
                  >
                    ${m.monto.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    {m.imagen && (
                      <IconButton size="small" color="primary" onClick={() => verImagen(m.imagen!)}>
                        <Eye size={18} />
                      </IconButton>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => {
                          setEditando(m)
                          setTipo(m.tipo)
                          setDescripcion(m.descripcion)
                          setMonto(m.monto)
                          setFecha(m.fecha)
                          setRecibo(m.recibo)
                          setTipoPago(m.tipoPago)
                          if (m.imagen) {
                            setImagenPreview(m.imagen)
                          }
                          setMostrarModal(true)
                        }}
                      >
                        <Pencil size={18} />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => eliminarMovimiento(m.id)}>
                        <Trash2 size={18} />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {movimientosPaginados.length === 0 && (
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
              Mostrando {inicio + 1}-{Math.min(fin, movimientosFiltrados.length)} de {movimientosFiltrados.length}
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
        <Dialog open={mostrarModal} onClose={limpiarFormulario} fullWidth maxWidth="sm">
          <DialogTitle>{editando ? "Editar movimiento" : "Agregar movimiento"}</DialogTitle>
          <DialogContent dividers>
            <Box display="flex" flexDirection="column" gap={2}>
              {/* Tipo */}
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={tipo}
                  label="Tipo"
                  onChange={(e) => {
                    setTipo(e.target.value as "ingreso" | "egreso")
                    setTipoPago("")
                  }}
                >
                  <MenuItem value="ingreso">Ingreso</MenuItem>
                  <MenuItem value="egreso">Egreso</MenuItem>
                </Select>
              </FormControl>

              {/* Tipo de pago */}
              <FormControl fullWidth>
                <InputLabel>Tipo de pago</InputLabel>
                <Select value={tipoPago} label="Tipo de pago" onChange={(e) => setTipoPago(e.target.value)}>
                  <MenuItem value="" disabled>
                    Selecciona una opción
                  </MenuItem>
                  {(tipo === "ingreso" ? opcionesEntrada : opcionesSalida).map((op) => (
                    <MenuItem key={op} value={op}>
                      {op}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Descripción */}
              <FormControl fullWidth>
                <InputLabel>Descripcion</InputLabel>
                <Select value={descripcion} label="Descripcion" onChange={(e) => setDescripcion(e.target.value)}>
                  <MenuItem value="" disabled>
                    Selecciona una opción
                  </MenuItem>
                  {(tipo === "ingreso" ? descripcionEntrada : descripcionSalida).map((op) => (
                    <MenuItem key={op} value={op}>
                      {op}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Monto */}
              <TextField
                label="Monto"
                type="number"
                value={monto}
                onChange={(e) => setMonto(Number(e.target.value))}
                fullWidth
                InputProps={{
                  startAdornment: "$",
                }}
              />

              {/* Fecha */}
              <TextField
                label="Fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
              />

              {/* Recibo */}
              <TextField type="number" label="Recibo" value={recibo} onChange={(e) => setRecibo(e.target.value)} fullWidth />

              {/* Drag & Drop para imágenes */}
              <Box>
                <Typography variant="subtitle2" mb={1}>
                  Imagen del comprobante
                </Typography>
                <Box
                  {...getRootProps()}
                  sx={{
                    border: "2px dashed",
                    borderColor: isDragActive ? "primary.main" : "divider",
                    borderRadius: 1,
                    p: 2,
                    textAlign: "center",
                    cursor: "pointer",
                    bgcolor: isDragActive ? "action.hover" : "background.paper",
                    transition: "all 0.2s",
                  }}
                >
                  <input {...getInputProps()} />
                  <Upload size={24} style={{ margin: "0 auto 8px" }} />
                  {isDragActive ? (
                    <Typography variant="body2">Suelta la imagen aquí...</Typography>
                  ) : (
                    <Typography variant="body2">
                      Arrastra y suelta una imagen aquí, o haz clic para seleccionar
                    </Typography>
                  )}
                </Box>
                <FormHelperText>La imagen se comprimirá automáticamente</FormHelperText>

                {/* Vista previa de la imagen */}
                {imagenPreview && (
                  <Box mt={2} textAlign="center">
                    <Image
                      src={imagenPreview || "/placeholder.svg"}
                      alt="Vista previa"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "200px",
                        borderRadius: "4px",
                      }}
                    />
                    <Button
                      variant="text"
                      color="error"
                      size="small"
                      onClick={() => {
                        setImagen(null)
                        setImagenPreview(null)
                      }}
                      sx={{ mt: 1 }}
                    >
                      Eliminar imagen
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={limpiarFormulario}>Cancelar</Button>
            <Button onClick={guardarMovimiento} variant="contained" color="primary">
              {editando ? "Actualizar" : "Guardar"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal para ver imagen */}
        <Dialog open={mostrarImagenModal} onClose={() => setMostrarImagenModal(false)} maxWidth="md">
          <DialogContent sx={{ p: 1 }}>
            {imagenSeleccionada && (
              <Image
                src={imagenSeleccionada || "/placeholder.svg"}
                alt="Comprobante"
                style={{
                  maxWidth: "100%",
                  maxHeight: "80vh",
                  display: "block",
                  margin: "0 auto",
                }}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMostrarImagenModal(false)}>Cerrar</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  )
}
