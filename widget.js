// Widget feed Mariage Sur Mesure — rendu (données injectées via window.FEED)
(function(){
const NETS = {
  instagram:{label:'Instagram', icon:'<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.3" cy="6.7" r="1.2" fill="currentColor"/></svg>'},
  tiktok:{label:'TikTok', icon:'<svg viewBox="0 0 24 24"><path d="M14 3v11.2a3.3 3.3 0 1 1-3.3-3.3" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M14 3c.4 2.6 2.1 4.3 4.8 4.6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>'}
};
const ICON_REEL='<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4.5" fill="none" stroke="#fff" stroke-width="2"/><path d="M10 9.2v5.6l4.8-2.8z" fill="#fff"/></svg>';
const ICON_CARO='<svg viewBox="0 0 24 24"><rect x="7" y="7" width="13" height="13" rx="2.5" fill="none" stroke="#fff" stroke-width="2"/><path d="M4 16V6a2 2 0 0 1 2-2h10" fill="none" stroke="#fff" stroke-width="2"/></svg>';
const fmtDate=d=>{if(!d)return'';const x=new Date(d+'T12:00:00');return x.toLocaleDateString('fr-BE',{day:'numeric',month:'short'})};
const esc=s=>(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const css=`
.msm{--ink:#262626;--mute:#737373;--line:#efefef;--accent:#b08968;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--ink);background:#fff;max-width:420px;margin:0 auto;border:1px solid var(--line);border-radius:14px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.06)}
.msm *{box-sizing:border-box}
.msm-top{display:flex;align-items:center;gap:4px;padding:10px 12px;border-bottom:1px solid var(--line);overflow-x:auto;scrollbar-width:none}
.msm-tab{display:flex;align-items:center;gap:6px;border:0;background:none;padding:7px 10px;border-radius:999px;font:600 12.5px/1 inherit;color:var(--mute);cursor:pointer;white-space:nowrap}
.msm-tab svg{width:16px;height:16px}
.msm-tab.on{background:#f3ece6;color:var(--ink)}
.msm-refresh{margin-left:auto;border:1px solid var(--line);background:#fff;border-radius:8px;padding:6px 10px;font:600 12px/1 inherit;color:var(--ink);cursor:pointer;white-space:nowrap}
.msm-head{display:flex;gap:22px;align-items:center;padding:18px 16px 6px}
.msm-ring{flex:0 0 auto;width:82px;height:82px;border-radius:50%;padding:3px;background:conic-gradient(from 200deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5,#feda75)}
.msm-ring.plain{background:#e7ddd3}
.msm-ava{width:100%;height:100%;border-radius:50%;border:3px solid #fff;object-fit:cover;background:#f3ece6;display:block}
.msm-name{font:600 15px/1.2 inherit;margin:0 0 10px}
.msm-stats{display:flex;gap:18px}
.msm-stats b{display:block;font:700 15px/1.1 inherit}
.msm-stats span{font-size:12px;color:var(--mute)}
.msm-bio{padding:4px 16px 12px;font-size:13px;line-height:1.45;white-space:pre-line}
.msm-bio .t{font-weight:600}
.msm-bio a{color:#00376b;text-decoration:none;font-weight:600}
.msm-icons{display:flex;border-top:1px solid var(--line)}
.msm-icons div{flex:1;display:flex;justify-content:center;padding:9px 0;color:#c7c7c7;border-top:1px solid transparent;margin-top:-1px}
.msm-icons div.on{color:var(--ink);border-top-color:var(--ink)}
.msm-icons svg{width:20px;height:20px}
.msm-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px}
.msm-cell{position:relative;aspect-ratio:1/1;overflow:hidden;background:#f3ece6;display:block}
.msm-cell img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .35s}
.msm-cell:hover img{transform:scale(1.04)}
.msm-badge{position:absolute;top:7px;right:7px;width:18px;height:18px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.45))}
.msm-plan{position:absolute;left:6px;bottom:6px;background:rgba(255,255,255,.92);color:var(--ink);font:600 10.5px/1 inherit;padding:4px 6px;border-radius:6px}
.msm-plan.v{background:#fff3cd}
.msm-views{position:absolute;left:6px;bottom:6px;color:#fff;font:600 11px/1 inherit;text-shadow:0 1px 3px rgba(0,0,0,.6)}
.msm-hover{position:absolute;inset:0;background:rgba(0,0,0,.45);color:#fff;opacity:0;display:flex;align-items:flex-end;padding:8px;font:600 11px/1.3 inherit;transition:opacity .2s}
.msm-cell:hover .msm-hover{opacity:1}
.msm-empty{grid-column:1/-1;padding:38px 20px;text-align:center;color:var(--mute);font-size:13px;line-height:1.5}
.msm-next{position:relative;aspect-ratio:1/1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:#faf7f4;color:#a8998b;font:600 11.5px/1.2 inherit;outline:1.5px dashed #d9cbbd;outline-offset:-7px}
.msm-next b{font-size:22px;font-weight:300;line-height:1}
.msm-sep{grid-column:1/-1;display:flex;align-items:center;gap:8px;padding:7px 10px;font:600 10.5px/1 inherit;letter-spacing:.06em;text-transform:uppercase;color:#a8998b;background:#fff}
.msm-sep::before,.msm-sep::after{content:"";flex:1;height:1px;background:#eadfd4}
.msm-cap{display:flex;justify-content:space-between;padding:8px 12px;font:600 10.5px/1 inherit;letter-spacing:.06em;text-transform:uppercase;color:#a8998b}
.msm-foot{padding:9px 14px;font-size:11px;color:var(--mute);border-top:1px solid var(--line);display:flex;justify-content:space-between}
`;

function render(root, feed, net){
  const p=feed.profiles[net]||{}; const all=feed.posts[net]||[];
  const isPub=x=>/Publi/.test(x.statut||'');
  // 6 cases « à venir » (posts prévus avec image, du plus lointain au plus proche) + 9 derniers publiés
  const next=all.filter(x=>!isPub(x)&&x.img).sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,6);
  const posts=all.filter(isPub).slice(0,9);
  const tabs=Object.keys(NETS).map(k=>`<button class="msm-tab${k===net?' on':''}" data-net="${k}">${NETS[k].icon}${NETS[k].label}</button>`).join('');
  const stats=(p.stats||[]).map(s=>`<div><b>${esc(s[0])}</b><span>${esc(s[1])}</span></div>`).join('');
  function cell(x){
    const badge=/R[ée]el|Vid[ée]o/.test(x.format)?ICON_REEL:(/Carrousel/.test(x.format)?ICON_CARO:'');
    const planned=!isPub(x);
    const tag=planned?`<span class="msm-plan${/valider/.test(x.statut||'')?' v':''}">${/valider/.test(x.statut||'')?'À valider · ':'📅 '}${fmtDate(x.date)}</span>`:(x.vues?`<span class="msm-views">▷ ${esc(x.vues)}</span>`:'');
    return `<a class="msm-cell" href="${esc(x.lien||'#')}" target="_blank" rel="noopener"><img loading="lazy" src="${esc(x.img)}" alt="">${badge?`<span class="msm-badge">${badge}</span>`:''}${tag}<span class="msm-hover">${esc(x.titre)}</span></a>`;
  }
  const nextCells=Array.from({length:6-next.length},()=>'<div class="msm-next"><b>+</b>À venir</div>').join('')+next.map(cell).join('');
  const cells=nextCells+'<div class="msm-sep">Déjà publié</div>'+posts.map(cell).join('');
  root.innerHTML=`<style>${css}</style><div class="msm">
   <div class="msm-top">${tabs}<button class="msm-refresh">↻ Actualiser</button></div>
   <div class="msm-head"><div class="msm-ring${net==='instagram'?'':' plain'}"><img class="msm-ava" src="${esc(feed.avatar)}" alt=""></div>
     <div><p class="msm-name">${esc(p.handle||'mariagesurmesure')}</p><div class="msm-stats">${stats}</div></div></div>
   <div class="msm-bio"><span class="t">${esc(p.title||'')}</span>\n${esc(p.bio||'')}${p.link?`\n<a href="${esc(p.link)}" target="_blank">${esc(p.linkText||p.link)}</a>`:''}</div>
   <div class="msm-icons"><div class="on"><svg viewBox="0 0 24 24"><path d="M3 3h18v18H3zM9 3v18M15 3v18M3 9h18M3 15h18" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></div><div>${ICON_REEL.replace(/#fff/g,'currentColor')}</div><div><svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="3.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M5 20c1.2-3.5 4-5 7-5s5.8 1.5 7 5" fill="none" stroke="currentColor" stroke-width="1.7"/></svg></div></div>
   <div class="msm-cap"><span>Prochaines publications</span><span>${next.length} / 6 prévues</span></div><div class="msm-grid">${cells}</div>
   <div class="msm-foot"><span>${posts.length} publication${posts.length>1?'s':''} affichée${posts.length>1?'s':''} · 3 lignes max</span><span>Mis à jour ${esc(feed.updated||'')}</span></div></div>`;
  root.querySelectorAll('.msm-tab').forEach(b=>b.onclick=()=>{try{localStorage.setItem('msm-net',b.dataset.net)}catch(e){};render(root,feed,b.dataset.net)});
  root.querySelector('.msm-refresh').onclick=()=>location.reload();
}
window.MSMWidget={render};
})();
