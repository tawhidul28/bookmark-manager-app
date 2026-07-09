const bookmarkCon = document.getElementById("bookmarkCon");
const archiveCon = document.getElementById("archiveCon");
const sidebarTagCon = document.getElementById("sidebar-con");
const searchBer = document.getElementById("searchBer");
const addBookmark = document.getElementById("addBookmark");
const app = document.querySelector(".app");
const addBtn = document.getElementById("addBtn");
const modal = document.getElementById("modal");
const cancelBtn = document.getElementById("cancelBtn");
const closeBtn = document.getElementById("closeBtn");
const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const urlInput = document.getElementById("url");
const tagInput = document.getElementById("tag");
const count = document.getElementById("count");
const conTitle = document.getElementById("con-title")

let bookmarks = [];
let currentView = "home";
let currentSort = "recently-added";

function renderApp() {
  updateFilters();
}

function getDomainName(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (error) {}
}

function formatDate(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("en", { day: "2-digit", month: "short" });
}

searchBer.addEventListener("input", renderApp);
addBookmark.addEventListener("click", openModal);
closeBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);
descriptionInput.addEventListener("input", updateCounter);

function filterItems(items, searchText, selectedTags) {
  const search = searchText.trim().toLowerCase();
  return items.filter((item) => {
    const matchesSearch = !search || item.title.toLowerCase().includes(search);

    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((selectedTag) =>
        item.tags.some((itemTag) => itemTag.toUpperCase() === selectedTag),
      );
    return matchesSearch && matchesTags;
  });
}

function renderBookmark(items) {
  currentView==="home"?conTitle.textContent = "All Bookmarks":conTitle.textContent ="Archived bookmarks"
  
  bookmarkCon.innerHTML = "";
  if (items.length === 0) {
    bookmarkCon.innerHTML =
      '<div class="empty-state">No bookmarks found.</div>';
    return;
  }

  items.forEach((item) => {
    let tagHTML = item.tags
      .map((tag) => `<div class="tag">${tag.toUpperCase()}</div>`)
      .join(" ");

    const pinLabel = item.pinned ? "Unpin" : "Pin";
    const menuOptions = item.isArchived
      ? `<button class="menu-item" data-action="visit" data-id="${item.id}">Visit</button>
                    <button class="menu-item" data-action="copy-url" data-id="${item.id}">Copy URL</button>
                    <button class="menu-item" data-action="unarchive" data-id="${item.id}">Unarchive</button>
                    <button class="menu-item" data-action="delete" data-id="${item.id}">Delete permanently</button>`
      : `<button class="menu-item" data-action="visit" data-id="${item.id}">Visit</button>
                    <button class="menu-item" data-action="copy-url" data-id="${item.id}">Copy URL</button>
                    <button class="menu-item" data-action="${item.pinned ? "unpin" : "pin"}" data-id="${item.id}">${pinLabel}</button>
                    <button class="menu-item" data-action="edit" data-id="${item.id}">Edit</button>
                    <button class="menu-item" data-action="archive" data-id="${item.id}">Archive</button>`;

    bookmarkCon.innerHTML += `<div class="card">
            <div class="card-content">
              <div class="card-content-header">
              <div class="card-header-img-title">
                <img src=${item.favicon} alt="">
                <div class="info">
                  <span>${item.title}</span>
                  <span>${getDomainName(item.url)}</span>
                </div>
                </div>
                <div class="card-header-button">
                  <img src="images/icon-menu-bookmark.svg" alt="" class="menu-toggle pointer" data-action="toggle-menu" data-id="${item.id}">
                </div>
                <div class="menu hide" data-id="${item.id}">${menuOptions}</div>
              </div>
              <div class="divider"></div>
              <div class="card-content-body">${item.description}</div>
              <div class="card-content-tags">${tagHTML}</div>
            </div>
            <div class="card-footer">
              <div class="card-footer-info">
                <div class="views card-info-style">
                  <img src="images/icon-visit-count.svg" alt="">
                  <span>${item.visitCount}</span>
                </div>
                <div class="time card-info-style">
                  <img src="images/icon-last-visited.svg" alt="">
                  <span>${formatDate(item.lastVisited)}</span>
                </div>
                <div class="date card-info-style">
                  <img src="images/icon-created.svg" alt="">
                  <span>${formatDate(item.createdAt)}</span>
                </div>
              </div>
              <div class="pinned">
              ${item.isArchived ? "<span class='archived'>Archived</span>" : item.pinned ? `<img src="images/icon-pin.svg" alt="">` : ""}
              </div>
            </div>
          </div>`;
  });
}

window.addEventListener("click", (event) => {
  const toggle = event.target.closest('[data-action="toggle-menu"]');
  if (toggle) {
    event.stopPropagation();
    toggleMenu(toggle.dataset.id);
    return;
  }

  const actionButton = event.target.closest(".menu-item");
  if (actionButton) {
    event.stopPropagation();
    handleMenuAction(actionButton.dataset.action, actionButton.dataset.id);
    return;
  }
});

function togglePin(id) {
  const bookmark = bookmarks.find((item) => item.id === id);
  if (!bookmark) return;
  bookmark.pinned = !bookmark.pinned;
  updateFilters();
}

const toast = document.getElementById("toast");

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  toast.classList.remove("hide");
  setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hide");
  }, 2000);
}

function copyToClipboard(text) {
  const writePromise = navigator.clipboard?.writeText(text);
  if (writePromise) {
    showToast("✔️Link copied to clipboard.");
  }
}

function visitBookmark(id) {
  const bookmark = bookmarks.find((item) => item.id === id);
  if (!bookmark) return;
  window.open(bookmark.url, "_blank");
  bookmark.visitCount = (bookmark.visitCount || 0) + 1;
  bookmark.lastVisited = new Date().toISOString();
  updateFilters();
}

function togglePin(id) {
  const bookmark = bookmarks.find((item) => item.id === id);
  if (!bookmark) return;
  bookmark.pinned = !bookmark.pinned;
  updateFilters();
  showToast(`Bookmark ${bookmark.pinned ? "Pin to top" : "Unpin"}`);
}

function sortItems(items) {
  const sortedItems = [...items];
  sortedItems.sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }

    if (currentSort === "recently-visited") {
      const aVisited = a.lastVisited ? new Date(a.lastVisited).getTime() : 0;
      const bVisited = b.lastVisited ? new Date(b.lastVisited).getTime() : 0;
      return (
        bVisited - aVisited || new Date(b.createdAt) - new Date(a.createdAt)
      );
    }

    if (currentSort === "most-visited") {
      return (
        b.visitCount - a.visitCount ||
        new Date(b.createdAt) - new Date(a.createdAt)
      );
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return sortedItems;
}

const sortBtn = document.querySelector(".sort-con");
const sortDropdown = document.querySelector(".sortDropdown");
const sortOptions = document.querySelectorAll(".sortItem");

sortBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  sortDropdown.classList.toggle("hide");
});

function updateSortUI() {
  sortOptions.forEach((option) => {
    const isActive = option.dataset.sort === currentSort;
    option.classList.toggle("active", isActive);
  });
}

sortOptions.forEach((option) => {
  option.addEventListener("click", () => {
    currentSort = option.dataset.sort;
    updateSortUI();
    updateFilters();
    sortDropdown.classList.add("hide");
  });
});

const archiveConfirmModel = document.querySelector(".archiveModel-overlay");
const archiveCancleBtn = document.getElementById("archiveCancleBtn");
const archiveConfrimBtn = document.getElementById("archiveConfrimBtn");
const archiveCancleBtnCorner = document.getElementById(
  "archiveCancleBtnCorner",
);

const unArchiveConfirmModel = document.querySelector(".unArchiveModel-overlay");
const unArchiveCancleBtn = document.getElementById("unArchiveCancleBtn");
const unArchiveConfrimBtn = document.getElementById("unArchiveConfrimBtn");
const unArchiveCancleBtnCorner = document.getElementById(
  "unArchiveCancleBtnCorner",
);

const deleteConfirmModel = document.querySelector(".deleteModel-overlay");
const deleteCancleBtn = document.getElementById("deleteCancleBtn");
const deleteConfrimBtn = document.getElementById("deleteConfrimBtn");
const deleteCancleBtnCorner = document.getElementById("deleteCancleBtnCorner");

let pendingArchiveId = null;
let pendingDeleteId = null;
let pendingUnarchiveId = null;

// Archive
function showArchiveConfirm(id) {
  pendingArchiveId = id;
  if (archiveConfirmModel) {
    archiveConfirmModel.classList.remove("hide");
  }
}

function hideArchiveConfirm() {
  pendingArchiveId = null;
  if (archiveConfirmModel) {
    archiveConfirmModel.classList.add("hide");
  }
}

function confirmArchive() {
  if (!pendingArchiveId) return;
  archiveBookmark(pendingArchiveId);
  hideArchiveConfirm();
  showToast("Bookmark archived.");
}

function archiveBookmark(id) {
  const bookmark = bookmarks.find((item) => item.id === id);
  if (!bookmark) return;
  bookmark.isArchived = true;
  updateFilters();
}

// unarchive
function showUnarchiveConfirm(id) {
  pendingUnarchiveId = id;
  if (unArchiveConfirmModel) {
    unArchiveConfirmModel.classList.remove("hide");
  }
}

function hideUnarchiveConfirm() {
  pendingUnarchiveId = null;
  if (unArchiveConfirmModel) {
    unArchiveConfirmModel.classList.add("hide");
  }
}

function confirmUnarchive() {
  if (!pendingUnarchiveId) return;
  unarchiveBookmark(pendingUnarchiveId);
  hideUnarchiveConfirm();
  showToast("Bookmark restored.");
}

function unarchiveBookmark(id) {
  const bookmark = bookmarks.find((item) => item.id === id);
  if (!bookmark) return;
  bookmark.isArchived = false;
  updateFilters();
}

// Delete

function showDeleteConfirm(id) {
  pendingDeleteId = id;
  if (deleteConfirmModel) {
    deleteConfirmModel.classList.remove("hide");
  }
}

function hideDeleteConfirm() {
  pendingDeleteId = null;
  if (deleteConfirmModel) {
    deleteConfirmModel.classList.add("hide");
  }
}

function deleteBookmark(id) {
  bookmarks = bookmarks.filter((item) => item.id !== id);
  console.log("d");
  updateFilters();
}

function confirmDelete() {
  if (!pendingDeleteId) return;
  deleteBookmark(pendingDeleteId);
  hideDeleteConfirm();
}

const addBookmarkTitle = document.getElementById("addBookmarkTitle");
const addBookmarkSubitle = document.getElementById("addBookmarkSubitle");

function editBookmark(id) {
  addBookmarkTitle.textContent = "Edit bookmark";
  addBookmarkSubitle.textContent =
    "Update your saved link details — change the title, description, URL, or tags anytime.";
  const bookmark = bookmarks.find((item) => item.id === id);
  if (!bookmark) return;
  closeModal();
  modal.style.display = "flex";
  // app.style.display = "none"
  addModelOverlay.classList.remove("hide");
  titleInput.value = bookmark.title;
  descriptionInput.value = bookmark.description;
  urlInput.value = bookmark.url;
  tagInput.value = bookmark.tags.join(", ");
  addBtn.textContent = "Save";
  addBtn.dataset.editId = id;
}

function clearEditMode() {
  delete addBtn.dataset.editId;
  addBtn.textContent = "Add Bookmark";
}

function handleMenuAction(action, id) {
  if (action === "visit") {
    visitBookmark(id);
  }
  if (action === "copy-url") {
    const bookmark = bookmarks.find((item) => item.id === id);
    if (bookmark) copyToClipboard(bookmark.url);
  }
  if (action === "pin" || action === "unpin") {
    togglePin(id);
  }
  if (action === "edit") {
    editBookmark(id);
  }
  if (action === "archive") {
    const bookmark = bookmarks.find((item) => item.id === id);
    if (!bookmark) return;
    if (bookmark.isArchived) {
      unarchiveBookmark(id);
    } else {
      showArchiveConfirm(id);
    }
  }
  if (action === "unarchive") {
    showUnarchiveConfirm(id);
  }
  if (action === "delete") {
    showDeleteConfirm(id);
  }
}

archiveConfrimBtn.addEventListener("click", () => {
  confirmArchive();
});
archiveCancleBtn.addEventListener("click", () => {
  hideArchiveConfirm();
});
archiveCancleBtnCorner.addEventListener("click", () => {
  hideArchiveConfirm();
});

unArchiveConfrimBtn.addEventListener("click", () => {
  confirmUnarchive();
});
unArchiveCancleBtn.addEventListener("click", () => {
  hideUnarchiveConfirm();
});
unArchiveCancleBtnCorner.addEventListener("click", () => {
  hideUnarchiveConfirm();
});

deleteConfrimBtn.addEventListener("click", () => {
  confirmDelete();
});
deleteCancleBtn.addEventListener("click", () => {
  hideDeleteConfirm();
});
deleteCancleBtnCorner.addEventListener("click", () => {
  hideDeleteConfirm();
});

function toggleMenu(id) {
  document.querySelectorAll(".menu").forEach((menu) => {
    if (menu.dataset.id === id) {
      menu.classList.toggle("hide");
    } else {
      menu.classList.add("hide");
    }
  });
}

const archiveBtn = document.getElementById("archive");
archiveBtn.addEventListener("click", () => {
  currentView = "archive";
  bookmarkCon.innerHTML = "";
  updateFilters();
  archiveBtn.classList.add("active");
  homeBtn.classList.remove("active");
});

const homeBtn = document.getElementById("home");
homeBtn.addEventListener("click", () => {
  currentView = "home";
  archiveCon.innerHTML = "";
  updateFilters();
  homeBtn.classList.add("active");
  archiveBtn.classList.remove("active");
});

function renderSidebarTags(items) {
  sidebarTagCon.innerHTML = "";
  const tagCount = items.reduce((countObj, item) => {
    (item.tags || []).forEach((tag) => {
      countObj[tag.toUpperCase()] = (countObj[tag.toUpperCase()] || 0) + 1;
    });
    return countObj;
  }, {});

  const sortedTags = Object.entries(tagCount).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  sidebarTagCon.innerHTML = `<div class="subheading-wrapper">
              <span class="subheading">TAGS</span>
              <span class="reset hide pointer" id="resetBtn">Reset</span>
            </div>`;

  sortedTags.forEach(([tag, count]) => {
    sidebarTagCon.innerHTML += `<div class="nav-item-base">
      <div class="content">
        <div class="text-and-icon">
          <input type="checkbox" class="ckBox" name="" id="${tag}">
          <label for="${tag}">${tag}</label>
        </div>
        <div class="badge">${count}</div>
      </div>
    </div>`;
  });
}

function updateFilters() {
  const selectedTags = Array.from(
    document.querySelectorAll(".ckBox:checked"),
  ).map((item) => item.nextElementSibling.textContent);
  const resetBtn = document.getElementById("resetBtn");

  if (resetBtn) {
    resetBtn.classList.toggle("hide", selectedTags.length === 0);
    resetBtn.addEventListener("click", () => {
      document
        .querySelectorAll(".ckBox")
        .forEach((ckbox) => (ckbox.checked = false));
      updateFilters();
    });
  }

  const viewItems =
    currentView === "archive"
      ? bookmarks.filter((item) => item.isArchived)
      : bookmarks.filter((item) => !item.isArchived);

  let filteredItems = filterItems(viewItems, searchBer.value, selectedTags);
  let sortedItems = sortItems(filteredItems);
  renderBookmark(sortedItems);
}

fetch("data.json")
  .then((response) => response.json())
  .then((data) => {
    bookmarks = data.bookmarks;
    renderApp();
    renderSidebarTags(bookmarks);

    sidebarTagCon.addEventListener("change", (e) => {
      if (!e.target.matches(".ckBox")) return;
      updateFilters();
    });
  });

function updateCounter() {
  count.textContent = descriptionInput.value.length;
}

const addModelOverlay = document.querySelector(".add-model-overlay");
function openModal() {
  clearEditMode();
  addBookmarkTitle.textContent = "Add a Bookmark";
  addBookmarkSubitle.textContent =
    "Save a link with details to keep your collection organized.";
  modal.style.display = "flex";
  // app.style.display = "none";
  addModelOverlay.classList.remove("hide");
  document.body.style.backgroundColor = "#E8F0EF";
}

function closeModal() {
  modal.style.display = "none";
  // app.style.display = "flex";
  addModelOverlay.classList.add("hide");
  document.body.style.backgroundColor = "#FFFFFF";
  titleInput.value = "";
  descriptionInput.value = "";
  urlInput.value = "";
  tagInput.value = "";
  updateCounter();
}

addBtn.addEventListener("click", () => {
  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  const urlValue = urlInput.value.trim();
  const tags = tagInput.value.split(",").map((tag) => tag.trim());

  if (!title || !description || !urlValue || tags.length === 0) {
    alert("Please fill in all required fields.");
    return;
  }

  const url = urlValue.match(/^https?:\/\//i)
    ? urlValue
    : `https://${urlValue}`;

  const editId = addBtn.dataset.editId;
  if (editId) {
    const bookmark = bookmarks.find((item) => item.id === editId);
    if (bookmark) {
      bookmark.title = title;
      bookmark.description = description;
      bookmark.url = url;
      bookmark.tags = tags;
    }
    showToast("✔️ Changes saved.");
  } else {
    const newBookmark = {
      id: `bm-${Date.now()}`,
      title,
      url,
      favicon: "images/default-favicon.png",
      description,
      tags,
      pinned: false,
      isArchived: false,
      visitCount: 0,
      createdAt: new Date().toISOString(),
      lastVisited: new Date().toDateString(),
    };

    bookmarks.unshift(newBookmark);
    showToast("✔️ Bookmark added successfully.");
  }

  renderApp();
  closeModal();
  renderSidebarTags(bookmarks);
});


const avater = document.querySelector(".avater")
const profileMenu = document.querySelector(".profileMenu")

avater.addEventListener("click",()=>{
  profileMenu.classList.toggle("hide")
})