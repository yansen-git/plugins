;(function(global) {
  //开启严格模式，规范代码，提高浏览器运行效率
  "use strict";
  var _timer = null // 动画定时器
  var _options = {} // 运行参数
  var _activeIndex = 1 // 当前轮播图的下标
  var _animationMark = false // 解决点击按钮频率过快
  var self = null // 保存全局this
  var eventStart = '' // 拖拽或者touch--start
  var eventMove = '' // 拖拽或者touch--move
  var eventEnd = '' // 拖拽或者touch--end
  var imgX = 0 // 拖拽对象的起始距离x
  var startPointX = 0 // 鼠标按下或touch的当前坐标x
  var Swiper = function (el, urlArr, options) {
    self = this
    if (!el) throw Error('Need to bind dom elements')
    if (!urlArr || urlArr.length === 0) throw Error('Carousel element cannot be empty')
    this.el = typeof el === 'string' ? document.querySelector(el) : el
    this.urlArr = urlArr
    var defaultOptions = {
      autoplay: true, // 是否自动切换
      intervalTime: 5000, // 图片自动切换时间，默认为5s
      transitionDuration: 800 // transition过度时间
    }
    _options = Object.assign({}, defaultOptions)
    this.init(options, defaultOptions)
  }
  Swiper.prototype = {
    init: function(options) { // 初始化
      if (options) this.setOptions(options)
      this.createDom()
      this.preventImg()
      _options.autoplay && this.animate()
      this.touchDrag()
      this.eventHandling()
    },
    touchDrag: function () { // 判断pc端拖拽还是移动端touch
      if ('ontouchstart' in window) {
        eventStart = 'touchstart'
        eventMove = 'touchmove'
        eventEnd = 'touchend'
      } else {
        eventStart = 'mousedown'
        eventMove = 'mousemove'
        eventEnd = 'mouseup'
      }
    },
    setOptions: function (options) { // _options重新赋值
      for (var key in options) {
        _options[key] = options[key]
      }
    },
    createDom: function() { // 创建主体dom
      var swiperContainer = document.createElement('div')
      swiperContainer.className = 'swiper-container'
      var swiperWrapper = document.createElement('div')
      swiperWrapper.className = 'swiper-wrapper'
      var btns = this.createButtons()
      var tools = this.createTools()
      var imgArr = this.urlArr.slice()
      // 第一张图片添加到最后，最后一张图片添加到首位，实现无缝滚动效果
      imgArr.push(this.urlArr[0])
      imgArr.unshift(this.urlArr[this.urlArr.length - 1])
      for (var i = 0; i < imgArr.length; i++) {
        var item = imgArr[i]
        var img = new Image()
        img.src = item.imgUrl
        var swiperSlide = document.createElement('div')
        swiperSlide.className = 'swiper-slide'
        swiperSlide.appendChild(img)
        swiperWrapper.appendChild(swiperSlide)
      }
      swiperContainer.appendChild(swiperWrapper)
      swiperContainer.appendChild(btns.previous)
      swiperContainer.appendChild(btns.next)
      swiperContainer.appendChild(tools)
      this.el.appendChild(swiperContainer)
      // 默认显示第二个图片(真正的第一个图片)
      swiperWrapper.style.transitionProperty = 'none'
      swiperWrapper.style.transform = `translate3d(-${swiperWrapper.clientWidth}px, 0, 0)`
      swiperWrapper.style.transitionDuration = `${parseInt(_options.transitionDuration)/1000}s`
    },
    createButtons: function() { // 创建轮播图左右按钮dom
      var swiperPreviousBtn = document.createElement('div')
      swiperPreviousBtn.className = 'swiper-btn swiper-previous'
      swiperPreviousBtn.innerText = '<'
      var swiperNextBtn = document.createElement('div')
      swiperNextBtn.className = 'swiper-btn swiper-next'
      swiperNextBtn.innerText = '>'
      return {
        previous: swiperPreviousBtn,
        next: swiperNextBtn
      }
    },
    createTools: function() { // 创建轮播图圆点切换dom
      var swiperTools = document.createElement('div')
      swiperTools.className = 'swiper-tools'
      for (var i = 0; i < this.urlArr.length; i++) {
        var swiperDot = document.createElement('div')
        swiperDot.className = 'swiper-dot'
        swiperDot.setAttribute('key', i + 1)
        if (i === 0) {
          swiperDot.className += ' swiper-dot-active'
        }
        swiperTools.appendChild(swiperDot)
      }
      return swiperTools
    },
    dotMove: function() { // 圆点切换
      var pags = document.querySelectorAll('.swiper-dot')
      var index = _activeIndex
      if (index > this.urlArr.length) {
        index = 1
      } else if (index <= 0) {
        index = this.urlArr.length
      }
      var pointArr = Array.prototype.slice.call(pags)
      for (var i = 0; i < pointArr.length; i++) {
        var item = pointArr[i]
        if (parseInt(index) === parseInt(item.getAttribute('key'))) {
          if (item.className.indexOf('swiper-dot-active') === -1) {
            item.className += ' swiper-dot-active'
          }
        } else {
          // 移除当前之外其他圆点的class
          if (item.className.indexOf('swiper-dot-active') != -1) {
            item.className = item.className.replace('swiper-dot-active', '')
          }
        }
      }
    },
    animate: function() { // 轮播动画
      _timer = setInterval(() => {
        this.render(function () {
          self._next()
        })
      }, _options.intervalTime)
    },
    render: function(fn) { // 渲染
      if (_animationMark) return
      _animationMark = true
      fn()
      this.boundary()
    },
    boundary: function() { // 处理边界
      var swiper = this.el.querySelector('.swiper-wrapper')
      var width = swiper.clientWidth
      // 利用计时器实现无缝连接
      setTimeout(() => {
        // 边界问题，当滑动到最后一张图片(多添加的第一张)，关闭transition效果，返回正常的第一张位置
        if (_activeIndex > this.urlArr.length) {
          swiper.style.transitionProperty = 'none'
          _activeIndex = 1
          swiper.style.transform = `translate3d(-${_activeIndex * width}px, 0, 0)`
        } else if (_activeIndex <= 0) {
          // 边界问题，当滑动到第一张图片(多添加的第最后一张)，关闭transition效果，返回正常的最后一张位置
          swiper.style.transitionProperty = 'none'
          _activeIndex = this.urlArr.length
          swiper.style.transform = `translate3d(-${_activeIndex * width}px, 0, 0)`
        }
        _animationMark = false
      }, _options.transitionDuration)
    },
    _previous: function() { // 上一页(向右滑动)
      _activeIndex--
      this.slideTo(_activeIndex)
    },
    previous: function() { // 上一页
      this.render(function () {
        self._previous()
      })
    },
    _next: function() { // 下一页(向左滑动)
      _activeIndex++
      this.slideTo(_activeIndex)
    },
    next: function() { // 下一页
      this.render(function () {
        self._next()
      })
    },
    slideTo: function (i) { // 滑动到index的轮播图
      var swiper = this.el.querySelector('.swiper-wrapper')
      var width = swiper.clientWidth
      swiper.style.transitionProperty = 'all'
      swiper.style.transform = `translate3d(-${i * width}px, 0, 0)`
      this.dotMove()
    },
    eventHandling: function () { // 事件处理
      this.on(this.el, 'mouseover', function() {
        clearInterval(_timer)
      })
      this.on(this.el, 'mouseout', function() {
        self.animate()
      })
      this.on(this.el.querySelector('.swiper-previous'), 'click', function() {
        self.previous()
      })
      this.on(this.el.querySelector('.swiper-next'), 'click', function() {
        self.next()
      })
      this.on(this.el.querySelector('.swiper-tools'), 'click', function (e) {
        if (e.target.getAttribute('key')) {
          _activeIndex = e.target.getAttribute('key')
          self.render(function () {
            self.slideTo(_activeIndex)
          })
        }
      })
      // start
      this.on(this.el, eventStart, this.start)
    },
    on: function(el, e, fn) { // 事件监听
      el.addEventListener(e, fn)
    },
    off: function(el, e, fn) { // 事件移除
      el.removeEventListener(e, fn)
    },
    mouseX: function (e) { // 获取鼠标的横坐标
      var e = e || window.e
      return e.pageX || e.clientX || e.touches[0].pageX || e.touches[0].clientX
    },
    start: function (e) { // 准备拖动
      // 防止无缝滚动还没衔接时再次触发拖动出现bug
      if (_animationMark) return
      var X = self.el.querySelector('.swiper-wrapper').style.transform
      // 移动端不识别mouseover事件，需先清除计时器
      if ('ontouchstart' in window) clearInterval(_timer)
      // 拖拽元素的起始坐标
      imgX = parseInt(X.split(',')[0].split('(')[1].split('px')[0])
      // 鼠标按下或者touch的起始坐标
      startPointX = self.mouseX(e)
      // move
      self.on(self.el, eventMove, self.move)
      // end
      self.on(self.el, eventEnd, self.end)
    },
    move: function (e) { // 开始拖动
      var displacementX = imgX + self.mouseX(e) - startPointX
      var swiper = self.el.querySelector('.swiper-wrapper')
      swiper.style.transitionProperty = 'none'
      swiper.style.transform = `translate3d(${displacementX}px, 0, 0)`
    },
    end: function (e) { // 停止拖动
      // move结束开启计时器
      if ('ontouchstart' in window) self.animate()
      // 判断正在滚动的图片距离左右图片的远近，若超过1/2则滚动到下一张，否则回复原状
      var left = parseInt(self.el.querySelector('.swiper-wrapper').style.transform.split(',')[0].split('(')[1].split('px')[0])
      // 如果相等，说明只是点击并未拖动
      if (imgX === left) {
        self.clearDrag()
        return
      }
      var i = Math.round(- left / self.el.clientWidth)
      _activeIndex = i
      self.render(function () {
        self.slideTo(_activeIndex)
      })
      // 始放操作对象
      self.clearDrag()
    },
    clearDrag: function () { // 清除move事件监听
      this.off(this.el, eventMove, this.move)
    },
    preventImg: function () { // 阻止图片拖拽
      document.querySelector('.swiper-wrapper').onmousedown = function (e) {
        if (e.target.nodeName.toLowerCase() === 'img') e.preventDefault()
      }
    }
  }

  // 兼容CommonJs规范
  if (typeof module !== 'undefined' && module.exports) module.exports = Ys;

  // 兼容AMD/CMD规范
  if (typeof define === 'function') define(function() { return Ys; });

  // 更正constructor指向
  Swiper.prototype.constructor = Swiper

  //注册全局变量，兼容直接使用script标签引入该插件
  global.Swiper = Swiper
})(this)