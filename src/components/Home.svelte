<script lang="ts">
  import type { AppStore } from '../lib/app/store.svelte'

  let { app }: { app: AppStore } = $props()
</script>

<h1>HSK 1 Drill</h1>

<p class="muted">
  {app.dueCount} due · {app.newCount} new available ·
  {app.learnedCount} of {app.deck.length} learned
</p>

<p>
  <button data-testid="start-session" onclick={() => app.startSession()}>
    Start session
  </button>
  <button data-testid="open-data" onclick={() => app.goData()}>Data</button>
</p>
