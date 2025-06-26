<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import API from "$lib/api/api.js";
  import { user } from "$lib/stores/user";

  interface Figure {
    id: number;
    title: string;
    summary?: string;
    sport_id: number;
    position?: number;
    created_at: string;
    updated_at?: string;
    pictures?: Picture[];
  }

  interface Picture {
    id: number;
    image_url: string;
    caption?: string;
    cover: boolean;
    created_at: string;
  }

  interface SearchResult {
    title: string;
    link: string;
    snippet: string;
    image: {
      thumbnailLink: string;
      contextLink: string;
    };
  }

  let figure: Figure | null = null;
  let loading = true;
  let error: string | null = null;
  let generatingImages = false;
  let searchResults: SearchResult[] = [];
  let settingCover: number | null = null;
  let cardErrors: Record<number, string> = {};
  let deletingPicture: number | null = null;
  let moveMode = false;
  let imageOffset = 0;
  let startY = 0;
  let startOffset = 0;
  let blurbs: Array<{
    id: number;
    title: string;
    description: string;
    starred: boolean;
    blurbable_type: string;
    blurbable_id: number;
  }> = [];
  let blurbsLoading = false;
  let blurbsError = "";

  const GOOGLE_API_KEY = "AIzaSyBtWG38u4C0YW1XHkHVimVdLCbu_Wwi6H4";
  // You need to create a Custom Search Engine at https://cse.google.com/
  // and replace this with your actual Search Engine ID
  const SEARCH_ENGINE_ID = "b7571604c5c1c4c9e";

  async function loadFigure() {
    loading = true;
    error = null;
    try {
      figure = await API.get(`/figures/${$page.params.id}`);
    } catch (err) {
      error = "Failed to load figure";
      console.error(err);
    } finally {
      loading = false;
    }
  }

  function goBack() {
    goto("/");
  }

  async function generateImages() {
    if (!figure) return;

    generatingImages = true;
    error = null;

    try {
      const searchQuery = figure.title;

      // Try Google Custom Search first if Search Engine ID is configured
      if (SEARCH_ENGINE_ID) {
        const params = new URLSearchParams({
          key: GOOGLE_API_KEY,
          cx: SEARCH_ENGINE_ID,
          q: searchQuery,
          searchType: "image",
          num: "10",
          imgSize: "large",
          imgType: "photo",
          safe: "active",
        });

        const googleUrl = `https://customsearch.googleapis.com/customsearch/v1?${params.toString()}`;

        const response = await fetch(googleUrl);
        const data = await response.json();

        if (data.items && !data.error) {
          searchResults = data.items.map((item: any) => ({
            title: item.title || "Image",
            link: item.link,
            snippet: item.snippet || "Generated image",
            image: {
              thumbnailLink: item.image?.thumbnailLink || item.link,
              contextLink: item.image?.contextLink || item.link,
            },
          }));
          return;
        } else if (data.error) {
          console.error("Google API Error:", data.error);
          // Continue to fallback
        }
      }

      // Fallback to Unsplash public service
      console.log("Using fallback image service for:", figure.title);
      searchResults = [
        {
          title: `${figure.title} - Generated Image 1`,
          link: `https://source.unsplash.com/800x600/?${encodeURIComponent(figure.title)}`,
          snippet: `High-quality image for ${figure.title}`,
          image: {
            thumbnailLink: `https://source.unsplash.com/400x300/?${encodeURIComponent(figure.title)}`,
            contextLink: `https://source.unsplash.com/800x600/?${encodeURIComponent(figure.title)}`,
          },
        },
        {
          title: `${figure.title} - Sports Image`,
          link: `https://source.unsplash.com/800x600/?${encodeURIComponent(figure.title + " sports")}`,
          snippet: `Sports-related image for ${figure.title}`,
          image: {
            thumbnailLink: `https://source.unsplash.com/400x300/?${encodeURIComponent(figure.title + " sports")}`,
            contextLink: `https://source.unsplash.com/800x600/?${encodeURIComponent(figure.title + " sports")}`,
          },
        },
        {
          title: `${figure.title} - Athlete Image`,
          link: `https://source.unsplash.com/800x600/?${encodeURIComponent(figure.title + " athlete")}`,
          snippet: `Athlete image for ${figure.title}`,
          image: {
            thumbnailLink: `https://source.unsplash.com/400x300/?${encodeURIComponent(figure.title + " athlete")}`,
            contextLink: `https://source.unsplash.com/800x600/?${encodeURIComponent(figure.title + " athlete")}`,
          },
        },
        {
          title: `${figure.title} - Professional Image`,
          link: `https://source.unsplash.com/800x600/?${encodeURIComponent(figure.title + " professional")}`,
          snippet: `Professional image for ${figure.title}`,
          image: {
            thumbnailLink: `https://source.unsplash.com/400x300/?${encodeURIComponent(figure.title + " professional")}`,
            contextLink: `https://source.unsplash.com/800x600/?${encodeURIComponent(figure.title + " professional")}`,
          },
        },
      ];
    } catch (err) {
      console.error("Error generating images:", err);
      error = "Error generating images. Please try again.";
      searchResults = [];
    } finally {
      generatingImages = false;
    }
  }

  async function setAsCover(imageUrl: string, index: number) {
    if (!figure) return;

    settingCover = index;
    cardErrors[index] = ""; // Clear any previous error for this card

    try {
      // Download the image from the URL
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error("Failed to download image");
      }

      const blob = await response.blob();
      const file = new File([blob], `cover-image-${Date.now()}.jpg`, {
        type: blob.type,
      });

      // Create FormData and send to backend
      const formData = new FormData();
      formData.append("file", file);

      const result = await API.post(
        `/figures/${figure.id}/upload_picture`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Cover image uploaded successfully:", result);

      // Reload the figure to get updated pictures
      await loadFigure();

      // Clear any error for this card
      cardErrors[index] = "";
      cardErrors = { ...cardErrors }; // Trigger reactivity
    } catch (err) {
      console.error("Error setting cover image:", err);
      cardErrors[index] = "Error setting cover image. Please try again.";
      cardErrors = { ...cardErrors }; // Trigger reactivity
    } finally {
      settingCover = null;
    }
  }

  async function deletePicture(pictureId: number) {
    if (!figure) return;

    deletingPicture = pictureId;
    error = null;

    try {
      await API.delete(`/pictures/${pictureId}`);
      console.log("Picture deleted successfully");

      // Reload the figure to get updated pictures
      await loadFigure();
    } catch (err) {
      console.error("Error deleting picture:", err);
      error = "Error deleting picture. Please try again.";
    } finally {
      deletingPicture = null;
    }
  }

  async function generateBlurbs() {
    if (!figure) return;
    blurbsLoading = true;
    blurbsError = "";
    try {
      const result = await API.post(`/blurbs/for/Figure/${figure.id}/wizard`, {
        blurbable_type: "Figure",
        blurbable_id: figure.id,
      });
      blurbs = result.blurbs || result;
    } catch (err) {
      blurbsError = "Failed to generate blurbs.";
      console.error("Failed to generate blurbs:", err);
    } finally {
      blurbsLoading = false;
    }
  }

  async function fetchBlurbs() {
    if (!figure) return;
    blurbsLoading = true;
    blurbsError = "";
    try {
      const result = await API.get(`/blurbs/for/Figure/${figure.id}`);
      blurbs = result.blurbs || result;
    } catch (err) {
      blurbsError = "Failed to load blurbs.";
      console.error("Failed to load blurbs:", err);
    } finally {
      blurbsLoading = false;
    }
  }

  function startMove(event: MouseEvent | TouchEvent) {
    moveMode = true;
    startY = (event as TouchEvent).touches
      ? (event as TouchEvent).touches[0].clientY
      : (event as MouseEvent).clientY;
    startOffset = imageOffset;
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", endMove);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", endMove);
  }

  function onMove(event: MouseEvent | TouchEvent) {
    if (!moveMode) return;
    const y = (event as TouchEvent).touches
      ? (event as TouchEvent).touches[0].clientY
      : (event as MouseEvent).clientY;
    imageOffset = startOffset + (y - startY);
  }

  function endMove() {
    moveMode = false;
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", endMove);
    window.removeEventListener("touchmove", onMove);
    window.removeEventListener("touchend", endMove);
  }

  // Fetch blurbs for the figure on mount or when figure.id changes
  $: if (figure && figure.id) {
    fetchBlurbs();
  }

  // Reactive statement to reload figure when route params change
  $: if ($page.params.id) {
    loadFigure();
  }
</script>

<svelte:head>
  <title>{figure?.title || "Figure"} - ScoreFeel</title>
</svelte:head>

<div class="figure-page">
  {#if loading}
    <div class="loading">Loading figure information...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else if figure}
    {#if $user && $user.admin}
      <div class="figure-blurbs-bar">
        <button
          class="generate-blurbs-btn"
          on:click={generateBlurbs}
          disabled={blurbsLoading}
        >
          {#if blurbsLoading}
            <span class="loading-spinner-small"></span> Generating Blurbs...
          {:else}
            💡 Generate Fact Blurbs
          {/if}
        </button>
        {#if blurbsError}
          <span class="blurbs-error">{blurbsError}</span>
        {/if}
        {#if blurbs && blurbs.length > 0}
          <div class="blurbs-list">
            {#each blurbs as blurb}
              <span
                class="blurb-pill {blurb.starred ? 'starred' : ''}"
                title={blurb.description}
              >
                {blurb.title}
              </span>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
    <!-- Image Header -->
    <div class="figure-header">
      <div class="header-image">
        <img
          src={figure.pictures?.find((p) => p.cover)?.image_url ||
            `https://placehold.co/1200x400/1a1a1a/ffffff?text=${figure.title.split(" ").join("+")}`}
          alt={figure.title}
        />
        <div class="header-overlay">
          <!-- <button class="back-btn" on:click={goBack}> ← Back to Home </button> -->
          <h1>{figure.title}</h1>
        </div>
      </div>
    </div>

    <div class="figure-content">
      <div class="figure-details">
        {#if $user && $user.admin}
          <div class="figure-meta">
            <div class="meta-item">
              <span class="meta-label">Figure ID:</span>
              <span class="meta-value">{figure.id}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Sport ID:</span>
              <span class="meta-value">{figure.sport_id}</span>
            </div>
            {#if figure.position}
              <div class="meta-item">
                <span class="meta-label">Position:</span>
                <span class="meta-value">{figure.position}</span>
              </div>
            {/if}
            <div class="meta-item">
              <span class="meta-label">Created:</span>
              <span class="meta-value"
                >{new Date(figure.created_at).toLocaleDateString()}</span
              >
            </div>
            {#if figure.updated_at}
              <div class="meta-item">
                <span class="meta-label">Updated:</span>
                <span class="meta-value"
                  >{new Date(figure.updated_at).toLocaleDateString()}</span
                >
              </div>
            {/if}
          </div>
        {/if}

        {#if figure.summary}
          <div class="figure-summary">
            <h2>Summary</h2>
            <p>{figure.summary}</p>
          </div>
        {/if}

        <!-- Generate Images Button -->
        {#if $user && $user.admin}
          <div class="action-section">
            <button
              class="generate-btn"
              on:click={generateImages}
              disabled={generatingImages}
            >
              {#if generatingImages}
                <span class="loading-spinner"></span>
                Generating Images...
              {:else}
                🔍 Generate Images
              {/if}
            </button>
          </div>

          <!-- Search Results -->
          {#if searchResults.length > 0}
            <div class="search-results-section">
              <h2>Generated Images for "{figure.title}"</h2>
              <div class="search-results-grid">
                {#each searchResults as result, index}
                  <div class="search-result-card">
                    <img
                      src={result.image.thumbnailLink}
                      alt={result.title}
                      on:error={(e) =>
                        ((e.target as HTMLImageElement).style.display = "none")}
                    />
                    <div class="result-info">
                      <h3>{result.title}</h3>
                      <p>{result.snippet}</p>
                      {#if cardErrors[index]}
                        <div class="card-error">
                          <span class="error-message">{cardErrors[index]}</span>
                          <button
                            class="clear-error-btn"
                            on:click={() => {
                              cardErrors[index] = "";
                              cardErrors = { ...cardErrors };
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      {/if}
                      <div class="result-actions">
                        <a
                          href={result.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="view-original-btn"
                        >
                          View Original
                        </a>
                        <button
                          class="set-cover-btn"
                          on:click={() => setAsCover(result.link, index)}
                          disabled={settingCover === index}
                        >
                          {#if settingCover === index}
                            <span class="loading-spinner-small"></span>
                            Setting Cover...
                          {:else}
                            🖼️ Set Cover
                          {/if}
                        </button>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Pictures Gallery -->
          {#if figure.pictures && figure.pictures.length > 0}
            <div class="pictures-section">
              <h2>Pictures</h2>
              <div class="pictures-grid">
                {#each figure.pictures as picture}
                  <div class="picture-card">
                    <div
                      class="move-btn"
                      on:mousedown={startMove}
                      on:touchstart={startMove}
                      title="Move image"
                    >
                      <i class="fa-solid fa-up-down"></i>
                    </div>
                    <div
                      class="image-container"
                      style="overflow:hidden; height:300px; position:relative;"
                    >
                      <img
                        src={picture.image_url}
                        alt={picture.caption || figure.title}
                        draggable="false"
                        style="transform: translateY({imageOffset}px); transition: {moveMode
                          ? 'none'
                          : 'transform 0.2s'};"
                      />
                    </div>
                    {#if picture.caption}
                      <div class="picture-caption">
                        <p>{picture.caption}</p>
                      </div>
                    {/if}
                    {#if picture.cover}
                      <div class="cover-badge">Cover</div>
                    {/if}
                    <button
                      class="delete-picture-btn"
                      on:click={() => deletePicture(picture.id)}
                      disabled={deletingPicture === picture.id}
                      title="Delete picture"
                    >
                      {#if deletingPicture === picture.id}
                        <span class="loading-spinner-small"></span>
                      {:else}
                        🗑️
                      {/if}
                    </button>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  {:else}
    <div class="error">Figure not found</div>
  {/if}
</div>

<style>
  .figure-page {
    min-height: 100vh;
    background-color: #f8f9fa;
  }

  .figure-header {
    position: relative;
    height: 400px;
    overflow: hidden;
  }

  .header-image {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .header-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .header-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.3) 0%,
      rgba(0, 0, 0, 0.6) 100%
    );
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 2rem;
    color: white;
  }

  .back-btn {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    margin-bottom: 1rem;
    transition: background-color 0.2s;
    align-self: flex-start;
  }

  .back-btn:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }

  .header-overlay h1 {
    margin: 0;
    font-size: 3rem;
    font-weight: 700;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  }

  .loading {
    text-align: center;
    padding: 2rem;
    color: #666;
    font-size: 1.1rem;
  }

  .error {
    background-color: #fee;
    color: #c33;
    padding: 1rem;
    border-radius: 4px;
    margin: 2rem;
    text-align: center;
  }

  .figure-content {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  .figure-details {
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .figure-meta {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    padding: 2rem;
    background-color: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
  }

  .meta-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .meta-label {
    font-size: 0.85rem;
    color: #666;
    font-weight: 500;
  }

  .meta-value {
    font-size: 1rem;
    color: #333;
    font-weight: 600;
  }

  .figure-summary {
    padding: 2rem;
    border-bottom: 1px solid #e9ecef;
  }

  .figure-summary h2 {
    margin: 0 0 1rem 0;
    color: #333;
    font-size: 1.5rem;
    border-bottom: 2px solid #e53935;
    padding-bottom: 0.5rem;
  }

  .figure-summary p {
    line-height: 1.6;
    color: #444;
    margin: 0;
    font-size: 1.1rem;
  }

  .pictures-section {
    padding: 2rem;
  }

  .pictures-section h2 {
    margin: 0 0 1.5rem 0;
    color: #333;
    font-size: 1.5rem;
    border-bottom: 2px solid #e53935;
    padding-bottom: 0.5rem;
  }

  .pictures-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .picture-card {
    position: relative;
    background-color: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition:
      transform 0.3s ease,
      box-shadow 0.3s ease;
  }

  .picture-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  .picture-card img {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }

  .picture-caption {
    padding: 1rem;
  }

  .picture-caption p {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .cover-badge {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background-color: #e53935;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .action-section {
    padding: 2rem;
    border-bottom: 1px solid #e9ecef;
  }

  .generate-btn {
    background-color: #e53935;
    color: white;
    padding: 0.75rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    transition: background-color 0.2s;
  }

  .generate-btn:hover {
    background-color: #c33;
  }

  .loading-spinner {
    margin-right: 0.5rem;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-top: 2px solid white;
    border-radius: 50%;
    width: 1rem;
    height: 1rem;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .search-results-section {
    padding: 2rem;
  }

  .search-results-section h2 {
    margin: 0 0 1.5rem 0;
    color: #333;
    font-size: 1.5rem;
    border-bottom: 2px solid #e53935;
    padding-bottom: 0.5rem;
  }

  .search-results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .search-result-card {
    position: relative;
    background-color: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition:
      transform 0.3s ease,
      box-shadow 0.3s ease;
  }

  .search-result-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  .search-result-card img {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }

  .result-info {
    padding: 1rem;
  }

  .result-info h3 {
    margin: 0 0 0.5rem 0;
    color: #333;
    font-size: 1.2rem;
  }

  .result-info p {
    margin: 0;
    color: #666;
    font-size: 1rem;
  }

  .view-original-btn {
    display: block;
    margin-top: 0.5rem;
    color: #e53935;
    text-decoration: none;
    font-weight: 600;
  }

  .result-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .set-cover-btn {
    background-color: #e53935;
    color: white;
    padding: 0.5rem 0.75rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    transition: background-color 0.2s;
    white-space: nowrap;
  }

  .set-cover-btn:hover:not(:disabled) {
    background-color: #c33;
  }

  .set-cover-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .loading-spinner-small {
    margin-right: 0.25rem;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-top: 2px solid white;
    border-radius: 50%;
    width: 0.75rem;
    height: 0.75rem;
    animation: spin 1s linear infinite;
  }

  @media (max-width: 768px) {
    .figure-header {
      height: 300px;
    }

    .header-overlay h1 {
      font-size: 2rem;
    }

    .figure-content {
      padding: 1rem;
    }

    .figure-meta {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }

    .pictures-grid {
      grid-template-columns: 1fr;
    }

    .search-results-grid {
      grid-template-columns: 1fr;
    }

    .result-actions {
      flex-direction: column;
      gap: 0.5rem;
    }

    .set-cover-btn {
      width: 100%;
      padding: 0.75rem;
      font-size: 0.9rem;
    }
  }

  .card-error {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #fee;
    color: #c33;
    padding: 0.5rem;
    border-radius: 4px;
    margin: 0.5rem 0;
    font-size: 0.85rem;
  }

  .error-message {
    flex: 1;
    margin-right: 0.5rem;
  }

  .clear-error-btn {
    background: none;
    border: none;
    color: #c33;
    cursor: pointer;
    font-size: 1rem;
    font-weight: bold;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;
  }

  .clear-error-btn:hover {
    background-color: rgba(204, 51, 51, 0.1);
  }

  .delete-picture-btn {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    cursor: pointer;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    opacity: 0;
  }

  .picture-card:hover .delete-picture-btn {
    opacity: 1;
  }

  .delete-picture-btn:hover:not(:disabled) {
    background-color: rgba(220, 53, 69, 0.9);
    transform: scale(1.1);
  }

  .delete-picture-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .move-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 2;
    background: white;
    border-radius: 50%;
    padding: 0.3em;
    cursor: grab;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  }

  .move-btn:active {
    cursor: grabbing;
  }

  .image-container img {
    user-select: none;
    pointer-events: none;
  }

  .figure-blurbs-bar {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }
  .generate-blurbs-btn {
    background: #2d6d62;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 0.6em 1.2em;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    transition: background 0.2s;
  }
  .generate-blurbs-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  .blurbs-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .blurb-pill {
    display: inline-block;
    background: #f0f2f5;
    color: #2d6d62;
    border-radius: 999px;
    padding: 0.4em 1em;
    font-size: 0.98rem;
    font-weight: 500;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    transition:
      background 0.2s,
      color 0.2s;
    cursor: pointer;
    white-space: nowrap;
  }
  .blurb-pill.starred {
    background: #ffe082;
    color: #b55a23;
    font-weight: bold;
    border: 1px solid #ffd54f;
  }
  .blurbs-error {
    color: #e53935;
    font-size: 0.98rem;
    margin-left: 1rem;
  }
</style>
