// GitHub Pages review only: fictional catalogue, no CRM requests and no submissions.
(async () => {
  const form = document.querySelector('form.pha-search');
  if (!form) return;
  const base = form.action.split('/available-properties/')[0];
  const results = document.querySelector('.pha-results');
  const count = results.querySelector('.pha-count');
  const grid = results.querySelector('.pha-grid');
  const paging = results.querySelector('.pha-pagination') || results.appendChild(document.createElement('nav'));
  paging.className='pha-pagination';paging.setAttribute('aria-label','Property results pages');
  const notice=document.createElement('p');notice.setAttribute('role','status');grid.before(notice);
  const controls=[...form.elements].filter(e=>e.name);
  const render = records => {
    const params=new URLSearchParams(location.search);
    controls.forEach(el=>{el.value=params.get(el.name)??({units:'sqft',sort:'name'}[el.name]||'');});
    const f=Object.fromEntries(controls.map(el=>[el.name,el.value]));
    form.querySelector('details').open=['min_size','max_size','min_rent','max_rent'].some(k=>f[k]!=='')||f.units==='sqm'||f.sort!=='name';
    let error='';
    for(const k of ['min_size','max_size','min_rent','max_rent']) if(f[k]!==''&&(!Number.isFinite(Number(f[k]))||Number(f[k])<0))error='Please enter valid size and rent values.';
    for(const k of ['size','rent'])if(f['min_'+k]!==''&&f['max_'+k]!==''&&Number(f['min_'+k])>Number(f['max_'+k]))error='Minimum '+k+' must not exceed maximum '+k+'.';
    const q=f.location.trim().toLowerCase();
    let rows=records.filter(r=>{
      if(q&&!`${r.town} ${r.address}`.toLowerCase().includes(q)&&!r.postcode.toLowerCase().replace(/ /g,'').startsWith(q.replace(/ /g,'')))return false;
      if(f.kind&&f.kind!==r.type)return false;
      for(const k of ['size','rent']){
        const factor=k==='size'&&f.units==='sqm'?10.76391041671:1;
        if((f['min_'+k]!==''||f['max_'+k]!=='')&&r[k+'_min']===null)return false;
        if(f['min_'+k]!==''&&r[k+'_max']<Number(f['min_'+k])*factor)return false;
        if(f['max_'+k]!==''&&r[k+'_min']>Number(f['max_'+k])*factor)return false;
      }return true;
    });
    rows.sort((a,b)=>{
      if(f.sort!=='name'){
        const [key,direction]=f.sort.split('_'),av=a[key+'_min'],bv=b[key+'_min'];
        if(av===null&&bv!==null)return 1;if(bv===null&&av!==null)return -1;
        if(av!==bv)return (av-bv)*(direction==='desc'?-1:1);
      }return a.title.localeCompare(b.title)||a.id.localeCompare(b.id);
    });
    const pages=Math.ceil(rows.length/12),page=Math.max(1,Math.min(pages||1,Number.parseInt(params.get('pg'),10)||1));
    count.textContent=error?'Check your filters':`${rows.length} ${rows.length===1?'property':'properties'}`;
    notice.textContent=error||(!rows.length?'No properties match your search. Try another location or clear your filters.':'');
    grid.replaceChildren();paging.replaceChildren();
    if(error)return;
    for(const r of rows.slice((page-1)*12,page*12)){
      const template=document.createElement('template');template.innerHTML=r.html;grid.append(template.content.cloneNode(true));
    }
    for(let n=1;n<=pages;n++){
      const link=document.createElement('a'),query=new URLSearchParams(params);query.set('pg',n);
      link.href='?'+query+'#availability-results';link.textContent=n;if(n===page)link.setAttribute('aria-current','page');paging.append(link);
    }
  };
  try {
    const response=await fetch(base+'/demo-catalogue.json');if(!response.ok)throw Error('unavailable');
    const records=await response.json();render(records);
  } catch {
    notice.textContent='The demonstration search could not load. Please reload this page.';
    form.addEventListener('submit',e=>{e.preventDefault();notice.scrollIntoView();});
  }
})();
