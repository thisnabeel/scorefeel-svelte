<script>
  import TagsManager from "$lib/components/TagsManager.svelte";
</script>

<svelte:head>
  <title>Tags Management - ScoreFeel Admin</title>
</svelte:head>

<div class="tags-page">
  <header class="page-header">
    <h1>Tags Management</h1>
    <p>Manage content tags and categories</p>
  </header>

  <TagsManager />
</div>

<style>
  .tags-page {
    min-height: 100vh;
    background-color: #f8f9fa;
  }

  .page-header {
    background-color: #20c997;
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
