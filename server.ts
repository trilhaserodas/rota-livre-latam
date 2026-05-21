import dotenv from "dotenv";
dotenv.config();

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

  // Dedicated weather engine for Serra do Rio do Rastro SC
  app.get("/api/weather/serra-rio-do-rastro", async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const lat = -28.39;
    const lon = -49.55;

    console.log(`[WeatherAPI] Serra do Rio do Rastro custom analysis requested.`);

    try {
      // 1. Fetch live coordinates from Open-Meteo
      const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,visibility&timezone=auto`;
      
      console.log(`[WeatherAPI] Fetching Serra do Rio do Rastro weather from Open-Meteo`);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      
      const omResponse = await fetch(openMeteoUrl, { 
        signal: controller.signal,
        headers: { 'User-Agent': 'RotaLivre-WeatherProxy/1.0' }
      });
      clearTimeout(timeout);
      
      if (!omResponse.ok) {
        throw new Error(`Open-Meteo falhou com status ${omResponse.status}`);
      }

      const omData = await omResponse.json();
      
      if (!omData.current) {
        throw new Error("Open-Meteo não retornou dados atuais para a Serra");
      }

      const current = omData.current;
      const wind = current.wind_speed_10m || 0;
      const windGusts = current.wind_gusts_10m || 0;
      const temp = current.temperature_2m || 0;
      const apparentTemp = current.apparent_temperature || temp;

      // Determine visibility in km
      let visibilityRaw = current.visibility;
      let visibility_km = 10; // Default to 10km
      if (typeof visibilityRaw === 'number') {
        visibility_km = visibilityRaw / 1000;
      } else {
        // Safe estimation fallback based on WMO weather code if visibility is not returned
        const code = current.weather_code || 0;
        if (code === 45 || code === 48) {
          visibility_km = 0.3; // thick fog
        } else if (code >= 95) {
          visibility_km = 1.2; // severe thunderstorm
        } else if (code >= 61 && code <= 65) {
          visibility_km = 2.5; // rain
        } else if (code <= 3) {
          visibility_km = 10.0; // clear/partly cloudy
        } else {
          visibility_km = 6.0; // other cloudy or drizzle
        }
      }

      // 2. Classify status based on limits:
      // - VERDE (SAFE): Visibilidade > 5km E Ventos < 30km/h. Condição ideal.
      // - AMARELO (ATTENTION): Visibilidade entre 1km e 5km OU Ventos entre 30km/h e 50km/h. Exige cautela, neblina ou vento lateral.
      // - VERMELHO (DANGER): Visibilidade < 1km OU Ventos > 50km/h. Risco extremo. Rota desaconselhada ou interditada.
      let statusColor: "SAFE" | "ATTENTION" | "DANGER" = "SAFE";
      if (visibility_km < 1 || wind > 50) {
        statusColor = "DANGER";
      } else if ((visibility_km >= 1 && visibility_km <= 5) || (wind >= 30 && wind <= 50)) {
        statusColor = "ATTENTION";
      } else {
        statusColor = "SAFE";
      }

      // Base metric object to return alongside AI response values or fallback values
      const metrics = {
        temp,
        apparentTemp,
        wind,
        windGusts,
        visibility_km,
        weatherCode: current.weather_code || 0,
        weatherDesc: getWmoDescription(current.weather_code || 0),
        precipitation: current.precipitation || 0
      };

      // Default response structure aligned precisely with requested format
      const fallbackResponse = {
        statusColor,
        visibility_km: visibility_km.toFixed(1),
        alertTitle: statusColor === 'SAFE' 
          ? "PISTA LIMPA: VALORES DENTRO DO PROGRAMADO" 
          : statusColor === 'ATTENTION' 
            ? "ATENÇÃO: NEBLINA OU VENTOS MODERADOS/LATERAIS" 
            : "ALERTA CRÍTICO: CONDIÇÕES IMPRÓPRIAS",
        alertMessage: statusColor === 'SAFE'
          ? "Visibilidade favorável e ventos sob controle. Subida segura para praticantes de cicloturismo de aventura."
          : statusColor === 'ATTENTION'
            ? "Trechos com neblina na altitude ou rajadas de vento lateral. Mantenha os faróis ativos e velocidade reduzida."
            : "Condições de alto risco com ventos severos ou névoa densa. Rota instável e extremamente desaconselhada."
      };

      // 3. Make Gemini API run if available
      if (apiKey) {
        try {
          const ai = new GoogleGenAI({
            apiKey: apiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              }
            }
          });

          const prompt = `
Você é o motor de análise meteorológica para cicloturistas e mochileiros na Serra do Rio do Rastro - SC (ambiente de montanha extrema).
Com base nos seguintes dados reais atuais:
- Temperatura atual: ${temp}°C (Sensação: ${apparentTemp}°C)
- Velocidade do vento: ${wind} km/h (Rajadas: ${windGusts} km/h)
- Visibilidade calculada: ${visibility_km.toFixed(1)} km
- Estado do tempo: ${getWmoDescription(current.weather_code || 0)}

Com base nos limites definidos, o status de segurança é calculado como: ${statusColor} (SAFE para boas condições, ATTENTION para atenção moderada, DANGER para perigo extremo).

Seus limites de status de segurança para referência:
- VERDE (SAFE): Visibilidade > 5km E Ventos < 30km/h. Condição ideal.
- AMARELO (ATTENTION): Visibilidade entre 1km e 5km OU Ventos entre 30km/h e 50km/h. Exige cautela, neblina ou vento lateral.
- VERMELHO (DANGER): Visibilidade < 1km OU Ventos > 50km/h. Risco extremo. Rota desaconselhada ou interditada.

Responda ÚNICA E EXCLUSIVAMENTE com um objeto JSON válido, sem bloco markdown (ou seja, NÃO use \`\`\`json ou qualquer formatação markdown, apenas o conteúdo bruto do JSON), contendo os seguintes campos exatamente:
{
  "statusColor": "${statusColor}",
  "visibility_km": "${visibility_km.toFixed(1)}",
  "alertTitle": "Título curto e chamativo para o status (máximo 5 palavras)",
  "alertMessage": "Mensagem técnica direta sobre a condição da serra e dicas de segurança para ciclistas e motos (no máximo 2 linhas)."
}
`;

          console.log(`[WeatherAPI] Querying Gemini 3.5-flash for Serra do Rio do Rastro analysis`);
          const aiResponse = await ai.models.generateContent({
             model: "gemini-3.5-flash",
             contents: prompt,
             config: {
                temperature: 0.4
             }
          });

          const responseText = aiResponse.text;
          if (responseText) {
             const cleanJsonText = responseText.replace(/```json|```/gi, "").trim();
             const aiJson = JSON.parse(cleanJsonText);
             console.log(`[WeatherAPI] Gemini Analysis succeeded:`, aiJson);
             return res.json({
                ...aiJson,
                metrics
             });
          }
        } catch (aiErr: any) {
          console.error(`[WeatherAPI] Gemini AI call failed or JSON parse error. Using tactical fallback.`, aiErr.message);
        }
      }

      // If no API key or AI failed, return the high-quality fallback aligning precisely with status metrics
      console.log(`[WeatherAPI] Returning calculated fallback weather object`);
      return res.json({
        ...fallbackResponse,
        metrics
      });

    } catch (err: any) {
      console.error("[WeatherAPI] Serra analysis ultimate exception:", err.message);
      res.status(500).json({ 
        error: "Falha na análise meteorológica da Serra do Rio do Rastro", 
        details: err?.message 
      });
    }
  });

  app.get("/api/weather", async (req, res) => {
    const { lat, lon } = req.query;
    const apiKey = process.env.WEATHER_API_KEY;

    // Use default values if lat/lon are missing or invalid
    const latitude = parseFloat(String(lat));
    const longitude = parseFloat(String(lon));

    console.log(`[WeatherAPI] Received proxy request: lat=${latitude}, lon=${longitude}`);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: "Latitude e longitude válidas são obrigatórias" });
    }

    try {
      // 1. Try OpenWeatherMap if API Key exists and looks valid
      if (apiKey && apiKey.length > 5) {
        try {
          const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric&lang=pt_br`;
          console.log(`[WeatherAPI] Try OWM: ${url.split('appid=')[0]}`);
          
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);
          
          const response = await fetch(url, { 
            signal: controller.signal,
            headers: { 'User-Agent': 'RotaLivre-WeatherProxy/1.0' }
          });
          clearTimeout(timeout);
          
          if (response.ok) {
            const data = await response.json();
            console.log(`[WeatherAPI] OWM Success`);
            res.setHeader('Cache-Control', 'public, max-age=600');
            return res.json({
              ...data,
              debug: {
                source: 'openweathermap',
                hasKey: true,
                latitude,
                longitude,
                env: process.env.NODE_ENV
              }
            });
          }
          console.warn(`[WeatherAPI] OWM Failed (${response.status}), falling back to Open-Meteo`);
        } catch (owmErr: any) {
          console.error(`[WeatherAPI] OWM Fetch Exception:`, owmErr.message);
        }
      }

      // 2. Fallback to Open-Meteo (Modern API)
      const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&timezone=auto`;
      
      console.log(`[WeatherAPI] Fetching Open-Meteo: ${openMeteoUrl}`);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      
      const omResponse = await fetch(openMeteoUrl, { 
        signal: controller.signal,
        headers: { 'User-Agent': 'RotaLivre-WeatherProxy/1.0' }
      });
      clearTimeout(timeout);
      
      if (!omResponse.ok) {
        throw new Error(`Open-Meteo falhou com status ${omResponse.status}`);
      }

      const omData = await omResponse.json();
      
      if (!omData.current) {
        throw new Error("Open-Meteo não retornou dados atuais (current)");
      }

      const current = omData.current;
      
      // Adapt Open-Meteo structure to match what the frontend expects from OWM
      const adaptedData = {
        main: {
          temp: current.temperature_2m,
          feels_like: current.apparent_temperature ?? current.temperature_2m,
          humidity: current.relative_humidity_2m ?? 0
        },
        weather: [
          {
            description: getWmoDescription(current.weather_code),
            icon: getWmoIcon(current.weather_code, current.is_day)
          }
        ],
        wind: {
          speed: (current.wind_speed_10m || 0) / 3.6 
        }
      };

      console.log(`[WeatherAPI] Open-Meteo Success (Adapted)`);
      res.setHeader('Cache-Control', 'public, max-age=600');
      res.json({
        ...adaptedData,
        debug: {
          source: 'open-meteo',
          hasKey: !!apiKey,
          latitude,
          longitude,
          env: process.env.NODE_ENV
        }
      });

    } catch (error: any) {
      console.error("[WeatherAPI] Final Exception:", error.message);
      res.status(500).json({ 
        error: "Erro na conexão com serviço meteorológico", 
        details: error?.message,
        source: "backend_proxy",
        debug: {
          source: 'error',
          hasKey: !!apiKey,
          latitude,
          longitude,
          env: process.env.NODE_ENV
        }
      });
    }
  });

  // Helper functions for Open-Meteo adaptation
  function getWmoDescription(code: number): string {
    const codes: Record<number, string> = {
      0: 'Céu Limpo', 
      1: 'Predominantemente Limpo', 
      2: 'Parcialmente Nublado', 
      3: 'Nublado',
      45: 'Nevoeiro', 
      48: 'Nevoeiro Escarchante', 
      51: 'Chuvisco Leve',
      53: 'Chuvisco Moderado',
      55: 'Chuvisco Denso',
      61: 'Chuva Leve', 
      63: 'Chuva Moderada', 
      65: 'Chuva Forte',
      71: 'Neve Leve', 
      73: 'Neve Moderada',
      75: 'Neve Forte',
      80: 'Pancadas de Chuva Leves',
      81: 'Pancadas de Chuva Moderadas',
      82: 'Pancadas de Chuva Violentas',
      95: 'Trovoada Leve/Moderada',
      96: 'Trovoada com Granizo Leve',
      99: 'Trovoada com Granizo Forte'
    };
    return codes[code] || 'Condições Variáveis';
  }

  function getWmoIcon(code: number, isDay: number | boolean = 1): string {
    const suffix = isDay === 1 || isDay === true ? 'd' : 'n';
    if (code === 0) return `01${suffix}`;
    if (code <= 3) return `02${suffix}`;
    if (code <= 48) return `50${suffix}`;
    if (code <= 67) return `10${suffix}`;
    if (code <= 77) return `13${suffix}`;
    return `11${suffix}`;
  }

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
