<script>
  import { onMount } from "svelte";
  import API from "$lib/api/api.js";

  let tags = [];
  let loading = false;
  let error = null;
  let selectedTag = null;
  let showForm = false;
  let formData = {
    title: "",
    summary: "",
  };

  // Load all tags
  async function loadTags() {
    loading = true;
    error = null;
    try {
      tags = await API.get("/tags");
    } catch (err) {
      error = "Failed to load tags";
      console.error(err);
    } finally {
      loading = false;
    }
  }

  // Create a new tag
  async function createTag() {
    try {
      const newTag = await API.post("/tags", { tag: formData });
      tags = [...tags, newTag];
      resetForm();
      showForm = false;
    } catch (err) {
      error = "Failed to create tag";
      console.error(err);
    }
  }

  // Update a tag
  async function updateTag(id) {
    try {
      const updatedTag = await API.put(`/tags/${id}`, { tag: formData });
      tags = tags.map((t) => (t.id === id ? updatedTag : t));
      resetForm();
      showForm = false;
    } catch (err) {
      error = "Failed to update tag";
      console.error(err);
    }
  }

  // Delete a tag
  async function deleteTag(id) {
    if (confirm("Are you sure you want to delete this tag?")) {
      try {
        await API.delete(`/tags/${id}`);
        tags = tags.filter((t) => t.id !== id);
      } catch (err) {
        error = "Failed to delete tag";
        console.error(err);
      }
    }
  }

  // Edit a tag
  function editTag(tag) {
    selectedTag = tag;
    formData = { ...tag };
    showForm = true;
  }

  // Reset form
  function resetForm() {
    formData = { title: "", summary: "" };
    selectedTag = null;
  }

  // Handle form submission
  function handleSubmit() {
    if (selectedTag) {
      updateTag(selectedTag.id);
    } else {
      createTag();
    }
  }

  onMount(() => {
    loadTags();
  });
</script>

<div class="tags-manager">
  <h2>Tags Management</h2>

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
    Add New Tag
  </button>

  {#if showForm}
    <div class="form-overlay">
      <div class="form-container">
        <h3>{selectedTag ? "Edit Tag" : "Create New Tag"}</h3>
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
            <label for="summary">Summary:</label>
            <textarea id="summary" bind:value={formData.summary} rows="3"
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary">
              {selectedTag ? "Update" : "Create"}
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
    <div class="loading">Loading tags...</div>
  {:else}
    <div class="tags-list">
      {#each tags as tag (tag.id)}
        <div class="tag-card">
          <div class="tag-header">
            <h4>{tag.title}</h4>
          </div>
          <p>
            <strong>Summary:</strong>
            {tag.summary || "No summary available"}
          </p>
          <p>
            <strong>Created:</strong>
            {new Date(tag.created_at).toLocaleDateString()}
          </p>
          <div class="card-actions">
            <button on:click={() => editTag(tag)} class="btn-secondary"
              >Edit</button
            >
            <button on:click={() => deleteTag(tag.id)} class="btn-danger"
              >Delete</button
            >
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .tags-manager {
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
    background-color: #20c997;
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

  .form-group input[type="text"],
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

  .tags-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }

  .tag-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    background-color: #f9f9f9;
  }

  .tag-header {
    margin-bottom: 10px;
  }

  .tag-card h4 {
    margin: 0;
    color: #333;
  }

  .tag-card p {
    margin: 5px 0;
    color: #666;
    line-height: 1.4;
  }

  .card-actions {
    margin-top: 15px;
  }
</style>
