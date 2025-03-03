import express from 'express';
import cors from 'cors';
import { PORT } from "./config.js"
import roomsRoutes from "./routes/rooms.routes.js"
import usersRoutes from "./routes/users.routes.js"
import studentRoutes from "./routes/students.routes.js"
import excelRoutes from "./routes/excel.routes.js"
import cookieParser from 'cookie-parser';
import authenticateToken from './middlewares/authToken.js';
const app = express()
const port = PORT || 4000
console.log('process.env.NODE_ENV')
app.use(cors({
  credentials: true,
  origin: [
    'http://localhost:5173', // El dominio de tu aplicación React
    'https://8sjhz1qh-5173.use.devtunnels.ms',
    'https://8sjhz1qh-3000.use.devtunnels.ms'
  ] // El dominio del túnel de VS Code
}))
app.use(express.json())
app.use(cookieParser());
// Database connection
// Routes
app.use(roomsRoutes)
app.use(usersRoutes)
app.use(studentRoutes)
app.use(excelRoutes)
app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})


