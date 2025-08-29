<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

// Reactive state for form inputs and error messages
const userId = ref('')
const password = ref('')
const errorMessage = ref('')

// Access the router instance
const router = useRouter()

// Dummy credentials for validation
const DUMMY_USER_ID = 'hatchMaster'
const DUMMY_PASSWORD = 'password123'

function handleLogin() {
  // Reset error message on new attempt
  errorMessage.value = ''

  // Validate against dummy credentials
  if (userId.value === DUMMY_USER_ID && password.value === DUMMY_PASSWORD) {
    // On success, navigate to the hatchery page
    router.push('/floorplan')
  } else {
    // On failure, show an error message
    errorMessage.value = 'Invalid User ID or Password. Please try again.'
  }
}
</script>

<template>
  <main class="flex items-center justify-center min-h-screen bg-slate-100">
    <div class="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
      <div class="text-center">
        <h1 class="text-3xl font-bold text-slate-800">Hatchery Sign-On</h1>
        <p class="text-slate-500">Please enter your credentials to continue</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label for="userId" class="block mb-2 text-sm font-medium text-slate-700">User ID</label>
          <input
              v-model="userId"
              id="userId"
              type="text"
              placeholder="e.g., hatchMaster"
              required
              class="w-full px-4 py-2 border rounded-md border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div>
          <label for="password" class="block mb-2 text-sm font-medium text-slate-700">Password</label>
          <input
              v-model="password"
              id="password"
              type="password"
              placeholder="e.g., password123"
              required
              class="w-full px-4 py-2 border rounded-md border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div v-if="errorMessage" class="p-3 text-sm text-red-700 bg-red-100 rounded-md">
          {{ errorMessage }}
        </div>

        <button
            type="submit"
            class="w-full px-4 py-2 font-semibold text-white transition-colors bg-sky-600 rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
        >
          Sign In
        </button>
      </form>
    </div>
  </main>
</template>