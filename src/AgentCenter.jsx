import React,{useEffect,useMemo,useState}from"react";

const call=async(path,adminKey,options={})=>{
  const r=await fetch("/api"+path,{...options,headers:{...(options.headers||{}),Authorization:"Bearer "+adminKey}});
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(j.error||"Serverfehler");
  return j;
};

const stateLabel=s=>({
  READY:"bereit",
  REVIEW_REQUIRED:"Prüfung nötig",
  BLOCKED:"Guardian blockiert",
  STALE:"veraltet"
}[s]||s||"—");

const providerLabel=p=>({openai:"OpenAI",deepseek:"DeepSeek",qwen:"Qwen",gemini:"Gemini",anthropic:"Claude"}[p]||p);

export default function AgentCenter({adminKey,setAdminKey}){
  const[status,setStatus]=useState(null),[ops,setOps]=useState(null),[error,setError]=useState(""),[message,setMessage]=useState(""),
  [loading,setLoading]=useState(false),[projectId,setProjectId]=useState(""),[focus,setFocus]=useState("full_review"),
  [shareText,setShareText]=useState(false),[run,setRun]=useState(null),[reviewNote,setReviewNote]=useState(""),
  [enabled,setEnabled]=useState(false),[halt,setHalt]=useState(false),[maxCalls,setMaxCalls]=useState(5);

  async function load(key=adminKey){
    if(!key)return;
    setLoading(true);setError("");
    try{
      const[s,o]=await Promise.all([call("/shk/agents/status",key),call("/shk/overview",key)]);
      sessionStorage.setItem("richterich-admin",key);
      setStatus(s);setOps(o);setEnabled(s.config.enabled);setHalt(s.config.emergencyHalt);setMaxCalls(s.config.maxCallsPerRun);
      setFocus(f=>f||s.config.defaultFocus||"full_review");
      if(!projectId&&o.projects?.length)setProjectId(o.projects.at(-1).id);
    }catch(e){setError(e.message)}
    finally{setLoading(false)}
  }
  useEffect(()=>{if(adminKey)load()},[]);

  const selected=useMemo(()=>ops?.projects?.find(p=>p.id===projectId)||null,[ops,projectId]);

  async function saveConfig(){
    setLoading(true);setError("");setMessage("");
    try{
      await call("/shk/agents/configure",adminKey,{method:"POST",headers:{"Content-Type":"application/json","Idempotency-Key":crypto.randomUUID()},body:JSON.stringify({enabled,emergencyHalt:halt,maxCallsPerRun:Number(maxCalls)})});
      setMessage("Multiagent-Einstellungen gespeichert.");await load();
    }catch(e){setError(e.message)}finally{setLoading(false)}
  }

  async function runConference(){
    if(!selected)return;
    setLoading(true);setError("");setMessage("");setRun(null);
    try{
      const r=await call("/shk/projects/"+selected.id+"/agent_run",adminKey,{method:"POST",headers:{"Content-Type":"application/json","Idempotency-Key":crypto.randomUUID()},body:JSON.stringify({version:selected.version,focus,shareProjectText:shareText})});
      setRun(r);setMessage("Agentenlauf abgeschlossen. Keine externe Aktion wurde ausgeführt.");await load();
    }catch(e){setError(e.message)}finally{setLoading(false)}
  }

  async function review(decision){
    if(!run)return;
    setLoading(true);setError("");setMessage("");
    try{
      await call("/shk/agents/runs/"+run.id+"/review",adminKey,{method:"POST",headers:{"Content-Type":"application/json","Idempotency-Key":crypto.randomUUID()},body:JSON.stringify({decision,note:reviewNote})});
      setMessage(decision==="rejected"?"Agentenlauf wurde verworfen.":"Agentenlauf wurde als geprüft dokumentiert. Keine Side Effects wurden freigegeben.");
      await load();
    }catch(e){setError(e.message)}finally{setLoading(false)}
  }

  if(!adminKey||!status)return <section><small>KI-TEAM · GESCHÜTZTER BEREICH</small><h2>Multiagent-System.</h2><div className="split"><div className="form"><h3>Betriebszugang</h3><label>Betriebsschlüssel<input type="password" value={adminKey} onChange={e=>setAdminKey(e.target.value)} autoComplete="current-password"/></label><button disabled={!adminKey||loading} onClick={()=>load()}>{loading?"Prüft…":"KI-Team öffnen →"}</button>{error&&<p className="note">{error}</p>}</div><aside><small>GOVERNANCE</small><h3>Analyse ja. Automatische Freigabe nein.</h3><p>Der deterministische Guardian bleibt autoritativ. Modelle dürfen nicht bestellen, bezahlen, Nachrichten senden oder technische Entscheidungen freigeben.</p></aside></div></section>;

  return <section>
    <small>SHK 2.0 · GOVERNED MULTIAGENT WORKFORCE</small><h2>KI-Team.</h2>
    <p>OpenAI führt. DeepSeek, Qwen, Gemini und Claude arbeiten als begrenzte Spezialisten. Der Guardian sitzt außerhalb der Modellhierarchie und kann jede Modellmeinung blockieren.</p>
    {message&&<p className="note">{message}</p>}{error&&<p className="note">{error}</p>}

    <div className="ops">
      <article><small>SYSTEM</small><h3>{status.config.enabled?"aktiv":"pausiert"}</h3><p>{status.architecture}</p></article>
      <article><small>GUARDIAN</small><h3>{status.safeguards.deterministicGuardAuthoritative?"autoritativ":"prüfen"}</h3><p>Modelle können Regeln nicht überstimmen.</p></article>
      <article><small>PROVIDER</small><h3>{status.providers.filter(p=>p.configured).length}/5</h3><p>über Werkzeuge persönlich einbindbar</p></article>
      <article><small>AUSFÜHRUNG</small><h3>gesperrt</h3><p>Agenten analysieren ausschließlich.</p></article>
    </div>

    <h2>Agenten</h2>
    <div className="agent-grid">{status.roles.map(r=><article key={r.id} className={r.provider==="internal"?"guardian-card":""}><div className="agent-avatar">{r.label.slice(0,1)}</div><small>{r.provider==="internal"?"DETERMINISTISCH":providerLabel(r.provider)}</small><h3>{r.label}</h3><p>{r.responsibility}</p><span className="agent-lock">Keine autonome Ausführung</span></article>)}</div>

    <h2>Provider & persönliche Zugänge</h2>
    <div className="ops">{status.providers.map(p=><article key={p.provider}><small>{providerLabel(p.provider)}</small><h3>{p.configured?"verbunden":"nicht eingerichtet"}</h3><p>{p.configured?"Modell konfiguriert · Secrets verborgen":"Unter Werkzeuge → KI-Team einrichten"}</p>{p.source&&<p>Quelle: {p.source==="integration_center"?"persönlicher Tresor":"Server-Konfiguration"}</p>}</article>)}</div>

    <h2>Steuerung</h2>
    <div className="split"><div className="form">
      <label><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/> Multiagent-System aktivieren</label>
      <label><input type="checkbox" checked={halt} onChange={e=>setHalt(e.target.checked)}/> Emergency Halt – alle externen Modellaufrufe stoppen</label>
      <label>Maximale Modellaufrufe pro Lauf<select value={maxCalls} onChange={e=>setMaxCalls(Number(e.target.value))}>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n}</option>)}</select></label>
      <button disabled={loading} onClick={saveConfig}>Einstellungen speichern</button>
    </div><aside><small>SICHERHEIT</small><h3>Commerce-Governance + HQS-Freigabeprinzip.</h3><p>Risikobasiertes Routing, strukturierte Antworten, Call-Limits, Emergency Halt und Source-Fingerprints stammen aus der stärkeren Commerce-Workforce-Logik. Die getrennte menschliche Freigabeidee aus HQS bleibt bestehen.</p></aside></div>

    <h2>Projekt prüfen</h2>
    <div className="split"><div className="form">
      <label>Projekt<select value={projectId} onChange={e=>setProjectId(e.target.value)}>{(ops.projects||[]).slice().reverse().map(p=><option key={p.id} value={p.id}>{p.customer?.name} · {p.kind} · {p.status}</option>)}</select></label>
      <label>Fokus<select value={focus} onChange={e=>setFocus(e.target.value)}>{status.focuses.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select></label>
      <label><input type="checkbox" checked={shareText} onChange={e=>setShareText(e.target.checked)}/> Projektbeschreibung an konfigurierte KI-Anbieter übermitteln</label>
      <p>Kundenname, E-Mail und Telefonnummer werden unabhängig davon nicht an die Modelle übertragen.</p>
      <button disabled={loading||!selected||!status.config.enabled} onClick={runConference}>{loading?"KI-Team arbeitet…":"Multiagent-Prüfung starten →"}</button>
      {!status.config.enabled&&<p className="note">Aktiviere das Multiagent-System zuerst in der Steuerung.</p>}
    </div><aside><small>AKTUELLES PROJEKT</small><h3>{selected?.customer?.name||"Kein Projekt"}</h3>{selected&&<><p>{selected.kind} · {selected.status}</p><p>Projektversion: {selected.version}</p><p>Der Lauf arbeitet auf einem Fingerprint dieser Version. Ändert sich das Projekt währenddessen, wird das Ergebnis als STALE markiert.</p></>}</aside></div>

    {run&&<><h2>Ergebnis</h2>
      <div className={"agent-result "+(run.finalStatus==="BLOCKED"?"blocked":"")}><small>FINAL STATUS · {run.risk?.toUpperCase()}</small><h3>{stateLabel(run.finalStatus)}</h3><p>{run.leadDecision?.summary}</p><div className="agent-meta"><span>{run.providerCallsCompleted}/{run.providerCallsLimit} Modellaufrufe</span><span>Guardian: {run.guardian?.status}</span><span>Ausführung: gesperrt</span></div></div>
      <h3>Guardian</h3><div className="ops">{(run.guardian?.roles||[]).map(r=><article key={r.id}><small>{r.label}</small><h3>{r.status}</h3><p>{(r.findings||[]).map(f=>f.message).join(" · ")||"Keine offenen Regelhinweise"}</p></article>)}</div>
      <h3>Fachagenten</h3><div className="agent-grid">{(run.specialistResults||[]).map(a=><article key={a.roleId}><small>{a.label||a.roleId}</small><h3>{a.status==="completed"?a.output.verdict:a.status}</h3>{a.status==="completed"?<><p>{(a.output.findings||[]).join(" · ")||"Keine zusätzlichen Befunde"}</p>{a.output.risks?.length>0&&<p><b>Risiken:</b> {a.output.risks.join(" · ")}</p>}{a.output.missingEvidence?.length>0&&<p><b>Fehlt:</b> {a.output.missingEvidence.join(" · ")}</p>}</>:<p>{a.reason}</p>}</article>)}</div>
      <h3>OpenAI Lead</h3><div className="split"><article className="agent-lead-card"><small>{run.leadResult?.status==="completed"?"KONSOLIDIERT":"DETERMINISTISCHER FALLBACK"}</small><h3>{run.leadDecision?.decision}</h3><p>{run.leadDecision?.summary}</p></article><div className="form"><h3>Nächste Schritte</h3>{(run.leadDecision?.nextActions||[]).map((x,i)=><p key={i}>• {x}</p>)}{(run.leadDecision?.mustConfirm||[]).length>0&&<><h3>Noch bestätigen</h3>{run.leadDecision.mustConfirm.map((x,i)=><p key={i}>• {x}</p>)}</>}</div></div>
      <div className="form agent-review"><h3>Menschliche Prüfung dokumentieren</h3><label>Notiz<textarea value={reviewNote} onChange={e=>setReviewNote(e.target.value)} placeholder="Optionaler Prüfvermerk"/></label><div className="actions"><button onClick={()=>review("accepted_for_reference")}>Als geprüft markieren</button><button className="danger" onClick={()=>review("rejected")}>Ergebnis verwerfen</button></div><p>Diese Prüfung autorisiert keine Bestellung, Zahlung, Nachricht oder technische Freigabe.</p></div>
    </>}

    <h2>Letzte Läufe</h2><div className="ops">{status.recentRuns.length?status.recentRuns.map(r=><article key={r.id}><small>{r.focus} · {r.risk}</small><h3>{stateLabel(r.finalStatus)}</h3><p>{new Date(r.createdAt).toLocaleString("de-DE")}</p><p>{r.providerCallsCompleted} Modellaufrufe · {r.operatorReview?.decision||"noch nicht menschlich geprüft"}</p></article>):<article><h3>Noch keine Läufe</h3><p>Nach der ersten Projektprüfung erscheint hier die Audit-Historie.</p></article>}</div>
  </section>;
}
