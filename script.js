function set(id, val, active) {
  const el = document.getElementById(id);
  el.textContent = val;
  if (active) el.classList.remove('muted');
  else el.classList.add('muted');
}

async function tryFetch(url) {
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

async function load() {
  const dot = document.getElementById('dot');
  dot.className = 'dot loading';
  document.getElementById('err').style.display = 'none';
  document.getElementById('src').textContent = '';
  ['isp', 'ip', 'loc'].forEach(id => set(id, 'Detecting…', false));
  ['ip-sub', 'loc-sub', 'ts'].forEach(id => document.getElementById(id).textContent = '');

  const apis = [
    {
      url: 'https://ipwho.is/',
      parse: d => ({
        ip: d.ip,
        isp: d.connection?.isp || d.connection?.org || d.connection?.asn || null,
        city: d.city,
        region: d.region,
        country: d.country,
        timezone: d.timezone?.id,
        source: 'ipwho.is'
      })
    },
    {
      url: 'https://ipinfo.io/json',
      parse: d => ({
        ip: d.ip,
        isp: d.org || null,
        city: d.city,
        region: d.region,
        country: d.country,
        timezone: d.timezone,
        source: 'ipinfo.io'
      })
    },
    {
      url: 'https://ip-api.com/json/?fields=status,message,country,regionName,city,timezone,isp,org,as,query',
      parse: d => {
        if (d.status === 'fail') throw new Error(d.message);
        return {
          ip: d.query,
          isp: d.isp || d.org || d.as || null,
          city: d.city,
          region: d.regionName,
          country: d.country,
          timezone: d.timezone,
          source: 'ip-api.com'
        };
      }
    }
  ];

  let lastErr = null;
  for (const api of apis) {
    try {
      const raw = await tryFetch(api.url);
      const d = api.parse(raw);

      set('ip', d.ip || 'Unknown', true);
      const ver = d.ip && d.ip.includes(':') ? 'IPv6' : 'IPv4';
      document.getElementById('ip-sub').textContent = ver;

      set('isp', d.isp || 'Unknown', true);

      const city = [d.city, d.region].filter(Boolean).join(', ');
      set('loc', city || d.country || 'Unknown', true);
      const locSub = [d.country, d.timezone ? '(' + d.timezone + ')' : ''].filter(Boolean).join('  ');
      document.getElementById('loc-sub').textContent = locSub;

      dot.className = 'dot';
      document.getElementById('ts').textContent = 'Updated ' + new Date().toLocaleTimeString();
      document.getElementById('src').textContent = 'Source: ' + d.source;
      return;
    } catch (e) {
      lastErr = e;
    }
  }

  dot.className = 'dot error';
  ['isp', 'ip', 'loc'].forEach(id => set(id, '—', true));
  const eb = document.getElementById('err');
  eb.textContent = 'All lookup sources failed. ' + (lastErr?.message || '') + ' — Check your connection or try again.';
  eb.style.display = 'block';
}

load();