/* =====================================================
   VELMONT — PÁGINA DA COLEÇÃO
   Endereço: categoria.html?c=<slug>&marca=<marca>&p=<peça>
   Os dados vêm de data/catalog.js (futuramente, da API)
===================================================== */

const CATALOG = window.VELMONT_CATALOG || { categories: [], products: [] };

const REDUCED_MOTION = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
).matches;

/* =====================================================
   1. ELEMENTOS
===================================================== */

const header = document.querySelector(".header");
const hero = document.getElementById("catalogHero");
const logoWord = document.getElementById("logoWord");
const backLink = document.getElementById("backLink");
const eyebrow = document.getElementById("catalogEyebrow");
const title = document.getElementById("catalogTitle");
const tagline = document.getElementById("catalogTagline");
const catsNav = document.getElementById("catalogCats");
const searchInput = document.getElementById("catalogSearch");
const filtersBox = document.getElementById("catalogFilters");
const countLabel = document.getElementById("catalogCount");
const grid = document.getElementById("productGrid");
const emptyState = document.getElementById("catalogEmpty");
const emptyTitle = document.getElementById("emptyTitle");
const emptyText = document.getElementById("emptyText");

const reels = document.getElementById("reels");
const reelsFeed = document.getElementById("reelsFeed");
const reelsCount = document.getElementById("reelsCount");
const reelsPrev = document.getElementById("reelsPrev");
const reelsNext = document.getElementById("reelsNext");
const reelsToast = document.getElementById("reelsToast");

/* =====================================================
   2. UTILITÁRIOS
===================================================== */

const pad = number => String(number).padStart(2, "0");

// sem acentos e em minúsculas, para a busca
const normalize = text =>
    String(text)
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .trim();

const slugify = text =>
    normalize(text)
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

function escapeHTML(text = "") {
    return String(text).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));
}

function formatPrice(price) {
    if (price == null) return "SOB CONSULTA";

    return Number(price).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function splitLetters(element, text) {
    element.textContent = "";

    [...text].forEach((letter, i) => {
        const span = document.createElement("span");

        span.textContent = letter === " " ? " " : letter;
        span.style.setProperty("--i", i);

        element.append(span);
    });
}

function categoryOf(product) {
    return CATALOG.categories.find(category => category.slug === product.category);
}

const ICONS = {
    heart: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
    share: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4 9.5 14.5M20 4l-6.5 16-4-5.5L4 10.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
    grid: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`,
    up: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    play: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16l13-8z" fill="currentColor"/></svg>`,
    bag: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.2 12H6.2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`,
    bigHeart: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z" fill="currentColor"/></svg>`
};

/* =====================================================
   3. CATEGORIA ATUAL (pela URL)
===================================================== */

const params = new URLSearchParams(window.location.search);

const categoryIndex = Math.max(
    0,
    CATALOG.categories.findIndex(category => category.slug === params.get("c"))
);

const category = CATALOG.categories[categoryIndex];

const categoryProducts = category
    ? CATALOG.products.filter(product => product.category === category.slug)
    : [];

const brands = [...new Set(categoryProducts.map(product => product.brand))];

let activeBrand = brands.find(brand => slugify(brand) === params.get("marca")) || null;
let query = "";
let visibleList = [];

/* =====================================================
   4. TOPO, CATEGORIAS E FILTROS
===================================================== */

function renderHeader() {
    if (!category) return;

    document.title = `${category.name} — VELMONT`;

    if (category.theme?.bg) {
        document.body.style.setProperty("--cat-bg", category.theme.bg);
    }

    eyebrow.textContent =
        `COLEÇÃO ${pad(categoryIndex + 1)} / ${pad(CATALOG.categories.length)} · ${category.brand}`;

    splitLetters(title, category.name.toUpperCase());

    tagline.textContent = category.tagline || "";

    backLink.href = "index.html#categorias";

    catsNav.innerHTML = CATALOG.categories
        .map(item => `
            <a
                href="categoria.html?c=${encodeURIComponent(item.slug)}"
                class="${item.slug === category.slug ? "active" : ""}"
                ${item.slug === category.slug ? 'aria-current="page"' : ""}
            >${escapeHTML(item.name.toUpperCase())}</a>`)
        .join("");

    renderFilters();
}

function renderFilters() {
    // durante a busca, o filtro de marca some (a busca vale para tudo)
    if (query || brands.length < 2) {
        filtersBox.innerHTML = "";
        return;
    }

    filtersBox.innerHTML = [null, ...brands]
        .map(brand => `
            <button
                type="button"
                data-brand="${brand ? escapeHTML(brand) : ""}"
                aria-pressed="${brand === activeBrand}"
                class="${brand === activeBrand ? "active" : ""}"
            >${brand ? escapeHTML(brand.toUpperCase()) : "TODAS"}</button>`)
        .join("");
}

/* =====================================================
   5. GRADE DE PRODUTOS
===================================================== */

function mediaMarkup(product, { interactive = false, lazySrc = false } = {}) {
    if (product.model) {
        const src = escapeHTML(product.model);

        return `
            <model-viewer
                ${lazySrc ? `data-src="${src}"` : `src="${src}"`}
                alt="${escapeHTML(product.name)}"
                auto-rotate
                auto-rotate-delay="0"
                rotation-per-second="${interactive ? "18deg" : "24deg"}"
                ${interactive ? 'camera-controls disable-zoom disable-pan touch-action="pan-y"' : ""}
                interaction-prompt="none"
                shadow-intensity="1"
                environment-image="neutral"
                loading="lazy"
            ></model-viewer>`;
    }

    return `<img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" loading="lazy" decoding="async" draggable="false">`;
}

function highlight(text) {
    const safe = escapeHTML(text);

    if (!query) return safe;

    // marca o trecho buscado (ignorando acentos)
    const plain = normalize(text);
    const start = plain.indexOf(normalize(query));

    if (start < 0) return safe;

    const end = start + normalize(query).length;

    return `${escapeHTML(text.slice(0, start))}<mark>${escapeHTML(text.slice(start, end))}</mark>${escapeHTML(text.slice(end))}`;
}

function computeList() {
    if (query) {
        const q = normalize(query);

        // a busca procura em todas as categorias
        return CATALOG.products.filter(product => {
            const haystack = normalize(
                `${product.name} ${product.brand} ${categoryOf(product)?.name || ""}`
            );

            return haystack.includes(q);
        });
    }

    return activeBrand
        ? categoryProducts.filter(product => product.brand === activeBrand)
        : categoryProducts;
}

function renderGrid() {
    visibleList = computeList();

    const isEmpty = visibleList.length === 0;

    emptyState.hidden = !isEmpty;

    if (isEmpty && query) {
        emptyTitle.textContent = "NADA ENCONTRADO";
        emptyText.textContent = `Nenhuma peça para “${query}”. Tente outra palavra ou marca.`;
    } else if (isEmpty) {
        emptyTitle.textContent = "EM BREVE";
        emptyText.textContent = "Estamos selecionando as peças desta categoria.";
    }

    countLabel.textContent = query
        ? `${pad(visibleList.length)} ${visibleList.length === 1 ? "RESULTADO" : "RESULTADOS"} PARA “${query.toUpperCase()}”`
        : visibleList.length
            ? `${pad(visibleList.length)} ${visibleList.length === 1 ? "PEÇA" : "PEÇAS"}`
            : "";

    grid.innerHTML = visibleList
        .map((product, i) => `
            <article class="product-card" style="--i:${i}">
                <button
                    class="product-media"
                    type="button"
                    data-index="${i}"
                    aria-label="Ver detalhes: ${escapeHTML(product.name)}"
                >
                    ${mediaMarkup(product)}
                    ${product.isNew ? `<span class="product-badge">NOVO</span>` : ""}
                    ${product.model ? `<span class="product-3d">3D</span>` : ""}
                    <span class="product-quick">${ICONS.play} VER DETALHES</span>
                </button>

                <div class="product-info">
                    <span class="product-brand">${escapeHTML(product.brand.toUpperCase())}${query ? ` · ${escapeHTML((categoryOf(product)?.name || "").toUpperCase())}` : ""}</span>
                    <h3 class="product-name">${highlight(product.name)}</h3>
                    <span class="product-price">${formatPrice(product.price)}</span>
                    ${product.variants?.length > 1 ? `
                        <span class="product-swatches" aria-label="${product.variants.length} cores">
                            ${product.variants.map(variant => `<i style="background:${escapeHTML(variant.swatch || "#ccc")}"></i>`).join("")}
                            ${product.variants.length} CORES
                        </span>` : ""}
                </div>
            </article>`)
        .join("");

    requestAnimationFrame(() => requestAnimationFrame(() => {
        grid.querySelectorAll(".product-card").forEach(card => card.classList.add("is-in"));
    }));
}

// as peças saem rápido e as novas entram em sequência
function refreshGrid() {
    grid.classList.add("leaving");

    clearTimeout(refreshGrid.timer);

    refreshGrid.timer = setTimeout(() => {
        grid.classList.remove("leaving");
        renderFilters();
        renderGrid();
    }, REDUCED_MOTION ? 0 : 220);
}

function updateURL(changes) {
    const url = new URL(window.location.href);

    Object.entries(changes).forEach(([key, value]) => {
        if (value) url.searchParams.set(key, value);
        else url.searchParams.delete(key);
    });

    history.replaceState(null, "", url);
}

filtersBox.addEventListener("click", event => {
    const button = event.target.closest("button");

    if (!button) return;

    const brand = button.dataset.brand || null;

    if (brand === activeBrand) return;

    activeBrand = brand;
    updateURL({ marca: brand ? slugify(brand) : null });
    refreshGrid();
});

let searchTimer;

searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);

    searchTimer = setTimeout(() => {
        const value = searchInput.value.trim();

        if (value === query) return;

        query = value;
        updateURL({ q: query || null });
        refreshGrid();
    }, 160);
});

/* luz que segue o mouse nos cards */
grid.addEventListener("pointermove", event => {
    const media = event.target.closest(".product-media");

    if (!media) return;

    const rect = media.getBoundingClientRect();

    media.style.setProperty("--mx", `${((event.clientX - rect.left) / rect.width) * 100}%`);
    media.style.setProperty("--my", `${((event.clientY - rect.top) / rect.height) * 100}%`);
});

grid.addEventListener("click", event => {
    const media = event.target.closest(".product-media");

    if (!media) return;

    openReels(visibleList, Number(media.dataset.index));
});

/* =====================================================
   6. REELS — DETALHES DAS PEÇAS
   Feed vertical com encaixe: rolar, arrastar, setas
   ou teclado passam para a próxima peça
===================================================== */

let reelsList = [];
let reelsActive = 0;
let reelsObserver = null;
let lastFocus = null;

const LIKES_KEY = "velmont-likes";

function readLikes() {
    try {
        return new Set(JSON.parse(localStorage.getItem(LIKES_KEY) || "[]"));
    } catch (error) {
        return new Set();
    }
}

function saveLikes(likes) {
    try {
        localStorage.setItem(LIKES_KEY, JSON.stringify([...likes]));
    } catch (error) {
        // sem armazenamento (aba anônima etc.): curtida vale só nesta visita
    }
}

let likes = readLikes();

// bolinhas de cor (quando o item tem variações)
function variantsMarkup(product) {
    const variants = product.variants || [];

    if (variants.length < 2) return "";

    return `
        <div class="reel-variants">
            <span class="reel-variant-label">COR: <b>${escapeHTML(variants[0].name.toUpperCase())}</b></span>

            <div class="reel-swatches" role="radiogroup" aria-label="Escolher cor">
                ${variants.map((variant, vi) => `
                    <button
                        class="reel-swatch ${vi === 0 ? "active" : ""}"
                        type="button"
                        role="radio"
                        aria-checked="${vi === 0}"
                        aria-label="${escapeHTML(variant.name)}"
                        data-variant="${escapeHTML(variant.id)}"
                        style="--swatch:${escapeHTML(variant.swatch || "#ccc")}"
                    ></button>`).join("")}
            </div>
        </div>`;
}

function reelMarkup(product, i) {
    const productCategory = categoryOf(product);
    const liked = likes.has(product.id);
    const firstVariant = product.variants?.[0];

    return `
        <article
            class="reel"
            data-index="${i}"
            data-variant="${escapeHTML(firstVariant?.id || "")}"
            style="--reel-bg:${escapeHTML(productCategory?.theme?.bg || "#1a1a1a")}"
        >
            <div class="reel-media">
                ${mediaMarkup(product, { interactive: true, lazySrc: true })}
            </div>

            <div class="reel-shade"></div>

            <div class="reel-info">
                <span class="reel-brand">${escapeHTML(product.brand.toUpperCase())} · ${escapeHTML((productCategory?.name || "").toUpperCase())}</span>
                <h3 class="reel-name">${escapeHTML(product.name)}</h3>
                <span class="reel-price">${formatPrice(product.price)}</span>

                ${variantsMarkup(product)}

                <button class="reel-cta add-to-bag" type="button">
                    ${ICONS.bag}
                    <span>ADICIONAR À SACOLA</span>
                </button>

                ${product.credit ? `<span class="reel-credit">${escapeHTML(product.credit)}</span>` : ""}
            </div>

            <div class="reel-actions">
                <button
                    class="reel-action like ${liked ? "liked" : ""}"
                    type="button"
                    aria-pressed="${liked}"
                    aria-label="Curtir"
                >
                    <span class="reel-action-icon">${ICONS.heart}</span>
                    CURTIR
                </button>

                <button
                    class="reel-action share"
                    type="button"
                    aria-label="Enviar"
                >
                    <span class="reel-action-icon">${ICONS.share}</span>
                    ENVIAR
                </button>

                <a
                    class="reel-action"
                    href="categoria.html?c=${encodeURIComponent(product.category)}"
                    aria-label="Ver coleção"
                >
                    <span class="reel-action-icon">${ICONS.grid}</span>
                    COLEÇÃO
                </a>
            </div>

            ${i === 0 && reelsList.length > 1 ? `
                <div class="reel-swipe" aria-hidden="true">
                    ${ICONS.up}
                    ARRASTE PARA CIMA
                </div>` : ""}
        </article>`;
}

function openReels(list, startIndex = 0) {
    if (!list.length) return;

    reelsList = list;
    lastFocus = document.activeElement;

    reelsFeed.innerHTML = list.map(reelMarkup).join("");

    reels.hidden = false;
    document.body.style.overflow = "hidden";
    document.body.classList.add("reels-open");

    // começa direto na peça clicada
    reelsFeed.scrollTop = startIndex * reelsFeed.clientHeight;
    setActiveReel(startIndex);

    reelsObserver?.disconnect();

    reelsObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) setActiveReel(Number(entry.target.dataset.index));
        });
    }, { root: reelsFeed, threshold: 0.6 });

    reelsFeed.querySelectorAll(".reel").forEach(reel => reelsObserver.observe(reel));

    reels.querySelector(".reels-close").focus({ preventScroll: true });
}

function closeReels() {
    if (reels.hidden) return;

    reels.hidden = true;
    document.body.style.overflow = "";
    document.body.classList.remove("reels-open");

    reelsObserver?.disconnect();
    reelsFeed.innerHTML = "";

    updateURL({ p: null });

    lastFocus?.focus?.({ preventScroll: true });
}

function setActiveReel(index) {
    const slides = reelsFeed.querySelectorAll(".reel");

    if (!slides[index]) return;

    reelsActive = index;

    slides.forEach((slide, i) => slide.classList.toggle("active", i === index));

    // carrega o 3D só da peça atual e das vizinhas
    [index - 1, index, index + 1].forEach(i => {
        const viewer = slides[i]?.querySelector("model-viewer[data-src]");

        if (viewer && !viewer.getAttribute("src")) {
            viewer.setAttribute("src", viewer.dataset.src);
        }
    });

    reelsCount.textContent = `${pad(index + 1)} / ${pad(reelsList.length)}`;
    reelsPrev.disabled = index === 0;
    reelsNext.disabled = index === reelsList.length - 1;

    updateURL({ p: reelsList[index]?.id });
}

function goToReel(index) {
    const target = Math.max(0, Math.min(reelsList.length - 1, index));

    reelsFeed.scrollTo({
        top: target * reelsFeed.clientHeight,
        behavior: REDUCED_MOTION ? "auto" : "smooth"
    });
}

function showToast(message) {
    reelsToast.textContent = message;
    reelsToast.hidden = false;

    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => { reelsToast.hidden = true; }, 2000);
}

function toggleLike(slide, forceOn = false) {
    const product = reelsList[Number(slide.dataset.index)];
    const button = slide.querySelector(".like");

    if (!product || !button) return;

    const liked = forceOn ? true : !likes.has(product.id);

    if (liked) likes.add(product.id);
    else likes.delete(product.id);

    saveLikes(likes);

    button.classList.toggle("liked", liked);
    button.setAttribute("aria-pressed", String(liked));
}

function popHeart(slide) {
    const heart = document.createElement("div");

    heart.className = "reel-heart";
    heart.innerHTML = ICONS.bigHeart;

    slide.appendChild(heart);
    heart.addEventListener("animationend", () => heart.remove());
}

async function sharePiece(product) {
    const url = new URL("categoria.html", window.location.href);

    url.searchParams.set("c", product.category);
    url.searchParams.set("p", product.id);

    const data = {
        title: `${product.name} — VELMONT`,
        text: `${product.brand} · ${product.name}`,
        url: url.href
    };

    try {
        if (navigator.share) {
            await navigator.share(data);
            return;
        }

        await navigator.clipboard.writeText(url.href);
        showToast("LINK COPIADO");
    } catch (error) {
        if (error?.name !== "AbortError") showToast("NÃO FOI POSSÍVEL COMPARTILHAR");
    }
}

reelsFeed.addEventListener("click", event => {
    const slide = event.target.closest(".reel");

    if (!slide) return;

    if (event.target.closest(".like")) {
        toggleLike(slide);
        return;
    }

    const product = reelsList[Number(slide.dataset.index)];

    // troca de cor: muda a foto, o nome da cor e a opção que vai para a sacola
    const swatch = event.target.closest(".reel-swatch");

    if (swatch && product) {
        const variant = product.variants.find(item => item.id === swatch.dataset.variant);
        const image = slide.querySelector(".reel-media img");

        slide.dataset.variant = variant.id;

        slide.querySelectorAll(".reel-swatch").forEach(button => {
            const active = button === swatch;

            button.classList.toggle("active", active);
            button.setAttribute("aria-checked", String(active));
        });

        slide.querySelector(".reel-variant-label b").textContent = variant.name.toUpperCase();

        if (image && variant.image) {
            image.classList.add("swapping");

            setTimeout(() => {
                image.src = variant.image;
                image.classList.remove("swapping");
            }, REDUCED_MOTION ? 0 : 180);
        }

        return;
    }

    const addButton = event.target.closest(".add-to-bag");

    if (addButton && product) {
        window.VelmontBag?.add(product.id, slide.dataset.variant || null);

        const label = addButton.querySelector("span");

        addButton.classList.add("added");
        label.textContent = "ADICIONADO ✓";

        clearTimeout(addButton.timer);

        addButton.timer = setTimeout(() => {
            addButton.classList.remove("added");
            label.textContent = "ADICIONAR À SACOLA";
        }, 1800);

        return;
    }

    if (event.target.closest(".share")) {
        sharePiece(reelsList[Number(slide.dataset.index)]);
    }
});

// dois cliques/toques na peça = curtir (como no Reels/TikTok)
reelsFeed.addEventListener("dblclick", event => {
    const slide = event.target.closest(".reel");

    if (!slide || event.target.closest(".reel-actions, .reel-info")) return;

    toggleLike(slide, true);
    popHeart(slide);
});

reels.addEventListener("click", event => {
    if (event.target.closest("[data-close]")) closeReels();
});

reelsPrev.addEventListener("click", () => goToReel(reelsActive - 1));
reelsNext.addEventListener("click", () => goToReel(reelsActive + 1));

document.addEventListener("keydown", event => {
    if (reels.hidden) return;

    if (event.key === "Escape") closeReels();

    if (event.key === "ArrowDown" || event.key === "PageDown") {
        event.preventDefault();
        goToReel(reelsActive + 1);
    }

    if (event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault();
        goToReel(reelsActive - 1);
    }
});

/* =====================================================
   7. HEADER CLARO/ESCURO
   O header fica branco sobre o topo colorido e escuro
   depois que a página rola
===================================================== */

function updateHeader() {
    const heroBottom = hero.getBoundingClientRect().bottom;

    header.classList.toggle("on-light", heroBottom < 90);
}

window.addEventListener("scroll", updateHeader, { passive: true });

/* =====================================================
   8. INICIA
===================================================== */

if (logoWord) splitLetters(logoWord, logoWord.textContent.trim());

const initialQuery = params.get("q");

if (initialQuery) {
    query = initialQuery;
    searchInput.value = initialQuery;
}

renderHeader();
updateHeader();

const fontsReady = document.fonts?.ready ?? Promise.resolve();

Promise.race([
    fontsReady,
    new Promise(resolve => setTimeout(resolve, 900))
]).then(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
        document.body.classList.remove("is-loading");
        document.body.classList.add("is-loaded");

        renderGrid();

        // link direto para uma peça (?p=) abre o reels nela
        const sharedId = params.get("p");

        if (sharedId) {
            const index = visibleList.findIndex(product => product.id === sharedId);

            if (index >= 0) openReels(visibleList, index);
            else {
                const product = CATALOG.products.find(item => item.id === sharedId);

                if (product) openReels([product], 0);
            }
        }
    }));
});
