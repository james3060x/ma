
import { GoogleGenAI } from "@google/genai";
import { CalculationResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getPortfolioInsights = async (
  symbol: string,
  stats: CalculationResult,
  marketPrice: number | null,
  language: 'en' | 'zh' = 'en'
) => {
  const languageInstruction = language === 'zh' 
    ? "Please provide the analysis in Chinese." 
    : "Please provide the analysis in English.";

  const prompt = `
    Analyze the following trading portfolio for ${symbol}:
    - Current Average Cost: $${stats.avgPrice.toFixed(4)}
    - Holding Quantity: ${stats.totalQty.toFixed(6)}
    - Realized Profit/Loss: $${stats.realizedPL.toFixed(2)}
    - Market Price: ${marketPrice ? '$' + marketPrice.toFixed(4) : 'N/A'}
    - Unrealized Profit/Loss: ${marketPrice ? '$' + stats.unrealizedPL.toFixed(2) : 'N/A'}
    
    Recent Transactions:
    ${stats.processedTransactions.slice(-5).map(tx => `- ${tx.date}: ${tx.type.toUpperCase()} ${tx.qty} @ $${tx.price}`).join('\n')}

    Provide a concise (2-3 sentences) analysis of the performance and a strategic suggestion based on current market standing. 
    Focus on risk management and cost basis.
    ${languageInstruction}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Insights Error:", error);
    return language === 'zh' ? "暂时无法生成分析报告。" : "Could not generate insights at this moment.";
  }
};
