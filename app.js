const el = id => document.getElementById(id);
const weatherCodes = {0:['Clear sky','☀'],1:['Mostly clear','⛅'],2:['Partly cloudy','⛅'],3:['Overcast','☁'],45:['Foggy','〰'],48:['Foggy','〰'],51:['Light drizzle','🌦'],53:['Drizzle','🌦'],55:['Heavy drizzle','🌧'],61:['Light rain','🌦'],63:['Rain','🌧'],65:['Heavy rain','🌧'],71:['Light snow','❄'],73:['Snow','❄'],75:['Heavy snow','❄'],80:['Rain showers','🌦'],81:['Rain showers','🌧'],82:['Heavy showers','🌧'],95:['Thunderstorm','⚡']};
let state = {timezone:'auto'};
const savedTheme = localStorage.getItem('weatherly-theme');
if (savedTheme === 'dark') document.body.classList.add('dark');
function updateThemeButton(){const dark=document.body.classList.contains('dark');el('theme-toggle').textContent=dark?'○ Light UI':'◐ Dark UI';el('theme-toggle').setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');}
el('theme-toggle').addEventListener('click',()=>{const dark=document.body.classList.toggle('dark');localStorage.setItem('weatherly-theme',dark?'dark':'light');updateThemeButton();});
updateThemeButton();
const fmt = (date, options, tz=state.timezone) => new Intl.DateTimeFormat('en-US',{timeZone:tz,...options}).format(new Date(date));
function icon(code){return weatherCodes[code] || ['Cloudy','☁'];}
function render(data, place){
  const c=data.current, d=data.daily, info=icon(c.weather_code);
  state.timezone=data.timezone;
  el('place-name').textContent=place;
  el('condition-line').textContent=info[0]; el('weather-icon').textContent=info[1];
  el('temperature').textContent=Math.round(c.temperature_2m); el('feels-like').textContent=`${Math.round(c.apparent_temperature)}°`;
  el('humidity').textContent=`${c.relative_humidity_2m}%`; el('wind').textContent=`${Math.round(c.wind_speed_10m)} km/h`; el('rain').textContent=`${c.precipitation} mm`;
  el('sunrise').textContent=fmt(d.sunrise[0],{hour:'numeric',minute:'2-digit'}); el('sunset').textContent=fmt(d.sunset[0],{hour:'numeric',minute:'2-digit'});
  el('timezone').textContent=data.timezone.replaceAll('_',' '); el('utc-offset').textContent=`UTC ${data.utc_offset_seconds/3600>=0?'+':''}${data.utc_offset_seconds/3600}`;
  el('date-line').textContent=fmt(Date.now(),{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  const forecast=el('forecast');forecast.innerHTML='';
  d.time.forEach((date,i)=>{const node=el('day-template').content.cloneNode(true);node.querySelector('.day-name').textContent=i===0?'Today':fmt(date,{weekday:'short'});node.querySelector('.day-icon').textContent=icon(d.weather_code[i])[1];node.querySelector('.day-high').textContent=`${Math.round(d.temperature_2m_max[i])}°`;node.querySelector('.day-low').textContent=`${Math.round(d.temperature_2m_min[i])}°`;forecast.append(node);});
  updateClock();
}
function updateClock(){if(!state.timezone)return;el('clock').textContent=fmt(Date.now(),{hour:'2-digit',minute:'2-digit',hour12:false});}
async function load(lat,lon,place){
  el('condition-line').textContent='Updating forecast…';
  try{const url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&forecast_days=7`;const r=await fetch(url);if(!r.ok)throw Error();render(await r.json(),place);}catch{el('condition-line').textContent='Couldn’t load weather. Please try again.';}}
async function search(query){const results=el('results');if(query.length<2){results.innerHTML='';return;}try{const r=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);const data=await r.json();results.innerHTML=(data.results||[]).map(x=>`<button class="result" role="option" data-lat="${x.latitude}" data-lon="${x.longitude}" data-name="${x.name}, ${x.country_code}">${x.name}, ${x.admin1||x.country}</button>`).join('');}catch{results.innerHTML='';}}
let timer;el('city-search').addEventListener('input',e=>{clearTimeout(timer);timer=setTimeout(()=>search(e.target.value.trim()),250)});el('results').addEventListener('click',e=>{const b=e.target.closest('.result');if(!b)return;el('results').innerHTML='';el('city-search').value='';load(b.dataset.lat,b.dataset.lon,b.dataset.name)});
el('use-location').addEventListener('click',()=>navigator.geolocation?navigator.geolocation.getCurrentPosition(p=>load(p.coords.latitude,p.coords.longitude,'Your location'),()=>load(28.6139,77.209,'New Delhi, IN')):load(28.6139,77.209,'New Delhi, IN'));
load(28.6139,77.209,'New Delhi, IN');setInterval(updateClock,1000);
