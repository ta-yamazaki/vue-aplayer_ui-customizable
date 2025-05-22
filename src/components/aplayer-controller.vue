<template>
  <div class="aplayer-controller">
   <span class="aplayer-ptime"
         :style="{fontSize: aplayerTimeFontSize}"
   >{{ secondToTime(stat.playedTime) }}</span>
    <v-progress
      :loadProgress="loadProgress"
      :playProgress="playProgress"
      :theme="theme"
      :large="large"
      @dragbegin="val => $emit('dragbegin', val)"
      @dragend="val => $emit('dragend', val)"
      @dragging="val => $emit('dragging', val)"
    />
    <span class="aplayer-dtime"
          :style="{fontSize: aplayerTimeFontSize}"
    >{{ secondToTime(stat.duration) }}</span>
    <div class="aplayer-time">
      <volume
        v-if="!$parent.isMobile && showControls.includes('volume')"
        :muted="muted"
        :theme="theme"
        :volume="volume"
        :large="large"
        @setvolume="v => $emit('setvolume', v)"
        @togglemute="$emit('togglemute')"
      />
      <icon-button
        v-if="showControls.includes('shuffle')"
        class="aplayer-icon-mode"
        :class="{ 'inactive': !shuffle }"
        icon="shuffle"
        :color="darkThemeColor"
        @click.native="$emit('toggleshuffle')"
        :large="large"
      />
      <icon-button
        v-if="showControls.includes('repeat')"
        class="aplayer-icon-mode"
        :class="{ 'inactive': repeat === 'no-repeat'}"
        :icon="repeat === 'repeat-one' ? 'repeat-one' : 'repeat-all'"
        :color="darkThemeColor"
        @click.native="$emit('nextmode')"
        :large="large"
      />
      <icon-button
        v-if="showControls.includes('toggleList')"
        class="aplayer-icon-menu"
        :icon="$parent.showList ? 'arrow-up' : 'arrow-down'"
        :color="darkThemeColor"
        :large="large"
        @click.native="$emit('togglelist')"
      />
    </div>
  </div>
</template>

<script>
import IconButton from './aplayer-iconbutton.vue'
import VProgress from './aplayer-controller-progress.vue'
import Volume from './aplayer-controller-volume.vue'
import {darkenColor} from "../colorUtils";

export default {
  components: {
    IconButton,
    VProgress,
    Volume,
  },
  props: ['shuffle', 'repeat', 'stat', 'theme', 'volume', 'muted', 'showControls', 'large'],
  computed: {
    loadProgress() {
      if (this.stat.duration === 0) return 0
      return this.stat.loadedTime / this.stat.duration
    },
    playProgress() {
      if (this.stat.duration === 0) return 0
      return this.stat.playedTime / this.stat.duration
    },
    darkThemeColor() {
      return darkenColor(this.theme)
    },
    aplayerTimeFontSize() {
      return this.large ? "12px" : "10px"
    },
  },
  methods: {
    secondToTime(second) {
      if (isNaN(second)) return '00:00'

      const pad0 = (num) => {
        return num < 10 ? '0' + num : '' + num
      }

      const min = Math.trunc(second / 60)
      const sec = Math.trunc(second - min * 60)
      const hours = Math.trunc(min / 60)
      const minAdjust = Math.trunc((second / 60) - (60 * Math.trunc((second / 60) / 60)))
      return second >= 3600 ? pad0(hours) + ':' + pad0(minAdjust) + ':' + pad0(sec) : pad0(min) + ':' + pad0(sec)
    },
  },
}
</script>

<style lang="scss" scoped>
.aplayer-controller {
  display: flex;
  align-items: center;
  position: relative;
  margin: 4px 6px;

  .aplayer-time {
    display: flex;
    align-items: center;
    position: relative;
    height: 17px;
    color: #999;
    font-size: 11px;
    padding-left: 7px;

    .aplayer-volume-wrap {
      margin-left: 4px;
      margin-right: 4px;
    }

    .aplayer-icon {
      cursor: pointer;
      transition: all 0.2s ease;
      margin-left: 4px;

      &.inactive {
        opacity: .3;
      }

      .aplayer-fill {
        fill: #666;
      }

      &:hover {
        .aplayer-fill {
          fill: #000;
        }
      }

      &.aplayer-icon-menu {
        display: block;
      }
    }

    .aplayer-volume-wrap + .aplayer-icon {
      margin-left: 0;
    }
  }
}
</style>