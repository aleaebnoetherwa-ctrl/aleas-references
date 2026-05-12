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
  initTagSearches();
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

    return {
      items: mergeReferenceItems(fallbackData.items, references || []),
      tagGroups: buildTagGroups(groups, fallbackData.tagGroups)
    };
  } catch (error) {
    console.warn("Could not load Supabase data. Falling back to data.js.", error);
    return fallbackData;
  }
}

function buildTagGroups(groups, fallbackGroups) {
  const mergedGroups = normalizeTagGroups(fallbackGroups);

  if (!groups || groups.length === 0) {
    return mergedGroups;
  }

  return groups.reduce((result, group) => {
    result[group.group_name] = normalizeTagList(group.tags);
    return result;
  }, mergedGroups);
}

function mergeReferenceItems(localItems, remoteItems) {
  const mergedItems = localItems.map(normalizeReferenceItem);
  const knownKeys = new Set(localItems.map(item => getReferenceKey(item)));

  remoteItems.forEach(item => {
    const normalizedItem = normalizeReferenceItem(item);
    const key = getReferenceKey(normalizedItem);

    if (!knownKeys.has(key)) {
      mergedItems.push(normalizedItem);
      knownKeys.add(key);
    }
  });

  return mergedItems;
}

function getReferenceKey(item) {
  return `${item.image || ""}|${item.source || ""}|${item.title || ""}`;
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

function normalizeReferenceItem(item) {
  return {
    ...item,
    tags: normalizeTagList(item.tags)
  };
}

function normalizeTagGroups(groups) {
  return Object.entries(groups || {}).reduce((result, [category, groupData]) => {
    if (Array.isArray(groupData) && Array.isArray(groupData[0])) {
      result[category] = groupData.map(section => normalizeTagList(section));
    } else {
      result[category] = normalizeTagList(groupData);
    }

    return result;
  }, {});
}

function normalizeTagList(tags) {
  return [...new Set((tags || []).map(tag => cleanTag(tag)).filter(Boolean))];
}

function getAllTagEntries() {
  return Object.entries(tagGroups).flatMap(([category, groupData]) =>
    [...new Set(flattenTags(groupData).map(tag => cleanTag(tag)).filter(Boolean))]
      .map(tag => ({ category, tag }))
  ).sort((a, b) => a.tag.localeCompare(b.tag, "en", { sensitivity: "base" }));
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
      group.classList.toggle("pinned");
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

function initTagSearches() {
  initTagSearch({
    inputId: "filterTagSearch",
    suggestionsId: "filterTagSuggestions",
    onSelect: selectFilterTag
  });

  initTagSearch({
    inputId: "submitTagSearch",
    suggestionsId: "submitTagSuggestions",
    onSelect: selectSubmitTag
  });
}

function initTagSearch({ inputId, suggestionsId, onSelect }) {
  const input = document.getElementById(inputId);
  const suggestions = document.getElementById(suggestionsId);

  if (!input || !suggestions) return;

  input.addEventListener("input", () => {
    renderTagSuggestions(input, suggestions, onSelect);
  });

  input.addEventListener("focus", () => {
    renderTagSuggestions(input, suggestions, onSelect);
  });

  document.addEventListener("click", (event) => {
    if (event.target === input || suggestions.contains(event.target)) return;
    suggestions.classList.remove("open");
  });
}

function renderTagSuggestions(input, suggestions, onSelect) {
  const query = cleanSearchQuery(input.value);
  suggestions.innerHTML = "";

  if (query.length === 0) {
    suggestions.classList.remove("open");
    return;
  }

  const matches = getAllTagEntries()
    .filter(({ tag }) => tag.includes(query))
    .slice(0, 12);

  matches.forEach(({ category, tag }) => {
    const button = document.createElement("button");
    button.type = "button";

    const tagName = document.createElement("span");
    tagName.className = "suggestion-tag";
    tagName.textContent = tag;

    const categoryName = document.createElement("span");
    categoryName.className = "suggestion-category";
    categoryName.textContent = category;

    button.appendChild(tagName);
    button.appendChild(categoryName);

    button.addEventListener("click", () => {
      onSelect(tag);
      input.value = "";
      suggestions.classList.remove("open");
    });
    suggestions.appendChild(button);
  });

  suggestions.classList.toggle("open", matches.length > 0);
}

function cleanSearchQuery(value) {
  return cleanTag(value).replace(/-$/g, "");
}

function generateGallery() {
  const gallery = document.querySelector(".gallery");
  if (!gallery) return;

  gallery.innerHTML = "";

  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "item";
    div.dataset.tags = normalizeTagList(item.tags).join(" ");

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
      title: buildSubmitTitle(formData),
      tags,
      submitter_name: getFormValue(formData, "submitter_name") || null,
      status: isAutoApprovedSubmitter(getFormValue(formData, "submitter_name")) ? "approved" : "pending"
    };

    if (!record.image || !record.title || record.tags.length === 0) {
      setSubmitStatus(status, "Bitte Bild, Titel und mindestens einen Tag ausfüllen.");
      return;
    }

    setSubmitStatus(status, "Wird gespeichert...");

    const { error } = await submitReference(record, newTagsByCategory);

    if (error) {
      console.error(error);
      setSubmitStatus(status, error.message || "Speichern hat nicht geklappt. Bitte später nochmal versuchen.");
      return;
    }

    form.reset();
    selectedSubmitTags.clear();
    document.querySelectorAll("#submitTagGroups button.selected").forEach(button => {
      button.classList.remove("selected");
    });
    createSubmitTagSelector();
    resetNewSubmitTags();
    setSubmitStatus(
      status,
      record.status === "approved"
        ? "Danke. Die Referenz ist direkt freigegeben."
        : "Danke. Die Referenz wartet jetzt auf Freigabe."
    );
  });
}

async function submitReference(record, newTagsByCategory) {
  const hasNewTags = Object.values(newTagsByCategory).some(tags => tags.length > 0);

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

  console.warn("submit_reference RPC failed.", rpcError);

  if (hasNewTags) {
    return {
      error: new Error("Neue Tags konnten nicht in Supabase gespeichert werden. Bitte supabase-schema.sql erneut ausführen.")
    };
  }

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

function selectSubmitTag(tag) {
  tag = cleanTag(tag);
  selectedSubmitTags.add(tag);

  document.querySelectorAll("#submitTagGroups button").forEach(button => {
    if (button.dataset.tag !== tag) return;
    button.classList.add("selected");
  });
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

  select.addEventListener("change", () => {
    updateNewSubmitTagPlaceholder(input, select);
  });

  updateNewSubmitTagPlaceholder(input, select);

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.textContent = "Remove";
  removeButton.addEventListener("click", () => row.remove());

  row.appendChild(input);
  row.appendChild(select);
  row.appendChild(removeButton);
  wrapper.appendChild(row);
}

function updateNewSubmitTagPlaceholder(input, select) {
  if (select.value === "Author") {
    input.placeholder = "surname given name";
    return;
  }

  input.placeholder = "new-tag";
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

function isAutoApprovedSubmitter(name) {
  return cleanTag(name) === "alea";
}

function buildSubmitTitle(formData) {
  const author = getFormValue(formData, "title_author");
  const project = getFormValue(formData, "title_project");

  return [author, project].filter(Boolean).join("  —  ");
}

function cleanTag(tag) {
  return tag
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
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
    el.textContent = activeTags.join(", ");
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

function selectFilterTag(tag) {
  tag = cleanTag(tag);

  if (!activeTags.includes(tag)) {
    activeTags.push(tag);
  }

  document.querySelectorAll(".filters button").forEach(button => {
    if (button.dataset.tag !== tag) return;
    button.classList.add("selected");
  });

  filterImages();
}


/* =========================
   6. FILTER CLICK
========================= */

document.addEventListener("click", (e) => {
  if (!e.target.matches(".filters button")) return;

  const button = e.target;
  const tag = button.dataset.tag;
  if (!tag) return;

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

  document.querySelectorAll(".filter-group.pinned").forEach(group => {
    group.classList.remove("pinned");
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
    const tags = img.dataset.tags
      .split(" ")
      .map(tag => cleanTag(tag))
      .filter(Boolean);
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

function getPrintableItems() {
  if (activeTags.length === 0) {
    return items;
  }

  return items.filter(item => {
    const tags = normalizeTagList(item.tags);
    return activeTags.every(tag => tags.includes(tag));
  });
}

function buildPrintPages() {
  const wrapper = document.getElementById("printPages");
  if (!wrapper) return;

  wrapper.innerHTML = "";

  const printableItems = getPrintableItems();

  for (let i = 0; i < printableItems.length; i += 6) {
    const page = document.createElement("section");
    page.className = "print-page";
    const pageItems = printableItems.slice(i, i + 6);

    const tags = document.createElement("p");
    tags.className = "print-page-tags";
    tags.textContent = activeTags.length ? activeTags.join(", ") : "all references";

    const grid = document.createElement("div");
    grid.className = "print-grid";

    pageItems.forEach(item => {
      const card = document.createElement("article");
      card.className = "print-card";

      const image = document.createElement("img");
      image.src = item.image;
      image.alt = item.title;

      const title = document.createElement("p");
      title.textContent = item.title;

      card.appendChild(image);
      card.appendChild(title);
      grid.appendChild(card);
    });

    page.appendChild(tags);
    page.appendChild(grid);
    wrapper.appendChild(page);
  }
}

if (pdfButton) {
  pdfButton.addEventListener("click", () => {
    const oldTitle = document.title;

    document.title = getPdfFileName();
    buildPrintPages();

    setTimeout(() => {
      window.print();

      setTimeout(() => {
        document.getElementById("printPages").innerHTML = "";
        document.title = oldTitle;
      }, 1000);
    }, 100);
  });
}
