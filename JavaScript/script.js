const API = "https://phi-lab-server.vercel.app/api/v1/lab/issues";

// Check authentication
if (!localStorage.getItem("isLoggedIn")) {
  window.location.href = "index.html";
}

// DOM Elements
const container = document.getElementById("issuesContainer");
const loader = document.getElementById("loader");
const emptyState = document.getElementById("emptyState");
const issueCountEl = document.getElementById("issueCount");
const openCountEl = document.getElementById("openCount");
const closedCountEl = document.getElementById("closedCount");
const filterTabs = document.querySelectorAll(".filter-tab");
const newIssueModal = document.getElementById("newIssueModal");
const issueModal = document.getElementById("issueModal");

let allIssuesData = [];
let currentFilter = "all";

/**
 * Load issues from API
 */
async function loadIssues(status = "all") {
  currentFilter = status;
  container.innerHTML = "";
  emptyState.classList.add("hidden");
  loader.classList.remove("hidden");

  try {
    const res = await fetch(API);
    const data = await res.json();

    allIssuesData = data.data || [];

    // Update counters
    updateCounters();

    // Update tab styling
    updateTabStyles(status);

    // Filter issues
    let issues = allIssuesData;
    if (status !== "all") {
      issues = issues.filter((issue) => issue.status === status);
    }

    // Display issues
    if (issues.length === 0) {
      emptyState.classList.remove("hidden");
    } else {
      displayIssues(issues);
    }
  } catch (error) {
    console.error("Error loading issues:", error);
    container.innerHTML = `
      <div class="col-span-full text-center py-10">
        <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
        <p class="text-gray-600">Failed to load issues. Please try again.</p>
      </div>
    `;
  } finally {
    loader.classList.add("hidden");
  }
}

/**
 * Update issue counters
 */
function updateCounters() {
  const totalIssues = allIssuesData.length;
  const openIssues = allIssuesData.filter((i) => i.status === "open").length;
  const closedIssues = allIssuesData.filter(
    (i) => i.status === "closed",
  ).length;

  issueCountEl.textContent = `${totalIssues} ${totalIssues === 1 ? "Issue" : "Issues"}`;
  openCountEl.textContent = openIssues;
  closedCountEl.textContent = closedIssues;
}

/**
 * Update tab styling
 */
function updateTabStyles(activeStatus) {
  filterTabs.forEach((tab, index) => {
    const tabText = tab.textContent.trim().toLowerCase();
    const isActive =
      tabText === activeStatus || (activeStatus === "all" && tabText === "all");

    if (isActive) {
      tab.classList.add("bg-[#4A00FF]", "border-[#4A00FF]");
      tab.classList.remove("border-[#E4E4E7]", "bg-white");
      const span = tab.querySelector("span");
      if (span) {
        span.classList.add("text-white");
        span.classList.remove("text-[#64748B]");
      }
    } else {
      tab.classList.remove("bg-[#4A00FF]", "border-[#4A00FF]");
      tab.classList.add("border-[#E4E4E7]", "bg-white");
      const span = tab.querySelector("span");
      if (span) {
        span.classList.remove("text-white");
        span.classList.add("text-[#64748B]");
      }
    }
  });
}

/**
 * Display issues as cards
 */
function displayIssues(issues) {
  container.innerHTML = "";

  issues.forEach((issue) => {
    const card = createIssueCard(issue);
    container.appendChild(card);
  });
}

/**
 * Create issue card element
 */
function createIssueCard(issue) {
  const card = document.createElement("div");
  card.className = "issue-card";

  // Parse labels with styling
  const labels = Array.isArray(issue.labels)
    ? issue.labels
    : issue.labels
      ? [issue.labels]
      : [];

  const labelsHTML = labels
    .map((label) => {
      const labelLower = label.toLowerCase();
      const colorMap = {
        bug: {
          bg: "#FEECEC",
          border: "#FECACA",
          text: "#EF4444",
        },
        enhancement: {
          bg: "#F0E2FF",
          border: "#E9D5FF",
          text: "#10B981",
        },
        "help wanted": {
          bg: "#FFF6D1",
          border: "#FDE68A",
          text: "#D97706",
        },
        documentation: {
          bg: "#DBEAFE",
          border: "#BFDBFE",
          text: "#3B82F6",
        },
        "good first issue": {
          bg: "#ECFDF5",
          border: "#BBFAB0",
          text: "#059669",
        },
      };
      const colors = colorMap[labelLower] || colorMap["bug"];
      const iconHTML = getLabelIconHTML(label);
      return `<span class="inline-flex items-center gap-0.5 rounded-full border px-2.5 py-1 text-[12px] font-medium uppercase leading-tight whitespace-nowrap flex-shrink-0" style="background-color: ${colors.bg}; border-color: ${colors.border}; color: ${colors.text};">${iconHTML}${label}</span>`;
    })
    .join("");

  // Get status color
  const statusClass = issue.status === "open" ? "open" : "closed";
  const statusIcon = issue.status === "open" ? "circle" : "check-circle";

  // Get priority color
  const priorityClass = `priority-${issue.priority.toLowerCase()}`;

  // Format date
  const dateObj = new Date(issue.createdAt);
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });

  card.innerHTML = `
    <div class="issue-card-header">
      <div class="flex items-start gap-2 flex-1">
        <img src="./assets/${issue.status === "open" ? "OpenSign.svg" : "ClosedSign.svg"}" alt="${issue.status}" class="h-6 w-6 flex-shrink-0" />
      </div>
      <span class="priority-badge ${priorityClass}">${issue.priority.toUpperCase()}</span>
    </div>
    <h3 class="issue-title">${escapeHtml(issue.title)}</h3>
    <p class="issue-description">${escapeHtml(issue.description || "")}</p>

    ${labelsHTML ? `<div class="flex flex-wrap items-center gap-0.5">${labelsHTML}</div>` : ""}

    <div class="issue-footer">
      <div class="issue-meta">
        <span class="issue-number">#${issue.id}</span>
        <span class="text-gray-500">by ${escapeHtml(issue.author)}</span>
      </div>
      <span class="text-gray-500">${formattedDate}</span>
    </div>
  `;

  card.addEventListener("click", () => {
    openIssueModal(issue.id);
  });

  return card;
}

/**
 * Get label CSS class
 */
function getLabelClass(label) {
  const labelMap = {
    bug: "label-bug",
    enhancement: "label-enhancement",
    "help wanted": "label-help-wanted",
    documentation: "label-documentation",
    "good first issue": "label-good-first-issue",
  };
  return labelMap[label.toLowerCase()] || "label-default";
}

/**
 * Get label icon HTML (supports both SVG and Font Awesome)
 */
function getLabelIconHTML(label) {
  const labelLower = label.toLowerCase();
  if (labelLower === "documentation") {
    return '<i class="fa-solid fa-file-code" style="width: 1rem; height: 1rem; margin-right: 0.125rem;"></i>';
  } else if (labelLower === "good first issue") {
    return '<i class="fa-solid fa-star" style="width: 1rem; height: 1rem; margin-right: 0.125rem;"></i>';
  } else {
    const iconFile = getLabelIcon(label);
    return `<img src="./assets/${iconFile}" alt="${label}" class="h-4 w-4" />`;
  }
}

/**
 * Get label icon file name (for SVG icons)
 */
function getLabelIcon(label) {
  const iconMap = {
    bug: "BugDroid.svg",
    enhancement: "EnhanceMent.svg",
    "help wanted": "HelpWanted.svg",
    documentation: "documentation.svg",
  };
  return iconMap[label.toLowerCase()] || "documentation.svg";
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Open issue detail modal
 */
async function openIssueModal(id) {
  try {
    let issue = null;

    // First try to get from API
    try {
      const res = await fetch(
        `https://phi-lab-server.vercel.app/api/v1/lab/issue/${id}`,
      );
      if (res.ok) {
        const data = await res.json();
        issue = data.data;
      }
    } catch (e) {
      console.log("API fetch failed, checking local data");
    }

    // If not found in API, check local data
    if (!issue) {
      issue = allIssuesData.find((i) => i.id === id || i.id === parseInt(id));
      if (!issue) {
        alert("Issue not found");
        return;
      }
    }

    // Set modal content
    document.getElementById("modalTitle").textContent = issue.title;
    document.getElementById("modalDescription").textContent =
      issue.description || "";
    document.getElementById("modalStatusText").textContent =
      issue.status.charAt(0).toUpperCase() + issue.status.slice(1);
    document.getElementById("modalAuthor").textContent = issue.author;

    // Format date
    const dateObj = new Date(issue.createdAt);
    const formattedDate = dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    document.getElementById("modalDate").textContent = formattedDate;
    document.getElementById("modalAuthorInfo").textContent = issue.author;

    // Set priority badge
    const priorityBadge = document.getElementById("modalPriority");
    const priorityClass = `priority-${issue.priority.toLowerCase()}`;
    priorityBadge.textContent = issue.priority.toUpperCase();
    priorityBadge.className = `${priorityClass} inline-block px-3 py-1.5 rounded-full text-xs font-semibold`;

    // Set labels
    const labelContainer = document.getElementById("modalLabel");
    labelContainer.innerHTML = "";
    const labels = Array.isArray(issue.labels)
      ? issue.labels
      : issue.labels
        ? [issue.labels]
        : [];

    if (labels.length > 0) {
      labels.forEach((label) => {
        const labelClass = getLabelClass(label);
        const iconHTML = getLabelIconHTML(label);
        const labelEl = document.createElement("span");
        labelEl.className = `label-badge ${labelClass}`;
        labelEl.innerHTML = `${iconHTML}${label.toUpperCase()}`;
        labelContainer.appendChild(labelEl);
      });
    }

    issueModal.showModal();
  } catch (error) {
    console.error("Error loading issue details:", error);
    alert("Failed to load issue details");
  }
}

/**
 * Open new issue modal
 */
function openNewIssueModal() {
  document.getElementById("newIssueTitle").value = "";
  document.getElementById("newIssueDesc").value = "";
  document.getElementById("newIssuePriority").value = "MEDIUM";
  document.getElementById("newIssueStatus").value = "open";
  document.getElementById("newIssueModal").showModal();
}

/**
 * Create new issue
 */
async function createNewIssue() {
  const title = document.getElementById("newIssueTitle").value.trim();
  const description = document.getElementById("newIssueDesc").value.trim();
  const priority = document.getElementById("newIssuePriority").value;
  const status = document.getElementById("newIssueStatus").value;

  if (!title) {
    alert("Please enter a title");
    return false;
  }

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        description,
        priority,
        status,
        author: localStorage.getItem("username") || "Anonymous",
      }),
    });

    if (res.ok) {
      const data = await res.json();
      document.getElementById("newIssueModal").close();
      await loadIssues(currentFilter);
      alert("Issue created successfully!");
    } else {
      // If API fails, create issue temporarily in local data
      console.warn("API response not ok, creating issue locally");
      const newIssue = {
        id: Math.floor(Math.random() * 10000),
        title,
        description,
        priority: priority.toLowerCase(),
        status,
        labels: ["enhancement"],
        author: localStorage.getItem("username") || "Anonymous",
        createdAt: new Date().toISOString(),
      };

      allIssuesData.unshift(newIssue);
      document.getElementById("newIssueModal").close();

      await new Promise((resolve) => setTimeout(resolve, 300));
      updateCounters();
      updateTabStyles(currentFilter);
      displayIssues(
        allIssuesData.filter(
          (issue) => currentFilter === "all" || issue.status === currentFilter,
        ),
      );
      alert("Issue created successfully!");
    }
  } catch (error) {
    console.error("Error creating issue:", error);
    // Create issue temporarily even on error
    const newIssue = {
      id: Math.floor(Math.random() * 10000),
      title,
      description,
      priority: priority.toLowerCase(),
      status,
      labels: ["enhancement"],
      author: localStorage.getItem("username") || "Anonymous",
      createdAt: new Date().toISOString(),
    };

    allIssuesData.unshift(newIssue);
    document.getElementById("newIssueModal").close();

    await new Promise((resolve) => setTimeout(resolve, 300));
    updateCounters();
    updateTabStyles(currentFilter);
    displayIssues(
      allIssuesData.filter(
        (issue) => currentFilter === "all" || issue.status === currentFilter,
      ),
    );
    alert("Issue created successfully!");
  }

  return false;
}

/**
 * Live search with suggestions
 */
async function liveSearch() {
  const text = document.getElementById("searchInput").value.trim();
  const suggestionsDiv = document.getElementById("searchSuggestions");

  if (text === "") {
    suggestionsDiv.classList.add("hidden");
    return;
  }

  try {
    const res = await fetch(
      `https://phi-lab-server.vercel.app/api/v1/lab/issues/search?q=${encodeURIComponent(text)}`,
    );
    const data = await res.json();

    if (data.data && data.data.length > 0) {
      suggestionsDiv.innerHTML = data.data
        .slice(0, 5)
        .map(
          (issue) => `
        <div 
          class="px-4 py-3 border-b border-[#E4E4E7] hover:bg-[#F8FAFC] cursor-pointer transition-colors"
          onclick="selectSuggestion('${escapeHtml(issue.title)}', ${issue.id})"
        >
          <div class="text-sm font-medium text-[#1F2937]">${escapeHtml(issue.title)}</div>
          <div class="text-xs text-[#64748B] mt-1">
            <span class="inline-block px-2 py-0.5 rounded text-[10px] ${
              issue.status === "open"
                ? "bg-[#CBFADB] text-[#00A96E]"
                : "bg-[#F0E2FF] text-[#A855F7]"
            } mr-2">
              ${issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
            </span>
            #${issue.id}
          </div>
        </div>
      `,
        )
        .join("");
      suggestionsDiv.classList.remove("hidden");
    } else {
      suggestionsDiv.innerHTML = `
        <div class="px-4 py-3 text-center text-sm text-[#64748B]">
          No issues found
        </div>
      `;
      suggestionsDiv.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Error in live search:", error);
    suggestionsDiv.classList.add("hidden");
  }
}

/**
 * Select suggestion and perform search
 */
function selectSuggestion(title, id) {
  document.getElementById("searchInput").value = title;
  document.getElementById("searchSuggestions").classList.add("hidden");
  searchIssue();
}

/**
 * Search issues
 */
async function searchIssue() {
  const text = document.getElementById("searchInput").value.trim();
  const suggestionsDiv = document.getElementById("searchSuggestions");

  suggestionsDiv.classList.add("hidden");

  if (text === "") {
    loadIssues(currentFilter);
    return;
  }

  loader.classList.remove("hidden");
  emptyState.classList.add("hidden");

  try {
    const res = await fetch(
      `https://phi-lab-server.vercel.app/api/v1/lab/issues/search?q=${encodeURIComponent(
        text,
      )}`,
    );
    const data = await res.json();

    if (data.data && data.data.length > 0) {
      displayIssues(data.data);
    } else {
      emptyState.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Error searching issues:", error);
    alert("Failed to search issues");
  } finally {
    loader.classList.add("hidden");
  }
}

// Initialize
loadIssues();

// Close search suggestions when clicking outside
document.addEventListener("click", function (event) {
  const searchInput = document.getElementById("searchInput");
  const suggestionsDiv = document.getElementById("searchSuggestions");

  // Close if clicking outside the search area
  if (
    !searchInput.contains(event.target) &&
    !suggestionsDiv.contains(event.target)
  ) {
    suggestionsDiv.classList.add("hidden");
  }
});
