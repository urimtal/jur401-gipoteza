/* ===== Жаттығулар, дата, үлгі стори. Мәтінді осы жерде өзгертуге болады. =====
   Әр жаттығуда: q (сұрақ), opts (нұсқа; code = қате болғанда err.js-тен шығатын кеңес), ans (дұрыс жауап),
   why (дұрыс болғанда және екінші қатеден кейін көрсетілетін түсіндірме). */

const OPTS = {
  sectors: [
    {id:"health", t:{kk:"Денсаулық", en:"Health"}},
    {id:"fin", t:{kk:"Қаржы", en:"Finance"}},
    {id:"env", t:{kk:"Қоршаған орта", en:"Environment"}},
    {id:"sec", t:{kk:"Қауіпсіздік", en:"Security"}},
    {id:"hr", t:{kk:"Адам құқығы", en:"Human rights"}},
    {id:"edu", t:{kk:"Білім", en:"Education"}}
  ],
  levels: [
    {id:"country", t:{kk:"Бүкіл ел", en:"Whole country"}},
    {id:"oblast", t:{kk:"Облыс", en:"Region (oblast)"}},
    {id:"city", t:{kk:"Республикалық маңызы бар қала (Астана, Алматы, Шымкент)", en:"City of national status (Astana, Almaty, Shymkent)"}},
    {id:"district", t:{kk:"Аудан немесе облыстағы қала", en:"District or town within a region"}},
    {id:"inst", t:{kk:"Мекеме (мектеп, аурухана, сот)", en:"Institution (school, hospital, court)"}}
  ],
  srcTypes: [
    {id:"table", t:{kk:"Кесте немесе датасет (xlsx, csv, дерекқор)", en:"Table or dataset (xlsx, csv, database)"}},
    {id:"report", t:{kk:"Ресми есеп, кестесі PDF ішінде", en:"Official report, table inside a PDF"}},
    {id:"press", t:{kk:"Пресс-релиз", en:"Press release"}},
    {id:"article", t:{kk:"Жаңалық мақаласы", en:"News article"}},
    {id:"person", t:{kk:"Адамның сөзі (шенеунік, сарапшы, саясаткер)", en:"Someone's statement (official, expert, politician)"}},
    {id:"pct", t:{kk:"Біреудің дайын пайызы, инфографика", en:"Someone else's ready-made percentage or infographic"}}
  ],
  primary: [
    {id:"first", t:{kk:"Иә, датаны жинаған органның өз кестесі", en:"Yes, the table of the body that collected the data"}},
    {id:"second", t:{kk:"Жоқ, оны басқа біреу қайталап жазған", en:"No, someone else is repeating it"}},
    {id:"unknown", t:{kk:"Білмеймін", en:"I don't know"}}
  ],
  kinds: [
    {id:"count", t:{kk:"Санау: абсолют сан (адам, оқиға, теңге)", en:"Count: absolute number (people, events, tenge)"}},
    {id:"rate", t:{kk:"Көрсеткіш: 1000 не 100 мың адамға, үлес, орташа", en:"Rate: per 1,000 or 100,000 people, share, average"}}
  ],
  verdicts: [
    {id:"supp", t:{kk:"Расталды", en:"Supported"}},
    {id:"rej", t:{kk:"Жоққа шықты", en:"Not supported"}},
    {id:"nodata", t:{kk:"Дата жетпеді", en:"Not enough data"}},
    {id:"notyet", t:{kk:"Әлі тексерген жоқпын", en:"Not tested yet"}}
  ]
};

/* Студенттің өз мәтінін тексеретін үлгілер (қазақша да, ағылшынша да ұстайды) */
const RULES = {
  question: /\?|\s(ма|ме|ба|бе|па|пе)\s*[.!]?\s*$|^\s*(why|how|what|is|are|does|do|did|will|can)\b/i,
  plan: /салыстыр(амын|амыз|ып көремін|у керек)|қарастыр(амын|амыз)|зертте(ймін|йміз)|талда(ймын|ймыз)|анықта(ймын|ймыз)|тексер(емін|еміз)|\b(we will|i will|i'll|we'll|i want to|we want to)\b/i,
  compare: /салыстырғанда|қарағанда|\sал\s|орташа|жылдам|баяу|ел бойынша|асып|артта|than|compared|while|whereas|average|faster|slower|national|behind/i,
  causal: /себебі|себебінен|салдарынан|кесірінен|әсерінен|ықпал|өйткені|арқасында|(ғандықтан|гендіктен|қандықтан|кендіктен)|\b(because|due to|caused|result of|led to|thanks to|impact of)\b/i,
  vague: /шамадан тыс|нашар|сапасыз|жаман|өте көп|тым көп|қорқынышты|\b(terrible|bad|poor|too much|huge|awful)\b/i,
  two: /\sәрі\s|сондай-ақ|\sand also\s/i,
  confirm: /(дұрыс|расталады|дәлелденеді|шын болады)\s*[.!]?\s*$|\b(is|are) (true|correct|right|proven)\.?\s*$|\b(proves|confirms)\b/i,
  falsePhrase: /жалған|теріске|расталмайды|false|wrong|not supported|rejected/i,
  negation: /емес|жоқ|өспе|азайма|өзгерме|аз\s|\bnot\b|n't|\bless\b/i,
  source: /stat\.gov|бюро|министрлі|агенттік|дереккөз|taldau|data\.egov|комитет|қазгидромет|ұлттық банк|bureau|ministry|agency|source|committee|national bank|statistic/i,
  doubt: /бірақ|алайда|дегенмен|әйтсе де|десе де|\b(but|however|yet|although|though)\b/i,
  next: /келесі|тексер|анықта|қарау керек|\b(next|check|verify|remains|still need|test)\b/i
};

/* 5-қадамның датасы. Дереккөз: Ұлттық статистика бюросы. Ұяшықтар _ҮЛГІ_СТОРИ_ТЕКСЕРУГЕ.md ішінде. */
const DATA = {
  M: {d:{2016:2799, 2017:2733, 2018:3007, 2019:3051}, p:{2016:627321, 2017:643379, 2018:660874, 2019:678766}},
  K: {d:{2016:131983, 2017:129173, 2018:129680, 2019:132621}, p:{2016:17668720, 2017:17916623, 2018:18155825, 2019:18394642}}
};

const EX = {};

/* 2-қадам: үш сөйлем, қайсысы төркін */
EX.origin = {items: [
  {id:"o1", sec:"health",
   q:{kk:"Жергілікті жаңалық сайты: «Маңғыстауда 2019 жылы 3 051 адам қайтыс болды». Дереккөз ретінде облыстық денсаулық сақтау басқармасы аталған. Санның төркіні қайсы?",
      en:"A local news site: \"3,051 people died in Mangystau in 2019.\" The regional health department is named as the source. Where does the number really come from?"},
   opts:[
    {id:"a", code:"secondary", t:{kk:"Жаңалық сайтының өзі", en:"The news site itself"}},
    {id:"b", code:"press", t:{kk:"Облыстық денсаулық сақтау басқармасының баспасөз хабарламасы", en:"The regional health department's press release"}},
    {id:"c", t:{kk:"Ұлттық статистика бюросы, «Қайтыс болғандар саны» кестесі, облыстар бөлінісінде, 2000–2024", en:"Bureau of National Statistics, table \"Number of deaths\", by region, 2000–2024"}},
    {id:"d", code:"person", t:{kk:"Тілшіге сұхбат берген дәрігердің сөзі", en:"A doctor quoted by the reporter"}}],
   ans:"c",
   why:{kk:"Қайтыс болғандарды тіркеудің ресми жиынтығы осы кестеде. Басқарма мен сайт оны қайталайды. Төркінге жеткен соң сол кестеден санды өзіңіз тауып, мақаладағымен салыстырасыз: Маңғыстау, 2019, 3 051.",
        en:"The official count of registered deaths lives in this table. The department and the site repeat it. Once you reach the origin, find the number yourself and compare: Mangystau, 2019, 3,051."}},
  {id:"o2", sec:"fin",
   q:{kk:"Телеграм-арна: «Халықтың тұтынушылық несие бойынша қарызы бір жылда 30 пайызға өсті» (мысал, сан шартты). Астында инфографика бар, дереккөз жоқ. Төркінін қайдан іздейсіз?",
      en:"A Telegram channel: \"Household consumer-loan debt grew 30% in a year\" (example, made-up number). There's an infographic and no source. Where do you look for the origin?"},
   opts:[
    {id:"a", code:"pct", t:{kk:"Инфографиканың авторы", en:"Whoever made the infographic"}},
    {id:"b", code:"secondary", t:{kk:"Сол пайызды қайталаған тағы үш арна", en:"Three more channels repeating the same percentage"}},
    {id:"c", t:{kk:"Ұлттық Банктің несие статистикасы: жеке тұлғаларға берілген тұтынушылық несие кестесі, айлар мен жылдар бойынша", en:"National Bank lending statistics: the table of consumer loans to individuals, by month and year"}},
    {id:"d", code:"person", t:{kk:"Арнаға пікір қалдырған экономист", en:"An economist commenting under the post"}}],
   ans:"c",
   why:{kk:"Сан бір жерден шыққан, ал оны қайталаған арнаның көптігі оны дәлелдемейді. Несие туралы бастапқы ресми статистика Ұлттық Банкте. Біреудің дайын пайызын сол кестеден ЖЕБЕ-мен өзіңіз қайта есептейсіз.",
        en:"The number came from one place; more channels repeating it don't make it true. The primary official lending data is the National Bank's. You recalculate someone else's percentage from that table yourself."}},
  {id:"o3", sec:"env",
   q:{kk:"Ақпарат агенттігі: «Министр Алматыда ауа сапасы жақсарғанын мәлімдеді». Тексеретін дата қайда?",
      en:"A news agency: \"The minister said Almaty's air quality has improved.\" Where is the data to check this?"},
   opts:[
    {id:"a", code:"authority", t:{kk:"Министрдің сөзі", en:"The minister's statement"}},
    {id:"b", code:"secondary", t:{kk:"Ақпарат агенттігінің мақаласы", en:"The news agency's article"}},
    {id:"c", code:"anecdote", t:{kk:"Әлеуметтік желідегі тұрғындардың шағымы", en:"Residents' complaints on social media"}},
    {id:"d", t:{kk:"Қазгидрометтің қоршаған орта жағдайы туралы ай сайынғы бюллетені: бекеттер, айлар, ластану деңгейі", en:"Kazhydromet's monthly environmental bulletin: monitoring stations, months, pollution levels"}}],
   ans:"d",
   why:{kk:"Шенеуніктің сөзі дата емес, ол тексерілетін тұжырым. Ауаны өлшейтін бекеттер Қазгидрометтікі, сондықтан «жақсарды ма» деген сұрақтың жауабы бюллетеньдегі айлар мен жылдарды салыстырғанда шығады.",
        en:"An official's statement isn't data; it's a claim to check. The stations that measure the air belong to Kazhydromet, so the answer comes from comparing months and years in its bulletin."}}
]};

/* 3-қадам: сұрыптау */
EX.sort = {
  cats: [
    {id:"topic", t:{kk:"Тақырып немесе жоспар", en:"Topic or plan"}},
    {id:"question", t:{kk:"Сұрақ", en:"Question"}},
    {id:"weak", t:{kk:"Әлсіз гипотеза", en:"Weak hypothesis"}},
    {id:"strong", t:{kk:"Күшті гипотеза", en:"Strong hypothesis"}}
  ],
  items: [
  {id:"h1", sec:"health", ans:"topic",
   q:{kk:"Емханалар: дәрігер саны, кезек, облыстар бойынша салыстыру.", en:"Clinics: number of doctors, waiting times, comparison by region."},
   why:{kk:"Бұл айнымалылар тізімі мен жоспар: не болғаны айтылмайды. Тізімнен бір көрсеткішті алып, «не болды» деп тұжырым жазыңыз.", en:"This is a list of variables plus a plan: it doesn't say what happened. Take one indicator from the list and write what happened to it."}},
  {id:"h2", sec:"fin", ans:"question",
   q:{kk:"Жастар неге несиеге батып жатыр?", en:"Why are young people drowning in debt?"},
   why:{kk:"Сұрақ, оның үстіне ішінде дәлелденбеген болжам жасырынып тұр («батып жатыр»). Күтетін жауабыңызды тұжырым етіп жазыңыз: қай жерде, қай жылдары, қандай көрсеткіш.", en:"It's a question, and it hides an unproven assumption (\"drowning\"). Write the answer you expect as a claim: where, which years, which indicator."}},
  {id:"h3", sec:"health", ans:"strong",
   q:{kk:"2015–2024 жылдары ауыл аудандарында 10 000 адамға шаққандағы дәрігер саны азайды, ал Алматы мен Астанада өсті.", en:"Between 2015 and 2024, doctors per 10,000 people fell in rural districts while rising in Almaty and Astana."},
   why:{kk:"Төрт бөлігі түгел: орын (ауыл аудандары), кезең (2015–2024), көрсеткіш (10 000 адамға шаққандағы дәрігер), не болды (азайды). Салыстыру да бар (Алматы мен Астана), ал көрсеткіш адам басына шағылған, сондықтан әртүрлі аумақты әділ салыстыруға болады.", en:"All four parts: place (rural districts), period (2015–2024), indicator (doctors per 10,000), what happened (fell). It has a comparison (Almaty and Astana), and the indicator is per head, so areas of different size compare fairly."}},
  {id:"h4", sec:"fin", ans:"weak", code:"causal",
   q:{kk:"Онлайн-казино көбейгендіктен, 2020–2024 жылдары азаматтардың несие бойынша қарызы өсті.", en:"Because online casinos multiplied, people's loan debt grew between 2020 and 2024."},
   why:{kk:"Кезең бар, бірақ сөйлемнің өзегі себеп. Дата қарыздың өскенін көрсете алады, онлайн-казиноның оған себеп болғанын көрсете алмайды. Себепті алып тастаңыз немесе бөлек белгілеңіз: оған қосымша дата керек (6-қадам).", en:"There's a period, but the core of the sentence is a cause. Data can show that debt grew; it can't show that online casinos caused it. Drop the cause or flag it separately: it needs extra data (step 6)."}},
  {id:"h5", sec:"env", ans:"strong",
   q:{kk:"2018–2024 жылдары Алматыда қыстың үш айында ауаның жоғары ластануы тіркелген күн саны жаздың үш айындағыдан кемінде үш есе көп болды.", en:"Between 2018 and 2024, Almaty recorded at least three times as many high-pollution days in the three winter months as in the three summer months."},
   why:{kk:"Орын, кезең, өлшем (жоғары ластану тіркелген күн саны), не болды (кемінде үш есе көп) және салыстыру (жаз) бар. «Кемінде үш есе» деген шек гипотезаны теріске шығаруға мүмкіндік береді: екі есе болса, ол жалған.", en:"Place, period, measure (days with high pollution recorded), what happened (at least three times as many) and a comparison (summer). The \"at least three times\" threshold makes it falsifiable: if it's twice as many, it's false."}},
  {id:"h6", sec:"sec", ans:"weak", code:"absrate",
   q:{kk:"Түркістан облысында Павлодар облысына қарағанда жол апаты көп.", en:"Turkistan region has more road accidents than Pavlodar region."},
   why:{kk:"Халқы екі еседен көп облыстың апаты да көп болуы заңды. Салыстыру 100 мың тұрғынға шаққанда жүргізілуі керек. Оның үстіне кезең жоқ.", en:"A region with more than twice the population will naturally have more accidents. Compare per 100,000 residents. There's also no period."}},
  {id:"h7", sec:"hr", ans:"weak", code:"nodataset",
   q:{kk:"Министрліктің үш пресс-релизі бойынша елде балалар буллингі көбейді.", en:"According to three ministry press releases, bullying of children has increased in the country."},
   why:{kk:"Пресс-релиз датасет емес, ал үш оқиға тұтас құбылыстың өлшемі бола алмайды. Кезең мен өлшем де жоқ. Тіркелген оқиғалар кестесін іздеңіз (мысалы, Бас прокуратураның құқықтық статистика порталы), пресс-релиз тақырыпқа сигнал ретінде ғана қалады.", en:"A press release isn't a dataset, and three cases can't measure a whole phenomenon. There's no period or measure either. Look for a table of registered cases (for example, the Prosecutor General's legal statistics portal); the press release is only a signal for the topic."}},
  {id:"h8", sec:"edu", ans:"topic",
   q:{kk:"Екі облыстың ҰБТ нәтижесін салыстырамыз.", en:"We will compare UNT results in two regions."},
   why:{kk:"«Салыстырамыз» деген жоспар, тұжырым емес. Жоспарды теріске шығару мүмкін емес. Тұжырым былай аяқталады: «15 балға артта қалды», «айырма өсті».", en:"\"We will compare\" is a plan, not a claim. A plan can't be proven false. A claim ends like this: \"fell 15 points behind\", \"the gap widened\"."}},
  {id:"h9", sec:"fin", ans:"strong",
   q:{kk:"2020–2025 жылдары Қызылорда облысында шағын бизнеске берілген несиенің жалпы несиедегі үлесі ел бойынша орташадан баяу өсті.", en:"Between 2020 and 2025, the share of small-business loans in all lending grew more slowly in Kyzylorda region than the national average."},
   why:{kk:"Орын, кезең, көрсеткіш (үлес, яғни шағылған өлшем), не болды (баяу өсті) және салыстыру (ел бойынша орташа) бар. Үлес алынғандықтан, үлкен облыс пен шағын облыс әділ салыстырылады.", en:"Place, period, indicator (a share, so already scaled), what happened (grew more slowly) and a comparison (national average). Because it's a share, big and small regions compare fairly."}},
  {id:"h10", sec:"health", ans:"weak", code:"parts",
   q:{kk:"Балалардағы аллергия көбейді.", en:"Allergies in children have increased."},
   why:{kk:"Қай жерде? Қай жылдары? Немен өлшенеді: тіркелген диагноз саны ма, әлде 1000 балаға шаққанда ма? Төрт бөліктің үшеуі жоқ, сондықтан тексеруге келмейді.", en:"Where? Which years? Measured how: registered diagnoses, or per 1,000 children? Three of the four parts are missing, so it can't be tested."}}
]};

/* 4-қадам: гипотезаға лайық нөлдік жол */
const NV = (kk, en) => ({kk, en});
EX.null = {items: [
  {id:"n1", sec:"health",
   q:NV("Гипотеза: 2017–2019 жылдары Маңғыстауда мың адамға шаққандағы өлім ел бойынша көрсеткіштен жылдамырақ өсті.", "Hypothesis: between 2017 and 2019, deaths per 1,000 people rose faster in Mangystau than nationally."),
   opts:[
    {id:"a", code:"confirm", t:NV("Егер дата Маңғыстауда өлімнің өскенін көрсетсе, гипотезам дұрыс.", "If the data shows deaths rose in Mangystau, my hypothesis is true.")},
    {id:"b", t:NV("Егер Маңғыстаудағы мың адамға шаққандағы өлімнің өсімі ел бойынша өсімнен 1 пайыздық тармаққа жетпесе, гипотезам жалған.", "If the rise in Mangystau's deaths per 1,000 beats the national rise by less than 1 percentage point, my hypothesis is false.")},
    {id:"c", code:"nothreshold", t:NV("Егер дата өлімнің өспегенін көрсетсе, гипотезам жалған.", "If the data shows deaths didn't rise, my hypothesis is false.")},
    {id:"d", code:"sourcename", t:NV("Дереккөз: Ұлттық статистика бюросы.", "Source: Bureau of National Statistics.")}],
   ans:"b",
   why:NV("Дұрыс жолда үш нәрсе бар: көрсеткіш (мың адамға), салыстыру (ел бойынша) және шек (1 пайыздық тармақ). Шек болмаса, 0,1 пайыздық айырманы да «дәлел» деп алып кетуге болады.", "The right line has three things: the indicator (per 1,000), the comparison (national) and a threshold (1 percentage point). Without a threshold, even a 0.1-point gap could be called \"proof\".")},
  {id:"n2", sec:"fin",
   q:NV("Гипотеза: 2021–2026 жылдары Астанада бір бөлмелі пәтердің орташа бағасы орташа жалақыдан жылдам өсті.", "Hypothesis: between 2021 and 2026, the average price of a one-room flat in Astana grew faster than the average wage."),
   opts:[
    {id:"a", code:"restate", t:NV("Астанада пәтер бағасы жалақыдан жылдам өсті.", "In Astana, flat prices grew faster than wages.")},
    {id:"b", code:"negation", t:NV("Пәтер бағасы өскен жоқ.", "Flat prices didn't grow.")},
    {id:"c", t:NV("Егер пәтер бағасының өсімі жалақы өсімінен 5 пайыздық тармақтан аз асса немесе жалақы жылдам өссе, гипотезам жалған.", "If price growth beats wage growth by less than 5 percentage points, or wages grow faster, my hypothesis is false.")},
    {id:"d", code:"authority", t:NV("Егер министрлік бағаның өскенін жоққа шығарса, гипотезам жалған.", "If the ministry denies that prices rose, my hypothesis is false.")}],
   ans:"c",
   why:NV("Гипотеза салыстыру туралы (баға мен жалақы), сондықтан жалған болу шарты да салыстыру туралы болуы керек. «Баға өскен жоқ» деген жай терістеу: баға 10 пайыз, жалақы 30 пайыз өссе, гипотеза жалған, бірақ бұл жол оны ұстамайды.", "The hypothesis is about a comparison (prices vs wages), so the falsification condition must be too. \"Prices didn't grow\" is plain negation: if prices rose 10% and wages 30%, the hypothesis is false, but this line wouldn't catch it.")},
  {id:"n3", sec:"health",
   q:NV("Гипотеза: 2015–2024 жылдары ауыл аудандарында 10 000 адамға шаққандағы дәрігер саны азайды, ал Алматы мен Астанада өсті.", "Hypothesis: between 2015 and 2024, doctors per 10,000 people fell in rural districts while rising in Almaty and Astana."),
   opts:[
    {id:"a", code:"confirm", t:NV("Егер дата ауылда дәрігер азайғанын көрсетсе, гипотезам дұрыс.", "If the data shows fewer doctors in rural areas, my hypothesis is true.")},
    {id:"b", code:"negation", t:NV("Егер ауылда дәрігер жетіспейді деген пікір қате болса.", "If the opinion that villages lack doctors is wrong.")},
    {id:"c", code:"nodatanull", t:NV("Егер дәрігер саны туралы кесте табылмаса, гипотезам жалған.", "If I can't find a table of doctor numbers, my hypothesis is false.")},
    {id:"d", t:NV("Егер ауыл аудандарында 10 000 адамға шаққандағы дәрігер саны 2 пайыздан аз азайса не өссе, немесе Алматы мен Астанада өспесе, гипотезам жалған.", "If doctors per 10,000 in rural districts fell by less than 2%, or rose, or didn't rise in Almaty and Astana, my hypothesis is false.")}],
   ans:"d",
   why:NV("Гипотезаның екі бөлігі бар (ауыл азайды, қала өсті), сондықтан жалған болу шарты екеуін де қамтиды. Дата табылмауы гипотезаны жалған етпейді: ол «дата жетпеді» деген басқа нәтиже.", "The hypothesis has two parts (rural fell, cities rose), so the condition covers both. Not finding data doesn't make a hypothesis false: that's a different result, \"not enough data\".")},
  {id:"n4", sec:"env",
   q:NV("Гипотеза: 2019–2024 жылдары Ақтөбеде велосипед жолының ұзындығы кемінде 20 пайызға өсті.", "Hypothesis: between 2019 and 2024, the length of cycle lanes in Aktobe grew by at least 20%."),
   opts:[
    {id:"a", code:"confirm", t:NV("Егер дата велосипед жолы ұзарғанын көрсетсе, гипотезам дұрыс.", "If the data shows the cycle lanes got longer, my hypothesis is true.")},
    {id:"b", code:"nothreshold", t:NV("Егер велосипед жолы ұзармаса, гипотезам жалған.", "If the cycle lanes didn't get longer, my hypothesis is false.")},
    {id:"c", code:"restate", t:NV("2019–2024 жылдары Ақтөбеде велосипед жолының ұзындығы кемінде 20 пайызға өсті.", "Between 2019 and 2024, the length of cycle lanes in Aktobe grew by at least 20%.")},
    {id:"d", t:NV("Егер дата өсімнің 20 пайыздан аз екенін немесе жолдың қысқарғанын көрсетсе, гипотезам жалған.", "If the data shows growth under 20%, or that the lanes got shorter, my hypothesis is false.")}],
   ans:"d",
   why:NV("Гипотезада шек бар (кемінде 20 пайыз), сондықтан жалған болу шарты сол шекті қолданады. «Ұзармаса» деген жол 1 пайыздық өсімді де растау деп санап жібереді.", "The hypothesis has a threshold (at least 20%), so the condition uses it. \"Didn't get longer\" would count 1% growth as confirmation.")}
]};

/* 5-қадам: сан жаттығуы. lo..hi = қабылданатын аралық; cands = жиі қателердің мәні мен коды */
const NUM = [
  {id:"m_d", lo:11.55, hi:11.7, gen:"pcGen",
   q:{kk:"Маңғыстау: қайтыс болғандар саны 2017 жылдан 2019 жылға қанша пайызға өсті?", en:"Mangystau: by what % did the number of deaths change from 2017 to 2019?"},
   calc:{kk:"(3 051 − 2 733) / 2 733 × 100 = 11,6", en:"(3,051 − 2,733) / 2,733 × 100 = 11.6"},
   why:{kk:"11,6 пайыз. Бұл абсолют санның өзгерісі, яғни мақаладағы «өлім көбейді» деген сан.", en:"11.6%. That's the change in the absolute number, the \"deaths are up\" figure an article would use."},
   cands:[{v:10.42, code:"divnew"}, {v:0.1164, code:"no100", tol:0.002}, {v:318, code:"diffonly", tol:0.5}, {v:111.64, code:"ratio"}, {v:2.67, code:"wrongrow"}]},
  {id:"k_d", lo:2.65, hi:2.75, gen:"pcGen",
   q:{kk:"Қазақстан: қайтыс болғандар саны 2017 жылдан 2019 жылға қанша пайызға өсті?", en:"Kazakhstan: by what % did the number of deaths change from 2017 to 2019?"},
   calc:{kk:"(132 621 − 129 173) / 129 173 × 100 = 2,7", en:"(132,621 − 129,173) / 129,173 × 100 = 2.7"},
   why:{kk:"2,7 пайыз. Маңғыстаудағы өсім елдікінен төрт есеге жуық жылдам көрінеді. Бірақ бұл әлі абсолют сан.", en:"2.7%. Mangystau's rise looks about four times faster. But these are still absolute numbers."},
   cands:[{v:2.6, code:"divnew", tol:0.004}, {v:0.0267, code:"no100", tol:0.001}, {v:3448, code:"diffonly", tol:0.5}, {v:102.67, code:"ratio"}, {v:11.64, code:"wrongrow"}]},
  {id:"m_p", lo:5.45, hi:5.55, gen:"pcGen",
   q:{kk:"Маңғыстау: халық саны (1 қаңтар) 2017 жылдан 2019 жылға қанша пайызға өсті?", en:"Mangystau: by what % did the population (1 January) change from 2017 to 2019?"},
   calc:{kk:"(678 766 − 643 379) / 643 379 × 100 = 5,5", en:"(678,766 − 643,379) / 643,379 × 100 = 5.5"},
   why:{kk:"5,5 пайыз. Өлім 11,6 пайызға өссе, оның жартысына жуығын халықтың өсуі түсіндіреді. Нөлдік гипотезаның ізі осы.", en:"5.5%. If deaths rose 11.6%, population growth explains nearly half of it. That's the trace of the null hypothesis."},
   cands:[{v:5.21, code:"divnew"}, {v:0.055, code:"no100", tol:0.001}, {v:35387, code:"diffonly", tol:0.5}, {v:105.5, code:"ratio", tol:0.1}, {v:2.67, code:"wrongrow"}]},
  {id:"m_r17", lo:4.24, hi:4.26, gen:"rateGen",
   q:{kk:"Маңғыстау, 2017: мың адамға шаққанда неше адам қайтыс болды? (2 таңба)", en:"Mangystau, 2017: deaths per 1,000 people (2 decimals)"},
   calc:{kk:"2 733 / 643 379 × 1000 = 4,25", en:"2,733 / 643,379 × 1,000 = 4.25"},
   why:{kk:"4,25.", en:"4.25."},
   cands:[{v:4.19, code:"avgpop", ok:true, tol:0.006}, {v:0.425, code:"per100", tol:0.003}, {v:0.00425, code:"per1", tol:0.0001}, {v:424.8, code:"per100k", tol:0.5}, {v:235.4, code:"inverted", tol:0.5}, {v:4.03, code:"wrongyear", tol:0.006}]},
  {id:"m_r19", lo:4.49, hi:4.5, gen:"rateGen",
   q:{kk:"Маңғыстау, 2019: мың адамға шаққанда", en:"Mangystau, 2019: deaths per 1,000 people"},
   calc:{kk:"3 051 / 678 766 × 1000 = 4,49", en:"3,051 / 678,766 × 1,000 = 4.49"},
   why:{kk:"4,49.", en:"4.49."},
   cands:[{v:4.43, code:"avgpop", ok:true, tol:0.006}, {v:0.449, code:"per100", tol:0.003}, {v:0.0045, code:"per1", tol:0.0001}, {v:449.5, code:"per100k", tol:0.5}, {v:222.5, code:"inverted", tol:0.5}, {v:4.74, code:"wrongyear", tol:0.006}]},
  {id:"k_r17", lo:7.2, hi:7.22, gen:"rateGen",
   q:{kk:"Қазақстан, 2017: мың адамға шаққанда", en:"Kazakhstan, 2017: deaths per 1,000 people"},
   calc:{kk:"129 173 / 17 916 623 × 1000 = 7,21", en:"129,173 / 17,916,623 × 1,000 = 7.21"},
   why:{kk:"7,21.", en:"7.21."},
   cands:[{v:7.16, code:"avgpop", ok:true, tol:0.006}, {v:0.721, code:"per100", tol:0.003}, {v:0.0072, code:"per1", tol:0.0001}, {v:721, code:"per100k", tol:0.6}, {v:138.7, code:"inverted", tol:0.3}]},
  {id:"k_r19", lo:7.2, hi:7.22, gen:"rateGen",
   q:{kk:"Қазақстан, 2019: мың адамға шаққанда", en:"Kazakhstan, 2019: deaths per 1,000 people"},
   calc:{kk:"132 621 / 18 394 642 × 1000 = 7,21", en:"132,621 / 18,394,642 × 1,000 = 7.21"},
   why:{kk:"7,21. Ел бойынша өлім деңгейі екі жылда өзгермеген: өлім саны халықпен бірдей қарқынмен өскен.", en:"7.21. The national death rate didn't move: deaths grew at exactly the pace of the population."},
   cands:[{v:7.16, code:"avgpop", ok:true, tol:0.006}, {v:0.721, code:"per100", tol:0.003}, {v:0.0072, code:"per1", tol:0.0001}, {v:721, code:"per100k", tol:0.6}, {v:138.7, code:"inverted", tol:0.3}]},
  {id:"m_rc", lo:5.6, hi:5.9, gen:"pcGen",
   q:{kk:"Маңғыстау: мың адамға шаққандағы өлім 2017 жылдан 2019 жылға қанша пайызға өсті?", en:"Mangystau: by what % did deaths per 1,000 change from 2017 to 2019?"},
   calc:{kk:"(4,49 − 4,25) / 4,25 × 100 = 5,6, ал дөңгелектемей есептесеңіз 5,8", en:"(4.49 − 4.25) / 4.25 × 100 = 5.6, or 5.8 without rounding"},
   why:{kk:"Шамамен 5,8 пайыз (дөңгелектелген сандардан 5,6). Бұл 11,6-ның жартысы: «өлім көбейді» деген тақырып екі есе үлкейтілген болып шықты.", en:"About 5.8% (5.6 from the rounded rates). That's half of 11.6: a \"deaths are up\" headline would double the real change."},
   cands:[{v:11.64, code:"absnotrate"}, {v:0.24, code:"ppNotPct", tol:0.011}, {v:5.5, code:"popchange", tol:0.04}, {v:5.35, code:"divnew", tol:0.06}]}
];

/* 5-қадам: шешім */
const VERD = [
  {id:"supp", t:{kk:"Расталды", en:"Supported"}},
  {id:"rej", t:{kk:"Жоққа шықты", en:"Not supported"}},
  {id:"nodata", t:{kk:"Дата жетпеді", en:"Not enough data"}}
];
const vOpts = codes => VERD.map(v => Object.assign({}, v, {code:codes[v.id]}));
EX.dec = {items: [
  {id:"d1", q:NV("Гипотеза: 2017–2019 жылдары Маңғыстауда мың адамға шаққандағы өлімнің өсімі ел бойынша өсімнен кемінде 1 пайыздық тармаққа асып түсті.", "Hypothesis: between 2017 and 2019, the rise in Mangystau's deaths per 1,000 beat the national rise by at least 1 percentage point."),
   opts:vOpts({rej:"decRejWrong", nodata:"decHaveData"}), ans:"supp",
   why:NV("Расталды: Маңғыстауда +5,8 пайыз, ел бойынша 0,0 пайыз. Айырма 5,8 пайыздық тармақ, шектен (1) әлдеқайда көп. Нөлдік гипотеза («тек халық өсті») бұл кезең үшін толық ақталмады: халық өсімі өсімнің жартысын ғана түсіндіреді.", "Supported: Mangystau +5.8%, national 0.0%. The gap is 5.8 percentage points, well above the threshold (1). The null (\"only the population grew\") doesn't fully hold for this period: population growth explains only half of the rise.")},
  {id:"d2", q:NV("Гипотеза: 2016–2019 жылдары Маңғыстауда мың адамға шаққандағы өлім жыл сайын өсті. (Кестедегі 2016 және 2018 жылдарды да есептеңіз.)", "Hypothesis: between 2016 and 2019, deaths per 1,000 in Mangystau rose every year. (Work out 2016 and 2018 from the table too.)"),
   opts:vOpts({supp:"decBaseYear", nodata:"decHaveData"}), ans:"rej",
   why:NV("Жоққа шықты: 4,46 (2016), 4,25 (2017), 4,55 (2018), 4,49 (2019). Деңгей төмендеп, көтеріліп, қайта түскен. 2017 жыл 2009 жылдан бергі ең төмен жыл болды, сондықтан одан бастаған өсім үлкен көрінеді. 2016 жылмен салыстырсақ, өсім 1 пайызға да жетпейді. Бастапқы жылды таңдау нәтижені өзгертеді.", "Not supported: 4.46 (2016), 4.25 (2017), 4.55 (2018), 4.49 (2019). The rate fell, rose, then fell again. 2017 was the lowest year since 2009, so any change measured from it looks big. From 2016 the rise is under 1%. The choice of starting year changes the result.")},
  {id:"d3", q:NV("Гипотеза: Маңғыстауда өлім деңгейі ел бойынша төмен, себебі облыс халқы жас.", "Hypothesis: Mangystau's death rate is below the national rate because the region's population is young."),
   opts:vOpts({supp:"decCausal", rej:"decNoEvidence"}), ans:"nodata",
   why:NV("Дата жетпеді: кестеде жас бойынша ештеңе жоқ. Деңгейдің төмендігі расталады (4,49 мен 7,21), бірақ «себебі» бөлігін тексеру үшін облыс халқының жас құрамы керек. Бұл 6-қадамның тақырыбы.", "Not enough data: the table has nothing on age. The lower rate is confirmed (4.49 vs 7.21), but checking the \"because\" part needs the region's age structure. That's step 6.")}
]};

/* 6-қадам: балама түсіндірмені жоққа шығаратын екінші дата */
EX.extra = {items: [
  {id:"x1", sec:"health",
   q:NV("Маңғыстауда мың адамға шаққандағы өлім ел бойынша деңгейден әлдеқайда төмен (4,49 мен 7,21). Ең ықтимал балама түсіндірме: облыс халқы жас. Мұны тексеру үшін қандай екінші дата керек?", "Mangystau's deaths per 1,000 are far below the national rate (4.49 vs 7.21). The most likely alternative explanation: the region's population is young. What second dataset tests that?"),
   opts:[
    {id:"a", t:NV("Облыс халқының жас құрамы және жас топтары бойынша өлім", "The region's age structure and deaths by age group")},
    {id:"b", code:"notalt", t:NV("Облыстағы аурухана саны", "Number of hospitals in the region")},
    {id:"c", code:"notalt", t:NV("Облыстағы орташа ауа температурасы", "Average air temperature in the region")},
    {id:"d", code:"notalt", t:NV("Облыстық денсаулық сақтау бюджеті", "Regional health budget")}],
   ans:"a",
   why:NV("Жасы үлкен адам көп өңірде өлім де көп. Жас құрамы ұқсас өңірлерді салыстыру немесе жас топтары бойынша өлімді қарау ғана «халқы жас» деген түсіндірмені тексереді. Аурухана мен бюджет басқа гипотезаға керек.", "A region with more older people has more deaths. Only age structure, or deaths by age group, tests the \"young population\" explanation. Hospitals and budgets belong to a different hypothesis.")},
  {id:"x2", sec:"fin",
   q:NV("Мысал (сан шартты): 2019–2023 жылдары бір облыста орташа жалақы 60 пайызға өсті, «демек тұрмыс жақсарды». Қандай екінші дата керек?", "Example (made-up number): between 2019 and 2023 the average wage in a region rose 60%, \"so living standards improved\". What second dataset do you need?"),
   opts:[
    {id:"a", code:"popNotHere", t:NV("Облыс халқының саны", "The region's population")},
    {id:"b", t:NV("Сол жылдардағы тұтыну бағасының индексі (инфляция)", "The consumer price index (inflation) for the same years")},
    {id:"c", code:"notalt", t:NV("Жұмыс істейтіндер саны", "The number of people in work")},
    {id:"d", code:"nodataset", t:NV("Жалақы туралы жаңалықтар", "News stories about wages")}],
   ans:"b",
   why:NV("Баға 60 пайыздан көп өссе, жалақы өскенмен тұрмыс жақсармаған. Ақшаға қатысты кез келген өсімді инфляциямен салыстырасыз: нақты жалақы.", "If prices rose more than 60%, living standards didn't improve. Any money figure gets compared with inflation: the real wage.")},
  {id:"x3", sec:"hr",
   q:NV("Мысал: ескі жинақта Шығыс Қазақстан облысының халқы 2022 жылдан 2023 жылға қарай күрт азайған болып көрінеді. Алдымен нені тексересіз?", "Example: in an older table, East Kazakhstan's population seems to drop sharply between 2022 and 2023. What do you check first?"),
   opts:[
    {id:"a", code:"migFirst", t:NV("Көші-қон статистикасы", "Migration statistics")},
    {id:"b", code:"notalt", t:NV("Қайтыс болғандар саны", "Number of deaths")},
    {id:"c", t:NV("Әкімшілік-аумақтық өзгеріс: 2022 жылы облыстан Абай облысы бөлініп шықты", "Boundary change: in 2022 Abai region was split off from it")},
    {id:"d", code:"notalt", t:NV("Туу саны", "Number of births")}],
   ans:"c",
   why:NV("Халық бір жылда үштен бірге «азаюы» адамдардан емес, шекарадан болуы мүмкін. 2018 жылы (Шымкент пен Түркістан) және 2022 жылы (Абай, Жетісу, Ұлытау) облыстар өзгерді. Ұзақ қатарды салыстырмас бұрын кестенің ескертпесін оқыңыз: бюро деректерді жаңа шекараға қайта есептеген бе?", "A third of a population \"vanishing\" in a year is more likely boundaries than people. Regions changed in 2018 (Shymkent and Turkistan) and 2022 (Abai, Zhetisu, Ulytau). Before comparing a long series, read the table's footnote: has the Bureau recalculated the data to the new boundaries?")},
  {id:"x4", sec:"sec",
   q:NV("Мысал (сан шартты): бір облыста тұрмыстық зорлық туралы тіркелген арыз саны бір жылда екі есе өсті. Қандай түсіндірмені алдымен жоққа шығару керек?", "Example (made-up number): registered domestic-violence complaints in a region doubled in a year. Which explanation do you rule out first?"),
   opts:[
    {id:"a", t:NV("Тіркеу тәртібі не заң өзгерді: арызды қалай, қай жерде тіркейтіні", "A change in the law or in how complaints are registered")},
    {id:"b", code:"popNotHere", t:NV("Облыс халқы көбейді", "The region's population grew")},
    {id:"c", code:"notalt", t:NV("Тұтыну бағасы өсті", "Consumer prices rose")},
    {id:"d", code:"nodataset", t:NV("Полицияның баспасөз хабарламалары", "Police press releases")}],
   ans:"a",
   why:NV("Тіркелген оқиғаның саны оқиғаның өзін емес, тіркеуді өлшейді. Заң не тәртіп өзгерсе, арыз беру оңайлап, сан өседі, ал зорлық көбеймеуі мүмкін. Халық бір жылда екі есе өспейді.", "A count of registered cases measures registration, not the event itself. If the law or procedure changed, reporting gets easier and the count rises even if violence didn't. Populations don't double in a year.")}
]};

/* 7-қадам: үлгі стори (драфт). Сандар: _ҮЛГІ_СТОРИ_ТЕКСЕРУГЕ.md */
const STORY = {
kk: `<div class="story"><span class="badge">Үлгі · Асхат Еркімбай (драфт)</span>
<h3>Маңғыстауда өлім көбейді ме, әлде тұрғын көбейді ме?</h3>
<p class="p-lead"><span class="lab">Лид</span>2019 жылы Маңғыстау облысында 3 051 адам қайтыс болды. Бұл 2017 жылғыдан 11,6 пайыз көп, ал бүкіл елде өлім осы екі жылда 2,7 пайызға ғана өскен.</p>
<p class="p-nut"><span class="lab">Нат-граф: сан, салыстыру, күмән, келесі тексеру</span>Алайда бұл өсімнің жартысына жуығын облыс халқының өзі түсіндіреді: екі жылда Маңғыстау тұрғындары 5,5 пайызға көбейді. Мың адамға шаққанда өлім 4,25-тен 4,49-ға көтерілді, яғни 5,8 пайызға өсті, ал ел бойынша бұл көрсеткіш 7,21 деңгейінде қалды. Өсім бар, бірақ алғашқы санның жартысындай ғана. Оның үстіне 2017 жыл облыста өлім деңгейі 2009 жылдан бергі ең төмен түскен жыл еді. 2016 жылмен салыстырсақ (4,46), айырма 1 пайызға да жетпейді. Келесі тексеру: облыс халқының жас құрамы мен өлім себептері.</p>
<p class="p-ev"><span class="lab">Дәлел</span>Маңғыстау 2019 жылы да өлім деңгейі ең төмен өңірлердің бірі болды: бюроның ресми коэффициенті бойынша Астанадан кейін екінші орында. Бұл облыс халқының жас екенімен байланысты болуы мүмкін, бірақ оны тек жас бойынша дата көрсетеді.</p>
<p class="p-src"><span class="lab">Дереккөз жолы</span>Дереккөз: ҚР Стратегиялық жоспарлау және реформалар агенттігінің Ұлттық статистика бюросы, «Қайтыс болғандар саны» және «Халық саны, жыл басына» кестелері, 2016–2019. Мың адамға шаққан көрсеткішті автор жыл басындағы халық санымен есептеді. Бюроның ресми коэффициенті жылдың орташа халқымен есептеледі (Маңғыстау: 4,19 және 4,43).</p></div>`,
en: `<div class="story"><span class="badge">Model · Askhat Yerkimbay (draft)</span>
<h3>More deaths in Mangystau, or more people?</h3>
<p class="p-lead"><span class="lab">Lead</span>In 2019, 3,051 people died in Mangystau region, 11.6% more than in 2017. Across Kazakhstan, deaths rose by just 2.7% over the same two years.</p>
<p class="p-nut"><span class="lab">Nut graf: number, comparison, doubt, next check</span>But the region's own growth explains nearly half of that rise: Mangystau's population grew 5.5% in those two years. Per 1,000 residents, deaths went from 4.25 to 4.49, up 5.8%, while the national rate stayed flat at 7.21. So there is a rise, but it's about half the size the raw count suggests. And 2017 is a shaky starting point: it was the region's lowest death rate since 2009. Measured from 2016 (4.46), the increase is under 1%. The next check: the region's age structure and causes of death.</p>
<p class="p-ev"><span class="lab">Evidence</span>Mangystau still had one of the lowest death rates in the country in 2019, second only to Astana on the Bureau's official rate. A young population may explain that, but only data by age can show it.</p>
<p class="p-src"><span class="lab">Source line</span>Source: Bureau of National Statistics, Agency for Strategic Planning and Reforms of Kazakhstan; tables "Number of deaths" and "Population, start of year", 2016–2019. Rates per 1,000 calculated by the author using start-of-year population. The Bureau's official rate uses the average annual population (Mangystau: 4.19 and 4.43).</p></div>`
};
