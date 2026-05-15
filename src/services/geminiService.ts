import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface RouteAnalysisInput {
  region: string;
  vehicle: string;
  weather: string;
  expeditionType: string;
}

export interface RouteAnalysisResult {
  difficulty: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  riskLevel: number; // 0-100
  operationalConditions: string;
  equipment: string[];
  alerts: string[];
  summary: string;
  radarStats: {
    terrain: number;
    isolation: number;
    weather: number;
    tech: number;
  };
}

export async function analyzeRouteIntelligence(input: RouteAnalysisInput): Promise<RouteAnalysisResult> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
    Analyze a tactical expedition route with the following parameters:
    Region: ${input.region}
    Vehicle: ${input.vehicle}
    Weather: ${input.weather}
    Expedition Type: ${input.expeditionType}

    Return a JSON object with this EXACT structure:
    {
      "difficulty": "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
      "riskLevel": number (0-100),
      "operationalConditions": "Detailed string describing terrain and safety",
      "equipment": ["item1", "item2", "item3"],
      "alerts": ["Critical alert 1", "Warning 2"],
      "summary": "Short 1-2 sentence summary for the HUD",
      "radarStats": {
        "terrain": 0-100,
        "isolation": 0-100,
        "weather": 0-100,
        "tech": 0-100
      }
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // Extract JSON from response (handling potential markdown formatting)
    const jsonStr = text.replace(/```json|```/gi, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Analysis failed:", error);
    // Fallback static analysis if AI fails
    return {
      difficulty: "MODERATE",
      riskLevel: 45,
      operationalConditions: "SINAL_ESTÁVEL // TERRENO_MISTO",
      equipment: ["KIT_PRIMEIROS_SOCORROS", "GPS_OFFLINE", "RESERVA_COMBUSTÍVEL"],
      alerts: ["VERIFICAR_CONDIÇÕES_LOCAIS", "COMUNICAÇÃO_RÁDIO_RECOMENDADA"],
      summary: "Análise inteligente indisponível no momento. Siga protocolos padrão de segurança.",
      radarStats: { terrain: 50, isolation: 40, weather: 30, tech: 60 }
    };
  }
}
