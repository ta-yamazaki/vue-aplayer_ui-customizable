<template>
  <button
    class="aplayer-icon"
    :class="playing ? 'aplayer-icon-pause' : 'aplayer-icon-play'"
    type="button"
  >
    <icon :type="playing ? 'pause' : 'play'" :color="color"/>
  </button>
</template>

<script>
import Icon from './aplayer-icon.vue'

export default {
  components: {
    Icon,
  },
  props: {
    color: {
      type: String,
      default: "black",
    },
    playing: {
      type: Boolean,
      require: false,
    },
  },
}
</script>

<style lang="scss" scoped>

.aplayer-icon-play {
  position: absolute;
  top: 50%;
  left: 50%;
  padding-left: 5px;
  transform: translate(-50%, -50%);
  height: 70%;
  width: 70%;
}

.aplayer-icon-pause {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  height: 50%;
  width: 50%;
}
</style>