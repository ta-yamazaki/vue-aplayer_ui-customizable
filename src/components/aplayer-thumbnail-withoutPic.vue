<template>
  <div
    :style="{ backgroundColor: theme }"
    class="aplayer-pic"
    @click="onClick"
    @mousedown="onDragBegin"
  >
    <div class="aplayer-button">
      <aplayer-play-pause-button
        :playing="playing"
        color="white"
      />
    </div>
  </div>
</template>
<script>
import AplayerPlayPauseButton from "./aplayer-playPauseButton.vue";

export default {
  components: {
    AplayerPlayPauseButton,
  },
  props: {
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
      hasMovedSinceMouseDown: false,
      dragStartX: 0,
      dragStartY: 0
    }
  },
  computed: {
  },
  methods: {
    onDragBegin(e) {
      if (this.enableDrag) {
        this.hasMovedSinceMouseDown = false
        this.$emit('dragbegin')
        this.dragStartX = e.clientX
        this.dragStartY = e.clientY
        document.addEventListener('mousemove', this.onDocumentMouseMove)
        document.addEventListener('mouseup', this.onDocumentMouseUp)
      }
    },
    onDocumentMouseMove(e) {
      this.hasMovedSinceMouseDown = true
      this.$emit('dragging', {offsetLeft: e.clientX - this.dragStartX, offsetTop: e.clientY - this.dragStartY})
    },
    onDocumentMouseUp(e) {
      document.removeEventListener('mouseup', this.onDocumentMouseUp)
      document.removeEventListener('mousemove', this.onDocumentMouseMove)

      this.$emit('dragend')
    },
    onClick() {
      if (!this.hasMovedSinceMouseDown)
        this.$emit('toggleplay')
    }
  }
}
</script>

<style lang="scss" scoped>
@import "../scss/variables";

.aplayer-float {
  .aplayer-pic:active {
    cursor: move;
  }
}

.aplayer-pic {
  flex-shrink: 0;

  position: relative;
  height: $aplayer-height;
  width: $aplayer-height;
  background-image: url(../default.jpg);
  background-size: cover;
  transition: all 0.3s ease;
  cursor: pointer;

  .aplayer-button {
    position: absolute;
    border-radius: 50%;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
    background: rgba(0, 0, 0, 0.2);

    width: 58px;
    height: 58px;
    border: 2px solid #fff;
    top: 50%;
    left: 50%;
    /* 要素の中央を基準にするために自分の幅・高さの半分だけ戻す */
    transform: translate(-50%, -50%);
    //bottom: 50%;
    //right: 50%;
    //margin: 0 -15px -15px 0;

  }
}

</style>