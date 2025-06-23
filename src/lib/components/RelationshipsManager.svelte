<script>
  import { onMount } from "svelte";
  import API from "$lib/api/api.js";

  let relationships = [];
  let loading = false;
  let error = null;
  let selectedRelationship = null;
  let showForm = false;
  let formData = {
    title: "",
  };

  // Load all relationships
  async function loadRelationships() {
    loading = true;
    error = null;
    try {
      relationships = await API.get("/relationships");
    } catch (err) {
      error = "Failed to load relationships";
      console.error(err);
    } finally {
      loading = false;
    }
  }

  // Create a new relationship
  async function createRelationship() {
    try {
      const newRelationship = await API.post("/relationships", {
        relationship: formData,
      });
      relationships = [...relationships, newRelationship];
      resetForm();
      showForm = false;
    } catch (err) {
      error = "Failed to create relationship";
      console.error(err);
    }
  }

  // Update a relationship
  async function updateRelationship(id) {
    try {
      const updatedRelationship = await API.put(`/relationships/${id}`, {
        relationship: formData,
      });
      relationships = relationships.map((r) =>
        r.id === id ? updatedRelationship : r
      );
      resetForm();
      showForm = false;
    } catch (err) {
      error = "Failed to update relationship";
      console.error(err);
    }
  }

  // Delete a relationship
  async function deleteRelationship(id) {
    if (confirm("Are you sure you want to delete this relationship?")) {
      try {
        await API.delete(`/relationships/${id}`);
        relationships = relationships.filter((r) => r.id !== id);
      } catch (err) {
        error = "Failed to delete relationship";
        console.error(err);
      }
    }
  }

  // Edit a relationship
  function editRelationship(relationship) {
    selectedRelationship = relationship;
    formData = { ...relationship };
    showForm = true;
  }

  // Reset form
  function resetForm() {
    formData = { title: "" };
    selectedRelationship = null;
  }

  // Handle form submission
  function handleSubmit() {
    if (selectedRelationship) {
      updateRelationship(selectedRelationship.id);
    } else {
      createRelationship();
    }
  }

  onMount(() => {
    loadRelationships();
  });
</script>

<div class="relationships-manager">
  <h2>Relationships Management</h2>

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
    Add New Relationship
  </button>

  {#if showForm}
    <div class="form-overlay">
      <div class="form-container">
        <h3>
          {selectedRelationship
            ? "Edit Relationship"
            : "Create New Relationship"}
        </h3>
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

          <div class="form-actions">
            <button type="submit" class="btn-primary">
              {selectedRelationship ? "Update" : "Create"}
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
    <div class="loading">Loading relationships...</div>
  {:else}
    <div class="relationships-list">
      {#each relationships as relationship (relationship.id)}
        <div class="relationship-card">
          <h4>{relationship.title}</h4>
          <p>
            <strong>Created:</strong>
            {new Date(relationship.created_at).toLocaleDateString()}
          </p>
          <p>
            <strong>Updated:</strong>
            {new Date(relationship.updated_at).toLocaleDateString()}
          </p>
          <div class="card-actions">
            <button
              on:click={() => editRelationship(relationship)}
              class="btn-secondary"
            >
              Edit
            </button>
            <button
              on:click={() => deleteRelationship(relationship.id)}
              class="btn-danger"
            >
              Delete
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .relationships-manager {
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
    background-color: #fd7e14;
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

  .form-group input,
  .form-group select,
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

  .relationships-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }

  .relationship-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    background-color: #f9f9f9;
  }

  .relationship-card h4 {
    margin: 0 0 10px 0;
    color: #333;
    text-transform: capitalize;
  }

  .relationship-card p {
    margin: 5px 0;
    color: #666;
    line-height: 1.4;
  }

  .card-actions {
    margin-top: 15px;
  }
</style>
