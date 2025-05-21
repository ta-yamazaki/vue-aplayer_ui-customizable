<template>
  <svg :style="style" :viewBox="svg.viewBox" height="100%" version="1.1" width="100%"
       xmlns:xlink="http://www.w3.org/1999/xlink">
    <use xlink:href="#aplayer-${type}"></use>
    <path :d="svg.d" class="aplayer-fill"></path>
  </svg>
</template>

<script>
const requireAssets = require.context('../assets', false, /\.svg$/)
const SVGs = requireAssets.keys().reduce((svgs, path) => {
  const inlineSvg = requireAssets(path)
  const [raw, viewBox, d] = inlineSvg.match(/^<svg.+?viewBox="(.+?)".*><path.+?d="(.+?)".*><\/path><\/svg>$/)

  svgs[path.match(/^.*\/(.+?)\.svg$/)[1]] = {
    viewBox,
    d
  }
  return svgs
}, {})

export default {
  props: ['type'],
  computed: {
    svg() {
      let icon = this.type
      if (this.type === 'prev' || this.type === 'next') {
        icon = 'skip'
      }
      return SVGs[this.type] || {}
    },
    style() {
      if (this.type === 'next') {
        return {
          transform: 'rotate(180deg)',
        }
      }
      return {}
    }
  }
}
</script>