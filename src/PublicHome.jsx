import React from"react";

const Icon=({children})=><span className="service-icon" aria-hidden="true">{children}</span>;

function HomeVisual(){
  return <div className="home-visual" aria-hidden="true">
    <div className="visual-glow"/>
    <svg className="house-blueprint" viewBox="0 0 720 520" role="img">
      <defs>
        <linearGradient id="line" x1="0" x2="1"><stop offset="0" stopColor="#2b775f"/><stop offset="1" stopColor="#85d5b6"/></linearGradient>
        <filter id="soft"><feGaussianBlur stdDeviation="12"/></filter>
      </defs>
      <path d="M108 254 360 76l252 178v184H108Z" fill="rgba(255,255,255,.62)" stroke="url(#line)" strokeWidth="2.5"/>
      <path d="M176 438V281h157v157M408 438V292h136v146" fill="none" stroke="#6d9d8b" strokeWidth="2"/>
      <path d="M116 254h489M360 77v361" fill="none" stroke="#b5c9c0" strokeWidth="1.4" strokeDasharray="7 10"/>
      <rect x="208" y="322" width="82" height="116" rx="8" fill="#e6f4ee" stroke="#78b89f"/>
      <rect x="447" y="331" width="62" height="82" rx="8" fill="#f4faf7" stroke="#78b89f"/>
      <circle cx="515" cy="180" r="52" fill="#dcf3e9" opacity=".75"/>
      <path d="M495 180h40M515 160v40" stroke="#2b775f" strokeWidth="3" strokeLinecap="round"/>
      <path d="M275 310c16-44 45-74 85-92 42 20 70 51 84 92" fill="none" stroke="#5ea78b" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="360" cy="217" r="7" fill="#2b775f"/>
      <g opacity=".72"><circle cx="180" cy="122" r="4" fill="#2b775f"/><circle cx="583" cy="131" r="4" fill="#2b775f"/><circle cx="635" cy="337" r="4" fill="#2b775f"/></g>
      <g stroke="#8aada0" strokeWidth="1.3" opacity=".8"><path d="M180 122h88"/><path d="M583 131h-76"/><path d="M635 337h-76"/></g>
    </svg>
    <div className="visual-card vc-one"><span>Wärmepumpe</span><strong>Vaillant System</strong><small>digital vorbereitet</small></div>
    <div className="visual-card vc-two"><span>Projektstatus</span><strong>1 Datenbasis</strong><small>Kunde & Betrieb synchron</small></div>
    <div className="visual-card vc-three"><span>Planung</span><strong>Meistergeführt</strong><small>KI unterstützt</small></div>
  </div>
}

export default function PublicHome({setTab,apiState,savedCount}){
  return <div className="public-home">
    <section className="landing-hero">
      <div className="landing-copy">
        <div className="eyebrow"><span className="pulse-dot"/> Sanitär · Heizung · Wärmepumpe</div>
        <h1>Handwerk, das sich<br/><em>digital anfühlt.</em></h1>
        <p className="hero-copy">Persönlicher Meisterbetrieb trifft auf eine vollständig vernetzte Projektplattform. Von der ersten Idee bis Wartung, Dokumentation und Rechnung bleibt alles in einem klaren Ablauf.</p>
        <div className="landing-actions">
          <button className="primary-cta" onClick={()=>setTab("project")}>Projekt starten <span>→</span></button>
          <button className="secondary-cta" onClick={()=>setTab("catalog")}>Systeme entdecken</button>
        </div>
        <div className="hero-proof">
          <div><strong>Vaillant</strong><span>Heiztechnik</span></div>
          <div><strong>Meisterbetrieb</strong><span>persönlich geführt</span></div>
          <div><strong>{apiState.includes("PostgreSQL")?"Live":"Digital"}</strong><span>Projektplattform</span></div>
        </div>
      </div>
      <HomeVisual/>
    </section>

    <section className="trust-strip">
      <span>Ein Ansprechpartner.</span>
      <span>Eine Projektakte.</span>
      <span>Ein durchgängiger Prozess.</span>
      <span>{savedCount} Produkte vorgemerkt.</span>
    </section>

    <section className="experience-section">
      <div className="section-heading">
        <div><small>RICHTERICH EXPERIENCE</small><h2>Vom ersten Klick bis zum letzten Handgriff.</h2></div>
        <p>Keine lose Kette aus Telefonaten, PDFs und Notizzetteln. Der Kunde sieht, was relevant ist. Der Betrieb arbeitet mit derselben Projektbasis weiter.</p>
      </div>
      <div className="experience-grid">
        <article className="feature-large">
          <span className="feature-index">01</span>
          <Icon>⌂</Icon>
          <h3>Digitaler Haus-Check</h3>
          <p>Wohnfläche, Baujahr, Bestand und gewünschte Lösung werden strukturiert erfasst und direkt zur Projektakte.</p>
          <button className="text-link" onClick={()=>setTab("project")}>Haus-Check öffnen →</button>
        </article>
        <article><span className="feature-index">02</span><Icon>◫</Icon><h3>Produkte mit Kontext</h3><p>Auswahl nicht als anonymer Shop, sondern passend zum konkreten Projekt und bestätigten Daten.</p></article>
        <article><span className="feature-index">03</span><Icon>✦</Icon><h3>KI im Hintergrund</h3><p>Multiagent-Prüfungen unterstützen Planung, Material, Risiko und Kommunikation – die Entscheidung bleibt beim Meister.</p></article>
        <article><span className="feature-index">04</span><Icon>↗</Icon><h3>Status ohne Nachfragen</h3><p>Angebot, Termin, Material, Rechnung und Wartung landen im persönlichen Kundenportal.</p></article>
      </div>
    </section>

    <section className="system-story">
      <div className="story-panel">
        <small>HOME:TWIN</small>
        <h2>Das Projekt lebt digital mit.</h2>
        <p>Jeder Schritt baut auf dem vorherigen auf. Informationen müssen nicht mehrfach eingegeben werden und gehen zwischen Beratung, Bestellung, Montage und Service nicht verloren.</p>
        <div className="story-flow">
          {["Anfrage","Prüfung","Angebot","Material","Termin","Montage","Rechnung","Wartung"].map((x,i)=><div key={x}><span>{String(i+1).padStart(2,"0")}</span><b>{x}</b></div>)}
        </div>
      </div>
      <div className="story-aside">
        <div className="live-chip"><span className="pulse-dot"/> Systemstatus</div>
        <h3>{apiState}</h3>
        <p>Projekt-, Kunden- und Betriebsdaten laufen über ein getrenntes Backend mit PostgreSQL. Die Website ist nicht nur Schaufenster, sondern der Einstieg in den echten Arbeitsprozess.</p>
        <div className="mini-metrics"><div><b>1×</b><span>Daten erfassen</span></div><div><b>360°</b><span>Projektblick</span></div><div><b>0</b><span>KI-Freigaben ohne Meister</span></div></div>
      </div>
    </section>

    <section className="premium-services">
      <div className="section-heading"><div><small>LEISTUNGEN</small><h2>Technik, Bad und Service – verbunden statt getrennt.</h2></div><p>Heiztechnik wird auf Vaillant ausgerichtet. Sanitär, Heizkörper und ergänzende Produkte können projektbezogen aus weiteren passenden Sortimenten kommen.</p></div>
      <div className="service-rail">
        <article><span>01</span><h3>Wärmepumpe & Modernisierung</h3><p>Bestand aufnehmen, technische Prüfung vorbereiten, Angebot und Montage sauber verbinden.</p></article>
        <article><span>02</span><h3>Heizung & Regelung</h3><p>Vaillant-Systeme mit dokumentierter Auswahl, Projektstatus und späterem Service.</p></article>
        <article><span>03</span><h3>Sanitär & Bad</h3><p>Produktauswahl und Projektplanung für Umbau, Austausch und Modernisierung.</p></article>
        <article><span>04</span><h3>Reparatur & Wartung</h3><p>Nach Projektabschluss bleibt die Anlage mit Historie, Wartung und Unterlagen im System.</p></article>
      </div>
    </section>

    <section className="closing-cta">
      <div><small>START IN WENIGEN MINUTEN</small><h2>Ihr Haus. Ihr Projekt. Ein klarer nächster Schritt.</h2></div>
      <button className="primary-cta light" onClick={()=>setTab("project")}>Haus-Check starten <span>→</span></button>
    </section>
  </div>
}
