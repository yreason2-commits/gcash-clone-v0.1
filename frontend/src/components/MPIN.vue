<script setup>
const emit = defineEmits(['change-phone'])
</script>

<template>
  <main class="demo-complete">
    <section class="demo-card" aria-labelledby="demo-title">
      <h1 id="demo-title">Demo complete</h1>
      <p>
        The test code was checked locally. No phone number, OTP, or PIN was sent
        to a server or saved.
      </p>
      <button type="button" @click="emit('change-phone')">Start over</button>
    </section>
  </main>
</template>

<style scoped>
.demo-complete {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: #007bff;
  font-family: 'Nunito Sans', 'Poppins', 'Helvetica Neue', Arial, sans-serif;
}

.demo-card {
  width: min(100%, 400px);
  padding: 2rem;
  border-radius: 12px;
  background: #fff;
  color: #0f172a;
  text-align: center;
}

.demo-card h1 {
  margin: 0 0 1rem;
}

.demo-card p {
  color: #475569;
  line-height: 1.5;
}

.demo-card button {
  margin-top: 1rem;
  padding: 0.8rem 1.5rem;
  border: 0;
  border-radius: 999px;
  background: #007bff;
  color: #fff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}
</style>
