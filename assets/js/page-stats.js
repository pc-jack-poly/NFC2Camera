(() => {
  "use strict";

  const container = document.getElementById("page-stats");
  if (!container) return;

  const supabaseUrl = container.dataset.supabaseUrl.replace(/\/$/, "");
  const publishableKey = container.dataset.supabaseKey;
  if (!supabaseUrl || !publishableKey) {
    console.info("Page statistics are disabled: configure Supabase in _config.yml.");
    return;
  }

  const viewCount = document.getElementById("view-count");
  const likeCount = document.getElementById("like-count");
  const likeButton = document.getElementById("like-button");
  const status = document.getElementById("stats-status");
  const pageKey = location.pathname.replace(/\/+$/, "") || "/";
  const likedStorageKey = `page-liked:${pageKey}`;
  const numberFormatter = new Intl.NumberFormat();

  const callRpc = async (functionName) => {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${functionName}`, {
      method: "POST",
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ p_page_key: pageKey })
    });

    if (!response.ok) {
      throw new Error(`Statistics request failed (${response.status})`);
    }

    const result = await response.json();
    return Array.isArray(result) ? result[0] : result;
  };

  const render = (stats) => {
    viewCount.textContent = numberFormatter.format(stats.views);
    likeCount.textContent = numberFormatter.format(stats.likes);
  };

  const setLiked = () => {
    likeButton.setAttribute("aria-pressed", "true");
    likeButton.querySelector("[aria-hidden]").textContent = "♥";
    likeButton.disabled = true;
  };

  if (localStorage.getItem(likedStorageKey) === "true") setLiked();

  callRpc("increment_page_view")
    .then((stats) => {
      render(stats);
      container.hidden = false;
    })
    .catch((error) => {
      console.error(error);
    });

  likeButton.addEventListener("click", async () => {
    if (likeButton.disabled) return;

    likeButton.disabled = true;
    status.textContent = "";

    try {
      const stats = await callRpc("increment_page_like");
      render(stats);
      localStorage.setItem(likedStorageKey, "true");
      setLiked();
      status.textContent = "Thanks!";
      window.setTimeout(() => {
        status.textContent = "";
      }, 1800);
    } catch (error) {
      console.error(error);
      likeButton.disabled = false;
      status.textContent = "Could not save your like. Please try again.";
    }
  });
})();
