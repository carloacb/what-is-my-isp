function set(id, val, active) {
  const el = document.getElementById(id);
  el.textContent = val;
  active ? el.classList.remove('muted') : el.classList.add('muted');
}

const VPN_KEYWORDS = ['vpn','nord','express','surfshark','proton','cyber','ghost','tunnel','mullvad','private','pia','ipvanish','hide','shield','secure','hosting','cloud','amazon','google','microsoft','digitalocean','linode','vultr','hetzner','ovh','datacenter','data center','server'];

function looksLikeVPN(isp) {
  if (!isp) return false;
  const lower = isp.toLowerCase();
  return VPN_KEYWORDS.some(k => lower.includes(k));
}

async function tryFetch(url) {
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

const apis = [
  {
    url: 'https://freeipapi.com/api/json',
    parse: d => ({
      ip: d.ipAddress,
      isp: d.ispName || null,
      city: d.cityName,
      region: d.regionName,
      country: d.countryName,
      timezone: d.timeZone,
      vpn: d.isProxy || d.isVpn || false,
      source: 'freeipapi.com'
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
      vpn: false,
      source: 'ipinfo.io'
    })
  },
  {
    url: 'https://ipapi.co/json/',
    parse: d => {
      if (d.error) throw new Error(d.reason || 'blocked');
      return {
        ip: d.ip,
        isp: d.org || d.asn || null,
        city: d.city,
        region: d.region,
        country: d.country_name,
        timezone: d.timezone,
        vpn: false,
        source: 'ipapi.co'
      };
    }
  },
  {
    url: 'https://api.ip.sb/geoip',
    parse: d => ({
      ip: d.ip,
      isp: d.isp || d.organization || null,
      city: d.city,
      region: d.region,
      country: d.country,
      timezone: d.timezone,
      vpn: false,
      source: 'ip.sb'
    })
  }
];

async function load() {
  const dot = document.getElementById('dot');
  dot.className = 'dot loading';
  document.getElementById('err').style.display = 'none';
  document.getElementById('vpn-banner').classList.remove('show');
  document.getElementById('src').textContent = '';
  ['isp','ip','loc'].forEach(id => set(id,'Detecting…',false));
  ['ip-sub','loc-sub','ts'].forEach(id => document.getElementById(id).textContent = '');

  let lastErr = null;
  for (const api of apis) {
    try {
      const raw = await tryFetch(api.url);
      const d = api.parse(raw);

      set('ip', d.ip || 'Unknown', true);
      document.getElementById('ip-sub').textContent = (d.ip && d.ip.includes(':')) ? 'IPv6' : 'IPv4';

      const ispVal = d.isp || 'Unknown';
      set('isp', ispVal, true);

      const city = [d.city, d.region].filter(Boolean).join(', ');
      set('loc', city || d.country || 'Unknown', true);
      const locSub = [d.country, d.timezone ? '(' + d.timezone + ')' : ''].filter(Boolean).join('  ');
      document.getElementById('loc-sub').textContent = locSub;

      if (d.vpn || looksLikeVPN(ispVal)) {
        document.getElementById('vpn-banner').classList.add('show');
      }

      dot.className = 'dot';
      document.getElementById('ts').textContent = 'Updated ' + new Date().toLocaleTimeString();
      document.getElementById('src').textContent = 'Source: ' + d.source;
      return;
    } catch(e) {
      lastErr = e;
    }
  }

  dot.className = 'dot error';
  ['isp','ip','loc'].forEach(id => set(id,'—',true));
  const eb = document.getElementById('err');
  eb.textContent = 'All sources failed. Your network or browser may be blocking external requests. ' + (lastErr?.message || '');
  eb.style.display = 'block';
}

load();