<script>
  import FiguresManager from "$lib/components/FiguresManager.svelte";
</script>

<svelte:head>
  <title>Figures Management - ScoreFeel Admin</title>
</svelte:head>

<div class="figures-page">
  <header class="page-header">
    <h1>Figures Management</h1>
    <p>Manage athletes, coaches, and other sports figures</p>
  </header>

  <FiguresManager />
</div>

<style>
  .figures-page {
    min-height: 100vh;
    background-color: #f8f9fa;
  }

  .page-header {
    background-color: #007bff;
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
