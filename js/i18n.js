// UI strings. Never use long dashes here.
const az = (g) => (g === 5 || g === 1 ? 'Az' : 'A');
// Ukrainian plural: 1 задача, 2-4 задачі, 5+ задач
export const ukPl = (n, one, few, many) => {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
};
const zad = (n) => `${n} ${ukPl(n, 'задача', 'задачі', 'задач')}`;
export const STR = {
  hu: {
    appName: 'Zrínyi gyakorló',
    tagline: 'Szia, Archie vagyok! Gyere, gyakoroljunk együtt a Zrínyi Ilona Matematikaversenyre!',
    chooseGrade: 'Hányadikos vagy?',
    grade: 'osztály',
    gradeN: (g) => `${g}. osztály`,
    parents: 'Szülőknek',
    back: 'Vissza',
    home: 'Főoldal',
    loading: 'Töltöm a feladatokat...',
    loadError: 'Nem sikerült betölteni a feladatokat. Van internet?',
    retry: 'Újra',
    comingSoonTitle: 'Hamarosan!',
    comingSoonText: (g) => `${az(g)} ${g}. osztályos feladatokon még dolgozunk. Nemsokára itt lesznek!`,
    otherGrade: 'Másik osztály',
    hello: (n) => n ? `Szia, ${n}!` : 'Szia!',
    helloSub: 'Mit gyakorolunk ma?',
    statSessions: 'kör',
    statAccuracy: 'pontosság',
    statStreak: 'nap egymás után',
    statStreak1: 'nap',
    lastScore: 'utolsó',
    modeQuick: 'Gyors gyakorlás',
    modeQuickSub: '10 vegyes feladat, nincs időkorlát',
    modeTopics: 'Témák',
    modeTopicsSub: 'Válassz egy témát',
    modeMock: 'Próbaverseny',
    modeMockSub: (n, m) => `${n} feladat, ${m} perc, igazi pontozás`,
    modeMistakes: 'Hibák javítása',
    modeMistakesSub: (n) => n ? `${n} feladat vár javításra` : 'Most nincs javítandó hiba',
    modeProgress: 'Haladásom',
    modeProgressSub: 'Eredmények, jelvények',
    resumeTitle: 'Van egy félbehagyott köröd',
    resumeText: (d, n) => `${d}/${n} feladat kész.`,
    resume: 'Folytatom',
    discard: 'Elvetem',
    topicsTitle: 'Válassz témát!',
    topicCount: (n) => `${n} feladat`,
    mastery: 'tudás',
    notTried: 'még nem próbáltad',
    nicknameTitle: 'Engem Archie-nak hívnak. És téged?',
    nicknameText: 'Ha többen használjátok ezt a gépet, így mindenki a saját eredményeit látja. Nem kötelező.',
    nicknamePh: 'Becenév',
    save: 'Mentés',
    skipIt: 'Most nem',
    editName: 'Név módosítása',
    // quiz
    question: 'Feladat',
    skip: 'Kihagyom',
    done: 'Kész',
    next: 'Következő',
    prev: 'Előző',
    quit: 'Kilépés',
    quitTitle: 'Biztosan kilépsz?',
    quitText: 'Ez a kör nem számít bele az eredményeidbe.',
    stay: 'Maradok',
    leave: 'Kilépek',
    pickAnswer: 'Válassz egy választ, aztán nyomd meg: Kész.',
    pause: 'Szünet',
    paused: 'Szünet',
    pausedText: 'Az óra áll. Pihenj egy kicsit, aztán folytasd!',
    continue: 'Folytatom',
    grid: 'Feladatok',
    finish: 'Befejezem',
    finishTitle: 'Beadod a dolgozatot?',
    finishText: (u) => u ? `Még ${u} feladatra nem válaszoltál. Ezek 0 pontot érnek.` : 'Minden feladatra válaszoltál. Szép munka!',
    finishYes: 'Beadom',
    finishNo: 'Még nézem',
    timeUp: 'Lejárt az idő!',
    answered: 'megválaszolva',
    notAnswered: 'nincs válasz',
    current: 'ez a mostani',
    clearAnswer: 'Válasz törlése',
    mockIntroTitle: 'Próbaverseny',
    mockIntroLead: (n, m) => `${n} feladat, könnyűtől a nehézig, ${m} perc. Ugyanúgy, mint az igazi versenyen!`,
    scoringTitle: 'Így számoljuk a pontokat',
    scStart: 'Kezdésként kapsz',
    scCorrect: 'Helyes válasz',
    scWrong: 'Rossz válasz',
    scSkip: 'Kihagyott feladat',
    scMax: (m) => `Legfeljebb ${m} pont szerezhető.`,
    scTip: 'Ha fogalmad sincs, inkább hagyd ki! A vaktában tippelés pontot vesz el.',
    mockRules: ['Bármikor visszaugorhatsz egy korábbi feladatra.', 'Az órát megállíthatod, ha szünet kell.', 'A végén mindent együtt nézünk meg.'],
    start: 'Indulhat!',
    points: 'pont',
    // micro copy
    cheer: [
      'Ügyesen gondolkodsz!',
      'Csak így tovább!',
      'Szépen haladsz!',
      'Nyugodtan, lépésről lépésre.',
      'Már félúton vagy!',
      'Remek kitartás!',
      'Figyelmesen olvasd el a következőt is!'
    ],
    // results
    resultsTitle: 'Kész vagy!',
    resultsGreat: 'Fantasztikus!',
    resultsGood: 'Szép munka!',
    resultsOk: 'Jó kezdet!',
    resultsLow: 'Gyakoroljunk együtt!',
    correct: 'helyes',
    wrong: 'rossz',
    skipped: 'kihagyva',
    zrinyiScore: 'Zrínyi-pontszám',
    timeSpent: 'Idő',
    newRecord: 'Új rekord!',
    prevBest: (v) => `Eddigi legjobb: ${v}`,
    firstTime: 'Ez az első ilyen köröd!',
    byTopic: 'Témák szerint',
    allProblems: 'Az összes feladat',
    showSolution: 'Megoldás',
    yourAnswer: 'A te válaszod',
    rightAnswer: 'Helyes válasz',
    noAnswer: 'Nem válaszoltál',
    reviewMistakes: 'Nézzük meg a hibákat!',
    noMistakes: 'Nincs mit javítani. Hibátlan!',
    again: 'Új kör',
    toHome: 'Vissza a főoldalra',
    minutes: 'perc',
    seconds: 'mp',
    // review
    reviewTitle: 'Hibák javítása',
    reviewOf: (i, n) => `${i}. / ${n}`,
    understandWhy: 'Értem, miért választottad ezt...',
    skippedBefore: 'Ezt a feladatot kihagytad. Semmi baj, nézzük meg most együtt!',
    hintTitle: 'Segítség',
    tryAgain: 'Próbáld újra!',
    tryAgainSub: 'Válassz egy másik választ!',
    tryNow: 'Próbáld meg!',
    check: 'Ellenőrzöm',
    fixedYourself: 'Magadtól javítottad!',
    fixedText: 'Ez igen! Most már érted ezt a feladatot.',
    solvedNow: 'Most sikerült!',
    notYet: 'Még nem ez az.',
    oneMore: 'Van még egy próbálkozásod.',
    letsSolve: 'Semmi baj, oldjuk meg együtt, lépésről lépésre!',
    showSteps: 'Mutasd a megoldást',
    solution: 'Megoldás',
    nextStep: 'Következő lépés',
    stepN: (i, n) => `${i}. lépés / ${n}`,
    rememberIt: 'Jegyezd meg!',
    nextMistake: 'Következő',
    finishReview: 'Befejezem',
    reviewDoneTitle: 'Végeztél a javítással!',
    reviewDoneText: (x, y) => `${y} feladatból ${x} sikerült magadtól!`,
    reviewDoneZero: 'Minden megoldást végignéztél. Legközelebb már menni fog!',
    disabledChoice: 'ezt már választottad',
    // progress
    progressTitle: 'Haladásom',
    accuracyOverTime: 'Pontosság körről körre',
    noSessions: 'Még nincs befejezett kör. Kezdj el egy gyakorlást!',
    topicMastery: 'Témák',
    bestMock: 'Legjobb próbaverseny',
    noMock: 'még nincs',
    badges: 'Jelvények',
    history: 'Korábbi körök',
    exportBtn: 'Haladás mentése fájlba',
    importBtn: 'Haladás betöltése fájlból',
    resetBtn: 'Haladás törlése (ennél az osztálynál)',
    resetTitle: 'Biztosan törlöd?',
    resetText: (g) => `${az(g)} ${g}. osztály minden eredménye és jelvénye törlődik ezen a készüléken.`,
    resetYes: 'Törlöm',
    cancel: 'Mégse',
    importTitle: 'Betöltöd a fájlt?',
    importText: (gs) => `A fájlban ezek az osztályok vannak: ${gs}. Ezeknél a mostani haladás felülíródik.`,
    importYes: 'Betöltöm',
    importOk: 'Kész, betöltöttem!',
    importBad: 'Ez a fájl nem a Zrínyi gyakorló mentése.',
    exportOk: 'Elmentve!',
    transferNote: 'Más készülékre úgy viheted át, hogy itt elmented, ott pedig betöltöd a fájlt.',
    sessions: 'kör',
    modeNames: { quick: 'Gyors gyakorlás', topic: 'Téma', mock: 'Próbaverseny', mistakes: 'Hibák javítása' },
    badgeDefs: {
      first: ['Első lépés', 'Befejezted az első kört'],
      streak3: ['Három nap', '3 napig egymás után gyakoroltál'],
      streak7: ['Egy hét', '7 napig egymás után gyakoroltál'],
      fix10: ['Hibavadász', '10 hibát magadtól javítottál'],
      perfect: ['Hibátlan 10', '10 feladatból 10 helyes'],
      mockDone: ['Versenyző', 'Végigcsináltál egy próbaversenyt'],
      mock100: ['Százas klub', 'Legalább 100 pont a próbaversenyen'],
      sessions10: ['Kitartó', '10 befejezett kör'],
      explorer: ['Felfedező', 'Minden témát kipróbáltál']
    },
    newBadge: 'Új jelvény!',
    // parents
    parentsTitle: 'Szülőknek',
    langName: 'Magyar'
  },
  uk: {
    appName: 'Zrínyi тренажер',
    tagline: 'Привіт, я Арчі! Ходімо разом готуватися до математичного конкурсу імені Ілони Зріні!',
    chooseGrade: 'У якому ти класі?',
    grade: 'клас',
    gradeN: (g) => `${g} клас`,
    parents: 'Батькам',
    back: 'Назад',
    home: 'Головна',
    loading: 'Завантажую задачі...',
    loadError: 'Не вдалося завантажити задачі. Є інтернет?',
    retry: 'Ще раз',
    comingSoonTitle: 'Незабаром!',
    comingSoonText: (g) => `Задачі для ${g} класу ще готуються. Скоро вони зʼявляться!`,
    otherGrade: 'Інший клас',
    hello: (n) => n ? `Привіт, ${n}!` : 'Привіт!',
    helloSub: 'Що тренуємо сьогодні?',
    statSessions: 'тренувань',
    statAccuracy: 'точність',
    statStreak: 'днів поспіль',
    statStreak1: 'днів',
    lastScore: 'останнє',
    modeQuick: 'Швидке тренування',
    modeQuickSub: '10 різних задач, без обмеження часу',
    modeTopics: 'Теми',
    modeTopicsSub: 'Обери одну тему',
    modeMock: 'Пробний конкурс',
    modeMockSub: (n, m) => `${zad(n)}, ${m} хв, справжні бали`,
    modeMistakes: 'Робота над помилками',
    modeMistakesSub: (n) => n ? `${zad(n)} ${n % 10 === 1 && n % 100 !== 11 ? 'чекає' : 'чекають'} на виправлення` : 'Зараз немає помилок для виправлення',
    modeProgress: 'Мій прогрес',
    modeProgressSub: 'Результати, значки',
    resumeTitle: 'У тебе є незавершене тренування',
    resumeText: (d, n) => `Виконано ${d} з ${n} задач.`,
    resume: 'Продовжити',
    discard: 'Скасувати',
    topicsTitle: 'Обери тему!',
    topicCount: (n) => zad(n),
    mastery: 'знання',
    notTried: 'ще не було спроб',
    nicknameTitle: 'Мене звати Арчі. А тебе?',
    nicknameText: 'Якщо цим пристроєм користуються кілька дітей, так кожен бачитиме свої результати. Це необовʼязково.',
    nicknamePh: 'Імʼя',
    save: 'Зберегти',
    skipIt: 'Не зараз',
    editName: 'Змінити імʼя',
    question: 'Задача',
    skip: 'Пропустити',
    done: 'Готово',
    next: 'Далі',
    prev: 'Назад',
    quit: 'Вийти',
    quitTitle: 'Точно вийти?',
    quitText: 'Це тренування не зарахується в результати.',
    stay: 'Залишитися',
    leave: 'Вийти',
    pickAnswer: 'Обери відповідь і натисни "Готово".',
    pause: 'Пауза',
    paused: 'Пауза',
    pausedText: 'Годинник зупинено. Відпочинь трохи і продовжуй!',
    continue: 'Продовжити',
    grid: 'Задачі',
    finish: 'Завершити',
    finishTitle: 'Здаєш роботу?',
    finishText: (u) => u ? `Ще ${zad(u)} без відповіді. За них буде 0 балів.` : 'Відповіді є на всі задачі. Чудова робота!',
    finishYes: 'Здаю',
    finishNo: 'Ще перевірю',
    timeUp: 'Час вийшов!',
    answered: 'є відповідь',
    notAnswered: 'немає відповіді',
    current: 'поточна',
    clearAnswer: 'Стерти відповідь',
    mockIntroTitle: 'Пробний конкурс',
    mockIntroLead: (n, m) => `${zad(n)}, від легких до складних, ${m} хвилин. Так само, як на справжньому конкурсі!`,
    scoringTitle: 'Як рахуються бали',
    scStart: 'На початку ти отримуєш',
    scCorrect: 'Правильна відповідь',
    scWrong: 'Неправильна відповідь',
    scSkip: 'Пропущена задача',
    scMax: (m) => `Максимум можна набрати ${m} балів.`,
    scTip: 'Якщо зовсім не знаєш, краще пропусти! Вгадування навмання забирає бали.',
    mockRules: ['Можна будь-коли повернутися до попередньої задачі.', 'Годинник можна зупинити, якщо потрібна перерва.', 'Наприкінці все розберемо разом.'],
    start: 'Почати!',
    points: 'балів',
    cheer: [
      'Гарно міркуєш!',
      'Так тримати!',
      'Чудово просуваєшся!',
      'Спокійно, крок за кроком.',
      'Ти вже на півдорозі!',
      'Яка наполегливість!',
      'Уважно прочитай і наступну!'
    ],
    resultsTitle: 'Готово!',
    resultsGreat: 'Неймовірно!',
    resultsGood: 'Гарна робота!',
    resultsOk: 'Добрий початок!',
    resultsLow: 'Потренуймося разом!',
    correct: 'правильно',
    wrong: 'помилки',
    skipped: 'пропущено',
    zrinyiScore: 'Бали Zrínyi',
    timeSpent: 'Час',
    newRecord: 'Новий рекорд!',
    prevBest: (v) => `Попередній найкращий: ${v}`,
    firstTime: 'Це твоє перше таке тренування!',
    byTopic: 'За темами',
    allProblems: 'Усі задачі',
    showSolution: 'Розвʼязок',
    yourAnswer: 'Твоя відповідь',
    rightAnswer: 'Правильна відповідь',
    noAnswer: 'Без відповіді',
    reviewMistakes: 'Розберімо помилки!',
    noMistakes: 'Нічого виправляти. Без жодної помилки!',
    again: 'Ще раз',
    toHome: 'На головну',
    minutes: 'хв',
    seconds: 'с',
    reviewTitle: 'Робота над помилками',
    reviewOf: (i, n) => `${i} з ${n}`,
    understandWhy: 'Розумію, чому ти обрав це...',
    skippedBefore: 'Цю задачу ти пропустив. Нічого страшного, розберімо її разом!',
    hintTitle: 'Підказка',
    tryAgain: 'Спробуй ще раз!',
    tryAgainSub: 'Обери іншу відповідь!',
    tryNow: 'Спробуй!',
    check: 'Перевірити',
    fixedYourself: 'Ти сам виправив!',
    fixedText: 'Оце так! Тепер ти розумієш цю задачу.',
    solvedNow: 'Цього разу вийшло!',
    notYet: 'Ще не те.',
    oneMore: 'У тебе є ще одна спроба.',
    letsSolve: 'Нічого страшного, розвʼяжімо разом, крок за кроком!',
    showSteps: 'Показати розвʼязок',
    solution: 'Розвʼязок',
    nextStep: 'Наступний крок',
    stepN: (i, n) => `Крок ${i} з ${n}`,
    rememberIt: 'Запамʼятай!',
    nextMistake: 'Наступна',
    finishReview: 'Завершити',
    reviewDoneTitle: 'Помилки розібрано!',
    reviewDoneText: (x, y) => `${x} з ${y} задач ти виправив сам!`,
    reviewDoneZero: 'Усі розвʼязки переглянуто. Наступного разу вийде!',
    disabledChoice: 'це вже обрано',
    progressTitle: 'Мій прогрес',
    accuracyOverTime: 'Точність від тренування до тренування',
    noSessions: 'Ще немає завершених тренувань. Почни перше!',
    topicMastery: 'Теми',
    bestMock: 'Найкращий пробний конкурс',
    noMock: 'ще немає',
    badges: 'Значки',
    history: 'Попередні тренування',
    exportBtn: 'Зберегти прогрес у файл',
    importBtn: 'Завантажити прогрес з файлу',
    resetBtn: 'Скинути прогрес (для цього класу)',
    resetTitle: 'Точно скинути?',
    resetText: (g) => `Усі результати і значки ${g} класу на цьому пристрої буде видалено.`,
    resetYes: 'Скинути',
    cancel: 'Скасувати',
    importTitle: 'Завантажити файл?',
    importText: (gs) => `У файлі є такі класи: ${gs}. Для них поточний прогрес буде замінено.`,
    importYes: 'Завантажити',
    importOk: 'Готово, завантажено!',
    importBad: 'Це не файл збереження Zrínyi тренажера.',
    exportOk: 'Збережено!',
    transferNote: 'Щоб перенести прогрес на інший пристрій, збережи файл тут і завантаж його там.',
    sessions: 'тренувань',
    modeNames: { quick: 'Швидке тренування', topic: 'Тема', mock: 'Пробний конкурс', mistakes: 'Робота над помилками' },
    badgeDefs: {
      first: ['Перший крок', 'Перше завершене тренування'],
      streak3: ['Три дні', '3 дні тренувань поспіль'],
      streak7: ['Тиждень', '7 днів тренувань поспіль'],
      fix10: ['Мисливець на помилки', '10 помилок виправлено самостійно'],
      perfect: ['Ідеальні 10', '10 з 10 правильно'],
      mockDone: ['Учасник', 'Пробний конкурс пройдено'],
      mock100: ['Клуб 100', 'Щонайменше 100 балів у пробному конкурсі'],
      sessions10: ['Наполегливий', '10 завершених тренувань'],
      explorer: ['Дослідник', 'Усі теми спробувано']
    },
    newBadge: 'Новий значок!',
    parentsTitle: 'Батькам',
    langName: 'Українська'
  }
};

export const TOPICS = {
  numbers: { icon: '🔢', hu: 'Számok', uk: 'Числа' },
  operations: { icon: '➕', hu: 'Műveletek', uk: 'Дії з числами' },
  measures: { icon: '📏', hu: 'Mértékegységek', uk: 'Величини' },
  time: { icon: '⏰', hu: 'Idő és naptár', uk: 'Час і календар' },
  geometry: { icon: '🔷', hu: 'Geometria', uk: 'Геометрія' },
  logic: { icon: '🧩', hu: 'Logika', uk: 'Логіка' },
  combinatorics: { icon: '🎲', hu: 'Hányféleképpen?', uk: 'Скількома способами?' },
  patterns: { icon: '🔁', hu: 'Sorozatok, minták', uk: 'Закономірності' },
  word: { icon: '📖', hu: 'Szöveges feladatok', uk: 'Текстові задачі' }
};

export const BADGE_ICONS = {
  first: '🌱', streak3: '🔥', streak7: '🏅', fix10: '🔍', perfect: '💯',
  mockDone: '🎯', mock100: '🏆', sessions10: '💪', explorer: '🧭'
};

// Parents page content (rich HTML, trusted, authored here)
export const PARENTS = {
  hu: `
  <h2>Mi a Zrínyi?</h2>
  <p>A Zrínyi Ilona Matematikaverseny (szervező: MATEGYE Alapítvány) a magyar nyelvű iskolák legnagyobb matematikaversenye, 2-8. osztályosoknak. Kárpátalján is sok magyar iskola vesz részt rajta.</p>
  <h2>Formátum és pontozás</h2>
  <ul>
    <li>2-6. osztályban 25, 7-8. osztályban 30 feleletválasztós feladat (a régi feladatlapok alapján), mindegyiknél 5 lehetőség (A-E), pontosan egy helyes.</li>
    <li>Időtartam a gyakorlóban: 2-4. osztály 60 perc, 5-6. osztály 75 perc, 7-8. osztály 90 perc. Az idei pontos szabályokat a mategye.hu oldalon érdemes ellenőrizni.</li>
    <li>Pontozás: helyes válasz +4 pont, rossz válasz -1 pont, kihagyott 0 pont, és mindenki annyi ponttal indul, ahány feladat van. 25 feladatnál a legtöbb 125, 30 feladatnál 150 pont.</li>
    <li>Ezért vaktában tippelni nem érdemes, de ha 2-3 lehetőséget már ki tud zárni a gyerek, akkor igen.</li>
  </ul>
  <h2>Időpontok 2026/27</h2>
  <ul class="dates">
    <li><b>1. forduló (iskolai):</b> 2026. november 23., 14:30, a saját iskolában</li>
    <li><b>2. forduló (megyei):</b> 2027. február 19., 14:30</li>
    <li><b>Országos döntő:</b> 2027. április 3-5.</li>
  </ul>
  <h2>Hogyan használjuk az oldalt?</h2>
  <ul>
    <li><b>Gyors gyakorlás:</b> 10 vegyes feladat. A gyerek a kör végén látja az eredményt, nem feladatonként.</li>
    <li><b>Témák:</b> ha egy terület nehezebben megy, 10 feladat csak abból.</li>
    <li><b>Próbaverseny:</b> 25 (7-8. osztályban 30) feladat könnyűtől a nehézig, valódi időkorláttal és pontozással. Megállítható.</li>
    <li><b>Hibák javítása:</b> a legfontosabb rész. Minden hibánál előbb elmagyarázzuk, miért választhatta a gyerek azt a választ, adunk egy rávezető kérdést, és még egyszer megpróbálhatja. Csak ezután jön a lépésenkénti megoldás.</li>
    <li>Tipp: 10-15 perc naponta többet ér, mint egy hosszú hétvégi alkalom. Üljön le mellé, és kérje meg, hogy hangosan gondolkodjon!</li>
  </ul>
  <h2>Adatok</h2>
  <p>A haladást csak ez a készülék tárolja (a böngésző localStorage-ában), semmit nem küldünk el sehova. Ha több gyerek használja ugyanazt a készüléket, az eredmények osztályonként külön vannak. A Haladásom oldalon fájlba mentheti és másik készüléken betöltheti.</p>
  <h2>A feladatokról</h2>
  <p>A valódi feladatok korábbi Zrínyi-versenyek feladatlapjairól származnak (MATEGYE Alapítvány), egyes ábrákat újrarajzoltunk. A többi feladatot ehhez az oldalhoz írtuk, hasonló stílusban. Minden válasz ellenőrizve van, de ha hibát talál, kérjük, jelezze.</p>
  `,
  uk: `
  <h2>Що таке Zrínyi?</h2>
  <p>Математичний конкурс імені Ілони Зріні (організатор: фонд MATEGYE) це найбільший математичний конкурс для угорськомовних шкіл, для учнів 2-8 класів. На Закарпатті в ньому теж беруть участь багато угорських шкіл.</p>
  <h2>Формат і бали</h2>
  <ul>
    <li>У 2-6 класах 25, у 7-8 класах 30 тестових задач (за старими бланками), у кожній 5 варіантів (A-E), правильний рівно один.</li>
    <li>Час у тренажері: 2-4 клас 60 хвилин, 5-6 клас 75 хвилин, 7-8 клас 90 хвилин. Точні правила цього року варто звірити на mategye.hu.</li>
    <li>Бали: правильна відповідь +4, неправильна -1, пропущена 0, і кожен починає з такої кількості балів, скільки задач. При 25 задачах максимум 125, при 30 задачах 150.</li>
    <li>Тому вгадувати навмання не варто, але якщо дитина вже відкинула 2-3 варіанти, то варто.</li>
  </ul>
  <h2>Дати 2026/27</h2>
  <ul class="dates">
    <li><b>1-й тур (шкільний):</b> 23 листопада 2026, 14:30, у своїй школі</li>
    <li><b>2-й тур (обласний, megyei):</b> 19 лютого 2027, 14:30</li>
    <li><b>Фінал (у Угорщині):</b> 3-5 квітня 2027</li>
  </ul>
  <h2>Як користуватися сайтом</h2>
  <ul>
    <li><b>Швидке тренування:</b> 10 різних задач. Дитина бачить результат наприкінці, а не після кожної задачі.</li>
    <li><b>Теми:</b> якщо якась тема дається важче, 10 задач лише з неї.</li>
    <li><b>Пробний конкурс:</b> 25 (у 7-8 класі 30) задач від легких до складних, зі справжнім часом і балами. Можна поставити на паузу.</li>
    <li><b>Робота над помилками:</b> найважливіша частина. Для кожної помилки спершу пояснюємо, чому дитина могла обрати цю відповідь, даємо навідне питання і ще одну спробу. Лише потім показуємо розвʼязок крок за кроком.</li>
    <li>Порада: 10-15 хвилин щодня дають більше, ніж одне довге заняття у вихідні. Сядьте поруч і попросіть дитину міркувати вголос!</li>
  </ul>
  <h2>Дані</h2>
  <p>Прогрес зберігається лише на цьому пристрої (у localStorage браузера), нікуди не надсилається. Якщо пристроєм користуються кілька дітей, результати зберігаються окремо для кожного класу. На сторінці "Мій прогрес" можна зберегти прогрес у файл і завантажити його на іншому пристрої.</p>
  <h2>Про задачі</h2>
  <p>Справжні задачі взято з минулих конкурсів Zrínyi (фонд MATEGYE Alapítvány), деякі рисунки перемальовано. Інші задачі написано для цього сайту в схожому стилі. Усі відповіді перевірено, але якщо знайдете помилку, будь ласка, повідомте.</p>
  `
};
