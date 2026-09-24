import React,{useMemo,useState}from"react";

const money=cents=>cents==null?null:(Number(cents)/100).toLocaleString("de-DE",{style:"currency",currency:"EUR"});
const priceLabel=t=>({sale_price:"Verkaufspreis",uvp:"UVP",reference:"Referenzpreis",partner_required:"Fachpartnerpreis"}[t]||"Preis");
const plannedBrands=["Vaillant","Geberit","GROHE","hansgrohe","Duravit","sanibel","comfort by sanibel"];

export default function Shop({products=[],api,onProjectCreated}){
  const[q,setQ]=useState(""),[category,setCategory]=useState("Alle"),[brand,setBrand]=useState("Alle"),[sort,setSort]=useState("featured"),
  [cart,setCart]=useState(()=>{try{return JSON.parse(localStorage.getItem("richterich-shop-cart")||"[]")}catch{return []}}),
  [detail,setDetail]=useState(null),[checkout,setCheckout]=useState(false),[name,setName]=useState(""),[email,setEmail]=useState(""),
  [phone,setPhone]=useState(""),[postalCode,setPostalCode]=useState(""),[privacy,setPrivacy]=useState(false),[note,setNote]=useState(""),
  [sending,setSending]=useState(false),[error,setError]=useState(""),[done,setDone]=useState(null);

  const categories=["Alle",...new Set(products.map(p=>p.category).filter(Boolean))];
  const brands=["Alle",...new Set(products.map(p=>p.brand).filter(Boolean))];
  const visible=useMemo(()=>{
    const query=q.trim().toLowerCase();
    const list=products.filter(p=>(category==="Alle"||p.category===category)&&(brand==="Alle"||p.brand===brand)&&(!query||((p.title||"")+" "+(p.brand||"")+" "+(p.sku||"")+" "+(p.manufacturerNumber||"")).toLowerCase().includes(query)));
    return [...list].sort((a,b)=>{
      if(sort==="priceUp")return (a.priceGrossCents??Number.MAX_SAFE_INTEGER)-(b.priceGrossCents??Number.MAX_SAFE_INTEGER);
      if(sort==="priceDown")return (b.priceGrossCents??-1)-(a.priceGrossCents??-1);
      if(sort==="brand")return String(a.brand).localeCompare(String(b.brand),"de");
      return Number(b.featured===true)-Number(a.featured===true)||String(a.title).localeCompare(String(b.title),"de");
    });
  },[products,q,category,brand,sort]);

  const cartLines=cart.map(line=>({line,product:products.find(p=>p.id===line.id)})).filter(x=>x.product);
  const pricedLines=cartLines.filter(x=>x.product.priceGrossCents!=null),hasUnpriced=pricedLines.length!==cartLines.length,total=pricedLines.reduce((sum,x)=>sum+x.product.priceGrossCents*x.line.quantity,0);

  function persist(next){setCart(next);localStorage.setItem("richterich-shop-cart",JSON.stringify(next))}
  function add(p){const old=cart.find(x=>x.id===p.id);persist(old?cart.map(x=>x.id===p.id?{...x,quantity:Math.min(99,x.quantity+1)}:x):[...cart,{id:p.id,quantity:1}])}
  function qty(id,n){if(n<=0)return persist(cart.filter(x=>x.id!==id));persist(cart.map(x=>x.id===id?{...x,quantity:Math.min(99,n)}:x))}
  async function submit(){
    setError("");setSending(true);
    try{
      if(!cartLines.length)throw new Error("Der Warenkorb ist leer.");
      const body={name,email,phone,postalCode,privacy,kind:"Produktanfrage",description:note.trim()||"Online-Shop Anfrage",source:"richterich-shop",cart:cartLines.map(x=>({id:x.product.id,quantity:x.line.quantity}))};
      const r=await api("/shk/leads",{method:"POST",headers:{"Content-Type":"application/json","Idempotency-Key":crypto.randomUUID()},body:JSON.stringify(body)});
      setDone(r);persist([]);setCheckout(false);if(onProjectCreated)onProjectCreated(r);
    }catch(e){setError(e.message)}finally{setSending(false)}
  }

  if(done)return <section className="shop-shell"><div className="shop-success"><div className="success-icon">✓</div><small>SHOP-ANFRAGE ANGELEGT</small><h2>Ihre Auswahl ist im Projekt.</h2><p>Projekt-ID: <b>{done.id}</b></p><p>Preis und Lieferfähigkeit werden vor einem verbindlichen Auftrag nochmals geprüft. Den Status sehen Sie anschließend unter „Mein Projekt“.</p></div></section>;

  return <section className="shop-shell">
    <div className="shop-hero">
      <div><small>RICHTERICH SHOP · ORIGINAL MARKENPRODUKTE</small><h2>Sanitär & Haustechnik.<br/><em>Mit echten Produktdaten.</em></h2><p>Originalprodukte, aktuelle Preise, Bilder und Verfügbarkeit werden aus bestätigten Lieferanten- und Herstellerdaten übernommen. Heiztechnik bleibt konsequent auf Vaillant ausgerichtet.</p></div>
      <div className="shop-stat">
        <div><span>Live-Artikel</span><b>{products.length}</b></div>
        <div><span>Marken</span><b>{new Set(products.map(p=>p.brand)).size}</b></div>
        <div><span>Warenkorb</span><b>{cart.reduce((n,x)=>n+x.quantity,0)}</b></div>
      </div>
    </div>

    {products.length===0?<div className="shop-empty">
      <div><small>LIEFERANTENFEED WIRD VORBEREITET</small><h3>Der Shop ist gebaut – jetzt fehlt nur noch der echte Elmer-Datenstrom.</h3><p>Damit hier keine erfundenen Preise oder fremde Bilder erscheinen, bleibt der Produktbereich leer, bis Elmer Open Masterdata/IDS oder ein bestätigter Herstellerfeed verbunden ist.</p></div>
      <div className="brand-cloud">{plannedBrands.map(x=><span key={x}>{x}</span>)}</div>
      <div className="shop-empty-steps"><div><b>1</b><span>Elmer unter „Werkzeuge“ verbinden</span></div><div><b>2</b><span>Preise, Bilder & Verfügbarkeit abrufen</span></div><div><b>3</b><span>Freigegebene Artikel automatisch im Shop zeigen</span></div></div>
    </div>:<>
      <div className="brand-row">{brands.slice(1).map(x=><button key={x} className={brand===x?"active":""} onClick={()=>setBrand(brand===x?"Alle":x)}>{x}</button>)}</div>
      <div className="shop-toolbar">
        <label className="shop-search"><span>⌕</span><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Produkt, Marke oder Artikelnummer"/></label>
        <select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(x=><option key={x}>{x}</option>)}</select>
        <select value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">Empfohlen</option><option value="priceUp">Preis aufsteigend</option><option value="priceDown">Preis absteigend</option><option value="brand">Marke</option></select>
        <button className="cart-button" onClick={()=>setCheckout(true)}>Warenkorb <span>{cart.reduce((n,x)=>n+x.quantity,0)}</span></button>
      </div>

      <div className="shop-grid">{visible.map(p=><article key={p.id} className="shop-card">
        <button className="shop-image" onClick={()=>setDetail(p)} aria-label={(p.title||"Produkt")+" öffnen"}>
          {p.imageUrl?<img src={p.imageUrl} alt={p.title} loading="lazy"/>:<div className="image-missing"><b>{p.brand?.slice(0,1)||"R"}</b><span>Originalbild folgt aus Lieferantenfeed</span></div>}
          {p.badge&&<span className="product-badge">{p.badge}</span>}
        </button>
        <div className="shop-card-copy"><small>{p.category} · {p.brand}</small><h3>{p.title}</h3><p className="sku">{p.manufacturerNumber||p.sku}</p>
          <div className="price-line"><div><span>{priceLabel(p.priceType)}</span><strong>{money(p.priceGrossCents)||"auf Anfrage"}</strong></div><span className={p.priceStatus==="confirmed"?"price-ok":"price-warn"}>{p.priceStatus==="confirmed"?"aktuell geprüft":p.priceStatus==="partner_required"?"Fachpartnerpreis":"erneut prüfen"}</span></div>
          <div className="delivery-line"><span>{p.availability}</span>{p.leadTimeDays!=null&&<span>{p.leadTimeDays===0?"sofort":"ca. "+p.leadTimeDays+" Tage"}</span>}</div>
          <div className="shop-actions"><button className="ghost-light" onClick={()=>setDetail(p)}>Details</button><button onClick={()=>add(p)}>In den Warenkorb</button></div>
          <p className="source-note">{p.sourceLabel||p.supplier}{p.priceCheckedAt?" · Preisstand "+new Date(p.priceCheckedAt).toLocaleDateString("de-DE"):p.sourceCheckedAt?" · Portfolio geprüft "+new Date(p.sourceCheckedAt).toLocaleDateString("de-DE"):""}</p>
        </div>
      </article>)}</div>
    </>}

    {detail&&<div className="modal-backdrop" onClick={()=>setDetail(null)}><div className="product-modal" onClick={e=>e.stopPropagation()}>
      <button className="modal-close" onClick={()=>setDetail(null)}>×</button>
      <div className="product-modal-media">{detail.imageUrl?<img src={detail.imageUrl} alt={detail.title}/>:<div className="image-missing large"><b>{detail.brand?.slice(0,1)}</b></div>}</div>
      <div className="product-modal-copy"><small>{detail.category} · {detail.brand}</small><h2>{detail.title}</h2><p>{detail.description}</p>
        <div className="detail-price"><span>{priceLabel(detail.priceType)}</span><strong>{money(detail.priceGrossCents)||"auf Anfrage"}</strong></div>
        <div className="detail-facts"><div><span>Verfügbarkeit</span><b>{detail.availability}</b></div><div><span>Lieferant</span><b>{detail.supplier}</b></div>{detail.manufacturerNumber&&<div><span>Hersteller-Nr.</span><b>{detail.manufacturerNumber}</b></div>}{detail.ean&&<div><span>EAN/GTIN</span><b>{detail.ean}</b></div>}</div>
        {detail.specs?.length>0&&<div className="spec-list">{detail.specs.map((s,i)=><div key={i}><span>{s.label}</span><b>{s.value}</b></div>)}</div>}
        <div className="detail-actions"><button className="primary-cta" onClick={()=>{add(detail);setDetail(null)}}>In den Warenkorb →</button>{detail.sourceUrl&&<a className="official-link" href={detail.sourceUrl} target="_blank" rel="noreferrer">Offizielle Vaillant Quelle ↗</a>}</div>
        <p className="source-note">Datenquelle: {detail.sourceLabel||detail.supplier}. {detail.priceCheckedAt?"Preisstand: "+new Date(detail.priceCheckedAt).toLocaleString("de-DE")+".":detail.sourceCheckedAt?"Portfolio geprüft: "+new Date(detail.sourceCheckedAt).toLocaleDateString("de-DE")+". Preis wird im Fachpartnerprozess ermittelt.":"Preis noch nicht angegeben."}</p>
      </div>
    </div></div>}

    {checkout&&<div className="modal-backdrop" onClick={()=>setCheckout(false)}><div className="cart-drawer" onClick={e=>e.stopPropagation()}>
      <div className="cart-head"><div><small>WARENKORB</small><h3>{cartLines.length} Positionen</h3></div><button className="modal-close inline" onClick={()=>setCheckout(false)}>×</button></div>
      <div className="cart-lines">{cartLines.length?cartLines.map(({product,line})=><div className="cart-line" key={product.id}>
        <div className="cart-thumb">{product.imageUrl?<img src={product.imageUrl} alt=""/>:<b>{product.brand?.slice(0,1)}</b>}</div>
        <div><strong>{product.title}</strong><span>{product.brand} · {money(product.priceGrossCents)||"Preis auf Anfrage"}</span></div>
        <div className="qty"><button onClick={()=>qty(product.id,line.quantity-1)}>−</button><span>{line.quantity}</span><button onClick={()=>qty(product.id,line.quantity+1)}>+</button></div>
      </div>):<p>Ihr Warenkorb ist leer.</p>}</div>
      {cartLines.length>0&&<><div className="cart-total"><span>{hasUnpriced?"Bisher bepreiste Positionen":"Zwischensumme"}</span><strong>{pricedLines.length?money(total):"noch offen"}</strong></div><p className="cart-hint">{hasUnpriced?"Mindestens eine Vaillant-Position benötigt noch den persönlichen Fachpartnerpreis. ":""}Endpreis, Versand und Lieferfähigkeit werden vor dem verbindlichen Auftrag nochmals bestätigt.</p>
      <div className="checkout-form"><label>Name<input value={name} onChange={e=>setName(e.target.value)}/></label><label>E-Mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Telefon<input value={phone} onChange={e=>setPhone(e.target.value)}/></label><label>PLZ<input inputMode="numeric" value={postalCode} onChange={e=>setPostalCode(e.target.value)}/></label><label className="full">Hinweis<textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Lieferung, Abholung, Montagewunsch …"/></label><label className="check full"><input type="checkbox" checked={privacy} onChange={e=>setPrivacy(e.target.checked)}/> Datenschutzhinweis bestätigt</label>{error&&<p className="note full">{error}</p>}<button className="full" disabled={sending} onClick={submit}>{sending?"Wird übertragen…":"Auswahl verbindlich zur Prüfung senden →"}</button></div></>}
    </div></div>}
  </section>
}
