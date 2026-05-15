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

const LOCATION_GROUP = "Location";
const LOCATION_COUNTRY_GROUP = "Location (country)";
const LOCATION_CITY_GROUP = "Location (city)";
const LOCATION_LANDSCAPE_GROUP = "Location (landscape)";
const LOCATION_SUBGROUPS = [LOCATION_COUNTRY_GROUP, LOCATION_CITY_GROUP, LOCATION_LANDSCAPE_GROUP];
const LOCATION_COUNTRIES = new Set([
  "belgium", "denmark", "france", "germany", "italy", "niger", "switzerland", "uk", "usa"
]);
const LOCATION_CITIES = new Set([
  "basel", "berlin", "bordeaux", "paris", "prague", "turin", "vienna", "zurich"
]);
const LOCATION_LANDSCAPES = new Set([
  "coast", "desert", "forest", "mountains"
]);
const CATEGORY_LABELS = {
  "Wer hats mir gezeigt?": "Shown by"
};
const EDIT_CODE = "alea";
const EDIT_CODE_STORAGE_KEY = "alea-reference-edit-code";


/* =========================
   4. INITIALIZE
========================= */

init();

async function init() {
  const data = await loadReferenceData();
  items = data.items;
  tagGroups = organizeTagGroups(data.tagGroups);

  generateGallery();
  images = document.querySelectorAll(".gallery .item");
  generateButtons();
  initFilterCategories();
  initFilterControls();
  initSubmitForm();
  initTagSearches();
  initMobileNotice();
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

function initMobileNotice() {
  const isSmallScreen = window.matchMedia("(max-width: 700px)").matches;
  const storageKey = "alea-mobile-notice-dismissed";

  if (!isSmallScreen) return;

  try {
    if (localStorage.getItem(storageKey) === "true") return;
  } catch (error) {
    console.warn("Could not read mobile notice preference.", error);
  }

  const notice = document.createElement("div");
  notice.className = "mobile-notice visible";

  const dialog = document.createElement("div");
  dialog.className = "mobile-notice-dialog";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");

  const text = document.createElement("p");
  text.textContent = "This website is best enjoyed on a computer.";

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "OK";

  button.addEventListener("click", () => {
    notice.classList.remove("visible");

    try {
      localStorage.setItem(storageKey, "true");
    } catch (error) {
      console.warn("Could not save mobile notice preference.", error);
    }
  });

  dialog.appendChild(text);
  dialog.appendChild(button);
  notice.appendChild(dialog);
  document.body.appendChild(notice);
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
          .select("id, image, source, title, tags")
          .eq("status", "approved")
          .order("created_at", { ascending: false }),
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
  return getVisibleTagGroupNames().flatMap(category => {
    const groupData = category === LOCATION_GROUP ? getLocationSections() : tagGroups[category];

    return [...new Set(flattenTags(groupData).map(tag => cleanTag(tag)).filter(Boolean))]
      .map(tag => ({ category: getCategoryLabel(category), tag }));
  }).sort((a, b) => a.tag.localeCompare(b.tag, "en", { sensitivity: "base" }));
}

function getCategoryLabel(category) {
  return CATEGORY_LABELS[category] || category;
}

function getVisibleTagGroupNames() {
  return Object.keys(tagGroups).filter(category => !LOCATION_SUBGROUPS.includes(category));
}

function organizeTagGroups(groups) {
  const organizedGroups = { ...(groups || {}) };
  organizedGroups[LOCATION_GROUP] = getLocationSections(organizedGroups);
  return organizedGroups;
}

function getLocationSections(groups = tagGroups) {
  const sections = [new Set(), new Set(), new Set()];
  const locationTags = normalizeTagList(flattenTags(groups[LOCATION_GROUP]));

  locationTags.forEach(tag => {
    sections[getLocationSectionIndex(tag)].add(tag);
  });

  normalizeTagList(groups[LOCATION_COUNTRY_GROUP]).forEach(tag => sections[0].add(tag));
  normalizeTagList(groups[LOCATION_CITY_GROUP]).forEach(tag => sections[1].add(tag));
  normalizeTagList(groups[LOCATION_LANDSCAPE_GROUP]).forEach(tag => sections[2].add(tag));

  return sections.map(section =>
    [...section].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }))
  );
}

function getLocationSectionIndex(tag) {
  if (LOCATION_CITIES.has(tag)) return 1;
  if (LOCATION_LANDSCAPES.has(tag)) return 2;
  return 0;
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
  let activeIndex = -1;

  if (!input || !suggestions) return;

  input.addEventListener("input", () => {
    activeIndex = -1;
    renderTagSuggestions(input, suggestions, onSelect);
  });

  input.addEventListener("focus", () => {
    renderTagSuggestions(input, suggestions, onSelect);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!suggestions.classList.contains("open")) {
        renderTagSuggestions(input, suggestions, onSelect);
      }
      const buttons = [...suggestions.querySelectorAll("button")];
      if (!buttons.length) return;
      activeIndex = Math.min(activeIndex + 1, buttons.length - 1);
      updateActiveSuggestion(buttons, activeIndex);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!suggestions.classList.contains("open")) {
        renderTagSuggestions(input, suggestions, onSelect);
      }
      const buttons = [...suggestions.querySelectorAll("button")];
      if (!buttons.length) return;
      activeIndex = Math.max(activeIndex - 1, 0);
      updateActiveSuggestion(buttons, activeIndex);
    }

    if (event.key === "Enter") {
      const buttons = [...suggestions.querySelectorAll("button")];
      if (!buttons.length || !suggestions.classList.contains("open")) return;
      event.preventDefault();
      buttons[Math.max(activeIndex, 0)].click();
      activeIndex = -1;
    }

    if (event.key === "Escape") {
      suggestions.classList.remove("open");
      activeIndex = -1;
    }
  });

  document.addEventListener("click", (event) => {
    if (event.target === input || suggestions.contains(event.target)) return;
    suggestions.classList.remove("open");
    activeIndex = -1;
  });
}

function updateActiveSuggestion(buttons, activeIndex) {
  buttons.forEach((button, index) => {
    button.classList.toggle("active", index === activeIndex);
  });

  buttons[activeIndex]?.scrollIntoView({ block: "nearest" });
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

function openReferenceEditor(item) {
  if (!item.id) {
    window.alert("This reference can only be edited after it has been saved in Supabase.");
    return;
  }

  const code = window.prompt("Enter edit code:");

  if (code !== EDIT_CODE) {
    window.alert("Wrong code.");
    return;
  }

  try {
    sessionStorage.setItem(EDIT_CODE_STORAGE_KEY, code);
  } catch (error) {
    console.warn("Could not store edit code.", error);
  }

  window.location.href = `edit.html?id=${encodeURIComponent(item.id)}`;
}

function generateGallery() {
  const gallery = document.querySelector(".gallery");
  if (!gallery) return;

  gallery.innerHTML = "";

  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "item";
    div.dataset.tags = normalizeTagList(item.tags).join(" ");
    div.dataset.id = item.id || "";

    const image = document.createElement("img");
    image.src = item.image;
    image.alt = item.title;

    const title = document.createElement("p");
    title.textContent = item.title;

    const content = item.source ? document.createElement("a") : div;
    const tagMenu = document.createElement("div");
    tagMenu.className = "item-tags";

    const dots = document.createElement("span");
    dots.className = "item-tags-dots";
    dots.textContent = "⋮";

    const tagList = document.createElement("div");
    tagList.className = "item-tags-list";
    tagList.textContent = normalizeTagList(item.tags).join(", ");

    const tagPanel = document.createElement("div");
    tagPanel.className = "item-tags-panel";

    const editButton = document.createElement("button");
    editButton.className = "item-edit-button";
    editButton.type = "button";
    editButton.textContent = "Edit (code only)";
    editButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openReferenceEditor(item);
    });

    tagMenu.appendChild(dots);
    tagPanel.appendChild(tagList);
    tagPanel.appendChild(editButton);
    tagMenu.appendChild(tagPanel);

    if (item.source) {
      content.href = item.source;
      content.target = "_blank";
      content.rel = "noopener noreferrer";
      div.appendChild(content);
    }

    content.appendChild(image);
    content.appendChild(title);
    div.appendChild(tagMenu);

    gallery.appendChild(div);
  });

  updateImageCount(items.length);
}

function initSubmitForm() {
  const form = document.getElementById("submitForm");
  if (!form) return;

  const status = document.getElementById("submitStatus");
  const isEditMode = document.body.classList.contains("edit-page");
  selectedSubmitTags = new Set();
  createSubmitTagSelector();
  initNewSubmitTags();

  if (isEditMode) {
    initEditForm(form, status);
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!supabaseClient) {
      setSubmitStatus(status, "Supabase is not configured yet.");
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
      setSubmitStatus(status, "Please add an image, a title, and at least one tag.");
      return;
    }

    setSubmitStatus(status, "Saving...");

    const { error } = await submitReference(record, newTagsByCategory);

    if (error) {
      console.error(error);
      setSubmitStatus(status, error.message || "Saving did not work. Please try again later.");
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
        ? "Thank you. The reference is approved directly."
        : "Thank you. The reference will be checked briefly and approved within one day."
    );
  });
}

function initEditForm(form, status) {
  const referenceId = new URLSearchParams(window.location.search).get("id");
  const code = getStoredEditCode();

  if (!referenceId || code !== EDIT_CODE) {
    setSubmitStatus(status, "Edit code required. Please open this page from the reference menu.");
    form.querySelectorAll("input, button, select").forEach(element => {
      element.disabled = true;
    });
    return;
  }

  const reference = items.find(item => item.id === referenceId);

  if (!reference) {
    setSubmitStatus(status, "Reference not found.");
    return;
  }

  fillEditForm(reference);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!supabaseClient) {
      setSubmitStatus(status, "Supabase is not configured yet.");
      return;
    }

    const formData = new FormData(form);
    const newTagsByCategory = getNewSubmitTagsByCategory();
    const newTags = Object.values(newTagsByCategory).flat();
    const tags = [...new Set([...selectedSubmitTags, ...newTags])];

    const record = {
      id: referenceId,
      image: getFormValue(formData, "image"),
      source: getFormValue(formData, "source") || null,
      title: buildSubmitTitle(formData),
      tags
    };

    if (!record.image || !record.title || record.tags.length === 0) {
      setSubmitStatus(status, "Please add an image, a title, and at least one tag.");
      return;
    }

    setSubmitStatus(status, "Saving changes...");

    const { error } = await updateReference(record, newTagsByCategory, code);

    if (error) {
      console.error(error);
      setSubmitStatus(status, error.message || "Saving changes did not work. Please try again later.");
      return;
    }

    setSubmitStatus(status, "Changes saved.");
  });
}

function getStoredEditCode() {
  try {
    return sessionStorage.getItem(EDIT_CODE_STORAGE_KEY);
  } catch (error) {
    console.warn("Could not read edit code.", error);
    return null;
  }
}

function fillEditForm(reference) {
  const titleParts = splitReferenceTitle(reference.title);

  document.getElementById("submitImage").value = reference.image || "";
  document.getElementById("submitSource").value = reference.source || "";
  document.getElementById("submitTitleAuthor").value = titleParts.author;
  document.getElementById("submitTitleProject").value = titleParts.project;

  selectedSubmitTags = new Set(normalizeTagList(reference.tags));

  document.querySelectorAll("#submitTagGroups button").forEach(button => {
    button.classList.toggle("selected", selectedSubmitTags.has(button.dataset.tag));
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
      error: new Error("New tags could not be saved in Supabase. Please run supabase-schema.sql again.")
    };
  }

  return supabaseClient
    .from("references")
    .insert(record);
}

async function updateReference(record, newTagsByCategory, code) {
  const { error } = await supabaseClient.rpc("update_reference", {
    p_id: record.id,
    p_code: code,
    p_image: record.image,
    p_source: record.source,
    p_title: record.title,
    p_tags: record.tags,
    p_new_tags: newTagsByCategory
  });

  if (!error) {
    mergeNewTagsIntoLocalGroups(newTagsByCategory);
  }

  return { error };
}

function createSubmitTagSelector() {
  const wrapper = document.getElementById("submitTagGroups");
  if (!wrapper) return;

  wrapper.innerHTML = "";

  getVisibleTagGroupNames().forEach(groupName => {
    const groupData = groupName === LOCATION_GROUP ? getLocationSections() : tagGroups[groupName];
    const group = document.createElement("div");
    group.className = "submit-tag-group";

    const title = document.createElement("h2");
    title.textContent = getCategoryLabel(groupName);
    group.appendChild(title);

    const buttons = document.createElement("div");
    buttons.className = "submit-tag-buttons";

    const sections = groupName === LOCATION_GROUP ? groupData : [flattenTags(groupData)];

    sections.forEach((section, index) => {
      const tags = [...new Set(section)].sort((a, b) =>
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

      if (groupName === LOCATION_GROUP && index < sections.length - 1) {
        const spacer = document.createElement("div");
        spacer.className = "tag-spacer";
        buttons.appendChild(spacer);
      }
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

  getSubmitCategoryOptions().forEach(({ value, label }) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
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
  if (parseSubmitCategoryValue(select.value) === "Author") {
    input.placeholder = "surname given name";
    return;
  }

  input.placeholder = "new-tag";
}

function getSubmitCategoryOptions() {
  return getVisibleTagGroupNames().flatMap(category => {
    if (category !== LOCATION_GROUP) {
      return [{ value: category, label: getCategoryLabel(category) }];
    }

    return [
      { value: LOCATION_COUNTRY_GROUP, label: LOCATION_COUNTRY_GROUP },
      { value: LOCATION_CITY_GROUP, label: LOCATION_CITY_GROUP },
      { value: LOCATION_LANDSCAPE_GROUP, label: LOCATION_LANDSCAPE_GROUP }
    ];
  });
}

function parseSubmitCategoryValue(value) {
  return LOCATION_SUBGROUPS.includes(value) ? value : value;
}

function getNewSubmitTagsByCategory() {
  const newTagsByCategory = {};

  document.querySelectorAll(".new-submit-tag-row").forEach(row => {
    const input = row.querySelector(".newSubmitTagInput");
    const select = row.querySelector(".newSubmitTagCategory");
    const tag = cleanTag(input.value);

    if (!tag) return;

    const category = parseSubmitCategoryValue(select.value);
    const existingTags = LOCATION_SUBGROUPS.includes(category)
      ? [...flattenTags(tagGroups[LOCATION_GROUP]), ...flattenTags(tagGroups[category])]
      : flattenTags(tagGroups[category]);

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

  tagGroups = organizeTagGroups(tagGroups);
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
  const normalizedName = String(name || "").trim().toLowerCase();
  return normalizedName === "alea"
    || normalizedName === "si jonathan trouvait ça, ce serait ouf.";
}

function buildSubmitTitle(formData) {
  const author = getFormValue(formData, "title_author");
  const project = getFormValue(formData, "title_project");

  return [author, project].filter(Boolean).join("  —  ");
}

function splitReferenceTitle(title) {
  const parts = String(title || "").split(/\s+—\s+/);

  return {
    author: parts[0] || "",
    project: parts.slice(1).join(" — ") || ""
  };
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
    el.textContent = "All references";
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

  document.querySelector(".filters")?.classList.add("open");

  document.querySelectorAll(".filters button").forEach(button => {
    if (button.dataset.tag !== tag) return;
    button.classList.add("selected");

    const group = button.parentElement?.closest(".filter-group");
    group?.classList.add("pinned");
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

  const label = count === 1 ? "reference" : "references";

  el.textContent = activeTags.length === 0
    ? `Filter ${count} ${label}`
    : `${count} ${label} found`;
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
