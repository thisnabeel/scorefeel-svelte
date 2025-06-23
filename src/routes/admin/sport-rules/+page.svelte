<script>
  import SportRulesManager from "$lib/components/SportRulesManager.svelte";
</script>

<svelte:head>
  <title>Sport Rules Management - ScoreFeel Admin</title>
</svelte:head>

<div class="sport-rules-page">
  <header class="page-header">
    <h1>Sport Rules Management</h1>
    <p>Manage rules and regulations for different sports</p>
  </header>

  <SportRulesManager />
</div>

<style>
  .sport-rules-page {
    min-height: 100vh;
    background-color: #f8f9fa;
  }

  .page-header {
    background-color: #6f42c1;
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
