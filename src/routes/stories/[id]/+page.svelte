<script lang="ts">
  import { onMount } from "svelte";
  import API from "$lib/api/api.js";
  import { goto } from "$app/navigation";
  export let data;

  interface Picture {
    id: number;
    caption?: string;
    image_url: string;
    storage_key: string;
    cover: boolean;
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

  $: ({ story, error } = data);

  let pictures: Picture[] = [];
  let generating = false;
  let picturesLoading = false;
  let picturesError: string | null = null;
  let searchResults: SearchResult[] = [];
  let generatingImages = false;
  let cardErrors: Record<number, string> = {};
  let settingCover: number | null = null;
  let deletingPicture: Record<number, boolean> = {};
  let deleteError: Record<number, string> = {};
  let deletingStory = false;
  let deleteStoryError = "";

  const GOOGLE_API_KEY = "AIzaSyBtWG38u4C0YW1XHkHVimVdLCbu_Wwi6H4";
  const SEARCH_ENGINE_ID = "b7571604c5c1c4c9e";

  function formatDate(dateString: string) {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  async function generatePictures() {
    if (!story) return;

    generating = true;
    picturesError = null;
    try {
      await API.post(`/stories/${story.id}/generate_pictures`);
      // After generating, load the pictures
      await loadPictures();
    } catch (err) {
      picturesError = "Failed to generate pictures";
      console.error("Failed to generate pictures:", err);
    } finally {
      generating = false;
    }
  }

  async function loadPictures() {
    if (!story) return;

    picturesLoading = true;
    picturesError = null;
    try {
      pictures = await API.get(`/stories/${story.id}/pictures`);
      story.pictures = pictures;
    } catch (err) {
      picturesError = "Failed to load pictures";
      console.error("Failed to load pictures:", err);
      pictures = [];
    } finally {
      picturesLoading = false;
    }
  }

  let selectedPicture: Picture | null = null;
  async function generateImages(picture: Picture, caption: string) {
    generatingImages = true;
    picturesError = null;

    try {
      const searchQuery = caption;
      selectedPicture = picture;

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
      console.log("Using fallback image service for:", caption);
      searchResults = [
        {
          title: `${caption} - Generated Image 1`,
          link: `https://source.unsplash.com/800x600/?${encodeURIComponent(caption)}`,
          snippet: `High-quality image for ${caption}`,
          image: {
            thumbnailLink: `https://source.unsplash.com/400x300/?${encodeURIComponent(caption)}`,
            contextLink: `https://source.unsplash.com/800x600/?${encodeURIComponent(caption)}`,
          },
        },
        {
          title: `${caption} - Professional Image`,
          link: `https://source.unsplash.com/800x600/?${encodeURIComponent(caption + " professional")}`,
          snippet: `Professional image for ${caption}`,
          image: {
            thumbnailLink: `https://source.unsplash.com/400x300/?${encodeURIComponent(caption + " professional")}`,
            contextLink: `https://source.unsplash.com/800x600/?${encodeURIComponent(caption + " professional")}`,
          },
        },
        {
          title: `${caption} - High Quality Image`,
          link: `https://source.unsplash.com/800x600/?${encodeURIComponent(caption + " high quality")}`,
          snippet: `High quality image for ${caption}`,
          image: {
            thumbnailLink: `https://source.unsplash.com/400x300/?${encodeURIComponent(caption + " high quality")}`,
            contextLink: `https://source.unsplash.com/800x600/?${encodeURIComponent(caption + " high quality")}`,
          },
        },
      ];
    } catch (err) {
      console.error("Error generating images:", err);
      picturesError = "Error generating images. Please try again.";
      searchResults = [];
    } finally {
      generatingImages = false;
    }
  }

  async function setAsCover(imageUrl: string, index: number) {
    if (!story) return;

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

      if (!selectedPicture) {
        return;
      }

      const result = await API.post(
        `/pictures/${selectedPicture?.id}/upload_picture`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Cover image uploaded successfully:", result);

      // Reload the story to get updated pictures
      await loadPictures();

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
    deletingPicture[pictureId] = true;
    deleteError[pictureId] = "";
    try {
      await API.delete(`/pictures/${pictureId}`);
      // Remove the picture from the local array
      pictures = pictures.filter((p: Picture) => p.id !== pictureId);
    } catch (err) {
      deleteError[pictureId] = "Failed to delete image.";
      console.error("Failed to delete image:", err);
    } finally {
      deletingPicture[pictureId] = false;
      deletingPicture = { ...deletingPicture };
      deleteError = { ...deleteError };
    }
  }

  async function deleteStory() {
    if (!story) return;
    if (
      !confirm(
        "Are you sure you want to delete this story? This action cannot be undone."
      )
    )
      return;
    deletingStory = true;
    deleteStoryError = "";
    try {
      await API.delete(`/stories/${story.id}`);
      goto("/");
    } catch (err) {
      deleteStoryError = "Failed to delete story.";
      console.error("Failed to delete story:", err);
    } finally {
      deletingStory = false;
    }
  }

  onMount(() => {
    if (story) {
      loadPictures();
    }
  });
</script>

<svelte:head>
  <title>{story ? story.title : "Story"}</title>
</svelte:head>

<div class="story-view">
  {#if story}
    <div class="story-actions">
      <button
        class="delete-story-btn"
        on:click={deleteStory}
        disabled={deletingStory}
      >
        {#if deletingStory}
          <span class="loading-spinner-small"></span> Deleting Story...
        {:else}
          🗑️ Delete Story
        {/if}
      </button>
      {#if deleteStoryError}
        <div class="error-message">{deleteStoryError}</div>
      {/if}
    </div>
    <article class="story-article">
      <header class="story-header">
        <h1>{story.title}</h1>
        <p class="story-meta">
          <span>Published on {formatDate(story.created_at)}</span>
        </p>
        <div class="story-image">
          <img
            src={story.pictures?.find((p) => p.cover)?.image_url ||
              `https://placehold.co/1200x600/1a1a1a/ffffff?text=${story.title.split(" ").join("+")}`}
            alt={story.title}
          />
        </div>
      </header>

      <div class="story-body">
        {@html story.body}
      </div>

      <!-- Generate Images Section -->
      <div class="images-section">
        <div class="section-header">
          <h2>Story Images</h2>
          <button
            class="generate-btn"
            on:click={generatePictures}
            disabled={generating}
          >
            <span class="icon">🎨</span>
            {#if generating}
              Generating...
            {:else}
              Generate Images
            {/if}
          </button>
        </div>

        {#if picturesError}
          <div class="error-message">{picturesError}</div>
        {/if}

        {#if picturesLoading}
          <div class="loading">Loading images...</div>
        {:else if pictures.length > 0}
          <div class="pictures-grid">
            {#each pictures as picture (picture.id)}
              <div class="picture-card">
                <img
                  src={picture.image_url}
                  alt={picture.caption || "Story image"}
                />
                {#if picture.caption}
                  <h4>{picture.caption}</h4>
                {/if}
                {#if picture.cover}
                  <span class="cover-badge">Cover Image</span>
                {/if}
                <button
                  class="delete-picture-btn"
                  title="Delete image"
                  on:click={() => deletePicture(picture.id)}
                  disabled={deletingPicture[picture.id]}
                >
                  {#if deletingPicture[picture.id]}
                    <span class="loading-spinner-small"></span>
                  {:else}
                    🗑️
                  {/if}
                </button>
                {#if deleteError[picture.id]}
                  <div class="error-message">{deleteError[picture.id]}</div>
                {/if}
                {#if picture.caption}
                  <button
                    class="generate-images-btn"
                    on:click={() => generateImages(picture, picture.caption!)}
                    disabled={generatingImages}
                    title="Generate images based on caption"
                  >
                    {#if generatingImages}
                      <span class="loading-spinner-small"></span>
                      Generating...
                    {:else}
                      🔍 Generate Images
                    {/if}
                  </button>
                {/if}
              </div>
            {/each}
          </div>
        {:else}
          <p class="no-images">
            No images generated yet. Click "Generate Images" to create
            AI-powered images for this story.
          </p>
        {/if}

        <!-- Search Results -->
        {#if searchResults.length > 0}
          <div class="search-results-section">
            <h3>Generated Images from Caption</h3>
            <div class="search-results-scroll">
              {#each searchResults as result, index}
                <div class="search-result-card">
                  <img
                    src={result.image.thumbnailLink}
                    alt={result.title}
                    on:error={(e) =>
                      ((e.target as HTMLImageElement).style.display = "none")}
                  />
                  <div class="result-info">
                    <h4>{result.title}</h4>
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
      </div>
    </article>
  {:else if error}
    <p class="error-message">{error.message}</p>
  {:else}
    <p>Loading story...</p>
  {/if}
</div>

<style>
  .story-view {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  }

  .story-header {
    margin-bottom: 2rem;
    border-bottom: 1px solid #eee;
    padding-bottom: 2rem;
  }

  .story-header h1 {
    font-size: 2.8rem;
    margin-bottom: 1rem;
    line-height: 1.2;
    color: #1a1a1a;
  }

  .story-meta {
    color: #666;
    font-size: 0.9rem;
  }

  .story-image {
    margin-top: 2rem;
    border-radius: 12px;
    overflow: hidden;
    max-height: 300px;
    object-fit: contain;
  }

  .story-image img {
    width: 100%;
    display: block;
  }

  .story-body {
    font-size: 1.1rem;
    line-height: 1.8;
    color: #333;
  }

  .story-body :global(p) {
    margin-bottom: 1.5rem;
  }

  .images-section {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid #eee;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .section-header h2 {
    font-size: 1.8rem;
    color: #1a1a1a;
    margin: 0;
  }

  .generate-btn {
    background-color: #e53935;
    color: white;
    border: none;
    padding: 0.8rem 1.5rem;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: background-color 0.3s ease;
  }

  .generate-btn:hover:not(:disabled) {
    background-color: #c62828;
  }

  .generate-btn:disabled {
    background-color: #e9ecef;
    cursor: not-allowed;
  }

  .generate-btn .icon {
    font-size: 1.2rem;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    color: #666;
    font-size: 1.1rem;
  }

  .no-images {
    text-align: center;
    padding: 2rem;
    color: #666;
    font-style: italic;
  }

  .pictures-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .picture-card {
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 12px;
    overflow: hidden;
    transition:
      transform 0.3s ease,
      box-shadow 0.3s ease;
    position: relative;
  }

  .picture-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
  }

  .picture-card img {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }

  .picture-card h4 {
    margin: 0;
    padding: 1rem 1rem 0.5rem 1rem;
    font-size: 1.1rem;
    color: #333;
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
    font-weight: bold;
  }

  .error-message {
    color: #e53935;
    background-color: #ffebee;
    border: 1px solid #e53935;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .search-results-section {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid #eee;
  }

  .search-results-scroll {
    display: flex;
    overflow-x: auto;
    padding: 1rem;
  }

  .search-result-card {
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 12px;
    overflow: hidden;
    transition:
      transform 0.3s ease,
      box-shadow 0.3s ease;
    position: relative;
    margin-right: 1rem;
    min-width: 250px;
    flex-shrink: 0;
  }

  .search-result-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
  }

  .search-result-card img {
    width: 250px;
    height: 200px;
    object-fit: cover;
  }

  .result-info {
    padding: 1rem;
    width: 250px;
  }

  .result-info h4 {
    font-size: 1rem;
    margin-bottom: 0.5rem;
    color: #333;
  }

  .result-info p {
    margin-bottom: 1rem;
    font-size: 0.9rem;
    color: #666;
    line-height: 1.4;
  }

  .result-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }

  .view-original-btn {
    background-color: #6c757d;
    color: white;
    border: none;
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.3s ease;
    text-decoration: none;
    flex: 1;
    text-align: center;
  }

  .view-original-btn:hover {
    background-color: #5a6268;
  }

  .set-cover-btn {
    background-color: #e53935;
    color: white;
    border: none;
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.3s ease;
    flex: 1;
  }

  .set-cover-btn:hover:not(:disabled) {
    background-color: #c62828;
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

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .card-error {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .clear-error-btn {
    background-color: #e53935;
    color: white;
    border: none;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .clear-error-btn:hover {
    background-color: #c62828;
  }

  .generate-images-btn {
    position: absolute;
    bottom: 0.5rem;
    left: 0.5rem;
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    border: none;
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: 0;
  }

  .picture-card:hover .generate-images-btn {
    opacity: 1;
  }

  .generate-images-btn:hover:not(:disabled) {
    background-color: rgba(229, 57, 53, 0.9);
    transform: scale(1.05);
  }

  .generate-images-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .delete-picture-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    background: #fff;
    border: none;
    border-radius: 50%;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    cursor: pointer;
    font-size: 1.2rem;
    padding: 0.3em 0.5em;
    z-index: 2;
    transition: background 0.2s;
  }

  .delete-picture-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .picture-card {
    position: relative;
  }

  .story-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-bottom: 1.5rem;
  }

  .delete-story-btn {
    background: #e53935;
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

  .delete-story-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
</style>
