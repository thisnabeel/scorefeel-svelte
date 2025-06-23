<script>
  import RelationshipsManager from "$lib/components/RelationshipsManager.svelte";
</script>

<svelte:head>
  <title>Relationships Management - ScoreFeel Admin</title>
</svelte:head>

<div class="relationships-page">
  <header class="page-header">
    <h1>Relationships Management</h1>
    <p>Manage connections between sports figures</p>
  </header>

  <RelationshipsManager />
</div>

<style>
  .relationships-page {
    min-height: 100vh;
    background-color: #f8f9fa;
  }

  .page-header {
    background-color: #fd7e14;
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
