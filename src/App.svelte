<script lang="ts">
  import './app.css'
  import { AppStore } from './lib/app/store.svelte'
  import Home from './components/Home.svelte'
  import Review from './components/Review.svelte'
  import Summary from './components/Summary.svelte'
  import DataScreen from './components/DataScreen.svelte'

  const app = new AppStore()
</script>

<main>
  {#if app.screen === 'home'}
    <Home {app} />
  {:else if app.screen === 'review'}
    <Review {app} />
  {:else if app.screen === 'summary'}
    <Summary {app} />
  {:else if app.screen === 'data'}
    <DataScreen {app} />
  {/if}
</main>
