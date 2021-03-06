import throttle from 'lodash/throttle'

const updateRouteScrollPosition = throttle(function () {
  if (this.$route.meta.hasOwnProperty('scrollPosition')) {
    this.$route.meta.scrollPosition = {
      x: window.scrollX,
      y: window.scrollY
    }
  }
}, 500)

export default {
  created () {
    window.addEventListener('scroll', this.$_handleScroll)
  },
  beforeDestroy () {
    window.removeEventListener('scroll', this.$_handleScroll)
  },
  methods: {
    $_handleScroll () {
      updateRouteScrollPosition.call(this)
    }
  }
}
