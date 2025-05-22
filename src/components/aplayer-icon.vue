<template>
  <div class="svg-container" v-html="processedSvg" />
</template>

<script>
import {error} from "../utils";

export default {
  data() {
    return {
      rawSvg: ''
    }
  },
  props: {
    type: {type: String, require: true,},
    color: {type: String, default: "black",},
  },
  computed: {
    processedSvg() {
      if (!this.rawSvg) return ''

      // Replace width, height, fill
      let svg = this.rawSvg.replace(/<svg([^>]+)>/, (match, attrs) => {
        let updated = attrs.replace(/(width|height|fill)="[^"]*"/g, '')
        return `<svg${updated} width="100%" height="100%" fill="${this.color}">`
      })

      return svg
    }
  },
  async created() {
    try {
      const svg = await import(`../assets/svg/${this.type}.svg?raw`)
      this.rawSvg = svg.default
    } catch (e) {
      error(e)
    }
  },
  watch: {
    type: {
      immediate: true,
      handler: async function () {
        try {
          const svg = await import(`../assets/svg/${this.type}.svg?raw`)
          this.rawSvg = svg.default
        } catch (e) {
          error(e)
        }
      }
    }
  }
}
</script>

<style scoped>
.svg-container {
  display: inline-block;
  width: 100%;
  height: 100%;
}
</style>