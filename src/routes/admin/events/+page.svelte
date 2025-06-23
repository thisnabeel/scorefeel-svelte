<script>
  import EventsManager from "$lib/components/EventsManager.svelte";
</script>

<svelte:head>
  <title>Events Management - ScoreFeel Admin</title>
</svelte:head>

<div class="events-page">
  <header class="page-header">
    <h1>Events Management</h1>
    <p>Manage sports events and competitions</p>
  </header>

  <EventsManager />
</div>

<style>
  .events-page {
    min-height: 100vh;
    background-color: #f8f9fa;
  }

  .page-header {
    background-color: #e83e8c;
    color: white;
    padding: 2rem;
    text-align: center;
  }

  .page-header h1 {
    margin: 0 0 0.5rem 0;
    font-size: 2.5rem;
  }

  .page-header p {
    margin: 0;
    opacity: 0.9;
    font-size: 1.1rem;
  }
</style>
