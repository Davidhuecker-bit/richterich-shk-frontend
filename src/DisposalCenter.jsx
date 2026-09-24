import React,{useEffect,useMemo,useState}from"react";
import"./DisposalCenter.css";

const routeLabel=s=>({
  SCRAP_VALUE:"Schrott / Wertstoff",
  CONSTRUCTION_WASTE:"Baustellenentsorgung",
  SPECIALIST_DISPOSAL:"Spezialentsorgung",
  RECOMMERCE_REVIEW:"Wiederverkauf prüfen",
  MANUAL_REVIEW:"Manuell prüfen"
}[s]||s||"—");
const materialLabel=s=>({
  ferrous_metal:"Stahl / Eisen",
  copper:"Kupfer",
  brass:"Messing",
  stainless:"Edelstahl",
  mixed_metal:"Mischmetall",
  ceramic_rubble:"Keramik / Bauschutt",
  packaging:"Verpackung",
  plastic:"Kunststoff",
  wood:"Holz",
  gypsum:"Gips",
  insulation:"Dämmstoff",
  electrical_device:"Elektrogerät",
  heat_pump_refrigerant:"Wärmepumpe / Kältemittel",
  mixed_construction:"Gemischter Baustellenabfall",
  unknown:"Noch unklar"
}[s]||s||"—");
const materials=["ferrous_metal","copper","brass","stainless","mixed_metal","ceramic_rubble","packaging","plastic","wood","gypsum","insulation","electrical_device","heat_pump_refrigerant","mixed_construction","unknown"];
const routes=["SCRAP_VALUE","CONSTRUCTION_WASTE","SPECIALIST_DISPOSAL","RECOMMERCE_REVIEW","MANUAL_REVIEW"];
const money=c=>(Number(c||0)/100).toLocaleString("de-DE",{style:"currency",currency:"EUR"});
const idem=()=>crypto.randomUUID();

export default function DisposalCenter({adminKey,setAdminKey}){
  const[data,setData]=useState(null),[error,setError]=useState(""),[message,setMessage]=useState(""),[loading,setLoading]=useState(false);
  const[projectId,setProjectId]=useState(""),[title,setTitle]=useState(""),[material,setMaterial]=useState("ferrous_metal"),[qty,setQty]=useState(1),[weight,setWeight]=useState(""),[volume,setVolume]=useState(""),[reuse,setReuse]=useState(false),[description,setDescription]=useState("");
  const[partnerName,setPartnerName]=useState(""),[partnerRoutes,setPartnerRoutes]=useState(["SCRAP_VALUE"]),[partnerPrefixes,setPartnerPrefixes]=useState(""),[partnerPickup,setPartnerPickup]=useState(true),[partnerContact,setPartnerContact]=useState(""),[partnerEvidence,setPartnerEvidence]=useState("");
  const[selectedItemId,setSelectedItemId]=useState(""),[selectedPartnerId,setSelectedPartnerId]=useState(""),[pickupAt,setPickupAt]=useState(""),[assignmentRef,setAssignmentRef]=useState("");
  const[doneRef,setDoneRef]=useState(""),[doneCost,setDoneCost]=useState("0"),[doneRevenue,setDoneRevenue]=useState("0"),[doneWeight,setDoneWeight]=useState("");
  const[reBrand,setReBrand]=useState(""),[rePrice,setRePrice]=useState(""),[reOwner,setReOwner]=useState(""),[reLocation,setReLocation]=useState("");

  async function request(path,options={}){
    const r=await fetch("/api"+path,{...options,headers:{...(options.headers||{}),Authorization:"Bearer "+adminKey}});
    const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||"Serverfehler");return j;
  }
  async function load(){
    if(!adminKey)return;setLoading(true);setError("");
    try{const d=await request("/shk/disposal");sessionStorage.setItem("richterich-admin",adminKey);setData(d);if(!projectId&&d.projects?.length)setProjectId(d.projects[0].id);if(!selectedItemId&&d.items?.length)setSelectedItemId(d.items[0].id)}
    catch(e){setError(e.message);setData(null)}finally{setLoading(false)}
  }
  useEffect(()=>{if(adminKey)load()},[]);

  const selectedItem=useMemo(()=>data?.items?.find(x=>x.id===selectedItemId)||null,[data,selectedItemId]);
  const selectedProject=data?.projects?.find(x=>x.id===projectId)||null;
  const compatiblePartners=useMemo(()=>selectedItem?(data?.partners||[]).filter(p=>(p.routes||[]).includes(selectedItem.route)):[],[data,selectedItem]);

  async function projectAction(pid,version,action,body){
    setLoading(true);setError("");setMessage("");
    try{
      const r=await request("/shk/projects/"+pid+"/"+action,{method:"POST",headers:{"Content-Type":"application/json","Idempotency-Key":idem()},body:JSON.stringify({version,...body})});
      await load();return r;
    }catch(e){setError(e.message);throw e}finally{setLoading(false)}
  }
  async function addItem(){
    if(!selectedProject)return;
    try{
      await projectAction(selectedProject.id,selectedProject.version,"disposal_add",{title,material,quantity:Number(qty),estimatedWeightKg:weight===""?null:Number(weight),estimatedVolumeM3:volume===""?null:Number(volume),reuseCandidate:reuse,description,location:selectedProject.address||selectedProject.customer?.postalCode});
      setMessage("Ausbau-/Entsorgungsposition wurde angelegt.");setTitle("");setWeight("");setVolume("");setDescription("");setReuse(false);
    }catch{}
  }
  async function savePartner(){
    setLoading(true);setError("");setMessage("");
    try{
      await request("/shk/disposal/partners",{method:"POST",headers:{"Content-Type":"application/json","Idempotency-Key":idem()},body:JSON.stringify({name:partnerName,routes:partnerRoutes,servicePostalPrefixes:partnerPrefixes.split(/[,;\s]+/).map(x=>x.trim()).filter(Boolean),pickupAvailable:partnerPickup,contact:partnerContact,evidenceReference:partnerEvidence,verifiedAt:new Date().toISOString(),active:true})});
      setMessage("Entsorgungspartner wurde als geprüftes Profil hinterlegt.");setPartnerName("");setPartnerPrefixes("");setPartnerContact("");setPartnerEvidence("");await load();
    }catch(e){setError(e.message)}finally{setLoading(false)}
  }
  async function assignPartner(){
    if(!selectedItem||!selectedPartnerId)return;
    try{const p=data.projects.find(x=>x.id===selectedItem.projectId);await projectAction(selectedItem.projectId,p.version,"disposal_assign_partner",{itemId:selectedItem.id,partnerId:selectedPartnerId,plannedPickupAt:pickupAt?new Date(pickupAt).toISOString():undefined,reference:assignmentRef});setMessage("Partner wurde der Position zugeordnet.");setAssignmentRef("");setPickupAt("")}catch{}
  }
  async function completeItem(){
    if(!selectedItem)return;
    try{const p=data.projects.find(x=>x.id===selectedItem.projectId);await projectAction(selectedItem.projectId,p.version,"disposal_complete",{itemId:selectedItem.id,reference:doneRef,costCents:Math.round(Number(doneCost||0)*100),revenueCents:Math.round(Number(doneRevenue||0)*100),actualWeightKg:doneWeight===""?null:Number(doneWeight)});setMessage("Entsorgung wurde mit Nachweis abgeschlossen.");setDoneRef("");setDoneCost("0");setDoneRevenue("0");setDoneWeight("")}catch{}
  }
  async function toRecommerce(){
    if(!selectedItem)return;
    try{const p=data.projects.find(x=>x.id===selectedItem.projectId);await projectAction(selectedItem.projectId,p.version,"disposal_recommerce_prepare",{itemId:selectedItem.id,ownershipApproved:true,brand:reBrand||"Unbekannt",description:selectedItem.description||"Ausgebautes Gebrauchtteil – technische Prüfung vor Verkauf erforderlich.",location:reLocation||selectedItem.location||selectedItem.customer?.postalCode,owner:reOwner||selectedItem.customer?.name,priceGrossCents:Math.round(Number(rePrice)*100),safetyRelevant:true});setMessage("Gebrauchtteil wurde als Recommerce-Entwurf angelegt. Noch nicht veröffentlicht.");setReBrand("");setRePrice("");setReOwner("");setReLocation("")}catch{}
  }

  if(!adminKey||!data)return <section><small>ENTSORGUNG · GESCHÜTZTER BEREICH</small><h2>Disposal & Recommerce.</h2><div className="split"><div className="form"><label>Betriebsschlüssel<input type="password" value={adminKey} onChange={e=>setAdminKey(e.target.value)}/></label><button disabled={!adminKey||loading} onClick={load}>{loading?"Prüft…":"Entsorgung öffnen →"}</button>{error&&<p className="note">{error}</p>}</div><aside><h3>Ausbau raus aus Michaels Transporter.</h3><p>Schrott, Baustellenabfall, Spezialentsorgung und wiederverwendbare Teile bleiben direkt an der Projektakte.</p></aside></div></section>;

  return <section className="disposal-center">
    <small>HOME:TWIN · DISPOSAL & RECOMMERCE</small><h2>Ausbau, Schrott & Entsorgung.</h2>
    <p>Ausbauteil erfassen, richtigen Weg vorbereiten, Partner zuordnen und Nachweis speichern. Externe Abholung oder Entsorgung wird nicht automatisch ausgelöst.</p>
    {message&&<p className="note success-note">{message}</p>}{error&&<p className="note">{error}</p>}
    <div className="ops disposal-metrics">
      <article><small>OFFEN</small><h3>{data.metrics.open}</h3><p>noch nicht abgeschlossen</p></article>
      <article><small>PARTNER ZUGEORDNET</small><h3>{data.metrics.partnerAssigned}</h3><p>Abholung / Annahme vorbereitet</p></article>
      <article><small>RECOMMERCE</small><h3>{data.metrics.recommerceDrafts}</h3><p>Gebrauchtteile in Prüfung</p></article>
      <article><small>NETTO ENTSORGUNG</small><h3>{money(data.metrics.netCents)}</h3><p>{money(data.metrics.revenueCents)} Erlös · {money(data.metrics.costCents)} Kosten</p></article>
    </div>

    <div className="disposal-layout">
      <div className="form">
        <small>01 · AUSBAU ERFASSEN</small><h3>Neue Position</h3>
        <label>Kundenprojekt<select value={projectId} onChange={e=>setProjectId(e.target.value)}>{(data.projects||[]).map(p=><option key={p.id} value={p.id}>{p.customer?.name} · {p.customer?.postalCode} · {p.kind}</option>)}</select></label>
        <label>Ausbauteil / Abfall<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="z. B. alter Stahlkessel"/></label>
        <label>Material<select value={material} onChange={e=>setMaterial(e.target.value)}>{materials.map(x=><option key={x} value={x}>{materialLabel(x)}</option>)}</select></label>
        <div className="two"><label>Menge<input type="number" min="1" value={qty} onChange={e=>setQty(Number(e.target.value))}/></label><label>Gewicht ca. kg<input inputMode="decimal" value={weight} onChange={e=>setWeight(e.target.value)}/></label></div>
        <label>Volumen ca. m³<input inputMode="decimal" value={volume} onChange={e=>setVolume(e.target.value)}/></label>
        <label className="disposal-check"><input type="checkbox" checked={reuse} onChange={e=>setReuse(e.target.checked)}/> Wiederverwendung / Verkauf zuerst prüfen</label>
        <label>Notiz<textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Zustand, Ausbauumfang, Besonderheiten"/></label>
        <button disabled={loading||!projectId||!title.trim()} onClick={addItem}>Position anlegen →</button>
      </div>

      <div>
        <div className="disposal-list-head"><div><small>02 · OFFENE POSITIONEN</small><h3>{data.items.length} Positionen</h3></div><button className="ghost" onClick={load}>Aktualisieren</button></div>
        <div className="disposal-list">{data.items.map(x=><button key={x.id} onClick={()=>{setSelectedItemId(x.id);setSelectedPartnerId("");}} className={"disposal-row "+(selectedItemId===x.id?"active":"")}><div><small>{x.customer?.name} · {x.customer?.postalCode}</small><b>{x.title}</b><span>{materialLabel(x.material)} · {x.estimatedWeightKg!=null?x.estimatedWeightKg+" kg · ":""}{routeLabel(x.route)}</span></div><div className={"disposal-status "+x.status.toLowerCase()}>{x.status.replaceAll("_"," ")}</div></button>)}</div>
      </div>
    </div>

    {selectedItem&&<div className="disposal-detail">
      <div className="disposal-detail-head"><div><small>POSITION</small><h3>{selectedItem.title}</h3><p>{selectedItem.customer?.name} · {selectedItem.customer?.postalCode} · {materialLabel(selectedItem.material)}</p></div><div className="route-chip">{routeLabel(selectedItem.route)}</div></div>
      <div className="ops">
        <article><small>STATUS</small><h3>{selectedItem.status.replaceAll("_"," ")}</h3><p>{selectedItem.hazardousOrSpecial?"Spezial-/Gefahrstoffprüfung erforderlich":"Normaler Arbeitsweg"}</p></article>
        <article><small>GESCHÄTZT</small><h3>{selectedItem.estimatedWeightKg!=null?selectedItem.estimatedWeightKg+" kg":"Gewicht offen"}</h3><p>{selectedItem.estimatedVolumeM3!=null?selectedItem.estimatedVolumeM3+" m³":"Volumen offen"}</p></article>
        <article><small>WIEDERVERWENDUNG</small><h3>{selectedItem.reuseCandidate?"prüfen":"nein"}</h3><p>{selectedItem.recommerceAssetId?"Recommerce-Entwurf vorhanden":"noch keine Übergabe"}</p></article>
      </div>

      {selectedItem.route==="RECOMMERCE_REVIEW"&&selectedItem.status!=="RECOMMERCE_DRAFT"?<div className="form recommerce-handoff"><small>RECOMMERCE</small><h3>Nicht entsorgen – erst Verkauf prüfen</h3><p>Es wird nur ein interner Gebrauchtwaren-Entwurf erzeugt. Veröffentlichung bleibt weiterhin gesperrt, bis Eigentum, Abholung, technische Prüfung und Meisterfreigabe erfüllt sind.</p><div className="two"><label>Hersteller<input value={reBrand} onChange={e=>setReBrand(e.target.value)}/></label><label>Preisidee brutto €<input type="number" min="0.01" step="0.01" value={rePrice} onChange={e=>setRePrice(e.target.value)}/></label></div><div className="two"><label>Eigentümer<input value={reOwner} onChange={e=>setReOwner(e.target.value)} placeholder={selectedItem.customer?.name}/></label><label>Standort<input value={reLocation} onChange={e=>setReLocation(e.target.value)} placeholder={selectedItem.location||selectedItem.customer?.postalCode}/></label></div><button disabled={!rePrice} onClick={toRecommerce}>Als Gebrauchtteil vorbereiten →</button></div>:<>
        <div className="split">
          <div className="form"><small>03 · PARTNER</small><h3>Abholung / Annahme zuordnen</h3>{compatiblePartners.length?<label>Passender Partner<select value={selectedPartnerId} onChange={e=>setSelectedPartnerId(e.target.value)}><option value="">Partner wählen</option>{compatiblePartners.map(p=><option key={p.id} value={p.id}>{p.name}{p.pickupAvailable?" · Abholung":""}</option>)}</select></label>:<p>Noch kein geprüfter Partner für <b>{routeLabel(selectedItem.route)}</b> hinterlegt.</p>}<label>Geplante Abholung<input type="datetime-local" value={pickupAt} onChange={e=>setPickupAt(e.target.value)}/></label><label>Referenz / Bestätigung<input value={assignmentRef} onChange={e=>setAssignmentRef(e.target.value)}/></label><button disabled={!selectedPartnerId} onClick={assignPartner}>Partner zuordnen</button></div>
          <div className="form"><small>04 · ABSCHLUSS</small><h3>Entsorgung dokumentieren</h3><label>Wiege-/Entsorgungsnachweis<input value={doneRef} onChange={e=>setDoneRef(e.target.value)}/></label><div className="two"><label>Kosten €<input type="number" min="0" step="0.01" value={doneCost} onChange={e=>setDoneCost(e.target.value)}/></label><label>Schrotterlös €<input type="number" min="0" step="0.01" value={doneRevenue} onChange={e=>setDoneRevenue(e.target.value)}/></label></div><label>Ist-Gewicht kg<input inputMode="decimal" value={doneWeight} onChange={e=>setDoneWeight(e.target.value)}/></label><button disabled={!doneRef.trim()||selectedItem.status==="COMPLETED"} onClick={completeItem}>Mit Nachweis abschließen →</button></div>
        </div>
      </>}
      {selectedItem.completion&&<div className="disposal-proof"><small>ABGESCHLOSSEN</small><b>{selectedItem.completion.reference}</b><span>{money(selectedItem.completion.revenueCents)} Erlös · {money(selectedItem.completion.costCents)} Kosten · Saldo {money(selectedItem.completion.netCents)}</span></div>}
    </div>}

    <div className="partner-registry">
      <div className="partner-registry-head"><div><small>PARTNERNETZWERK</small><h3>Geprüfte Entsorgungs- und Schrottprofile.</h3></div><p>Nur Partner eintragen, deren Abholung, Materialannahme und Einsatzgebiet tatsächlich geprüft wurden. HOME:TWIN behauptet keine Live-Partnerschaft.</p></div>
      <div className="split">
        <div className="partner-cards">{(data.partners||[]).map(p=><article key={p.id}><small>{p.pickupAvailable?"ABHOLUNG MÖGLICH":"ANLIEFERUNG / MANUELL"}</small><h3>{p.name}</h3><p>{(p.routes||[]).map(routeLabel).join(" · ")}</p><p>Gebiet: {(p.servicePostalPrefixes||[]).length?p.servicePostalPrefixes.join(", "):"manuell bestätigen"}</p><p className="micro-copy">{p.evidenceReference}</p></article>)}</div>
        <div className="form"><h3>Partner hinterlegen</h3><label>Name<input value={partnerName} onChange={e=>setPartnerName(e.target.value)}/></label><div className="partner-route-checks">{routes.map(r=><label key={r}><input type="checkbox" checked={partnerRoutes.includes(r)} onChange={e=>setPartnerRoutes(e.target.checked?[...partnerRoutes,r]:partnerRoutes.filter(x=>x!==r))}/>{routeLabel(r)}</label>)}</div><label>Servicegebiet, zweistellige PLZ-Präfixe<input value={partnerPrefixes} onChange={e=>setPartnerPrefixes(e.target.value)} placeholder="z. B. 44, 45, 46, 47"/></label><label className="disposal-check"><input type="checkbox" checked={partnerPickup} onChange={e=>setPartnerPickup(e.target.checked)}/> Abholung bestätigt möglich</label><label>Kontakt / Website<input value={partnerContact} onChange={e=>setPartnerContact(e.target.value)}/></label><label>Prüfnachweis / Quelle<textarea value={partnerEvidence} onChange={e=>setPartnerEvidence(e.target.value)} placeholder="z. B. Ansprechpartner, Angebot, E-Mail oder geprüfte Leistungsseite"/></label><button disabled={!partnerName.trim()||!partnerRoutes.length||!partnerEvidence.trim()} onClick={savePartner}>Geprüften Partner speichern →</button></div>
      </div>
    </div>
  </section>
}
