import mongoose from "mongoose";
import Ticket from "../models/Tickets.js";

// Este hanlder recibe una peticion HTTP (req) y construye una respuesta (res)
export default async function handler(req, res) {
  try {
    // readyState === 0 significa "desconectado"; await espera a que la conexion termine antes de intentar hacer otra consulta
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    //  El metodo HTTP indica que la operacion crud que solicitemos
    // CRUD= Create Read Update Delete
    const { method } = req;

    // GET (Read) Consultar con soporte para operadores ($regex, $exists, filtros)

    // req.query contiene los parametros que le podemos pasar por url
    // por ejemplo /api/tickets?estado=abierto.
    // El filtro empieza vacio, asi que no llega si no llega ninguin parametro, Ticket.find devuelve todos los tickets
    if (method === "GET") {
      // req.query contiene los parámetros de la URL, por ejemplo:
      // /api/tickets?estado=abierto. El filtro empieza vacío, así que si no
      // llega ningún parámetro, Ticket.find({}) devuelve todos los tickets.
      const { prioridad, estado, buscar, sinAsignar } = req.query;
      const filtro = {};

      // Solo se añade cada condición si su parámetro está presente.
      // Estas asignaciones son ejemplos de if de una sola instrucción:
      // la instrucción inmediatamente posterior al if es la única condicionada.
      if (prioridad) filtro.prioridad = prioridad;
      if (estado) filtro.estado = estado;
      if (buscar) {
        // $regex busca el texto dentro del título y la opción "i" ignora
        // diferencias entre mayúsculas y minúsculas.
        filtro.titulo = { $regex: buscar, $options: "i" };
      }
      if (sinAsignar === "true") {
        // Los parámetros de query llegan como texto. Se compara con "true"
        // y $exists: false selecciona documentos sin ese campo guardado.
        filtro.agenteAsignado = { $exists: false };
      }

      // sort({ createdAt: -1 }) ordena de más reciente a más antiguo.
      // Se devuelve tanto el total encontrado como los documentos.
      const tickets = await Ticket.find(filtro).sort({ createdAt: -1 });
      return res.status(200).json({ total: tickets.length, datos: tickets });
    }

    // Si method no conincide con Get, la ruta no admite esa operacion. 405 significa method not allowed
    return res.status(405).json({ error: `Metodo ${method} no permitido` });
  } catch (error) {
    return res.status(400).json({
      error: "Error en la operacion CRud",
      detalle: error.message,
    });
  }
}
