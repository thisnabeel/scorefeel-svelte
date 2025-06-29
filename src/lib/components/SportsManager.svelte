<script>
  import { onMount } from "svelte";
  import API from "$lib/api/api.js";
  import { goto } from "$app/navigation";

  let sports = [];
  let loading = false;
  let error = null;
  let selectedSport = null;
  let showForm = false;
  let formData = {
    title: "",
    sport_id: "",
    position: "",
  };

  // Load all sports
  async function loadSports() {
    loading = true;
    error = null;
    try {
      sports = await API.get("/sports");
    } catch (err) {
      error = "Failed to load sports";
      console.error(err);
    } finally {
      loading = false;
    }
  }

  // Get a specific sport
  async function getSport(id) {
    try {
      const sport = await API.get(`/sports/${id}`);
      return sport;
    } catch (err) {
      console.error("Failed to get sport:", err);
      throw err;
    }
  }

  // Create a new sport
  async function createSport() {
    try {
      const newSport = await API.post("/sports", { sport: formData });
      sports = [...sports, newSport];
      resetForm();
      showForm = false;
    } catch (err) {
      error = "Failed to create sport";
      console.error(err);
    }
  }

  // Update a sport
  async function updateSport(id) {
    try {
      const updatedSport = await API.put(`/sports/${id}`, { sport: formData });
      sports = sports.map((s) => (s.id === id ? updatedSport : s));
      resetForm();
      showForm = false;
    } catch (err) {
      error = "Failed to update sport";
      console.error(err);
    }
  }

  // Delete a sport
  async function deleteSport(id) {
    if (confirm("Are you sure you want to delete this sport?")) {
      try {
        await API.delete(`/sports/${id}`);
        sports = sports.filter((s) => s.id !== id);
      } catch (err) {
        error = "Failed to delete sport";
        console.error(err);
      }
    }
  }

  // Edit a sport
  function editSport(sport) {
    selectedSport = sport;
    formData = { ...sport };
    showForm = true;
  }

  // Reset form
  function resetForm() {
    formData = { title: "", sport_id: "", position: "" };
    selectedSport = null;
  }

  // Handle form submission
  function handleSubmit() {
    if (selectedSport) {
      updateSport(selectedSport.id);
    } else {
      createSport();
    }
  }

  onMount(() => {
    loadSports();
  });
</script>

<div class="sports-manager">
  <h2>Sports Management</h2>

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
    Add New Sport
  </button>

  {#if showForm}
    <div class="form-overlay">
      <div class="form-container">
        <h3>{selectedSport ? "Edit Sport" : "Create New Sport"}</h3>
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
            <label for="sport_id">Parent Sport ID:</label>
            <input id="sport_id" type="number" bind:value={formData.sport_id} />
          </div>

          <div class="form-group">
            <label for="position">Position:</label>
            <input id="position" type="number" bind:value={formData.position} />
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary">
              {selectedSport ? "Update" : "Create"}
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
    <div class="loading">Loading sports...</div>
  {:else}
    <div class="sports-list">
      {#each sports as sport (sport.id)}
        <div class="sport-card">
          <button
            class="toggle-public-btn"
            title={sport.public ? "Set Private" : "Set Public"}
            on:click={async (e) => {
              e.stopPropagation();
              try {
                const updated = await API.put(`/sports/${sport.id}`, {
                  public: !sport.public,
                });
                sports = sports.map((s) =>
                  s.id === sport.id ? { ...s, public: updated.public } : s
                );
              } catch (err) {
                error = "Failed to toggle public status";
                console.error(err);
              }
            }}
          >
            <i class={sport.public ? "fa fa-toggle-on" : "fa fa-toggle-off"}
            ></i>
          </button>
          <h4>{sport.title}</h4>
          <p><strong>Parent Sport ID:</strong> {sport.sport_id || "None"}</p>
          <p><strong>Position:</strong> {sport.position || "Not set"}</p>
          <p>
            <strong>Created:</strong>
            {new Date(sport.created_at).toLocaleDateString()}
          </p>
          <div class="card-actions">
            <button
              on:click={() => goto(`/admin/sports/${sport.id}`)}
              class="btn-view">View</button
            >
            <button on:click={() => editSport(sport)} class="btn-secondary"
              >Edit</button
            >
            <button on:click={() => deleteSport(sport.id)} class="btn-danger"
              >Delete</button
            >
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .sports-manager {
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
    background-color: #28a745;
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
    background-color: #17a2b8;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    margin-right: 8px;
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

  .sports-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }

  .sport-card {
    position: relative;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    background-color: #f9f9f9;
  }

  .sport-card h4 {
    margin: 0 0 10px 0;
    color: #333;
  }

  .sport-card p {
    margin: 5px 0;
    color: #666;
    line-height: 1.4;
  }

  .card-actions {
    margin-top: 15px;
  }

  .toggle-public-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.6rem;
    color: #28a745;
    z-index: 2;
    transition: color 0.2s;
  }

  .toggle-public-btn .fa-toggle-off {
    color: #aaa;
  }

  .toggle-public-btn .fa-toggle-on {
    color: #28a745;
  }
</style>
