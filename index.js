import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

// 🔑 clientes
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY // 🔥 tem que ser a SECRET KEY
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// 🚀 função principal
async function processTasks() {
  try {
    console.log("🔄 Verificando tarefas...")

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'pending')
      .limit(5) // evita overload

    console.log("📦 Tasks encontradas:", tasks)

    if (error) {
      console.error("❌ Erro Supabase:", error)
      return
    }

    if (!tasks || tasks.length === 0) {
      console.log("📭 Nenhuma tarefa pendente")
      return
    }

    for (const task of tasks) {
      try {
        console.log("⚙️ Processando:", task.input)

        // 🤖 OpenAI
        const response = await openai.chat.completions.create({
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "user",
              content: task.input
            }
          ]
        })

        const output =
          response.choices?.[0]?.message?.content ||
          "Sem resposta gerada"

        console.log("🧠 Resposta:", output)

        // 💾 salva no banco
        const { error: updateError } = await supabase
          .from('tasks')
          .update({
            status: 'done',
            output: output
          })
          .eq('id', task.id)

        if (updateError) {
          console.error("❌ Erro ao salvar:", updateError)
        } else {
          console.log("✅ Concluído:", task.id)
        }

      } catch (err) {
        console.error("❌ Erro ao processar task:", err)
      }
    }

  } catch (err) {
    console.error("❌ Erro geral:", err)
  }
}

// 🧠 loop controlado (evita duplicação)
let isRunning = false

setInterval(async () => {
  if (isRunning) return
  isRunning = true

  await processTasks()

  isRunning = false
}, 5000)

// 🚀 primeira execução imediata
processTasks()
