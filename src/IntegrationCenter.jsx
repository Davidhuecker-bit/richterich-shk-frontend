import React,{useEffect,useMemo,useState}from"react";

const call=async(path,adminKey,options={})=>{
  const r=await fetch("/api"+path,{...options,headers:{...(options.headers||{}),Authorization:"Bearer "+adminKey}});
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(j.error||"Serverfehler");
  return j;
};
const statusText=p=>{
  if(!p)return "";
  if(p.configuration?.state==="INCOMPLETE")return "Noch unvollständig";
  if(p.configuration?.state==="READY_FOR_ADAPTER"){
    if(p.adapterStatus==="PENDING_OAUTH")return "Zugang vorbereitet · OAuth-Adapter folgt";
    if(p.adapterStatus==="PENDING_PARTNER_API")return "Partnerkonto vorbereitet · Live-API folgt";
    if(p.adapterStatus==="PENDING_CUSTOM_ADAPTER")return "Profil vorbereitet · Adapter folgt";
    return "Zugang vorbereitet · Adapter folgt";
  }
  return p.configuration?.state||"Vorbereitet";
};
const adapterLabel=s=>({
  PENDING_PARTNER_API:"Partner-API noch nicht aktiviert",
  PENDING_ADAPTER:"Live-Adapter noch nicht aktiviert",
  PENDING_OAUTH:"OAuth-Anbindung noch nicht aktiviert",
  PENDING_CUSTOM_ADAPTER:"Eigener Adapter noch nicht aktiviert"
}[s]||s);

export default function IntegrationCenter({adminKey,setAdminKey}){
  const[data,setData]=useState(null),[error,setError]=useState(""),[loading,setLoading]=useState(false),
  [selected,setSelected]=useState(null),[editingId,setEditingId]=useState(null),[profileName,setProfileName]=useState(""),
  [values,setValues]=useState({}),[secrets,setSecrets]=useState({}),[message,setMessage]=useState(""),
  [confirmDisconnect,setConfirmDisconnect]=useState("");

  async function load(key=adminKey){
    if(!key)return;
    setLoading(true);setError("");
    try{
      const next=await call("/shk/integrations",key);
      sessionStorage.setItem("richterich-admin",key);
      setData(next);
    }catch(e){setData(null);setError(e.message)}
    finally{setLoading(false)}
  }
  useEffect(()=>{if(adminKey)load()},[]);

  const grouped=useMemo(()=>{
    const out={};
    for(const d of data?.definitions||[])(out[d.category]??=[]).push(d);
    return out;
  },[data]);

  function start(def,profile=null){
    setSelected(def);setEditingId(profile?.id||null);setProfileName(profile?.name||def.label);
    setValues(profile?.settings||{});setSecrets({});setMessage("");setError("");
    window.scrollTo({top:0,behavior:"smooth"});
  }
  async function save(){
    if(!selected||!profileName.trim())return;
    setLoading(true);setError("");setMessage("");
    try{
      const payload={providerId:selected.id,name:profileName.trim(),settings:{},secrets:{},...(editingId?{id:editingId}:{})};
      for(const f of selected.fields){
        const value=(f.secret?secrets[f.key]:values[f.key])??"";
        if(f.secret){if(String(value).trim())payload.secrets[f.key]=String(value).trim();}
        else if(String(value).trim())payload.settings[f.key]=String(value).trim();
      }
      const r=await call("/shk/integrations/configure",adminKey,{method:"POST",headers:{"Content-Type":"application/json","Idempotency-Key":crypto.randomUUID()},body:JSON.stringify(payload)});
      setMessage(r.complete?"Zugangsdaten sicher gespeichert. Die technische Live-Anbindung kann auf diesem Profil aufsetzen.":"Profil gespeichert. Es fehlen noch Pflichtangaben.");
      setSelected(null);setEditingId(null);setSecrets({});await load();
    }catch(e){setError(e.message)}finally{setLoading(false)}
  }
  async function check(profile){
    setLoading(true);setError("");setMessage("");
    try{
      const r=await call("/shk/integrations/"+profile.id+"/check",adminKey,{method:"POST",headers:{"Content-Type":"application/json","Idempotency-Key":crypto.randomUUID()},body:"{}"});
      setMessage(r.complete?"Konfiguration geprüft: Zugangsdaten sind vollständig und sicher lesbar. Ein externer Login wurde noch nicht ausgeführt.":"Konfiguration geprüft. Fehlend: "+(r.missing||[]).join(", "));
      await load();
    }catch(e){setError(e.message)}finally{setLoading(false)}
  }
  async function disconnect(profile){
    if(confirmDisconnect!==profile.id){setConfirmDisconnect(profile.id);return}
    setLoading(true);setError("");setMessage("");
    try{
      await call("/shk/integrations/"+profile.id+"/disconnect",adminKey,{method:"POST",headers:{"Content-Type":"application/json","Idempotency-Key":crypto.randomUUID()},body:"{}"});
      setConfirmDisconnect("");setMessage(profile.name+" wurde getrennt und die gespeicherten Zugangsdaten wurden entfernt.");await load();
    }catch(e){setError(e.message)}finally{setLoading(false)}
  }
  if(!adminKey||!data)return <section><small>PERSÖNLICHER ARBEITSBEREICH · WERKZEUGE</small><h2>Werkzeuge & Verbindungen.</h2><div className="split"><div className="form"><h3>Betriebszugang</h3><p>Nur Michael bzw. ein freigegebenes Arbeitsgerät darf Händler, Buchhaltung, Kalender oder Kommunikationskonten einrichten.</p><label>Betriebsschlüssel<input type="password" autoComplete="current-password" value={adminKey} onChange={e=>setAdminKey(e.target.value)} placeholder="Betriebsschlüssel"/></label><button disabled={!adminKey||loading} onClick={()=>load()}>{loading?"Prüfe…":"Arbeitsbereich öffnen →"}</button>{error&&<p className="note">{error}</p>}</div><aside><small>SICHERHEIT</small><h3>Keine Zugangsdaten im Frontend.</h3><p>Geheimnisse werden einmal übertragen, serverseitig verschlüsselt und danach nicht wieder an den Browser zurückgegeben.</p></aside></div></section>;

  if(selected){
    const profile=editingId?data.profiles.find(p=>p.id===editingId):null;
    return <section><small>WERKZEUGE · EINRICHTUNGSASSISTENT</small><h2>{selected.label} verbinden.</h2><div className="actions"><button className="ghost" onClick={()=>{setSelected(null);setError("");setMessage("")}}>← Zurück</button></div><div className="split"><div className="form"><label>Bezeichnung<input value={profileName} onChange={e=>setProfileName(e.target.value)} placeholder={selected.label+" Konto"}/></label>{selected.fields.map(f=><label key={f.key}>{f.label}{f.required?" *":""}<input type={f.secret?"password":"text"} autoComplete="off" value={f.secret?(secrets[f.key]||""):(values[f.key]||"")} onChange={e=>f.secret?setSecrets({...secrets,[f.key]:e.target.value}):setValues({...values,[f.key]:e.target.value})} placeholder={f.secret&&profile?.secretFields?.includes(f.key)?"Bereits sicher gespeichert – leer lassen zum Behalten":f.placeholder}/></label>)}{error&&<p className="note">{error}</p>}<button disabled={loading||!profileName.trim()} onClick={save}>{loading?"Speichert…":"Sicher speichern →"}</button></div><aside><small>{selected.category}</small><h3>{selected.label}</h3><p>{selected.description}</p><p><b>Status:</b> {adapterLabel(selected.adapterStatus)}</p><p>Die Einrichtung speichert das Konto und die Zugangsdaten. Solange der Anbieteradapter noch nicht freigegeben ist, führt das System keine behaupteten Live-Aufrufe aus.</p></aside></div></section>;
  }

  return <section><small>PERSÖNLICHER ARBEITSBEREICH · WERKZEUGE</small><h2>Alles an einem Ort verbinden.</h2><p>Michael kann hier Händler, Hersteller, Buchhaltung, E-Mail, WhatsApp, Kalender und weitere persönliche Arbeitswerkzeuge selbst hinterlegen – ohne Codeänderung und ohne Secrets in GitHub oder im Browser zu speichern.</p>
  <div className="ops"><article><small>TRESOR</small><h3>{data.vaultReady?"Aktiv":"Nicht bereit"}</h3><p>Serverseitig verschlüsselte Zugangsdaten</p></article><article><small>PROFILE</small><h3>{data.profiles.length}</h3><p>Eingerichtete Arbeitswerkzeuge</p></article><article><small>BEDIENUNG</small><h3>4 Schritte</h3><p>Anbieter wählen → Daten eintragen → speichern → Konfiguration prüfen</p></article></div>
  {message&&<p className="note">{message}</p>}{error&&<p className="note">{error}</p>}
  {data.profiles.length>0&&<><h2>Meine Verbindungen</h2><div className="grid">{data.profiles.map(p=>{const def=data.definitions.find(d=>d.id===p.providerId);return <article key={p.id}><div className="tool-icon">{def?.icon||"•"}</div><small>{def?.category||"Werkzeug"}</small><h3>{p.name}</h3><p>{def?.label}</p><p><b>{statusText(p)}</b></p>{p.configuration?.missing?.length>0&&<p>Fehlt: {p.configuration.missing.join(", ")}</p>}<p>{adapterLabel(p.adapterStatus)}</p><div className="tool-actions"><button onClick={()=>check(p)}>Konfiguration prüfen</button><button className="ghost" onClick={()=>start(def,p)}>Bearbeiten</button><button className="danger" onClick={()=>disconnect(p)}>{confirmDisconnect===p.id?"Wirklich trennen":"Trennen"}</button></div></article>})}</div></>}
  <h2>Neue Verbindung</h2>{Object.entries(grouped).map(([category,defs])=><div key={category} className="tool-group"><h3>{category}</h3><div className="grid">{defs.map(def=><article key={def.id}><div className="tool-icon">{def.icon}</div><small>{def.category}</small><h3>{def.label}</h3><p>{def.description}</p><button onClick={()=>start(def)}>Einrichten →</button></article>)}</div></div>)}
  <div className="integration-help"><small>SO FUNKTIONIERT ES</small><h3>Kein technisches Setup im Alltag nötig.</h3><p>Die Zugangsdaten werden einmal im geschützten Arbeitsbereich eingetragen. Danach bleibt das Profil bestehen. Wenn später der konkrete Elmer-, Vaillant-, Buchhaltungs-, Kalender- oder Kommunikationsadapter aktiviert wird, nutzt er genau dieses Profil weiter.</p></div></section>;
}
