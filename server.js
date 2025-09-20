import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch'; // Asegúrate de tener esto instalado

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de tus wallets (URLs Open Payments)
const wallets = {
  padre: "https://ilp.interledger-test.dev/padre",
  hijo1: "https://ilp.interledger-test.dev/hijo1"
};

// Endpoint que recibe del frontend y realiza el pago
app.post("/pagar", async (req, res) => {
  try {
    const { wallet, amount } = req.body;

    if (!wallets[wallet]) {
      return res.status(400).json({ message: "Wallet no encontrada" });
    }

    const paymentPointer = wallets[wallet];

    // Crear intento de pago
    const paymentResponse = await fetch(`${paymentPointer}/incoming-payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.ILP_TOKEN}` // Asegúrate de tener esta variable en tu entorno
      },
      body: JSON.stringify({
        incomingAmount: {
          value: amount.toString(),
          assetCode: "USD",
          assetScale: 2
        }
      })
    });

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      throw new Error(`Error en la creación del pago: ${errorText}`);
    }

    const paymentData = await paymentResponse.json();

    res.json({
      message: `Pago de ${amount} USD enviado a ${wallet}`,
      payment: paymentData
    });

  } catch (err) {
    console.error("Error al procesar el pago:", err);
    res.status(500).json({ message: "Error al procesar el pago", error: err.message });
  }
});

// Servir index.html al acceder a la raíz
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(3000, () => console.log('🚀 Servidor corriendo en http://localhost:3000'));