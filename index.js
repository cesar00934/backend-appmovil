import "./configs/env.js";
import express from "express";import helmet from "helmet";
import cors from "cors";
import compression from "compression"; // Ahorra ancho de banda masivo
import rateLimit from "express-rate-limit";
import { requestLogger } from "./lib/logger.js";

// Importación de rutas
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import residuosRoutes from "./routes/residuos.js"; // ¡No olvides esta!

const app = express();

// 1. COMPRESIÓN Y SEGURIDAD BASE
app.use(compression());
app.use(helmet()); // Protege contra 15+ vulnerabilidades web conocidas

// 2. CONFIGURACIÓN DE CORS ESTRICTA (Lo que pediste)
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : []; // Si no hay nada en el .env, la lista es vacía []

app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin origen (como apps móviles o Postman)
    // Si quieres bloquear TODO, quita la condición de !origin
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Bloqueo total si no está en la lista blanca
      callback(new Error('Bloqueado por seguridad: Origen no autorizado'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. LIMITACIÓN DE DATOS (Anti-hackers de memoria)
// Reducimos a 100kb. Suficiente para JSON, pero evita que saturen tu RAM.
app.use(express.json({ limit: "100kb" }));
app.use(requestLogger);

// 4. CONTROL DE TRÁFICO MASIVO (Rate Limiting)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Ventana de 15 minutos
  max: 1000, // Máximo 1000 peticiones por IP en esa ventana
  message: { error: "Demasiadas peticiones. Intenta más tarde." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 5. RUTAS
app.get("/health", (req, res) => res.json({ status: "online", speed: "optimal" }));

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes); // PROTEGIDA internamente por middleware
app.use("/residuos", residuosRoutes);

// 6. MANEJO GLOBAL DE ERRORES (No muestra detalles técnicos al hacker)
app.use((err, req, res, next) => {
  console.error("Error detectado:", err.message);
  res.status(500).json({ error: "Ocurrió un error en el servidor." });
});

export default app;