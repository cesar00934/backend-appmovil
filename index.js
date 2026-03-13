import "./configs/env.js";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { requestLogger } from "./lib/logger.js";

// Importación de rutas
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import residuosRoutes from "./routes/residuos.js";

const app = express();

// --- 1. CONFIGURACIÓN DE RED (CRÍTICO PARA ESCALA) ---
// Esto permite que el rate-limit detecte la IP REAL del usuario y no la del hosting.
app.set('trust proxy', 1);

// --- 2. MIDDLEWARES DE SEGURIDAD Y RENDIMIENTO ---
app.use(requestLogger); // El logger primero para ver todo lo que entra
app.use(compression()); // Comprime respuestas para mayor velocidad
app.use(helmet());      // Capa de blindaje HTTP

// --- 3. CORS ESTRICTO ---
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : [];

app.use(cors({
  origin: (origin, callback) => {
    // Permitimos apps móviles/Postman (!origin) o dominios en lista blanca
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por seguridad: Origen no autorizado'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// --- 4. PROTECCIÓN DE MEMORIA Y TRÁFICO ---
app.use(express.json({ limit: "100kb" }));

const limiter = rateLimit({
  // Usa las variables de tu .env o valores por defecto seguros
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  message: { error: "Demasiadas peticiones. Intenta más tarde." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// --- 5. RUTAS ---
app.get("/health", (req, res) => res.json({
  status: "online",
  version: "1.0.0",
  timestamp: new Date().toISOString()
}));

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/residuos", residuosRoutes);

// --- 6. MANEJO GLOBAL DE ERRORES ---
app.use((err, req, res, next) => {
  // Solo logueamos el error internamente, no se lo enviamos al cliente
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  res.status(err.status || 500).json({
    error: "Error interno del servidor. Por favor, intente más tarde."
  });
});

export default app;