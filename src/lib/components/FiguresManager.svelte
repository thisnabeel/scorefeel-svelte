<script>
  import { onMount } from "svelte";
  import API from "$lib/api/api.js";

  let figures = [];
  let stories = [];
  let loading = false;
  let storiesLoading = false;
  let error = null;
  let selectedFigure = null;
  let showForm = false;
  let formData = {
    title: "",
    sport_id: "",
    position: "",
    summary: "",
  };

  // Load all figures
  async function loadFigures() {
    loading = true;
    error = null;
    try {
      figures = await API.get("/figures");
    } catch (err) {
      error = "Failed to load figures";
      console.error(err);
    } finally {
      loading = false;
    }
  }

  // Load all stories
  async function loadStories() {
    storiesLoading = true;
    try {
      stories = await API.get("/stories");
    } catch (err) {
      console.error("Failed to load stories:", err);
    } finally {
      storiesLoading = false;
    }
  }

  // Get a specific figure
  async function getFigure(id) {
    try {
      const figure = await API.get(`/figures/${id}`);
      return figure;
    } catch (err) {
      console.error("Failed to get figure:", err);
      throw err;
    }
  }

  // Create a new figure
  async function createFigure() {
    try {
      const newFigure = await API.post("/figures", { figure: formData });
      figures = [...figures, newFigure];
      resetForm();
      showForm = false;
    } catch (err) {
      error = "Failed to create figure";
      console.error(err);
    }
  }

  // Update a figure
  async function updateFigure(id) {
    try {
      const updatedFigure = await API.put(`/figures/${id}`, {
        figure: formData,
      });
      figures = figures.map((f) => (f.id === id ? updatedFigure : f));
      resetForm();
      showForm = false;
    } catch (err) {
      error = "Failed to update figure";
      console.error(err);
    }
  }

  // Delete a figure
  async function deleteFigure(id) {
    if (confirm("Are you sure you want to delete this figure?")) {
      try {
        await API.delete(`/figures/${id}`);
        figures = figures.filter((f) => f.id !== id);
      } catch (err) {
        error = "Failed to delete figure";
        console.error(err);
      }
    }
  }

  // Edit a figure
  function editFigure(figure) {
    selectedFigure = figure;
    formData = { ...figure };
    showForm = true;
  }

  // Reset form
  function resetForm() {
    formData = { title: "", sport_id: "", position: "" };
    selectedFigure = null;
  }

  // Handle form submission
  function handleSubmit() {
    if (selectedFigure) {
      updateFigure(selectedFigure.id);
    } else {
      createFigure();
    }
  }

  onMount(() => {
    loadFigures();
    loadStories();
  });
</script>

<div class="figures-manager">
  <h2>Figures Management</h2>

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
    Add New Figure
  </button>

  {#if showForm}
    <div class="form-overlay">
      <div class="form-container">
        <h3>{selectedFigure ? "Edit Figure" : "Create New Figure"}</h3>
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
            <label for="sport_id">Sport ID:</label>
            <input
              id="sport_id"
              type="number"
              bind:value={formData.sport_id}
              required
            />
          </div>

          <div class="form-group">
            <label for="position">Position:</label>
            <input
              id="position"
              type="number"
              bind:value={formData.position}
              required
            />
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary">
              {selectedFigure ? "Update" : "Create"}
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
    <div class="loading">Loading figures...</div>
  {:else}
    <div class="figures-list">
      {#each figures as figure (figure.id)}
        <div class="figure-card">
          <h4>{figure.title}</h4>
          <p><strong>Sport ID:</strong> {figure.sport_id || "Not assigned"}</p>
          <p><strong>Summary:</strong> {figure.summary || "Not set"}</p>
          <p>
            <strong>Created:</strong>
            {new Date(figure.created_at).toLocaleDateString()}
          </p>
          <div class="card-actions">
            <a href="/admin/figures/{figure.id}" class="btn-view">View</a>
            <button on:click={() => editFigure(figure)} class="btn-secondary"
              >Edit</button
            >
            <button on:click={() => deleteFigure(figure.id)} class="btn-danger"
              >Delete</button
            >
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Stories Section -->
  <section class="stories-section">
    <h2>Recent Stories</h2>
    {#if storiesLoading}
      <div class="loading">Loading stories...</div>
    {:else if stories.length > 0}
      <div class="stories-grid">
        {#each stories.slice(0, 6) as story (story.id)}
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
      <p class="no-stories">No stories available</p>
    {/if}
  </section>
</div>

<style>
  .figures-manager {
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
    background-color: #007bff;
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

  .btn-view {
    background-color: #28a745;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
    margin-right: 8px;
  }

  .btn-view:hover {
    background-color: #218838;
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
    min-width: 400px;
  }

  .form-group {
    margin-bottom: 15px;
  }

  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }

  .form-group input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .form-actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
  }

  .figures-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }

  .figure-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    background-color: #f9f9f9;
  }

  .figure-card h4 {
    margin: 0 0 10px 0;
    color: #333;
  }

  .figure-card p {
    margin: 5px 0;
    color: #666;
  }

  .card-actions {
    margin-top: 15px;
  }

  .stories-section {
    margin-top: 40px;
  }

  .stories-section h2 {
    font-size: 2rem;
    margin-bottom: 1.5rem;
    color: #1a1a1a;
  }

  .stories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .story-card {
    background-color: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    text-decoration: none;
    color: inherit;
    transition:
      transform 0.3s ease,
      box-shadow 0.3s ease;
  }

  .story-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
  }

  .story-card .card-image {
    height: 200px;
  }

  .story-card .card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .story-card .card-content {
    padding: 1rem;
  }

  .story-card .card-content h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
    line-height: 1.4;
    color: #333;
  }

  .story-card .card-content p {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .no-stories {
    text-align: center;
    padding: 20px;
    color: #666;
  }
</style>
