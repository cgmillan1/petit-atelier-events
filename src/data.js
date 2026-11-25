/* ===== Config: paste your Supabase keys to go live. Empty = demo mode (data stays in this browser). ===== */
const CONFIG = {
  SUPABASE_URL: '',          // e.g. https://xxxx.supabase.co
  SUPABASE_ANON_KEY: '',     // public anon key
  INSTAGRAM: 'https://www.instagram.com/petitatelier_events/',
  BUSINESS_EMAIL: 'askpetitatelier@gmail.com',
  PHONE: '(801) 888-5391',
  CITY: 'Eagle Mountain, Utah',
};

/* Karol's real inventory (photos from her Services & Pricing Guide).
   cutout = background-removed photo used in the Design Studio; photo = catalog photo.
   ft = real height in feet, ar = width/height of the cutout. Prices are placeholders Karol edits in her dashboard. */
const SEED_VERSION = 8;
const SEED_ASSETS = [
  { id: 'window-arch', cat: 'backdrops', name: 'Gold window arch', es: 'Arco ventana dorado', price: 45, qty: 1, repl: 160, ft: 7.2, ar: 0.493, cutout: 'img/window_arch.webp', x: 500, y: 472, s: 1,
    desc: 'Gold metal window-pane arch, about 7 ft tall. Beautiful on its own or with a balloon garland.', desc_es: 'Arco dorado tipo ventana de unos 2.2 m. Hermoso solo o con guirnalda de globos.' },
  { id: 'half-arches', cat: 'backdrops', name: 'Gold open arch set (4)', es: 'Set de 4 arcos dorados abiertos', price: 85, qty: 1, repl: 280, ft: 7.2, ar: 0.767, cutout: 'img/set_arches.webp', x: 500, y: 472, s: 1,
    parts: [{ cutout: 'img/arch_a.webp', ft: 6.34, ar: 0.501, dx: -255, name: 'Arch 1' }, { cutout: 'img/arch_b.webp', ft: 7.21, ar: 0.491, dx: -85, name: 'Arch 2' }, { cutout: 'img/arch_c.webp', ft: 7.03, ar: 0.484, dx: 85, name: 'Arch 3' }, { cutout: 'img/arch_d.webp', ft: 3.18, ar: 0.856, dx: 255, name: 'Arch 4' }],
    desc: 'Four gold open arch frames in different heights, rented as a set. In the Design Studio you can place each arch on its own.', desc_es: 'Cuatro arcos dorados de diferentes alturas, se rentan como set. En el estudio puedes colocar cada arco por separado.' },
  { id: 'arch-frames', cat: 'backdrops', name: 'Gold rounded arch frames (4)', es: 'Set de 4 arcos dorados redondos', price: 85, qty: 1, repl: 280, ft: 7.2, ar: 0.75, photo: 'img/arch_set_styled.jpg', x: 500, y: 472, s: 1,
    desc: 'Four nesting rounded arch frames. Shown styled with florals (florals not included).', desc_es: 'Cuatro arcos redondos. Se muestran con flores (no incluidas).' },
  { id: 'balloons', cat: 'balloons', name: 'Organic balloon garland', es: 'Guirnalda orgánica de globos', price: 22, perFt: true, qty: 99, repl: 0, made: true, ft: 6.6, ar: 0.918, cutout: 'img/balloon_setup.webp', photo: 'img/balloon_photo.jpg', x: 500, y: 520, s: 1,
    desc: '$22 per foot, up to 3 colors. Built fresh for your date and ready for pickup. Photo shows one of Karol\u2019s garlands.', desc_es: '$22 por pie, hasta 3 colores. Hecha para tu fecha y lista para recoger. La foto muestra una guirnalda de Karol.' },
  { id: 'acrylic', cat: 'furniture', name: 'Clear acrylic cylinders with crystals (5)', es: 'Cilindros de acrílico con cristales (5)', price: 75, qty: 1, repl: 300, ft: 3.3, ar: 0.93, photo: 'img/acrylic.jpg', x: 500, y: 560, s: 1,
    desc: 'Five clear pedestals in different heights with hanging crystal strands. Perfect for cakes and desserts.', desc_es: 'Cinco pedestales transparentes con cristales colgantes. Perfectos para pastel y postres.' },
  { id: 'round-tables', cat: 'furniture', name: 'White round side tables (3)', es: 'Mesitas redondas blancas (3)', price: 40, qty: 1, repl: 120, ft: 2.1, ar: 1.066, cutout: 'img/set_tables.webp', x: 500, y: 590, s: 1,
    parts: [{ cutout: 'img/table.webp', ft: 2.2, ar: 0.666, dx: -110, name: 'Large table' }, { cutout: 'img/table.webp', ft: 1.9, ar: 0.666, dx: 0, dy: 8, name: 'Medium table' }, { cutout: 'img/table.webp', ft: 1.6, ar: 0.666, dx: 100, dy: 14, name: 'Small table' }],
    desc: 'Set of three nesting tables with natural wood legs, rented as a set. Place each table anywhere in the Design Studio.', desc_es: 'Tres mesitas con patas de madera natural, se rentan como set. Coloca cada una donde quieras en el estudio.' },
  { id: 'cane-console', cat: 'furniture', name: 'Cane console table', es: 'Consola de ratán', price: 35, qty: 1, repl: 220, ft: 2.6, ar: 1.175, cutout: 'img/cane_console.webp', x: 500, y: 565, s: 1,
    desc: 'Rounded wood console with a cane front. Great as a dessert or gift table.', desc_es: 'Consola de madera con frente de ratán. Ideal para postres o regalos.' },
  { id: 'cane-bench', cat: 'furniture', name: 'Cane and wood bench', es: 'Banca de madera y ratán', price: 25, qty: 1, repl: 150, ft: 1.6, ar: 1.026, cutout: 'img/cane_stool.webp', x: 760, y: 590, s: 1,
    desc: 'Rustic wood bench with a woven cane top.', desc_es: 'Banca rústica con asiento de ratán.' },
  { id: 'pink-nightstand', cat: 'furniture', name: 'Pink vintage nightstand', es: 'Buró vintage rosa', price: 25, qty: 1, repl: 150, ft: 2.0, ar: 1.201, cutout: 'img/pink_nightstand.webp', x: 760, y: 585, s: 1,
    desc: 'Two-drawer vintage piece in soft pink with black handles.', desc_es: 'Buró vintage rosa de dos cajones.' },
  { id: 'white-nightstand', cat: 'furniture', name: 'White vintage side table', es: 'Mesita vintage blanca', price: 25, qty: 1, repl: 150, ft: 2.4, ar: 0.784, cutout: 'img/white_nightstand.webp', x: 300, y: 585, s: 1,
    desc: 'Turned legs, one drawer and a lower shelf.', desc_es: 'Patas torneadas, un cajón y repisa inferior.' },
];

const SEED_SETTINGS = {
  depositPct: 30,            // % retainer to hold the date
  balloon: { classic: 16, organic: 22, full: 30, column: 18, cluster: 35, extraColor: 15, chrome: 3, greenery: 4, confetti: 2, statement: 12, foil: 25, frame: 40, minFt: 4, includedColors: 3, maxColors: 6, strandFactor: 0.85 }, // balloon builder prices
  carePlan: 100,             // flat protection plan
  carePlanCap: 500,          // accidental damage covered up to
  securityDeposit: 150,      // refundable, if they decline the plan
  installFee: 120,           // optional delivery + installation + teardown
  installArea: 'Utah County and southwest Salt Lake County',
  lateFee: 25,               // per day
  bufferDays: 1,             // a piece is held 1 day before and after an event
  minOrder: 100,
  pickupSlots: ['Day before the event, 4 to 7 pm', 'Event day, 8 to 10 am'],
  returnSlot: 'Day after the event, by 12 pm',
  pickupPlace: 'Eagle Mountain, UT (exact address sent after confirmation)',
  notifyEmail: CONFIG.BUSINESS_EMAIL,
  pin: '2468',               // demo-mode admin PIN only
  contractVersion: 'v1 2026-11',
};


/* "Start from a look": combinations of real pieces (x, y on the stage, optional size) */
const LOOKS = [
  { id: 'golden-window', name: 'Golden window', es: 'Ventana dorada', wall: '#ece6e3', place: [['window-arch', 500, 472], ['cane-console', 500, 568], ['round-tables', 215, 592], ['pink-nightstand', 790, 592]] },
  { id: 'garden-arches', name: 'Garden arches', es: 'Arcos de jardín', wall: '#e9ece4', place: [['half-arches', 500, 472], ['white-nightstand', 330, 594], ['cane-bench', 640, 600]] },
  { id: 'balloon-party', name: 'Balloon party', es: 'Fiesta de globos', wall: '#e8e4ee', place: [['balloons', 520, 575, 1.1], ['window-arch', 200, 472], ['white-nightstand', 840, 595]] },
];
/* Balloon garland inspirations. "karol" = Karol's own work; the others are reference photos for the style. */
const INSPIRATIONS = [
  { id: 'ocean-lilac', img: 'img/proj/mermaid.jpg', karol: true, name: 'Ocean & lilac garland', es: 'Guirnalda océano y lila', ft: 16, colors: ['Lilac', 'Dusty blue', 'Teal', 'Chrome gold'],
    note: 'Big organic garland around a gold hoop, with a dessert display.', note_es: 'Guirnalda orgánica grande sobre aro dorado, con mesa de postres.' },
  { id: 'sage-garden', img: 'img/proj/neverland.jpg', karol: true, name: 'Sage arch & clusters', es: 'Arco y racimos salvia', ft: 10, colors: ['Sage', 'Eucalyptus', 'Cream'],
    note: 'A small balloon arch over the center panel plus two clusters. Quick to build, big impact.', note_es: 'Un arco pequeño de globos sobre el panel central y dos racimos. Rápido de armar y con mucho impacto.' },
  { id: 'primary-blocks', img: 'img/proj/blocks.jpg', karol: true, name: 'Bold primary garland', es: 'Guirnalda de colores primarios', ft: 18, colors: ['Red', 'Yellow', 'Royal blue'],
    note: 'Color-blocked garland framing a fireplace, one color per section. (The original used 4 colors; ask Karol.)', note_es: 'Guirnalda por bloques de color enmarcando una chimenea. (La original usó 4 colores; pregúntale a Karol.)' },
  { id: 'sage-hoop', img: 'img/insp_sage_hoop.jpg', name: 'Sage hoop wrap', es: 'Aro envuelto en salvia', ft: 14, colors: ['Sage', 'Cream', 'Chrome gold'],
    note: 'Garland wrapped around a round arch with eucalyptus touches and gold plinths.', note_es: 'Guirnalda alrededor de un arco redondo con eucalipto y bases doradas.' },
  { id: 'blush-cascade', img: 'img/insp_blush_cascade.jpg', name: 'Blush cascade', es: 'Cascada rosa palo', ft: 12, colors: ['Blush', 'Cream', 'White'],
    note: 'Half-arch cascade down one side of a backdrop plus a floor cluster. Easy and elegant.', note_es: 'Cascada en medio arco por un lado del fondo, más un racimo en el piso. Fácil y elegante.' },
];
/* Karol's real projects, animated from sketch to finished setup (masks in img/proj) */
const PROJECTS = [
  { id: 'mermaid', video: '', at: [[0.545, 0.33], [0.11, 0.468], [0.315, 0.449], [0.428, 0.34], [0.631, 0.267], [0.648, 0.132], [0.693, 0.441], [0.668, 0.744], [0.577, 0.56], [0.342, 0.834]], name: "Under the sea", es: "Bajo el mar", w: 948, h: 1156, insp: 'ocean-lilac', req: "Mermaid party like Karol's under the sea setup", req_es: "Fiesta de sirena como el montaje bajo el mar de Karol", steps: [["Gold hoop", "Aro dorado"], ["Garland base: dusty blue", "Base de la guirnalda: azul empolvado"], ["Lilac and chrome gold", "Lila y dorado cromado"], ["The statement balloons", "Los globos protagonistas"], ["Climbing up the hoop", "Subiendo por el aro"], ["Teal crown on top", "Corona verde azulado arriba"], ["Right side clusters", "Racimos del lado derecho"], ["Acrylic pedestals", "Pedestales de acrílico"], ["Cake and desserts", "Pastel y postres"], ["Coral, seaweed and treasure", "Coral, algas y tesoro"]] },
  { id: 'neverland', video: '', at: [[0.555, 0.317], [0.488, 0.087], [0.36, 0.184], [0.465, 0.15], [0.442, 0.813], [0.68, 0.324], [0.547, 0.601]], name: "Fairy garden & pirates", es: "Jard\u00edn de hadas y piratas", w: 1184, h: 887, insp: 'sage-garden', req: "Fairy garden and pirates party like Karol's setup", req_es: "Fiesta jardín de hadas y piratas como la de Karol", steps: [["Sage backdrop panels", "Paneles verde salvia"], ["Balloon arch on the center panel", "Arco de globos en el panel central"], ["Balloon clusters", "Racimos de globos"], ["Neon sign", "Letrero neón"], ["Barrel and acrylic pedestals", "Barril y pedestales de acrílico"], ["Greenery, pampas and florals", "Follaje, pampas y flores"], ["Cake, treats and finishing touches", "Pastel, dulces y detalles"]] },
  { id: 'blocks', video: '', at: [[0.128, 0.323], [0.141, 0.09], [0.494, 0.063], [0.872, 0.087], [0.924, 0.363], [0.597, 0.195], [0.48, 0.764], [0.51, 0.57], [0.505, 0.91]], name: "Building blocks birthday", es: "Cumplea\u00f1os de bloques", w: 949, h: 1176, insp: 'primary-blocks', req: "Building blocks birthday with bold primary colors like Karol's setup", req_es: "Cumpleaños de bloques con colores primarios como el de Karol", steps: [["Yellow base, left", "Base amarilla, izquierda"], ["Red", "Rojo"], ["Green across the top", "Verde arriba"], ["Blue", "Azul"], ["Yellow base, right", "Base amarilla, derecha"], ["Neon \"Happy Birthday\"", "Neón \"Happy Birthday\""], ["Acrylic pedestals", "Pedestales de acrílico"], ["Cake and treats", "Pastel y dulces"], ["Giant building blocks", "Bloques gigantes"]] },
];
/* Quick theme ideas for the balloon designer (works without AI too). Characters: colors only, no licensed prints. */
const THEMES = [
  /* Kids characters and games: we match their signature colors only (nothing printed). Names are used only to describe the colors. */
  { k: ['mario', 'mario bro', 'mario bros', 'mario brothers', 'super mario', 'luigi', 'mario kart', 'nintendo'], name: 'Mario Bros colors', es: 'Colores de Mario Bros', colors: ['Red', 'Royal blue', 'Yellow', 'Green', 'White'], chrome: true, character: true, tip: 'Red and blue like Mario, green like Luigi and the pipes, yellow like the question blocks, plus gold chrome "coins".', tip_es: 'Rojo y azul como Mario, verde como Luigi y los tubos, amarillo como los bloques de pregunta y "monedas" doradas cromadas.' },
  { k: ['sonic', 'hedgehog'], name: 'Sonic colors', es: 'Colores de Sonic', colors: ['Royal blue', 'Red', 'Yellow', 'White'], chrome: true, character: true, tip: 'Gold chrome balloons look like the rings.', tip_es: 'Globos dorados cromados como los anillos.' },
  { k: ['pokemon', 'pokémon', 'pikachu', 'pokeball'], name: 'Pokémon colors', es: 'Colores de Pokémon', colors: ['Yellow', 'Red', 'White', 'Black', 'Royal blue'], character: true, tip: 'Red and white clusters look like a ball.', tip_es: 'Racimos rojo y blanco parecen la bola.' },
  { k: ['minecraft', 'creeper'], name: 'Minecraft colors', es: 'Colores de Minecraft', colors: ['Green', 'Lime', 'Brown', 'Black'], character: true, tip: 'Square foil balloons make it feel pixelated.', tip_es: 'Globos de foil cuadrados le dan efecto pixel.' },
  { k: ['paw patrol', 'chase', 'skye', 'patrulla canina'], name: 'Paw Patrol colors', es: 'Colores de Paw Patrol', colors: ['Red', 'Royal blue', 'Yellow', 'White'], character: true, tip: 'A paw-print foil balloon on top.', tip_es: 'Un globo de foil de huellita arriba.' },
  { k: ['bluey', 'bingo'], name: 'Bluey colors', es: 'Colores de Bluey', colors: ['Baby blue', 'Royal blue', 'Peach', 'Cream'], character: true, tip: 'Soft blues and peach, playful and light.', tip_es: 'Azules suaves y durazno.' },
  { k: ['spiderman', 'spider-man', 'spider man', 'spidey', 'spider'], name: 'Spider-Man colors', es: 'Colores de Spider-Man', colors: ['Red', 'Royal blue', 'Black', 'White'], character: true, tip: 'Black confetti-look balloons as webs.', tip_es: 'Globos negros como telarañas.' },
  { k: ['superhero', 'super hero', 'superheroe', 'heroe', 'marvel', 'avengers', 'batman', 'superman'], name: 'Superhero colors', es: 'Colores de superhéroe', colors: ['Red', 'Royal blue', 'Yellow', 'Black'], character: true, tip: 'Star foils for a comic feel.', tip_es: 'Estrellas de foil.' },
  { k: ['mickey', 'mickey mouse'], name: 'Mickey colors', es: 'Colores de Mickey', colors: ['Red', 'Black', 'Yellow', 'White'], character: true, tip: 'Three-balloon "ears" clusters are easy and fun.', tip_es: 'Racimos de tres globos tipo orejitas.' },
  { k: ['minnie', 'minnie mouse'], name: 'Minnie colors', es: 'Colores de Minnie', colors: ['Hot pink', 'Pastel pink', 'White', 'Black'], character: true, tip: 'Polka-dot look with white and pink.', tip_es: 'Estilo lunares con blanco y rosa.' },
  { k: ['frozen', 'elsa', 'anna', 'olaf'], name: 'Frozen colors', es: 'Colores de Frozen', colors: ['Baby blue', 'White', 'Lilac', 'Chrome silver'], character: true, tip: 'Clear and silver balloons look like ice.', tip_es: 'Globos transparentes y plateados parecen hielo.' },
  { k: ['encanto', 'mirabel'], name: 'Encanto colors', es: 'Colores de Encanto', colors: ['Purple', 'Lilac', 'Yellow', 'Hot pink'], character: true, tip: 'Add butterflies.', tip_es: 'Agrega mariposas.' },
  { k: ['moana'], name: 'Moana colors', es: 'Colores de Moana', colors: ['Teal', 'Peach', 'Lime', 'Cream'], character: true, tip: 'Palm leaves tucked in.', tip_es: 'Hojas de palma.' },
  { k: ['stitch', 'lilo'], name: 'Stitch colors', es: 'Colores de Stitch', colors: ['Royal blue', 'Baby blue', 'Pastel pink', 'Purple'], character: true, tip: 'Tropical leaves look great.', tip_es: 'Hojas tropicales.' },
  { k: ['toy story', 'woody', 'buzz'], name: 'Toy Story colors', es: 'Colores de Toy Story', colors: ['Red', 'Yellow', 'Royal blue', 'Green'], character: true, tip: 'Cloud-white clusters on top.', tip_es: 'Racimos blancos como nubes.' },
  { k: ['cars', 'lightning mcqueen', 'mcqueen'], name: 'Cars colors', es: 'Colores de Cars', colors: ['Red', 'Yellow', 'Black', 'White'], character: true, tip: 'Black and white checkered clusters.', tip_es: 'Racimos a cuadros blanco y negro.' },
  { k: ['cocomelon', 'jj'], name: 'Cocomelon colors', es: 'Colores de Cocomelon', colors: ['Lime', 'Green', 'Yellow', 'Red', 'White'], character: true, tip: 'Bright and simple.', tip_es: 'Brillante y sencillo.' },
  { k: ['peppa', 'peppa pig'], name: 'Peppa Pig colors', es: 'Colores de Peppa Pig', colors: ['Pastel pink', 'Hot pink', 'Red', 'Baby blue'], character: true, tip: 'Green "grass" clusters at the base.', tip_es: 'Racimos verdes como pasto abajo.' },
  { k: ['baby shark', 'shark', 'tiburon'], name: 'Baby Shark colors', es: 'Colores de Baby Shark', colors: ['Yellow', 'Baby blue', 'Pastel pink', 'Royal blue'], character: true, tip: 'Clear balloons for bubbles.', tip_es: 'Globos transparentes como burbujas.' },
  { k: ['gabby', 'gabbys dollhouse', 'gabby dollhouse'], name: "Gabby's Dollhouse colors", es: 'Colores de Gabby', colors: ['Pastel pink', 'Hot pink', 'Purple', 'Lilac'], character: true, tip: 'Add a few cat-ear clusters.', tip_es: 'Racimos tipo orejitas de gato.' },
  { k: ['trolls', 'poppy'], name: 'Trolls colors', es: 'Colores de Trolls', colors: ['Hot pink', 'Teal', 'Purple', 'Lime'], character: true, tip: 'Confetti balloons add sparkle.', tip_es: 'Globos con confeti.' },
  { k: ['hello kitty', 'kitty'], name: 'Hello Kitty colors', es: 'Colores de Hello Kitty', colors: ['Pastel pink', 'Red', 'White'], character: true, tip: 'A red bow on top.', tip_es: 'Un moño rojo arriba.' },
  { k: ['barbie'], name: 'Barbie colors', es: 'Colores de Barbie', colors: ['Hot pink', 'Pastel pink', 'White', 'Chrome silver'], character: true, tip: 'Chrome silver accents make the pinks pop.', tip_es: 'Detalles plateados cromados.' },
  { k: ['lego', 'legos', 'building blocks', 'bloques', 'blocks'], name: 'Building blocks', es: 'Bloques', colors: ['Red', 'Yellow', 'Royal blue', 'Green'], tip: 'One color per section, like Karol’s building blocks party.', tip_es: 'Un color por sección, como la fiesta de bloques de Karol.' },
  { k: ['sesame street', 'elmo'], name: 'Sesame Street colors', es: 'Colores de Plaza Sésamo', colors: ['Red', 'Yellow', 'Royal blue', 'Green', 'Orange'], character: true, tip: 'Bright primary mix.', tip_es: 'Mezcla de colores primarios.' },
  { k: ['mermaid', 'sirena', 'ocean', 'under the sea', 'bajo el mar', 'sea'], name: 'Mermaid', es: 'Sirena', colors: ['Teal', 'Lilac', 'Baby blue', 'Chrome gold'], tip: 'Add a few clear balloons for bubbles and shells on the table.', tip_es: 'Agrega globos transparentes como burbujas y conchas en la mesa.' },
  { k: ['dinosaur', 'dino', 'dinosaurio', 'jurassic'], name: 'Dinosaur', es: 'Dinosaurios', colors: ['Green', 'Sage', 'Orange', 'Brown'], tip: 'Tuck in palm leaves.', tip_es: 'Agrega hojas de palma.' },
  { k: ['construction', 'construcción', 'construccion', 'truck', 'camión', 'camion'], name: 'Construction', es: 'Construcción', colors: ['Yellow', 'Black', 'Orange'], tip: 'Cone-orange accents.', tip_es: 'Detalles naranja tipo cono.' },
  { k: ['space', 'espacio', 'astronaut', 'astronauta', 'galaxy', 'planet', 'cohete', 'rocket'], name: 'Outer space', es: 'Espacio', colors: ['Navy', 'Black', 'Chrome silver', 'Purple'], tip: 'Add star foils.', tip_es: 'Agrega estrellas de foil.' },
  { k: ['football', 'soccer', 'fútbol', 'futbol', 'baseball', 'béisbol', 'basketball', 'sports', 'deportes'], name: 'Sports', es: 'Deportes', colors: ['Green', 'White', 'Black'], tip: 'Swap in your team colors.', tip_es: 'Cámbialo por los colores de tu equipo.' },
  { k: ['safari', 'jungle', 'jungla', 'wild one', 'animal', 'animales'], name: 'Safari', es: 'Safari', colors: ['Sage', 'Cream', 'Brown', 'Chrome gold'], tip: 'Eucalyptus or palm leaves tucked in the garland.', tip_es: 'Hojas de eucalipto o palma dentro de la guirnalda.' },
  { k: ['boho', 'neutral', 'rustic', 'rústico', 'rustico'], name: 'Boho', es: 'Boho', colors: ['Cream', 'Peach', 'Terracotta'], tip: 'Pampas next to the arch.', tip_es: 'Pampas junto al arco.' },
  { k: ['princess', 'princesa', 'royal', 'castle', 'castillo'], name: 'Princess', es: 'Princesa', colors: ['Blush', 'Lilac', 'Chrome gold'], tip: 'A crown on the cake table.', tip_es: 'Una corona en la mesa del pastel.' },
  { k: ['fairy', 'hada', 'hadas', 'garden', 'jardín', 'jardin', 'butterfly', 'mariposa', 'mariposas'], name: 'Fairy garden', es: 'Jardín de hadas', colors: ['Sage', 'Blush', 'Lilac', 'Cream'], tip: 'Greenery and a few butterflies.', tip_es: 'Follaje y unas mariposas.' },
  { k: ['unicorn', 'unicornio', 'rainbow', 'arcoíris', 'arcoiris'], name: 'Unicorn', es: 'Unicornio', colors: ['Pastel pink', 'Lilac', 'Baby blue', 'Chrome gold'], tip: 'Gold accents make pastels pop.', tip_es: 'Detalles dorados hacen resaltar los pasteles.' },
  { k: ['baby boy', 'niño', 'its a boy', "it's a boy"], name: 'Baby boy', es: 'Baby shower niño', colors: ['Baby blue', 'White', 'Chrome silver'], tip: '', tip_es: '' },
  { k: ['baby girl', 'niña', 'its a girl', "it's a girl"], name: 'Baby girl', es: 'Baby shower niña', colors: ['Blush', 'White', 'Chrome gold'], tip: '', tip_es: '' },
  { k: ['gender reveal', 'revelación', 'revelacion'], name: 'Gender reveal', es: 'Revelación de género', colors: ['Baby blue', 'Pastel pink', 'White'], tip: '', tip_es: '' },
  { k: ['graduation', 'graduación', 'graduacion', 'grad'], name: 'Graduation', es: 'Graduación', colors: ['Black', 'White', 'Chrome gold'], tip: 'Swap in your school colors.', tip_es: 'Cámbialo por los colores de tu escuela.' },
  { k: ['wedding', 'boda', 'bridal', 'novia', 'engagement', 'compromiso'], name: 'Wedding', es: 'Boda', colors: ['White', 'Cream', 'Chrome gold'], tip: 'Greenery makes it feel elegant.', tip_es: 'El follaje lo hace elegante.' },
  { k: ['quinceañera', 'quinceanera', 'quince', 'xv'], name: 'Quinceañera', es: 'Quinceañera', colors: ['Blush', 'Rose gold', 'White', 'Chrome gold'], tip: 'A big number 15 foil.', tip_es: 'Un número 15 de foil grande.' },
  { k: ['fiesta', 'mexican', 'mexicana', 'cinco de mayo', 'taco'], name: 'Fiesta', es: 'Fiesta mexicana', colors: ['Hot pink', 'Orange', 'Yellow', 'Teal'], tip: 'Papel picado next to the arch.', tip_es: 'Papel picado junto al arco.' },
  { k: ['cowboy', 'western', 'vaquero', 'rodeo'], name: 'Western', es: 'Vaquero', colors: ['Brown', 'Cream', 'Terracotta'], tip: 'Hay bale and a cowboy hat on the table.', tip_es: 'Paca de paja y sombrero vaquero.' },
  { k: ['halloween', 'spooky'], name: 'Halloween', es: 'Halloween', colors: ['Black', 'Orange', 'Purple'], tip: '', tip_es: '' },
  { k: ['christmas', 'navidad', 'holiday'], name: 'Christmas', es: 'Navidad', colors: ['Red', 'Eucalyptus', 'Chrome gold'], tip: '', tip_es: '' },
  { k: ['valentine', 'san valentín', 'san valentin', 'love'], name: 'Valentine', es: 'San Valentín', colors: ['Red', 'Hot pink', 'Blush'], tip: 'Heart foils.', tip_es: 'Corazones de foil.' },
  { k: ['4th of july', 'fourth of july', 'independence', 'usa', 'america'], name: 'Fourth of July', es: '4 de julio', colors: ['Red', 'White', 'Navy'], tip: 'Star foils.', tip_es: 'Estrellas de foil.' },
];
const PACKAGES = [];

/* ===== i18n (customer side) ===== */
const I18N = {
  en: {
    h_how: 'From idea to installed, without the back-and-forth', h_coll: 'The collection', h_pk: 'Packages', h_care: 'Accidents happen. Choose how you\u2019re covered.', h_work: 'Recent setups',
    nav_collection: 'Collection', nav_studio: 'Design studio', nav_packages: 'Packages', nav_how: 'How it works', nav_res: 'My reservation',
    hero_title: 'See your party before you book it.', hero_sub: 'Balloon garlands, backdrops and styled props for rent in Eagle Mountain, Utah. Design your setup with the real pieces, watch the price update live, reserve your date, and pick it up ready to go.',
    cta_design: 'Design my party', cta_browse: 'Browse the collection', avail_for: 'Availability for', pick_date: 'Pick your event date',
    add: 'Add', added: 'Added', remove: 'Remove', available: 'available', booked: 'Booked that date', only_left: 'left',
    studio_title: 'Design studio', studio_sub: 'Every piece here is a real photo of Karol\u2019s inventory. Tap a piece to place it, drag it where you want it, or try it on a photo of your own space. Your total updates as you go.',
    your_setup: 'Your setup', empty_setup: 'Nothing here yet. Start from a look or tap any piece.', subtotal: 'Rental subtotal', colors: 'Balloon colors', length: 'Garland length (feet)', perft: 'per foot', photo_only: 'Photo only for now', real_photo: 'Real photo', about: 'Meet Karol', pickup: 'Pick up & return', install: 'Installation', get_it: 'How you get it', free: 'Free', space: 'Use a photo of my space', space_off: 'Back to the studio wall', room_scale: 'Piece size in your photo', protection: 'Protection',
    est_total: 'Estimated total', deposit_today: 'Retainer to hold your date', reserve: 'Reserve this setup', start_look: 'Start from a look', palette: 'Balloon palette', wall: 'Wall', clear: 'Clear all',
    made_fresh: 'Made fresh for your date', min_order: 'Minimum order', step_event: 'Your event', step_review: 'Protection', step_sign: 'Sign', step_done: 'Done',
    name: 'Full name', email: 'Email', phone: 'Phone', event_type: 'Event type', address: 'Event address (for installation)', slot: 'Pickup time', guests: 'Guests', start: 'Start time', setting: 'Setting', indoor: 'Indoor', outdoor: 'Outdoor', covered: 'Covered patio', notes: 'Notes for Karol (theme, colors, cake size)',
    next: 'Continue', back: 'Back', sign_submit: 'Sign and send request', confirm_title: 'Request received', lookup: 'Find my reservation', code: 'Reservation code',
  },
  es: {
    h_how: 'De la idea al montaje, sin tanto ir y venir', h_coll: 'La colección', h_pk: 'Paquetes', h_care: 'Los accidentes pasan. Elige tu protección.', h_work: 'Montajes recientes',
    nav_collection: 'Colección', nav_studio: 'Estudio de diseño', nav_packages: 'Paquetes', nav_how: 'Cómo funciona', nav_res: 'Mi reservación',
    hero_title: 'Ve tu fiesta antes de reservarla.', hero_sub: 'Guirnaldas de globos, fondos y props decorativos en renta en Eagle Mountain, Utah. Diseña tu montaje con las piezas reales, mira el precio en vivo, reserva tu fecha y recógelo listo.',
    cta_design: 'Diseñar mi fiesta', cta_browse: 'Ver la colección', avail_for: 'Disponibilidad para', pick_date: 'Elige la fecha del evento',
    add: 'Agregar', added: 'Agregado', remove: 'Quitar', available: 'disponibles', booked: 'Reservado esa fecha', only_left: 'quedan',
    studio_title: 'Estudio de diseño', studio_sub: 'Cada pieza es una foto real del inventario de Karol. Toca una pieza para colocarla, arrástrala o pruébala en una foto de tu propio espacio. Tu total se actualiza al instante.',
    your_setup: 'Tu montaje', empty_setup: 'Aún no hay nada. Empieza con un look o toca una pieza.', subtotal: 'Subtotal de renta', colors: 'Colores de globos', length: 'Largo de la guirnalda (pies)', perft: 'por pie', photo_only: 'Por ahora solo foto', real_photo: 'Foto real', about: 'Conoce a Karol', pickup: 'Recoger y devolver', install: 'Instalación', get_it: 'Cómo lo recibes', free: 'Gratis', space: 'Usar una foto de mi espacio', space_off: 'Volver a la pared del estudio', room_scale: 'Tamaño de las piezas en tu foto', protection: 'Protección',
    est_total: 'Total estimado', deposit_today: 'Anticipo para apartar tu fecha', reserve: 'Reservar este montaje', start_look: 'Empieza con un look', palette: 'Paleta de globos', wall: 'Pared', clear: 'Borrar todo',
    made_fresh: 'Hecho a mano para tu fecha', min_order: 'Pedido mínimo', step_event: 'Tu evento', step_review: 'Protección', step_sign: 'Firma', step_done: 'Listo',
    name: 'Nombre completo', email: 'Correo', phone: 'Teléfono', event_type: 'Tipo de evento', address: 'Dirección del evento (para instalación)', slot: 'Hora para recoger', guests: 'Invitados', start: 'Hora de inicio', setting: 'Lugar', indoor: 'Interior', outdoor: 'Exterior', covered: 'Patio cubierto', notes: 'Notas para Karol (tema, colores, tamaño del pastel)',
    next: 'Continuar', back: 'Atrás', sign_submit: 'Firmar y enviar solicitud', confirm_title: 'Solicitud recibida', lookup: 'Buscar mi reservación', code: 'Código de reservación',
  },
};

/* ===== Storage layer: localStorage demo, or Supabase when CONFIG is filled ===== */
const LIVE = !!(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY);
let sb = null;
const LS = {
  get(k, d) { try { const v = localStorage.getItem('pa3_' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('pa3_' + k, JSON.stringify(v)); return true; } catch { return false; } },
};
const MEM = {}; // fallback when storage is blocked
function lget(k, d) { const v = LS.get(k, undefined); return v !== undefined ? v : (k in MEM ? MEM[k] : d); }
function lset(k, v) { MEM[k] = v; LS.set(k, v); }

const DB = {
  async init() {
    if (LIVE) {
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm');
      sb = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    } else {
      const seed = SEED_ASSETS.map(a => ({ ...a, active: true, photo: a.photo || '' }));
      if (!lget('assets')) lset('assets', seed);
      else if (lget('seedv') !== SEED_VERSION) {
        /* demo data cached by an older version of the site: refresh Karol's pieces (images, sets), keep anything added in the admin */
        const old = lget('assets', []), ids = new Set(seed.map(a => a.id));
        lset('assets', [...seed.map(a => { const o = old.find(x => x.id === a.id); return o ? { ...a, price: o.price, qty: o.qty, active: o.active } : a; }), ...old.filter(a => !ids.has(a.id))]);
        const d = lget('draft'); if (d) { d.placements = []; lset('draft', d); }
      }
      lset('seedv', SEED_VERSION);
      if (!lget('settings')) lset('settings', SEED_SETTINGS);
      if (!lget('bookings')) lset('bookings', demoBookings());
    }
  },
  async assets() {
    if (LIVE) { const { data, error } = await sb.from('assets').select('*').order('sort'); if (error) throw error; return data.map(fromRow); }
    return lget('assets', []);
  },
  async saveAsset(a) {
    if (LIVE) { const { error } = await sb.from('assets').upsert(toRow(a)); if (error) throw error; return; }
    const all = lget('assets', []); const i = all.findIndex(x => x.id === a.id); if (i >= 0) all[i] = a; else all.push(a); lset('assets', all);
  },
  async deleteAsset(id) {
    if (LIVE) { const { error } = await sb.from('assets').delete().eq('id', id); if (error) throw error; return; }
    lset('assets', lget('assets', []).filter(a => a.id !== id));
  },
  async settings() {
    if (LIVE) { const { data } = await sb.from('settings').select('data').eq('id', 1).maybeSingle(); return { ...SEED_SETTINGS, ...(data?.data || {}) }; }
    return { ...SEED_SETTINGS, ...lget('settings', {}) };
  },
  async saveSettings(s) {
    if (LIVE) { const { error } = await sb.from('settings').upsert({ id: 1, data: s }); if (error) throw error; return; }
    lset('settings', s);
  },
  /* reserved quantity per asset for bookings overlapping date +/- buffer */
  async reserved(date, buffer) {
    if (!date) return {};
    if (LIVE) { const { data, error } = await sb.rpc('reserved_on', { d: date, buf: buffer }); if (error) throw error; const m = {}; (data || []).forEach(r => m[r.asset_id] = r.qty); return m; }
    const m = {}; const t = dnum(date);
    for (const b of lget('bookings', [])) {
      if (['declined', 'cancelled'].includes(b.status)) continue;
      if (Math.abs(dnum(b.event.date) - t) > buffer) continue;
      for (const it of b.items) m[it.id] = (m[it.id] || 0) + it.qty;
    }
    return m;
  },
  async createBooking(b) {
    if (LIVE) { const { data, error } = await sb.rpc('create_booking', { payload: b }); if (error) throw error; return data; }
    const all = lget('bookings', []); all.unshift(b); lset('bookings', all); return b.code;
  },
  async lookup(code, email) {
    if (LIVE) { const { data, error } = await sb.rpc('lookup_booking', { c: code, e: email }); if (error) throw error; return data; }
    return lget('bookings', []).find(b => b.code.toUpperCase() === code.trim().toUpperCase() && b.customer.email.toLowerCase() === email.trim().toLowerCase()) || null;
  },
  async bookings() {
    if (LIVE) { const { data, error } = await sb.from('bookings').select('data').order('created_at', { ascending: false }); if (error) throw error; return data.map(r => r.data); }
    return lget('bookings', []);
  },
  async updateBooking(b) {
    if (LIVE) { const { error } = await sb.from('bookings').update({ data: b, status: b.status, event_date: b.event.date }).eq('code', b.code); if (error) throw error; return; }
    const all = lget('bookings', []); const i = all.findIndex(x => x.code === b.code); if (i >= 0) all[i] = b; lset('bookings', all);
  },
  async uploadPhoto(file) {
    if (LIVE) { const path = `assets/${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '_')}`; const { error } = await sb.storage.from('photos').upload(path, file, { upsert: true }); if (error) throw error; return sb.storage.from('photos').getPublicUrl(path).data.publicUrl; }
    return await shrink(file, 700);
  },
  /* transparent PNG of a real piece for the Studio */
  async uploadCutout(blob) {
    if (LIVE) { const path = `cutouts/${Date.now()}.png`; const { error } = await sb.storage.from('photos').upload(path, blob, { upsert: true, contentType: 'image/png' }); if (error) throw error; return sb.storage.from('photos').getPublicUrl(path).data.publicUrl; }
    return await new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsDataURL(blob); });
  },
  /* email: Supabase edge function in live mode; demo returns a mailto link to open */
  async email(to, subject, text, kind, code) {
    if (LIVE) {
      if (kind === 'request_received') return { sent: true }; // sent together with new_request by the server
      const body = kind === 'new_request' ? { kind: 'new_booking', code } : { kind, code, subject, text };
      const { error } = await sb.functions.invoke('send-email', { body }); if (error) throw error; return { sent: true };
    }
    return { sent: false, mailto: `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}` };
  },
  auth: {
    async session() { if (LIVE) { const { data } = await sb.auth.getSession(); return !!data.session; } try { return sessionStorage.getItem('pa_admin') === '1'; } catch { return MEM.admin === 1; } },
    async signIn(email, pw) {
      if (LIVE) { const { error } = await sb.auth.signInWithPassword({ email, password: pw }); if (error) throw error; return true; }
      const s = await DB.settings(); if (pw !== s.pin) throw new Error('Wrong PIN'); try { sessionStorage.setItem('pa_admin', '1'); } catch { MEM.admin = 1; } return true;
    },
    async signOut() { if (LIVE) await sb.auth.signOut(); try { sessionStorage.removeItem('pa_admin'); } catch { MEM.admin = 0; } },
  },
};
function fromRow(r) { return { ...r.data, id: r.id, active: r.active, photo: r.photo || '' }; }
function toRow(a) { const { id, active, photo, ...rest } = a; return { id, active, photo, data: rest, sort: ['backdrops', 'balloons', 'signs', 'furniture', 'table', 'props'].indexOf(a.cat) }; }

function dnum(s) { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d) / 864e5; }
function todayISO(offset = 0) { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10); }
function newCode() { const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = 'PA-'; for (let i = 0; i < 5; i++) s += c[Math.floor(Math.random() * c.length)]; return s; }
async function shrink(file, max) {
  const url = URL.createObjectURL(file); const img = new Image(); img.src = url; await img.decode();
  const k = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); return c.toDataURL('image/jpeg', .82);
}

/* Sample requests so the admin panel has something to show in demo mode */
function demoBookings() {
  const A0 = id => SEED_ASSETS.find(a => a.id === id);
  const mk = (code, days, status, name, email, type, lookId, extra = {}) => {
    const look = LOOKS.find(l => l.id === lookId);
    const items = []; look.place.forEach(([id]) => { const a = A0(id), ft = a.perFt ? 10 : undefined, price = a.perFt ? a.price * 10 : a.price; const ex = items.find(i => i.id === id && !a.perFt); if (ex) ex.qty++; else items.push({ id, qty: 1, ft, price, name: a.name + (ft ? ` (${ft} ft)` : '') }); });
    const sub = items.reduce((s, i) => s + i.price * i.qty, 0);
    const install = days === 16 ? 120 : 0, care = 100; const total = sub + install + care;
    return { code, sample: true, created_at: new Date(Date.now() - (5 + days * 2) * 36e5).toISOString(), status,
      customer: { name, email, phone: '(801) 555-01' + String(10 + days).slice(-2) }, lang: 'en',
      event: { date: todayISO(days), start: '15:00', type, fulfillment: install ? 'install' : 'pickup', pickupSlot: SEED_SETTINGS.pickupSlots[0], returnSlot: SEED_SETTINGS.returnSlot, address: install ? '123 Sample St, Eagle Mountain, UT' : '', guests: 30, setting: 'indoor', notes: 'Sample request for the demo.' },
      items, balloonColors: items.some(i => i.ft) ? ['Lilac', 'Dusty blue', 'Chrome gold'] : [],
      design: { wall: look.wall, placements: look.place.map(([id, x, y, s]) => ({ id, x, y, s: s || 1, len: A0(id).perFt ? 10 : undefined })) }, protection: 'care',
      totals: { subtotal: sub, install, care, securityDeposit: 0, total, retainer: Math.round(total * .3) },
      contract: { name, signed_at: new Date().toISOString(), version: SEED_SETTINGS.contractVersion, signature: '' },
      prep: {}, payments: { retainer: status !== 'new', balance: false, depositReturned: false }, reminders: [], ...extra };
  };
  return [
    mk('PA-DEMO1', 3, 'confirmed', 'Sample: Ana Ruiz', 'ana@example.com', 'Birthday', 'golden-window', { prep: { 'window-arch': true } }),
    mk('PA-DEMO2', 9, 'new', 'Sample: Jessica Hale', 'jess@example.com', 'Baby shower', 'balloon-party'),
    mk('PA-DEMO3', 16, 'new', 'Sample: Mariela Soto', 'mariela@example.com', 'Bridal shower', 'garden-arches'),
  ];
}

/* Background removal runs in the browser (free, the photo never leaves the device). Falls back to the photo as is. */
async function removeBg(file) {
  const mod = await import('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm');
  return await mod.removeBackground(file, { output: { format: 'image/png' } });
}
/* Crop to the visible piece and keep its width/height ratio, so it stands on the floor at real size */
async function trimAlpha(blob, max) {
  const url = URL.createObjectURL(blob); const img = new Image(); img.src = url; await img.decode();
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height).data; let t = c.height, l = c.width, r = 0, b = 0;
  for (let y = 0; y < c.height; y += 2) for (let xx = 0; xx < c.width; xx += 2) { if (d[(y * c.width + xx) * 4 + 3] > 16) { if (y < t) t = y; if (y > b) b = y; if (xx < l) l = xx; if (xx > r) r = xx; } }
  URL.revokeObjectURL(url); if (r <= l || b <= t) { t = 0; l = 0; r = c.width - 1; b = c.height - 1; }
  const w = r - l + 1, h = b - t + 1, k = Math.min(1, max / Math.max(w, h));
  const o = document.createElement('canvas'); o.width = Math.round(w * k); o.height = Math.round(h * k); o.getContext('2d').drawImage(c, l, t, w, h, 0, 0, o.width, o.height);
  return { blob: await new Promise(res => o.toBlob(res, 'image/png')), ar: w / h };
}
