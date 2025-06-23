<script>
  import { goto } from "$app/navigation";
</script>

<svelte:head>
  <title>Admin Dashboard - ScoreFeel</title>
</svelte:head>

<div class="admin-dashboard">
  <header class="dashboard-header">
    <h1>Admin Dashboard</h1>
    <p>Manage your sports journalism content</p>
  </header>

  <main class="dashboard-content">
    <div class="resources-grid">
      <div class="resource-card" on:click={() => goto("/admin/figures")}>
        <div class="resource-icon figures">👥</div>
        <h3>Figures</h3>
        <p>Manage athletes, coaches, and other sports figures</p>
      </div>

      <div class="resource-card" on:click={() => goto("/admin/sports")}>
        <div class="resource-icon sports">⚽</div>
        <h3>Sports</h3>
        <p>Manage different sports and their configurations</p>
      </div>

      <div class="resource-card" on:click={() => goto("/admin/sport-rules")}>
        <div class="resource-icon rules">📋</div>
        <h3>Sport Rules</h3>
        <p>Manage rules and regulations for different sports</p>
      </div>

      <div class="resource-card" on:click={() => goto("/admin/relationships")}>
        <div class="resource-icon relationships">🔗</div>
        <h3>Relationships</h3>
        <p>Manage connections between sports figures</p>
      </div>

      <div class="resource-card" on:click={() => goto("/admin/events")}>
        <div class="resource-icon events">🏆</div>
        <h3>Events</h3>
        <p>Manage sports events and competitions</p>
      </div>

      <div class="resource-card" on:click={() => goto("/admin/tags")}>
        <div class="resource-icon tags">🏷️</div>
        <h3>Tags</h3>
        <p>Manage content tags and categories</p>
      </div>

      <div class="resource-card" on:click={() => goto("/admin/stories")}>
        <div class="resource-icon stories">📰</div>
        <h3>Stories</h3>
        <p>Manage sports journalism articles and content</p>
      </div>
    </div>

    <div class="quick-actions">
      <h2>Quick Actions</h2>
      <div class="actions-grid">
        <button class="action-btn" on:click={() => goto("/admin/figures")}>
          Add New Figure
        </button>
        <button class="action-btn" on:click={() => goto("/admin/sports")}>
          Add New Sport
        </button>
        <button class="action-btn" on:click={() => goto("/admin/stories")}>
          Create New Story
        </button>
        <button class="action-btn" on:click={() => goto("/admin/events")}>
          Schedule Event
        </button>
      </div>
    </div>
  </main>
</div>

<style>
  .admin-dashboard {
    min-height: 100vh;
    background-color: #f8f9fa;
  }

  .dashboard-header {
    background-color: #343a40;
    color: white;
    padding: 2rem;
    text-align: center;
  }

  .dashboard-header h1 {
    margin: 0 0 0.5rem 0;
    font-size: 2.5rem;
  }

  .dashboard-header p {
    margin: 0;
    opacity: 0.8;
    font-size: 1.1rem;
  }

  .dashboard-content {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .resources-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
  }

  .resource-card {
    background-color: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: all 0.3s ease;
    border: 2px solid transparent;
  }

  .resource-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border-color: #007bff;
  }

  .resource-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    display: block;
  }

  .resource-card h3 {
    margin: 0 0 0.5rem 0;
    color: #333;
    font-size: 1.5rem;
  }

  .resource-card p {
    margin: 0;
    color: #666;
    line-height: 1.4;
  }

  .quick-actions {
    background-color: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .quick-actions h2 {
    margin: 0 0 1.5rem 0;
    color: #333;
  }

  .actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .action-btn {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.3s ease;
  }

  .action-btn:hover {
    background-color: #0056b3;
  }
</style>
