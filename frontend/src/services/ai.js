var AI_CONFIG = {
  anthropic: { url: "https://api.anthropic.com/v1/messages", model: "claude-haiku-4-5-20251001" },
  openrouter: {
    url: "https://openrouter.ai/api/v1/chat/completions",
    free_models: [
      "mistralai/mistral-7b-instruct:free",
      "meta-llama/llama-3-8b-instruct:free",
      "google/gemma-7b-it:free",
      "microsoft/phi-3-mini-128k-instruct:free"
    ]
  }
};
async function callAI(sys, msg, opts) {
  opts = opts || {};
  var provider = opts.provider || "openrouter";
  var modelIndex = opts.modelIndex || 0;
  var maxTokens = opts.maxTokens || 400;
  if (provider === "anthropic") {
    var r = await fetch(AI_CONFIG.anthropic.url, { method:"POST", headers:{"Content-Type":"application/json","anthropic-version":"2023-06-01"}, body:JSON.stringify({model:AI_CONFIG.anthropic.model,max_tokens:maxTokens,system:sys,messages:[{role:"user",content:msg}]}) });
    var d = await r.json(); return d.content[0].text;
  }
  var r2 = await fetch(AI_CONFIG.openrouter.url, { method:"POST", headers:{"Content-Type":"application/json","HTTP-Referer":"https://seewhylive.online","X-Title":"SeeWhy LIVE","Authorization":"Bearer sk-or-PASTE-YOUR-REAL-KEY-HERE"}, body:JSON.stringify({model:AI_CONFIG.openrouter.free_models[modelIndex],max_tokens:maxTokens,messages:[{role:"system",content:sys},{role:"user",content:msg}]}) });
  var d2 = await r2.json(); return d2.choices[0].message.content;
}
window.SeeWhyAI = { callAI: callAI };
