// Middleware para manejar errores globales
export default (err, req, res, next) => {
  console.error('Error:', err)
  
  const status = err.status || 500
  const message = err.message || 'Error interno del servidor'
  
  res.status(status).json({
    error: message,
    status,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}
