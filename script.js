
/* =====================================================
   VELMONT — FASHION ARCHIVE
   ARARA DE ROUPAS
===================================================== */

/* =====================================================
   1. COLEÇÕES DA ARARA
   theme.bg     → cor da parte clara (em cima)
   theme.glow   → luz suave no centro da parte clara
   theme.dark   → cor da parte escura (embaixo)  [r, g, b]
   theme.accent → cor das ondas, partículas e destaques [r, g, b]
===================================================== */

const collections = [
    {
        name: "Casa Blanca",
        clothes: [
            "images/casa_blanca1.png",
            "images/casa_blanca3.png",
            "images/casa_blanca2.png"
        ],
        heights: [365, 365, 365],
        top: [8, 8, 8],
        offsetY: [0, 0, 0],
        scales: [1, 1, 1],
        theme: {
            bg: "#f4eee7",
            glow: "#fdfaf6",
            dark: [16, 12, 11],
            accent: [244, 208, 182]
        }
    },
    {
        name: "Louis Vuitton",
        clothes: [
            "images/LV1.png",
            "images/LV2.png",
            "images/LV3.png"
        ],

        // Alturas uniformes para manter as peças alinhadas
        heights: [365, 365, 365],
        top: [8, 8, 8],
        offsetY: [0, 0, 0],
        scales: [1, 1, 1],
        theme: {
            bg: "#efe7da",
            glow: "#fbf7ef",
            dark: [17, 13, 8],
            accent: [232, 192, 120]
        }
    },
    {
        name: "Lacoste",
        clothes: [
            "images/lacoste1.png",
            "images/lacoste2.png",
            "images/lacoste3.png"
        ],
        heights: [365, 365, 365],
        top: [8, 8, 8],
        offsetY: [0, 0, 0],
        scales: [1, 1, 1],
        theme: {
            bg: "#e9f0ea",
            glow: "#f8fbf8",
            dark: [7, 16, 12],
            accent: [140, 226, 178]
        }
    }
];

/* =====================================================
   2. ELEMENTOS
===================================================== */

const root = document.documentElement;
const header = document.querySelector(".header");
const clothesWindow = document.getElementById("clothesWindow");
let track = document.getElementById("clothesTrack");
const brands = document.querySelectorAll(".brand-symbol");
const currentNumber = document.getElementById("current");
const nextButton = document.getElementById("next");
const prevButton = document.getElementById("prev");
const bgLayers = document.getElementById("bgLayers");
const heroScroll = document.getElementById("heroScroll");
const logoWord = document.getElementById("logoWord");


const CATALOG = window.VELMONT_CATALOG || { categories: [], products: [] };

/* =====================================================
   3. ESTADO
===================================================== */

let currentCollection = 0;
let dragging = false;
let startX = 0;
let dragOffset = 0;
let isAnimating = false;

const REDUCED_MOTION = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
).matches;

// Multiplicador de tempo (quase zero se o usuário pediu menos movimento)
const TIME = REDUCED_MOTION ? 0.01 : 1;

const EXIT_DURATION = 620 * TIME;
const ENTER_DURATION = 1250 * TIME;
const ENTER_DELAY = 260 * TIME;
const STAGGER = 85 * TIME;
const BG_DURATION = 1300 * TIME;
const INTRO_CLOTHES_DELAY = 1250 * TIME;

const clamp01 = value => Math.max(0, Math.min(1, value));

/* =====================================================
   4. CENA DE FUNDO (CANVAS)
   - parte escura com borda em onda que se move
   - fitas de seda (linhas finas) dentro da parte escura
   - partículas que fogem do mouse e formam constelações
   - a borda da onda é "puxada" pelo cursor, como líquido
   - na troca de coleção: onda de choque + mudança de cor
===================================================== */

const scene = (() => {
    const canvas = document.getElementById("scene");

    if (!canvas || !canvas.getContext) return null;

    const ctx = canvas.getContext("2d");

    let width = 0;
    let height = 0;

    const palette = {
        dark: [...collections[0].theme.dark],
        accent: [...collections[0].theme.accent]
    };

    const target = {
        dark: [...palette.dark],
        accent: [...palette.accent]
    };

    const mouse = { x: 0, y: 0, sx: 0, sy: 0, active: false, strength: 0 };

    const surges = [];
    const particles = [];

    let scrollProgress = 0;
    let introStart = null;
    let time = 0;
    let now = performance.now();
    let last = now;

    // Cada fita: posição dentro da parte escura, amplitude, frequência,
    // velocidade e torção
    const ribbons = [
        { lines: 36, y: 0.34, amp: 0.12, freq: 1.1, speed: 0.3, phase: 0.0, twist: 2.2, alpha: 0.07, width: 0.7 },
        { lines: 28, y: 0.55, amp: 0.09, freq: 1.55, speed: -0.22, phase: 2.4, twist: 1.7, alpha: 0.055, width: 0.6 },
        { lines: 20, y: 0.22, amp: 0.07, freq: 0.8, speed: 0.16, phase: 4.1, twist: 2.8, alpha: 0.045, width: 0.5 }
    ];

    const easeInOut = t =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const rgba = (color, alpha) =>
        `rgba(${color[0] | 0}, ${color[1] | 0}, ${color[2] | 0}, ${alpha})`;

    const mix = (a, b, amount) =>
        a.map((value, i) => value + (b[i] - value) * amount);

    function createParticle() {
        const r = Math.random();

        return {
            x: Math.random() * width,
            y: Math.random() * height,
            vx: 0,
            vy: 0,
            // deriva natural: sobem devagar, como poeira iluminada
            bx: (Math.random() - 0.5) * 0.18,
            by: -(0.04 + Math.random() * 0.22),
            size: 0.5 + r * r * 2.1,
            phase: Math.random() * Math.PI * 2,
            twinkle: 0.6 + Math.random() * 1.8,
            kickAt: 0,
            kx: 0,
            ky: 0,
            inDark: false
        };
    }

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.75);

        width = window.innerWidth;
        height = window.innerHeight;

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const count = Math.round(Math.min(170, (width * height) / 8500));

        while (particles.length < count) particles.push(createParticle());
        particles.length = count;
    }

    // Altura da onda escura: entra na abertura e sobe com o scroll
    function computeLevel() {
        const intro = introStart === null
            ? 0
            : REDUCED_MOTION
                ? 1
                : easeInOut(clamp01((now - introStart) / 1900));

        // no scroll a onda desce e sai da tela, abrindo espaço para o branco
        const resting = width < 800 ? 0.77 : 0.72;
        const scrolled = resting + (1.35 - resting) * easeInOut(scrollProgress);

        return {
            intro,
            level: 1.12 + (scrolled - 1.12) * intro
        };
    }

    // Altura da borda da parte escura em x
    function boundary(x, level) {
        const u = x / width;

        let y =
            level * height +
            height * 0.05 * Math.sin(u * Math.PI * 1.7 + time * 0.22) +
            height * 0.028 * Math.sin(u * Math.PI * 4.2 - time * 0.37 + 1.3);

        // onda de choque da troca de coleção
        for (const surge of surges) {
            const age = (now - surge.start) / 1000;
            const travel = age * width * 0.75;
            const front = surge.dir > 0
                ? width * 1.1 - travel
                : -width * 0.1 + travel;
            const d = (x - front) / (width * 0.13);

            y -= height * 0.085 * Math.exp(-d * d) * Math.exp(-age * 0.7);
            y += height * 0.018 *
                Math.sin(u * Math.PI * 7 + age * 7 * surge.dir) *
                Math.exp(-age * 1.6);
        }

        // a borda é puxada em direção ao cursor
        if (mouse.strength > 0.001) {
            const d = (x - mouse.sx) / 150;
            const pull = Math.exp(-d * d) * mouse.strength;
            const reach = clamp01(1 - Math.abs(mouse.sy - y) / 220);

            y += (mouse.sy - y) * 0.32 * pull * reach;
        }

        return y;
    }

    function drawRibbons(level) {
        const levelY = level * height;
        const region = Math.max(height - levelY, height * 0.25);
        const step = Math.max(6, width / 170);

        ribbons.forEach(ribbon => {
            const center = levelY + region * ribbon.y;
            const amp = height * ribbon.amp;

            // a torção "respira" devagar para a fita nunca ficar igual
            const twist = ribbon.twist + Math.sin(time * 0.15 + ribbon.phase) * 0.5;

            const wave = (u, shift) => {
                const angle = u * Math.PI * 2 * ribbon.freq;

                return center + amp * (
                    Math.sin(angle + time * ribbon.speed + ribbon.phase + shift) * 0.72 +
                    Math.sin(angle * 0.55 - time * ribbon.speed * 0.7 + ribbon.phase * 1.6 + shift * 0.4) * 0.28
                );
            };

            for (let k = 0; k < ribbon.lines; k++) {
                const s = k / (ribbon.lines - 1);
                const isEdge = k === 0 || k === ribbon.lines - 1;

                ctx.beginPath();

                for (let x = -step; x <= width + step; x += step) {
                    const u = x / width;
                    const a = wave(u, 0);
                    const b = wave(u, twist);
                    const y = a + (b - a) * s;

                    if (x === -step) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }

                ctx.strokeStyle = rgba(
                    palette.accent,
                    isEdge ? ribbon.alpha * 3.5 : ribbon.alpha
                );
                ctx.lineWidth = isEdge ? ribbon.width * 1.4 : ribbon.width;
                ctx.stroke();
            }
        });
    }

    function circle(x, y, r) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    function frame(timestamp) {
        now = timestamp;

        const delta = Math.min(0.05, (now - last) / 1000);
        const step60 = delta * 60;
        last = now;

        if (!REDUCED_MOTION) time += delta;

        // cores mudam suavemente
        for (const key of ["dark", "accent"]) {
            for (let i = 0; i < 3; i++) {
                palette[key][i] += (target[key][i] - palette[key][i]) * 0.035;
            }
        }

        mouse.sx += (mouse.x - mouse.sx) * 0.14;
        mouse.sy += (mouse.y - mouse.sy) * 0.14;
        mouse.strength += ((mouse.active ? 1 : 0) - mouse.strength) * 0.06;

        while (surges.length && now - surges[0].start > 4500) surges.shift();

        const { intro, level } = computeLevel();

        /* ---------- borda da onda ---------- */

        const step = Math.max(8, width / 160);
        const edgePoints = [];

        for (let x = -step; x <= width + step; x += step) {
            edgePoints.push([x, boundary(x, level)]);
        }

        const darkPath = new Path2D();
        const edgePath = new Path2D();
        let minY = Infinity;

        edgePoints.forEach(([x, y], i) => {
            if (i === 0) {
                darkPath.moveTo(x, y);
                edgePath.moveTo(x, y);
            } else {
                darkPath.lineTo(x, y);
                edgePath.lineTo(x, y);
            }

            minY = Math.min(minY, y);
        });

        darkPath.lineTo(width + step, height + step);
        darkPath.lineTo(-step, height + step);
        darkPath.closePath();

        ctx.clearRect(0, 0, width, height);

        /* ---------- parte escura ---------- */

        const gradientTop = Math.min(minY, height - 1);
        const gradient = ctx.createLinearGradient(0, gradientTop, 0, height);

        gradient.addColorStop(0, rgba(mix(palette.dark, palette.accent, 0.12), 1));
        gradient.addColorStop(0.45, rgba(palette.dark, 1));
        gradient.addColorStop(1, rgba(palette.dark, 1));

        ctx.fillStyle = gradient;
        ctx.fill(darkPath);

        // brilho da borda
        ctx.lineWidth = 10;
        ctx.strokeStyle = rgba(palette.accent, 0.05);
        ctx.stroke(edgePath);

        ctx.lineWidth = 1.1;
        ctx.strokeStyle = rgba(palette.accent, 0.45);
        ctx.stroke(edgePath);

        /* ---------- fitas + luz do mouse (só na parte escura) ---------- */

        ctx.save();
        ctx.clip(darkPath);

        if (mouse.strength > 0.01) {
            const light = ctx.createRadialGradient(
                mouse.sx, mouse.sy, 0,
                mouse.sx, mouse.sy, 320
            );

            light.addColorStop(0, rgba(palette.accent, 0.13 * mouse.strength));
            light.addColorStop(1, rgba(palette.accent, 0));

            ctx.fillStyle = light;
            ctx.fillRect(0, 0, width, height);
        }

        drawRibbons(level);

        ctx.restore();

        /* ---------- partículas ---------- */

        const particleColor = mix(palette.accent, [255, 255, 255], 0.35);
        const radius = 130;
        const near = [];

        for (const p of particles) {
            // volta aos poucos para a deriva natural
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

            // empurrão da onda de choque
            if (p.kickAt && now >= p.kickAt) {
                p.vx += p.kx;
                p.vy += p.ky;
                p.kickAt = 0;
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

            const index = Math.max(
                0,
                Math.min(edgePoints.length - 1, Math.round((p.x + step) / step))
            );

            p.inDark = p.y > edgePoints[index][1];

            const twinkle = 0.55 + 0.45 * Math.sin(time * p.twinkle + p.phase);

            if (p.inDark) {
                const alpha = (0.35 + 0.55 * twinkle) * intro;

                ctx.fillStyle = rgba(particleColor, alpha);
                circle(p.x, p.y, p.size);

                if (p.size > 1.6) {
                    ctx.fillStyle = rgba(particleColor, alpha * 0.12);
                    circle(p.x, p.y, p.size * 4);
                }
            } else {
                // na parte clara viram poeira escura bem sutil
                ctx.fillStyle = rgba(palette.dark, 0.16 * twinkle * intro);
                circle(p.x, p.y, p.size * 0.8);
            }
        }

        /* ---------- constelação perto do mouse ---------- */

        if (near.length > 1) {
            const maxDistance = 110;

            ctx.lineWidth = 0.6;

            for (let i = 0; i < near.length; i++) {
                for (let j = i + 1; j < near.length; j++) {
                    const a = near[i];
                    const b = near[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const d = Math.sqrt(dx * dx + dy * dy);

                    if (d > maxDistance) continue;

                    const mx = (a.x + b.x) / 2 - mouse.sx;
                    const my = (a.y + b.y) / 2 - mouse.sy;
                    const dm = Math.sqrt(mx * mx + my * my);

                    const alpha =
                        (1 - d / maxDistance) *
                        clamp01(1 - dm / 220) *
                        0.5 *
                        mouse.strength;

                    if (alpha <= 0.01) continue;

                    ctx.strokeStyle = a.inDark
                        ? rgba(particleColor, alpha)
                        : rgba(palette.dark, alpha * 0.5);

                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(frame);
    }

    /* ---------- mouse / toque ---------- */

    window.addEventListener("pointermove", event => {
        mouse.x = event.clientX;
        mouse.y = event.clientY;

        if (!mouse.active && mouse.strength < 0.01) {
            mouse.sx = mouse.x;
            mouse.sy = mouse.y;
        }

        mouse.active = true;
    });

    window.addEventListener("pointerup", event => {
        if (event.pointerType !== "mouse") mouse.active = false;
    });

    root.addEventListener("mouseleave", () => {
        mouse.active = false;
    });

    resize();
    window.addEventListener("resize", resize);
    requestAnimationFrame(frame);

    return {
        startIntro() {
            introStart = performance.now();
        },

        setScroll(progress) {
            scrollProgress = progress;
        },

        setTheme(theme, direction = 1, instant = false) {
            target.dark = [...theme.dark];
            target.accent = [...theme.accent];

            if (instant) {
                palette.dark = [...theme.dark];
                palette.accent = [...theme.accent];
                return;
            }

            const start = performance.now();

            surges.push({ start, dir: direction });

            // cada partícula leva o empurrão quando a onda de choque passa por ela
            particles.forEach(p => {
                const distance = direction > 0 ? width - p.x : p.x;

                p.kickAt = start + ((distance / width + 0.1) / 0.75) * 1000;
                p.kx = -direction * (0.8 + Math.random() * 2.2);
                p.ky = -(0.4 + Math.random() * 2);
            });
        }
    };
})();

/* =====================================================
   5. CRIA ROUPA
===================================================== */

function createClothing(
    imageSrc,
    height = 365,
    offsetY = 0,
    scale = 1,
    top = 8
) {
    const item = document.createElement("div");
    item.className = "clothing";

    const image = document.createElement("img");
    image.className = "product";
    image.src = imageSrc;
    image.alt = "Peça da coleção";
    image.draggable = false;
    image.loading = "eager";

    image.dataset.height = height;
    image.dataset.offsetY = offsetY;
    image.dataset.scale = scale;
    image.dataset.top = top;

    image.addEventListener("error", () => {
        console.warn("Imagem não encontrada:", imageSrc);
        item.classList.add("image-missing");
    });

    // Aplica o tamanho imediatamente para não haver "pulo" ao carregar
    normalizeImage(image);

    item.appendChild(image);

    return item;
}

/* =====================================================
   6. NORMALIZA IMAGEM DA ARARA
===================================================== */

function normalizeImage(image) {
    const height = Number(image.dataset.height) || 365;
    const offsetY = Number(image.dataset.offsetY) || 0;
    const scale = Number(image.dataset.scale) || 1;
    const top = Number(image.dataset.top);

    const finalTop = Number.isFinite(top) ? top : 8;
    const finalHeight = height * scale;

    image.style.setProperty(
        "height",
        `${finalHeight}px`,
        "important"
    );

    image.style.setProperty("width", "auto", "important");

    image.style.setProperty(
        "top",
        `${finalTop + offsetY}px`,
        "important"
    );

    image.style.setProperty("left", "50%", "important");

    image.style.setProperty(
        "transform",
        "translateX(-50%)",
        "important"
    );
}

/* =====================================================
   7. ATUALIZA MARCA E CONTADOR
===================================================== */

function updateBrand(index) {
    brands.forEach((brand, brandIndex) => {
        brand.classList.toggle(
            "active",
            brandIndex === index
        );
    });
}

function updateCounter(index, direction = 1) {
    if (!currentNumber) return;

    currentNumber.textContent =
        String(index + 1).padStart(2, "0");

    currentNumber.animate(
        [
            { opacity: 0, transform: `translateY(${direction * 8}px)` },
            { opacity: 1, transform: "translateY(0)" }
        ],
        {
            duration: 500 * TIME,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)"
        }
    );
}

/* =====================================================
   8. PREPARA AS ROUPAS
   Cada coleção ganha um "track" novo, assim a saída
   e a entrada acontecem ao mesmo tempo (sem espera)
===================================================== */

function prepareTrack(collection) {
    const newTrack = document.createElement("div");
    newTrack.className = "clothes-track pending";

    collection.clothes.forEach((imageSrc, pieceIndex) => {
        const height = collection.heights?.[pieceIndex] ?? 365;
        const offsetY = collection.offsetY?.[pieceIndex] ?? 0;
        const scale = collection.scales?.[pieceIndex] ?? 1;
        const top = collection.top?.[pieceIndex] ?? 8;

        newTrack.appendChild(
            createClothing(imageSrc, height, offsetY, scale, top)
        );
    });

    return newTrack;
}

// Espera as imagens decodificarem (máx. 700ms) para a entrada não travar
function waitForImages(container) {
    const images = [...container.querySelectorAll("img")];

    const decoded = Promise.all(
        images.map(image =>
            image.decode ? image.decode().catch(() => {}) : null
        )
    );

    const timeout = new Promise(resolve => setTimeout(resolve, 700));

    return Promise.race([decoded, timeout]);
}

/* =====================================================
   9. ANIMAÇÕES DAS PEÇAS
   Movimento de cabide: a peça desliza na barra e
   balança a partir do gancho até assentar
===================================================== */

function travelDistance() {
    return Math.min(280, window.innerWidth * 0.28);
}

// Ordena as peças para que a da frente do movimento saia/entre primeiro
function orderedItems(items, direction) {
    return direction > 0 ? items : [...items].reverse();
}

function animateExit(items, direction) {
    const distance = travelDistance();

    // Indo para a esquerda, a barra da roupa "fica para trás" (rotação negativa)
    const lag = -direction;

    return orderedItems(items, direction).map((item, order) =>
        item.animate(
            [
                {
                    transform: "translateX(0) rotate(0deg)",
                    opacity: 1,
                    filter: "blur(0px)"
                },
                {
                    transform: `translateX(${-direction * distance * 0.35}px) rotate(${lag * 5}deg)`,
                    opacity: 0.85,
                    offset: 0.45
                },
                {
                    transform: `translateX(${-direction * distance}px) rotate(${lag * 7}deg)`,
                    opacity: 0,
                    filter: "blur(3px)"
                }
            ],
            {
                duration: EXIT_DURATION,
                delay: order * STAGGER * 0.6,
                easing: "cubic-bezier(0.55, 0, 0.7, 0.4)",
                fill: "forwards"
            }
        ).finished
    );
}

function animateEnter(items, direction, delay = 0) {
    const distance = travelDistance();
    const lag = -direction;

    return orderedItems(items, direction).map((item, order) =>
        item.animate(
            [
                {
                    transform: `translateX(${direction * distance}px) rotate(${lag * 2}deg)`,
                    opacity: 0,
                    easing: "cubic-bezier(0.25, 0.8, 0.35, 1)"
                },
                {
                    transform: `translateX(${direction * distance * 0.12}px) rotate(${lag * 6}deg)`,
                    opacity: 1,
                    offset: 0.38,
                    easing: "cubic-bezier(0.3, 0, 0.3, 1)"
                },
                {
                    // a peça para e o balanço passa do ponto
                    transform: `translateX(${-direction * 4}px) rotate(${-lag * 3.2}deg)`,
                    offset: 0.6,
                    easing: "ease-in-out"
                },
                {
                    transform: `translateX(${direction * 1}px) rotate(${lag * 1.3}deg)`,
                    offset: 0.8,
                    easing: "ease-in-out"
                },
                {
                    transform: "translateX(0) rotate(-0.4deg)",
                    offset: 0.92,
                    easing: "ease-in-out"
                },
                {
                    transform: "translateX(0) rotate(0deg)",
                    opacity: 1
                }
            ],
            {
                duration: ENTER_DURATION,
                delay: delay + order * STAGGER,
                fill: "backwards"
            }
        ).finished
    );
}

// Abertura do site: as peças caem no cabide e balançam
function animateDrop(items, delay = 0) {
    return items.map((item, order) => {
        const side = order % 2 === 0 ? 1 : -1;

        return item.animate(
            [
                {
                    transform: "translateY(-120px) rotate(0deg)",
                    opacity: 0,
                    easing: "cubic-bezier(0.5, 0, 0.75, 0)"
                },
                {
                    transform: "translateY(8px) rotate(0deg)",
                    opacity: 1,
                    offset: 0.32,
                    easing: "cubic-bezier(0.2, 0.8, 0.3, 1)"
                },
                {
                    transform: `translateY(-2px) rotate(${side * 3.5}deg)`,
                    offset: 0.52,
                    easing: "ease-in-out"
                },
                {
                    transform: `translateY(0) rotate(${-side * 2}deg)`,
                    offset: 0.7,
                    easing: "ease-in-out"
                },
                {
                    transform: `translateY(0) rotate(${side * 0.8}deg)`,
                    offset: 0.86,
                    easing: "ease-in-out"
                },
                {
                    transform: "translateY(0) rotate(0deg)",
                    opacity: 1
                }
            ],
            {
                duration: 1500 * TIME,
                delay: delay + order * 150 * TIME,
                fill: "backwards"
            }
        ).finished;
    });
}

/* =====================================================
   10. TRANSIÇÃO DE FUNDO
   Uma nova camada de cor se abre em círculo a partir
   do lado de onde vêm as roupas; ondas e partículas
   mudam de cor junto
===================================================== */

function changeBackground(theme, direction = 1, instant = false) {
    if (!theme) return;

    root.style.setProperty("--accent", theme.accent.join(", "));
    document.body.style.backgroundColor = theme.bg;

    scene?.setTheme(theme, direction, instant);

    if (!bgLayers) return;

    const layer = document.createElement("div");
    layer.className = "bg-layer";
    layer.style.background = `radial-gradient(120% 90% at 50% 42%, ${theme.glow} 0%, ${theme.bg} 62%)`;

    bgLayers.appendChild(layer);

    const cleanup = () => {
        // Mantém só a camada mais recente
        while (bgLayers.firstElementChild !== layer) {
            bgLayers.firstElementChild.remove();
        }
    };

    if (instant) {
        cleanup();
        return;
    }

    const originX = direction > 0 ? "100%" : "0%";

    layer.animate(
        [
            { clipPath: `circle(0% at ${originX} 75%)` },
            { clipPath: `circle(150% at ${originX} 75%)` }
        ],
        {
            duration: BG_DURATION,
            easing: "cubic-bezier(0.65, 0, 0.35, 1)",
            fill: "forwards"
        }
    ).finished.then(cleanup, cleanup);
}

/* =====================================================
   11. RENDERIZA COLEÇÃO
===================================================== */

async function renderCollection(index, direction = 1, initial = false) {
    const collection = collections[index];

    if (!collection || !clothesWindow || isAnimating) return;

    isAnimating = true;

    const oldTrack = track;
    const oldItems = oldTrack ? [...oldTrack.children] : [];

    const newTrack = prepareTrack(collection);
    clothesWindow.appendChild(newTrack);

    // Fundo, marca e contador mudam junto com o início da saída
    changeBackground(collection.theme, direction, initial);
    updateBrand(index);
    if (!initial) updateCounter(index, direction);
    currentCollection = index;

    const exits = animateExit(oldItems, direction);

    await waitForImages(newTrack);

    newTrack.classList.remove("pending");

    const newItems = [...newTrack.children];

    const enters = initial
        ? animateDrop(newItems, INTRO_CLOTHES_DELAY)
        : animateEnter(newItems, direction, ENTER_DELAY);

    track = newTrack;
    bindDrag(track);

    await Promise.allSettled(exits);
    oldTrack?.remove();

    await Promise.allSettled(enters);

    isAnimating = false;
}

/* =====================================================
   12. TROCAR COLEÇÃO
===================================================== */

function goToCollection(index, direction = 1) {
    if (isAnimating) return;

    if (index >= collections.length) index = 0;
    if (index < 0) index = collections.length - 1;

    renderCollection(index, direction);
}

/* =====================================================
   13. BOTÕES DAS MARCAS
===================================================== */

brands.forEach(brand => {
    brand.addEventListener("click", () => {
        const index = Number(brand.dataset.index);

        if (index === currentCollection || isAnimating) return;

        const direction = index > currentCollection ? 1 : -1;

        goToCollection(index, direction);
    });
});

/* =====================================================
   14. BOTÕES PRÓXIMO / ANTERIOR E TECLADO
===================================================== */

if (nextButton) {
    nextButton.addEventListener("click", () => {
        goToCollection(currentCollection + 1, 1);
    });
}

if (prevButton) {
    prevButton.addEventListener("click", () => {
        goToCollection(currentCollection - 1, -1);
    });
}

document.addEventListener("keydown", event => {
    if (event.key === "ArrowRight") {
        goToCollection(currentCollection + 1, 1);
    }

    if (event.key === "ArrowLeft") {
        goToCollection(currentCollection - 1, -1);
    }
});

/* =====================================================
   15. ARRASTE DA ARARA
   As peças acompanham o dedo/mouse com resistência
   e voltam com efeito de mola se o arraste for curto
===================================================== */

const DRAG_RESISTANCE = 0.35;
const DRAG_THRESHOLD = 60;

function setDragPose(currentTrack, distance) {
    const offset = distance * DRAG_RESISTANCE;
    const tilt = Math.max(-5, Math.min(5, distance * 0.02));

    currentTrack.style.translate = `${offset}px 0`;

    [...currentTrack.children].forEach(item => {
        item.style.rotate = `${tilt}deg`;
    });
}

function springBack(currentTrack, distance) {
    const offset = distance * DRAG_RESISTANCE;
    const tilt = Math.max(-5, Math.min(5, distance * 0.02));

    currentTrack.style.translate = "";
    currentTrack.animate(
        [{ translate: `${offset}px 0` }, { translate: "0 0" }],
        {
            duration: 650 * TIME,
            easing: "cubic-bezier(0.34, 1.56, 0.64, 1)"
        }
    );

    [...currentTrack.children].forEach(item => {
        item.style.rotate = "";
        item.animate(
            [
                { rotate: `${tilt}deg` },
                { rotate: `${-tilt * 0.5}deg`, offset: 0.45 },
                { rotate: `${tilt * 0.2}deg`, offset: 0.75 },
                { rotate: "0deg" }
            ],
            { duration: 900 * TIME, easing: "ease-out" }
        );
    });
}

function bindDrag(currentTrack) {
    currentTrack.addEventListener("pointerdown", event => {
        if (isAnimating || currentTrack !== track) return;

        if (
            event.pointerType === "mouse" &&
            event.button !== 0
        ) {
            return;
        }

        dragging = true;
        startX = event.clientX;
        dragOffset = 0;

        currentTrack.classList.add("dragging");

        try {
            currentTrack.setPointerCapture(event.pointerId);
        } catch (error) {
            console.warn("Pointer capture indisponível.");
        }
    });

    currentTrack.addEventListener("pointermove", event => {
        if (!dragging || currentTrack !== track) return;

        dragOffset = event.clientX - startX;
        setDragPose(currentTrack, dragOffset);
    });

    const endDrag = cancelled => {
        if (!dragging) return;

        dragging = false;
        currentTrack.classList.remove("dragging");

        if (cancelled || Math.abs(dragOffset) < DRAG_THRESHOLD) {
            springBack(currentTrack, dragOffset);
            return;
        }

        if (dragOffset < 0) {
            goToCollection(currentCollection + 1, 1);
        } else {
            goToCollection(currentCollection - 1, -1);
        }
    };

    currentTrack.addEventListener("pointerup", () => endDrag(false));
    currentTrack.addEventListener("pointercancel", () => endDrag(true));

    currentTrack.addEventListener("dragstart", event => {
        event.preventDefault();
    });
}

/* =====================================================
   16. TEXTO EM LETRAS
===================================================== */

function splitLetters(element) {
    if (!element) return [];

    const text = element.textContent.trim();

    element.textContent = "";

    return [...text].map((letter, i) => {
        const span = document.createElement("span");

        span.textContent = letter === " " ? " " : letter;
        span.style.setProperty("--i", i);

        element.append(span);

        return span;
    });
}

splitLetters(logoWord);

/* =====================================================
   17. VITRINE DE CATEGORIAS
   - a vitrine fica presa na tela; cada "parada" de
     scroll mostra uma categoria
   - clicar num quadrado leva até a categoria
   - fundo, onda, nome gigante e peça trocam juntos
   O conteúdo vem de data/catalog.js
===================================================== */

const showcaseScroll = document.getElementById("categorias");
const showcase = document.getElementById("showcase");
const scPhoto = document.getElementById("scPhoto");
const scWord = document.getElementById("scWord");
const scWordTexts = scWord ? [...scWord.querySelectorAll(".sc-word-text")] : [];
const scCards = document.getElementById("scCards");
const scProducts = document.getElementById("scProducts");
const scNext = document.getElementById("scNext");
const scNextMedia = document.getElementById("scNextMedia");
const scNextName = document.getElementById("scNextName");
const scMeta = document.getElementById("scMeta");
const scTitle = document.getElementById("scTitle");
const scTagline = document.getElementById("scTagline");
const scExplore = document.getElementById("scExplore");
const scIndex = document.getElementById("scIndex");
const scTotal = document.getElementById("scTotal");
const scHintText = document.getElementById("scHintText");
const scCredit = document.getElementById("scCredit");

const categories = CATALOG.categories;
const mobileQuery = window.matchMedia("(max-width: 800px)");

// quanto scroll (em alturas de tela) cada categoria ocupa
const SC_STEP = 0.8;

// duração da troca em faixas (ms)
const STRIP_TIME = 1000;

let scActive = -1;
let scCardEls = [];
let scBaseScene = null;
let scStripTimer = null;
let scWordTimer = null;

const pad = number => String(number).padStart(2, "0");

function escapeHTML(text = "") {
    return String(text).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));
}

function productsOf(slug) {
    return CATALOG.products.filter(product => product.category === slug);
}

// cor do "estúdio" atrás da peça
const studioColor = category => category.theme?.photo || category.theme?.bg || "#8a8a8a";

// "WALK IN LUXURY" → "Walk in luxury"
function sentenceCase(text = "") {
    const lower = text.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/* ---------- cena (foto da direita) ---------- */

function sceneMarkup(category) {
    const hero = category.hero || {};

    // foto inteira (modelo/editorial): cobre toda a área
    if (hero.photo) {
        // focus = enquadramento no computador; focusMobile = no celular
        const focus = [
            hero.focus ? `--focus:${escapeHTML(hero.focus)}` : "",
            hero.focusMobile ? `--focus-m:${escapeHTML(hero.focusMobile)}` : ""
        ].filter(Boolean).join(";");

        return `<img class="sc-cover" ${focus ? `style="${focus}"` : ""} src="${escapeHTML(hero.photo)}" alt="" draggable="false">`;
    }

    // recorte da peça sobre a cor de estúdio
    if (hero.type === "image" && hero.src) {
        return `
            <span class="sc-light"></span>
            <img class="sc-cut" ${hero.scale ? `style="--scale:${Number(hero.scale)}"` : ""} src="${escapeHTML(hero.src)}" alt="" draggable="false">`;
    }

    return `
        <span class="sc-light"></span>
        <span class="sc-soon">EM BREVE</span>`;
}

function makeScene(category, extraClass = "") {
    const scene = document.createElement("div");

    scene.className = `sc-scene ${extraClass}`;
    scene.style.setProperty("--c", studioColor(category));
    scene.innerHTML = sceneMarkup(category);

    return scene;
}

function clearStrips() {
    clearTimeout(scStripTimer);
    scPhoto.querySelectorAll(".sc-strip").forEach(strip => strip.remove());
}

// a foto nova entra em faixas verticais (alternando de cima e de baixo)
// enquanto a antiga sai em faixas na direção oposta
function showScene(category, goingDown, instant) {
    const previous = scBaseScene;
    const next = makeScene(category);

    clearStrips();

    if (instant || REDUCED_MOTION || !previous) {
        scPhoto.replaceChildren(next);
        scBaseScene = next;
        return;
    }

    const count = mobileQuery.matches ? 5 : 8;
    const width = 100 / count;
    const easing = "cubic-bezier(0.77, 0, 0.18, 1)";

    // a cena nova fica por baixo; as faixas cobrem a troca
    scPhoto.replaceChildren(next);
    scBaseScene = next;

    for (let i = 0; i < count; i++) {
        const clip = `inset(0 ${(100 - (i + 1) * width).toFixed(3)}% 0 ${(i * width).toFixed(3)}%)`;
        const from = (i % 2 === 0) === goingDown ? 1 : -1;
        const delay = i * 45;

        // faixa da foto antiga: sai
        const oldStrip = previous.cloneNode(true);
        oldStrip.classList.add("sc-strip");
        oldStrip.style.clipPath = clip;
        scPhoto.appendChild(oldStrip);

        oldStrip.animate(
            [{ transform: "translateY(0)" }, { transform: `translateY(${-from * 100}%)` }],
            { duration: STRIP_TIME, delay, easing, fill: "both" }
        );

        // faixa da foto nova: entra
        const newStrip = next.cloneNode(true);
        newStrip.classList.add("sc-strip");
        newStrip.style.clipPath = clip;
        scPhoto.appendChild(newStrip);

        newStrip.animate(
            [{ transform: `translateY(${from * 100}%)` }, { transform: "translateY(0)" }],
            { duration: STRIP_TIME, delay, easing, fill: "both" }
        );
    }

    scStripTimer = setTimeout(clearStrips, STRIP_TIME + count * 45 + 50);
}

/* ---------- nome vertical ---------- */

function fitWord() {
    if (!scWord) return;

    const mobile = mobileQuery.matches;
    const sample = scWordTexts[0];

    sample.style.fontSize = "100px";

    // em modo vertical, a "largura" do texto vira altura
    const naturalLength = sample.offsetHeight || 1;
    const area = scWord.clientHeight;
    const maxSize = window.innerWidth * (mobile ? 0.2 : 0.135);
    const size = Math.min(maxSize, (area * 0.92 / naturalLength) * 100);

    scWordTexts.forEach(text => { text.style.fontSize = `${size}px`; });
}

function swapWord(text, goingDown, instant) {
    clearTimeout(scWordTimer);

    const render = () => {
        scWordTexts.forEach(el => {
            el.textContent = text;
            el.classList.remove("out-up", "out-down");
            el.classList.add(goingDown ? "prep-down" : "prep-up");
        });

        fitWord();
        void scWord.offsetWidth;

        scWordTexts.forEach(el => el.classList.remove("prep-down", "prep-up"));
    };

    if (instant || REDUCED_MOTION) {
        render();
        return;
    }

    scWordTexts.forEach(el => el.classList.add(goingDown ? "out-up" : "out-down"));
    scWordTimer = setTimeout(render, 420);
}

/* ---------- peças da categoria ---------- */

function renderProducts(category) {
    const items = productsOf(category.slug).slice(0, 3);

    scProducts.innerHTML = items
        .map((product, i) => `
            <a
                class="sc-product"
                href="categoria.html?c=${encodeURIComponent(category.slug)}&p=${encodeURIComponent(product.id)}"
                style="--i:${i}"
            >
                <span class="sc-product-brand">${escapeHTML(product.brand.toUpperCase())}</span>
                <img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" loading="lazy">
                <span class="sc-product-price">${product.price ? escapeHTML(product.price) : "SOB CONSULTA"}</span>
            </a>`)
        .join("");
}

/* ---------- montagem ---------- */

function buildShowcase() {
    if (!showcase || !categories.length) return;

    showcaseScroll.style.height =
        `${100 + (categories.length - 1) * SC_STEP * 100 + 40}vh`;

    scCards.innerHTML = categories
        .map((category, i) => `
            <button
                class="sc-dot"
                type="button"
                role="tab"
                aria-selected="false"
                aria-label="${escapeHTML(category.name)}"
                data-index="${i}"
            >
                <span class="sc-dot-num">${pad(i + 1)}</span>
                <span class="sc-dot-line"></span>
                <span class="sc-dot-name">${escapeHTML(category.name)}</span>
            </button>`)
        .join("");

    scCardEls = [...scCards.children];

    scCardEls.forEach(card => {
        card.addEventListener("click", () => goToCategory(Number(card.dataset.index)));
    });

    scNext.addEventListener("click", () => {
        goToCategory((scActive + 1) % categories.length);
    });

    scTotal.textContent = `/${pad(categories.length)}`;

    setActive(0);
}

/* ---------- troca de categoria ---------- */

function setActive(index) {
    if (index === scActive || !categories[index]) return;

    const previous = scActive;
    const first = previous === -1;
    const goingDown = first || index > previous;
    const category = categories[index];
    const nextCategory = categories[(index + 1) % categories.length];

    scActive = index;

    showcase.style.setProperty("--sc-color", studioColor(category));
    showcase.style.setProperty("--sc-panel", category.theme?.panel || "#fff");

    showScene(category, goingDown, first);
    swapWord(category.name, goingDown, first);

    // seletor
    scCardEls.forEach((card, i) => {
        card.classList.toggle("active", i === index);
        card.setAttribute("aria-selected", String(i === index));
    });

    // painel branco (os textos trocam com um leve fade)
    showcase.classList.remove("sc-swap");
    void showcase.offsetWidth;
    if (!first) showcase.classList.add("sc-swap");

    const count = productsOf(category.slug).length;

    scTitle.textContent = category.name;
    scTagline.textContent = sentenceCase(category.tagline);
    scMeta.textContent = `${category.brand} · ${count ? `${count} ${count === 1 ? "PEÇA" : "PEÇAS"}` : "EM BREVE"}`;
    scExplore.href = `categoria.html?c=${encodeURIComponent(category.slug)}`;
    scIndex.textContent = pad(index + 1);

    scNextName.textContent = nextCategory.name;
    scNextMedia.style.setProperty("--c", studioColor(nextCategory));
    scNextMedia.innerHTML = nextCategory.hero?.photo || nextCategory.hero?.src
        ? `<img src="${escapeHTML(nextCategory.hero.photo || nextCategory.hero.src)}" alt="" loading="lazy" class="${nextCategory.hero.photo ? "cover" : ""}">`
        : "";
    scNext.setAttribute("aria-label", `Próxima categoria: ${nextCategory.name}`);

    renderProducts(category);

    scHintText.textContent = index < categories.length - 1
        ? "ROLE PARA BAIXO"
        : "ROLE PARA CONTINUAR";

    scCredit.textContent = category.hero?.credit || "";
}

// leva o scroll até a "parada" da categoria escolhida
function goToCategory(index) {
    const top = showcaseScroll.getBoundingClientRect().top + window.scrollY;

    window.scrollTo({
        top: top + index * SC_STEP * window.innerHeight + 2,
        behavior: REDUCED_MOTION ? "auto" : "smooth"
    });
}

function updateShowcase() {
    if (!showcaseScroll || !categories.length) return;

    const rect = showcase.getBoundingClientRect();
    const scrolled = -showcaseScroll.getBoundingClientRect().top;
    const raw = scrolled / (SC_STEP * window.innerHeight);
    const index = Math.max(0, Math.min(categories.length - 1, Math.round(raw)));

    setActive(index);

    // header: no celular a foto fica atrás de tudo (branco);
    // no computador o logo fica no painel branco e o menu sobre a foto
    const behind = rect.top < 60 && rect.bottom > 60;

    header?.classList.toggle("on-dark", behind && mobileQuery.matches);
    header?.classList.toggle("on-split", behind && !mobileQuery.matches);
}

buildShowcase();

document.fonts?.ready.then(fitWord);

window.addEventListener("resize", fitWord);

mobileQuery.addEventListener?.("change", () => {
    fitWord();
    updateShowcase();
});

/* =====================================================
   18. SCROLL
   - a onda escura da arara desce e some (fundo branco)
   - a vitrine troca de categoria conforme o scroll
===================================================== */

let scrollTicking = false;

function updateScroll() {
    scrollTicking = false;

    const range = heroScroll
        ? heroScroll.offsetHeight - window.innerHeight
        : window.innerHeight;

    const progress = clamp01(window.scrollY / Math.max(1, range));

    root.style.setProperty("--p", progress.toFixed(4));
    root.classList.toggle("hero-passed", progress > 0.25);

    scene?.setScroll(progress);

    updateShowcase();
}

window.addEventListener("scroll", () => {
    if (scrollTicking) return;

    scrollTicking = true;
    requestAnimationFrame(updateScroll);
}, { passive: true });

window.addEventListener("resize", updateScroll);

/* =====================================================
   19. RODAPÉ — montado por loja.js (compartilhado)
===================================================== */

/* =====================================================
   20. ABERTURA DO SITE
   Espera as fontes (máx. 900ms) e dispara a sequência:
   onda sobe → logo e letras → título → barra → roupas
===================================================== */

function startIntro() {
    document.body.classList.remove("is-loading");
    document.body.classList.add("is-loaded");

    scene?.startIntro();
    updateScroll();

    renderCollection(0, 1, true);
}

const fontsReady = document.fonts?.ready ?? Promise.resolve();

Promise.race([
    fontsReady,
    new Promise(resolve => setTimeout(resolve, 900))
]).then(() => {
    // dois frames garantem que o estado inicial foi pintado antes da transição
    requestAnimationFrame(() => requestAnimationFrame(startIntro));
});