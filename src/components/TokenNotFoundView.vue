<template>
  <div class="flex flex-col items-center justify-center h-full text-center px-4">
    <div class="mb-6">
      <i class="ri-error-warning-line text-5xl text-yellow-500"></i>
    </div>
    <h2 class="text-xl font-semibold text-white mb-2">{{ symbol }} 数据未找到</h2>
    <p class="text-gray-300 mb-6">该代币尚未在我们的数据库中，需要先获取数据才能查看分析报告</p>
    
    <button
      class="px-6 py-3 bg-primary text-white rounded-lg font-medium mb-4 w-full max-w-xs"
      @click="handleRefresh"
      :disabled="isRefreshing"
    >
      <span v-if="isRefreshing" class="flex items-center justify-center">
        <span class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
        正在获取数据...
      </span>
      <span v-else>
        获取并保存数据
      </span>
    </button>
    
    <p class="text-gray-400 text-sm">
      首次获取数据可能需要 15-40 秒，请耐心等待
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  symbol: string
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const isRefreshing = ref(false)

const handleRefresh = () => {
  isRefreshing.value = true
  emit('refresh')
}
</script>
