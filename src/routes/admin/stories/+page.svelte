<script>
  import StoriesManager from "$lib/components/StoriesManager.svelte";
</script>

<svelte:head>
  <title>Stories Management - ScoreFeel Admin</title>
</svelte:head>

<div class="stories-page">
  <header class="page-header">
    <h1>Stories Management</h1>
    <p>Manage sports journalism articles and content</p>
  </header>

  <StoriesManager />
</div>

<style>
  .stories-page {
    min-height: 100vh;
    background-color: #f8f9fa;
  }

  .page-header {
    background-color: #17a2b8;
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
