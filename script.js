/* =========================
   1. DATA
========================= */

let items = [];
let tagGroups = {};
let supabaseClient = null;


/* =========================
   3. VARIABLES
========================= */

let images;
let activeTags = [];
let currentIndex = 0;
let currentMatches = [];
let selectedSubmitTags = new Set();


/* =========================
   4. INITIALIZE
========================= */

init();

async function init() {
  const data = await loadReferenceData();
  items = data.items;
  tagGroups = data.tagGroups;

  generateGallery();
  images = document.querySelectorAll(".gallery .item");
  generateButtons();
  initFilterCategories();
  initFilterControls();
  initSubmitForm();
  updatePrintTags();
}

function createSupabaseClient() {
  const config = window.supabaseConfig || {};
  const hasConfig = config.url && config.anonKey;
  const hasLibrary = window.supabase && window.supabase.createClient;

  if (!hasConfig || !hasLibrary) {
    return null;
  }

  return window.supabase.createClient(config.url, config.anonKey);
}

async function loadReferenceData() {
  const fallbackData = window.referenceData || { items: [], tagGroups: {} };
  supabaseClient = createSupabaseClient();

  if (!supabaseClient) {
    return fallbackData;
  }

  try {
    const [{ data: references, error: referencesError }, { data: groups, error: groupsError }] =
      await Promise.all([
        supabaseClient
          .from("references")
          .select("image, source, title, tags")
          .eq("status", "approved")
          .order("created_at", { ascending: true }),
        supabaseClient
          .from("tag_groups")
          .select("group_name, tags")
          .order("sort_order", { ascending: true })
      ]);

    if (referencesError) throw referencesError;
    if (groupsError) throw groupsError;

    if (!references || references.length === 0) {
      return {
        items: fallbackData.items,
        tagGroups: buildTagGroups(groups, fallbackData.tagGroups)
      };
    }

    return {
      items: references,
      tagGroups: buildTagGroups(groups, fallbackData.tagGroups)
    };
  } catch (error) {
    console.warn("Could not load Supabase data. Falling back to data.js.", error);
    return fallbackData;
  }
}

function buildTagGroups(groups, fallbackGroups) {
  const mergedGroups = { ...fallbackGroups };

  if (!groups || groups.length === 0) {
    return mergedGroups;
  }

  return groups.reduce((result, group) => {
    result[group.group_name] = group.tags || [];
    return result;
  }, mergedGroups);
}

function flattenTags(groupData) {
  if (!Array.isArray(groupData)) {
    return [];
  }

  if (Array.isArray(groupData[0])) {
    return groupData.flat();
  }

  return groupData;
}


/* =========================
   5. GENERATE GALLERY
========================= */

function initFilterCategories() {
  const filterGroups = document.querySelectorAll(".filter-group");

  filterGroups.forEach(group => {
    const title = group.querySelector("h2");

    if (!title) return;

    title.addEventListener("click", () => {
      group.classList.toggle("open");
    });
  });
}

function initFilterControls() {
  const filterToggle = document.getElementById("imageCount");
  const filters = document.querySelector(".filters");
  const clearFilters = document.getElementById("clearFilters");

  if (filterToggle && filters) {
    filterToggle.addEventListener("click", () => {
      filters.classList.toggle("open");
    });
  }

  if (clearFilters) {
    clearFilters.addEventListener("click", () => {
      resetFilters();
    });
  }

  updateFilterActionVisibility();
}

function generateGallery() {
  const gallery = document.querySelector(".gallery");
  if (!gallery) return;

  gallery.innerHTML = "";

  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "item";
    div.dataset.tags = (item.tags || []).join(" ");

    const image = document.createElement("img");
    image.src = item.image;
    image.alt = item.title;

    const title = document.createElement("p");
    title.textContent = item.title;

    const content = item.source ? document.createElement("a") : div;

    if (item.source) {
      content.href = item.source;
      content.target = "_blank";
      content.rel = "noopener noreferrer";
      div.appendChild(content);
    }

    content.appendChild(image);
    content.appendChild(title);

    gallery.appendChild(div);
  });

  updateImageCount(items.length);
}

function initSubmitForm() {
  const form = document.getElementById("submitForm");
  if (!form) return;

  const status = document.getElementById("submitStatus");
  selectedSubmitTags = new Set();
  createSubmitTagSelector();
  initNewSubmitTags();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!supabaseClient) {
      setSubmitStatus(status, "Supabase ist noch nicht konfiguriert.");
      return;
    }

    const formData = new FormData(form);
    const newTagsByCategory = getNewSubmitTagsByCategory();
    const newTags = Object.values(newTagsByCategory).flat();
    const tags = [...new Set([...selectedSubmitTags, ...newTags])];

    const record = {
      image: getFormValue(formData, "image"),
      source: getFormValue(formData, "source") || null,
      title: getFormValue(formData, "title"),
      tags,
      submitter_name: getFormValue(formData, "submitter_name") || null,
      status: "pending"
    };

    if (!record.image || !record.title || record.tags.length === 0) {
      setSubmitStatus(status, "Bitte Bild, Titel und mindestens einen Tag ausfüllen.");
      return;
    }

    setSubmitStatus(status, "Wird gespeichert...");

    const { error } = await submitReference(record, newTagsByCategory);

    if (error) {
      console.error(error);
      setSubmitStatus(status, "Speichern hat nicht geklappt. Bitte später nochmal versuchen.");
      return;
    }

    form.reset();
    selectedSubmitTags.clear();
    document.querySelectorAll("#submitTagGroups button.selected").forEach(button => {
      button.classList.remove("selected");
    });
    resetNewSubmitTags();
    setSubmitStatus(status, "Danke. Die Referenz wartet jetzt auf Freigabe.");
  });
}

async function submitReference(record, newTagsByCategory) {
  const { error: rpcError } = await supabaseClient.rpc("submit_reference", {
    p_image: record.image,
    p_source: record.source,
    p_title: record.title,
    p_tags: record.tags,
    p_submitter_name: record.submitter_name,
    p_new_tags: newTagsByCategory
  });

  if (!rpcError) {
    mergeNewTagsIntoLocalGroups(newTagsByCategory);
    return { error: null };
  }

  console.warn("submit_reference RPC failed. Falling back to plain insert.", rpcError);

  return supabaseClient
    .from("references")
    .insert(record);
}

function createSubmitTagSelector() {
  const wrapper = document.getElementById("submitTagGroups");
  if (!wrapper) return;

  wrapper.innerHTML = "";

  Object.entries(tagGroups).forEach(([groupName, groupData]) => {
    const group = document.createElement("div");
    group.className = "submit-tag-group";

    const title = document.createElement("h2");
    title.textContent = groupName;
    group.appendChild(title);

    const buttons = document.createElement("div");
    buttons.className = "submit-tag-buttons";

    const tags = [...new Set(flattenTags(groupData))].sort((a, b) =>
      a.localeCompare(b, "en", { sensitivity: "base" })
    );

    tags.forEach(tag => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.tag = tag;
      button.textContent = tag;

      button.addEventListener("click", () => {
        if (selectedSubmitTags.has(tag)) {
          selectedSubmitTags.delete(tag);
          button.classList.remove("selected");
        } else {
          selectedSubmitTags.add(tag);
          button.classList.add("selected");
        }
      });

      buttons.appendChild(button);
    });

    group.appendChild(buttons);
    wrapper.appendChild(group);
  });

  if (wrapper.children.length === 0) {
    wrapper.textContent = "No tag groups available yet.";
  }
}

function initNewSubmitTags() {
  const addButton = document.getElementById("addSubmitTagRow");
  if (!addButton) return;

  addButton.addEventListener("click", () => {
    addNewSubmitTagRow();
  });

  resetNewSubmitTags();
}

function resetNewSubmitTags() {
  const wrapper = document.getElementById("newSubmitTagRows");
  if (!wrapper) return;

  wrapper.innerHTML = "";
  addNewSubmitTagRow();
}

function addNewSubmitTagRow() {
  const wrapper = document.getElementById("newSubmitTagRows");
  if (!wrapper) return;

  const row = document.createElement("div");
  row.className = "new-submit-tag-row";

  const input = document.createElement("input");
  input.className = "newSubmitTagInput";
  input.placeholder = "new-tag";

  const select = document.createElement("select");
  select.className = "newSubmitTagCategory";
  select.required = true;

  Object.keys(tagGroups).forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.appendChild(option);
  });

  if (select.options.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No categories";
    select.appendChild(option);
  }

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.textContent = "Remove";
  removeButton.addEventListener("click", () => row.remove());

  row.appendChild(input);
  row.appendChild(select);
  row.appendChild(removeButton);
  wrapper.appendChild(row);
}

function getNewSubmitTagsByCategory() {
  const newTagsByCategory = {};

  document.querySelectorAll(".new-submit-tag-row").forEach(row => {
    const input = row.querySelector(".newSubmitTagInput");
    const select = row.querySelector(".newSubmitTagCategory");
    const tag = cleanTag(input.value);

    if (!tag) return;

    const category = select.value;
    const existingTags = flattenTags(tagGroups[category]);

    if (existingTags.includes(tag)) {
      selectedSubmitTags.add(tag);
      return;
    }

    if (!newTagsByCategory[category]) {
      newTagsByCategory[category] = [];
    }

    if (!newTagsByCategory[category].includes(tag)) {
      newTagsByCategory[category].push(tag);
    }
  });

  return newTagsByCategory;
}

function mergeNewTagsIntoLocalGroups(newTagsByCategory) {
  Object.entries(newTagsByCategory).forEach(([category, tags]) => {
    const existingTags = flattenTags(tagGroups[category]);
    tagGroups[category] = [...new Set([...existingTags, ...tags])].sort((a, b) =>
      a.localeCompare(b, "en", { sensitivity: "base" })
    );
  });
}

function parseTags(value) {
  return String(value || "")
    .split(",")
    .map(tag => cleanTag(tag))
    .filter(Boolean)
    .filter((tag, index, tags) => tags.indexOf(tag) === index);
}

function getFormValue(formData, key) {
  return String(formData.get(key) || "").trim();
}

function cleanTag(tag) {
  return tag
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("é", "e")
    .replaceAll("è", "e")
    .replaceAll("à", "a")
    .replaceAll("ç", "c")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function setSubmitStatus(element, message) {
  if (!element) return;
  element.textContent = message;
}

function updatePrintTags() {
  const el = document.getElementById("printTags");
  if (!el) return;

  if (activeTags.length === 0) {
    el.textContent = "Alle Referenzen";
  } else {
    el.textContent = "filtered by:" + activeTags.join(", ");
  }
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

    if (groupName === "Location" && Array.isArray(groupData[0])) {
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

    const sortedTags = [...flattenTags(groupData)].sort((a, b) =>
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

function resetFilters() {
  activeTags = [];
  currentMatches = [];
  currentIndex = 0;

  document.querySelectorAll(".filters button.selected").forEach(button => {
    button.classList.remove("selected");
  });

  if (images) {
    images.forEach(img => {
      img.classList.remove("dim");
    });
  }

  updateImageCount(items.length);
  updatePrintTags();
  updateFilterActionVisibility();
}


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

  updateImageCount(
    activeTags.length === 0 ? items.length : currentMatches.length
  );

  updatePrintTags();
  updateFilterActionVisibility();
}

function updateFilterActionVisibility() {
  const hasActiveTags = activeTags.length > 0;

  document.getElementById("clearFilters")?.classList.toggle("visible", hasActiveTags);
  document.getElementById("pdfButton")?.classList.toggle("visible", hasActiveTags);
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



/* =========================
   9. MORE / LESS FILTERS
========================= */

function updateImageCount(count) {
  const el = document.getElementById("imageCount");
  if (!el) return;

  el.textContent = `${count} Referenzen filtern`;
}

const pdfButton = document.getElementById("pdfButton");

function getPdfFileName() {
  if (activeTags.length === 0) {
    return "references";
  }

  const filterName = activeTags
    .map(tag => tag.toLowerCase())
    .map(tag => tag.replace(/\s+/g, "-"))
    .map(tag => tag.replace(/[^a-z0-9-]/g, ""))
    .join("-");

  return `references_${filterName}`;
}

if (pdfButton) {
  pdfButton.addEventListener("click", () => {
    const oldTitle = document.title;

    document.title = getPdfFileName();

    setTimeout(() => {
      window.print();

      setTimeout(() => {
        document.title = oldTitle;
      }, 1000);
    }, 100);
  });
}
