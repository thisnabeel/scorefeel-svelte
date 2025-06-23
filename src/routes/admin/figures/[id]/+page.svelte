<script lang="ts">
  import API from "$lib/api/api.js";
  export let data;

  $: ({ figure, error } = data);

  interface Story {
    id: number;
    title: string;
    summary: string;
  }

  let generatedStories: Story[] = [];
  let allStories: Story[] = [];
  let generating = false;
  let storiesLoading = false;

  async function generateStory() {
    if (!figure) return;
    generating = true;
    try {
      const response = await API.post(`/figures/${figure.id}/generate_story`);
      if (response && response.stories) {
        generatedStories = response.stories;
      }
    } catch (err) {
      console.error("Failed to generate story:", err);
    } finally {
      generating = false;
    }
  }

  async function loadStories() {
    if (!figure) return;
    storiesLoading = true;
    try {
      allStories = await API.get(`/figures/${figure.id}/stories`);
    } catch (err) {
      console.error("Failed to load stories:", err);
    } finally {
      storiesLoading = false;
    }
  }

  // Load stories when the component mounts
  $: if (figure) {
    loadStories();
  }
</script>

<svelte:head>
  <title>{figure ? figure.title : "Figure Details"} - ScoreFeel Admin</title>
</svelte:head>

<div class="figure-detail-page">
  {#if figure}
    <header class="page-header">
      <h1>{figure.title}</h1>
      <p>Figure ID: {figure.id}</p>
    </header>

    <div class="action-panel">
      <button
        class="action-button"
        on:click={generateStory}
        disabled={generating}
      >
        <span class="icon">⚡️</span>
        {#if generating}
          Generating...
        {:else}
          Generate Story
        {/if}
      </button>
    </div>

    <div class="figure-info">
      <p><strong>Position:</strong> {figure.position || "Not set"}</p>
      <p><strong>Sport ID:</strong> {figure.sport_id || "None"}</p>
      <p>
        <strong>Created:</strong>
        {new Date(figure.created_at).toLocaleDateString()}
      </p>
      <p>
        <strong>Updated:</strong>
        {new Date(figure.updated_at).toLocaleDateString()}
      </p>
    </div>

    {#if generatedStories.length > 0}
      <section class="generated-items">
        <h2>Generated Stories</h2>
        <div class="items-grid">
          {#each generatedStories as story (story.id)}
            <div class="item-card">
              <h4>{story.title}</h4>
              <p><strong>Summary:</strong> {story.summary}</p>
              <a href="/stories/{story.id}" class="view-button">View Story</a>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <!-- All Stories Section -->
    <section class="stories-section">
      <h2>Figure's Stories</h2>
      {#if storiesLoading}
        <div class="loading">Loading stories...</div>
      {:else if allStories.length > 0}
        <div class="stories-grid">
          {#each allStories.slice(0, 6) as story (story.id)}
            <a href="/stories/{story.id}" class="story-card">
              <div class="card-image">
                <img
                  src={`https://placehold.co/600x400/1a1a1a/ffffff?text=${story.title.split(" ").join("+")}`}
                  alt={story.title}
                />
              </div>
              <div class="card-content">
                <h4>{story.title}</h4>
                <p>{story.summary || "No summary available"}</p>
              </div>
            </a>
          {/each}
        </div>
      {:else}
        <p class="no-stories">No stories available for this figure</p>
      {/if}
    </section>
  {:else if error}
    <p class="error-message">{error.message}</p>
  {:else}
    <p>Loading figure details...</p>
  {/if}
</div>

<style>
  .figure-detail-page {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem;
  }

  .page-header {
    background-color: #007bff;
    color: white;
    padding: 2rem;
    border-radius: 12px;
    margin-bottom: 2rem;
    text-align: center;
  }

  .page-header h1 {
    font-size: 2.5rem;
    margin: 0 0 0.5rem 0;
  }

  .page-header p {
    opacity: 0.9;
    font-size: 1.1rem;
    margin: 0;
  }

  .action-panel {
    margin-bottom: 2rem;
    display: flex;
    justify-content: flex-end;
  }

  .action-button {
    background-color: #ffc107;
    color: #212529;
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

  .action-button:hover:not(:disabled) {
    background-color: #e0a800;
  }

  .action-button:disabled {
    background-color: #e9ecef;
    cursor: not-allowed;
  }

  .icon {
    font-size: 1.2rem;
  }

  .figure-info {
    background-color: #fff;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  }

  .figure-info p {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    line-height: 1.6;
  }

  .figure-info p:last-child {
    margin-bottom: 0;
  }

  .generated-items {
    margin-top: 2rem;
    background-color: #fff;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  }

  .generated-items h2 {
    font-size: 1.8rem;
    margin: 0 0 1.5rem 0;
    color: #333;
    border-bottom: 1px solid #eee;
    padding-bottom: 1rem;
  }

  .items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .item-card {
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 1.5rem;
  }

  .item-card h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1.2rem;
    color: #333;
  }

  .item-card p {
    margin: 0 0 1rem 0;
    color: #666;
    line-height: 1.5;
  }

  .view-button {
    display: inline-block;
    background-color: #007bff;
    color: white;
    text-decoration: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.9rem;
    transition: background-color 0.3s ease;
  }

  .view-button:hover {
    background-color: #0056b3;
  }

  .error-message {
    color: #e53935;
    background-color: #ffebee;
    border: 1px solid #e53935;
    padding: 1rem;
    border-radius: 8px;
  }

  .stories-section {
    margin-top: 2rem;
    background-color: #fff;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  }

  .stories-section h2 {
    font-size: 1.8rem;
    margin: 0 0 1.5rem 0;
    color: #333;
    border-bottom: 1px solid #eee;
    padding-bottom: 1rem;
  }

  .loading {
    text-align: center;
    padding: 1rem;
    color: #666;
  }

  .stories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .story-card {
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 1.5rem;
    text-decoration: none;
    color: inherit;
    transition: background-color 0.3s ease;
  }

  .story-card:hover {
    background-color: #e9ecef;
  }

  .card-image {
    margin-bottom: 1rem;
  }

  .card-image img {
    width: 100%;
    height: 200px;
    object-fit: cover;
    border-radius: 8px;
  }

  .card-content {
    text-align: center;
  }

  .card-content h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1.2rem;
    color: #333;
  }

  .card-content p {
    margin: 0;
    color: #666;
    line-height: 1.5;
  }

  .no-stories {
    text-align: center;
    padding: 1rem;
    color: #666;
  }
</style>
