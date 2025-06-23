<script>
  import { onMount } from "svelte";
  import API from "$lib/api/api.js";

  let examples = {
    figures: [],
    sports: [],
    stories: [],
    tags: [],
  };
  let loading = {};
  let error = null;

  // Example: Get all figures
  async function loadFigures() {
    loading.figures = true;
    try {
      examples.figures = await API.get("/figures");
    } catch (err) {
      error = "Failed to load figures";
      console.error(err);
    } finally {
      loading.figures = false;
    }
  }

  // Example: Get a specific sport
  async function loadSport(id) {
    try {
      const sport = await API.get(`/sports/${id}`);
      console.log("Loaded sport:", sport);
      return sport;
    } catch (err) {
      console.error("Failed to load sport:", err);
      throw err;
    }
  }

  // Example: Create a new tag
  async function createTag(tagData) {
    try {
      const newTag = await API.post("/tags", { tag: tagData });
      console.log("Created tag:", newTag);
      return newTag;
    } catch (err) {
      console.error("Failed to create tag:", err);
      throw err;
    }
  }

  // Example: Update a story
  async function updateStory(id, storyData) {
    try {
      const updatedStory = await API.put(`/stories/${id}`, {
        story: storyData,
      });
      console.log("Updated story:", updatedStory);
      return updatedStory;
    } catch (err) {
      console.error("Failed to update story:", err);
      throw err;
    }
  }

  // Example: Delete an event
  async function deleteEvent(id) {
    try {
      await API.delete(`/events/${id}`);
      console.log("Deleted event:", id);
    } catch (err) {
      console.error("Failed to delete event:", err);
      throw err;
    }
  }

  // Example: Get sport rules with error handling
  async function loadSportRules() {
    loading.sportRules = true;
    try {
      const rules = await API.get("/sport_rules");
      console.log("Sport rules:", rules);
      return rules;
    } catch (err) {
      console.error("Failed to load sport rules:", err);
      error = "Failed to load sport rules";
    } finally {
      loading.sportRules = false;
    }
  }

  // Example: Get relationships
  async function loadRelationships() {
    try {
      const relationships = await API.get("/relationships");
      console.log("Relationships:", relationships);
      return relationships;
    } catch (err) {
      console.error("Failed to load relationships:", err);
      throw err;
    }
  }

  // Example: Create a new figure
  async function createFigure(figureData) {
    try {
      const newFigure = await API.post("/figures", { figure: figureData });
      console.log("Created figure:", newFigure);
      return newFigure;
    } catch (err) {
      console.error("Failed to create figure:", err);
      throw err;
    }
  }

  onMount(() => {
    // Load some initial data
    loadFigures();
  });
</script>

<div class="api-examples">
  <h2>API Usage Examples</h2>

  {#if error}
    <div class="error">{error}</div>
  {/if}

  <div class="examples-grid">
    <!-- GET Examples -->
    <div class="example-card">
      <h3>GET Examples</h3>

      <div class="example-item">
        <h4>Get All Figures</h4>
        <button on:click={loadFigures} disabled={loading.figures}>
          {loading.figures ? "Loading..." : "Load Figures"}
        </button>
        {#if examples.figures.length > 0}
          <p>Loaded {examples.figures.length} figures</p>
        {/if}
      </div>

      <div class="example-item">
        <h4>Get Specific Sport</h4>
        <button on:click={() => loadSport(1)}> Load Sport ID 1 </button>
      </div>

      <div class="example-item">
        <h4>Get Sport Rules</h4>
        <button on:click={loadSportRules} disabled={loading.sportRules}>
          {loading.sportRules ? "Loading..." : "Load Sport Rules"}
        </button>
      </div>

      <div class="example-item">
        <h4>Get Relationships</h4>
        <button on:click={loadRelationships}> Load Relationships </button>
      </div>
    </div>

    <!-- POST Examples -->
    <div class="example-card">
      <h3>POST Examples</h3>

      <div class="example-item">
        <h4>Create New Tag</h4>
        <button
          on:click={() =>
            createTag({ name: "Breaking News", color: "#ff0000" })}
        >
          Create Tag
        </button>
      </div>

      <div class="example-item">
        <h4>Create New Figure</h4>
        <button
          on:click={() =>
            createFigure({
              title: "New Athlete",
              sport_id: 1,
              position: 1,
            })}
        >
          Create Figure
        </button>
      </div>
    </div>

    <!-- PUT Examples -->
    <div class="example-card">
      <h3>PUT Examples</h3>

      <div class="example-item">
        <h4>Update Story</h4>
        <button
          on:click={() =>
            updateStory(1, {
              title: "Updated Title",
              content: "Updated content...",
            })}
        >
          Update Story ID 1
        </button>
      </div>
    </div>

    <!-- DELETE Examples -->
    <div class="example-card">
      <h3>DELETE Examples</h3>

      <div class="example-item">
        <h4>Delete Event</h4>
        <button on:click={() => deleteEvent(1)}> Delete Event ID 1 </button>
      </div>
    </div>
  </div>

  <div class="api-info">
    <h3>API Usage Notes</h3>
    <ul>
      <li>All API methods return JSON data directly (no need to parse)</li>
      <li>Error handling is built into the API client</li>
      <li>
        Authentication headers are automatically added if user is logged in
      </li>
      <li>
        Use <code>await API.get()</code>, <code>await API.post()</code>, etc.
      </li>
      <li>
        Data should be wrapped in the appropriate key (e.g., <code
          >&#123; figure: data &#125;</code
        >)
      </li>
    </ul>
  </div>
</div>

<style>
  .api-examples {
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

  .examples-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }

  .example-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    background-color: white;
  }

  .example-card h3 {
    margin: 0 0 15px 0;
    color: #333;
    border-bottom: 2px solid #007bff;
    padding-bottom: 5px;
  }

  .example-item {
    margin-bottom: 15px;
    padding: 10px;
    background-color: #f8f9fa;
    border-radius: 4px;
  }

  .example-item h4 {
    margin: 0 0 8px 0;
    color: #555;
    font-size: 0.9rem;
  }

  .example-item button {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .example-item button:hover:not(:disabled) {
    background-color: #0056b3;
  }

  .example-item button:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }

  .example-item p {
    margin: 5px 0 0 0;
    font-size: 0.8rem;
    color: #666;
  }

  .api-info {
    background-color: #e7f3ff;
    border: 1px solid #b3d9ff;
    border-radius: 8px;
    padding: 20px;
  }

  .api-info h3 {
    margin: 0 0 15px 0;
    color: #0056b3;
  }

  .api-info ul {
    margin: 0;
    padding-left: 20px;
  }

  .api-info li {
    margin-bottom: 8px;
    line-height: 1.4;
  }

  .api-info code {
    background-color: #f1f3f4;
    padding: 2px 4px;
    border-radius: 3px;
    font-family: "Courier New", monospace;
  }
</style>
