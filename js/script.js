// NASA Space Explorer

// PLACEHOLDER: paste your own key from https://api.nasa.gov here.
// DEMO_KEY works but is rate limited to about 30 requests an hour per IP.
const API_KEY = "TcQg6QJKbFDJMcfd9Tt8FgQDFDQqjKcpNMTKgW8b";
const API_URL = "https://api.nasa.gov/planetary/apod";

// Page elements
const startInput = document.getElementById("startDate");
const endInput = document.getElementById("endDate");
const getImagesBtn = document.getElementById("getImagesBtn");
const gallery = document.getElementById("gallery");
const loading = document.getElementById("loading");
const factText = document.getElementById("factText");

const modal = document.getElementById("modal");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalClose = document.getElementById("modalClose");
const modalMedia = document.getElementById("modalMedia");
const modalTitle = document.getElementById("modalTitle");
const modalDate = document.getElementById("modalDate");
const modalExplanation = document.getElementById("modalExplanation");

// Sets up the date pickers (from dateRange.js): 9 day default, 1995 to today
setupDateInputs(startInput, endInput);

/* =====================================================
   LevelUp: random space fact on load
   ===================================================== */
const SPACE_FACTS = [
  "A day on Venus is longer than its year. It takes 243 Earth days to spin once and 225 to orbit the Sun.",
  "Neutron stars are so dense that one teaspoon of the material would weigh about a billion tons.",
  "There are more trees on Earth than stars in the Milky Way, roughly three trillion against a few hundred billion.",
  "Space is completely silent. There is no atmosphere to carry sound waves.",
  "Jupiter's Great Red Spot is a storm that has been running for at least 350 years.",
  "The footprints left on the Moon will likely last millions of years, because there is no wind to erase them.",
  "Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.",
  "Saturn is less dense than water. If you had a bathtub big enough, it would float.",
  "One million Earths could fit inside the Sun.",
  "The hottest planet is Venus, not Mercury, because its thick atmosphere traps heat.",
];

function showRandomFact() {
  const index = Math.floor(Math.random() * SPACE_FACTS.length);
  factText.textContent = SPACE_FACTS[index];
}

showRandomFact();

/* =====================================================
   Formatting helpers
   ===================================================== */

// Turns "2026-04-18" into "April 18, 2026" without timezone drift
function formatDate(value) {
  const parts = value.split("-");
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function showLoading() {
  loading.classList.remove("hidden");
  gallery.innerHTML = "";
}

function hideLoading() {
  loading.classList.add("hidden");
}

function showMessage(icon, text) {
  gallery.innerHTML = "";

  const box = document.createElement("div");
  box.className = "placeholder";

  const iconEl = document.createElement("div");
  iconEl.className = "placeholder-icon";
  iconEl.textContent = icon;

  const textEl = document.createElement("p");
  textEl.textContent = text;

  box.appendChild(iconEl);
  box.appendChild(textEl);
  gallery.appendChild(box);
}

/* =====================================================
   Fetching the data
   ===================================================== */
async function getSpaceImages() {
  const start = startInput.value;
  const end = endInput.value;

  if (!start || !end) {
    showMessage("📅", "Pick a start date and an end date first.");
    return;
  }

  if (new Date(start) > new Date(end)) {
    showMessage("📅", "The start date has to come before the end date.");
    return;
  }

  showLoading();

  const url = `${API_URL}?api_key=${API_KEY}&start_date=${start}&end_date=${end}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("NASA returned " + response.status);
    }

    const data = await response.json();
    hideLoading();

    if (!data.length) {
      showMessage("🛰️", "No images came back for those dates. Try a different range.");
      return;
    }

    renderGallery(data);
  } catch (error) {
    hideLoading();
    console.error(error);
    showMessage("⚠️", "Could not reach NASA right now. Check your API key or try again in a minute.");
  }
}

/* =====================================================
   Building the gallery
   ===================================================== */
function renderGallery(items) {
  gallery.innerHTML = "";

  items.forEach(function (item) {
    const card = document.createElement("div");
    card.className = "gallery-item";
    card.tabIndex = 0;

    if (item.media_type === "video") {
      card.classList.add("is-video");

      // Some video entries ship a thumbnail, the rest get a placeholder tile
      if (item.thumbnail_url) {
        const thumb = document.createElement("img");
        thumb.src = item.thumbnail_url;
        thumb.alt = item.title;
        card.appendChild(thumb);
      } else {
        const fallback = document.createElement("div");
        fallback.className = "video-tile";
        fallback.textContent = "▶";
        card.appendChild(fallback);
      }

      const badge = document.createElement("span");
      badge.className = "video-badge";
      badge.textContent = "Video";
      card.appendChild(badge);
    } else {
      const img = document.createElement("img");
      img.src = item.url;
      img.alt = item.title;
      img.loading = "lazy";
      card.appendChild(img);
    }

    const title = document.createElement("p");
    title.className = "item-title";
    title.textContent = item.title;

    const date = document.createElement("p");
    date.className = "item-date";
    date.textContent = formatDate(item.date);

    card.appendChild(title);
    card.appendChild(date);

    card.addEventListener("click", function () {
      openModal(item);
    });

    card.addEventListener("keydown", function (event) {
      if (event.key === "Enter") openModal(item);
    });

    gallery.appendChild(card);
  });
}

/* =====================================================
   Modal
   ===================================================== */
function openModal(item) {
  modalMedia.innerHTML = "";

  if (item.media_type === "video") {
    // YouTube and Vimeo URLs embed directly, anything else gets a plain link
    if (item.url.includes("youtube.com") || item.url.includes("youtu.be") || item.url.includes("vimeo.com")) {
      const frame = document.createElement("iframe");
      frame.src = item.url;
      frame.title = item.title;
      frame.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture";
      frame.allowFullscreen = true;
      modalMedia.appendChild(frame);
    } else {
      const link = document.createElement("a");
      link.className = "video-link";
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "▶ Watch this video on NASA's source site";
      modalMedia.appendChild(link);
    }
  } else {
    const img = document.createElement("img");
    img.src = item.hdurl || item.url;
    img.alt = item.title;
    modalMedia.appendChild(img);
  }

  modalTitle.textContent = item.title;
  modalDate.textContent = formatDate(item.date);
  modalExplanation.textContent = item.explanation;

  modal.classList.remove("hidden");
  document.body.classList.add("no-scroll");
  modalClose.focus();
}

function closeModal() {
  modal.classList.add("hidden");
  document.body.classList.remove("no-scroll");
  modalMedia.innerHTML = ""; // stops a video that is still playing
}

/* =====================================================
   Events
   ===================================================== */
getImagesBtn.addEventListener("click", getSpaceImages);
modalClose.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", closeModal);

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && !modal.classList.contains("hidden")) {
    closeModal();
  }
});