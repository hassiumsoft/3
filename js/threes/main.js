define([
  'jquery'
, 'underscore'
, 'backbone'
, 'bowser'
, 'threes/app'
, 'threes/views/home'
, 'threes/views/playing'
, 'threes/views/utils/popup'
, 'threes/modules/env'
, 'threes/modules/swiper'
, 'threes/modules/keyboard_listener'
], function($, _, Backbone, bowser, app
  , HomeView, PlayingView, popup, env, Swiper, Keyboard) {

  var AppRouter = Backbone.Router.extend({

    routes: {
      "": "home"
    , "playing": "playing"
    , "replay/:direction": "replay"
    }

  , initialize: function() {
      app.wrapper = $('#wrapper')

      // game logic
      app.on('game:restart', function(direction) {
        this.go('replay/' + direction)
      }, this)
    }

  , home: function() {
      var homeView = new HomeView()
      app.wrapper.html(homeView.render().el)
    }

  , replay: function(direction) {
      var self = this
      if(this.currentPlayingView) {
        this.currentPlayingView.fadeOut(direction)
        _.delay(function() {
          self.currentPlayingView.remove()
          self.currentPlayingView = null
          self.go('playing')
        }, 500)
      } else {
        self.go('playing')
      }
    }

  , playing: function() {
      var playingView = new PlayingView()
      app.wrapper.html(playingView.render().el)
      playingView.start()
      this.currentPlayingView = playingView
    }

  , go: function(url) {
      this.navigate(url, {trigger: true})
    }

  })

  function initialize() {

    // init view
    var blueprint = {width: 768, height: 1024}
    var root = $('html'), win = $(window)
    function fixRootEm () {
      var viewHeight = win.height()
      var viewWidth = win.width()
      app.ratio = Math.min(viewHeight/blueprint.height
        , viewWidth/blueprint.width)
      root.css('font-size', app.ratio * 100 +'px')
    }
    fixRootEm()
    $(window).resize(_.debounce(function() {
      // seems only firefox render this perfectly
      if(bowser.firefox) {
        // fixRootEm()
      } else {
        // var cfm = confirm("You have resized the window. would you like to "
        //   + "refresh to make a adaptation?")
        // if(cfm) {
        //   window.location.reload()
        // }
      }
    }, 300))

    var tileSize = {
      height: 159, width: 106
    , marginLeft: 22, marginTop: 10
    }
    var getTileSize = _.memoize(function(ratio) {
      return _.object(_.map(tileSize, function(value, key) {
        return [key, value*ratio]
      }))
    })

    // init swiper and keyboard listener
    var swiper = new Swiper()
    var keyboard = new Keyboard()
    app.on('swiper:freeze', function() {
      swiper.sleep()
      keyboard.sleep()
    }).on('swiper:unfreeze', function() {
      swiper.wake()
      keyboard.wake()
    })

    _.extend(app, {
      swiper: swiper
    , keyboard: keyboard
    , env: env
    , popup: popup
    , router: new AppRouter()
    , getTileSize: function() {
        return getTileSize(app.ratio)
      }
    })

    Backbone.history.start({pushState: false})
    Backbone.history.on('all', function() {
      app.trigger('page_change')
    })
  }

  return {
    initialize: initialize
  }
})
