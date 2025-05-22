<template>
  <div>
    <thumbnail-with-pic
      v-if="showPic"
      :pic="pic"
      :playing="playing"
      :enable-drag="enableDrag"
      :theme="theme"
      @toggleplay="$listeners['toggleplay']"
      @dragbegin="$listeners['dragbegin']"
      @dragging="$listeners['dragging']"
    />
    <thumbnail-without-pic
      v-if="!showPic"
      :playing="playing"
      :enable-drag="enableDrag"
      :theme="theme"
      @toggleplay="$listeners['toggleplay']"
      @dragbegin="$listeners['dragbegin']"
      @dragging="$listeners['dragging']"
    />
  </div>
</template>
<script>
import ThumbnailWithPic from './aplayer-thumbnail-withPic.vue'
import ThumbnailWithoutPic from './aplayer-thumbnail-withoutPic.vue'

export default {
  components: {
    ThumbnailWithPic,
    ThumbnailWithoutPic,
  },
  props: {
    showPic: {
      type: Boolean,
      default: false
    },
    pic: String,
    theme: String,
    playing: {
      type: Boolean,
      default: false,
    },
    enableDrag: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
    }
  },
  computed: {
  },
  methods: {
  }
}
</script>

<style lang="scss" scoped>
</style>