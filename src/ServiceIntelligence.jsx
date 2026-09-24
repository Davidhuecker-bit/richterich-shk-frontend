import React,{useMemo,useState}from"react";

const healthMeta=s=>({
  CRITICAL:["Störung","critical"],
  ATTENTION:["Prüfung empfohlen","attention"],
  WATCH:["Trend beobachten","watch"],
  HEALTHY:["Unauffällig","healthy"],
  LEARNING:["Referenz wird aufgebaut","learning"],
  NO_DATA:["Noch keine Daten","nodata"],
  OFFLINE:["Verbindung prüfen","offline"]
}[s]||[s||"Unbekannt","nodata"]);

const fmtValue=v=>v===null||v===undefined?"—":typeof v==="object"?JSON.stringify(v):String(v);

export function FleetRadar({data}){
  const h=data&&data.metrics&&data.metrics.health||{};
  const cells=[
    ["CRITICAL","Akut",h.CRITICAL||0],
    ["ATTENTION","Prüfen",h.ATTENTION||0],
    ["WATCH","Beobachten",h.WATCH||0],
    ["OFFLINE","Offline",h.OFFLINE||0],
    ["HEALTHY","Unauffällig",h.HEALTHY||0],
    ["LEARNING","Lernphase",h.LEARNING||0]
  ];
  return <div className="fleet-radar"><div className="fleet-radar-head"><div><small>ANLAGENPARK-RADAR</small><h3>Alle Kundenanlagen auf einen Blick.</h3></div><p>Keine Blackbox-Bewertung: Prioritäten entstehen aus Verbindung, Fehlern, Wartung und dem eigenen Referenzbetrieb der jeweiligen Anlage.</p></div><div className="fleet-radar-grid">{cells.map(([status,label,count])=><div key={status} className={"fleet-radar-cell "+healthMeta(status)[1]}><span>{label}</span><b>{count}</b></div>)}</div></div>
}

export default function ServiceIntelligence({selected,action}){
  const[observedAt,setObservedAt]=useState(""),[note,setNote]=useState(""),[flow,setFlow]=useState(""),[returnC,setReturnC]=useState(""),[roomActual,setRoomActual]=useState(""),[roomTarget,setRoomTarget]=useState(""),[hotWater,setHotWater]=useState("");
  const[faultCode,setFaultCode]=useState(""),[faultMessage,setFaultMessage]=useState(""),[parameterKey,setParameterKey]=useState(""),[parameterLabel,setParameterLabel]=useState(""),[parameterValue,setParameterValue]=useState(""),[parameterUnit,setParameterUnit]=useState(""),[saving,setSaving]=useState(false),[localMsg,setLocalMsg]=useState("");
  const health=selected&&selected.health||selected&&selected.technician&&selected.technician.health;
  const ftf=selected&&selected.firstTimeFix||selected&&selected.technician&&selected.technician.firstTimeFix;
  const tech=selected&&selected.technician;
  const meta=healthMeta(health&&health.status);
  const history=useMemo(()=>tech&&tech.parameterHistory||[],[tech]);

  async function saveLocalCapture(){
    if(!selected)return;
    setSaving(true);setLocalMsg("");
    try{
      const temperatures={};
      if(flow!=="")temperatures.flowC=Number(flow);
      if(returnC!=="")temperatures.returnC=Number(returnC);
      if(roomActual!=="")temperatures.roomActualC=Number(roomActual);
      if(roomTarget!=="")temperatures.roomTargetC=Number(roomTarget);
      if(hotWater!=="")temperatures.hotWaterC=Number(hotWater);
      const parameters=parameterKey.trim()||parameterLabel.trim()||parameterValue!==""?[{key:parameterKey.trim()||"local.custom",label:parameterLabel.trim()||parameterKey.trim()||"Lokaler Fachparameter",group:"Vor-Ort-Service",value:parameterValue===""?null:(Number.isFinite(Number(parameterValue))&&parameterValue.trim()!==""?Number(parameterValue):parameterValue),unit:parameterUnit.trim()||undefined,criticality:"service"}]:[];
      const faults=faultCode.trim()?[{code:faultCode.trim(),severity:"warning",message:faultMessage.trim()||"Vor Ort an der Fachhandwerkerebene abgelesen"}]:[];
      await action(selected.projectId,selected.version,"remote_service_local_capture",{observedAt:new Date(observedAt).toISOString(),recordedBy:"Michael Richterich",note,temperatures,parameters,faults});
      setLocalMsg("Vor-Ort-Werte wurden in der Anlagenakte gespeichert.");setObservedAt("");setNote("");setFlow("");setReturnC("");setRoomActual("");setRoomTarget("");setHotWater("");setFaultCode("");setFaultMessage("");setParameterKey("");setParameterLabel("");setParameterValue("");setParameterUnit("");
    }catch(e){setLocalMsg(e.message||"Erfassung fehlgeschlagen")}finally{setSaving(false)}
  }

  if(!selected)return null;
  return <div className="service-intelligence">
    <div className="intelligence-head"><div><small>SERVICE INTELLIGENCE</small><h3>Gesundheitsprofil & Einsatzvorbereitung</h3><p>HOME:TWIN vergleicht die Anlage mit ihrem eigenen unauffälligen Betrieb. Auffälligkeiten werden als prüfbare Evidenz gezeigt – nicht als automatische Diagnose.</p></div><div className={"health-badge "+meta[1]}><span>{meta[0]}</span><b>{health&&health.status||"NO_DATA"}</b></div></div>

    <div className="intelligence-grid">
      <article className="health-card"><small>EIGENER REFERENZBETRIEB</small><h4>{health&&health.baseline&&health.baseline.ready?"Baseline aktiv":"Noch Lernphase"}</h4><p>{health&&health.baseline?health.baseline.samples:0} unauffällige Messpunkte im aktuellen Referenzfenster.</p><div className="health-facts"><span>Spreizung Referenz <b>{health&&health.baseline&&health.baseline.flowReturnDeltaC!=null?health.baseline.flowReturnDeltaC.toFixed(1)+" °C":"—"}</b></span><span>Raum Soll/Ist Referenz <b>{health&&health.baseline&&health.baseline.roomTargetGapC!=null?health.baseline.roomTargetGapC.toFixed(1)+" °C":"—"}</b></span></div></article>
      <article className="health-card"><small>AKTUELLE BEWERTUNG</small><h4>{meta[0]}</h4>{health&&health.reasons&&health.reasons.length?<ul>{health.reasons.map((x,i)=><li key={i}>{x}</li>)}</ul>:<p>Keine regelbasierte Auffälligkeit aus den vorhandenen Daten.</p>}<p className="micro-copy">Methode: {health&&health.method||"noch keine Live-Baseline"}</p></article>
    </div>

    <div className="first-fix-panel"><div className="first-fix-head"><div><small>FIRST-TIME-FIX ASSISTENT</small><h4>Vor dem Termin wissen, was wirklich belegt ist.</h4></div><span>{ftf&&ftf.status||"WAITING_FOR_DATA"}</span></div><div className="first-fix-columns"><div><h5>Evidenz</h5>{ftf&&ftf.evidence&&ftf.evidence.length?<div className="evidence-list">{ftf.evidence.map((x,i)=><article key={i}><small>{x.type} · {x.label}</small><b>{x.value}</b>{x.recommendation&&<p>Vaillant-Hinweis: {x.recommendation}</p>}</article>)}</div>:<p>Noch keine verwertbare Störungs-/Diagnoseevidenz.</p>}</div><div><h5>Prüfliste</h5><ol>{(ftf&&ftf.checklist||[]).map((x,i)=><li key={i}>{x}</li>)}</ol><div className="parts-lock"><b>Ersatzteile: noch nicht festgelegt</b><span>Material wird erst nach belegtem Befund vorgeschlagen oder bestellt.</span></div></div></div><p className="service-disclaimer">{ftf&&ftf.disclaimer}</p></div>

    <div className="intelligence-grid">
      <div className="parameter-history-panel"><div><small>PARAMETER-GEDÄCHTNIS</small><h4>Was hat sich wann verändert?</h4></div>{history.length?<div className="parameter-history-list">{history.slice(0,30).map(x=><article key={x.id}><div><small>{new Date(x.observedAt).toLocaleString("de-DE")} · {x.source}</small><b>{x.label}</b><span>{x.kind==="CHANGED"?fmtValue(x.oldValue)+" → "+fmtValue(x.newValue):"erstmals gesehen: "+fmtValue(x.newValue)} {x.unit||""}</span></div><em>{x.access}</em></article>)}</div>:<p>Noch keine Parameterhistorie. Sie entsteht automatisch aus API- und Vor-Ort-Werten.</p>}</div>

      <div className="local-capture-panel"><div><small>VOR ORT · FACHHANDWERKEREBENE</small><h4>Touchscreen-Werte direkt in HOME:TWIN übernehmen</h4><p>Für Parameter, die Vaillant nicht remote freigibt. Diese Werte bleiben intern und ersetzen keine Live-API-Daten.</p></div><div className="local-capture-form"><label>Zeitpunkt<input type="datetime-local" value={observedAt} onChange={e=>setObservedAt(e.target.value)}/></label><div className="local-temp-grid"><label>Vorlauf °C<input inputMode="decimal" value={flow} onChange={e=>setFlow(e.target.value)}/></label><label>Rücklauf °C<input inputMode="decimal" value={returnC} onChange={e=>setReturnC(e.target.value)}/></label><label>Raum Ist °C<input inputMode="decimal" value={roomActual} onChange={e=>setRoomActual(e.target.value)}/></label><label>Raum Soll °C<input inputMode="decimal" value={roomTarget} onChange={e=>setRoomTarget(e.target.value)}/></label><label>Warmwasser °C<input inputMode="decimal" value={hotWater} onChange={e=>setHotWater(e.target.value)}/></label></div><div className="local-two"><label>Fehlercode<input value={faultCode} onChange={e=>setFaultCode(e.target.value)} placeholder="optional"/></label><label>Fehlertext<input value={faultMessage} onChange={e=>setFaultMessage(e.target.value)} placeholder="optional"/></label></div><div className="local-two"><label>Parameter-Key<input value={parameterKey} onChange={e=>setParameterKey(e.target.value)} placeholder="z. B. heating.curve"/></label><label>Bezeichnung<input value={parameterLabel} onChange={e=>setParameterLabel(e.target.value)} placeholder="z. B. Heizkurve"/></label></div><div className="local-two"><label>Wert<input value={parameterValue} onChange={e=>setParameterValue(e.target.value)}/></label><label>Einheit<input value={parameterUnit} onChange={e=>setParameterUnit(e.target.value)} placeholder="°C, %, …"/></label></div><label>Vor-Ort-Notiz<textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Was wurde geprüft / beobachtet?"/></label><button disabled={saving||!observedAt||(!note.trim()&&flow===""&&returnC===""&&roomActual===""&&roomTarget===""&&hotWater===""&&!faultCode.trim()&&!parameterKey.trim()&&!parameterLabel.trim())} onClick={saveLocalCapture}>{saving?"Wird gespeichert…":"Vor-Ort-Werte speichern →"}</button>{localMsg&&<p className="micro-copy">{localMsg}</p>}</div></div>
    </div>

    {tech&&tech.localCaptures&&tech.localCaptures.length>0&&<div className="local-capture-history"><small>LETZTE VOR-ORT-ERFASSUNGEN</small><div className="evidence-list">{tech.localCaptures.slice(0,6).map(x=><article key={x.id}><small>{new Date(x.observedAt).toLocaleString("de-DE")} · {x.recordedBy}</small><b>{x.note||"Fachhandwerkerwerte erfasst"}</b><p>{Object.entries(x.temperatures||{}).map(([k,v])=>k+": "+v+" °C").join(" · ")}</p>{x.faults&&x.faults.length>0&&<p>Fehler: {x.faults.map(f=>f.code).join(", ")}</p>}</article>)}</div></div>}
  </div>
}
