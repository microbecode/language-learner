<script lang="ts">
  import type { AppStore } from '../lib/app/store.svelte'

  let { app }: { app: AppStore } = $props()

  const total = $derived(
    app.tally.again + app.tally.hard + app.tally.good + app.tally.easy,
  )
</script>

<h1 data-testid="summary">Session complete</h1>

{#if total === 0}
  <p class="muted">Nothing was due. Come back later, or raise the new-words limit.</p>
{:else}
  <p class="muted">{total} card{total === 1 ? '' : 's'} reviewed</p>
  <ul class="muted">
    <li>Again: {app.tally.again}</li>
    <li>Hard: {app.tally.hard}</li>
    <li>Good: {app.tally.good}</li>
    <li>Easy: {app.tally.easy}</li>
  </ul>
{/if}

<button data-testid="home" onclick={() => app.goHome()}>Back</button>
