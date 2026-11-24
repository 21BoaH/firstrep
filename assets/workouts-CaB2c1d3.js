import{a as e,c as t,i as n,l as r,o as i,r as a,s as o,t as s,u as c}from"./preload-helper-BJIQ2mX1.js";var l=`firstrep.training.v1`,ee=1,u=()=>({version:ee,routines:[],sessions:[],active:null,settings:{unit:`kg`,figure:`male`}}),d=!0;function te(){try{let e=localStorage.getItem(l);return e?ue(JSON.parse(e)):u()}catch{return d=!1,u()}}function ne(e){try{localStorage.setItem(l,JSON.stringify(e)),d=!0}catch{d=!1}}var re=()=>globalThis.crypto?.randomUUID?.()??`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`,f=(e,t=120)=>typeof e==`string`&&e.length<=t,ie=e=>typeof e==`string`&&/^\d{4}$/.test(e),p=(e,t,n)=>typeof e==`number`&&Number.isFinite(e)&&e>=t&&e<=n?e:null,ae=e=>p(e,0,864e13);function oe(e){return!e||typeof e!=`object`?null:{kg:p(e.kg,0,2e3),reps:p(e.reps,0,1e3),done:e.done===!0}}function se(e){if(!e||!ie(e.ex))return null;let t=Array.isArray(e.sets)?e.sets.map(oe).filter(Boolean).slice(0,50):[];return{ex:e.ex,rest:p(e.rest,0,900)??90,goal:f(e.goal,30)?e.goal:null,sets:t}}function ce(e,{active:t=!1}={}){if(!e||!f(e.id,80))return null;let n=ae(e.startedAt),r=ae(e.endedAt);return n===null||!t&&r===null?null:{id:e.id,routineId:f(e.routineId,80)?e.routineId:null,name:f(e.name)?e.name:`Workout`,startedAt:n,endedAt:t?null:r,items:Array.isArray(e.items)?e.items.map(se).filter(Boolean).slice(0,60):[]}}function le(e){if(!e||!f(e.id,80))return null;let t=Array.isArray(e.items)?e.items.filter(e=>e&&ie(e.ex)).map(e=>({ex:e.ex,sets:p(e.sets,1,20)??3,reps:f(e.reps,20)?e.reps:`8-12`,rest:p(e.rest,0,900)??90})).slice(0,60):[];return{id:e.id,name:f(e.name)?e.name:`Workout`,items:t,createdAt:ae(e.createdAt)??Date.now(),updatedAt:ae(e.updatedAt)??Date.now()}}function ue(e){let t=u();return!e||typeof e!=`object`||(t.routines=Array.isArray(e.routines)?e.routines.map(le).filter(Boolean):[],t.sessions=Array.isArray(e.sessions)?e.sessions.map(e=>ce(e)).filter(Boolean):[],t.sessions.sort((e,t)=>t.startedAt-e.startedAt),t.active=e.active?ce(e.active,{active:!0}):null,e.settings?.unit===`lb`&&(t.settings.unit=`lb`),e.settings?.figure===`female`&&(t.settings.figure=`female`)),t}function de(e){let t={app:`First Rep`,...e,exportedAt:new Date().toISOString()};return new Blob([JSON.stringify(t,null,2)],{type:`application/json`})}async function fe(e){if(e.size>20971520)throw Error(`That file is too large to be a backup.`);let t;try{t=JSON.parse(await e.text())}catch{throw Error(`That file is not a First Rep backup.`)}if(!t||!Array.isArray(t.routines)&&!Array.isArray(t.sessions))throw Error(`That file is not a First Rep backup.`);return ue(t)}var pe=null,me=e=>String(e).toLowerCase().normalize(`NFD`).replace(/[̀-ͯ]/g,``).replace(/[-–/·,()]/g,` `).replace(/\s+/g,` `).trim();async function he(){if(pe)return pe;let{default:e}=await s(async()=>{let{default:e}=await import(`./exercises-BRBOSHBK.js`);return{default:e}},[],import.meta.url);for(let t of e)t.title=i(t.name),t.nameKey=me(t.name),t.searchKey=me(`${t.name} ${t.target} ${r(t.target)} ${t.equipment} ${t.bodyPart} ${t.secondary.join(` `)}`);return pe={list:e,byId:new Map(e.map(e=>[e.id,e])),equipment:[...new Set(e.map(e=>e.equipment))].sort((t,n)=>ge(e,n)-ge(e,t))},pe}var ge=(e,t)=>e.reduce((e,n)=>e+(n.equipment===t),0),m=e=>pe?.byId.get(e)?.title??`Exercise ${e}`;function _e({list:e},t,n=()=>!0){let r=me(t),i=r.split(` `).filter(Boolean),a=e.filter(e=>n(e)&&i.every(t=>e.searchKey.includes(t))),o=e=>+!!e.nameKey.includes(`stretch`);if(!i.length)return a.sort((e,t)=>o(e)-o(t)||e.nameKey.localeCompare(t.nameKey));let s=({nameKey:e})=>e.startsWith(r)?0:e.includes(r)?1:i.every(t=>e.includes(t))?2:e.split(` `).some(e=>e.startsWith(i[0]))?3:4;return a.map(e=>[s(e),e]).sort((e,t)=>e[0]-t[0]||e[1].nameKey.length-t[1].nameKey.length||e[1].nameKey.localeCompare(t[1].nameKey)).map(([,e])=>e)}var ve=null;async function ye(){return ve||({default:ve}=await s(()=>import(`./body-paths-Czq14UiE.js`),[],import.meta.url)),ve}var be=[43,47,56],xe=[104,86,58],Se=[242,219,170],Ce=`#1c1f25`,we=`#15171b`,Te=(e,t,n)=>e.map((e,r)=>Math.round(e+(t[r]-e)*n)),Ee=([e,t,n])=>`rgb(${e}, ${t}, ${n})`,h=e=>Ee(e>0?Te(xe,Se,Math.min(1,e)**.75):be),De=e=>e.split(` `).map(Number);function Oe(e,t){let r=e[t],[i,a,o,s]=De(r.front.vb),[c,l,ee,u]=De(r.back.vb),d=Math.min(i,c),te=Math.min(a,l),ne=Math.max(i+o,c+ee)-d,re=Math.max(a+s,l+u)-te,f=e=>`<g class="bm-view" data-side="${e}">${Object.entries(r[e].p).map(([e,t])=>{let r=e in n?`class="bm-muscle" data-region="${e}" fill="${h(0)}"`:`class="bm-inert" fill="${e===`hair`?we:Ce}"`;return t.map(e=>`<path ${r} d="${e}"></path>`).join(``)}).join(``)}</g>`;return`<svg class="bodymap__svg" viewBox="${d} ${te} ${ne} ${re}" aria-hidden="true" focusable="false">${f(`front`)}${f(`back`)}</svg>`}function ke(e,t){for(let n of e.querySelectorAll(`.bm-muscle`)){let e=t[n.dataset.region]??0;n.setAttribute(`fill`,h(e)),n.classList.toggle(`is-trained`,e>0)}}function Ae(e,t){for(let n of e.querySelectorAll(`.bm-muscle`))n.classList.toggle(`is-hover`,n.dataset.region===t)}var je=864e5,Me=(e,t)=>e>0&&t>0?t===1?e:e*(1+t/30):0,g=e=>e.sets.filter(e=>e.done);function Ne(e){let t=0,n=0;for(let r of e.items)for(let e of g(r))t+=1,n+=(e.kg??0)*(e.reps??0);let r=e.endedAt?Math.max(1,Math.round((e.endedAt-e.startedAt)/6e4)):0;return{sets:t,volume:n,minutes:r}}var Pe=(e,t=Date.now())=>e.filter(e=>e.endedAt&&t-e.endedAt<7*je);function Fe(e,t,n=null){for(let r of e){if(r.id===n)continue;let e=r.items.find(e=>e.ex===t&&g(e).length);if(e)return{session:r,sets:g(e)}}return null}function Ie(e,t,n=null){let r=null;for(let i of e)if(i.id!==n){for(let e of i.items)if(e.ex===t)for(let t of g(e)){let e=Me(t.kg??0,t.reps??0);e>0&&(!r||e>r.score)&&(r={...t,score:e,at:i.endedAt})}}return r}function Le(e,t){let n=e.filter(e=>e.id!==t.id&&e.endedAt<t.startedAt+1),r=[];for(let e of t.items){let t=null;for(let n of g(e)){let e=Me(n.kg??0,n.reps??0);e>0&&(!t||e>t.score)&&(t={...n,score:e})}if(!t)continue;let i=Ie(n,e.ex);i&&t.score>i.score+.01&&r.push({ex:e.ex,set:t,before:i})}return r}function Re(e,t){let n=[];for(let r of e){let e=r.items.find(e=>e.ex===t);if(!e)continue;let i=null;for(let t of g(e)){let e=Me(t.kg??0,t.reps??0);(!i||e>i.score)&&(i={...t,score:e})}i&&n.push({at:r.endedAt??r.startedAt,...i})}return n.sort((e,t)=>e.at-t.at)}function _(e,t,n=e=>g(e).length){let r={};for(let i of e){let e=n(i);if(e)for(let[n,a]of Object.entries(o(t.get(i.ex))))r[n]=(r[n]??0)+e*a}return r}function ze(e){let t=new Date(e);return t.setHours(0,0,0,0),t.setDate(t.getDate()-(t.getDay()+6)%7),t.getTime()}function Be(e,t=8,n=Date.now()){let r=ze(n),i=Array.from({length:t},(e,n)=>{let i=new Date(r);return i.setDate(i.getDate()-7*(t-1-n)),{start:i.getTime(),sets:0,workouts:0}});for(let t of e){let e=ze(t.startedAt),n=i.find(t=>t.start===e);n&&(n.workouts+=1,n.sets+=t.items.reduce((e,t)=>e+g(t).length,0))}return i}var Ve=new Intl.DateTimeFormat(`en-GB`,{day:`numeric`,month:`short`}),He=new Intl.DateTimeFormat(`en-GB`,{month:`short`}),Ue=e=>`${e} ${e===1?`set`:`sets`}`;function We(e,{esc:t}){let n=Math.max(1,...e.map(e=>e.sets)),r=e.map((r,i)=>{let a=i===e.length-1,[o,s]=a?[`This`,`week`]:[String(new Date(r.start).getDate()),He.format(r.start)];return`<li class="weeks__col${a?` is-current`:``}${r.sets?``:` is-empty`}" style="--share:${(r.sets/n).toFixed(3)}">
        <span class="weeks__plot"><span class="weeks__value">${r.sets||``}</span><span class="weeks__bar"></span></span>
        <span class="weeks__label">${t(o)}<br />${t(s)}</span>
      </li>`}).join(``),i=e.at(-1),a=e.reduce((e,t)=>t.sets>e.sets?t:e,e[0]),o=a.sets?`This week, since Monday: ${Ue(i.sets)}. Most in a week: ${Ue(a.sets)}, the week of ${Ve.format(a.start)}.`:`No sets in the last ${e.length} weeks.`,s=e.map((n,r)=>`<tr><th scope="row">${t(r===e.length-1?`This week`:`Week of ${Ve.format(n.start)}`)}</th><td>${n.workouts}</td><td>${n.sets}</td></tr>`).join(``);return`<figure class="weeks">
    <ol class="weeks__chart" aria-hidden="true" style="--count:${e.length}">${r}</ol>
    <figcaption class="weeks__summary">${t(o)}</figcaption>
    <table class="sr-only"><caption>Sets per week, last ${e.length} weeks</caption><thead><tr><th scope="col">Week</th><th scope="col">Workouts</th><th scope="col">Sets</th></tr></thead><tbody>${s}</tbody></table>
  </figure>`}function Ge(e,{weight:t,unit:n,esc:r}){if(e.length<2)return``;let i=e.map(e=>e.score),a=Math.min(...i),o=Math.max(...i)-a||1,s=e.map((t,n)=>[8+n*284/(e.length-1),62-(t.score-a)*54/o]),c=s.map(([e,t])=>`${e.toFixed(1)},${t.toFixed(1)}`).join(` `),[l,ee]=s.at(-1),u=`Estimated max over your last ${e.length} sessions: ${t(i[0])} to ${t(i.at(-1))} ${n}`;return`<figure class="spark">
    <svg viewBox="0 0 300 70" role="img" aria-label="${r(u)}">
      <polyline points="${c}"></polyline>
      <circle cx="${l.toFixed(1)}" cy="${ee.toFixed(1)}" r="4.5"></circle>
    </svg>
    <figcaption>${r(u)}</figcaption>
  </figure>`}var v=(e,t=document)=>t.querySelector(e),y=(e,t=document)=>[...t.querySelectorAll(e)],b=e=>String(e??``).replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e]),x=e=>`<svg class="icon" aria-hidden="true"><use href="#i-${e}" /></svg>`,S=e=>String(e).padStart(2,`0`),Ke=v(`#ws`),C=v(`#desk`),qe=v(`#rail`),Je=v(`#announcer`),w=v(`#picker`),T=v(`#settings`),E=window.matchMedia(`(min-width: 1024px)`);function D(e){Je.textContent=``,setTimeout(()=>Je.textContent=e,40)}var O=te(),k=null,Ye=null,A=60,j={route:{section:`workouts`,view:`home`},justFinished:null,focusName:!1,notice:null,showAllBests:!1,library:{query:``,muscle:``,equipment:``,limit:A,scrollY:0}},Xe=0,M=()=>{clearTimeout(Xe),ne(O)},Ze=()=>{clearTimeout(Xe),Xe=setTimeout(()=>ne(O),300)};addEventListener(`pagehide`,M);var Qe=2.20462,N=()=>O.settings.unit,$e=e=>e==null?null:N()===`lb`?e*Qe:e,et=e=>e==null?null:N()===`lb`?e/Qe:e,tt=e=>String(Math.round(e*10)/10),P=e=>e==null?``:tt($e(e)),nt=e=>`${Math.round($e(e)).toLocaleString(`en-GB`)} ${N()}`,rt=e=>{let t=parseFloat(String(e).replace(`,`,`.`));return Number.isFinite(t)&&t>=0?t:null},it=e=>{let t=Math.round(e);return`${t} ${t===1?`set`:`sets`}`},F=e=>`${e.kg==null?`No weight`:`${P(e.kg)} ${N()}`} × ${e.reps??`–`}`,I=(e,t,n=`${t}s`)=>`${e} ${e===1?t:n}`,at=new Intl.DateTimeFormat(`en-GB`,{weekday:`short`,day:`numeric`,month:`short`}),ot=new Intl.DateTimeFormat(`en-GB`,{weekday:`short`}),st=new Intl.DateTimeFormat(`en-GB`,{day:`numeric`,month:`short`}),ct=new Intl.DateTimeFormat(`en-GB`,{month:`long`,year:`numeric`}),lt=new Intl.DateTimeFormat(`en-GB`,{hour:`2-digit`,minute:`2-digit`}),ut=e=>new Date(e).setHours(0,0,0,0);function dt(e){let t=Math.round((ut(Date.now())-ut(e))/864e5);return t<=0?`today`:t===1?`yesterday`:t<7?`${t} days ago`:t<56?`${Math.floor(t/7)} ${t<14?`week`:`weeks`} ago`:`on ${st.format(e)}`}var ft=e=>e<60?`${e} min`:`${Math.floor(e/60)} h ${S(e%60)} min`;function pt(e){let t=Math.max(0,Math.floor(e/1e3)),n=Math.floor(t/3600),r=Math.floor(t%3600/60);return n?`${n}:${S(r)}:${S(t%60)}`:`${r}:${S(t%60)}`}var mt=[30,60,90,120,180,240],ht=e=>e<60?`${e} s`:e%60?`${Math.floor(e/60)}:${S(e%60)} min`:`${e/60} min`,L=e=>O.routines.find(t=>t.id===e),R=e=>O.sessions.find(t=>t.id===e),z=e=>k.byId.get(e),gt=e=>Array.from({length:e},()=>({kg:null,reps:null,done:!1})),_t=e=>e&&(e.updatedAt=Date.now()),vt=()=>[...O.routines].sort((e,t)=>t.updatedAt-e.updatedAt),yt=e=>Math.max(5,Math.round(e.items.reduce((e,t)=>e+t.sets*(t.rest+45),0)/300)*5);function bt(e,t,n=3){let r=_(e,k.byId,t);return Object.entries(r).sort((e,t)=>t[1]-e[1]).slice(0,n).map(([e])=>e)}var xt=e=>e===`cardio`||Object.hasOwn(n,e),B=()=>j.library.muscle?`#/exercises/${j.library.muscle}`:`#/exercises`;function St(){let[e=``,t=``]=location.hash.replace(/^#\/?/,``).split(`/`),n=decodeURIComponent(t);switch(e){case`workout`:return n?{section:`workouts`,view:`editor`,id:n}:{section:`workouts`,view:`home`};case`session`:return{section:`workouts`,view:`session`};case`history`:return{section:`history`,view:`history`};case`log`:return n?{section:`history`,view:`log`,id:n}:{section:`history`,view:`history`};case`exercises`:return{section:`exercises`,view:`library`,muscle:n};case`exercise`:return n?{section:`exercises`,view:`exercise`,id:n}:{section:`exercises`,view:`library`,muscle:``};case`progress`:return{section:`progress`,view:`progress`};default:return{section:`workouts`,view:`home`}}}var V=e=>{location.hash===e?H({navigated:!0}):location.hash=e},Ct=e=>history.replaceState(null,``,e);addEventListener(`hashchange`,()=>H({navigated:!0})),E.addEventListener(`change`,()=>H());function H({navigated:e=!1}={}){if(!k)return;let t=St(),n=j.route,r=j.library.muscle;if(t.view===`library`&&(j.library.muscle=xt(t.muscle)?t.muscle:``),t.view===`exercise`&&!z(t.id))return Ct(B()),H({navigated:e});let i=e=>e===`library`||e===`exercise`,a=!!(E.matches&&i(n.view)&&i(t.view)&&j.library.muscle===r&&C.querySelector(`#lib-list`));n.view===`library`&&t.view===`exercise`&&!E.matches&&(j.library.scrollY=scrollY);let o=null,s=`map`,c=!1;switch(t.view){case`editor`:{let e=L(t.id);e&&(o=jt(e)),c=!0;break}case`session`:O.active&&(o=Pt(O.active)),c=!0;break;case`log`:{let e=R(t.id);e&&(o=zt(e)),c=!0;break}case`history`:o=Lt();break;case`library`:o=a?``:qt();break;case`exercise`:E.matches?(o=a?``:qt(),s=`detail`):o=Yt(z(t.id));break;case`progress`:o=Qt(),s=`none`;break;default:o=kt()}if(o===null)return Ct(t.section===`history`?`#/history`:`#/`),H({navigated:e});t.view!==`log`&&(j.justFinished=null),j.route=t;let l=C.contains(document.activeElement)?document.activeElement.id:``;if(!a)C.innerHTML=o,e&&C.firstElementChild?.classList.add(`is-new`),C.setAttribute(`aria-label`,wt(t)),t.view===`progress`&&rn(),t.view===`exercise`&&!E.matches&&an(z(t.id));else for(let e of y(`#lib-list .ex-row`,C))e.dataset.ex===t.id?e.setAttribute(`aria-current`,`true`):e.removeAttribute(`aria-current`);if(Ke.dataset.rail=s,Ke.dataset.railPhone=c?`show`:`hide`,Tt(),e){if(t.view===`exercise`&&E.matches)v(`#detail-title`,qe)?.focus({preventScroll:!0});else if(t.view===`library`&&n.view===`exercise`)E.matches||scrollTo({top:j.library.scrollY,behavior:`instant`}),(document.getElementById(`row-${n.id}`)??v(`#desk-title`))?.focus({preventScroll:!0});else{C.getBoundingClientRect().top<0&&C.scrollIntoView({block:`start`,behavior:`instant`});let e=j.focusName&&v(`#routine-name`);j.focusName=!1,e?(e.focus({preventScroll:!0}),e.select()):a||(C.querySelector(`#desk-title`)??C.querySelector(`#detail-title`))?.focus({preventScroll:!0})}}else l&&document.getElementById(l)?.focus({preventScroll:!0})}var wt=e=>({home:`Your workouts`,editor:`Edit workout`,session:`Workout in progress`,history:`History`,log:`Logged workout`,library:`Exercises`,exercise:`Exercise`,progress:`Progress`})[e.view];function Tt(){v(`#stat-logged`).textContent=O.sessions.length,v(`#stat-week`).textContent=Pe(O.sessions).length;for(let e of y(`.sections__link`))e.dataset.section===j.route.section?e.setAttribute(`aria-current`,`page`):e.removeAttribute(`aria-current`);v(`.sections__link[data-section="exercises"]`).setAttribute(`href`,B()),v(`#live-dot`).hidden=!O.active,v(`#count-history`).textContent=O.sessions.length||``,Dn(),dn()}function Et(){let e=[];return d||e.push(`<p class="banner banner--warn">${x(`alert`)}<span>This browser is blocking storage, so your workouts last only until you close this tab.</span></p>`),j.notice&&e.push(`<p class="banner banner--warn">${x(`alert`)}<span>${b(j.notice)}</span></p>`),j.notice=null,e.join(``)}var U=(e,t=``,n=``)=>`<header class="view-head">
  <div class="view-head__text">
    <h2 class="view-head__title" id="desk-title" tabindex="-1">${b(e)}</h2>
    ${t?`<p class="view-head__sub">${t}</p>`:``}
  </div>
  ${n}
</header>`,Dt=(e,t)=>`<a class="back" href="${e}">${x(`chevron-left`)}${b(t)}</a>`;function Ot(){let e=O.active;if(!e)return``;let t=e.items.reduce((e,t)=>e+t.sets.length,0),n=e.items.reduce((e,t)=>e+g(t).length,0);return`<a class="active-card" href="#/session">
    <span class="live-dot" aria-hidden="true"></span>
    <span class="active-card__text">
      <span class="active-card__label">In progress</span>
      <b>${b(e.name)}</b>
      <span class="active-card__meta"><span id="active-time">${pt(Date.now()-e.startedAt)}</span> · ${n} of ${I(t,`set`)}</span>
    </span>
    <span class="btn btn--gold">${x(`play`)}Resume</span>
  </a>`}function kt(){let e=vt();return`<div class="view">
    ${Et()}
    ${U(`Your workouts`,e.length?`${I(e.length,`workout`)} saved`:`Build one, then start it when you train`,`<button type="button" class="btn btn--gold" data-action="new-routine" id="new-routine">${x(`plus`)}New workout</button>`)}
    ${Ot()}
    ${e.length?`<ul class="routine-grid">${e.map(At).join(``)}</ul>`:`<div class="empty">
            <p class="empty__title">No workouts yet</p>
            <ol class="empty__steps">
              <li>Create a workout and add exercises from the list of 1,324.</li>
              <li>Press Start when you train and check off each set as you finish it.</li>
              <li>Your history fills in, and Progress shows what you worked.</li>
            </ol>
            <div class="empty__actions">
              <button type="button" class="btn btn--gold" data-action="new-routine" id="new-routine-empty">${x(`plus`)}Create a workout</button>
              <a class="btn btn--ghost" href="#/exercises">${x(`list`)}Browse exercises</a>
            </div>
          </div>`}
    <p class="view-foot">
      <button type="button" class="link-btn" data-action="start-empty" id="start-empty">${x(`play`)}<span>Start an empty workout instead</span></button>
    </p>
  </div>`}function At(e){let t=e.items.reduce((e,t)=>e+t.sets,0),r=O.sessions.find(t=>t.routineId===e.id),i=bt(e.items,e=>e.sets),a=b(e.id);return`<li class="routine">
    <div class="routine__top">
      <h3 class="routine__name">${b(e.name)}</h3>
      <span class="routine__when">${r?`Last done ${dt(r.endedAt)}`:`Not done yet`}</span>
    </div>
    ${i.length?`<p class="routine__muscles">${i.map(e=>`<span class="tag">${b(n[e])}</span>`).join(``)}</p>`:``}
    <p class="routine__meta">${e.items.length?`${I(e.items.length,`exercise`)} · ${I(t,`set`)} · about ${yt(e)} min`:`No exercises yet`}</p>
    <div class="routine__actions">
      <button type="button" class="btn btn--gold" data-action="start-routine" data-id="${a}" id="start-${a}" ${e.items.length?``:`disabled`}>${x(`play`)}Start<span class="sr-only"> ${b(e.name)}</span></button>
      <a class="btn btn--ghost" href="#/workout/${a}">${x(`pencil`)}Edit<span class="sr-only"> ${b(e.name)}</span></a>
    </div>
  </li>`}function jt(e){let t=e.items,n=t.reduce((e,t)=>e+t.sets,0);return`<div class="view">
    <header class="view-bar">
      ${Dt(`#/`,`Workouts`)}
      <a class="btn btn--ghost btn--small" href="#/" id="editor-done">${x(`check`)}Done</a>
    </header>
    <h2 class="sr-only" id="desk-title" tabindex="-1">Edit workout</h2>
    <label class="field">
      <span class="field__label">Workout name</span>
      <input class="field__input field__input--title" id="routine-name" data-bind="routine-name" value="${b(e.name)}" maxlength="60" autocomplete="off" />
    </label>
    <div class="section-head">
      <h3 class="section-title">Exercises</h3>
      <p class="section-head__meta" id="editor-meta">${t.length?`${I(t.length,`exercise`)} · ${I(n,`set`)} · about ${yt(e)} min`:``}</p>
    </div>
    ${t.length?`<ol class="plan">${t.map((e,n)=>Mt(e,n,t.length)).join(``)}</ol>`:`<div class="empty empty--small"><p>No exercises yet. Add a few to build the workout. Changes save as you go.</p></div>`}
    <button type="button" class="btn btn--wide btn--dashed" data-action="pick" id="add-exercises">${x(`plus`)}Add exercises</button>
    <footer class="view-actions">
      <button type="button" class="btn btn--gold" data-action="start-routine" data-id="${b(e.id)}" id="start-routine" ${t.length?``:`disabled`}>${x(`play`)}Start workout</button>
      <button type="button" class="btn btn--danger-ghost view-actions__end" data-action="delete-routine" data-id="${b(e.id)}" id="delete-routine">${x(`trash`)}Delete workout</button>
    </footer>
  </div>`}function Mt(e,t,n){let a=z(e.ex),o=m(e.ex);return`<li class="plan__item" data-index="${t}">
    <div class="plan__head">
      <span class="plan__num" aria-hidden="true">${S(t+1)}</span>
      <div class="plan__what">
        <button type="button" class="plan__name" data-action="info" data-ex="${e.ex}" id="item-${t}-name">${b(o)}</button>
        <span class="plan__muscle">${b(a?`${r(a.target)} · ${i(a.equipment)}`:``)}</span>
      </div>
    </div>
    <div class="plan__fields">
      <div class="mini-field">
        <span id="item-${t}-sets-label">Sets</span>
        <div class="stepper" role="group" aria-labelledby="item-${t}-sets-label">
          <button type="button" class="stepper__btn" data-action="sets-down" id="item-${t}-fewer" ${e.sets<=1?`disabled`:``} aria-label="One set fewer">${x(`minus`)}</button>
          <span class="stepper__value" aria-live="polite">${e.sets}</span>
          <button type="button" class="stepper__btn" data-action="sets-up" id="item-${t}-more" ${e.sets>=20?`disabled`:``} aria-label="One set more">${x(`plus`)}</button>
        </div>
      </div>
      <label class="mini-field">
        <span>Reps</span>
        <input data-bind="reps" id="item-${t}-reps" value="${b(e.reps)}" maxlength="12" autocomplete="off" />
      </label>
      <label class="mini-field">
        <span>Rest</span>
        <select data-bind="rest" id="item-${t}-rest">${mt.map(t=>`<option value="${t}"${t===e.rest?` selected`:``}>${ht(t)}</option>`).join(``)}</select>
      </label>
      ${Nt(`item`,t,n,o)}
    </div>
  </li>`}var Nt=(e,t,n,r)=>`<div class="item-tools">
  <button type="button" class="icon-btn" data-action="move-up" id="${e}-${t}-up" ${t===0?`disabled`:``} aria-label="Move ${b(r)} up">${x(`arrow-up`)}</button>
  <button type="button" class="icon-btn" data-action="move-down" id="${e}-${t}-down" ${t===n-1?`disabled`:``} aria-label="Move ${b(r)} down">${x(`arrow-down`)}</button>
  <button type="button" class="icon-btn icon-btn--danger" data-action="remove-item" id="${e}-${t}-remove" aria-label="Remove ${b(r)}">${x(`trash`)}</button>
</div>`;function Pt(e){let t=e.items.reduce((e,t)=>e+t.sets.length,0),n=e.items.reduce((e,t)=>e+g(t).length,0);return`<div class="view session">
    <div class="session-bar" role="group" aria-label="Workout in progress">
      <span class="live-dot" aria-hidden="true"></span>
      <p class="session-bar__info">
        <b class="session-bar__clock"><span class="sr-only">Time so far: </span><span id="timer">${pt(Date.now()-e.startedAt)}</span></b>
        <span class="session-bar__count" id="session-count">${n} of ${I(t,`set`)}</span>
      </p>
      <span class="session-bar__progress" aria-hidden="true"><span style="width:${t?n/t*100:0}%"></span></span>
      <button type="button" class="btn btn--gold" data-action="finish" id="finish">${x(`check`)}Finish</button>
    </div>
    <header class="view-bar">${Dt(`#/`,`Workouts`)}</header>
    <h2 class="sr-only" id="desk-title" tabindex="-1">Workout in progress</h2>
    <label class="field">
      <span class="sr-only">Workout name</span>
      <input class="field__input field__input--title" id="session-name" data-bind="session-name" value="${b(e.name)}" maxlength="60" autocomplete="off" />
    </label>
    ${e.items.length?`<ol class="log">${e.items.map((t,n)=>Ft(t,n,e)).join(``)}</ol>`:`<div class="empty empty--small"><p>Add the exercises you are doing, then check off each set as you finish it.</p></div>`}
    <button type="button" class="btn btn--wide btn--dashed" data-action="pick" id="add-exercises">${x(`plus`)}Add exercise</button>
    <footer class="view-actions">
      <button type="button" class="btn btn--danger-ghost view-actions__end" data-action="discard" id="discard">${x(`trash`)}Discard workout</button>
    </footer>
    <div class="rest" id="rest" role="timer" aria-label="Rest"${X.end?``:` hidden`}>
      <span class="rest__fill" id="rest-fill" aria-hidden="true"></span>
      <span class="rest__label">Rest</span>
      <b class="rest__time" id="rest-time">0:00</b>
      <span class="rest__buttons">
        <button type="button" class="rest__btn" data-action="rest-less" aria-label="15 seconds less">−15</button>
        <button type="button" class="rest__btn" data-action="rest-more" aria-label="15 seconds more">+15</button>
        <button type="button" class="rest__btn" data-action="rest-skip">Skip</button>
      </span>
    </div>
  </div>`}function Ft(e,t,n){let i=z(e.ex),a=m(e.ex),o=Fe(O.sessions,e.ex,n.id),s=o?.sets??[],c=g(e).length,l=[i&&r(i.target),e.goal&&`Goal ${e.goal}`,o&&`Last time ${dt(o.session.endedAt)}`].filter(Boolean);return`<li class="log__item${c===e.sets.length&&c?` is-complete`:``}" data-index="${t}">
    <div class="log__head">
      <div class="log__what">
        <button type="button" class="log__name" data-action="info" data-ex="${e.ex}" id="log-${t}-name">${b(a)}</button>
        <p class="log__meta">${b(l.join(` · `))}</p>
      </div>
      <span class="log__done"><span aria-hidden="true">${c}/${e.sets.length}</span><span class="sr-only">${c} of ${e.sets.length} sets done</span></span>
    </div>
    <table class="sets">
      <thead><tr><th scope="col">Set</th><th scope="col">Last time</th><th scope="col">${N()}</th><th scope="col">Reps</th><th scope="col"><span class="sr-only">Done</span></th></tr></thead>
      <tbody>${e.sets.map((e,n)=>It(e,n,s[n],t)).join(``)}</tbody>
    </table>
    <div class="log__actions">
      <button type="button" class="btn btn--ghost btn--small" data-action="add-set" id="log-${t}-add-set">${x(`plus`)}Add set</button>
      <button type="button" class="btn btn--ghost btn--small" data-action="remove-set" id="log-${t}-remove-set" ${e.sets.length<=1?`disabled`:``}>${x(`minus`)}Remove set</button>
      ${Nt(`log`,t,n.items.length,a)}
    </div>
  </li>`}function It(e,t,n,r){return`<tr class="${e.done?`is-done`:``}">
    <th scope="row">${t+1}</th>
    <td class="sets__last">${n?b(`${P(n.kg)||`–`} × ${n.reps??`–`}`):`–`}</td>
    <td><input class="sets__input" id="s-${r}-${t}-kg" data-bind="kg" data-set="${t}" inputmode="decimal" value="${P(e.kg)}" placeholder="${n?P(n.kg):``}" aria-label="Set ${t+1} weight in ${N()}" autocomplete="off" /></td>
    <td><input class="sets__input" id="s-${r}-${t}-reps" data-bind="set-reps" data-set="${t}" inputmode="numeric" value="${e.reps??``}" placeholder="${n?.reps??``}" aria-label="Set ${t+1} reps" autocomplete="off" /></td>
    <td><button type="button" class="check" id="s-${r}-${t}-done" data-action="toggle-set" data-set="${t}" aria-pressed="${e.done}" aria-label="Set ${t+1} done">${x(`check`)}</button></td>
  </tr>`}function Lt(){if(!O.sessions.length)return`<div class="view">
      ${Et()}
      ${U(`History`)}
      <div class="empty">
        <p class="empty__title">Nothing logged yet</p>
        <p>Finish a workout and it appears here, with every set you did and any new bests.</p>
        <div class="empty__actions"><a class="btn btn--gold" href="#/">${x(`dumbbell`)}Go to your workouts</a></div>
      </div>
    </div>`;let e=new Map;for(let t of O.sessions){let n=ct.format(t.startedAt);e.has(n)||e.set(n,[]),e.get(n).push(t)}return`<div class="view">
    ${Et()}
    ${U(`History`,`${I(O.sessions.length,`workout`)} logged`)}
    ${[...e].map(([e,t])=>`<section class="history" aria-labelledby="m-${b(e.replace(/\s/g,`-`))}">
          <h3 class="history__month" id="m-${b(e.replace(/\s/g,`-`))}">${b(e)} <span>${I(t.length,`workout`)}</span></h3>
          <ul class="history__list">${t.map(Rt).join(``)}</ul>
        </section>`).join(``)}
  </div>`}function Rt(e){let t=Ne(e),n=Le(O.sessions,e).length,r=new Date(e.startedAt);return`<li><a class="log-row" href="#/log/${b(e.id)}">
    <span class="log-row__date" aria-hidden="true"><b>${r.getDate()}</b><small>${b(ot.format(r))}</small></span>
    <span class="log-row__main">
      <b>${b(e.name)}</b>
      <small><span class="sr-only">${b(at.format(r))}. </span>${ft(t.minutes)} · ${I(t.sets,`set`)} · ${nt(t.volume)}</small>
    </span>
    ${n?`<span class="tag tag--best">${x(`trophy`)}${n}<span class="sr-only"> new ${n===1?`best`:`bests`}</span></span>`:``}
    ${x(`chevron-right`)}
  </a></li>`}function zt(e){let t=Ne(e),n=Le(O.sessions,e),a=new Set(n.map(e=>e.ex)),o=e.routineId&&L(e.routineId);return`<div class="view">
    <header class="view-bar">${Dt(`#/history`,`History`)}</header>
    ${j.justFinished===e.id?`<p class="banner banner--ok">${x(`check`)}<span>Workout saved. Nice work.</span></p>`:``}
    ${U(e.name,`${b(at.format(e.startedAt))}, ${b(lt.format(e.startedAt))}`)}
    <dl class="tiles">
      <div><dt>Time</dt><dd>${ft(t.minutes)}</dd></div>
      <div><dt>Sets</dt><dd>${t.sets}</dd></div>
      <div><dt>Lifted</dt><dd>${nt(t.volume)}</dd></div>
      <div><dt>New bests</dt><dd>${n.length}</dd></div>
    </dl>
    ${n.length?`<section class="bests" aria-labelledby="bests-title"><h3 class="section-title" id="bests-title">New bests</h3><ul>${n.map(e=>`<li>${x(`trophy`)}<span><b>${b(m(e.ex))}</b> ${b(F(e.set))}<small>Best before: ${b(F(e.before))}</small></span></li>`).join(``)}</ul></section>`:``}
    <section aria-labelledby="done-title">
      <h3 class="section-title" id="done-title">Exercises</h3>
      <ol class="done-list">${e.items.map(e=>{let t=z(e.ex);return`<li class="done-list__item">
            <div class="done-list__head">
              <a class="done-list__name" href="#/exercise/${e.ex}">${b(m(e.ex))}</a>
              ${a.has(e.ex)?`<span class="tag tag--best">${x(`trophy`)}Best</span>`:``}
            </div>
            <p class="done-list__muscle">${b(t?`${r(t.target)} · ${i(t.equipment)}`:``)}</p>
            <ol class="done-sets">${e.sets.map((e,t)=>`<li><span aria-hidden="true">${t+1}</span>${b(F(e))}</li>`).join(``)}</ol>
          </li>`}).join(``)}</ol>
    </section>
    <footer class="view-actions">
      <button type="button" class="btn btn--gold" data-action="repeat" data-id="${b(e.id)}" id="repeat">${x(`play`)}Do it again</button>
      ${o?``:`<button type="button" class="btn" data-action="save-routine" data-id="${b(e.id)}" id="save-routine">${x(`plus`)}Save as a workout</button>`}
      <button type="button" class="btn btn--danger-ghost view-actions__end" data-action="delete-log" data-id="${b(e.id)}" id="delete-log">${x(`trash`)}Delete</button>
    </footer>
  </div>`}var Bt=e=>`<option value="">All muscles</option>${a.map(([t,n])=>`<option value="${t}"${t===e?` selected`:``}>${b(n)}</option>`).join(``)}<option value="cardio"${e===`cardio`?` selected`:``}>Cardio</option>`,Vt=e=>`<option value="">All equipment</option>${k.equipment.map(t=>`<option value="${b(t)}"${t===e?` selected`:``}>${b(i(t))}</option>`).join(``)}`,Ht=e=>e===`cardio`?`cardio`:n[e]?.toLowerCase(),W=(e,t)=>`${e.toLocaleString(`en-GB`)} ${e===1?`exercise`:`exercises`}${t?` for ${Ht(t)}`:``}`,Ut=e=>t=>(!e.muscle||(e.muscle===`cardio`?t.target===`cardiovascular system`:c(t.target).includes(e.muscle)))&&(!e.equipment||t.equipment===e.equipment),Wt=()=>_e(k,j.library.query,Ut(j.library));function Gt(e,t){return e.map(e=>`<li><a class="ex-row" href="#/exercise/${e.id}" data-ex="${e.id}" id="row-${e.id}"${e.id===t?` aria-current="true"`:``}>
        <span class="ex-row__text"><b>${b(e.title)}</b><span>${b(r(e.target))} · ${b(i(e.equipment))}</span></span>
        ${x(`chevron-right`)}
      </a></li>`).join(``)}function Kt(){let e=Wt(),t=e.slice(0,j.library.limit),n=j.route.view===`exercise`?j.route.id:St().id;return{count:W(e.length,j.library.muscle),rows:Gt(t,n)+(e.length>t.length?`<li class="list-more"><button type="button" class="btn btn--ghost" data-action="more">Show ${Math.min(A,e.length-t.length)} more</button></li>`:``)+(e.length?``:`<li class="list-none">No exercise matches. Try fewer words, or clear the muscle and equipment filters.</li>`)}}function qt(){let{count:e,rows:t}=Kt();return`<div class="view">
    ${U(`Exercises`,`${k.list.length.toLocaleString(`en-GB`)} exercises, with steps and the muscles they train`)}
    <div class="filters">
      <div class="search" role="search">
        <label class="sr-only" for="lib-search">Search exercises</label>
        ${x(`search`)}
        <input id="lib-search" type="search" value="${b(j.library.query)}" placeholder="Search 1,324 exercises" autocomplete="off" spellcheck="false" enterkeyhint="search" />
      </div>
      <div class="filters__selects">
        <label class="select"><span class="select__label">Muscle</span><select id="lib-muscle">${Bt(j.library.muscle)}</select></label>
        <label class="select"><span class="select__label">Equipment</span><select id="lib-equipment">${Vt(j.library.equipment)}</select></label>
      </div>
    </div>
    <div class="list-bar">
      <p class="list-count" id="lib-count" aria-live="polite">${b(e)}</p>
      <div class="active-filters" id="lib-active">${Jt()}</div>
    </div>
    <ul class="ex-list" id="lib-list">${t}</ul>
  </div>`}function Jt(){let e=[];return j.library.muscle&&e.push([`muscle`,j.library.muscle===`cardio`?`Cardio`:n[j.library.muscle]]),j.library.equipment&&e.push([`equipment`,i(j.library.equipment)]),e.map(([e,t])=>`<button type="button" class="filter-chip" data-action="clear-filter" data-filter="${e}"><span class="sr-only">Remove the filter </span>${b(t)}${x(`close`)}</button>`).join(``)}function G(){let{count:e,rows:t}=Kt();v(`#lib-count`).textContent=e,v(`#lib-list`).innerHTML=t,v(`#lib-active`).innerHTML=Jt(),v(`.sections__link[data-section="exercises"]`).setAttribute(`href`,B()),dn()}function Yt(e){return`<div class="view">${Xt(e,{inRail:!1})}</div>`}function Xt(n,{inRail:a}){let o=Re(O.sessions,n.id).slice(-12),s=Ie(O.sessions,n.id),c=t(n),l=c&&e[c],ee=n.secondary.map(i);return`<article class="ex-detail" aria-labelledby="detail-title">
    <div class="ex-detail__bar">
      ${a?`<p class="eyebrow">Exercise</p><a class="icon-btn" href="${B()}" aria-label="Close this exercise">${x(`close`)}</a>`:Dt(B(),`Exercises`)}
    </div>
    <h2 class="ex-detail__title" id="detail-title" tabindex="-1">${b(n.title)}</h2>
    <p class="ex-detail__sub">${b(r(n.target))} · ${b(i(n.equipment))}</p>
    <div class="ex-detail__figure" data-figure-for="${n.id}"></div>
    <ul class="ex-detail__key">
      <li><span class="key" style="background:${h(1)}" aria-hidden="true"></span><span>Works: <b>${b(r(n.target))}</b></span></li>
      ${ee.length?`<li><span class="key" style="background:${h(.5)}" aria-hidden="true"></span><span>Also: ${b(ee.join(`, `))}</span></li>`:``}
    </ul>
    <div class="ex-detail__actions">
      ${Zt(n)}
      ${l?`<a class="link-btn" href="./?muscle=${l}">${x(`cube`)}<span>See it on the 3D model</span></a>`:``}
    </div>
    <h3 class="section-title">How to do it</h3>
    <ol class="ex-steps">${n.steps.map(e=>`<li><span>${b(e)}</span></li>`).join(``)}</ol>
    <h3 class="section-title">Your progress</h3>
    ${o.length&&s?`${Ge(o,{weight:P,unit:N(),esc:b})}<dl class="ex-best">
            <div><dt>Best set</dt><dd>${b(F(s))}</dd></div>
            <div><dt>Estimated max</dt><dd>${P(s.score)} ${N()}</dd></div>
            <div><dt>Logged</dt><dd>${I(o.length,`time`)}</dd></div>
          </dl>`:`<p class="ex-detail__none">Not logged yet. Your best set and a progress line appear here once you log it.</p>`}
  </article>`}function Zt(e){let t=[];O.active&&t.push([`session`,`play`,`${O.active.name} (in progress)`]);for(let e of vt())t.push([e.id,`dumbbell`,e.name]);return t.push([`new`,`plus`,`A new workout`]),`<details class="menu">
    <summary class="btn btn--gold">${x(`plus`)}Add to a workout${x(`chevron-down`)}</summary>
    <ul class="menu__list">${t.map(([t,n,r])=>`<li><button type="button" class="menu__item" data-action="add-to" data-target="${b(t)}" data-ex="${e.id}">${x(n)}<span>${b(r)}</span></button></li>`).join(``)}</ul>
  </details>`}function Qt(){if(!O.sessions.length)return`<div class="view">
      ${U(`Progress`)}
      <div class="empty">
        <p class="empty__title">No progress to show yet</p>
        <p>Log a workout and this page shows your weeks, the muscles you trained and your personal bests.</p>
        <div class="empty__actions"><a class="btn btn--gold" href="#/">${x(`dumbbell`)}Go to your workouts</a></div>
      </div>
    </div>`;let e=Pe(O.sessions),t=0,r=0,i=0;for(let n of e){let e=Ne(n);t+=e.sets,r+=e.volume,i+=e.minutes}let a=en(),o=Object.entries(a).filter(([,e])=>e>0).sort((e,t)=>t[1]-e[1]),s=on.filter(e=>!a[e]),c=$t(),l=j.showAllBests?c:c.slice(0,8);return`<div class="view">
    ${U(`Progress`,`Your last 7 days, your weeks and your bests`)}
    <section class="stat-card"aria-labelledby="p-week">
      <h3 class="section-title" id="p-week">Last 7 days</h3>
      <dl class="tiles">
        <div><dt>Workouts</dt><dd>${e.length}</dd></div>
        <div><dt>Sets</dt><dd>${t}</dd></div>
        <div><dt>Lifted</dt><dd>${nt(r)}</dd></div>
        <div><dt>Time</dt><dd>${ft(i)}</dd></div>
      </dl>
    </section>
    <div class="progress-grid">
      <section class="stat-card"aria-labelledby="p-sets">
        <h3 class="section-title" id="p-sets">Sets per week</h3>
        ${We(Be(O.sessions,8),{esc:b})}
      </section>
      <section class="stat-card"aria-labelledby="p-muscles">
        <h3 class="section-title" id="p-muscles">Muscles, last 7 days</h3>
        <div class="pmap">
          <div class="pmap__figure" data-week-map></div>
          <ul class="pmap__list">${o.length?o.slice(0,8).map(([e,t])=>`<li><a class="map-row" href="#/exercises/${e}"><span class="map-row__swatch" style="background:${h(Math.min(1,t/10))}"></span><span class="map-row__name">${b(n[e])}</span><b>${it(t)}</b></a></li>`).join(``):`<li class="map-empty">No sets in the last 7 days.</li>`}</ul>
        </div>
        <p class="bodymap__legend">Full colour at 10 sets in 7 days. Secondary muscles count half.</p>
        ${s.length?`<p class="map-missing"><span>Not worked in 7 days:</span> ${s.map(e=>`<a class="map-chip" href="#/exercises/${e}">${b(n[e])}</a>`).join(``)}</p>`:``}
      </section>
    </div>
    <section class="stat-card"aria-labelledby="p-bests">
      <h3 class="section-title" id="p-bests">Personal bests</h3>
      <ol class="pb-list">${l.map(({ex:e,best:t})=>`<li><a class="pb-row" href="#/exercise/${e}">
            <span class="pb-row__name"><b>${b(m(e))}</b><small>Set ${dt(t.at)}</small></span>
            <span class="pb-row__set">${b(F(t))}</span>
            <span class="pb-row__max"><small>Est. max</small>${P(t.score)} ${N()}</span>
          </a></li>`).join(``)}</ol>
      ${c.length>8?`<button type="button" class="btn btn--ghost btn--small" data-action="all-bests" id="all-bests" aria-expanded="${j.showAllBests}">${j.showAllBests?`Show fewer`:`Show all ${c.length}`}</button>`:``}
    </section>
  </div>`}function $t(){return[...new Set(O.sessions.flatMap(e=>e.items.map(e=>e.ex)))].map(e=>({ex:e,best:Ie(O.sessions,e)})).filter(({best:e})=>e).sort((e,t)=>t.best.at-e.best.at)}function en(){let e={};for(let t of Pe(O.sessions))for(let[n,r]of Object.entries(_(t.items,k.byId)))e[n]=(e[n]??0)+r;return e}var tn={};function nn(){let e=O.settings.figure;if(!tn[e]){let t=document.createElement(`div`);t.innerHTML=Oe(Ye,e),tn[e]=t.firstElementChild}return tn[e].cloneNode(!0)}function rn(){let e=v(`[data-week-map]`,C);if(!e)return;let t=nn(),n=en();ke(t,Object.fromEntries(Object.entries(n).map(([e,t])=>[e,Math.min(1,t/10)]))),e.append(t)}function an(e,t=C){let n=v(`[data-figure-for="${e.id}"]`,t);if(!n)return;let r=nn();r.classList.add(`bodymap__svg--static`),ke(r,o(e)),n.append(r)}var on=[`chest`,`deltoids`,`upper-back`,`biceps`,`triceps`,`abs`,`gluteal`,`quadriceps`,`hamstring`,`calves`],sn=e=>{let t=Math.max(0,...Object.values(e));return Object.fromEntries(Object.entries(e).map(([e,n])=>[e,t?n/t:0]))};function cn(){let e=j.route,t=k.byId;if(e.view===`editor`){let n=L(e.id),r=n?_(n.items,t,e=>e.sets):{};return{context:`This workout`,title:n?.name||`New workout`,load:r,shares:sn(r),legend:`Planned sets. Secondary muscles count half.`,empty:`Add exercises to see which muscles this workout trains.`,hint:`Tap a muscle to add exercises for it.`}}if(e.view===`session`&&O.active){let e=_(O.active.items,t,e=>e.sets.length),n=_(O.active.items,t),r=Math.max(0,...Object.values(e));return{context:`Today`,title:`Worked so far`,load:n,shares:Object.fromEntries(Object.entries(n).map(([e,t])=>[e,r?t/r:0])),legend:`Fills in as you check off sets. Secondary muscles count half.`,empty:`Check off a set and the muscles it trains light up.`,hint:`Tap a muscle to add an exercise for it.`}}if(e.view===`log`){let n=R(e.id),r=n?_(n.items,t):{};return{context:n?at.format(n.startedAt):``,title:`Muscles worked`,load:r,shares:sn(r),legend:`Sets in this workout. Secondary muscles count half.`,empty:`No sets in this workout.`,hint:`Tap a muscle to see its exercises.`}}if(e.view===`library`||e.view===`exercise`){let e=j.library.muscle;return{context:`Exercises`,title:e&&e!==`cardio`?n[e]:`Find by muscle`,load:{},shares:e&&e!==`cardio`?{[e]:1}:{},legend:``,empty:``,hint:e?`Tap another muscle, or the same one again to show every exercise.`:`Tap a muscle to show its exercises.`,filter:!0}}let r=en();return{context:`Last 7 days`,title:`Muscles worked`,load:r,shares:Object.fromEntries(Object.entries(r).map(([e,t])=>[e,Math.min(1,t/10)])),legend:`Full colour at 10 sets in 7 days. Secondary muscles count half.`,empty:`Log a workout and the muscles you trained light up here.`,hint:`Tap a muscle to see its exercises.`,week:!0}}var ln=null,un={};function dn(){if(!Ye||!k)return;let e=Ke.dataset.rail,t=v(`#rail-detail`),r=v(`#rail-map`);if(e===`detail`){let e=z(j.route.id);r.hidden=!0,t.hidden=!1;let n=[e.id,N(),O.settings.figure,O.active?.name??``,O.sessions.length,...O.routines.map(e=>e.id+e.name)].join(`|`);t.dataset.drawn!==n&&(t.innerHTML=Xt(e,{inRail:!0}),t.dataset.drawn=n,an(e,t)),qe.setAttribute(`aria-labelledby`,`detail-title`);return}if(t.hidden=!0,t.dataset.drawn=``,t.innerHTML=``,r.hidden=!1,qe.setAttribute(`aria-labelledby`,`map-title`),e===`none`)return;let i=v(`#map-figure`);ln!==O.settings.figure&&(i.querySelector(`svg`)?.remove(),i.prepend(nn()),ln=O.settings.figure);let a=cn();un=a.load,ke(i.querySelector(`svg`),a.shares),i.classList.toggle(`is-filter`,!!a.filter),v(`#map-context`).textContent=a.context,v(`#map-title`).textContent=a.title,v(`#map-legend`).textContent=a.legend,v(`#map-legend`).hidden=!a.legend,v(`#map-hint`).textContent=a.hint;let o=Object.entries(a.load).filter(([,e])=>e>0).sort((e,t)=>t[1]-e[1]),s=``;if(a.filter)s=j.library.muscle?`<li><button type="button" class="map-chip" data-action="clear-muscle">${x(`close`)}Show every muscle</button></li>`:``;else if(o.length){if(s=o.map(([e,t])=>`<li><button type="button" class="map-row" data-region="${e}">
          <span class="map-row__swatch" style="background:${h(a.shares[e])}"></span>
          <span class="map-row__name">${b(n[e])}</span><b>${it(t)}</b>
        </button></li>`).join(``),a.week){let e=on.filter(e=>!a.load[e]);e.length&&(s+=`<li class="map-missing"><span>Not worked in 7 days:</span> ${e.map(e=>`<button type="button" class="map-chip" data-region="${e}">${b(n[e])}</button>`).join(``)}</li>`)}}else s=`<li class="map-empty">${b(a.empty)}</li>`;v(`#map-list`).innerHTML=s}function fn(e){let t=j.route.view;t===`editor`?Nn({mode:`routine`,muscle:e}):t===`session`?Nn({mode:`session`,muscle:e}):t===`library`||t===`exercise`?pn(j.library.muscle===e?``:e):V(`#/exercises/${e}`)}function pn(e){j.library.muscle=e,j.library.limit=A;let t=v(`#lib-muscle`);t&&(t.value=e),j.route.view===`library`&&Ct(B()),G(),D(W(Wt().length,e))}var K=v(`#map-figure`),q=v(`#map-tip`),mn=null;function hn(e,t,r){let i=K.querySelector(`svg`);if(e!==mn&&(mn=e,i&&Ae(i,e)),!e){q.hidden=!0;return}let a=un[e]??0;if(q.textContent=j.route.view===`library`||j.route.view===`exercise`?n[e]:`${n[e]} · ${a?it(a):`no sets`}`,q.hidden=!1,t!=null){let e=K.getBoundingClientRect(),n=Math.min(Math.max(8,t-e.left+14),e.width-q.offsetWidth-8),i=Math.max(8,r-e.top-q.offsetHeight-12);q.style.transform=`translate(${Math.round(n)}px, ${Math.round(i)}px)`}}K.addEventListener(`pointermove`,e=>{e.pointerType===`mouse`&&hn(e.target.closest?.(`.bm-muscle`)?.dataset.region??null,e.clientX,e.clientY)}),K.addEventListener(`pointerleave`,()=>hn(null)),K.addEventListener(`click`,e=>{let t=e.target.closest?.(`.bm-muscle`)?.dataset.region;t&&fn(t)});var gn=v(`#map-list`);gn.addEventListener(`click`,e=>{let t=e.target.closest(`button`);t&&(t.dataset.action===`clear-muscle`?pn(``):t.dataset.region&&fn(t.dataset.region))});var _n=e=>{let t=K.querySelector(`svg`);t&&Ae(t,e.target.closest?.(`[data-region]`)?.dataset.region??null)};gn.addEventListener(`pointerover`,_n),gn.addEventListener(`focusin`,_n);var vn=()=>K.querySelector(`svg`)&&Ae(K.querySelector(`svg`),null);gn.addEventListener(`pointerleave`,vn),gn.addEventListener(`focusout`,vn);function J(e,{action:t=``,onAction:n=null}={}){let r=v(`#toasts`),i=document.createElement(`div`);i.className=`toast`,i.innerHTML=`<span class="toast__text">${b(e)}</span>${t?`<button type="button" class="toast__action">${b(t)}</button>`:``}`;let a=0,o=()=>{clearTimeout(a),i.classList.add(`is-leaving`),setTimeout(()=>i.remove(),180)};for(i.querySelector(`.toast__action`)?.addEventListener(`click`,()=>{n?.(),o()}),i.addEventListener(`pointerenter`,()=>clearTimeout(a)),i.addEventListener(`pointerleave`,()=>a=setTimeout(o,2500)),i.addEventListener(`focusin`,()=>clearTimeout(a)),r.append(i);r.children.length>3;)r.firstElementChild.remove();a=setTimeout(o,t?6e3:3500)}function yn(e=[]){let t=Date.now(),n={id:re(),name:`New workout`,items:e,createdAt:t,updatedAt:t};return O.routines.push(n),M(),n}async function bn({routine:e=null,from:t=null}={}){if(O.active&&!await $({title:`A workout is already in progress`,text:`Discard “${O.active.name}” and start a new one? Its sets will not be saved.`,ok:`Discard and start`})){V(`#/session`);return}let n=[];e?n=e.items.map(e=>({ex:e.ex,rest:e.rest,goal:`${e.sets} × ${e.reps}`,sets:gt(e.sets)})):t&&(n=t.items.map(e=>({ex:e.ex,rest:e.rest??90,goal:null,sets:gt(e.sets.length||3)}))),O.active={id:re(),routineId:e?.id??t?.routineId??null,name:e?.name??t?.name??`Workout`,startedAt:Date.now(),endedAt:null,items:n},M(),kn(),V(`#/session`),D(`${O.active.name} started.`)}async function xn(){let e=O.active;if(!e)return;let t=e.items.reduce((e,t)=>e+g(t).length,0),n=e.items.reduce((e,t)=>e+t.sets.filter(e=>!e.done&&(e.kg!=null||e.reps!=null)).length,0);if(!t){await $({title:`No sets are checked off`,text:`Only checked sets are saved, so there is nothing to save yet. Discard this workout?`,ok:`Discard`})&&Sn();return}if(n&&!await $({title:`${n} ${n===1?`set is`:`sets are`} not checked off`,text:`Only checked sets are saved. Finish anyway?`,ok:`Finish`,danger:!1}))return;let r={...e,endedAt:Date.now(),items:e.items.map(e=>({...e,sets:g(e)})).filter(e=>e.sets.length)};O.sessions.unshift(r),O.active=null,M(),kn(),j.justFinished=r.id,V(`#/log/${r.id}`),D(`Workout saved.`)}function Sn(){O.active=null,M(),kn(),V(`#/`),D(`Workout discarded.`)}var Cn=()=>j.route.view===`editor`?L(j.route.id)?.items:j.route.view===`session`?O.active?.items:null;function Y(){j.route.view===`editor`&&_t(L(j.route.id)),M(),H()}function wn(e,t){let n=O.active?.items[e],r=n?.sets[t];if(r){if(!r.done){let i=Fe(O.sessions,n.ex,O.active.id)?.sets[t];if(r.kg==null&&i?.kg!=null&&(r.kg=i.kg),r.reps==null&&i?.reps!=null&&(r.reps=i.reps),r.reps==null){D(`Enter the reps first.`),document.getElementById(`s-${e}-${t}-reps`)?.focus();return}}r.done=!r.done,M(),H(),r.done&&(D(`Set ${t+1} done.`),O.active.items.some(e=>e.sets.some(e=>!e.done))&&On(n.rest))}}function Tn(e,t){let n=m(t);if(e===`session`&&O.active)O.active.items.push({ex:t,rest:90,goal:null,sets:gt(3)}),M(),J(`${n} added to the workout in progress.`,{action:`Open`,onAction:()=>V(`#/session`)});else if(e===`new`){let e=yn([{ex:t,sets:3,reps:`8-12`,rest:90}]);j.focusName=!0,V(`#/workout/${e.id}`),D(`New workout with ${n}.`)}else{let r=L(e);if(!r)return;r.items.push({ex:t,sets:3,reps:`8-12`,rest:90}),_t(r),M(),J(`${n} added to ${r.name}.`,{action:`Open`,onAction:()=>V(`#/workout/${r.id}`)})}for(let e of y(`details.menu[open]`))e.open=!1}async function En(e){let t=e.dataset.action,n=Number(e.closest(`[data-index]`)?.dataset.index),r=e.dataset.id,i=Cn();switch(t){case`new-routine`:j.focusName=!0,V(`#/workout/${yn().id}`);break;case`start-empty`:bn();break;case`start-routine`:{let e=L(r);e?.items.length&&bn({routine:e});break}case`delete-routine`:{let e=L(r);if(!e)break;let t=O.routines.indexOf(e);O.routines.splice(t,1),M(),V(`#/`),J(`“${e.name}” deleted.`,{action:`Undo`,onAction:()=>{O.routines.splice(t,0,e),M(),H(),document.getElementById(`start-${e.id}`)?.focus(),D(`${e.name} restored.`)}});break}case`pick`:Nn({mode:j.route.view===`session`?`session`:`routine`});break;case`info`:Nn({mode:`browse`,detail:e.dataset.ex,read:!0});break;case`sets-up`:case`sets-down`:{let e=i?.[n];if(!e)break;e.sets=Math.min(20,Math.max(1,e.sets+(t===`sets-up`?1:-1))),Y();break}case`move-up`:case`move-down`:{let e=n+(t===`move-up`?-1:1);if(!i||e<0||e>=i.length)break;[i[n],i[e]]=[i[e],i[n]],Y();let r=j.route.view===`session`?`log`:`item`,[a,o]=t===`move-up`?[`up`,`down`]:[`down`,`up`];[a,o,`name`].map(t=>document.getElementById(`${r}-${e}-${t}`)).find(e=>e&&!e.disabled)?.focus(),D(`Moved to position ${e+1}.`);break}case`remove-item`:{let e=i?.[n];if(!e)break;let t=j.route.view===`session`?`log`:`item`;i.splice(n,1),Y(),[`${t}-${n}-remove`,`${t}-${n-1}-remove`,`add-exercises`].map(e=>document.getElementById(e)).find(Boolean)?.focus(),J(`${m(e.ex)} removed.`,{action:`Undo`,onAction:()=>{let r=Cn();if(!r)return;let i=Math.min(n,r.length);r.splice(i,0,e),Y(),document.getElementById(`${t}-${i}-name`)?.focus(),D(`${m(e.ex)} is back.`)}});break}case`toggle-set`:wn(n,Number(e.dataset.set));break;case`add-set`:{let e=O.active?.items[n];if(!e)break;let t=e.sets.at(-1);e.sets.push({kg:t?.kg??null,reps:t?.reps??null,done:!1}),Y();break}case`remove-set`:{let e=O.active?.items[n];if(!e||e.sets.length<=1)break;e.sets.pop(),Y();break}case`finish`:xn();break;case`discard`:await $({title:`Discard this workout?`,text:`None of its sets will be saved.`})&&Sn();break;case`repeat`:{let e=R(r);e&&bn({from:e});break}case`save-routine`:{let e=R(r);if(!e)break;let t=yn(e.items.map(e=>({ex:e.ex,sets:e.sets.length||3,reps:String(e.sets[0]?.reps??`8-12`),rest:e.rest??90})));t.name=e.name,e.routineId=t.id,M(),V(`#/workout/${t.id}`),J(`Saved as the workout “${t.name}”.`);break}case`delete-log`:{let e=R(r);if(!e)break;let t=O.sessions.indexOf(e);O.sessions.splice(t,1),M(),V(`#/history`),J(`Session deleted.`,{action:`Undo`,onAction:()=>{O.sessions.splice(t,0,e),M(),H(),D(`Session restored.`)}});break}case`more`:{let e=j.library.limit;j.library.limit+=A,G(),y(`#lib-list .ex-row`)[e]?.focus();break}case`add-to`:Tn(e.dataset.target,e.dataset.ex);break;case`clear-filter`:e.dataset.filter===`muscle`?pn(``):(j.library.equipment=``,v(`#lib-equipment`).value=``,j.library.limit=A,G(),D(W(Wt().length,j.library.muscle))),(v(`#lib-active .filter-chip`)??v(`#lib-search`))?.focus();break;case`all-bests`:j.showAllBests=!j.showAllBests,H(),v(`#all-bests`)?.focus();break;case`rest-less`:X.end-=15e3,An();break;case`rest-more`:X.end+=15e3,X.total+=15e3,An();break;case`rest-skip`:kn()}}for(let e of[C,qe])e.addEventListener(`click`,e=>{let t=e.target.closest(`[data-action]`);t&&!t.disabled&&t.tagName!==`A`&&En(t)});document.addEventListener(`click`,e=>{for(let t of y(`details.menu[open]`))t.contains(e.target)||(t.open=!1)}),document.addEventListener(`keydown`,e=>{if(e.key!==`Escape`)return;let t=e.target.closest?.(`details.menu[open]`);t&&(t.open=!1,t.querySelector(`summary`).focus())}),C.addEventListener(`click`,e=>{let t=e.target.closest?.(`[data-week-map] .bm-muscle`)?.dataset.region;t&&V(`#/exercises/${t}`)}),C.addEventListener(`input`,e=>{if(e.target.id===`lib-search`){j.library.query=e.target.value,j.library.limit=A,G();return}let t=e.target.closest(`[data-bind]`);if(!t)return;let n=Number(t.closest(`[data-index]`)?.dataset.index),r=t.value;switch(t.dataset.bind){case`routine-name`:{let e=L(j.route.id);if(!e)return;e.name=r.slice(0,60),_t(e),dn();break}case`reps`:{let e=L(j.route.id)?.items[n];e&&(e.reps=r.slice(0,12));break}case`session-name`:O.active&&(O.active.name=r.slice(0,60));break;case`kg`:case`set-reps`:{let e=O.active?.items[n]?.sets[Number(t.dataset.set)];if(!e)return;let i=rt(r);t.dataset.bind===`kg`?e.kg=i==null?null:Math.min(2e3,et(i)):e.reps=i==null?null:Math.min(1e3,Math.round(i));break}default:return}Ze()}),C.addEventListener(`change`,e=>{if(e.target.id===`lib-muscle`){pn(e.target.value);return}if(e.target.id===`lib-equipment`){j.library.equipment=e.target.value,j.library.limit=A,G(),D(W(Wt().length,j.library.muscle));return}let t=e.target.closest(`[data-bind]`);if(!t)return;let n=Number(t.closest(`[data-index]`)?.dataset.index);if(t.dataset.bind===`rest`){let e=L(j.route.id)?.items[n];e&&(e.rest=Number(t.value)||90),_t(L(j.route.id)),M();let r=L(j.route.id),i=v(`#editor-meta`);i&&r&&(i.textContent=`${I(r.items.length,`exercise`)} · ${I(r.items.reduce((e,t)=>e+t.sets,0),`set`)} · about ${yt(r)} min`)}else if(t.dataset.bind===`routine-name`&&!t.value.trim()){let e=L(j.route.id);e&&(e.name=t.value=`New workout`),M()}else t.dataset.bind===`session-name`&&!t.value.trim()&&O.active&&(O.active.name=t.value=`Workout`,M())}),C.addEventListener(`keydown`,e=>{e.target.id===`lib-search`&&e.key===`Enter`&&(e.preventDefault(),v(`#lib-list .ex-row`)?.click())});function Dn(){if(!O.active)return;let e=pt(Date.now()-O.active.startedAt),t=v(`#timer`);t&&(t.textContent=e);let n=v(`#active-time`);n&&(n.textContent=e)}setInterval(Dn,1e3);var X={end:0,total:0,interval:0,over:0};function On(e){e&&(clearTimeout(X.over),X.total=e*1e3,X.end=Date.now()+X.total,clearInterval(X.interval),X.interval=setInterval(An,250),An())}function kn(){clearInterval(X.interval),clearTimeout(X.over),X.end=0;let e=v(`#rest`);e&&(e.hidden=!0)}function An(){let e=v(`#rest`),t=X.end-Date.now();X.end&&(t<=0?(clearInterval(X.interval),X.end=0,e&&(e.classList.add(`is-over`),v(`#rest-time`).textContent=`Go`,v(`#rest-fill`).style.transform=`scaleX(0)`),navigator.vibrate?.(200),D(`Rest over. Time for the next set.`),X.over=setTimeout(()=>v(`#rest`)&&(v(`#rest`).hidden=!0),4e3)):e&&(e.hidden=!1,e.classList.remove(`is-over`),v(`#rest-time`).textContent=pt(t+999),v(`#rest-fill`).style.transform=`scaleX(${Math.min(1,t/X.total)})`))}var Z={mode:`routine`,query:``,muscle:``,equipment:``,limit:A,detail:null,read:!1,selected:[],scroll:0};function jn(){v(`#picker-muscle`).innerHTML=Bt(``),v(`#picker-equipment`).innerHTML=Vt(``)}var Mn=()=>_e(k,Z.query,Ut(Z));function Nn({mode:e=`routine`,muscle:t=``,detail:n=null,read:r=!1}={}){Object.assign(Z,{mode:e,query:``,muscle:t,equipment:``,limit:A,detail:n,read:r,selected:[],scroll:0}),v(`#picker-search`).value=``,v(`#picker-muscle`).value=t,v(`#picker-equipment`).value=``,Q(),w.open||w.showModal(),v(`#picker-body`).scrollTop=0,(n?v(`#detail-title`,w):v(`#picker-search`))?.focus()}function Q(){let e={routine:`Add exercises`,session:`Add to this workout`,browse:`Exercise`};v(`#picker-title`).textContent=Z.read?`Exercise`:e[Z.mode];let t=Z.detail?z(Z.detail):null;if(v(`#picker-filters`).hidden=!!t,v(`#picker-count`).hidden=v(`#picker-list`).hidden=!!t,v(`#picker-detail`).hidden=!t,t)v(`#picker-detail`).innerHTML=Fn(t),an(t,v(`#picker-detail`));else{let e=Mn(),t=e.slice(0,Z.limit);v(`#picker-count`).textContent=W(e.length,Z.muscle),v(`#picker-list`).innerHTML=t.map(Pn).join(``)+(e.length>t.length?`<li class="list-more"><button type="button" class="btn btn--ghost" data-action="more">Show ${Math.min(A,e.length-t.length)} more</button></li>`:``)+(e.length?``:`<li class="list-none">No exercise matches. Try fewer words, or clear the muscle and equipment filters.</li>`)}let n=Z.selected.length;v(`.picker__foot`).hidden=Z.read,v(`#picker-picked`).textContent=n?`${n} selected`:`Select the exercises to add.`;let r=v(`#picker-done`);r.disabled=!n,r.textContent=n?`Add ${n}`:`Add`}function Pn(e){let t=Z.selected.includes(e.id);return`<li class="pick-row${t?` is-selected`:``}">
    <button type="button" class="ex-row" data-action="detail" data-ex="${e.id}" id="pick-${e.id}"><span class="ex-row__text"><b>${b(e.title)}</b><span>${b(r(e.target))} · ${b(i(e.equipment))}</span></span></button>
    <button type="button" class="pick-row__toggle" data-action="toggle-pick" data-ex="${e.id}" id="toggle-${e.id}" aria-pressed="${t}" aria-label="Select ${b(e.title)}">${x(t?`check`:`plus`)}</button>
  </li>`}function Fn(e){let t=Z.selected.includes(e.id),n=Re(O.sessions,e.id).slice(-12),a=Ie(O.sessions,e.id);return`<article class="ex-detail" aria-labelledby="detail-title">
    ${Z.read?``:`<button type="button" class="back" data-action="detail-back">${x(`chevron-left`)}All exercises</button>`}
    <h3 class="ex-detail__title" id="detail-title" tabindex="-1">${b(e.title)}</h3>
    <p class="ex-detail__sub">${b(r(e.target))} · ${b(i(e.equipment))}</p>
    <div class="ex-detail__figure ex-detail__figure--small" data-figure-for="${e.id}"></div>
    <h4 class="section-title">How to do it</h4>
    <ol class="ex-steps">${e.steps.map(e=>`<li><span>${b(e)}</span></li>`).join(``)}</ol>
    ${n.length&&a?`<h4 class="section-title">Your progress</h4>${Ge(n,{weight:P,unit:N(),esc:b})}<p class="ex-detail__sub">Best set: ${b(F(a))}</p>`:``}
    ${Z.read?``:`<button type="button" class="btn ${t?`btn--selected`:`btn--gold`} btn--wide" data-action="toggle-pick" data-ex="${e.id}" id="detail-toggle" aria-pressed="${t}">${x(t?`check`:`plus`)}${t?`Selected`:`Select`}</button>`}
  </article>`}function In(){let e=[...Z.selected];if(!e.length)return;let t=null;if(Z.mode===`routine`){let n=L(j.route.id);if(!n)return;t=`item-${n.items.length}-name`,n.items.push(...e.map(e=>({ex:e,sets:3,reps:`8-12`,rest:90}))),_t(n)}else if(Z.mode===`session`&&O.active)t=`s-${O.active.items.length}-0-kg`,O.active.items.push(...e.map(e=>({ex:e,rest:90,goal:null,sets:gt(3)})));else return;Z.selected=[],M(),w.close(),H(),document.getElementById(t)?.focus(),J(`${I(e.length,`exercise`)} added.`)}async function Ln(){(!Z.selected.length||Z.read||await $({title:`Discard ${I(Z.selected.length,`selected exercise`)}?`,text:`They have not been added to the workout yet.`,ok:`Discard`}))&&(Z.selected=[],w.close())}v(`#picker-search`).addEventListener(`input`,e=>{Z.query=e.target.value,Z.limit=A,Q(),v(`#picker-body`).scrollTop=0}),v(`#picker-search`).addEventListener(`keydown`,e=>{e.key===`Enter`&&(e.preventDefault(),v(`#picker-list .ex-row`)?.click())});for(let e of[`#picker-muscle`,`#picker-equipment`])v(e).addEventListener(`change`,()=>{Z.muscle=v(`#picker-muscle`).value,Z.equipment=v(`#picker-equipment`).value,Z.limit=A,Q(),v(`#picker-body`).scrollTop=0});w.addEventListener(`cancel`,e=>{e.preventDefault(),Ln()}),w.addEventListener(`click`,e=>{if(e.target===w){Ln();return}let t=e.target.closest(`[data-action]`);if(!t||t.disabled)return;let n=t.dataset.ex;switch(t.dataset.action){case`close-picker`:Ln();break;case`detail`:Z.scroll=v(`#picker-body`).scrollTop,Z.detail=n,Q(),v(`#picker-body`).scrollTop=0,v(`#detail-title`,w)?.focus();break;case`detail-back`:{let e=Z.detail;Z.detail=null,Q(),v(`#picker-body`).scrollTop=Z.scroll,document.getElementById(`pick-${e}`)?.focus({preventScroll:!0});break}case`toggle-pick`:{let e=Z.selected.indexOf(n);e>=0?Z.selected.splice(e,1):Z.selected.push(n);let t=v(`#picker-body`).scrollTop;Q(),v(`#picker-body`).scrollTop=t,document.getElementById(Z.detail?`detail-toggle`:`toggle-${n}`)?.focus({preventScroll:!0}),D(`${m(n)} ${e>=0?`unselected`:`selected`}. ${Z.selected.length} selected.`);break}case`more`:{let e=Z.limit;Z.limit+=A,Q(),y(`#picker-list .ex-row`)[e]?.focus();break}case`picker-done`:In()}});function Rn(){for(let e of y(`[data-unit]`,T))e.setAttribute(`aria-pressed`,String(e.dataset.unit===N()));for(let e of y(`[data-figure]`,T))e.setAttribute(`aria-pressed`,String(e.dataset.figure===O.settings.figure));for(let e of y(`[aria-pressed]`,T))e.classList.toggle(`is-active`,e.getAttribute(`aria-pressed`)===`true`)}v(`#open-settings`).addEventListener(`click`,()=>{Rn(),T.showModal()}),T.addEventListener(`click`,e=>{if(e.target===T){T.close();return}let t=e.target.closest(`button`);t&&(t.dataset.action===`close-settings`?T.close():t.dataset.unit?(O.settings.unit=t.dataset.unit===`lb`?`lb`:`kg`,M(),Rn(),H(),D(O.settings.unit===`lb`?`Weights in pounds.`:`Weights in kilograms.`)):t.dataset.figure?(O.settings.figure=t.dataset.figure===`female`?`female`:`male`,M(),Rn(),H(),D(`Body map shows the ${O.settings.figure} figure.`)):t.dataset.action===`backup`?zn():t.dataset.action===`restore`&&v(`#restore-file`).click())});function $({title:e,text:t,ok:n=`Delete`,danger:r=!0}){let i=v(`#confirm`);v(`#confirm-title`).textContent=e,v(`#confirm-text`).textContent=t;let a=v(`#confirm-ok`);return a.textContent=n,a.className=`btn ${r?`btn--danger`:`btn--gold`}`,i.returnValue=``,i.showModal(),v(`#confirm-cancel`).focus(),new Promise(e=>i.addEventListener(`close`,()=>e(i.returnValue===`ok`),{once:!0}))}function zn(){let e=URL.createObjectURL(de(O)),t=document.createElement(`a`);t.href=e,t.download=`first-rep-workouts-${new Date().toISOString().slice(0,10)}.json`,document.body.append(t),t.click(),t.remove(),setTimeout(()=>URL.revokeObjectURL(e),2e3),J(`Backup file saved.`)}v(`#restore-file`).addEventListener(`change`,async e=>{let t=e.target.files[0];if(e.target.value=``,t)try{let e=await fe(t);if(!await $({title:`Restore this backup?`,text:`It holds ${I(e.routines.length,`workout`)} and ${I(e.sessions.length,`logged session`)}. They replace everything saved in this browser now.`,ok:`Replace`}))return;O=e,M(),kn(),T.close(),V(`#/`),J(`Backup restored.`)}catch(e){T.close(),j.notice=e.message,V(`#/`)}}),addEventListener(`storage`,e=>{e.key===`firstrep.training.v1`&&(O=te(),H())}),Promise.all([he(),ye()]).then(([e,t])=>{k=e,Ye=t,jn(),H()}).catch(e=>{console.error(`The exercise list could not load:`,e),C.innerHTML=`<p class="desk__loading">The exercise list could not load. Check your connection and reload the page.</p>`});