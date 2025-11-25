<!--
  InfiniteScroller Component
  Feature: 005-table-enhancements
  Tasks: T056, T057, T058, T059
  Requirements: FR-028, FR-029, FR-030, FR-031

  Wrapper component for infinite scroll with loading indicator and back-to-top
-->

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

interface Props {
  /** Whether more items are available to load */
  hasMore: boolean
  /** Whether currently loading more items */
  isLoading: boolean
  /** Height of the scrollable container */
  height?: string
  /** Show back to top button */
  showBackToTop?: boolean
  /** Pixels from bottom to trigger load more */
  threshold?: number
}

const props = withDefaults(defineProps<Props>(), {
  height: '600px',
  showBackToTop: true,
  threshold: 200
})

const emit = defineEmits<{
  loadMore: []
}>()

const containerRef = ref<HTMLElement | null>(null)
const scrollPosition = ref(0)

const showBackToTopButton = computed(() => {
  return props.showBackToTop && scrollPosition.value > 400
})

function handleScroll(event: Event) {
  const target = event.target as HTMLElement
  if (!target) return

  scrollPosition.value = target.scrollTop

  // Check if near bottom
  if (props.isLoading || !props.hasMore) return

  const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight

  if (scrollBottom < props.threshold) {
    emit('loadMore')
  }
}

function scrollToTop() {
  if (containerRef.value) {
    containerRef.value.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }
}

onMounted(() => {
  if (containerRef.value) {
    containerRef.value.addEventListener('scroll', handleScroll, { passive: true })
  }
})

onUnmounted(() => {
  if (containerRef.value) {
    containerRef.value.removeEventListener('scroll', handleScroll)
  }
})

// Expose for parent component
defineExpose({
  scrollToTop,
  container: containerRef
})
</script>

<template>
  <div class="infinite-scroller-wrapper">
    <div
      ref="containerRef"
      class="infinite-scroller"
      :style="{ maxHeight: height }"
    >
      <slot></slot>

      <!-- Loading indicator at bottom -->
      <div v-if="isLoading" class="loading-indicator">
        <div class="loading-spinner"></div>
        <span>Loading more...</span>
      </div>

      <!-- End of list indicator -->
      <div v-else-if="!hasMore" class="end-indicator">
        <span>No more items to load</span>
      </div>
    </div>

    <!-- Back to top button -->
    <Transition name="fade-slide">
      <button
        v-if="showBackToTopButton"
        @click="scrollToTop"
        class="back-to-top-btn"
        aria-label="Back to top"
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      </button>
    </Transition>
  </div>
</template>

<style scoped>
.infinite-scroller-wrapper {
  position: relative;
}

.infinite-scroller {
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: smooth;
}

.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.5rem;
  color: #6c757d;
  font-size: 0.9rem;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e0e0e0;
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.end-indicator {
  text-align: center;
  padding: 1rem;
  color: #95a5a6;
  font-size: 0.85rem;
  font-style: italic;
}

.back-to-top-btn {
  position: absolute;
  bottom: 1.5rem;
  right: 1.5rem;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: #3498db;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
  transition: all 0.2s ease;
  z-index: 100;
}

.back-to-top-btn:hover {
  background-color: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(52, 152, 219, 0.5);
}

.back-to-top-btn:active {
  transform: translateY(0);
}

.back-to-top-btn:focus-visible {
  outline: 2px solid white;
  outline-offset: 2px;
}

/* Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
