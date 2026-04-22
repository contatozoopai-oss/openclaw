import fetch from "node-fetch";

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

async function runAgent() {
  console.log("Agente rodando...");

  const tasksRes = await fetch(`${SUPABASE_URL}/rest/v1/tasks?status=eq.pending`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });

  const tasks = await tasksRes.json();

  for (const task of tasks) {
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Você é um agente que executa tarefas automaticamente." },
          { role: "user", content: task.input }
        ]
      })
    });

    const aiData = await aiRes.json();
    const resposta = aiData.choices[0].message.content;

    console.log("Resposta:", resposta);

    await fetch(`${SUPABASE_URL}/rest/v1/tasks?id=eq.${task.id}`, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: "done" })
    });
  }
}

setInterval(runAgent, 30000);
