import React,{useEffect,useMemo,useState}from"react";

const request=async(path,key,options={})=>{
  const r=await fetch("/api"+path,{...options,headers:{...(options.headers||{}),Authorization:"Bearer "+key}});
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(j.error||"Serverfehler");
  return j;
};
const idem=()=>crypto.randomUUID();
const maintenanceLabel=s=>({OK:"planmäßig",DUE_SOON:"bald fällig",OVERDUE:"überfällig",CHECK_RECOMMENDED:"Prüfung empfohlen",ACTION_REQUIRED:"Handlung nötig",NO_PLANT:"keine Anlage",NOT_PLANNED:"noch offen"}[s]||s||"—");
const connectionLabel=s=>({DISABLED:"deaktiviert",CONSENT_REQUIRED:"Einwilligung fehlt",READY_FOR_DISCOVERY:"bereit für Vaillant-Verknüpfung",LINKED_WAITING_FOR_DATA:"verknüpft · Daten ausstehend",CONNECTED:"live verbunden",STALE:"Daten veraltet"}[s]||s||"—");

export default function ServiceCenter({adminKey,setAdminKey}){
  const[data,setData]=useState(null),[catalog,setCatalog]=useState([]),[loading,setLoading]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState(""),[query,setQuery]=useState(""),[selectedId,setSelectedId]=useState("");
  const[name,setName]=useState(""),[email,setEmail]=useState(""),[phone,setPhone]=useState(""),[postalCode,setPostalCode]=useState(""),[plantProductId,setPlantProductId]=useState(""),[serialNumber,setSerialNumber]=useState(""),[commissionedAt,setCommissionedAt]=useState(""),[interval,setIntervalMonths]=useState(12),[gatewayType,setGatewayType]=useState("myVAILLANT_connect"),[gatewayId,setGatewayId]=useState(""),[consentRef,setConsentRef]=useState(""),[monitoring,setMonitoring]=useState(false),[diagnostics,setDiagnostics]=useState(false),[remoteControl,setRemoteControl]=useState(false);
  const[serviceDate,setServiceDate]=useState(""),[serviceReport,setServiceReport]=useState(""),[serviceReference,setServiceReference]=useState("");
  const[configGatewayId,setConfigGatewayId]=useState(""),[configInstallationId,setConfigInstallationId]=useState("");

  async function load(key=adminKey){
    if(!key)return;setLoading(true);setError("");
    try{
      const rs=await Promise.all([request("/shk/remote-service",key),request("/shk/catalog",key)]),d=rs[0],c=rs[1];
      sessionStorage.setItem("richterich-admin",key);setData(d);
      const plants=(c.products||[]).filter(p=>p.brand==="Vaillant"&&["Wärmepumpen","Heizung & Regelung"].includes(p.category));
      setCatalog(plants);if(!plantProductId&&plants.length)setPlantProductId(plants[0].id);
      if(!selectedId&&d.plants&&d.plants.length)setSelectedId(d.plants[0].projectId);
    }catch(e){setError(e.message)}finally{setLoading(false)}
  }
  useEffect(()=>{if(adminKey)load()},[]);
  const selected=data&&data.plants?data.plants.find(x=>x.projectId===selectedId)||null:null;
  const visible=useMemo(()=>{const q=query.trim().toLowerCase();return ((data&&data.plants)||[]).filter(x=>!q||(x.customer.name+" "+x.customer.postalCode+" "+x.customer.phone+" "+x.plant.model+" "+x.plant.serialNumber).toLowerCase().includes(q))},[data,query]);

  async function createCustomer(){
    setLoading(true);setError("");setMessage("");
    try{
      const body={name,email,phone,postalCode,plantProductId,serialNumber,commissionedAt:new Date(commissionedAt).toISOString(),maintenanceIntervalMonths:Number(interval),remoteMonitoringEnabled:monitoring,monitoringConsent:monitoring,diagnosticsConsent:diagnostics,remoteControlConsent:remoteControl,consentReference:consentRef,gatewayType,gatewayId};
      const created=await request("/shk/service-customers",adminKey,{method:"POST",headers:{"Content-Type":"application/json","Idempotency-Key":idem()},body:JSON.stringify(body)});
      setMessage("Kunde und "+created.plant.model+" wurden angelegt.");setName("");setEmail("");setPhone("");setPostalCode("");setSerialNumber("");setCommissionedAt("");setGatewayId("");setConsentRef("");setMonitoring(false);setDiagnostics(false);setRemoteControl(false);
      await load();setSelectedId(created.id);
    }catch(e){setError(e.message)}finally{setLoading(false)}
  }
  async function action(projectId,version,actionName,payload={}){
    setLoading(true);setError("");setMessage("");
    try{
      const r=await request("/shk/projects/"+projectId+"/"+actionName,adminKey,{method:"POST",headers:{"Content-Type":"application/json","Idempotency-Key":idem()},body:JSON.stringify({version,...payload})});
      await load();return r;
    }catch(e){setError(e.message);throw e}finally{setLoading(false)}
  }
  async function recordService(){
    if(!selected)return;
    try{await action(selected.projectId,selected.version,"service_record",{performedAt:new Date(serviceDate).toISOString(),report:serviceReport,performedBy:"Michael Richterich",reference:serviceReference});setMessage("Wartung dokumentiert. Der nächste Wartungstermin wurde automatisch neu berechnet.");setServiceDate("");setServiceReport("");setServiceReference("")}catch{}
  }
  async function saveLink(){
    if(!selected)return;
    try{await action(selected.projectId,selected.version,"remote_service_config",{enabled:true,gatewayType:selected.remoteService&&selected.remoteService.gatewayType||"myVAILLANT_connect",gatewayId:configGatewayId||undefined,providerInstallationId:configInstallationId||undefined});setMessage("Anlagenverknüpfung gespeichert.")}catch{}
  }
  async function ack(alertId){
    if(!selected)return;
    try{await action(selected.projectId,selected.version,"remote_service_alert_ack",{alertId,note:"Im Richterich Service Center geprüft"});setMessage("Servicehinweis als geprüft markiert.")}catch{}
  }

  if(!adminKey||!data)return <section><small>REMOTE SERVICE · GESCHÜTZTER BEREICH</small><h2>Vaillant Anlagenservice.</h2><div className="split"><div className="form"><label>Betriebsschlüssel<input type="password" value={adminKey} onChange={e=>setAdminKey(e.target.value)}/></label><button disabled={!adminKey||loading} onClick={()=>load()}>{loading?"Prüft…":"Service Center öffnen →"}</button>{error&&<p className="note">{error}</p>}</div><aside><h3>Kundenanlage statt lose Serviceakte.</h3><p>Kunde und Vaillant-Anlage einmal anlegen. Wartung, Servicehistorie, Einwilligung und spätere Live-Daten bleiben danach in derselben Akte.</p></aside></div></section>;

  return <section className="service-center">
    <small>RICHTERICH CARE · VAILLANT REMOTE SERVICE</small><h2>Kunden & Anlagen.</h2>
    <p>Bestandskunden werden einmal mit der passenden Vaillant-Anlage angelegt. HOME:TWIN übernimmt Anlagenpass, Wartungslogik, Portal und die vorbereitete Remote-Service-Verknüpfung.</p>
    {message&&<p className="note success-note">{message}</p>}{error&&<p className="note">{error}</p>}
    <div className="ops service-metrics">
      <article><small>ANLAGEN</small><h3>{data.metrics.plants}</h3><p>digitale Anlagenakten</p></article>
      <article><small>LIVE</small><h3>{data.metrics.connected}</h3><p>mit aktuellen Telemetriedaten</p></article>
      <article><small>WARTUNG / PRÜFUNG</small><h3>{data.metrics.dueOrAttention}</h3><p>benötigen Aufmerksamkeit</p></article>
      <article><small>OFFENE HINWEISE</small><h3>{data.metrics.openAlerts}</h3><p>Störung oder Wartungshinweis</p></article>
    </div>
    <div className="service-readiness"><div><span className={data.provider.partnerApiCredentialsPresent?"pulse-dot":"status-dot-muted"}/><b>Vaillant Partner API</b><span>{data.provider.partnerApiCredentialsPresent?"Zugangsdaten vorbereitet":"Freischaltung/Zugang noch ausstehend"}</span></div><p>Das Service Center funktioniert bereits für Kunden-, Anlagen- und Wartungsverwaltung. Live-Synchronisierung startet erst nach Vaillant-API-Freischaltung.</p></div>
    <div className="service-layout">
      <div>
        <div className="service-list-head"><div><small>ANLAGENPARK</small><h3>{visible.length} Kundenanlagen</h3></div><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Kunde, PLZ, Modell, Seriennummer"/></div>
        <div className="service-list">{visible.map(x=><button key={x.projectId} className={"plant-row "+(selectedId===x.projectId?"active":"")} onClick={()=>{setSelectedId(x.projectId);setConfigGatewayId("");setConfigInstallationId("")}}>
          <div className="plant-avatar">V</div><div className="plant-main"><strong>{x.customer.name}</strong><span>{x.plant.model} · {x.plant.serialNumber}</span><small>{x.customer.postalCode} · {connectionLabel(x.remoteService&&x.remoteService.connectionStatus)}</small></div><div className={"maintenance-pill "+String(x.remoteService&&x.remoteService.maintenance&&x.remoteService.maintenance.status||"").toLowerCase()}>{maintenanceLabel(x.remoteService&&x.remoteService.maintenance&&x.remoteService.maintenance.status)}</div>
        </button>)}</div>
      </div>
      <div className="form service-onboarding">
        <small>NEUANLAGE / BESTANDSKUNDE</small><h3>Kunde + Heizung anlegen</h3>
        <label>Name<input value={name} onChange={e=>setName(e.target.value)}/></label><label>E-Mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>
        <div className="two"><label>Telefon<input value={phone} onChange={e=>setPhone(e.target.value)}/></label><label>PLZ<input value={postalCode} inputMode="numeric" onChange={e=>setPostalCode(e.target.value)}/></label></div>
        <label>Vaillant-Anlage<select value={plantProductId} onChange={e=>setPlantProductId(e.target.value)}>{catalog.map(p=><option key={p.id} value={p.id}>{p.title} · {p.category}</option>)}</select></label>
        <label>Seriennummer<input value={serialNumber} onChange={e=>setSerialNumber(e.target.value)}/></label>
        <div className="two"><label>Inbetriebnahme<input type="datetime-local" value={commissionedAt} onChange={e=>setCommissionedAt(e.target.value)}/></label><label>Wartungsintervall<select value={interval} onChange={e=>setIntervalMonths(Number(e.target.value))}>{[6,12,18,24,36].map(n=><option key={n} value={n}>{n} Monate</option>)}</select></label></div>
        <label>Gateway<select value={gatewayType} onChange={e=>setGatewayType(e.target.value)}><option value="myVAILLANT_connect">myVAILLANT connect</option><option value="MiGo_Link">MiGo Link</option><option value="sensoNET">sensoNET</option><option value="MiLink">MiLink</option><option value="other">anderes / offen</option></select></label>
        <label>Gateway-/System-ID <span>(optional)</span><input value={gatewayId} onChange={e=>setGatewayId(e.target.value)} placeholder="Falls bereits bekannt"/></label>
        <div className="consent-box"><label><input type="checkbox" checked={monitoring} onChange={e=>{setMonitoring(e.target.checked);if(!e.target.checked){setDiagnostics(false);setRemoteControl(false)}}}/> Monitoring / Anlagendaten freigegeben</label><label><input type="checkbox" checked={diagnostics} disabled={!monitoring} onChange={e=>setDiagnostics(e.target.checked)}/> Ferndiagnose freigegeben</label><label><input type="checkbox" checked={remoteControl} disabled={!monitoring} onChange={e=>setRemoteControl(e.target.checked)}/> Fernsteuerung separat freigegeben</label>{(monitoring||diagnostics||remoteControl)&&<label>Freigabereferenz<input value={consentRef} onChange={e=>setConsentRef(e.target.value)} placeholder="z. B. Einwilligung vom 24.09.2026"/></label>}</div>
        <button disabled={loading||!name||!email||!postalCode||!plantProductId||!serialNumber||!commissionedAt||((monitoring||diagnostics||remoteControl)&&!consentRef)} onClick={createCustomer}>{loading?"Wird angelegt…":"Kunde & Anlage anlegen →"}</button>
      </div>
    </div>
    {selected&&<div className="plant-detail">
      <div className="plant-detail-head"><div><small>ANLAGENAKTE</small><h2>{selected.customer.name}</h2><p>{selected.plant.model} · Seriennummer {selected.plant.serialNumber}</p></div><div className={"connection-badge "+(selected.remoteService&&selected.remoteService.connectionStatus==="CONNECTED"?"live":"")}>{connectionLabel(selected.remoteService&&selected.remoteService.connectionStatus)}</div></div>
      <div className="ops"><article><small>NÄCHSTE WARTUNG</small><h3>{selected.remoteService&&selected.remoteService.maintenance&&selected.remoteService.maintenance.nextDueAt?new Date(selected.remoteService.maintenance.nextDueAt).toLocaleDateString("de-DE"):"offen"}</h3><p>{maintenanceLabel(selected.remoteService&&selected.remoteService.maintenance&&selected.remoteService.maintenance.status)} · {selected.remoteService&&selected.remoteService.maintenance&&selected.remoteService.maintenance.intervalMonths||12} Monate</p></article><article><small>LETZTER SYSTEMSTATUS</small><h3>{selected.remoteService&&selected.remoteService.lastSnapshot&&selected.remoteService.lastSnapshot.systemStatus||"noch keine Live-Daten"}</h3><p>{selected.remoteService&&selected.remoteService.lastSnapshot&&selected.remoteService.lastSnapshot.observedAt?new Date(selected.remoteService.lastSnapshot.observedAt).toLocaleString("de-DE"):"Vaillant-Verknüpfung ausstehend"}</p></article><article><small>MONITORING</small><h3>{selected.remoteService&&selected.remoteService.monitoringConsent?"freigegeben":"nicht freigegeben"}</h3><p>Diagnose: {selected.remoteService&&selected.remoteService.diagnosticsConsent?"ja":"nein"} · Steuerung: {selected.remoteService&&selected.remoteService.remoteControlConsent?"ja":"nein"}</p></article><article><small>SERVICEHISTORIE</small><h3>{selected.serviceRecords&&selected.serviceRecords.length||0}</h3><p>letzte dokumentierte Wartungen</p></article></div>
      {selected.remoteService&&selected.remoteService.lastSnapshot&&<><h3>Live-Systemwerte</h3><div className="telemetry-grid">{Object.entries(selected.remoteService.lastSnapshot.temperatures||{}).map(([k,v])=><div key={k}><span>{({outdoorC:"Außen",roomActualC:"Raum Ist",roomTargetC:"Raum Soll",flowC:"Vorlauf",returnC:"Rücklauf",hotWaterC:"Warmwasser"}[k]||k)}</span><b>{v} °C</b></div>)}{Object.entries(selected.remoteService.lastSnapshot.energy||{}).filter(([k])=>k!=="estimated").map(([k,v])=><div key={k}><span>{({electricityKwh:"Strom",generatedHeatKwh:"Wärme",hotWaterKwh:"Warmwasser"}[k]||k)}</span><b>{v} kWh</b></div>)}</div><p className="service-disclaimer">Energie-/Ertragswerte können vom Anbieter berechnet oder geschätzt sein und sind nicht für Abrechnungen bestimmt.</p></>}
      {selected.remoteService&&selected.remoteService.alerts&&selected.remoteService.alerts.length>0&&<><h3>Offene Hinweise</h3><div className="ops">{selected.remoteService.alerts.map(a=><article key={a.id}><small>{a.severity.toUpperCase()} · {a.kind}</small><h3>{a.message}</h3><p>{new Date(a.openedAt).toLocaleString("de-DE")}</p><button onClick={()=>ack(a.id)}>Als geprüft markieren</button></article>)}</div></>}
      <div className="split"><div className="form"><h3>Wartung dokumentieren</h3><label>Durchgeführt am<input type="datetime-local" value={serviceDate} onChange={e=>setServiceDate(e.target.value)}/></label><label>Servicebericht<textarea value={serviceReport} onChange={e=>setServiceReport(e.target.value)} placeholder="Prüfungen, Messwerte, Arbeiten, Befund"/></label><label>Nachweis / Referenz<input value={serviceReference} onChange={e=>setServiceReference(e.target.value)}/></label><button disabled={!serviceDate||!serviceReport.trim()||!serviceReference.trim()} onClick={recordService}>Wartung abschließen →</button><p>Der nächste Wartungstermin wird anschließend automatisch aus dem Intervall berechnet.</p></div>
      <div className="form"><h3>Vaillant-Verknüpfung</h3><p>Nur die System-/Gateway-Zuordnung wird hier gespeichert. API-Zugangsdaten bleiben verschlüsselt unter „Werkzeuge“.</p><label>Gateway-ID<input value={configGatewayId} onChange={e=>setConfigGatewayId(e.target.value)} placeholder="myVAILLANT connect / Gateway ID"/></label><label>Vaillant Installations-/System-ID<input value={configInstallationId} onChange={e=>setConfigInstallationId(e.target.value)} placeholder="Nach Partner-API-Zuordnung"/></label><button disabled={!configGatewayId&&!configInstallationId} onClick={saveLink}>Verknüpfung speichern</button><p>Keine Fernsteuerung wird automatisch ausgeführt. Auch eine Kundeneinwilligung autorisiert allein keinen API-Schreibzugriff.</p></div></div>
    </div>}
  </section>
}
