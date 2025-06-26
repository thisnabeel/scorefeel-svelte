<script lang="ts">
  import { onMount } from "svelte";
  import API from "$lib/api/api.js";
  import { goto } from "$app/navigation";
  import { user } from "$lib/stores/user.js";
  import Tiptap from "$lib/components/Tiptap.svelte";
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
  let verifying = false;
  let verifyResult: null | {
    story_id: number;
    story_title: string;
    validation: {
      is_accurate: boolean;
      confidence_score: number;
      issues_found: string[];
      verification_notes: string;
      recommendations: string[];
    };
  } = null;
  let verifyError = "";

  interface BulletPoint {
    id: number;
    body: string;
    bullet_pointable_type: string;
    bullet_pointable_id: number;
    position: number;
  }

  let bulletPointsLoading = false;
  let bulletPointsError = "";
  let bulletTab = "bullet";

  const GOOGLE_API_KEY = "AIzaSyBtWG38u4C0YW1XHkHVimVdLCbu_Wwi6H4";
  const SEARCH_ENGINE_ID = "b7571604c5c1c4c9e";

  let deletingBullet: Record<number, boolean> = {};
  let deleteBulletError: Record<number, string> = {};

  let editingTitle = false;
  let newTitle = "";
  let savingTitle = false;
  let saveTitleError = "";

  let editingBody = false;
  let newBody = "";
  let savingBody = false;
  let saveBodyError = "";

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

  async function verifyStory() {
    if (!story) return;
    verifying = true;
    verifyError = "";
    verifyResult = null;
    try {
      const result = await API.get(`/stories/${story.id}/validate`);
      verifyResult = result;
    } catch (err) {
      verifyError = "Failed to verify story.";
      console.error("Failed to verify story:", err);
    } finally {
      verifying = false;
    }
  }

  async function generateBulletPoints() {
    if (!story) return;
    bulletPointsLoading = true;
    bulletPointsError = "";
    try {
      const result = await API.post(
        `/bullet_points/for/Story/${story.id}/wizard`
      );
      console.log("result", result);
      story = {
        ...story,
        bullet_points: result.bullet_points,
      };
      bulletTab = "bullet";
    } catch (err) {
      bulletPointsError = "Failed to generate bullet points.";
      console.error("Failed to generate bullet points:", err);
    } finally {
      bulletPointsLoading = false;
    }
  }

  async function deleteBulletPoint(bulletId: number) {
    deletingBullet[bulletId] = true;
    deleteBulletError[bulletId] = "";
    try {
      await API.delete(`/bullet_points/${bulletId}`);
      if (story && story.bullet_points) {
        story = {
          ...story,
          bullet_points: story.bullet_points.filter(
            (bp: BulletPoint) => bp.id !== bulletId
          ),
        };
      }
    } catch (err) {
      deleteBulletError[bulletId] = "Failed to delete bullet point.";
      console.error("Failed to delete bullet point:", err);
    } finally {
      deletingBullet[bulletId] = false;
      deletingBullet = { ...deletingBullet };
      deleteBulletError = { ...deleteBulletError };
    }
  }

  async function saveStoryTitle() {
    if (!story) return;
    savingTitle = true;
    saveTitleError = "";
    try {
      const response = await API.put(`/stories/${story.id}`, {
        title: newTitle,
      });
      if (response && response.title) {
        story.title = response.title;
        editingTitle = false;
      }
    } catch (err) {
      saveTitleError = "Failed to save title.";
      console.error(err);
    } finally {
      savingTitle = false;
    }
  }

  async function saveStoryBody() {
    if (!story) return;
    savingBody = true;
    saveBodyError = "";
    try {
      const response = await API.put(`/stories/${story.id}`, { body: newBody });
      if (response && response.body) {
        story.body = response.body;
        editingBody = false;
      }
    } catch (err) {
      saveBodyError = "Failed to save story.";
      console.error(err);
    } finally {
      savingBody = false;
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
    {#if $user && $user.admin}
      <div class="story-actions">
        <div class="story-actions-left">
          <button
            class="verify-story-btn"
            on:click={verifyStory}
            disabled={verifying}
          >
            {#if verifying}
              <span class="loading-spinner-small"></span> Verifying...
            {:else}
              ✅ Verify
            {/if}
          </button>
          <button
            class="bullet-points-btn"
            on:click={generateBulletPoints}
            disabled={bulletPointsLoading}
          >
            {#if bulletPointsLoading}
              <span class="loading-spinner-small"></span> Bullet Points...
            {:else}
              • Bullet Points
            {/if}
          </button>
        </div>
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
      {#if verifyError}
        <div class="error-message">{verifyError}</div>
      {/if}
      {#if verifyResult && verifyResult.validation}
        <div class="verify-result-box">
          <div>
            <strong>Accurate:</strong>
            {verifyResult.validation.is_accurate ? "Yes" : "No"}
          </div>
          <div>
            <strong>Confidence Score:</strong>
            {verifyResult.validation.confidence_score}/100
          </div>
          <div>
            <strong>Issues Found:</strong>
            {#if verifyResult.validation.issues_found.length > 0}
              <ul>
                {#each verifyResult.validation.issues_found as issue}
                  <li>{issue}</li>
                {/each}
              </ul>
            {:else}
              None
            {/if}
          </div>
          <div>
            <strong>Verification Notes:</strong>
            <div class="verify-notes">
              {verifyResult.validation.verification_notes}
            </div>
          </div>
          <div>
            <strong>Recommendations:</strong>
            {#if verifyResult.validation.recommendations.length > 0}
              <ul>
                {#each verifyResult.validation.recommendations as rec}
                  <li>{rec}</li>
                {/each}
              </ul>
            {:else}
              None
            {/if}
          </div>
        </div>
      {/if}
      {#if bulletPointsError}
        <div class="error-message">{bulletPointsError}</div>
      {/if}
    {/if}
    <header class="story-header">
      {#if $user && $user.admin}
        {#if editingTitle}
          <input
            type="text"
            bind:value={newTitle}
            style="font-size:2.2rem;font-weight:700;width:70%;"
          />
          <button
            class="save-title-btn"
            on:click={saveStoryTitle}
            disabled={savingTitle}
          >
            {#if savingTitle}
              <span class="loading-spinner-small"></span> Saving...
            {:else}
              Save
            {/if}
          </button>
          <button
            class="cancel-title-btn"
            on:click={() => {
              editingTitle = false;
            }}
            disabled={savingTitle}>Cancel</button
          >
          {#if saveTitleError}
            <div class="error-message">{saveTitleError}</div>
          {/if}
        {:else}
          <h1
            on:click={() => {
              editingTitle = true;
              newTitle = story.title;
            }}
            style="cursor:pointer;"
          >
            {story.title} <span class="edit-icon">✏️</span>
          </h1>
        {/if}
      {:else}
        <h1>{story.title}</h1>
      {/if}
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

    <!-- Images Section -->
    {#if $user && $user.admin}
      <div class="images-section">
        <div class="section-header">
          <h2>Story Images</h2>
          <button
            class="generate-btn"
            on:click={generatePictures}
            disabled={generating}
          >
            {#if generating}
              <span class="loading-spinner-small"></span> Generating Images...
            {:else}
              ➕ Generate Images
            {/if}
          </button>
        </div>
        {#if picturesLoading}
          <div class="loading">Loading images...</div>
        {:else if pictures.length > 0}
          <div class="pictures-grid">
            {#each pictures as picture, i (picture.id)}
              <div class="picture-card">
                <img
                  src={picture.image_url}
                  alt={picture.caption || story.title}
                />
                {#if picture.cover}
                  <span class="cover-badge">Cover</span>
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
                <button
                  class="generate-images-btn"
                  on:click={() =>
                    generateImages(picture, picture.caption || story.title)}
                  disabled={generatingImages}
                >
                  {#if generatingImages && selectedPicture?.id === picture.id}
                    <span class="loading-spinner-small"></span> Generating...
                  {:else}
                    🎨 Generate
                  {/if}
                </button>
                <button
                  class="set-cover-btn"
                  on:click={async () =>
                    await API.put(`/pictures/${picture.id}`, {
                      cover: !picture.cover,
                    })}
                  disabled={settingCover === i || picture.cover}
                  style="margin: 0.5rem;"
                >
                  {#if settingCover === i}
                    <span class="loading-spinner-small"></span> Setting Cover...
                  {:else if picture.cover}
                    Cover
                  {:else}
                    Set as Cover
                  {/if}
                </button>
                {#if cardErrors[i]}
                  <div class="card-error">
                    <span>{cardErrors[i]}</span>
                    <button
                      class="clear-error-btn"
                      on:click={() => {
                        cardErrors[i] = "";
                        cardErrors = { ...cardErrors };
                      }}>✖</button
                    >
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {:else}
          <div class="no-images">No images available for this story yet.</div>
        {/if}

        <!-- Show search results for generated images -->
        {#if searchResults.length > 0 && selectedPicture}
          <div class="search-results-section">
            <h3>
              Generated Images for: {selectedPicture.caption || story.title}
            </h3>
            <div class="search-results-scroll">
              {#each searchResults as result, idx}
                <div class="search-result-card">
                  <img src={result.image.thumbnailLink} alt={result.title} />
                  <div class="result-info">
                    <h4>{result.title}</h4>
                    <p>{result.snippet}</p>
                    <div class="result-actions">
                      <a
                        class="view-original-btn"
                        href={result.link}
                        target="_blank">View Original</a
                      >
                      <button
                        class="set-cover-btn"
                        on:click={() => setAsCover(result.link, idx)}
                        disabled={settingCover === idx}
                      >
                        {#if settingCover === idx}
                          <span class="loading-spinner-small"></span> Setting Cover...
                        {:else}
                          Set as Cover
                        {/if}
                      </button>
                    </div>
                    {#if cardErrors[idx]}
                      <div class="card-error">
                        <span>{cardErrors[idx]}</span>
                        <button
                          class="clear-error-btn"
                          on:click={() => {
                            cardErrors[idx] = "";
                            cardErrors = { ...cardErrors };
                          }}>✖</button
                        >
                      </div>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
        {#if picturesError}
          <div class="error-message">{picturesError}</div>
        {/if}
      </div>
    {/if}
    <div class="story-tabs">
      <button
        class="tab-btn {bulletTab === 'bullet' ? 'active' : ''}"
        on:click={() => (bulletTab = "bullet")}>Bullet Points</button
      >
      <button
        class="tab-btn {bulletTab === 'full' ? 'active' : ''}"
        on:click={() => (bulletTab = "full")}>Full Story</button
      >
    </div>
    <div class="story-tab-content">
      {#if bulletTab === "bullet"}
        {#if bulletPointsLoading}
          <div class="loading">Loading bullet points...</div>
        {:else if story.bullet_points && story.bullet_points.length > 0}
          <ul class="bullet-points-list">
            {#each story.bullet_points as bp}
              <li class="bullet-point">
                {bp.body}
                {#if $user && $user.admin}
                  <button
                    class="delete-bullet-btn"
                    title="Delete bullet point"
                    on:click={() => deleteBulletPoint(bp.id)}
                    disabled={deletingBullet[bp.id]}
                  >
                    {#if deletingBullet[bp.id]}
                      <span class="loading-spinner-small"></span>
                    {:else}
                      🗑️
                    {/if}
                  </button>
                  {#if deleteBulletError[bp.id]}
                    <span class="error-message">{deleteBulletError[bp.id]}</span
                    >
                  {/if}
                {/if}
              </li>
            {/each}
          </ul>
        {:else}
          <div class="no-bullet-points">No bullet points generated yet.</div>
        {/if}
      {:else}
        <div class="story-body">
          {#if $user && $user.admin}
            {#if editingBody}
              <Tiptap bind:content={newBody} editable={true} />
              <button
                class="save-title-btn"
                on:click={saveStoryBody}
                disabled={savingBody}
              >
                {#if savingBody}
                  <span class="loading-spinner-small"></span> Saving...
                {:else}
                  Save
                {/if}
              </button>
              <button
                class="cancel-title-btn"
                on:click={() => {
                  editingBody = false;
                }}
                disabled={savingBody}>Cancel</button
              >
              {#if saveBodyError}
                <div class="error-message">{saveBodyError}</div>
              {/if}
            {:else}
              <div
                on:click={() => {
                  editingBody = true;
                  newBody = story.body || "";
                }}
                style="cursor:pointer;"
              >
                {@html story.body}
                <span class="edit-icon">✏️</span>
              </div>
            {/if}
          {:else}
            {@html story.body}
          {/if}
        </div>
      {/if}
    </div>
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
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }

  .story-actions-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .bullet-points-btn {
    background: #4075a6;
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

  .bullet-points-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .story-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.2rem;
  }

  .tab-btn {
    background: #f0f2f5;
    color: #2d6d62;
    border: none;
    border-radius: 999px;
    padding: 0.5em 1.5em;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition:
      background 0.2s,
      color 0.2s;
  }

  .tab-btn.active {
    background: #2d6d62;
    color: #fff;
    font-weight: bold;
  }

  .story-tab-content {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    padding: 2rem;
    margin-bottom: 2rem;
  }

  .bullet-points-list {
    list-style: disc inside;
    padding-left: 1.5em;
    margin: 0;
  }

  .bullet-point {
    margin-bottom: 0.7em;
    font-size: 1.1rem;
    color: #333;
    line-height: 1.5;
  }

  .no-bullet-points {
    color: #888;
    font-size: 1.05rem;
    padding: 1.5em 0;
    text-align: center;
  }

  .verify-result-box {
    background: #f8f9fa;
    border: 1px solid #b5e0d4;
    border-radius: 8px;
    padding: 1.2rem 1.5rem;
    margin-bottom: 1.5rem;
    margin-top: 0.5rem;
    color: #1a1a1a;
    font-size: 1rem;
  }

  .verify-result-box ul {
    margin: 0.3em 0 0.5em 1.2em;
    padding: 0;
  }

  .verify-notes {
    background: #fff;
    border-radius: 4px;
    padding: 0.5em 0.8em;
    margin-top: 0.3em;
    font-size: 0.97em;
    color: #333;
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

  .delete-bullet-btn {
    margin-left: 1em;
    background: #fff;
    border: none;
    border-radius: 50%;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    cursor: pointer;
    font-size: 1.1rem;
    padding: 0.2em 0.5em;
    vertical-align: middle;
    transition: background 0.2s;
  }

  .delete-bullet-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .bullet-point {
    /* display: flex; */
    align-items: center;
    justify-content: space-between;
  }

  .save-title-btn,
  .cancel-title-btn {
    margin-left: 0.5em;
    background: #2d6d62;
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 0.3em 0.8em;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  .cancel-title-btn {
    background: #888;
  }
  .save-title-btn:disabled,
  .cancel-title-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  .edit-icon {
    font-size: 0.9em;
    margin-left: 0.3em;
    color: #888;
    cursor: pointer;
  }
</style>
