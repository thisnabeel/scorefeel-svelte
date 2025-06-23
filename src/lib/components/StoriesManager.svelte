<script>
  import { onMount } from "svelte";
  import API from "$lib/api/api.js";

  let stories = [];
  let loading = false;
  let error = null;
  let selectedStory = null;
  let showForm = false;
  let formData = {
    title: "",
    body: "",
    storyable_type: "",
    storyable_id: "",
  };

  // Load all stories
  async function loadStories() {
    loading = true;
    error = null;
    try {
      stories = await API.get("/stories");
    } catch (err) {
      error = "Failed to load stories";
      console.error(err);
    } finally {
      loading = false;
    }
  }

  // Get a specific story
  async function getStory(id) {
    try {
      const story = await API.get(`/stories/${id}`);
      return story;
    } catch (err) {
      console.error("Failed to get story:", err);
      throw err;
    }
  }

  // Create a new story
  async function createStory() {
    try {
      const newStory = await API.post("/stories", { story: formData });
      stories = [...stories, newStory];
      resetForm();
      showForm = false;
    } catch (err) {
      error = "Failed to create story";
      console.error(err);
    }
  }

  // Update a story
  async function updateStory(id) {
    try {
      const updatedStory = await API.put(`/stories/${id}`, { story: formData });
      stories = stories.map((s) => (s.id === id ? updatedStory : s));
      resetForm();
      showForm = false;
    } catch (err) {
      error = "Failed to update story";
      console.error(err);
    }
  }

  // Delete a story
  async function deleteStory(id) {
    if (confirm("Are you sure you want to delete this story?")) {
      try {
        await API.delete(`/stories/${id}`);
        stories = stories.filter((s) => s.id !== id);
      } catch (err) {
        error = "Failed to delete story";
        console.error(err);
      }
    }
  }

  // Edit a story
  function editStory(story) {
    selectedStory = story;
    formData = { ...story };
    showForm = true;
  }

  // Reset form
  function resetForm() {
    formData = { title: "", body: "", storyable_type: "", storyable_id: "" };
    selectedStory = null;
  }

  // Handle form submission
  function handleSubmit() {
    if (selectedStory) {
      updateStory(selectedStory.id);
    } else {
      createStory();
    }
  }

  // Format date for display
  function formatDate(dateString) {
    if (!dateString) return "Not published";
    return new Date(dateString).toLocaleDateString();
  }

  onMount(() => {
    loadStories();
  });
</script>

<div class="stories-manager">
  <h2>Stories Management</h2>

  {#if error}
    <div class="error">{error}</div>
  {/if}

  <button
    on:click={() => {
      showForm = true;
      resetForm();
    }}
    class="btn-primary"
  >
    Add New Story
  </button>

  {#if showForm}
    <div class="form-overlay">
      <div class="form-container">
        <h3>{selectedStory ? "Edit Story" : "Create New Story"}</h3>
        <form on:submit|preventDefault={handleSubmit}>
          <div class="form-group">
            <label for="title">Title:</label>
            <input
              id="title"
              type="text"
              bind:value={formData.title}
              required
            />
          </div>

          <div class="form-group">
            <label for="storyable_type">Storyable Type:</label>
            <input
              id="storyable_type"
              type="text"
              bind:value={formData.storyable_type}
              required
            />
          </div>

          <div class="form-group">
            <label for="storyable_id">Storyable ID:</label>
            <input
              id="storyable_id"
              type="number"
              bind:value={formData.storyable_id}
              required
            />
          </div>

          <div class="form-group">
            <label for="body">Body:</label>
            <textarea id="body" bind:value={formData.body} rows="8" required
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary">
              {selectedStory ? "Update" : "Create"}
            </button>
            <button
              type="button"
              on:click={() => {
                showForm = false;
                resetForm();
              }}
              class="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  {#if loading}
    <div class="loading">Loading stories...</div>
  {:else}
    <div class="stories-list">
      {#each stories as story (story.id)}
        <div class="story-card">
          <h4>{story.title}</h4>
          <p class="story-meta">
            <strong>Storyable Type:</strong>
            {story.storyable_type} |
            <strong>Storyable ID:</strong>
            {story.storyable_id}
          </p>
          <p class="story-excerpt">
            {story.body
              ? story.body.length > 150
                ? story.body.substring(0, 150) + "..."
                : story.body
              : "No content available"}
          </p>
          <p>
            <strong>Created:</strong>
            {new Date(story.created_at).toLocaleDateString()}
          </p>
          <p>
            <strong>Updated:</strong>
            {new Date(story.updated_at).toLocaleDateString()}
          </p>
          <div class="card-actions">
            <button on:click={() => editStory(story)} class="btn-secondary"
              >Edit</button
            >
            <button on:click={() => deleteStory(story.id)} class="btn-danger"
              >Delete</button
            >
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .stories-manager {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .error {
    background-color: #fee;
    color: #c33;
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 20px;
  }

  .loading {
    text-align: center;
    padding: 20px;
    color: #666;
  }

  .btn-primary {
    background-color: #17a2b8;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    margin-bottom: 20px;
  }

  .btn-secondary {
    background-color: #6c757d;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    margin-right: 8px;
  }

  .btn-danger {
    background-color: #dc3545;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }

  .form-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .form-container {
    background-color: white;
    padding: 30px;
    border-radius: 8px;
    min-width: 500px;
    max-width: 80vw;
    max-height: 80vh;
    overflow-y: auto;
  }

  .form-group {
    margin-bottom: 15px;
  }

  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }

  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-family: inherit;
  }

  .form-actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
  }

  .stories-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }

  .story-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    background-color: #f9f9f9;
  }

  .story-card h4 {
    margin: 0 0 10px 0;
    color: #333;
  }

  .story-meta {
    margin: 5px 0;
    color: #666;
    font-size: 0.9em;
  }

  .story-excerpt {
    margin: 10px 0;
    color: #555;
    line-height: 1.4;
  }

  .card-actions {
    margin-top: 15px;
  }
</style>
