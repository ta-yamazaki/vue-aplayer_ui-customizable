<template>
  <button
    class="aplayer-icon"
    type="button"
  >
    <icon :type="icon" :color="color"/>
  </button>
</template>

<script>
import Icon from './aplayer-icon.vue'

export default {
  components: {
    Icon,
  },
  props: {
    icon: String,
    color: {
      type: String,
      default: "black",
    },
  },
}
</script>


<style lang="scss">
.aplayer-icon {
  width: 15px;
  height: 15px;
  border: none;
  background-color: transparent;
  outline: none;
  cursor: pointer;
  opacity: .8;
  vertical-align: middle;
  padding: 0;
  font-size: 12px;
  margin: 0;
  display: inline;

  &:hover {
    opacity: 1;
  }

  .aplayer-fill {
    transition: all .2s ease-in-out;
  }
}
</style>