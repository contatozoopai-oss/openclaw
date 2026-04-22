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
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('status', 'pending')

  if (error) {
    console.error(error)
    return
  }

  for (const task of tasks) {
    console.log("Processando:", task.input)

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "user", content: task.input }
      ]
    })

    const output = response.choices[0].message.content

    await supabase
      .from('tasks')
      .update({
        status: 'done',
        output: output
      })
      .eq('id', task.id)
  }
}

setInterval(processTasks, 5000)
