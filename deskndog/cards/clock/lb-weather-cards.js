// lb-weather-cards.js — cardData, the detail factory
// FOR HUMANS: one widget name in → { icon, value, label, sub, pairs, tutorial }.
//   pairs + tutorial feed the big wx overlay (click a widget tile).
//   born on the old weather page (attic/clock-heroes/) — the clock face
//   tiles are the ONLY consumer now.
// FOR AI:
//   1. reads window.WX.D at CALL time (lb-clock-bars.js builds WX).
//   2. load AFTER wx-icons.js, BEFORE lb-wx-overlay.js / lb-clock-bars.js.
//   3. window.wxCardData(widget) → card object or null.
//   4. missing fields render '—'. the detail: strings are legacy (unused).

;(function () {

  const uvLabel  = v => v<=2?'Low':v<=5?'Moderate':v<=7?'High':v<=10?'Very High':'Extreme'
  const aqiLabel = v => v<=50?'Good':v<=100?'Moderate':v<=150?'Unhealthy for sensitive':v<=200?'Unhealthy':v<=300?'Very unhealthy':'Hazardous'
  const wdLabel  = d => { if(d==null)return''; const dirs=['N','NE','E','SE','S','SW','W','NW']; return dirs[Math.round(d/45)%8] }
  const row      = (k,v) => `<div class="wx-detail-row"><span class="wx-detail-key">${k}</span><span class="wx-detail-val">${v}</span></div>`
  const rt = v => v != null ? Math.round(v) : '—'
  const r1 = v => v != null ? Math.round(v * 10) / 10 : '—'

  window.wxCardData = function cardData(w) {
    const d = (window.WX && window.WX.D) || {}
    const WX_ICON = window.WX_ICON || {}
    const WX_DESC = window.WX_DESC || {}

    if (w==='weather') {
      const sky = d.cloudcover!=null ? (d.cloudcover<10?'Clear sky':d.cloudcover<30?'Mostly clear':d.cloudcover<70?'Partly cloudy':'Overcast') : ''
      const vismi = d.visibility!=null ? Math.round(d.visibility/1609) : null
      return {
        icon: WX_ICON[d.code]||'⛅', value: d.temp!=null ? rt(d.temp)+'°F' : '—',
        label: 'current conditions', sub: WX_DESC[d.code] || '',
        prose: `Feels like ${rt(d.feels)}°. ${sky}${vismi!=null?'. Visibility '+vismi+' mi':''}. ${d.isDay?'Daytime':'Nighttime'}.`,
        pairs:[
          { key:'condition', val:WX_DESC[d.code]||'—' },
          { key:'temperature', val:d.temp!=null?rt(d.temp)+'°F':'—' },
          { key:'feels like', val:d.feels!=null?rt(d.feels)+'°F':'—' },
          { key:'wind', val:d.wind!=null?rt(d.wind)+' mph '+wdLabel(d.windDir):'—' },
          { key:'rain chance', val:d.rain!=null?d.rain+'%':'—' },
        ],
        detail: row('condition',WX_DESC[d.code]||'—')
               +row('temperature',d.temp!=null?rt(d.temp)+'°F':'—')
               +row('feels like',d.feels!=null?rt(d.feels)+'°F':'—')
               +row('humidity',d.humidity!=null?rt(d.humidity)+'%':'—')
               +row('dewpoint',d.dewpoint!=null?rt(d.dewpoint)+'°F':'—')
               +row('cloud cover',d.cloudcover!=null?rt(d.cloudcover)+'%':'—')
               +row('visibility',vismi!=null?vismi+' mi':'—')
               +row('wind',d.wind!=null?rt(d.wind)+' mph '+wdLabel(d.windDir):'—')
               +row('gusts',d.windGusts!=null?rt(d.windGusts)+' mph':'—')
               +row('rain chance',d.rain!=null?d.rain+'%':'—'),
      }
    }

    if (w==='humidity') {
      const h = d.humidity
      const comfort = h==null?'—':h<30?'Dry':h<50?'Comfortable':h<60?'Moderate':'Humid'
      const note = h==null?'—':h<30?'static, dry skin, irritated sinuses':h<50?'ideal range for most people':h<60?'noticeable but tolerable':'sweat stops working, heat feels worse'
      return {
        icon:'💦', value:h!=null?rt(h)+'%':'—', label:'humidity', sub:comfort,
        pairs:[
          { key:'relative humidity', val:h!=null?rt(h)+'%':'—' },
          { key:'comfort level', val:comfort },
          { key:'note', val:note },
        ],
        tutorial:[
          'relative humidity — how much water the air holds vs. how much it can hold',
          '<strong>30–50%</strong> — ideal. comfortable for most people indoors and out.',
          '<strong>below 30%</strong> — dry. static electricity, cracked lips, irritated sinuses.',
          '<strong>above 60%</strong> — humid. sweat stops working. heat index spikes.',
        ],
        detail:row('humidity',h!=null?rt(h)+'%':'—')+row('comfort level',comfort)+row('note',note),
      }
    }

    if (w==='dewpoint') {
      const dp   = d.dewpoint
      const feel = dp==null?'—':dp<35?'Very dry — static, cracked lips':dp<45?'Dry and crisp':dp<55?'Comfortable':dp<60?'Noticeable moisture':dp<65?'Sticky — most people uncomfortable':dp<70?'Oppressive':'Tropical. Sweating gives no relief.'
      const fog  = dp!=null&&d.temp!=null ? (Math.abs(dp-d.temp)<4 ? 'Possible — air near saturation' : dp>=d.temp ? 'Likely — air at or past dew point' : 'Unlikely') : '—'
      return {
        icon:'💧', value:dp!=null?rt(dp)+'°F':'—',
        label:'dew point', sub:dp!=null?(dp<45?'Dry':dp<55?'Comfortable':dp<65?'Sticky':'Oppressive'):'',
        prose:'why it matters — relative humidity changes as temp rises. dew point stays fixed. your body always feels the dew point.',
        pairs:[
          { key:'dew point', val:dp!=null?rt(dp)+'°F':'—' },
          { key:'how it feels', val:feel },
          { key:'fog / dew risk', val:fog },
        ],
        tutorial:[
          'unlike humidity %, dew point stays fixed as temp rises — it\'s absolute',
          'your body always feels the dew point, not the relative humidity',
          '<strong>below 35°F</strong> — very dry. static, cracked lips, dry eyes.',
          '<strong>35–55°F</strong> — comfortable range. most people feel fine.',
          '<strong>55–65°F</strong> — noticeable moisture. sticky feeling starts.',
          '<strong>above 65°F</strong> — oppressive. sweating gives no relief.',
          '<strong>fog</strong> — forms when dew point and temp are within ~4°F of each other.',
        ],
        detail: row('dew point', dp!=null?rt(dp)+'°F':'—')
              + row('how it feels', feel)
              + row('fog / dew risk', fog),
      }
    }

    if (w==='feels') {
      const diff   = d.feels!=null&&d.temp!=null ? d.feels-d.temp : null
      const diffRt = diff!=null ? Math.round(Math.abs(diff)) : 0
      const why    = diff==null?'':diff<-3?`Wind and humidity make it ${diffRt}° cooler than the thermometer.`:diff>3?`Humidity makes it ${diffRt}° warmer than the thermometer.`:'Feels close to the actual temperature.'
      const diffStr = diff!=null?(diff>0?'+':'')+Math.round(diff)+'°':'—'
      return {
        icon:'🌡', value:d.feels!=null?rt(d.feels)+'°F':'—', label:'feels like',
        sub:diff!=null?(diff>0?'+':'')+Math.round(diff)+'° from actual':'', prose:why,
        pairs:[
          { key:'feels like', val:d.feels!=null?rt(d.feels)+'°F':'—' },
          { key:'actual temp', val:d.temp!=null?rt(d.temp)+'°F':'—' },
          { key:'difference', val:diffStr },
        ],
        tutorial:[
          'the thermometer reads air temperature',
          'your body reads heat transfer — not the same number',
          '<strong>wind</strong> — strips the warm layer your body builds. cold feels colder.',
          '<strong>humidity</strong> — slows sweat evaporation. hot feels hotter.',
          '<strong>the number</strong> — what temp would feel like with no wind, no humidity.',
        ],
        detail:row('feels like',d.feels!=null?rt(d.feels)+'°F':'—')
              +row('actual temp',d.temp!=null?rt(d.temp)+'°F':'—')
              +row('difference',diffStr),
      }
    }

    if (w==='wind') {
      const bft = d.wind==null?'—':d.wind<1?'Calm':d.wind<4?'Light air':d.wind<8?'Light breeze':d.wind<13?'Gentle breeze':d.wind<19?'Moderate breeze':d.wind<25?'Fresh breeze':'Strong breeze'
      return {
        icon:'🌬️', value:d.wind!=null?rt(d.wind)+' mph':'—', label:'wind', sub:bft,
        pairs:[
          { key:'wind speed', val:d.wind!=null?rt(d.wind)+' mph':'—' },
          { key:'direction', val:wdLabel(d.windDir)||'—' },
          { key:'description', val:bft },
        ],
        tutorial:[
          'Beaufort scale: 0 Calm → 3 Gentle → 6 Strong breeze → 9 Severe gale → 12 Hurricane',
          '<strong>wind chill</strong> — moving air strips the warm layer your body builds.',
          'wind chill only applies below ~50°F — above that, wind just feels refreshing.',
        ],
        detail:row('wind speed',d.wind!=null?rt(d.wind)+' mph':'—')
              +row('direction',wdLabel(d.windDir))
              +row('description',bft),
      }
    }

    if (w==='gusts') {
      return {
        icon:'🌬️', value:d.windGusts!=null?rt(d.windGusts)+' mph':'—', label:'gusts',
        pairs:[
          { key:'gust speed', val:d.windGusts!=null?rt(d.windGusts)+' mph':'—' },
          { key:'sustained', val:d.wind!=null?rt(d.wind)+' mph':'—' },
          { key:'direction', val:wdLabel(d.windDir)||'—' },
        ],
        detail:row('gust speed',d.windGusts!=null?rt(d.windGusts)+' mph':'—')
              +row('sustained',d.wind!=null?rt(d.wind)+' mph':'—')
              +row('direction',wdLabel(d.windDir)),
      }
    }

    if (w==='rain') {
      return {
        icon:'🌧️', value:d.rain!=null?d.rain+'%':'—', label:'rain chance',
        pairs:[
          { key:'rain chance', val:d.rain!=null?d.rain+'%':'—' },
          { key:'precip total', val:d.precipSum!=null?r1(d.precipSum)+' in':'—' },
        ],
        detail:row('rain chance today',d.rain!=null?d.rain+'%':'—')
              +row('precip total',d.precipSum!=null?r1(d.precipSum)+' in':'—'),
      }
    }

    if (w==='pressure') {
      const trend = d.pressure==null?'—':d.pressure>1020?'High — stable, clear weather likely':d.pressure<1000?'Low — unsettled, possible storms':'Normal range'
      return {
        icon:'🌡', value:d.pressure!=null?rt(d.pressure)+' hPa':'—', label:'pressure', sub:trend,
        pairs:[
          { key:'pressure hPa', val:d.pressure!=null?rt(d.pressure)+' hPa':'—' },
          { key:'trend', val:trend },
        ],
        tutorial:[
          '<strong>high pressure</strong> — stable, clear skies, settled weather.',
          '<strong>low pressure</strong> — unsettled, clouds, possible storms.',
          '<strong>falling pressure</strong> — weather is about to change. watch for clouds.',
        ],
        detail:row('pressure',d.pressure!=null?rt(d.pressure)+' hPa':'—')+row('trend',trend),
      }
    }

    if (w==='uv') {
      const lbl = d.uv!=null ? uvLabel(d.uv) : '—'
      return {
        icon:'☀️', value:d.uv!=null?String(rt(d.uv)):'—', label:'UV index', sub:lbl,
        pairs:[
          { key:'UV index', val:d.uv!=null?String(rt(d.uv)):'—' },
          { key:'level', val:lbl },
          { key:'UV clear sky', val:d.uvClear!=null?String(rt(d.uvClear)):'—' },
        ],
        tutorial:[
          '<strong>0–2</strong> — Low. No protection needed.',
          '<strong>3–5</strong> — Moderate. Sunscreen on exposed skin.',
          '<strong>6–7</strong> — High. Limit midday exposure.',
          '<strong>8–10</strong> — Very High. Cover up, seek shade.',
          '<strong>11+</strong> — Extreme. Avoid sun at peak hours.',
        ],
        detail:row('UV index',d.uv!=null?String(rt(d.uv)):'—')+row('level',lbl)+row('UV (clear sky)',d.uvClear!=null?String(rt(d.uvClear)):'—'),
      }
    }

    if (w==='uv-peak') {
      return {
        icon:'☀️', value:d.uvPeakVal!=null?String(rt(d.uvPeakVal)):'—', label:'UV peak',
        pairs:[
          { key:'peak UV today', val:d.uvPeakVal!=null?String(rt(d.uvPeakVal)):'—' },
          { key:'peak time', val:d.uvPeakHour||'—' },
        ],
        detail:row('peak UV today',d.uvPeakVal!=null?String(rt(d.uvPeakVal)):'—')+row('peak time',d.uvPeakHour||'—'),
      }
    }


    if (w==='cloudcover') {
      const sky = d.cloudcover!=null?(d.cloudcover<10?'Clear sky':d.cloudcover<30?'Mostly clear':d.cloudcover<70?'Partly cloudy':'Overcast'):'—'
      return {
        icon:'🌤️', value:d.cloudcover!=null?rt(d.cloudcover)+'%':'—', label:'cloud cover', sub:sky,
        pairs:[
          { key:'cloud cover', val:d.cloudcover!=null?rt(d.cloudcover)+'%':'—' },
          { key:'description', val:sky },
        ],
        detail:row('cloud cover',d.cloudcover!=null?rt(d.cloudcover)+'%':'—')+row('description',sky),
      }
    }

    if (w==='visibility') {
      const mi = d.visibility!=null ? Math.round(d.visibility/1609) : null
      return {
        icon:'👁', value:mi!=null?mi+' mi':'—', label:'visibility',
        pairs:[
          { key:'visibility mi', val:mi!=null?mi+' mi':'—' },
          { key:'visibility m', val:d.visibility!=null?rt(d.visibility)+' m':'—' },
        ],
        detail:row('visibility',mi!=null?mi+' mi':'—')+row('in meters',d.visibility!=null?rt(d.visibility)+' m':'—'),
      }
    }

    if (w==='aqi') {
      const lbl = d.aqi!=null ? aqiLabel(d.aqi) : '—'
      return {
        icon:'🫁', value:d.aqi!=null?String(rt(d.aqi)):'—', label:'AQI', sub:lbl,
        pairs:[
          { key:'US AQI', val:d.aqi!=null?String(rt(d.aqi)):'—' },
          { key:'level', val:lbl },
          { key:'EU AQI', val:d.aqiEU!=null?String(rt(d.aqiEU)):'—' },
        ],
        tutorial:[
          '<strong>0–50</strong> — Good. Air quality satisfactory.',
          '<strong>51–100</strong> — Moderate. Sensitive groups take care.',
          '<strong>101–150</strong> — Unhealthy for sensitive groups.',
          '<strong>151–200</strong> — Unhealthy. Everyone may be affected.',
          '<strong>201–300</strong> — Very Unhealthy. Health alert.',
          '<strong>301+</strong> — Hazardous. Emergency conditions.',
        ],
        detail:row('US AQI',d.aqi!=null?String(rt(d.aqi)):'—')+row('level',lbl)+row('EU AQI',d.aqiEU!=null?String(rt(d.aqiEU)):'—'),
      }
    }

    if (w==='pm25') {
      return {
        icon:'🫯', value:d.pm25!=null?r1(d.pm25)+' µg':'—', label:'PM 2.5',
        pairs:[
          { key:'PM 2.5', val:d.pm25!=null?r1(d.pm25)+' µg/m³':'—' },
          { key:'safe limit', val:'12 µg/m³ EPA' },
        ],
        tutorial:[
          'fine particles 2.5 microns — small enough to enter the lungs deeply',
          'main sources: vehicle exhaust, wildfires, industrial combustion',
          '<strong>biggest health risk</strong> of all common air pollutants',
          'long-term exposure linked to heart and lung disease',
        ],
        detail:row('PM 2.5',d.pm25!=null?r1(d.pm25)+' µg/m³':'—')+row('safe limit','12 µg/m³ (annual EPA)'),
      }
    }

    if (w==='pm10') {
      return {
        icon:'🫯', value:d.pm10!=null?r1(d.pm10)+' µg':'—', label:'PM 10',
        pairs:[
          { key:'PM 10', val:d.pm10!=null?r1(d.pm10)+' µg/m³':'—' },
          { key:'safe limit', val:'50 µg/m³ EPA' },
        ],
        detail:row('PM 10',d.pm10!=null?r1(d.pm10)+' µg/m³':'—')+row('safe limit','50 µg/m³ (daily EPA)'),
      }
    }

    if (w==='ozone') {
      return {
        icon:'O₃', value:d.ozone!=null?rt(d.ozone)+' µg':'—', label:'O3',
        pairs:[
          { key:'ozone µg/m³', val:d.ozone!=null?rt(d.ozone)+' µg/m³':'—' },
        ],
        detail:row('ozone',d.ozone!=null?rt(d.ozone)+' µg/m³':'—'),
      }
    }

    if (w==='dust') {
      return {
        icon:'💨', value:d.dust!=null?rt(d.dust)+' µg':'—', label:'dust',
        pairs:[
          { key:'dust µg/m³', val:d.dust!=null?rt(d.dust)+' µg/m³':'—' },
        ],
        detail:row('dust',d.dust!=null?rt(d.dust)+' µg/m³':'—'),
      }
    }

    if (w==='solar') {
      // clock page has no precomputed dayLen — derive from the H:MM strings (fmtClock is 24h)
      const dayLen = d.dayLen || (() => {
        try {
          const p = s => { const m = String(s).match(/^(\d{1,2}):(\d{2})$/); return m ? (+m[1])*60 + (+m[2]) : null }
          const r = p(d.sunrise), st = p(d.sunset)
          if (r == null || st == null || st <= r) return null
          return Math.floor((st-r)/60)+'h '+((st-r)%60)+'m'
        } catch { return null }
      })()
      return {
        icon:'☀️', value:d.sunrise||'—', label:'sun', sub:d.sunset?'sets '+d.sunset:'',
        pairs:[
          { key:'sunrise', val:d.sunrise||'—' },
          { key:'sunset', val:d.sunset||'—' },
          { key:'daylight', val:dayLen||'—' },
        ],
        detail:row('sunrise',d.sunrise||'—')+row('sunset',d.sunset||'—')+row('daylight',dayLen||'—'),
      }
    }

    if (w==='lunar') {
      const MOON_NAMES = ['New Moon','Waxing Crescent','First Quarter','Waxing Gibbous','Full Moon','Waning Gibbous','Last Quarter','Waning Crescent']
      const daysSince = (Date.now()-new Date('2000-01-06').getTime())/86400000
      const idx = Math.round((daysSince%29.53)/29.53*8)%8
      return {
        icon:'🌙', value:d.moonRise||'—', label:'moon', sub:d.moonSet?'sets '+d.moonSet:'',
        pairs:[
          { key:'moonrise', val:d.moonRise||'—' },
          { key:'moonset', val:d.moonSet||'—' },
          { key:'phase', val:MOON_NAMES[idx] },
        ],
        detail:row('moonrise',d.moonRise||'—')+row('moonset',d.moonSet||'—')+row('phase',MOON_NAMES[idx]),
      }
    }

    if (w==='moon-phase') {
      const MOON_ICONS  = ['🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘']
      const MOON_NAMES  = ['New Moon','Waxing Crescent','First Quarter','Waxing Gibbous','Full Moon','Waning Gibbous','Last Quarter','Waning Crescent']
      const daysSince = (Date.now()-new Date('2000-01-06').getTime())/86400000
      const idx  = Math.round((daysSince%29.53)/29.53*8)%8
      const pct  = Math.round((daysSince%29.53)/29.53*100)
      const daysLeft = Math.round(29.53 - (daysSince%29.53))
      const ageDays = Math.round(daysSince%29.53)
      return {
        icon: MOON_ICONS[idx], value: MOON_NAMES[idx], label: 'moon phase',
        sub: pct+'% through lunar cycle',
        pairs:[
          { key:'phase name', val:MOON_NAMES[idx] },
          { key:'moon age days', val:ageDays+' days' },
        ],
        detail: row('phase',MOON_NAMES[idx])+row('cycle progress',pct+'%')+row('days to new moon',daysLeft+' days')+row('lunar cycle','29.53 days'),
      }
    }

    if (w==='snow-depth') {
      if (d.snowNow == null || rt(d.snowNow) <= 0) return null   // rounds to 0" → hide, no orphan card
      return {
        icon:'❄️', value:d.snowNow!=null?rt(d.snowNow)+'"':'—', label:'snow depth',
        pairs:[
          { key:'snow depth', val:d.snowNow!=null?rt(d.snowNow)+'"':'—' },
        ],
        detail:row('snow depth',d.snowNow!=null?rt(d.snowNow)+'"':'—'),
      }
    }

    return null
  }

})()
