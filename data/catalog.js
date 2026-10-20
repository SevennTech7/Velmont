/* =====================================================
   VELMONT — CATÁLOGO
   -----------------------------------------------------
   Este arquivo é a "fonte de dados" do site.
   O formato foi pensado para virar uma API no futuro:
   quando existir o back-end, basta trocar este arquivo
   por um fetch("/api/catalog") que devolva o mesmo JSON.

   store      → dados da loja (WhatsApp da sacola)
   categories → vitrine da página inicial + menu do topo
   products   → peças listadas em categoria.html?c=<slug>

   CATEGORIAS
   theme.photo= cor do nome vertical (parte sobre o painel) e
                fundo de estúdio quando não há foto inteira
   theme.panel= cor clarinha do painel da esquerda (combina
                com o ambiente da foto)
   theme.bg   = cor escura do topo da página da categoria
   hero.photo = FOTO INTEIRA de fundo (modelo vestindo, editorial).
                Se existir, substitui o recorte + cor de estúdio.
                Ex.: photo: "images/categorias/fotos/calcados.jpg"
   hero.focus = qual parte da foto fica visível quando ela é
                cortada (ex.: "40% center" puxa a pessoa p/ direita)
   hero.focusMobile = o mesmo, só para o celular (opcional)
   hero.src   = foto da peça no centro da vitrine
                (PNG com fundo transparente fica melhor)
   hero.scale = tamanho da foto no palco (0.68 = padrão;
                diminua se a peça ficar grande demais)
   hero.credit= crédito pequeno no canto da vitrine (opcional,
                para fotos que exigem atribuição)

   PRODUTOS
   price: null → aparece "SOB CONSULTA"
   variants    → cores/opções do mesmo item; cada uma
                 com nome, cor da bolinha (swatch) e foto
===================================================== */

window.VELMONT_CATALOG = {

    /* -------------------------------------------------
       LOJA
       whatsapp: número com DDI + DDD, só dígitos.
       Ex.: "5511999998888". Vazio = o WhatsApp abre
       e o cliente escolhe o contato.
    ------------------------------------------------- */

    store: {
        name: "VELMONT",
        whatsapp: "",

        // só o usuário, sem @ (ex.: "velmont.store")
        instagram: "",

        // endereço mostrado no rodapé; "mapQuery" é o que vai
        // para o mapa e para o GPS (Google Maps, Waze, Apple)
        address: "Rua Carmo Gifoni, 351 • Lojas 03/04",
        city: "Martins · Uberlândia — MG",
        mapQuery: "R. Carmo Gifoni, 351 - Martins, Uberlândia - MG, 38400-358"
    },

    categories: [
        {
            slug: "acessorios",
            name: "Acessórios",
            brand: "GUCCI",
            tagline: "THE FINAL TOUCH",
            theme: { photo: "#a3865f", panel: "#f7f2ea", bg: "#16241c" },
            hero: {
                type: "image",
                photo: "images/categorias/fotos/acessorios.jpg",
                alt: "Boné GG Canvas Gucci com sacola e embalagem"
            }
        },
        {
            slug: "camisas",
            name: "Camisas",
            brand: "LOUIS VUITTON",
            tagline: "EFFORTLESS ELEGANCE",
            theme: { photo: "#6b4c38", panel: "#f3ede7", bg: "#2a1f17" },
            hero: {
                type: "image",
                photo: "images/categorias/fotos/camisas.jpg",
                focus: "45% center",
                alt: "Camisetas Louis Vuitton Monogram denim penduradas na loja"
            }
        },
        {
            slug: "polos",
            name: "Polos",
            brand: "CASABLANCA",
            tagline: "CLASSIC REDEFINED",
            theme: { photo: "#6d8db8", panel: "#eef0f2", bg: "#0f2a38" },
            hero: {
                type: "image",
                photo: "images/categorias/fotos/polos.jpg",
                alt: "Polo de tricô Casablanca branca e azul no cabide"
            }
        },
        {
            slug: "calcados",
            name: "Calçados",
            brand: "LOUIS VUITTON",
            tagline: "WALK IN LUXURY",
            theme: { photo: "#c48a2c", panel: "#f6f1ec", bg: "#0e1a2d" },
            hero: {
                type: "image",
                photo: "images/categorias/fotos/calcados.jpg",
                focus: "30% center",
                focusMobile: "45% center",
                alt: "Tênis LV Trainer denim com caixa e baús Louis Vuitton"
            }
        },
        {
            slug: "conjuntos",
            name: "Conjuntos",
            brand: "CASABLANCA",
            tagline: "MADE TO MATCH",
            theme: { photo: "#2d5cb3", panel: "#eef0f3", bg: "#2a1622" },
            hero: {
                type: "image",
                photo: "images/categorias/fotos/conjuntos.jpg",
                focus: "75% center",
                focusMobile: "68% center",
                alt: "Conjunto Casablanca Par Avion camisa e bermuda"
            }
        },
        {
            slug: "bermudas",
            name: "Bermudas",
            brand: "BURBERRY",
            tagline: "SUMMER STATEMENT",
            theme: { photo: "#24304d", panel: "#f0f1f1", bg: "#33270f" },
            hero: {
                type: "image",
                photo: "images/categorias/fotos/bermudas.jpg",
                focus: "100% center",
                focusMobile: "58% center",
                alt: "Bermudas Burberry xadrez creme e marinho sobre mármore"
            }
        },
        {
            slug: "calcas",
            name: "Calças",
            brand: "LOUIS VUITTON",
            tagline: "TAILORED PRESENCE",
            theme: { photo: "#d9822b", panel: "#eef0f3", bg: "#1b1c22" },
            hero: {
                type: "image",
                photo: "images/categorias/fotos/calcas.jpg",
                focus: "45% center",
                focusMobile: "52% center",
                alt: "Calça jeans Louis Vuitton Monogram clara pendurada na loja"
            }
        }
    ],

    products: [
        // ACESSÓRIOS — exemplo de item com duas cores
        {
            id: "gucci-bone-gg",
            category: "acessorios",
            brand: "Gucci",
            name: "Boné GG Canvas",
            price: null,
            isNew: true,
            image: "images/produtos/bone-gg-bege.webp",
            variants: [
                { id: "bege", name: "Bege", swatch: "#c9b08a", image: "images/produtos/bone-gg-bege.webp" },
                { id: "preto", name: "Preto", swatch: "#1d1d1f", image: "images/produtos/bone-gg-preto.webp" }
            ]
        },
        { id: "gucci-kit-bones", category: "acessorios", brand: "Gucci", name: "Kit Bonés GG + Óculos", image: "images/acessorios.png", price: null },

        // CAMISAS
        { id: "cb-forte-dei-marmi", category: "camisas", brand: "Casablanca", name: "Camisa de Seda Forte dei Marmi", image: "images/casa_blanca2.png", price: null, isNew: true },
        { id: "cb-trico", category: "camisas", brand: "Casablanca", name: "Camisa de Tricô Texturizada", image: "images/casa_blanca1.png", price: null },
        { id: "lv-monogram-bleach", category: "camisas", brand: "Louis Vuitton", name: "Camiseta Monogram Bleached", image: "images/LV1.png", price: null },
        { id: "lv-monogram-gradient", category: "camisas", brand: "Louis Vuitton", name: "Camiseta Monogram Gradient", image: "images/LV3.png", price: null },

        // POLOS
        { id: "cb-polo-jacquard", category: "polos", brand: "Casablanca", name: "Polo Jacquard Monogram", image: "images/casa_blanca3.png", price: null },
        { id: "lacoste-polo-monogram", category: "polos", brand: "Lacoste", name: "Polo Monogram Verde", image: "images/lacoste1.png", price: null, isNew: true },
        { id: "lacoste-polo-sport", category: "polos", brand: "Lacoste", name: "Polo Sport Color Block", image: "images/lacoste2.png", price: null },

        // CALÇADOS
        { id: "lv-trainer-verde", category: "calcados", brand: "Louis Vuitton", name: "LV Trainer Monogram Verde", image: "images/produtos/lv-trainer-verde.webp", price: null, isNew: true },

        // CONJUNTOS
        { id: "lacoste-jaqueta-zip", category: "conjuntos", brand: "Lacoste", name: "Jaqueta Esportiva Zip", image: "images/lacoste3.png", price: null },
        { id: "lv-varsity", category: "conjuntos", brand: "Louis Vuitton", name: "Jaqueta Varsity Patches", image: "images/LV2.png", price: null },

        // CALÇAS
        { id: "calca-jeans-destroyed", category: "calcas", brand: "City Denim", name: "Calça Jeans Skinny Destroyed", image: "images/produtos/calca-jeans-destroyed.webp", price: null, isNew: true }

        // BERMUDAS: ainda sem itens → a página mostra "em breve"
    ]
};
