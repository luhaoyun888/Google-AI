import { GoogleGenAI } from "@google/genai";
import { WasmPlugin, SecurityPolicy, AnalysisResult } from '../types';

export const analyzePluginSecurity = async (plugin: WasmPlugin, policy: SecurityPolicy): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    console.warn("No API_KEY provided, returning mock analysis.");
    return mockAnalysis(plugin);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    你是一个 WebAssembly 安全审计员。
    请分析以下使用 ${plugin.language} 编写的 WASI 插件源代码。

    源代码:
    \`\`\`${plugin.language}
    ${plugin.code}
    \`\`\`

    安全策略:
    - 允许读取路径: ${JSON.stringify(policy.allowedReadPaths)}
    - 允许写入路径: ${JSON.stringify(policy.allowedWritePaths)}
    - 允许网络域名: ${JSON.stringify(policy.allowedDomains)}
    - 允许环境变量: ${policy.allowEnvAccess}

    任务:
    1. 识别代码中任何潜在的策略违规行为（例如，访问未经授权的文件/网络）。
    2. 分配一个从 0（安全）到 100（严重）的风险评分。
    3. 提供简短的中文摘要和具体的中文漏洞或违规列表。

    输出格式 (仅 JSON):
    {
      "riskScore": number,
      "summary": "string",
      "vulnerabilities": ["string", "string"]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      riskScore: -1,
      summary: "无法使用 Gemini 进行分析。请检查 API Key。",
      vulnerabilities: ["API 错误"]
    };
  }
};

const mockAnalysis = (plugin: WasmPlugin): AnalysisResult => {
  // Fallback if no API key
  if (plugin.name === 'DataExfiltrator') {
    return {
      riskScore: 90,
      summary: "检测到高风险插件。试图访问敏感系统文件并连接到未在白名单中的外部 IP。",
      vulnerabilities: ["访问 /etc/shadow", "向 192.168.0.66 发起出站连接", "读取环境变量"]
    };
  }
  return {
    riskScore: 10,
    summary: "代码看起来基本良性，但请核实文件路径。",
    vulnerabilities: ["访问 /var/log/app.log (请核实是否敏感)"]
  };
};