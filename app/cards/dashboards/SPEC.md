# dashboards — real-data swaps (#17–20). THE RAIL.
# build from THIS folder. don't glance — read here, bake from the data.

DATA (the sample)  ../../runs/homework/dashboards/   real oz0.3: sleep · grocery · activity
SHAPE (works, knows the day)  the sleep card's week-nav, already in dashboards.js:
      todayIso() (~L61) · sNav(end) + .fc-logctrl + the 'today' pill (~L108) ·
      the data-today handler that jumps to the REAL week (~L302).
      copy that SHAPE for exercise. it already knows what day it is.
RULES  ../../IC.md · ../../PORT-DON'T-REINVENT.md   (bake the json — file:// can't fetch)

## the four builds (all edit cards/dashboards/dashboards.js)
17 sleep    — swap REAL.nights (7) → the 25 real nights in sleep-data.json.
              each: out·wake·eff·deep·rem·awake·LIGHT·note. re-add the light row.
              surface the note ("trench" → hügelkultur). week-pager = a real month.
18 food     — seed the Grocery tab from grocery-data.json (status:"need"→st:"buy", emoji, note).
19 exercise — enrich sessions from activity-data.json (met·hr_mean·distance·source).
              show the math: "112 bpm × 13 min → 3.8 MET → 49 MET-min."
20 exercise — give it the SAME week-nav as the SHAPE. open on Mar 23–29 demo week;
              'today' → real current week; ←/→ page. don't reinvent — copy sNav.

## done when
real month pages in sleep · grocery shows real items · a session shows HR→MET-min ·
exercise opens on the Mar demo week with a working today button · node --check clean.
