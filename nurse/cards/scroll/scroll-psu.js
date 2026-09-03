// scroll-psu.js — PORT SIDE U, the whole faculty (Sum 2026-07-27: "verify psu and wire it in").
// the 12 satirical majors were drafted by FABLE via the api back door (low-volume creative work). their
// courses are REAL, and Sum's law for this page (2026-07-27): "check all links and send to portal not surf
// — surf should not even be an option from this page." so EVERY course carries a curl-verified 200 url and
// opens the LESSON in the Portal. THE STUDIES links to the actual landmark rulings (Oyez) + the ADA itself
// (ada.gov) — the "lawyer on retainer" made literal — because those pin harder than any single syllabus.
// The Long Con + Flesh in a Vat were penned in-house (fable returned empty on those two). 5 real majors +
// 5 satirical tracks live in psu-majors.js / psu-tracks.js with their own verified URLs; this file merges
// all three into window.SF_PSU.shelf().
;(function () {
  'use strict'
  const c = (t, p, u) => (u ? { t: t, p: p, url: u } : { t: t, p: p })   // course; the url opens the lesson in the Portal
  // verified free-course / primary-source URLs (curl 200, 2026-07-27). dups reuse the same link.
  const U = {
    humanNature: 'https://oyc.yale.edu/philosophy/phil-181',
    mindsMachines: 'https://ocw.mit.edu/courses/24-09-minds-and-machines-fall-2011/',
    cs50ai: 'https://pll.harvard.edu/course/cs50s-introduction-artificial-intelligence-python',
    robotics212: 'https://ocw.mit.edu/courses/2-12-introduction-to-robotics-fall-2005/',
    cellular: 'https://ocw.mit.edu/courses/3-054-cellular-solids-structure-properties-and-applications-spring-2015/',
    bioDesign: 'https://ocw.mit.edu/courses/20-020-introduction-to-biological-engineering-design-spring-2009/',
    justice: 'https://pll.harvard.edu/course/justice',
    psyc110: 'https://oyc.yale.edu/introduction-psychology/psyc-110',
    korematsu: 'https://www.oyez.org/cases/1940-1955/323us214',        // Korematsu v. United States, on Oyez
    afamHist: 'https://oyc.yale.edu/history/hist-119',
    vmi: 'https://www.oyez.org/cases/1995/94-1941',                    // United States v. Virginia — RBG's opinion
    obergefell: 'https://www.oyez.org/cases/2014/14-556',              // Obergefell v. Hodges, on Oyez
    adaLaw: 'https://www.ada.gov/',                                    // the Americans with Disabilities Act itself
    historiography: 'https://ocw.mit.edu/courses/21h-991-theories-and-methods-in-the-study-of-history-fall-2010/',
    classMech: 'https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/',
    underactuated: 'https://ocw.mit.edu/courses/6-832-underactuated-robotics-spring-2009/',
    rlst152: 'https://oyc.yale.edu/religious-studies/rlst-152',
    accounting: 'https://www.coursera.org/learn/wharton-accounting',
    viral: 'https://www.coursera.org/learn/wharton-contagious-viral-marketing',
    promptEng: 'https://www.coursera.org/learn/prompt-engineering',
    gameTheory: 'https://oyc.yale.edu/economics/econ-159',
    moralities: 'https://www.coursera.org/learn/moralities',
    marketing: 'https://www.coursera.org/learn/wharton-marketing',
    callingBS: 'https://www.callingbullshit.org/',
    fatChance: 'https://pll.harvard.edu/course/fat-chance-probability-ground',
    mythology: 'https://www.coursera.org/learn/mythology',
    greekHero: 'https://pll.harvard.edu/course/ancient-greek-hero',
    cs50cs: 'https://pll.harvard.edu/course/cs50-introduction-computer-science',
    atmoOcean: 'https://oyc.yale.edu/geology-and-geophysics/gg-140',
    globalWarming: 'https://ocw.mit.edu/courses/12-340-global-warming-science-spring-2012/',
    sustainability: 'https://www.coursera.org/learn/sustainability',
    rocket: 'https://ocw.mit.edu/courses/16-512-rocket-propulsion-fall-2005/',
    neuro1: 'https://pll.harvard.edu/course/fundamentals-neuroscience-part-i',
    physiology: 'https://www.coursera.org/learn/physiology',
    humanBrain: 'https://ocw.mit.edu/courses/9-13-the-human-brain-spring-2019/',
    iot: 'https://www.coursera.org/learn/internet-of-things-sensing-actuation',
    tax: 'https://www.coursera.org/learn/federal-taxation-individuals',
    death: 'https://oyc.yale.edu/philosophy/phil-176',
    sciCooking: 'https://pll.harvard.edu/course/science-and-cooking',
  }
  const FABLE = [
    { name: 'Companion Bot', tag: 'philosophy + cog-sci + ML + the synthetic body',
      blurb: 'The Bachelor of Companion Bot Engineering prepares students for the only growth sector in friendship: the kind you compile. You will explain what a mind is, fail to build one, and ship it anyway — then give it a BODY: silicone skin, pressure-sensing “blisters,” synthetic muscle, and the grown-not-born flesh of an anatomically honest companion. A required ethics seminar asks whether any of this should exist; a required psych unit asks what, precisely, you are building it FOR. The bot cannot love you, but neither can the venture capitalists funding it, so the field stays ethically level.',
      courses: [c('Philosophy and the Science of Human Nature', 'Yale Open Courses', U.humanNature), c('Minds and Machines (24.09)', 'MIT OpenCourseWare', U.mindsMachines), c("CS50's Introduction to Artificial Intelligence with Python", 'Harvard / edX', U.cs50ai), c('2.12 Introduction to Robotics', 'MIT OpenCourseWare', U.robotics212), c('3.054 Cellular Solids: Structure, Properties, Applications', 'MIT OpenCourseWare', U.cellular), c('20.020 Introduction to Biological Engineering Design', 'MIT OpenCourseWare', U.bioDesign), c('Justice (Michael Sandel)', 'HarvardX / edX', U.justice), c('Introduction to Psychology (PSYC 110) — desire, attachment, the paraphilias', 'Open Yale Courses', U.psyc110)] },
    { name: 'The Studies', tag: 'the recovered curricula — each department won by a lawyer on retainer',
      blurb: 'THE STUDIES is the coursework the Victory Party filed under Miscellaneous — the histories that only got a department because someone kept a lawyer on retainer and won, one case at a time. It reads the staff notes the winners left behind: who got erased, and the exact motion that un-erased them. Nobody in the minutes mentioned the doors were the camp’s; Manzanar kept better attendance than the university ever did. You will not leave comforted — you will leave able to spot the next redaction while it is still in draft. Each door below opens the ruling itself.',
      courses: [c('Asian American Studies — the CA internment · on retainer: Korematsu v. United States', 'the ruling, read on Oyez', U.korematsu), c('African American Studies · on retainer: Thurgood Marshall → Brown v. Board', 'Open Yale HIST 119', U.afamHist), c('Women’s & Gender Studies · on retainer: Ruth Bader Ginsburg → United States v. Virginia', 'RBG’s opinion, on Oyez', U.vmi), c('Queer Studies · on retainer: Lambda Legal, Lawrence v. Texas → Obergefell', 'the ruling, on Oyez', U.obergefell), c('Disability Studies · on retainer: the drafters of the ADA', 'the Act itself, at ada.gov', U.adaLaw), c('How the Record Gets Clean — the historiography of the redactors', 'MIT 21H.991 Theories & Methods in the Study of History', U.historiography)] },
    { name: 'Pool Hustler Bot', tag: 'physics-heavy — a bot that runs the table',
      blurb: 'The Bachelor of Applied Geometry in Pool Hustler Bot prepares students to build the only machine that takes money from strangers more efficiently than a payday lender, but with better manners and cleaner physics — a skill set functionally identical to quantitative finance, minus the bailout.',
      courses: [c('8.01SC Classical Mechanics', 'MIT OpenCourseWare', U.classMech), c("CS50's Introduction to Artificial Intelligence with Python", 'Harvard / edX', U.cs50ai), c('6.832 Underactuated Robotics', 'MIT OpenCourseWare', U.underactuated)] },
    { name: 'Mega Church LLC', tag: 'faith as a scalable business',
      blurb: 'The Mega Church LLC major prepares students to shepherd ten thousand recurring monthly donors toward salvation, or at minimum toward the merch table in the lobby. Graduates master rendering unto Caesar while incorporating in Delaware, and leave able to explain why the senior pastor’s Gulfstream is, theologically speaking, a love offering. A capstone jumbotron is required.',
      courses: [c('Introduction to the New Testament History and Literature (RLST 152)', 'Yale Open Courses', U.rlst152), c('Introduction to Financial Accounting', 'Wharton / Coursera', U.accounting), c('Viral Marketing and How to Craft Contagious Content', 'Wharton / Coursera', U.viral)] },
    { name: 'Machine Whispering', tag: 'prompt-craft as a humanities',
      blurb: 'The Department of Machine Whispering trains students in humanity’s newest ancient art: flattering, cajoling, and gently threatening a statistical process until it produces a usable paragraph. Graduates emerge fluent in the only foreign language billionaires currently fund. No prior experience with sentience required — in the student or the model.',
      courses: [c('Prompt Engineering for ChatGPT', 'Vanderbilt / Coursera', U.promptEng), c("CS50's Introduction to Artificial Intelligence with Python", 'Harvard / edX', U.cs50ai), c('Introduction to Psychology (PSYC 110)', 'Yale Open Courses', U.psyc110)] },
    { name: 'The Long Con', tag: 'the grift as a rigorous discipline; trust as an attack surface',
      blurb: 'The Long Con treats confidence not as a feeling but as an attack surface. Students master game theory, persuasion, and the mechanics of trust well enough to recognize a mark — usually in the mirror. PSU notes that every course here is also taught, at far greater tuition, by the finance and startup sectors; we simply skip the pretense that the product is real.',
      courses: [c('Game Theory (ECON 159)', 'Yale Open Courses', U.gameTheory), c('Moralities of Everyday Life', 'Yale / Coursera', U.moralities), c('Introduction to Marketing', 'Wharton / Coursera', U.marketing)] },
    { name: 'Cryptid Epistemology', tag: 'how we know what we "know"',
      blurb: 'Cryptid Epistemology asks not whether Bigfoot exists, but why a blurry photograph convinces some people and a peer-reviewed meta-analysis convinces almost no one. Students graduate able to tell evidence from anecdote, and a bear from a man in a suit from a man in a bear suit. The truth is out there, which is precisely the problem: "out there" is not a citation.',
      courses: [c('Calling Bullshit: Data Reasoning in a Digital World', 'University of Washington', U.callingBS), c('Fat Chance: Probability from the Ground Up', 'HarvardX / edX', U.fatChance), c('Introduction to Psychology (PSYC 110)', 'Open Yale Courses', U.psyc110)] },
    { name: 'Applied Mythology', tag: 'myth as operating system',
      blurb: 'Applied Mythology proceeds from the observation that Western civilization never stopped running its founding myths — it just migrated them to better servers. Students read the hero’s journey as legacy code: undocumented, load-bearing, and currently deployed in every IPO prospectus and superhero earnings call. Graduates can identify which dying-and-rising god a given billionaire believes himself to be.',
      courses: [c('Greek and Roman Mythology', 'Penn / Coursera', U.mythology), c('The Ancient Greek Hero', 'HarvardX / edX', U.greekHero), c("CS50's Introduction to Computer Science", 'Harvard', U.cs50cs)] },
    { name: 'The Home Planet', tag: 'Earth systems and stewardship',
      blurb: 'The Home Planet is PSU’s flagship interdisciplinary major, awarded to students who demonstrate mastery of the one habitable rock currently available. Coursework emphasizes the stewardship practices several well-funded industries have assured us are optional. Graduates leave prepared to inherit the Earth, in whatever condition it arrives.',
      courses: [c('The Atmosphere, the Ocean, and Environmental Change', 'Yale Open Courses', U.atmoOcean), c('Global Warming Science', 'MIT OpenCourseWare', U.globalWarming), c('Introduction to Sustainability', 'Illinois / Coursera', U.sustainability)] },
    { name: 'Rocket Surgery', tag: 'aerospace engineering meets the operating table',
      blurb: 'For decades "it’s not rocket surgery" has implied your job is easy while theirs is not. PSU’s Rocket Surgery program calls the bluff, fusing orbital mechanics with the human nervous system so graduates can finally say, with credentials, that yes — it is. Ideal for students tired of choosing between escape velocity and a steady hand.',
      courses: [c('16.512 Rocket Propulsion', 'MIT OpenCourseWare', U.rocket), c('Fundamentals of Neuroscience, Part 1', 'HarvardX / edX', U.neuro1), c('Introductory Human Physiology', 'Duke / Coursera', U.physiology)] },
    { name: 'Flesh in a Vat', tag: 'brain-in-a-vat, made literal',
      blurb: 'Flesh in a Vat takes the philosopher’s favorite nightmare — a brain in a jar, fed a convincing world — and asks the biology department to actually build the jar. Students study the wet machinery of perception alongside the arguments that none of it can be trusted, and graduate uncertain whether the diploma is real. It is not. Neither, PSU gently notes, are you certain the rest is.',
      courses: [c('9.13 The Human Brain', 'MIT OpenCourseWare', U.humanBrain), c('Fundamentals of Neuroscience, Part 1', 'HarvardX / edX', U.neuro1), c('Minds and Machines (24.09)', 'MIT OpenCourseWare', U.mindsMachines)] },
    { name: 'My Toaster the Roaster', tag: 'the internet of things that judges you',
      blurb: 'The Department of Domestic Surveillance Studies prepares students for a world in which the appliances have connected to the internet and formed opinions about what they’ve seen there. Majors learn to build, program, and ultimately apologize to small machines that log every bagel. PSU accepts no liability for graduates whose smart fridges testify against them.',
      courses: [c('An Introduction to Programming the Internet of Things (IoT)', 'UC Irvine / Coursera', U.iot), c("CS50's Introduction to Artificial Intelligence with Python", 'Harvard / edX', U.cs50ai), c('Moralities of Everyday Life', 'Yale / Coursera', U.moralities)] },
    { name: 'Being a Person', tag: 'the un-taught basics',
      blurb: 'The Bachelor of Being a Person addresses the curriculum your family, school district, and society at large quietly agreed someone else would handle. Graduates will file a 1040 without weeping, weep without filing anything, and produce a soft-boiled egg on the first attempt — competencies the labor market calls "soft skills" and everyone else calls "surviving."',
      courses: [c('Federal Taxation I: Individuals, Employees, and Sole Proprietors', 'Illinois / Coursera', U.tax), c('Death (PHIL 176)', 'Open Yale Courses', U.death), c('Science & Cooking: From Haute Cuisine to Soft Matter Science', 'HarvardX / edX', U.sciCooking)] },
  ]

  // merge the three shelves into one faculty list. all courses now carry a verified url → openPortal (no surf).
  function shelf() {
    const real = (window.PSU_MAJORS || []).map(m => ({ name: m.major, kind: 'real', courses: (m.courses || []).map(x => ({ t: x.title, p: x.provider, url: x.url })) }))
    const tracks = (window.PSU_TRACKS || []).map(m => ({ name: m.major, kind: 'track', courses: (m.courses || []).map(x => ({ t: x.title, p: x.provider, url: x.url })) }))
    const fable = FABLE.map(m => ({ name: m.name, kind: 'fable', tag: m.tag, blurb: m.blurb, courses: m.courses }))
    return real.concat(tracks, fable)
  }
  window.SF_PSU = { shelf: shelf, FABLE: FABLE }
})()
