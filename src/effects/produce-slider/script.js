(() => {
  const section = document.querySelector(".produce-section");
  const stage = document.querySelector(".slider-stage");
  const active = document.querySelector(".active-slide");
  const prev = document.querySelector(".nav-prev");
  const next = document.querySelector(".nav-next");
  const dots = [...document.querySelectorAll(".pagination button")];
  const tabs = [...document.querySelectorAll(".category-nav button")];
  const progress = document.querySelector(".progress-bar");
  const pauseButton = document.querySelector(".autoplay-toggle");
  const langButtons = [...document.querySelectorAll(".lang-btn")];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const data = [
    {ar:"الخضروات الورقية",en:"Leafy Greens",kickerAr:"طازجة من المزارع",kickerEn:"FRESH FROM THE FARM",descAr:"أوراق خضراء مختارة بعناية، بطعم طازج وجودة تحافظ على قيمتها.",descEn:"Carefully selected leafy greens, fresh in taste and quality.",icon:"♧"},
    {ar:"الفواكه",en:"Fruits",kickerAr:"من أجود المزارع",kickerEn:"FROM TRUSTED FARMS",descAr:"تشكيلة غنية من الفواكه الطازجة، المحلية والمستوردة، لتصل إليكم بجودة تستحقونها.",descEn:"A vibrant selection of fresh local and imported fruits, delivered with the quality you expect.",icon:"✿"},
    {ar:"الخضروات",en:"Vegetables",kickerAr:"جودة في كل محصول",kickerEn:"QUALITY IN EVERY HARVEST",descAr:"خضروات متنوعة يتم اختيارها وتجهيزها لتلبية احتياجات عملائنا على مدار العام.",descEn:"A versatile range of vegetables selected to serve our customers throughout the year.",icon:"♢"},
    {ar:"المحاصيل الأساسية",en:"Essential Crops",kickerAr:"إمداد موثوق",kickerEn:"RELIABLE SUPPLY",descAr:"محاصيل أساسية من مصادر موثوقة، مع اهتمام بالجودة واستمرارية التوريد.",descEn:"Essential crops from trusted sources, with a focus on quality and dependable supply.",icon:"▱"},
    {ar:"منتجات موسمية",en:"Seasonal Products",kickerAr:"الأفضل في موسمه",kickerEn:"BEST IN SEASON",descAr:"منتجات موسمية مختارة وفق توافر المحاصيل وأفضل مواسم الحصاد.",descEn:"Seasonal selections chosen around availability and the best harvest periods.",icon:"◷"}
  ];

  let index = 1;
  let lang = "ar";
  let timer = null;
  let paused = reduceMotion;
  let startX = 0;
  let startY = 0;
  let pointerDown = false;
  const interval = 5000;

  function setLanguage(nextLang) {
    lang = nextLang;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.querySelectorAll("[data-ar][data-en]").forEach(el => {
      el.textContent = el.dataset[lang];
    });
    langButtons.forEach(btn => btn.classList.toggle("is-active", btn.dataset.lang === lang));
    render();
  }

  function render() {
    const current = data[index];
    active.dataset.index = index;
    active.querySelector(".active-copy .category-icon").textContent = current.icon;
    active.querySelector(".copy-kicker").textContent = lang === "ar" ? current.kickerAr : current.kickerEn;
    active.querySelector(".active-copy h2").textContent = lang === "ar" ? current.ar : current.en;
    active.querySelector(".active-copy p").textContent = lang === "ar" ? current.descAr : current.descEn;
    active.querySelector(".slide-count").innerHTML = `<strong>${String(index + 1).padStart(2,"0")}</strong> / 05`;

    const leftIndex = (index + data.length - 1) % data.length;
    const rightIndex = (index + 1) % data.length;
    const left = document.querySelector('.side-slide[data-index="0"]');
    const right = document.querySelector('.side-slide[data-index="2"]');
    left.dataset.index = leftIndex;
    right.dataset.index = rightIndex;
    left.querySelector(".side-copy .category-icon").textContent = data[leftIndex].icon;
    left.querySelector(".side-copy h2").textContent = lang === "ar" ? data[leftIndex].ar : data[leftIndex].en;
    left.querySelector(".side-en").textContent = data[leftIndex].en.toUpperCase();
    right.querySelector(".side-copy .category-icon").textContent = data[rightIndex].icon;
    right.querySelector(".side-copy h2").textContent = lang === "ar" ? data[rightIndex].ar : data[rightIndex].en;
    right.querySelector(".side-en").textContent = data[rightIndex].en.toUpperCase();

    dots.forEach((dot,i) => dot.classList.toggle("is-active", i === index));
    tabs.forEach(tab => tab.classList.toggle("is-active", Number(tab.dataset.go) === index));
    progress.style.transition = "none";
    progress.style.width = "0%";
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!paused && !reduceMotion) {
        progress.style.transition = `width ${interval}ms linear`;
        progress.style.width = "100%";
      }
    }));
  }

  function goTo(nextIndex) {
    index = (nextIndex + data.length) % data.length;
    render();
    restartTimer();
  }
  function restartTimer() {
    clearInterval(timer);
    if (!paused && !reduceMotion) timer = setInterval(() => {
      index = (index + 1) % data.length;
      render();
    }, interval);
  }
  function setPaused(value) {
    paused = value;
    pauseButton.querySelector("span").textContent = paused ? "▶" : "Ⅱ";
    pauseButton.setAttribute("aria-label", paused ? "Start autoplay" : "Pause autoplay");
    restartTimer();
    if (paused) { progress.style.transition = "none"; }
  }

  prev.addEventListener("click", () => goTo(index - 1));
  next.addEventListener("click", () => goTo(index + 1));
  dots.forEach(dot => dot.addEventListener("click", () => goTo(Number(dot.dataset.go))));
  tabs.forEach(tab => tab.addEventListener("click", () => goTo(Number(tab.dataset.go))));
  langButtons.forEach(btn => btn.addEventListener("click", () => setLanguage(btn.dataset.lang)));
  pauseButton.addEventListener("click", () => setPaused(!paused));

  section.addEventListener("mouseenter", () => { if (!paused) { clearInterval(timer); progress.style.transition = "none"; } });
  section.addEventListener("mouseleave", restartTimer);
  section.addEventListener("focusin", () => clearInterval(timer));
  section.addEventListener("focusout", restartTimer);

  stage.addEventListener("pointerdown", e => {
    pointerDown = true; startX = e.clientX; startY = e.clientY;
    stage.setPointerCapture?.(e.pointerId);
  });
  stage.addEventListener("pointerup", e => {
    if (!pointerDown) return;
    pointerDown = false;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      const rtl = document.documentElement.dir === "rtl";
      goTo(index + ((dx < 0) === rtl ? 1 : -1));
    }
  });
  stage.addEventListener("pointercancel", () => pointerDown = false);

  // Gentle pointer tilt on the active card; disabled for touch and reduced-motion users.
  if (!reduceMotion && window.matchMedia("(pointer:fine)").matches) {
    active.addEventListener("pointermove", e => {
      const rect = active.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - .5;
      const y = (e.clientY - rect.top) / rect.height - .5;
      active.style.setProperty("--tilt-x", `${(-y * 3).toFixed(2)}deg`);
      active.style.setProperty("--tilt-y", `${(x * 4).toFixed(2)}deg`);
      active.style.transform = `translate(-50%,-50%) rotateX(${-y*3}deg) rotateY(${x*4}deg)`;
    });
    active.addEventListener("pointerleave", () => {
      active.style.transform = "translate(-50%,-50%) rotateX(0) rotateY(0)";
    });
  }

  setLanguage("ar");
  setPaused(reduceMotion);
})();
