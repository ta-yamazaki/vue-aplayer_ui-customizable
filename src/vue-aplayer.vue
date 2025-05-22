<template>
  <div
    class="aplayer"
    :class="{
      'aplayer-mini': mini,
      'aplayer-withlist' : !mini && list.length > 0,
      'aplayer-withlrc': !mini && (!!$slots.display || showLrc),
      'aplayer-float': isFloatMode,
      'aplayer-cornerRounded': cornerRounded,
      'aplayer-loading': isPlaying && isLoading
    }"
    :style="floatStyleObj"
  >
    <div class="aplayer-body">
      <thumbnail
        v-if="showPic"
        :pic="currentMusic.pic"
        :playing="isPlaying"
        :enable-drag="isFloatMode"
        :theme="currentTheme"
        @toggleplay="toggle"
        @dragbegin="onDragBegin"
        @dragging="onDragAround"
      />
      <no-thumbnail
        v-if="!showPic"
        :playing="isPlaying"
        :enable-drag="isFloatMode"
        :theme="currentTheme"
        @toggleplay="toggle"
        @dragbegin="onDragBegin"
        @dragging="onDragAround"
      />
      <div class="aplayer-info" v-show="!mini">
        <div class="aplayer-music">
          <span class="aplayer-title">{{ currentMusic.title || 'Untitled' }}</span>
          <span class="aplayer-author">{{ currentMusic.artist || 'Unknown' }}</span>
        </div>
        <slot name="display" :current-music="currentMusic" :play-stat="playStat">
          <lyrics :current-music="currentMusic" :play-stat="playStat" v-if="showLrc"/>
        </slot>
        <controls
          :shuffle="shouldShuffle"
          :repeat="repeatMode"
          :stat="playStat"
          :volume="audioVolume"
          :muted="isAudioMuted"
          :theme="currentTheme"
          :showControls="showControls"
          @toggleshuffle="shouldShuffle = !shouldShuffle"
          @togglelist="showList = !showList"
          @togglemute="toggleMute"
          @setvolume="setAudioVolume"
          @dragbegin="onProgressDragBegin"
          @dragend="onProgressDragEnd"
          @dragging="onProgressDragging"
          @nextmode="setNextMode"
        />
      </div>
    </div>
    <audio ref="audio"></audio>
    <music-list
      :show="showList && !mini"
      :current-music="currentMusic"
      :music-list="list"
      :play-index="playIndex"
      :listmaxheight="listMaxHeight"
      :theme="currentTheme"
      @selectsong="onSelectSong"
    />
  </div>
</template>
<script type="text/babel">
import Vue from 'vue'
import Thumbnail from './components/aplayer-thumbnail.vue'
import NoThumbnail from './components/aplayer-no-thumbnail.vue'
import MusicList from './components/aplayer-list.vue'
import Controls from './components/aplayer-controller.vue'
import Lyrics from './components/aplayer-lrc.vue'
import {error, versionCompare, warn} from './utils'

let versionBadgePrinted = false
const canUseSync = versionCompare(Vue.version, '2.3.0') >= 0

/**
 * memorize self-adapting theme for cover image urls
 * @type {Object.<url, rgb()>}
 */
const picThemeCache = {}

// mutex playing instance
let activeMutex = null


const REPEAT = {
  NO_REPEAT: 'no-repeat',
  REPEAT_ONE: 'repeat-one',
  REPEAT_ALL: 'repeat-all',
};

const VueAPlayer = {
  name: 'APlayer',
  disableVersionBadge: false,
  components: {
    Thumbnail,
    NoThumbnail,
    Controls,
    MusicList,
    Lyrics,
  },
  props: {
    list: {
      type: Array,
      required: true,
      validator: (songs) => {
        if (songs.length === 0) {
          error("'list' property must have at least one song.")
          return false;
        }

        songs.forEach((song) => {
          if (!song.src) {
            error("'src' property is required.\nSong title is : " + song.title)
            return false;
          }
        })

        return true;
      },
    },
    mutex: {type: Boolean, default: true,},
    theme: {type: String, default: '#41b883',},
    showPic: {type: Boolean, default: true,},
    showLrc: {type: Boolean, default: false,},
    showControls: {type: Array, default: ["volume", "shuffle", "repeat", "toggleList"],},

    listMaxHeight: String,
    listFolded: {type: Boolean, default: false,},
    float: {type: Boolean, default: false,},
    mini: {type: Boolean, default: false,},
    cornerRounded: {type: Boolean, default: false,},

    autoplay: {type: Boolean, default: false,},

    controls: {type: Boolean, default: false,},
    muted: {type: Boolean, default: false,},
    volume: {
      type: Number,
      default: 1,
      validator: (value) => value >= 0 && value <= 1,
    },
    shuffle: {type: Boolean, default: false,},
    repeat: {type: String, default: REPEAT.NO_REPEAT,},

    preload: String,
  },
  data() {
    return {
      internalMusic: this.list[0],
      isPlaying: false,
      isSeeking: false,
      wasPlayingBeforeSeeking: false,
      isMobile: /mobile/i.test(window.navigator.userAgent),
      playStat: {
        duration: 0,
        loadedTime: 0,
        playedTime: 0,
      },
      showList: !this.listFolded,

      // handle Promise returned from audio.play()
      // @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play
      audioPlayPromise: Promise.resolve(),


      // @since 1.2.0 float mode

      floatOriginX: 0,
      floatOriginY: 0,
      floatOffsetLeft: 0,
      floatOffsetTop: 0,


      // @since 1.3.0 self adapting theme
      selfAdaptingTheme: null,


      // @since 1.4.0
      // sync muted, volume

      internalMuted: this.muted,
      internalVolume: this.volume,

      // @since 1.4.1
      // Loading indicator
      isLoading: false,


      // @since 1.5.1
      // sync shuffle, repeat
      internalShuffle: this.shuffle,
      internalRepeat: this.repeat,
      // for shuffling
      shuffledList: [],
    }
  },
  computed: {
    // alias for $refs.audio
    audio() {
      return this.$refs.audio
    },

    // sync music
    currentMusic: {
      get() {
        return this.internalMusic
      },
      set(val) {
        canUseSync && this.$emit('update:music', val)
        this.internalMusic = val
      },
    },

    // props wrappers

    currentTheme() {
      return this.selfAdaptingTheme || this.currentMusic.theme || this.theme
    },
    isFloatMode() {
      return this.float && !this.isMobile
    },
    shouldShowNativeControls() {
      return process.env.NODE_ENV !== 'production' && this.controls && !this.mini
    },

    // useful

    floatStyleObj() {
      // transform: translate(floatOffsetLeft, floatOffsetY)
      return {
        transform: `translate(${this.floatOffsetLeft}px, ${this.floatOffsetTop}px)`,
        webkitTransform: `translate(${this.floatOffsetLeft}px, ${this.floatOffsetTop}px)`,
      }
    },
    loadProgress() {
      if (this.playStat.duration === 0) return 0
      return this.playStat.loadedTime / this.playStat.duration
    },
    playProgress() {
      if (this.playStat.duration === 0) return 0
      return this.playStat.playedTime / this.playStat.duration
    },
    playIndex: {
      get() {
        return this.shuffledList.indexOf(this.currentMusic)
      },
      set(val) {
        console.log("set(val)")
        console.log(val)
        this.currentMusic = this.shuffledList[val % this.shuffledList.length]
      },
    },
    shouldRepeat() {
      return this.repeatMode !== REPEAT.NO_REPEAT
    },

    // since 1.4.0
    // sync muted, volume

    isAudioMuted: {
      get() {
        return this.internalMuted
      },
      set(val) {
        canUseSync && this.$emit('update:muted', val)
        this.internalMuted = val
      },
    },
    audioVolume: {
      get() {
        return this.internalVolume
      },
      set(val) {
        canUseSync && this.$emit('update:volume', val)
        this.internalVolume = val
      },
    },


    // since 1.5.0
    // sync shuffle, repeat
    shouldShuffle: {
      get() {
        return this.internalShuffle
      },
      set(val) {
        canUseSync && this.$emit('update:shuffle', val)
        this.internalShuffle = val
      },
    },
    repeatMode: {
      get() {
        return this.internalRepeat
      },
      set(val) {
        canUseSync && this.$emit('update:repeat', val)
        this.internalRepeat = val
      },
    },
  },
  methods: {
    // Float mode

    onDragBegin() {
      this.floatOriginX = this.floatOffsetLeft
      this.floatOriginY = this.floatOffsetTop
    },
    onDragAround({offsetLeft, offsetTop}) {
      this.floatOffsetLeft = this.floatOriginX + offsetLeft
      this.floatOffsetTop = this.floatOriginY + offsetTop
    },

    // functions

    setNextMode() {
      switch (this.repeatMode) {
        case REPEAT.REPEAT_ALL:
          return this.repeatMode = REPEAT.REPEAT_ONE;
        case REPEAT.REPEAT_ONE:
          return this.repeatMode = REPEAT.NO_REPEAT;
        default:
          this.repeatMode = REPEAT.REPEAT_ALL
      }
    },
    thenPlay() {
      this.$nextTick(() => this.play())
    },

    // controls

    // play/pause

    toggle() {
      this.audio.paused ? this.play() : this.pause()
    },
    play() {
      this.executeMutex()

      // handle .play() Promise
      const audioPlayPromise = this.audio.play()
      if (!audioPlayPromise) return;

      this.audioPlayPromise = new Promise((resolve, reject) => {
        // rejectPlayPromise is to force reject audioPlayPromise if it's still pending when pause() is called
        this.rejectPlayPromise = reject
        audioPlayPromise
          .then((res) => {
            this.rejectPlayPromise = null
            resolve(res)
          })
          .catch(warn)
      })
    },
    pause() {
      this.audioPlayPromise
        .then(() => this.audio.pause())
        // Avoid force rejection throws Uncaught
        .catch(() => this.audio.pause())

      // audioPlayPromise is still pending
      if (this.rejectPlayPromise) {
        // force reject playPromise
        this.rejectPlayPromise()
        this.rejectPlayPromise = null
      }
    },

    executeMutex() {
      if (!this.mutex) return;

      if (activeMutex && activeMutex !== this) {
        activeMutex.pause()
      }
      activeMutex = this
    },

    // progress bar

    onProgressDragBegin(percent) {
      this.wasPlayingBeforeSeeking = this.isPlaying
      this.pause()
      this.isSeeking = true

      // handle load failures
      this.setCurrentTimeFromDuration(percent)
    },
    onProgressDragging(percent) {
      if (isNaN(this.audio.duration)) this.playStat.playedTime = 0
      this.setCurrentTimeFromDuration(percent)
    },
    setCurrentTimeFromDuration(percent) {
      if (isNaN(this.audio.duration)) return
      this.audio.currentTime = this.audio.duration * percent
    },
    onProgressDragEnd(val) {
      this.isSeeking = false

      if (this.wasPlayingBeforeSeeking) this.thenPlay()
    },

    // volume

    toggleMute() {
      this.setAudioMuted(!this.audio.muted)
    },
    setAudioMuted(val) {
      this.audio.muted = val
    },
    setAudioVolume(val) {
      this.audio.volume = val
      if (val > 0) this.setAudioMuted(false)
    },

    // playlist

    getShuffledList() {
      let unshuffled = [...this.list]

      if (!this.shouldShuffle || unshuffled.length === 1)
        return unshuffled

      if (unshuffled.length === 2)
        return [unshuffled[1], unshuffled[0]]

      // shuffle list
      // @see https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
      for (let i = unshuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const tmp = unshuffled[i]
        unshuffled[i] = unshuffled[j]
        unshuffled[j] = tmp
      }

      // take currentMusic to first
      let indexOfCurrentMusic = unshuffled.indexOf(this.internalMusic)
      if (indexOfCurrentMusic !== 0)
        [unshuffled[0], unshuffled[indexOfCurrentMusic]] = [unshuffled[indexOfCurrentMusic], unshuffled[0]]

      return unshuffled
    },

    onSelectSong(song) {
      if (this.currentMusic === song) {
        this.toggle()
        return
      }

      this.currentMusic = song
      this.thenPlay()
    },

    // event handlers
    // for keeping up with audio states

    onAudioPlay() {
      this.isPlaying = true
    },
    onAudioPause() {
      this.isPlaying = false
    },
    onAudioWaiting() {
      this.isLoading = true
    },
    onAudioCanplay() {
      this.isLoading = false
    },
    onAudioDurationChange() {
      if (this.audio.duration !== 1)
        this.playStat.duration = this.audio.duration
    },
    onAudioProgress() {
      if (this.audio.buffered.length === 0) {
        this.playStat.loadedTime = 0
        return
      }

      this.playStat.loadedTime = this.audio.buffered.end(this.audio.buffered.length - 1)
    },
    onAudioTimeUpdate() {
      this.playStat.playedTime = this.audio.currentTime
    },
    onAudioSeeking() {
      this.playStat.playedTime = this.audio.currentTime
    },
    onAudioSeeked() {
      this.playStat.playedTime = this.audio.currentTime
    },
    onAudioVolumeChange() {
      this.audioVolume = this.audio.volume
      this.isAudioMuted = this.audio.muted
    },
    onAudioEnded() {
      // determine next song according to shuffle and repeat

      if (this.repeatMode === REPEAT.REPEAT_ONE) {
        this.thenPlay()
        return
      }

      if (this.repeatMode === REPEAT.REPEAT_ALL) {
        // After playing to the end of shuffledList, update shuffledList.
        if (this.shouldShuffle && this.playIndex === this.shuffledList.length - 1)
          this.shuffledList = this.getShuffledList()

        this.playIndex++
        this.thenPlay()
        return;
      }

      // no-repeat no action
    },

    initAudio() {

      // since 1.4.0 Audio attributes as props

      this.audio.controls = this.shouldShowNativeControls
      this.audio.muted = this.muted
      this.audio.preload = this.preload
      this.audio.volume = this.volume


      // since 1.4.0 Emit as many native audio events
      // @see https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Media_events

      const mediaEvents = [
        'abort',
        'canplay', 'canplaythrough',
        'durationchange',
        'emptied', 'encrypted', 'ended', 'error',
        'interruptbegin', 'interruptend',
        'loadeddata', 'loadedmetadata', 'loadstart',
        'mozaudioavailable',
        'pause', 'play', 'playing', 'progress',
        'ratechange',
        'seeked', 'seeking', 'stalled', 'suspend',
        'timeupdate',
        'volumechange',
        'waiting',
      ]
      mediaEvents.forEach(event => {
        this.audio.addEventListener(event, e => this.$emit(event, e))
      })


      // event handlers
      // they don't emit native media events

      this.audio.addEventListener('play', this.onAudioPlay)
      this.audio.addEventListener('pause', this.onAudioPause)
      this.audio.addEventListener('abort', this.onAudioPause)
      this.audio.addEventListener('waiting', this.onAudioWaiting)
      this.audio.addEventListener('canplay', this.onAudioCanplay)
      this.audio.addEventListener('progress', this.onAudioProgress)
      this.audio.addEventListener('durationchange', this.onAudioDurationChange)
      this.audio.addEventListener('seeking', this.onAudioSeeking)
      this.audio.addEventListener('seeked', this.onAudioSeeked)
      this.audio.addEventListener('timeupdate', this.onAudioTimeUpdate)
      this.audio.addEventListener('volumechange', this.onAudioVolumeChange)
      this.audio.addEventListener('ended', this.onAudioEnded)


      if (this.currentMusic)
        this.audio.src = this.currentMusic.src
    },

    setSelfAdaptingTheme() {
      // auto theme according to current music cover image

      if ((this.currentMusic.theme || this.theme) !== 'pic') {
        this.selfAdaptingTheme = null
        return
      }

      const pic = this.currentMusic.pic

      // use cache
      if (picThemeCache[pic]) {
        this.selfAdaptingTheme = picThemeCache[pic]
        return
      }

      try {
        new ColorThief().getColorAsync(pic, ([r, g, b]) => {
          picThemeCache[pic] = `rgb(${r}, ${g}, ${b})`
          this.selfAdaptingTheme = `rgb(${r}, ${g}, ${b})`
        })
      } catch (e) {
        warn('color-thief is required to support self-adapting theme')
      }
    },
  },
  watch: {
    music(music) {
      this.internalMusic = music
    },

    currentMusic: {
      handler(music) {
        // async
        this.setSelfAdaptingTheme()

        const src = music.src
        if (!/\.m3u8(?=(#|\?|$))/.test(src)) {
          this.audio.src = src
          return
        }

        // HLS support
        if (this.audio.canPlayType('application/x-mpegURL') || this.audio.canPlayType('application/vnd.apple.mpegURL')) {
          this.audio.src = src
          return
        }

        try {
          const Hls = require('hls.js')
          if (Hls.isSupported()) {
            if (!this.hls) this.hls = new Hls()
            this.hls.loadSource(src)
            this.hls.attachMedia(this.audio)
          } else {
            warn('HLS is not supported on your browser')
            this.audio.src = src
          }
        } catch (e) {
          warn('hls.js is required to support m3u8')
          this.audio.src = src
        }
      },
    },

    // since 1.4.0
    // observe controls, muted, preload, volume

    shouldShowNativeControls(val) {
      this.audio.controls = val
    },
    isAudioMuted(val) {
      this.audio.muted = val
    },
    preload(val) {
      this.audio.preload = val
    },
    audioVolume(val) {
      this.audio.volume = val
    },

    // sync muted, volume

    muted(val) {
      this.internalMuted = val
    },
    volume(val) {
      this.internalVolume = val
    },

    // sync shuffle, repeat
    shuffle(val) {
      this.internalShuffle = val
    },
    repeat(val) {
      this.internalRepeat = val
    },
  },
  beforeCreate() {
    if (!VueAPlayer.disableVersionBadge && !versionBadgePrinted) {
      // version badge
      console.log(`\n\n %c Vue-APlayer ${VERSION} %c vue-aplayer.js.org \n`, 'color: #fff; background:#41b883; padding:5px 0;', 'color: #fff; background: #35495e; padding:5px 0;')
      versionBadgePrinted = true
    }
  },
  created() {
    this.shuffledList = this.getShuffledList()
  },
  mounted() {
    this.initAudio()
    this.setSelfAdaptingTheme()
    if (this.autoplay) this.play()
  },
  beforeDestroy() {
    if (activeMutex === this) activeMutex = null
    if (this.hls) this.hls.destroy()
  },
}

export default VueAPlayer

</script>

<style lang="scss" scoped>
@import "./scss/variables";

.aplayer {
  font-family: Arial, Helvetica, sans-serif;
  color: #000;
  background-color: #fff;
  margin: 5px;
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.07), 0 1px 5px 0 rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  overflow: hidden;
  user-select: none;
  line-height: initial;

  * {
    box-sizing: content-box;
  }

  .aplayer-lrc-content {
    display: none;
  }

  .aplayer-body {
    display: flex;

    position: relative;

    .aplayer-info {
      flex-grow: 1;
      display: flex;
      flex-direction: column;

      text-align: start;
      padding: 14px 7px 0 10px;
      height: $aplayer-height;
      box-sizing: border-box;
      overflow: hidden;

      .aplayer-music {
        flex-grow: 1;

        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        margin-left: 5px;
        user-select: text;
        cursor: default;
        padding-bottom: 2px;

        .aplayer-title {
          font-size: 14px;
        }

        .aplayer-author {
          font-size: 12px;
          color: #666;
        }
      }

      .aplayer-lrc {
        z-index: 0;
      }
    }
  }

  audio[controls] {
    display: block;
    width: 100%;
  }

  &.aplayer-cornerRounded {
    border-radius: 10px;
  }

  // Mini mode
  &.aplayer-mini {
    width: $aplayer-height;
  }

  &.aplayer-withlrc {
    .aplayer-body {
      .aplayer-pic {
        height: $aplayer-height-lrc;
        width: $aplayer-height-lrc;
      }

      .aplayer-info {
        height: $aplayer-height-lrc;
      }

      .aplayer-info {
        padding: 10px 7px 0 7px;
      }
    }
  }

  &.aplayer-withlist {
    .aplayer-body {
      .aplayer-info {
        border-bottom: 1px solid #e9e9e9;
      }

      .aplayer-controller .aplayer-time .aplayer-icon.aplayer-icon-menu {
        display: block;
      }
    }
  }

  /* floating player on top */
  position: relative;

  &.aplayer-float {
    z-index: 1;
  }
}

@keyframes aplayer-roll {
  0% {
    left: 0
  }
  100% {
    left: -100%
  }
}
</style>