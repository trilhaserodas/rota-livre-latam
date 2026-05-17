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
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    const { message, history } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("Missing GEMINI_API_KEY");
      return res.status(500).json({ error: "Chave API Gemini não encontrada no ambiente do servidor." });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const maxRetries = 3;
    let retryCount = 0;

    const executeChat = async (): Promise<any> => {
      try {
        console.log(`Iniciando tentativa ${retryCount + 1} para Gemini...`);
        
        // Prepare contents
        const contents: any[] = [];
        if (history && Array.isArray(history)) {
          contents.push(...history);
        }
        contents.push({
          role: 'user',
          parts: [{ text: message }]
        });

        const response = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: contents,
          config: {
            systemInstruction: `Você é o "RADAR IA", o assistente tático do Rota Livre Hub. 
Sua missão é auxiliar cicloviajantes e aventureiros na América Latina com informações precisas e atualizadas.

DIRETRIZES DE PESQUISA (PROTOCOLO REDDIT/COMUNIDADE/GOOGLE):
1. Sempre que precisar de relatos reais de ciclistas, dicas de equipamentos específicos ou condições de trilhas "em tempo real", utilize a ferramenta de pesquisa para buscar no REDDIT e em fóruns especializados (ex: "site:reddit.com bicycletouring [termo de busca]").
2. Foque em subreddits como r/bicycletouring, r/cycling, r/bikepacking e comunidades latinas.
3. Além do Reddit, use a pesquisa do Google para buscar por blogs de viagem, notícias locais e alertas oficiais.

ÁREAS DE ATUAÇÃO:
1. Logística de cicloviagem (rotas, equipamentos, acampamento).
2. Protocolos de sobrevivência e segurança em climas extremos (frio, calor, altitude).
3. Conversão de moedas e fusos horários na América Latina.
4. Manutenção básica de bicicletas em campo.

Seu tom é: Técnico, direto, prestativo e "High-Tech". Use uma linguagem que remeta a painéis de controle e protocolos.

Seja conciso mas detalhado no que importa. Sempre priorize a segurança do ciclista.
Responda sempre em Português do Brasil.`,
            tools: [{ googleSearch: {} }],
            temperature: 0.7,
          }
        });

        return response;
      } catch (error: any) {
        // Handle Rate Limit (429) or Overloaded (503)
        const isRetryable = (error.status === 429 || error.status === 503 || error.message?.includes('429') || error.message?.includes('quota'));
        
        if (isRetryable && retryCount < maxRetries) {
          retryCount++;
          const waitTime = retryCount * 3000; // Exponential-ish backoff
          console.log(`Radar IA em espera. Retentando em ${waitTime}ms (Tentativa ${retryCount}/${maxRetries})...`);
          await delay(waitTime);
          return executeChat();
        }
        throw error;
      }
    };

    try {
      const response = await executeChat();
      const text = response.text;
      
      if (!text) {
        throw new Error("O modelo Gemini retornou uma resposta sem texto.");
      }

      console.log("Resposta da IA recebida com sucesso.");
      res.json({ 
        text,
        groundingMetadata: response.candidates?.[0]?.groundingMetadata
      });
    } catch (error: any) {
      console.error("Chat Server Error:", error);
      res.status(error.status || 500).json({ 
        error: "Erro no processamento da IA",
        details: error.message || String(error)
      });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      hasKey: !!process.env.GEMINI_API_KEY,
      hasWeatherKey: !!process.env.WEATHER_API_KEY,
      node: process.version
    });
  });

  app.get("/api/weather", async (req, res) => {
    const { lat, lon } = req.query;
    const apiKey = process.env.WEATHER_API_KEY;

    console.log(`[WeatherAPI] Request for lat: ${lat}, lon: ${lon}`);

    if (!apiKey) {
      console.error("[WeatherAPI] Missing API Key");
      return res.status(500).json({ error: "WEATHER_API_KEY non-existent." });
    }

    try {
      // Use WeatherAPI.com instead of OpenWeatherMap as per user's specific mapping request
      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}&lang=pt`
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[WeatherAPI] API Error: ${response.status}`, errorText);
        return res.status(response.status).json({ error: "Failed to fetch from WeatherAPI", details: errorText });
      }

      const data = await response.json();
      console.log("[WeatherAPI] Success response received");
      res.json(data);
    } catch (error) {
      console.error("Weather Proxy Error:", error);
      res.status(500).json({ error: "Internal server error fetching weather" });
    }
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
