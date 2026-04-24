/* =========================
   1. TAG CATEGORIES
========================= */

const tagGroups = {
  "Author": ["vaccaro-giuseppe", "matte-trucco", "piano-renzo", "de-vylder-vinck-taillieu", "tschumi-bernard", "exner-inger-johannes", "127af", "le-corbusier", "herbst-rene"],

  "Location": [
    ["france", "italy", "denmark", "belgium", "switzerland"],
    ["paris", "basel", "turin"],
    ["coast", "mountains"]
  ],

  "Typology": ["church", "factory", "museum", "park", "pavilion", "kindergarten", "tower", "cabin", "house"],

  "Elements": ["bathroom", "ramp", "roof", "facade", "columns", "courtyard", "structure", "spiral-stair", "stair", "sink", "tiles", "detail"],

  "Material": ["concrete", "stone", "glass", "brick", "wood", "metal"],

  "Wer hats mir gezeigt?": ["gta", "ich-war-da", "self-photographed"],

  "Style": ["brutalism", "industrial"],

  "Form": ["circular", "organic", "geometric", "symmetrical"],

  "Color": ["red", "blue", "yellow", "green", "black", "white"],

  "Other": ["representation", "concept", "circulation"]
};


/* =========================
   2. VARIABLES
========================= */

const images = document.querySelectorAll(".gallery .item");

let activeTags = [];
let currentIndex = 0;
let currentMatches = [];


/* =========================
   3. GENERATE BUTTONS
========================= */

generateButtons();

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
   4. FILTER CLICK
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
   5. FILTER IMAGES
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
   6. SCROLL TO MATCH
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
   7. MORE / LESS FILTERS
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
