/**
 * Created by Doma on 2016/11/22.
 */
import Vue from 'vue'
import App from './App.vue'

Vue.config.devtools = true
// VueAPlayer.disableVersionBadge = true

new Vue({
  el: '#app',
  render: h => h(App)
})
