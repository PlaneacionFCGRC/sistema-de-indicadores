// Archivo: Indicadores_mongodb/server.js
// Backend PRO optimizado, compatible con app_api2.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// -------------------------------------------
// CONFIGURACIÓN BASE
// -------------------------------------------
const app = express();
const PORT = process.env.PORT || 3000;

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('❌ ERROR: Falta MONGO_URI en .env');
    process.exit(1);
}

app.use(cors());
app.use(express.json({ limit: "5mb" })); // JSON grande sin problemas

// -------------------------------------------
// SCHEMA DE MONGODB
// -------------------------------------------
const IndicadorSchema = new mongoose.Schema({
    anio: {
        type: String,
        required: false   // ← AHORA OPCIONAL PARA EVITAR ERRORES
    },

    poblacion: {
        type: String,
        enum: ["DIRECTA", "INDIRECTA"],
        required: true
    },

    municipio: {
        type: String,
        required: true,
        trim: true
    },

    estrategia: {
        type: String,
        required: true,
        trim: true
    },

    sujeto: {
        type: String,
        required: true,
        trim: true
    },

    despliegue: {
        type: String,
        required: false,  // ← YA NO ROMPE REGISTROS SIN DESPLIEGUE
        trim: true
    },

    cantidad: {
        type: Number,
        required: true,
        min: 1
    },

    observaciones: {
        type: String,
        default: ""
    },

    fechaCreacion: {
        type: Date,
        default: Date.now
    }
});

const Indicador = mongoose.model(
    "Indicador",
    IndicadorSchema,
    "indicadores_coleccion"
);
mongoose.set("strictQuery", false);
// -------------------------------------------
// CONEXIÓN MONGODB
// -------------------------------------------
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("🎉 Conectado a MongoDB Atlas");
        app.listen(PORT, () =>
            console.log(`🚀 API en http://localhost:${PORT}`)
        );
    })
    .catch(err => {
        console.error("❌ Error conexión MongoDB:", err.message);
        process.exit(1);
    });

// -------------------------------------------
// RUTAS API
// -------------------------------------------

// Crear registro
app.post('/api/indicadores', async (req, res) => {
    try {
        const nuevo = new Indicador(req.body);
        await nuevo.save();

        return res.status(201).json({ data: nuevo });

    } catch (error) {
        return res.status(400).json({
            mensaje: "Error al guardar",
            detalles: error.message
        });
    }
});

// Obtener todos
app.get('/api/indicadores', async (req, res) => {
    try {
        const data = await Indicador.find().sort({ fechaCreacion: -1 });
        return res.json({ data });

    } catch (error) {
        return res.status(500).json({
            mensaje: "Error al obtener registros",
            error: error.message
        });
    }
});

// Editar
app.put('/api/indicadores/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const actualizado = await Indicador.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!actualizado) {
            return res.status(404).json({ mensaje: "No encontrado" });
        }

        return res.json({ data: actualizado });

    } catch (error) {
        return res.status(400).json({
            mensaje: "Error al actualizar",
            detalles: error.message
        });
    }
});

// Eliminar
app.delete('/api/indicadores/:id', async (req, res) => {
    try {
        const eliminado = await Indicador.findByIdAndDelete(req.params.id);

        if (!eliminado) {
            return res.status(404).json({ mensaje: "No encontrado" });
        }

        return res.json({ data: { ok: true } });

    } catch (error) {
        return res.status(500).json({
            mensaje: "Error al eliminar",
            error: error.message
        });
    }
});

// -------------------------------------------
// CATCH GENERAL (Evita caída del servidor)
// -------------------------------------------
process.on("uncaughtException", err => {
    console.error("❌ Excepción no controlada:", err);
});

process.on("unhandledRejection", err => {
    console.error("❌ Promesa rechazada no manejada:", err);
});
