import React,{useMemo,useState}from"react";
import Shop from"./ShopCore";
import{shopDesignCandidates}from"./shopDesignCandidates";
import"./PremiumShop.css";

const worlds=[
  {id:"waerme",number:"01",title:"Wärme",subtitle:"Vaillant Systeme",categories:["Wärmepumpen","Heizung & Regelung","Speicher"],visual:"heat"},
  {id:"bad",number:"02",title:"Bad",subtitle:"Keramik, Armaturen & Dusche",categories:["Bad & Sanitär","Armaturen","WC & Keramik","Dusche & Badewanne","Badmöbel"],visual:"bath"},
  {id:"wasser",number:"03",title:"Wasser",subtitle:"Installation & Wassertechnik",categories:["Installation","Wassertechnik","Zubehör"],visual:"water"},
  {id:"luft",number:"04",title:"Luft & Energie",subtitle:"Lüftung, Klima & PV",categories:["Lüftung","Klima","Photovoltaik","Elektro & Warmwasser"],visual:"air"}
];

const heroImage="/product-images/vaillant-heatpump-illustration.webp";
const countFor=(products,categories)=>products.filter(p=>categories.includes(p.category)).length;
const candidateGlyph=v=>({basin:"⌒",wc:"◡",tap:"⌁",frame:"▥",storage:"◫",pump:"◉",shower:"╱",drain:"═"}[v]||"◇");

export default function PremiumShop({products=[],api,onProjectCreated}){
  const[world,setWorld]=useState("waerme");
  const active=worlds.find(x=>x.id===world)||worlds[0];
  const heroProduct=useMemo(()=>products.find(p=>/aroTHERM plus/i.test(p.title||""))||products.find(p=>p.category==="Wärmepumpen")||products[0],[products]);
  const liveBrands=new Set(products.map(p=>p.brand).filter(Boolean)).size;
  const partnerProducts=products.filter(p=>p.priceStatus==="partner_required"||p.referenceOnly).length;
  const worldProducts=products.filter(p=>active.categories.includes(p.category)).slice(0,4);
  return <div className="premium-shop">
    <section className="ps-hero">
      <div className="ps-hero-noise" aria-hidden="true"/>
      <div className="ps-hero-copy">
        <span className="ps-kicker">RICHTERICH HOME:TWIN · SHOP 2027</span>
        <h1>Haustechnik,<br/><em>die zum Zuhause passt.</em></h1>
        <p>Ein moderner Fachhandwerker-Shop statt Produktfriedhof: echte Herstellerdaten, klare Lieferstatus und eine Auswahl, die Sanitär, Wärme und Service miteinander verbindet.</p>
        <div className="ps-hero-actions"><a href="#ps-catalog" className="ps-primary">Produkte entdecken <span>↗</span></a><a href="#ps-pilot" className="ps-secondary">Dropshipping-Pilot ansehen</a></div>
        <div className="ps-proof-strip"><span><b>{products.length}</b> Produktfamilien</span><i/><span><b>{liveBrands}</b> Marken im aktuellen Feed</span><i/><span><b>{partnerProducts}</b> Fachpartner-/Referenzartikel</span></div>
      </div>
      <div className="ps-stage" aria-label={heroProduct?.title||"Vaillant Wärmepumpe"}>
        <span className="ps-stage-word">HOME</span><div className="ps-orbit one"/><div className="ps-orbit two"/><div className="ps-plinth"/>
        <img src={heroImage} alt="Vaillant Wärmepumpe – Visualisierung" className="ps-hero-product"/>
        <div className="ps-float-card"><small>FACHHANDWERKER-AUSWAHL</small><strong>{heroProduct?.title||"aroTHERM plus"}</strong><span>{heroProduct?.availability||"Fachpartnerpreis & Verfügbarkeit werden geprüft"}</span><a href="#ps-catalog">Im Katalog ansehen ↗</a></div>
      </div>
    </section>

    <section className="ps-search-story">
      <div><span className="ps-kicker dark">NICHT NUR SUCHEN · PROJEKT DENKEN</span><h2>Was soll zuhause besser werden?</h2></div>
      <div className="ps-intent-grid">
        <button onClick={()=>{setWorld("waerme");document.getElementById("ps-worlds")?.scrollIntoView({behavior:"smooth"})}}><span>01</span><b>Heizung modernisieren</b><small>Wärmepumpe · Speicher · Regelung</small></button>
        <button onClick={()=>{setWorld("bad");document.getElementById("ps-worlds")?.scrollIntoView({behavior:"smooth"})}}><span>02</span><b>Bad neu gestalten</b><small>Keramik · Armaturen · Dusche</small></button>
        <button onClick={()=>{setWorld("wasser");document.getElementById("ps-worlds")?.scrollIntoView({behavior:"smooth"})}}><span>03</span><b>Installation verbessern</b><small>Vorwand · Wasser · Zubehör</small></button>
      </div>
    </section>

    <section id="ps-worlds" className="ps-worlds">
      <div className="ps-section-head"><div><span className="ps-kicker dark">PRODUKTWELTEN</span><h2>Weniger Katalog.<br/>Mehr Orientierung.</h2></div><p>Die Struktur übernimmt das starke Editorial-Prinzip aus Commerce Agent OS: Produktwelten zuerst, lange Listen erst danach.</p></div>
      <div className="ps-world-grid">{worlds.map(w=><button key={w.id} className={world===w.id?"active":""} onClick={()=>setWorld(w.id)} aria-pressed={world===w.id}>
        <span className="ps-world-number">{w.number}</span><div className={"ps-world-art "+w.visual}><i/><i/><b>{w.title.slice(0,1)}</b></div><div className="ps-world-label"><strong>{w.title}</strong><small>{w.subtitle}</small></div><span className="ps-world-count">{countFor(products,w.categories)}</span>
      </button>)}</div>
      <div className="ps-world-shelf"><div className="ps-world-shelf-head"><div><small>{active.number} · {active.title.toUpperCase()}</small><h3>{active.subtitle}</h3></div><a href="#ps-catalog">Vollständigen Katalog öffnen ↘</a></div>
        <div className="ps-mini-grid">{worldProducts.length?worldProducts.map((p,i)=><article key={p.id}><div className="ps-mini-art"><span>{String(i+1).padStart(2,"0")}</span><b>{(p.brand||"R").slice(0,2).toUpperCase()}</b></div><small>{p.category} · {p.brand}</small><h4>{p.title}</h4><p>{p.availability}</p></article>):<article className="ps-mini-empty"><b>Diese Produktwelt wartet auf den Lieferantenfeed.</b><p>Keine erfundenen Artikel oder Preise.</p></article>}</div>
      </div>
    </section>

    <section id="ps-pilot" className="ps-pilot">
      <div className="ps-section-head"><div><span className="ps-kicker">DROPSHIPPING-PILOT · DESIGNVORSCHLAG</span><h2>Artikel, die sich für einen ersten Direktversand-Pilot anbieten.</h2></div><p>Die Produkte sind aktuell im Elmer-Umfeld belegt. <b>Direktversand an Endkunden ist noch nicht als live bestätigt</b> und bleibt deshalb im Shop gesperrt.</p></div>
      <div className="ps-pilot-grid">{shopDesignCandidates.map((p,i)=><article key={p.id}>
        <div className={"ps-candidate-art c"+(i%4)}><span>{p.mark}</span><div className="ps-candidate-glyph">{candidateGlyph(p.visual)}</div><small>{p.world}</small></div>
        <div className="ps-candidate-copy"><small>{p.category} · {p.brand}</small><h3>{p.title}</h3><div className="ps-facts">{p.facts.map(f=><span key={f}>{f}</span>)}</div><div className="ps-source-state"><b>{p.supplierState}</b><span>{p.fulfillmentState}</span></div><a href={p.sourceUrl} target="_blank" rel="noreferrer">Elmer-Quelle prüfen ↗</a></div>
      </article>)}</div>
      <div className="ps-pilot-note"><span>WICHTIG</span><p>Diese Karten sind bewusst <b>keine kaufbaren Shopartikel</b>. Sobald Elmer Direktlieferung, konkrete Artikelnummer, Preis, Lieferzeit und Medienrechte bestätigt, kann derselbe Platz automatisch zu einem echten Produktangebot werden.</p></div>
    </section>

    <section className="ps-editorial">
      <div className="ps-editorial-art"><div className="ps-big-ring"/><img src="/product-images/vaillant-storage-illustration.webp" alt="Speicher – Visualisierung"/><span>PLAN /<br/>BUILD</span></div>
      <div className="ps-editorial-copy"><span className="ps-kicker dark">SHOP + MEISTERBETRIEB</span><h2>Nicht nur liefern.<br/><em>Passend einplanen.</em></h2><p>Der Shop kann später Produktverkauf, Baustellenlieferung und Montageprojekt zusammenführen. Heiztechnik bleibt Vaillant. Sanitärprodukte können über bestätigte Fachhandelspartner ergänzt werden.</p><a href="#ps-catalog" className="ps-primary dark">Zum Fachkatalog <span>↘</span></a></div>
    </section>

    <section id="ps-catalog" className="ps-live-catalog"><div className="ps-section-head"><div><span className="ps-kicker dark">VERBUNDENER KATALOG</span><h2>Jetzt Produkte prüfen.</h2></div><p>Nur Produkte aus dem bestehenden HOME:TWIN-Katalog können in die Anfrage übernommen werden. Preise und Lieferfähigkeit bleiben serverseitig abgesichert.</p></div><Shop products={products} api={api} onProjectCreated={onProjectCreated}/></section>
  </div>
}
