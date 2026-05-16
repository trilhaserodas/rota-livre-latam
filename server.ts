import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        console.error("Missing GEMINI_API_KEY");
        return res.status(500).json({ error: "Chave API Gemini não encontrada no ambiente do servidor." });
      }

      console.log("Iniciando requisição para Gemini...");
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Prepare contents for generateContent (stateless approach)
      const contents = [];
      
      // Add history if present
      if (history && Array.isArray(history)) {
        contents.push(...history);
      }
      
      // Add current message
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: contents,
        config: {
          systemInstruction: `Você é o "RADAR IA", o assistente tático do Rota Livre Hub. 
Sua missão é auxiliar cicloviajantes e aventureiros na América Latina com informações precisas sobre:
1. Logística de cicloviagem (rotas, equipamentos, acampamento).
2. Protocolos de sobrevivência e segurança em climas extremos (frio, calor, altitude).
3. Conversão de moedas e fusos horários na América Latina.
4. Manutenção básica de bicicletas em campo.

Seu tom é: Técnico, direto, prestativo e "High-Tech". Use uma linguagem que remeta a painéis de controle, radares e protocolos (ex: "Sinal Verde", "Protocolo Ativado", "Análise Concluída").

Seja conciso mas detalhado no que importa. Sempre priorize a segurança do ciclista.
Se perguntarem algo fora desses temas, tente gentilmente trazer de volta para a aventura, mas responda se for útil.
Responda sempre em Português do Brasil.`,
          temperature: 0.7,
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("O modelo Gemini retornou uma resposta sem texto.");
      }

      console.log("Resposta da IA recebida com sucesso.");
      res.json({ text });
    } catch (error: any) {
      console.error("Chat Server Error:", error);
      res.status(500).json({ 
        error: "Erro no processamento da IA",
        details: error.message || String(error)
      });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      hasKey: !!process.env.GEMINI_API_KEY,
      node: process.version
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
