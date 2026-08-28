<script lang="ts">
  import type { AppStore } from '../lib/app/store.svelte'

  let { app }: { app: AppStore } = $props()

  function download() {
    const blob = new Blob([app.exportJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `hsk1-progress-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function onImport(event: Event) {
    const input = event.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    app.importJson(await file.text())
    input.value = ''
  }
</script>

<h1>Data</h1>

<p>
  <label>
    New words per day
    <input
      data-testid="new-per-day"
      type="number"
      min="0"
      value={app.progress.newPerDay}
      onchange={(e) => app.setNewPerDay(Number((e.currentTarget as HTMLInputElement).value))}
    />
  </label>
</p>

<p class="muted">
  Progress lives in this browser only. Export it if you care about keeping it —
  clearing site data erases it.
</p>

<p>
  <button data-testid="export" onclick={download}>Export progress</button>
</p>

<p>
  <label>
    Import progress
    <input data-testid="import" type="file" accept="application/json" onchange={onImport} />
  </label>
</p>

{#if app.importError}
  <p data-testid="import-error" style="color: #ff6b6b">Import failed: {app.importError}</p>
{/if}

<button data-testid="home" onclick={() => app.goHome()}>Back</button>
