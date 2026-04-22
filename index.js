import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function processTasks() {
  try {
    console.log("🔄 Verificando tarefas...")

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'pending')

    if (error) {
      console.error("Erro Supabase:", error.message)
      return
    }

    if (!tasks || tasks.length === 0) {
      console.log("Nenhuma tarefa pendente")
      return
    }

    for (const task of tasks) {
      try {
        console.log("Processando:", task.input)

        const response = await openai.chat.completions.create({
          model: "gpt-4.1-mini",
          messages: [
            { role: "user", content: task.input }
          ]
        })

        const output = response.choices?.[0]?.message?.content || "Sem resposta"

        await supabase
          .from('tasks')
          .update({
            status: 'done',
            output: output
          })
          .eq('id', task.id)

        console.log("✅ Concluído:", task.id)

      } catch (err) {
        console.error("Erro ao processar task:", err.message)
      }
    }

  } catch (err) {
    console.error("Erro geral:", err.message)
  }
}

// loop seguro
setInterval(processTasks, 5000)

// primeira execução imediata
processTasks()
