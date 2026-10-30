import { NextResponse } from 'next/server'

interface AvailableTag {
  id: string
  name: string
  description?: string | null
}

interface RequestBody {
  title?: string
  description?: string
  availableTags?: AvailableTag[]
}

const SYSTEM_INSTRUCTION = `Você é um classificador semântico de tarefas em português (pt-BR).
Dada uma tarefa (título e descrição) e uma lista de tags cadastradas pelo usuário (com ID e nome), analise o conteúdo e selecione as tags que melhor se relacionam tematicamente com a tarefa.

Regras estritas:
1. Retorne estritamente um JSON no formato {"suggestedTagIds": string[]}.
2. Retorne no máximo as 3 tags mais pertinentes.
3. Se nenhuma tag fornecida tiver relação com a tarefa, retorne {"suggestedTagIds": []}.
4. NUNCA invente novos IDs ou nomes de tags. Use única e exclusivamente os IDs existentes na lista fornecida.`

/**
 * 1º Primário: gemini-3.8-flash (Google AI Studio)
 */
async function callGemini(
  taskText: string,
  tagsJson: string,
  apiKey: string
): Promise<string[] | null> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`
    const prompt = `${SYSTEM_INSTRUCTION}

Lista de tags disponíveis:
${tagsJson}

Tarefa a ser classificada:
${taskText}`

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.25,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              suggestedTagIds: {
                type: 'ARRAY',
                items: { type: 'STRING' },
              },
            },
            required: ['suggestedTagIds'],
          },
        },
      }),
    })

    if (!res.ok) {
      console.warn('Gemini auto-tag returned status:', res.status)
      return null
    }

    const data = await res.json()
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!rawText) return null

    const parsed = JSON.parse(rawText)
    if (Array.isArray(parsed.suggestedTagIds)) {
      return parsed.suggestedTagIds
    }
    return null
  } catch (err) {
    console.warn('Gemini auto-tag error, falling back:', err)
    return null
  }
}

/**
 * 2º Fallback 1: deepseek-flash (DeepSeek Platform)
 */
async function callDeepSeek(
  taskText: string,
  tagsJson: string,
  apiKey: string
): Promise<string[] | null> {
  try {
    const url = 'https://api.deepseek.com/chat/completions'
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-flash',
        temperature: 0.25,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_INSTRUCTION },
          {
            role: 'user',
            content: `Tags disponíveis:\n${tagsJson}\n\nTarefa:\n${taskText}`,
          },
        ],
      }),
    })

    if (!res.ok) {
      console.warn('DeepSeek auto-tag returned status:', res.status)
      return null
    }

    const data = await res.json()
    const rawText = data.choices?.[0]?.message?.content
    if (!rawText) return null

    const parsed = JSON.parse(rawText)
    if (Array.isArray(parsed.suggestedTagIds)) {
      return parsed.suggestedTagIds
    }
    return null
  } catch (err) {
    console.warn('DeepSeek auto-tag error, falling back:', err)
    return null
  }
}

/**
 * 3º Fallback 2: llama-3.3-70b-versatile (Groq Cloud)
 */
async function callGroq(
  taskText: string,
  tagsJson: string,
  apiKey: string
): Promise<string[] | null> {
  try {
    const url = 'https://api.groq.com/openai/v1/chat/completions'
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.25,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_INSTRUCTION },
          {
            role: 'user',
            content: `Tags disponíveis:\n${tagsJson}\n\nTarefa:\n${taskText}`,
          },
        ],
      }),
    })

    if (!res.ok) {
      console.warn('Groq auto-tag returned status:', res.status)
      return null
    }

    const data = await res.json()
    const rawText = data.choices?.[0]?.message?.content
    if (!rawText) return null

    const parsed = JSON.parse(rawText)
    if (Array.isArray(parsed.suggestedTagIds)) {
      return parsed.suggestedTagIds
    }
    return null
  } catch (err) {
    console.warn('Groq auto-tag error:', err)
    return null
  }
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json()
    const { title, description, availableTags } = body

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Título da tarefa é obrigatório' }, { status: 400 })
    }

    if (!Array.isArray(availableTags) || availableTags.length === 0) {
      return NextResponse.json({ tagIds: [], providerUsed: 'none' })
    }

    const taskText = `Título: ${title.trim()}\nDescrição: ${description?.trim() || 'Nenhuma'}`
    const tagsJson = JSON.stringify(
      availableTags.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description || undefined,
      })),
      null,
      2
    )

    const allowedIds = new Set(availableTags.map((t) => t.id))
    let suggestedIds: string[] | null = null
    let providerUsed = 'none'

    // 1º Primário: gemini-3.8-flash
    const geminiKey = process.env.GEMINI_API_KEY
    if (geminiKey) {
      suggestedIds = await callGemini(taskText, tagsJson, geminiKey)
      if (suggestedIds !== null) {
        providerUsed = 'gemini-3.8-flash'
      }
    }

    // 2º Fallback 1: deepseek-flash
    if (suggestedIds === null) {
      const deepseekKey = process.env.DEEPSEEK_API_KEY
      if (deepseekKey) {
        suggestedIds = await callDeepSeek(taskText, tagsJson, deepseekKey)
        if (suggestedIds !== null) {
          providerUsed = 'deepseek-flash'
        }
      }
    }

    // 3º Fallback 2: llama-3.3-70b-versatile (Groq)
    if (suggestedIds === null) {
      const groqKey = process.env.GROQ_API_KEY
      if (groqKey) {
        suggestedIds = await callGroq(taskText, tagsJson, groqKey)
        if (suggestedIds !== null) {
          providerUsed = 'llama-3.3-70b-versatile'
        }
      }
    }

    // Se nenhum modelo estiver configurado ou todos falharem
    if (suggestedIds === null) {
      return NextResponse.json(
        {
          error: 'Nenhum provedor de IA do Triunvirato pôde processar a requisição no momento.',
          tagIds: [],
          providerUsed: 'none',
        },
        { status: 503 }
      )
    }

    // Determinismo e Anti-Alucinação: filtra estritamente IDs existentes e limita a 3 tags
    const validTagIds = suggestedIds
      .filter((id) => typeof id === 'string' && allowedIds.has(id))
      .slice(0, 3)

    return NextResponse.json({
      tagIds: validTagIds,
      providerUsed,
    })
  } catch (error: any) {
    console.error('Erro interno na rota /api/ai/auto-tag:', error)
    return NextResponse.json(
      { error: 'Erro interno ao classificar tags com IA', tagIds: [] },
      { status: 500 }
    )
  }
}

