<script>
  import SportsManager from "$lib/components/SportsManager.svelte";
</script>

<svelte:head>
  <title>Sports Management - ScoreFeel Admin</title>
</svelte:head>

<div class="sports-page">
  <header class="page-header">
    <h1>Sports Management</h1>
    <p>Manage different sports and their configurations</p>
  </header>

  <SportsManager />
</div>

<style>
  .sports-page {
    min-height: 100vh;
    background-color: #f8f9fa;
  }

  .page-header {
    background-color: #28a745;
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
