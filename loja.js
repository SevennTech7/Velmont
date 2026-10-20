/* =====================================================
   VELMONT — LOJA (compartilhado entre as páginas)
   - menu do topo com todas as categorias
   - sacola: ícone com contador, painel lateral,
     quantidades, cores e envio do pedido no WhatsApp
   - rodapé: redes, endereço, mini mapa e partículas
   A sacola fica salva no navegador (localStorage).

   Para outras partes do site:
   window.VelmontBag.add(idDoProduto, idDaCor, quantidade)
   window.VelmontBag.open()
===================================================== */

(() => {
    const CATALOG = window.VELMONT_CATALOG || { categories: [], products: [], store: {} };
    const STORE = CATALOG.store || {};
    const BAG_KEY = "velmont-bag";

    const escapeHTML = (text = "") =>
        String(text).replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[char]));

    const formatPrice = price =>
        price == null
            ? "SOB CONSULTA"
            : Number(price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    const ICONS = {
        bag: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.2 12H6.2z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`,
        close: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
        trash: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
        whats: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8.8 8.2c.2-.4.5-.4.8-.4h.5c.2 0 .4.1.5.4l.7 1.7c.1.2 0 .5-.1.6l-.5.6c-.1.1-.1.3 0 .5a6 6 0 0 0 2.7 2.6c.2.1.4.1.5-.1l.6-.7c.2-.2.4-.2.6-.1l1.7.8c.2.1.3.3.3.5v.4c0 .4-.1.8-.5 1-.6.4-1.5.6-2.4.3a9.6 9.6 0 0 1-5.6-5.4c-.3-.9 0-1.9.4-2.3z" fill="currentColor"/></svg>`
    };

    /* =================================================
       1. MENU DO TOPO (todas as categorias)
    ================================================= */

    const nav = document.getElementById("mainNav");
    const currentSlug = new URLSearchParams(window.location.search).get("c");
    const onCategoryPage = /categoria\.html$/i.test(window.location.pathname);

    // na página da categoria os filtros já listam as categorias,
    // então o menu mostra só o caminho de volta
    if (nav && onCategoryPage) {
        nav.innerHTML = `<a href="index.html">INÍCIO</a>`;
    } else if (nav) {
        const links = [
            `<a href="index.html">INÍCIO</a>`,
            ...CATALOG.categories.map(category => {
                const active = onCategoryPage && category.slug === currentSlug;

                return `<a href="categoria.html?c=${encodeURIComponent(category.slug)}" class="${active ? "active" : ""}" ${active ? 'aria-current="page"' : ""}>${escapeHTML(category.name.toUpperCase())}</a>`;
            }),
            `<a href="index.html#contato">CONTATO</a>`
        ];

        nav.innerHTML = links.join("");
    }

    /* =================================================
       2. ESTADO DA SACOLA
       Cada linha: { id, variant, qty }
    ================================================= */

    function readBag() {
        try {
            const data = JSON.parse(localStorage.getItem(BAG_KEY) || "[]");

            return Array.isArray(data) ? data : [];
        } catch (error) {
            return [];
        }
    }

    let bag = readBag();

    function saveBag() {
        try {
            localStorage.setItem(BAG_KEY, JSON.stringify(bag));
        } catch (error) {
            // sem armazenamento: a sacola vale só enquanto a página estiver aberta
        }

        render();
    }

    function findProduct(id) {
        return CATALOG.products.find(product => product.id === id);
    }

    function findVariant(product, variantId) {
        return product?.variants?.find(variant => variant.id === variantId) || null;
    }

    // junta produto + cor escolhida (ignora itens que saíram do catálogo)
    function resolvedLines() {
        return bag
            .map(line => {
                const product = findProduct(line.id);

                if (!product) return null;

                // line.variant = id da cor | variantInfo = dados da cor (nome, foto…)
                const variantInfo = findVariant(product, line.variant);

                return {
                    ...line,
                    product,
                    variantInfo,
                    image: variantInfo?.image || product.image
                };
            })
            .filter(Boolean);
    }

    const totalQty = () => resolvedLines().reduce((sum, line) => sum + line.qty, 0);

    /* =================================================
       3. ÍCONE DA SACOLA NO TOPO
    ================================================= */

    const header = document.querySelector(".header");
    const bagButton = document.createElement("button");

    bagButton.type = "button";
    bagButton.className = "bag-button";
    bagButton.setAttribute("aria-label", "Abrir sacola");
    bagButton.innerHTML = `${ICONS.bag}<span class="bag-badge" hidden>0</span>`;

    header?.appendChild(bagButton);

    const badge = bagButton.querySelector(".bag-badge");

    /* =================================================
       1b. MENU DO CELULAR
       Botão ☰ ao lado da sacola abre o menu em tela cheia
       (na página da categoria não aparece: lá o topo
       mostra só "INÍCIO" e os filtros fazem o resto)
    ================================================= */

    const mobileMenu = (() => {
        if (onCategoryPage || !header) return null;

        const button = document.createElement("button");

        button.type = "button";
        button.className = "menu-button";
        button.setAttribute("aria-label", "Abrir menu");
        button.setAttribute("aria-expanded", "false");
        button.innerHTML = "<span></span><span></span>";

        header.appendChild(button);

        const thumbOf = category => category.hero?.photo || category.hero?.src || "";

        const panel = document.createElement("div");

        panel.className = "mobile-menu";
        panel.hidden = true;
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-modal", "true");
        panel.setAttribute("aria-label", "Menu");

        const whatsNumber = String(STORE.whatsapp || "").replace(/\D/g, "");
        const instaUser = String(STORE.instagram || "").replace(/^@/, "");

        panel.innerHTML = `
            <div class="mobile-menu-inner">
                <span class="mobile-menu-label">CATEGORIAS</span>

                <nav class="mobile-menu-list">
                    ${CATALOG.categories.map((category, i) => `
                        <a href="categoria.html?c=${encodeURIComponent(category.slug)}" style="--i:${i}">
                            <span class="mobile-menu-num">${String(i + 1).padStart(2, "0")}</span>
                            <span class="mobile-menu-name">${escapeHTML(category.name)}</span>
                            ${thumbOf(category) ? `<img src="${escapeHTML(thumbOf(category))}" alt="" loading="lazy">` : ""}
                        </a>`).join("")}
                </nav>

                <div class="mobile-menu-foot" style="--i:${CATALOG.categories.length}">
                    <a href="index.html#contato" data-menu-close>CONTATO</a>
                    <a href="${whatsNumber ? `https://wa.me/${whatsNumber}` : "https://wa.me/"}" target="_blank" rel="noopener">WHATSAPP</a>
                    <a href="${instaUser ? `https://instagram.com/${encodeURIComponent(instaUser)}` : "https://instagram.com/"}" target="_blank" rel="noopener">INSTAGRAM</a>
                </div>
            </div>`;

        document.body.appendChild(panel);

        let closeTimer = null;

        const setOpen = open => {
            clearTimeout(closeTimer);

            button.setAttribute("aria-expanded", String(open));
            button.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
            header.classList.toggle("menu-active", open);
            document.body.classList.toggle("menu-open", open);

            if (open) {
                panel.hidden = false;
                requestAnimationFrame(() => panel.classList.add("is-open"));
            } else {
                panel.classList.remove("is-open");
                closeTimer = setTimeout(() => { panel.hidden = true; }, 450);
            }
        };

        button.addEventListener("click", () => setOpen(panel.hidden || !panel.classList.contains("is-open")));

        panel.addEventListener("click", event => {
            if (event.target.closest("a")) setOpen(false);
        });

        document.addEventListener("keydown", event => {
            if (event.key === "Escape" && !panel.hidden) setOpen(false);
        });

        // voltou para tela grande com o menu aberto
        window.matchMedia("(max-width: 800px)").addEventListener?.("change", event => {
            if (!event.matches) setOpen(false);
        });

        return { close: () => setOpen(false) };
    })();


    /* =================================================
       4. PAINEL LATERAL
    ================================================= */

    const drawer = document.createElement("div");

    drawer.className = "bag";
    drawer.hidden = true;
    drawer.innerHTML = `
        <div class="bag-backdrop" data-bag-close></div>

        <aside class="bag-panel" role="dialog" aria-modal="true" aria-labelledby="bagTitle">

            <header class="bag-head">
                <h2 id="bagTitle">SACOLA <span class="bag-head-count"></span></h2>

                <button class="bag-icon-button" type="button" aria-label="Fechar sacola" data-bag-close>
                    ${ICONS.close}
                </button>
            </header>

            <ul class="bag-items"></ul>

            <div class="bag-empty">
                <span class="bag-empty-icon">${ICONS.bag}</span>
                <strong>SUA SACOLA ESTÁ VAZIA</strong>
                <p>Explore as coleções e adicione as peças que você gostou.</p>
                <a class="bag-link" href="index.html#categorias">EXPLORAR COLEÇÕES →</a>
            </div>

            <footer class="bag-foot">
                <div class="bag-summary">
                    <span>TOTAL DE PEÇAS</span>
                    <strong class="bag-total">0</strong>
                </div>

                <div class="bag-summary bag-summary-price" hidden>
                    <span>VALOR ESTIMADO</span>
                    <strong class="bag-price"></strong>
                </div>

                <button class="bag-whats" type="button">
                    ${ICONS.whats}
                    ENVIAR PEDIDO NO WHATSAPP
                </button>

                <button class="bag-clear" type="button">ESVAZIAR SACOLA</button>

                <p class="bag-note">
                    Tamanhos, valores e pagamento são confirmados com a gente pelo WhatsApp.
                </p>
            </footer>

        </aside>`;

    document.body.appendChild(drawer);

    const toast = document.createElement("div");

    toast.className = "bag-toast";
    toast.setAttribute("role", "status");
    toast.hidden = true;

    document.body.appendChild(toast);

    const itemsList = drawer.querySelector(".bag-items");
    const emptyBox = drawer.querySelector(".bag-empty");
    const foot = drawer.querySelector(".bag-foot");
    const headCount = drawer.querySelector(".bag-head-count");
    const totalLabel = drawer.querySelector(".bag-total");
    const priceRow = drawer.querySelector(".bag-summary-price");
    const priceLabel = drawer.querySelector(".bag-price");

    /* =================================================
       5. DESENHA A SACOLA
    ================================================= */

    function render() {
        const lines = resolvedLines();
        const qty = lines.reduce((sum, line) => sum + line.qty, 0);

        // contador no ícone
        badge.hidden = qty === 0;
        badge.textContent = qty > 99 ? "99+" : String(qty);
        bagButton.setAttribute("aria-label", qty ? `Abrir sacola (${qty} ${qty === 1 ? "peça" : "peças"})` : "Abrir sacola");

        headCount.textContent = qty ? `(${qty})` : "";
        totalLabel.textContent = String(qty);

        // valor estimado só quando todas as peças têm preço
        const allPriced = lines.length > 0 && lines.every(line => line.product.price != null);

        priceRow.hidden = !allPriced;

        if (allPriced) {
            priceLabel.textContent = formatPrice(
                lines.reduce((sum, line) => sum + line.product.price * line.qty, 0)
            );
        }

        emptyBox.hidden = lines.length > 0;
        foot.hidden = lines.length === 0;

        itemsList.innerHTML = lines
            .map((line, index) => `
                <li class="bag-item" data-index="${index}">
                    <a class="bag-thumb" href="categoria.html?c=${encodeURIComponent(line.product.category)}&p=${encodeURIComponent(line.product.id)}">
                        <img src="${escapeHTML(line.image)}" alt="" loading="lazy">
                    </a>

                    <div class="bag-info">
                        <span class="bag-brand">${escapeHTML(line.product.brand.toUpperCase())}</span>
                        <span class="bag-name">${escapeHTML(line.product.name)}</span>

                        ${line.variantInfo ? `
                            <span class="bag-variant">
                                <i style="background:${escapeHTML(line.variantInfo.swatch || "#ccc")}"></i>
                                COR: ${escapeHTML(line.variantInfo.name.toUpperCase())}
                            </span>` : ""}

                        <span class="bag-price-line">${formatPrice(line.product.price)}</span>

                        <div class="bag-qty" role="group" aria-label="Quantidade">
                            <button type="button" data-action="dec" aria-label="Diminuir">−</button>
                            <span aria-live="polite">${line.qty}</span>
                            <button type="button" data-action="inc" aria-label="Aumentar">+</button>
                        </div>
                    </div>

                    <button class="bag-icon-button bag-remove" type="button" data-action="remove" aria-label="Remover ${escapeHTML(line.product.name)}">
                        ${ICONS.trash}
                    </button>
                </li>`)
            .join("");
    }

    /* =================================================
       6. AÇÕES
    ================================================= */

    let lastFocus = null;

    function open() {
        mobileMenu?.close();

        lastFocus = document.activeElement;

        toast.hidden = true;

        render();

        drawer.hidden = false;
        document.body.classList.add("bag-open");

        // dois frames para a animação de entrada
        requestAnimationFrame(() => requestAnimationFrame(() => drawer.classList.add("is-open")));

        drawer.querySelector(".bag-icon-button").focus({ preventScroll: true });
    }

    function close() {
        if (drawer.hidden) return;

        drawer.classList.remove("is-open");
        document.body.classList.remove("bag-open");

        setTimeout(() => { drawer.hidden = true; }, 420);

        lastFocus?.focus?.({ preventScroll: true });
    }

    function showToast(message) {
        toast.innerHTML = `${message} <button type="button">VER SACOLA</button>`;
        toast.hidden = false;

        toast.querySelector("button").addEventListener("click", () => {
            toast.hidden = true;
            open();
        });

        clearTimeout(showToast.timer);
        showToast.timer = setTimeout(() => { toast.hidden = true; }, 3200);
    }

    function add(id, variantId = null, qty = 1) {
        const product = findProduct(id);

        if (!product) return;

        // item com cores: se nenhuma foi escolhida, usa a primeira
        const variant = product.variants?.length
            ? (findVariant(product, variantId) || product.variants[0]).id
            : null;

        const existing = bag.find(line => line.id === id && line.variant === variant);

        if (existing) existing.qty += qty;
        else bag.push({ id, variant, qty });

        saveBag();

        // o ícone "pula" para mostrar que entrou
        bagButton.classList.remove("bump");
        void bagButton.offsetWidth;
        bagButton.classList.add("bump");

        showToast(`<span class="bag-toast-text"><strong>${escapeHTML(product.name)}</strong><small>ADICIONADO À SACOLA</small></span>`);
    }

    function buildMessage(lines) {
        const total = lines.reduce((sum, line) => sum + line.qty, 0);

        const items = lines.map((line, i) => {
            const details = [
                line.variantInfo ? `Cor: ${line.variantInfo.name}` : null,
                `Qtd: ${line.qty}`,
                line.product.price != null ? formatPrice(line.product.price) : "Sob consulta"
            ].filter(Boolean).join(" · ");

            return `${i + 1}. ${line.product.name} — ${line.product.brand}\n   ${details}`;
        });

        return [
            `Olá, ${STORE.name || "VELMONT"}! Tenho interesse nestas peças:`,
            "",
            ...items,
            "",
            `Total: ${total} ${total === 1 ? "peça" : "peças"}`,
            "",
            "Pode me passar tamanhos e disponibilidade?"
        ].join("\n");
    }

    function sendWhatsApp() {
        const lines = resolvedLines();

        if (!lines.length) return;

        const number = String(STORE.whatsapp || "").replace(/\D/g, "");
        const text = encodeURIComponent(buildMessage(lines));

        // sem número configurado, o WhatsApp abre e o cliente escolhe o contato
        const url = number
            ? `https://wa.me/${number}?text=${text}`
            : `https://wa.me/?text=${text}`;

        window.open(url, "_blank", "noopener");
    }

    bagButton.addEventListener("click", open);

    drawer.addEventListener("click", event => {
        if (event.target.closest("[data-bag-close]")) {
            close();
            return;
        }

        const button = event.target.closest("[data-action]");

        if (!button) return;

        const index = Number(button.closest(".bag-item").dataset.index);
        const line = resolvedLines()[index];

        if (!line) return;

        const stored = bag.find(item => item.id === line.id && item.variant === line.variant);

        if (button.dataset.action === "inc") stored.qty += 1;
        if (button.dataset.action === "dec") stored.qty = Math.max(1, stored.qty - 1);

        if (button.dataset.action === "remove") {
            bag = bag.filter(item => item !== stored);
        }

        saveBag();
    });

    drawer.querySelector(".bag-whats").addEventListener("click", sendWhatsApp);

    drawer.querySelector(".bag-clear").addEventListener("click", () => {
        bag = [];
        saveBag();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !drawer.hidden) close();
    });

    // mantém a sacola igual entre abas abertas do site
    window.addEventListener("storage", event => {
        if (event.key !== BAG_KEY) return;

        bag = readBag();
        render();
    });

    /* =================================================
       6. RODAPÉ (igual em todas as páginas)
       - WhatsApp e Instagram
       - endereço + mini mapa + botões de GPS
       - partículas iguais às da abertura (fundo escuro)
       Dados em data/catalog.js → store
    ================================================= */

    const REDUCED_MOTION = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const footer = document.querySelector(".site-footer");

    if (footer) {
        const query = encodeURIComponent(STORE.mapQuery || STORE.address || "");
        const whatsNumber = String(STORE.whatsapp || "").replace(/\D/g, "");
        const instaUser = String(STORE.instagram || "").replace(/^@/, "");

        const links = {
            whats: whatsNumber
                ? `https://wa.me/${whatsNumber}?text=${encodeURIComponent(`Olá, ${STORE.name || "VELMONT"}!`)}`
                : "https://wa.me/",
            insta: instaUser
                ? `https://instagram.com/${encodeURIComponent(instaUser)}`
                : "https://instagram.com/",
            google: `https://www.google.com/maps/dir/?api=1&destination=${query}`,
            waze: `https://waze.com/ul?q=${query}&navigate=yes`,
            apple: `https://maps.apple.com/?daddr=${query}`,
            embed: `https://maps.google.com/maps?q=${query}&z=16&output=embed`
        };

        const FOOTER_ICONS = {
            insta: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor"/></svg>`,
            pin: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="10" r="2.3" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`,
            arrow: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
            up: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
        };

        footer.innerHTML = `
            <svg class="footer-wave" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
                <path class="footer-wave-back" d=""/>
                <path class="footer-wave-front" d=""/>
            </svg>

            <canvas class="footer-particles" aria-hidden="true"></canvas>

            <div class="footer-inner">

                <a class="footer-brandmark" href="index.html" aria-label="${escapeHTML(STORE.name || "VELMONT")} — início">
                    <img src="images/logo.png" alt="">
                    <span>${escapeHTML(STORE.name || "VELMONT")}</span>
                </a>

                <div class="footer-grid">

                    <div class="footer-col footer-brand">
                        <span class="footer-label">FALE COM A GENTE</span>

                        <p class="footer-lead">Curadoria de grifes, atendimento personalizado pelo WhatsApp.</p>

                        <div class="footer-social">
                            <a class="footer-social-link is-whats" href="${links.whats}" target="_blank" rel="noopener" aria-label="WhatsApp">
                                ${ICONS.whats}
                                <span>WHATSAPP</span>
                            </a>

                            <a class="footer-social-link is-insta" href="${links.insta}" target="_blank" rel="noopener" aria-label="Instagram">
                                ${FOOTER_ICONS.insta}
                                <span>${instaUser ? "@" + escapeHTML(instaUser) : "INSTAGRAM"}</span>
                            </a>
                        </div>
                    </div>

                    <div class="footer-col footer-address">
                        <span class="footer-label">VISITE A LOJA</span>

                        <a class="footer-place" href="${links.google}" target="_blank" rel="noopener">
                            ${FOOTER_ICONS.pin}
                            <span>
                                <strong>${escapeHTML(STORE.address || "")}</strong>
                                <small>${escapeHTML(STORE.city || "")}</small>
                            </span>
                        </a>

                        <span class="footer-label footer-label-small">COMO CHEGAR</span>

                        <div class="footer-gps">
                            <a href="${links.google}" target="_blank" rel="noopener">GOOGLE MAPS ${FOOTER_ICONS.arrow}</a>
                            <a href="${links.waze}" target="_blank" rel="noopener">WAZE ${FOOTER_ICONS.arrow}</a>
                            <a href="${links.apple}" target="_blank" rel="noopener">APPLE MAPS ${FOOTER_ICONS.arrow}</a>
                        </div>
                    </div>

                    <a class="footer-map" href="${links.google}" target="_blank" rel="noopener" aria-label="Abrir rota no Google Maps">
                        <iframe
                            src="${links.embed}"
                            title="Mapa — ${escapeHTML(STORE.address || "")}"
                            loading="lazy"
                            referrerpolicy="no-referrer-when-downgrade"
                            tabindex="-1"
                        ></iframe>

                        <span class="footer-map-pin" aria-hidden="true"><i></i></span>

                        <span class="footer-map-cta">
                            ${FOOTER_ICONS.pin}
                            ABRIR NO GPS
                        </span>
                    </a>

                </div>

                <div class="footer-row">
                    <span>© ${new Date().getFullYear()} ${escapeHTML(STORE.name || "VELMONT")}<span class="footer-row-extra"> — FASHION ARCHIVE</span></span>

                    <a href="#" class="footer-top" aria-label="Voltar ao topo"><span>VOLTAR AO TOPO</span> ${FOOTER_ICONS.up}</a>
                </div>

            </div>`;

        footer.querySelector(".footer-top").addEventListener("click", event => {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: REDUCED_MOTION ? "auto" : "smooth" });
        });

        /* ---------- onda do topo + partículas ---------- */

        const canvas = footer.querySelector(".footer-particles");
        const ctx = canvas.getContext?.("2d");
        const waveFront = footer.querySelector(".footer-wave-front");
        const waveBack = footer.querySelector(".footer-wave-back");

        const particles = [];
        const mouse = { x: -9999, y: -9999, sx: -9999, sy: -9999, strength: 0, inside: false };

        let width = 0;
        let height = 0;
        let visible = false;
        let time = 0;
        let last = performance.now();

        const createParticle = () => {
            const r = Math.random();

            return {
                x: Math.random() * width,
                y: Math.random() * height,
                vx: 0,
                vy: 0,
                // sobem devagar, como poeira iluminada (igual à abertura)
                bx: (Math.random() - 0.5) * 0.18,
                by: -(0.04 + Math.random() * 0.22),
                size: 0.5 + r * r * 2.1,
                phase: Math.random() * Math.PI * 2,
                twinkle: 0.6 + Math.random() * 1.8
            };
        };

        const resize = () => {
            if (!ctx) return;

            const dpr = Math.min(window.devicePixelRatio || 1, 1.75);

            width = footer.clientWidth;
            height = footer.clientHeight;

            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            const count = Math.round(Math.min(160, (width * height) / 7500));

            while (particles.length < count) particles.push(createParticle());
            particles.length = count;
        };

        const wavePath = (t, lift, amp) => {
            const y0 = 70 - lift + Math.sin(t * 0.5) * 10 * amp;
            const c1 = 20 - lift + Math.sin(t * 0.7 + 1) * 18 * amp;
            const c2 = 100 - lift + Math.sin(t * 0.6 + 2) * 16 * amp;
            const y1 = 40 - lift + Math.sin(t * 0.45 + 3) * 12 * amp;

            return `M0 ${y0.toFixed(1)} C 480 ${c1.toFixed(1)}, 960 ${c2.toFixed(1)}, 1440 ${y1.toFixed(1)} L1440 120 L0 120 Z`;
        };

        const frame = now => {
            requestAnimationFrame(frame);

            if (!visible) {
                last = now;
                return;
            }

            const step60 = Math.min(3, (now - last) / 16.667);
            last = now;
            time += REDUCED_MOTION ? 0 : step60 / 60;

            waveFront.setAttribute("d", wavePath(time, 0, 1));
            waveBack.setAttribute("d", wavePath(time + 1.7, 18, 1.3));

            if (!ctx) return;

            ctx.clearRect(0, 0, width, height);

            mouse.strength += ((mouse.inside ? 1 : 0) - mouse.strength) * 0.08;
            mouse.sx += (mouse.x - mouse.sx) * 0.2;
            mouse.sy += (mouse.y - mouse.sy) * 0.2;

            const radius = 130;
            const near = [];

            for (const p of particles) {
                p.vx += (p.bx - p.vx) * 0.03 * step60;
                p.vy += (p.by - p.vy) * 0.03 * step60;

                if (mouse.strength > 0.01) {
                    const dx = p.x - mouse.sx;
                    const dy = p.y - mouse.sy;
                    const d2 = dx * dx + dy * dy;

                    if (d2 < radius * radius && d2 > 0.01) {
                        const d = Math.sqrt(d2);
                        const force = (1 - d / radius) ** 2 * 0.9 * mouse.strength;

                        p.vx += (dx / d) * force;
                        p.vy += (dy / d) * force;
                    }

                    if (d2 < 200 * 200) near.push(p);
                }

                p.x += p.vx * step60;
                p.y += p.vy * step60;

                if (p.x < -12) p.x = width + 12;
                else if (p.x > width + 12) p.x = -12;

                if (p.y < -12) {
                    p.y = height + 12;
                    p.x = Math.random() * width;
                } else if (p.y > height + 12) {
                    p.y = -12;
                }

                const twinkle = 0.55 + 0.45 * Math.sin(time * p.twinkle + p.phase);
                const alpha = 0.3 + 0.55 * twinkle;

                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();

                if (p.size > 1.6) {
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.12})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // constelação perto do mouse
            if (near.length > 1) {
                ctx.lineWidth = 0.6;

                for (let i = 0; i < near.length; i++) {
                    for (let j = i + 1; j < near.length; j++) {
                        const a = near[i];
                        const b = near[j];
                        const d = Math.hypot(a.x - b.x, a.y - b.y);

                        if (d > 110) continue;

                        const dm = Math.hypot((a.x + b.x) / 2 - mouse.sx, (a.y + b.y) / 2 - mouse.sy);
                        const alpha = (1 - d / 110) * Math.max(0, 1 - dm / 220) * 0.5 * mouse.strength;

                        if (alpha <= 0.01) continue;

                        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }
        };

        footer.addEventListener("pointermove", event => {
            const rect = canvas.getBoundingClientRect();

            mouse.x = event.clientX - rect.left;
            mouse.y = event.clientY - rect.top;

            if (!mouse.inside) {
                mouse.sx = mouse.x;
                mouse.sy = mouse.y;
            }

            mouse.inside = true;
        });

        footer.addEventListener("pointerleave", () => { mouse.inside = false; });

        // header claro enquanto o rodapé escuro passa por trás dele
        const siteHeader = document.querySelector(".header");

        const checkHeader = () => {
            siteHeader?.classList.toggle("over-footer", footer.getBoundingClientRect().top < 0);
        };

        window.addEventListener("scroll", checkHeader, { passive: true });
        checkHeader();

        if ("IntersectionObserver" in window) {
            new IntersectionObserver(entries => {
                visible = entries[0].isIntersecting;
            }, { threshold: 0.05 }).observe(footer);
        } else {
            visible = true;
        }

        resize();
        window.addEventListener("resize", resize);

        // o rodapé muda de altura quando o mapa/fontes carregam
        if ("ResizeObserver" in window) new ResizeObserver(resize).observe(footer);

        waveFront.setAttribute("d", wavePath(0, 0, 1));
        waveBack.setAttribute("d", wavePath(1.7, 18, 1.3));

        requestAnimationFrame(frame);
    }

    /* =================================================
       7. HEADER NO CELULAR
       - ao rolar, ganha uma barra com fundo (texto nunca
         fica por cima do conteúdo)
       - some ao descer e volta ao subir
    ================================================= */

    const headerBar = document.querySelector(".header");
    const mobileHeader = window.matchMedia("(max-width: 800px)");
    let lastScrollY = window.scrollY;

    const updateHeaderBar = () => {
        if (!headerBar) return;

        const y = window.scrollY;
        const mobile = mobileHeader.matches;

        headerBar.classList.toggle("is-solid", mobile && y > 40);

        if (!mobile || y < 140 || document.body.classList.contains("bag-open")) {
            headerBar.classList.remove("is-hidden");
            lastScrollY = y;
            return;
        }

        if (y > lastScrollY + 6) {
            headerBar.classList.add("is-hidden");
            lastScrollY = y;
        } else if (y < lastScrollY - 6) {
            headerBar.classList.remove("is-hidden");
            lastScrollY = y;
        }
    };

    window.addEventListener("scroll", updateHeaderBar, { passive: true });
    mobileHeader.addEventListener?.("change", updateHeaderBar);
    updateHeaderBar();

    render();

    window.VelmontBag = { add, open, close, count: totalQty };
})();
