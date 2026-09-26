import React,{useMemo,useState}from"react";
import Shop from"./ShopCore";
import{shopDesignCandidates}from"./shopDesignCandidates";
import{shopWorlds,shopIntents,worldProducts as productsForWorld}from"./shopWorlds";
import"./PremiumShop.css";
import"./ShopWorlds.css";

const heroImage="/product-images/vaillant-heatpump-illustration.webp";
const candidateGlyph=v=>({basin:"⌒",wc:"◡",tap:"⌁",frame:"▥",storage:"◫",pump:"◉",shower:"╱",drain:"═"}[v]||"◇");
const worldGlyph=v=>({heat:"↟",bath:"◡",water:"≈",air:"≋",energy:"⌁",service:"＋",project:"□",reuse:"↻"}[v]||"◇");

export default function PremiumShop({products=[],api,onProjectCreated}){
  const[worldId,setWorldId]=useState("heiztechnik");
  const[subId,setSubId]=useState(null);
  const[catalogScope,setCatalogScope]=useState(null);
  const active=shopWorlds.find(x=>x.id===worldId)||shopWorlds[0];
  const activeSub=subId?active.subcategories.find(x=>x.id===subId):null;
  const heroProduct=useMemo(()=>products.find(p=>/aroTHERM plus/i.test(p.title||""))||products.find(p=>p.category==="Wärmepumpen")||products[0],[products]);
  const liveBrands=new Set(products.map(p=>p.brand).filter(Boolean)).size;
  const partnerProducts=products.filter(p=>p.priceStatus==="partner_required"||p.referenceOnly).length;
  const currentProducts=productsForWorld(products,active,subId);
  const shelfProducts=currentProducts.slice(0,4);
  const scopedWorld=catalogScope?shopWorlds.find(x=>x.id===catalogScope.worldId):null;
  const catalogProducts=catalogScope&&scopedWorld?productsForWorld(products,scopedWorld,catalogScope.subId):products;
  const catalogSub=catalogScope?.subId&&scopedWorld?scopedWorld.subcategories.find(x=>x.id===catalogScope.subId):null;
  const catalogLabel=catalogScope&&scopedWorld?(catalogSub?.label||scopedWorld.title):"Alle Produktwelten";

  function selectWorld(id,sub=null,scroll=true){
    setWorldId(id);setSubId(sub);
    if(scroll)setTimeout(()=>document.getElementById("ps-worlds")?.scrollIntoView({behavior:"smooth",block:"start"}),0);
  }
  function openCatalog(world=active,sub=subId){
    setCatalogScope({worldId:world.id,subId:sub||null});
    setTimeout(()=>document.getElementById("ps-catalog")?.scrollIntoView({behavior:"smooth",block:"start"}),0);
  }

  return <div className="premium-shop">
    <section className="ps-hero">
      <div className="ps-hero-noise" aria-hidden="true"/>
      <div className="ps-hero-copy">
        <span className="ps-kicker">RICHTERICH HOME:TWIN · SHOP 2027</span>
        <h1>Haustechnik,<br/><em>nach Lebensbereich gedacht.</em></h1>
        <p>Nicht ein endloser SHK-Katalog, sondern acht klare Produktwelten: Heiztechnik, Bad, Installation, Raumklima, Energie, Service, Komplettlösungen und Recommerce.</p>
        <div className="ps-hero-actions"><a href="#ps-worlds" className="ps-primary">Produktwelten entdecken <span>↘</span></a><a href="#ps-pilot" className="ps-secondary">Dropshipping-Pilot</a></div>
        <div className="ps-proof-strip"><span><b>{products.length}</b> Produktfamilien</span><i/><span><b>{liveBrands}</b> Marken im aktuellen Feed</span><i/><span><b>{partnerProducts}</b> Fachpartner-/Referenzartikel</span></div>
      </div>
      <div className="ps-stage" aria-label={heroProduct?.title||"Vaillant Wärmepumpe"}>
        <span className="ps-stage-word">HOME</span><div className="ps-orbit one"/><div className="ps-orbit two"/><div className="ps-plinth"/>
        <img src={heroImage} alt="Vaillant Wärmepumpe – Visualisierung" className="ps-hero-product"/>
        <div className="ps-float-card"><small>HEIZTECHNIK · VAILLANT</small><strong>{heroProduct?.title||"aroTHERM plus"}</strong><span>{heroProduct?.availability||"Fachpartnerpreis & Verfügbarkeit werden geprüft"}</span><button onClick={()=>openCatalog(shopWorlds[0],"waermepumpen")}>Wärmepumpen ansehen ↗</button></div>
      </div>
    </section>

    <section className="ps-search-story">
      <div><span className="ps-kicker dark">NICHT NUR SUCHEN · VORHABEN STARTEN</span><h2>Was möchten Sie zuhause verändern?</h2></div>
      <div className="ps-intent-grid ps-intent-grid-wide">{shopIntents.map(intent=><button key={intent.id} onClick={()=>selectWorld(intent.world,intent.sub||null)}><span>{intent.number}</span><b>{intent.title}</b><small>{intent.subtitle}</small></button>)}</div>
    </section>

    <section id="ps-worlds" className="ps-worlds">
      <div className="ps-section-head"><div><span className="ps-kicker dark">8 PRODUKTWELTEN</span><h2>Vom Heizraum<br/>bis ins Badezimmer.</h2></div><p>Die Navigation folgt dem Kundenproblem und dem realen SHK-Arbeitsablauf. Tiefe Kategorien erscheinen erst innerhalb der gewählten Welt.</p></div>
      <div className="ps-world-grid ps-world-grid-eight">{shopWorlds.map(w=>{
        const count=productsForWorld(products,w).length;
        return <button key={w.id} className={(worldId===w.id?"active ":"")+"world-"+w.accent} onClick={()=>selectWorld(w.id,null,false)} aria-pressed={worldId===w.id}>
          <span className="ps-world-number">{w.number}</span><div className={"ps-world-art "+w.visual}><i/><i/><b>{worldGlyph(w.visual)}</b></div><div className="ps-world-label"><small>{w.eyebrow}</small><strong>{w.title}</strong><span>{w.subtitle}</span></div><span className="ps-world-count">{count}</span>
        </button>})}</div>

      <div className="ps-world-shelf">
        <div className="ps-world-shelf-head"><div><small>{active.number} · {active.eyebrow}</small><h3>{active.title}</h3><p>{active.promise}</p></div><button onClick={()=>openCatalog(active,subId)}>Im Fachkatalog öffnen ↘</button></div>
        <div className="ps-subnav"><button className={!subId?"active":""} onClick={()=>setSubId(null)}>Alles in {active.shortTitle}</button>{active.subcategories.map(s=><button key={s.id} className={subId===s.id?"active":""} onClick={()=>setSubId(s.id)}>{s.label}<span>{productsForWorld(products,active,s.id).length}</span></button>)}</div>
        <div className="ps-mini-grid">{shelfProducts.length?shelfProducts.map((p,i)=><article key={p.id}><div className="ps-mini-art"><span>{String(i+1).padStart(2,"0")}</span><b>{(p.brand||"R").slice(0,2).toUpperCase()}</b></div><small>{p.category} · {p.brand}</small><h4>{p.title}</h4><p>{p.availability}</p></article>):<article className="ps-mini-empty"><b>{activeSub?.label||active.title} ist als Shopbereich vorbereitet.</b><p>Aktuell liegt dafür noch kein freigegebener Lieferantenartikel im HOME:TWIN-Katalog. Es werden keine Produkte, Preise oder Verfügbarkeiten erfunden.</p></article>}</div>
      </div>
    </section>

    <section className="ps-solutions">
      <div className="ps-section-head"><div><span className="ps-kicker dark">KOMPLETTLÖSUNGEN</span><h2>Nicht nur Artikel kaufen.<br/>Ein Projekt starten.</h2></div><p>Die stärkste Abgrenzung zum klassischen Onlineshop: Produkte können später direkt in Förderung, Planung, Termin und Montage übergehen.</p></div>
      <div className="ps-solution-grid">
        <button onClick={()=>selectWorld("komplett","wp-paket")}><span>01</span><small>HEIZUNG</small><h3>Wärmepumpen-Komplettpaket</h3><p>Vaillant-System auswählen, Fördercheck vorbereiten und Montage als Projekt anfragen.</p><b>System konfigurieren ↗</b></button>
        <button onClick={()=>selectWorld("komplett","bad-komplett")}><span>02</span><small>BAD</small><h3>Komplettbad</h3><p>Keramik, Armaturen, Dusche und Möbel in einer zusammenhängenden Badplanung.</p><b>Bad zusammenstellen ↗</b></button>
        <button onClick={()=>selectWorld("komplett","gaeste-wc")}><span>03</span><small>SANITÄR</small><h3>Gäste-WC modernisieren</h3><p>Kompakte Produktauswahl mit anschließender Montageanfrage statt Einzelteil-Chaos.</p><b>Projekt öffnen ↗</b></button>
        <button onClick={()=>selectWorld("klima","lueftung")}><span>04</span><small>RAUMKLIMA</small><h3>Lüftung & Klima</h3><p>Komponenten nach Raum- und Systembedarf auswählen und fachlich einplanen lassen.</p><b>Raumklima planen ↗</b></button>
      </div>
    </section>

    <section id="ps-pilot" className="ps-pilot">
      <div className="ps-section-head"><div><span className="ps-kicker">DROPSHIPPING-PILOT · DESIGNVORSCHLAG</span><h2>Geeignete Kandidaten für den ersten Direktversand-Pilot.</h2></div><p>Die Produkte sind als Design- und Sortimentskandidaten hinterlegt. <b>Direktversand an Endkunden bleibt gesperrt</b>, bis Lieferfähigkeit, Artikelnummer, Preis und Medienrechte bestätigt sind.</p></div>
      <div className="ps-pilot-grid">{shopDesignCandidates.map((p,i)=><article key={p.id}>
        <div className={"ps-candidate-art c"+(i%4)} style={p.imageUrl?{background:"#f5f5f2"}:undefined}>{p.imageUrl?<img src={p.imageUrl} alt={p.title} loading="lazy" style={{width:"100%",height:"100%",objectFit:"contain",padding:"12px",display:"block"}}/>:<div className="ps-candidate-glyph">{candidateGlyph(p.visual)}</div>}<span style={{zIndex:2}}>{p.mark}</span><small style={{zIndex:2,background:p.imageUrl?"#f5f5f2dd":"transparent",padding:p.imageUrl?"4px 6px":0,borderRadius:p.imageUrl?"999px":0}}>{p.world}</small></div>
        <div className="ps-candidate-copy"><small>{p.category} · {p.brand}</small><h3>{p.title}</h3><div className="ps-facts">{p.facts.map(f=><span key={f}>{f}</span>)}</div><div className="ps-source-state"><b>{p.supplierState}</b><span>{p.fulfillmentState}</span></div><a href={p.sourceUrl} target="_blank" rel="noreferrer">Quelle prüfen ↗</a></div>
      </article>)}</div>
      <div className="ps-pilot-note"><span>FREIGABE-GATE</span><p>Aus einer Pilotkarte wird erst dann ein kaufbarer Artikel, wenn konkrete Artikelidentität, Preis, Lieferfähigkeit, Direktversand und Produktmedien belastbar bestätigt sind.</p></div>
    </section>

    <section className="ps-editorial">
      <div className="ps-editorial-art"><div className="ps-big-ring"/><img src="/product-images/vaillant-storage-illustration.webp" alt="Speicher – Visualisierung"/><span>PLAN /<br/>BUILD</span></div>
      <div className="ps-editorial-copy"><span className="ps-kicker dark">SHOP + MEISTERBETRIEB</span><h2>Vom Produkt<br/><em>direkt ins Projekt.</em></h2><p>Heiztechnik bleibt Vaillant. Bad und Installation können mit bestätigten Fachhandelsartikeln wachsen. HOME:TWIN verbindet Auswahl, Kundenprojekt, Planung, Montage, Wartung und später Recommerce.</p><button className="ps-primary dark" onClick={()=>{setCatalogScope(null);document.getElementById("ps-catalog")?.scrollIntoView({behavior:"smooth"})}}>Gesamten Fachkatalog öffnen <span>↘</span></button></div>
    </section>

    <section id="ps-catalog" className="ps-live-catalog">
      <div className="ps-section-head ps-catalog-head"><div><span className="ps-kicker dark">VERBUNDENER KATALOG · {catalogLabel.toUpperCase()}</span><h2>{catalogScope?catalogLabel:"Alle freigegebenen Produkte"}</h2></div><div className="ps-catalog-actions"><p>Nur bestehende HOME:TWIN-Katalogdaten können in eine Anfrage übernommen werden. Preise und Lieferfähigkeit bleiben serverseitig abgesichert.</p>{catalogScope&&<button onClick={()=>setCatalogScope(null)}>Alle Produktwelten anzeigen</button>}</div></div>
      <Shop products={catalogProducts} api={api} onProjectCreated={onProjectCreated}/>
    </section>
  </div>
}
