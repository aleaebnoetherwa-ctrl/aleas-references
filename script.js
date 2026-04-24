/* =========================
   1. IMAGE DATA
========================= */

const items = [
  {
  image: "images/Enzmann-Fischer-Partner_Zollhaus-Zuerich_bar.jpeg",
  title: "Enzmann Fischer Partner  —  Zollhaus Zürich",
  tags: ["switzerland", "in-noisy-places", "zurich", "enzmann-fischer-partner", "bar"]
},
  {
  image: "images/Enzmann-Fischer-Partner_Zollhaus-Zuerich_hallenwohnen.jpeg",
  title: "Enzmann Fischer Partner  —  Zollhaus Zürich, Hallenwohnen",
  tags: ["switzerland", "enzmann-fischer-partner", "alternative-living", "hall"]
},
{
  image: "images/Enzmann-Fischer-Partner_Zollhaus-Zuerich_halle.jpeg",
  title: "Enzmann Fischer Partner  —  Zollhaus Zürich",
  tags: ["switzerland", "zurich", "enzmann-fischer-partner", "hall", "mixed-use", "stair", "gallery"]
},
{
  image: "images/Enzmann-Fischer-Partner_Zollhaus-Zuerich.jpg",
  title: "Enzmann Fischer Partner  —  Zollhaus Zürich",
  tags: ["switzerland", "in-noisy-places", "housing", "social-housing", "facade", "enzmann-fischer-partner", "zurich", "mixed-use"]
},
{
  image: "images/Buchner-Bruendler_Wohnsiedlung-Roetiboden-Waedenswil_treppe_innen.jpeg",
  title: "Buchner Bründler  —  Wohnsiedlung Rötiboden Wädenswil",
  tags: ["switzerland", "housing", "spiral-stair", "concrete", "apartment-interior", "buchner-bruendler", "orange"]
},
{
  image: "images/Buchner-Bruendler_Wohnsiedlung-Roetiboden-Waedenswil_treppe.jpeg",
  title: "Buchner Bründler  —  Wohnsiedlung Rötiboden Wädenswil",
  tags: ["switzerland", "green", "housing", "spiral-stair", "concrete", "buchner-bruendler"]
},
  {
  image: "images/Buchner-Bruendler_Wohnsiedlung-Roetiboden-Waedenswil.jpg",
  title: "Buchner Bründler  —  Wohnsiedlung Rötiboden Wädenswil",
  tags: ["switzerland", "housing", "balcony", "facade", "spiral-stair", "concrete", "buchner-bruendler"]
}, 
  {
  image: "images/Buchner-Bruendler_Stadterle-Basel.jpg",
  title: "Buchner Bründler  —  Stadterle Basel",
  tags: ["basel", "housing", "switzerland", "social-housing", "balcony", "facade", "ich-war-da", "green", "circulation", "buchner-bruendler", "laubengang"]
},
{
    image: "images/Maerkli-Peter_Two-Houses-Truebbach_aussen.jpg",
    title: "Peter Märkli — Two Houses, Trübbach",
    tags: ["maerkli-peter", "switzerland", "mountains", "house", "plaster", "cubic"]
  },
{
  image: "images/Sauerbruch-Hutton_GSW-Headquarters-Berlin.jpg",
  title: "Sauerbruch Hutton  —  GSW Headquarters Berlin",
  tags: ["facade", "glass", "sauerbruch-hutton", "germany", "berlin", "office", "contemporary"]
},

  {
  image: "images/Olgiati-Valerio_Vordach-Chur.jpg",
  title: "Valerio Olgiati  —  Vordach Chur",
  tags: ["switzerland", "concrete", "ich-war-da", "white", "ramp", "stair", "olgiati-valerio", "porch"]
},

   {
    image: "images/127af_waschbecken_1.jpeg",
    title: "127af — Sink",
    tags: ["sink", "concrete", "white", "detail", "wood", "127af", "france", "paris", "bathroom", "tiles"]
  },
  {
    image: "images/le-corbusier_cabanon_1.jpg",
    title: "Le Corbusier — Cabanon",
    tags: ["le-corbusier", "cabin", "france", "coast", "wood", "house", "interior"]
  },
  {
    image: "images/le-corbusier_cabanon_2.jpg",
    title: "Le Corbusier — Cabanon",
    tags: ["le-corbusier", "cabin", "france", "wood", "house", "bathroom", "metal", "sink"]
  },
  {
    image: "images/le-corbusier_cabanon_3.webp",
    title: "Le Corbusier — Cabanon",
    tags: ["le-corbusier", "cabin", "france", "wood", "house", "interior"]
  },
  {
    image: "images/Rene-Herbst_Waschbecken_1.jpg",
    title: "René Herbst — Sink",
    tags: ["sink", "metal", "france", "herbst-rene", "white", "detail"]
  },
  {
    image: "images/Exner-Inger-und-Exner-Johannes_Noerrelandskirche-Holstebro-kirche.jpeg",
    title: "Exner Inger & Johannes — Church",
    tags: ["stair", "structure", "denmark", "spiral-stair", "tower", "exner-inger-johannes", "church"]
  },
  {
    image: "images/Vaccaro-Giuseppe_Kindergarten-Piacenza.jpg",
    title: "Vaccaro Giuseppe — Kindergarten, Piacenza",
    tags: ["kindergarten", "concrete", "italy", "circular", "pavilion", "courtyard", "vaccaro-giuseppe"]
  },
  {
    image: "images/DeVylder-Vinck-Taillieu_Podium-Pile-Pavilion_pavillon.jpeg",
    title: "De Vylder Vinck Taillieu — Podium-Pile-Pavilion",
    tags: ["belgium", "pavilion", "de-vylder-vinck-taillieu", "concrete", "brick", "columns"]
  },
  {
    image: "images/Tschumi-Bernard_Parc-de-la-Villette-Paris_park.jpg",
    title: "Bernard Tschumi — Parc de la Villette",
    tags: ["tschumi-bernard", "ich-war-da", "france", "paris", "pavilion", "metal", "red", "park"]
  },
  {
    image: "images/Tschumi-Bernard_Parc-de-la-Villette-Paris_darstellung.jpeg",
    title: "Bernard Tschumi — Parc de la Villette",
    tags: ["tschumi-bernard", "france", "ich-war-da", "paris", "pavilion", "metal", "red", "park", "concept", "representation"]
  },
  {
    image: "images/Piano-Renzo_Fondation-Beyeler-Riehen_museum.jpeg",
    title: "Renzo Piano — Fondation Beyeler",
    tags: ["piano-renzo", "ich-war-da", "basel", "switzerland", "museum", "glass", "stone"]
  },
  {
    image: "images/Piano-Renzo_Pathe-Foundation-Paris_gebaeude.jpg",
    title: "Renzo Piano — Pathé Foundation",
    tags: ["piano-renzo", "ich-war-da", "paris", "france", "glass", "roof", "organic", "metal", "facade"]
  },
  {
    image: "images/Matte-Trucco-Giacomo_Fiat-Lingotto-Turin.jpeg",
    title: "Giacomo Matté-Trucco — Fiat Lingotto",
    tags: ["matte-trucco", "ich-war-da", "turin", "italy", "concrete", "factory", "roof", "industrial", "ramp", "circulation", "metal", "facade"]
  },
  {
    image: "images/Matte-Trucco-Giacomo_Fiat-Lingotto-Turin_struktur.jpeg",
    title: "Giacomo Matté-Trucco — Fiat Lingotto",
    tags: ["matte-trucco", "ich-war-da", "turin", "italy", "concrete", "factory", "industrial", "structure", "ramp", "circulation", "metal"]
  },
  {
    image: "images/Matta-Clark-Gordon_Conical-Intersect-Paris.jpg",
    title: "Gordon Matta-Clark — Conical Intersect",
    tags: ["paris", "gta", "facade", "matta-clark-gordon", "representation"]
  },
  {
    image: "images/Lacaton-Vassal-Druot-Hutin_Transformation-530-Logements-Grand-Parc-Bordeaux_balkon.jpeg",
    title: "Lacaton & Vassal, Druot, Hutin — Transformation 530 logements, Bordeaux",
    tags: ["bordeaux", "lacaton-vassal", "transformation", "france", "housing", "social-housing", "facade", "extension", "glass", "balcony"]
  },
  {
    image: "images/Lacaton-Vassal-Druot-Hutin_Transformation-530-Logements-Grand-Parc-Bordeaux.jpg",
    title: "Lacaton & Vassal, Druot, Hutin — Transformation 530 logements, Bordeaux",
    tags: ["bordeaux", "lacaton-vassal", "transformation", "france", "housing", "social-housing", "facade", "extension", "glass", "balcony"]
  }
];


/* =========================
   2. TAG CATEGORIES
========================= */

const tagGroups = {
  "Author": ["vaccaro-giuseppe", "enzmann-fischer-partner", "buchner-bruendler", "sauerbruch-hutton", "olgiati-valerio", "maerkli-peter", "lacaton-vassal", "matta-clark-gordon", "matte-trucco", "piano-renzo", "de-vylder-vinck-taillieu", "tschumi-bernard", "exner-inger-johannes", "127af", "le-corbusier", "herbst-rene"],

  "Location": [
    ["france", "italy", "germany", "denmark", "belgium", "switzerland"],
    ["paris", "zurich", "bordeaux", "basel", "berlin", "turin"],
    ["coast", "mountains"]
  ],

  "Typology": ["church", "alternative-living", "mixed-use", "office", "house", "social-housing", "housing", "factory", "museum", "park", "pavilion", "kindergarten", "tower", "cabin"],

  "Elements": ["bathroom", "gallery", "hall", "apartment-interior", "laubengang", "porch", "transformation", "extension", "balcony", "ramp", "roof", "facade", "columns", "courtyard", "structure", "spiral-stair", "stair", "sink", "tiles", "detail"],

  "Material": ["concrete", "plaster", "stone", "glass", "brick", "wood", "metal"],

  "Wer hats mir gezeigt?": ["gta", "ich-war-da", "self-photographed"],

  "Style": ["brutalism", "contemporary", "cubic", "industrial"],

  "Form": ["circular", "organic", "geometric", "symmetrical"],

  "Color": ["red", "orange", "blue", "yellow", "green", "black", "white"],

  "Other": ["representation", "in-noisy-places", "concept", "circulation"]
};


/* =========================
   3. VARIABLES
========================= */

let images;
let activeTags = [];
let currentIndex = 0;
let currentMatches = [];


/* =========================
   4. GENERATE GALLERY
========================= */

generateGallery();
images = document.querySelectorAll(".gallery .item");
generateButtons();

function generateGallery() {
  const gallery = document.querySelector(".gallery");

  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "item";
    div.dataset.tags = item.tags.join(" ");

    div.innerHTML = `
      <img src="${item.image}">
      <p>${item.title}</p>
    `;

    gallery.appendChild(div);
  });
}


/* =========================
   5. GENERATE BUTTONS
========================= */

function generateButtons() {
  const groups = document.querySelectorAll(".filter-group");

  groups.forEach(group => {
    const groupName = group.dataset.group;
    const container = group.querySelector(".buttons");

    if (!container) return;
    if (!tagGroups[groupName]) return;

    container.innerHTML = "";

    const groupData = tagGroups[groupName];

    if (groupName === "Location") {
      groupData.forEach((section, index) => {
        const sortedTags = [...section].sort((a, b) =>
          a.localeCompare(b, "en", { sensitivity: "base" })
        );

        sortedTags.forEach(tag => {
          createButton(tag, container);
        });

        if (index < groupData.length - 1) {
          const spacer = document.createElement("div");
          spacer.className = "tag-spacer";
          container.appendChild(spacer);
        }
      });

      return;
    }

    const sortedTags = [...groupData].sort((a, b) =>
      a.localeCompare(b, "en", { sensitivity: "base" })
    );

    sortedTags.forEach(tag => {
      createButton(tag, container);
    });
  });
}

function createButton(tag, container) {
  const button = document.createElement("button");
  button.dataset.tag = tag;
  button.textContent = tag;
  container.appendChild(button);
}


/* =========================
   6. FILTER CLICK
========================= */

document.addEventListener("click", (e) => {
  if (!e.target.matches(".filters button")) return;

  const button = e.target;
  const tag = button.dataset.tag;

  if (activeTags.includes(tag)) {
    activeTags = activeTags.filter(t => t !== tag);
    button.classList.remove("selected");
  } else {
    activeTags.push(tag);
    button.classList.add("selected");
  }

  filterImages();
});


/* =========================
   7. FILTER IMAGES
========================= */

function filterImages() {
  currentMatches = [];

  images.forEach(img => {
    const tags = img.dataset.tags.toLowerCase().split(" ");
    const match = activeTags.every(tag => tags.includes(tag));

    if (activeTags.length === 0) {
      img.classList.remove("dim");
      return;
    }

    if (match) {
      img.classList.remove("dim");
      currentMatches.push(img);
    } else {
      img.classList.add("dim");
    }
  });

  if (currentMatches.length > 0) {
    currentIndex = 0;
    scrollToCurrent();
  }
}


/* =========================
   8. SCROLL TO MATCH
========================= */

function scrollToCurrent() {
  const el = currentMatches[currentIndex];
  if (!el) return;

  el.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

function nextMatch() {
  if (currentMatches.length === 0) return;

  currentIndex = (currentIndex + 1) % currentMatches.length;
  scrollToCurrent();
}

function prevMatch() {
  if (currentMatches.length === 0) return;

  currentIndex = (currentIndex - 1 + currentMatches.length) % currentMatches.length;
  scrollToCurrent();
}


/* =========================
   9. MORE / LESS FILTERS
========================= */

const moreButton = document.getElementById("moreButton");
const filters = document.querySelector(".filters");

if (moreButton && filters) {
  moreButton.addEventListener("click", () => {
    filters.classList.toggle("show-more");

    moreButton.textContent = filters.classList.contains("show-more")
      ? "less"
      : "...more";
  });
}