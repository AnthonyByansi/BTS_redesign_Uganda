"use strict";
(function () {
	// Global variables
	var userAgent = navigator.userAgent.toLowerCase(),
		initialDate = new Date(),

		$document = $( document ),
		$window = $( window ),
		$html = $( "html" ),
		$body = $( "body" ),

		isDesktop = $html.hasClass( "desktop" ),
		isIE = userAgent.indexOf( "msie" ) !== -1 ? parseInt( userAgent.split( "msie" )[ 1 ], 10 ) : userAgent.indexOf( "trident" ) !== -1 ? 11 : userAgent.indexOf( "edge" ) !== -1 ? 12 : false,
		isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test( navigator.userAgent ),
		windowReady = false,
		isNoviBuilder = false,
		loaderTimeoutId,

		plugins = {
			bootstrapModalDialog:    $( '.modal' ),
			bootstrapTabs:           $( ".tabs-custom" ),
			rdNavbar:                $( ".rd-navbar" ),
			materialParallax:        $( ".parallax-container" ),
			rdMailForm:              $( ".rd-mailform" ),
			rdInputLabel:            $( ".form-label" ),
			regula:                  $( "[data-constraints]" ),
			wow:                     $( ".wow" ),
			owl:                     $( ".owl-carousel" ),
			swiper:                  $( ".swiper-slider" ),
			isotope:                 $( ".isotope" ),
			radio:                   $( "input[type='radio']" ),
			checkbox:                $( "input[type='checkbox']" ),
			customToggle:            $( "[data-custom-toggle]" ),
			counter:                 $( ".counter" ),
			preloader:               $( ".preloader" ),
			captcha:                 $( '.recaptcha' ),
			scroller:                $( ".scroll-wrap" ),
			lightGallery:            $( '[data-lightgallery="group"]' ),
			lightGalleryItem:        $( '[data-lightgallery="item"]' ),
			lightDynamicGalleryItem: $( '[data-lightgallery="dynamic"]' ),
			copyrightYear:           $( ".copyright-year" ),
			maps:                    $( ".google-map-container" ),
			particlesJs:             $( '#particles-js' )
		};


	/**
	 * @desc Check the element was been scrolled into the view
	 * @param {object} elem - jQuery object
	 * @return {boolean}
	 */
	function isScrolledIntoView ( elem ) {
		if ( isNoviBuilder ) return true;
		return elem.offset().top + elem.outerHeight() >= $window.scrollTop() && elem.offset().top <= $window.scrollTop() + $window.height();
	}

	/**
	 * @desc Calls a function when element has been scrolled into the view
	 * @param {object} element - jQuery object
	 * @param {function} func - init function
	 */
	function lazyInit ( element, func ) {
		var scrollHandler = function () {
			if ( (!element.hasClass( 'lazy-loaded' ) && (isScrolledIntoView( element ))) ) {
				func.call();
				element.addClass( 'lazy-loaded' );
			}
		};

		scrollHandler();
		$window.on( 'scroll', scrollHandler );
	}


	// Initialize scripts that require a finished document
	$( function () {
		isNoviBuilder = window.xMode;

		/**
		 * @desc Google map function for getting latitude and longitude
		 */
		function getLatLngObject ( str, marker, map, callback ) {
			var coordinates = {};
			try {
				coordinates = JSON.parse( str );
				callback( new google.maps.LatLng(
					coordinates.lat,
					coordinates.lng
				), marker, map )
			} catch ( e ) {
				map.geocoder.geocode( { 'address': str }, function ( results, status ) {
					if ( status === google.maps.GeocoderStatus.OK ) {
						var latitude = results[ 0 ].geometry.location.lat();
						var longitude = results[ 0 ].geometry.location.lng();

						callback( new google.maps.LatLng(
							parseFloat( latitude ),
							parseFloat( longitude )
						), marker, map )
					}
				} )
			}
		}

		/**
		 * @desc Initialize Google maps
		 */
		function initMaps () {
			var key;

			for ( var i = 0; i < plugins.maps.length; i++ ) {
				if ( plugins.maps[ i ].hasAttribute( "data-key" ) ) {
					key = plugins.maps[ i ].getAttribute( "data-key" );
					break;
				}
			}

			$.getScript( '//maps.google.com/maps/api/js?' + (key ? 'key=' + key + '&' : '') + 'sensor=false&libraries=geometry,places&v=quarterly', function () {
				var head = document.getElementsByTagName( 'head' )[ 0 ],
					insertBefore = head.insertBefore;

				head.insertBefore = function ( newElement, referenceElement ) {
					if ( newElement.href && newElement.href.indexOf( '//fonts.googleapis.com/css?family=Roboto' ) !== -1 || newElement.innerHTML.indexOf( 'gm-style' ) !== -1 ) {
						return;
					}
					insertBefore.call( head, newElement, referenceElement );
				};
				var geocoder = new google.maps.Geocoder;
				for ( var i = 0; i < plugins.maps.length; i++ ) {
					var zoom = parseInt( plugins.maps[ i ].getAttribute( "data-zoom" ), 10 ) || 11;
					var styles = plugins.maps[ i ].hasAttribute( 'data-styles' ) ? JSON.parse( plugins.maps[ i ].getAttribute( "data-styles" ) ) : [];
					var center = plugins.maps[ i ].getAttribute( "data-center" ) || "New York";

					// Initialize map
					var map = new google.maps.Map( plugins.maps[ i ].querySelectorAll( ".google-map" )[ 0 ], {
						zoom:        zoom,
						styles:      styles,
						scrollwheel: false,
						center:      { lat: 0, lng: 0 }
					} );

					// Add map object to map node
					plugins.maps[ i ].map = map;
					plugins.maps[ i ].geocoder = geocoder;
					plugins.maps[ i ].google = google;

					// Get Center coordinates from attribute
					getLatLngObject( center, null, plugins.maps[ i ], function ( location, markerElement, mapElement ) {
						mapElement.map.setCenter( location );
					} );

					// Add markers from google-map-markers array
					var markerItems = plugins.maps[ i ].querySelectorAll( ".google-map-markers li" );

					if ( markerItems.length ) {
						var markers = [];
						for ( var j = 0; j < markerItems.length; j++ ) {
							var markerElement = markerItems[ j ];
							getLatLngObject( markerElement.getAttribute( "data-location" ), markerElement, plugins.maps[ i ], function ( location, markerElement, mapElement ) {
								var icon = markerElement.getAttribute( "data-icon" ) || mapElement.getAttribute( "data-icon" );
								var activeIcon = markerElement.getAttribute( "data-icon-active" ) || mapElement.getAttribute( "data-icon-active" );
								var info = markerElement.getAttribute( "data-description" ) || "";
								var infoWindow = new google.maps.InfoWindow( {
									content: info
								} );
								markerElement.infoWindow = infoWindow;
								var markerData = {
									position: location,
									map:      mapElement.map
								}
								if ( icon ) {
									markerData.icon = icon;
								}
								var marker = new google.maps.Marker( markerData );
								markerElement.gmarker = marker;
								markers.push( { markerElement: markerElement, infoWindow: infoWindow } );
								marker.isActive = false;
								// Handle infoWindow close click
								google.maps.event.addListener( infoWindow, 'closeclick', (function ( markerElement, mapElement ) {
									var markerIcon = null;
									markerElement.gmarker.isActive = false;
									markerIcon = markerElement.getAttribute( "data-icon" ) || mapElement.getAttribute( "data-icon" );
									markerElement.gmarker.setIcon( markerIcon );
								}).bind( this, markerElement, mapElement ) );


								// Set marker active on Click and open infoWindow
								google.maps.event.addListener( marker, 'click', (function ( markerElement, mapElement ) {
									if ( markerElement.infoWindow.getContent().length === 0 ) return;
									var gMarker, currentMarker = markerElement.gmarker, currentInfoWindow;
									for ( var k = 0; k < markers.length; k++ ) {
										var markerIcon;
										if ( markers[ k ].markerElement === markerElement ) {
											currentInfoWindow = markers[ k ].infoWindow;
										}
										gMarker = markers[ k ].markerElement.gmarker;
										if ( gMarker.isActive && markers[ k ].markerElement !== markerElement ) {
											gMarker.isActive = false;
											markerIcon = markers[ k ].markerElement.getAttribute( "data-icon" ) || mapElement.getAttribute( "data-icon" )
											gMarker.setIcon( markerIcon );
											markers[ k ].infoWindow.close();
										}
									}

									currentMarker.isActive = !currentMarker.isActive;
									if ( currentMarker.isActive ) {
										if ( markerIcon = markerElement.getAttribute( "data-icon-active" ) || mapElement.getAttribute( "data-icon-active" ) ) {
											currentMarker.setIcon( markerIcon );
										}

										currentInfoWindow.open( map, marker );
									} else {
										if ( markerIcon = markerElement.getAttribute( "data-icon" ) || mapElement.getAttribute( "data-icon" ) ) {
											currentMarker.setIcon( markerIcon );
										}
										currentInfoWindow.close();
									}
								}).bind( this, markerElement, mapElement ) )
							} )
						}
					}
				}
			} );
		}

		// Page loader & Page transition
		if ( plugins.preloader.length && !isNoviBuilder ) {
			pageTransition( {
				target:            document.querySelector( '.page' ),
				delay:             100,
				duration:          500,
				classIn:           'fadeIn',
				classOut:          'fadeOut',
				classActive:       'animated',
				conditions:        function ( event, link ) {
					return !/(\#|callto:|tel:|mailto:|:\/\/)/.test( link ) && !event.currentTarget.hasAttribute( 'data-lightgallery' );
				},
				onTransitionStart: function ( options ) {
					setTimeout( function () {
						plugins.preloader.removeClass( 'loaded' );
					}, options.duration * .75 );
				},
				onReady:           function () {
					plugins.preloader.addClass( 'loaded' );
					windowReady = true;
				}
			} );
		}

		/**
		 * @desc Calculate the height of swiper slider basing on data attr
		 * @param {object} object - slider jQuery object
		 * @param {string} attr - attribute name
		 * @return {number} slider height
		 */
		function getSwiperHeight ( object, attr ) {
			var val = object.attr( "data-" + attr ),
				dim;

			if ( !val ) {
				return undefined;
			}

			dim = val.match( /(px)|(%)|(vh)|(vw)$/i );

			if ( dim.length ) {
				switch ( dim[ 0 ] ) {
					case "px":
						return parseFloat( val );
					case "vh":
						return $window.height() * (parseFloat( val ) / 100);
					case "vw":
						return $window.width() * (parseFloat( val ) / 100);
					case "%":
						return object.width() * (parseFloat( val ) / 100);
				}
			} else {
				return undefined;
			}
		}

		/**
		 * @desc Toggle swiper videos on active slides
		 * @param {object} swiper - swiper slider
		 */
		function toggleSwiperInnerVideos ( swiper ) {
			var prevSlide = $( swiper.slides[ swiper.previousIndex ] ),
				nextSlide = $( swiper.slides[ swiper.activeIndex ] ),
				videos,
				videoItems = prevSlide.find( "video" );

			for ( var i = 0; i < videoItems.length; i++ ) {
				videoItems[ i ].pause();
			}

			videos = nextSlide.find( "video" );
			if ( videos.length ) {
				videos.get( 0 ).play();
			}
		}

		/**
		 * @desc Toggle swiper animations on active slides
		 * @param {object} swiper - swiper slider
		 */
		function toggleSwiperCaptionAnimation ( swiper ) {
			var prevSlide = $( swiper.container ).find( "[data-caption-animate]" ),
				nextSlide = $( swiper.slides[ swiper.activeIndex ] ).find( "[data-caption-animate]" ),
				delay,
				duration,
				nextSlideItem,
				prevSlideItem;

			for ( var i = 0; i < prevSlide.length; i++ ) {
				prevSlideItem = $( prevSlide[ i ] );

				prevSlideItem.removeClass( "animated" )
					.removeClass( prevSlideItem.attr( "data-caption-animate" ) )
					.addClass( "not-animated" );
			}


			var tempFunction = function ( nextSlideItem, duration ) {
				return function () {
					nextSlideItem
						.removeClass( "not-animated" )
						.addClass( nextSlideItem.attr( "data-caption-animate" ) )
						.addClass( "animated" );
					if ( duration ) {
						nextSlideItem.css( 'animation-duration', duration + 'ms' );
					}
				};
			};

			for ( var i = 0; i < nextSlide.length; i++ ) {
				nextSlideItem = $( nextSlide[ i ] );
				delay = nextSlideItem.attr( "data-caption-delay" );
				duration = nextSlideItem.attr( 'data-caption-duration' );
				if ( !isNoviBuilder ) {
					if ( delay ) {
						setTimeout( tempFunction( nextSlideItem, duration ), parseInt( delay, 10 ) );
					} else {
						tempFunction( nextSlideItem, duration );
					}

				} else {
					nextSlideItem.removeClass( "not-animated" )
				}
			}
		}

		/**
		 * @desc Initialize owl carousel plugin
		 * @param {object} c - carousel jQuery object
		 */
		function initOwlCarousel ( c ) {
			var aliaces = [ "-", "-sm-", "-md-", "-lg-", "-xl-", "-xxl-" ],
				values = [ 0, 576, 768, 992, 1200, 1600 ],
				responsive = {};

			for ( var j = 0; j < values.length; j++ ) {
				responsive[ values[ j ] ] = {};
				for ( var k = j; k >= -1; k-- ) {
					if ( !responsive[ values[ j ] ][ "items" ] && c.attr( "data" + aliaces[ k ] + "items" ) ) {
						responsive[ values[ j ] ][ "items" ] = k < 0 ? 1 : parseInt( c.attr( "data" + aliaces[ k ] + "items" ), 10 );
					}
					if ( !responsive[ values[ j ] ][ "stagePadding" ] && responsive[ values[ j ] ][ "stagePadding" ] !== 0 && c.attr( "data" + aliaces[ k ] + "stage-padding" ) ) {
						responsive[ values[ j ] ][ "stagePadding" ] = k < 0 ? 0 : parseInt( c.attr( "data" + aliaces[ k ] + "stage-padding" ), 10 );
					}
					if ( !responsive[ values[ j ] ][ "margin" ] && responsive[ values[ j ] ][ "margin" ] !== 0 && c.attr( "data" + aliaces[ k ] + "margin" ) ) {
						responsive[ values[ j ] ][ "margin" ] = k < 0 ? 30 : parseInt( c.attr( "data" + aliaces[ k ] + "margin" ), 10 );
					}
				}
			}

			// Enable custom pagination
			if ( c.attr( 'data-dots-custom' ) ) {
				c.on( "initialized.owl.carousel", function ( event ) {
					var carousel = $( event.currentTarget ),
						customPag = $( carousel.attr( "data-dots-custom" ) ),
						active = 0;

					if ( carousel.attr( 'data-active' ) ) {
						active = parseInt( carousel.attr( 'data-active' ), 10 );
					}

					carousel.trigger( 'to.owl.carousel', [ active, 300, true ] );
					customPag.find( "[data-owl-item='" + active + "']" ).addClass( "active" );

					customPag.find( "[data-owl-item]" ).on( 'click', function ( e ) {
						e.preventDefault();
						carousel.trigger( 'to.owl.carousel', [ parseInt( this.getAttribute( "data-owl-item" ), 10 ), 300, true ] );
					} );

					carousel.on( "translate.owl.carousel", function ( event ) {
						customPag.find( ".active" ).removeClass( "active" );
						customPag.find( "[data-owl-item='" + event.item.index + "']" ).addClass( "active" )
					} );
				} );
			}

			c.on( "initialized.owl.carousel", function () {
				initLightGalleryItem( c.find( '[data-lightgallery="item"]' ), 'lightGallery-in-carousel' );
			} );

			c.owlCarousel( {
				autoplay:      isNoviBuilder ? false : c.attr( "data-autoplay" ) === "true",
				loop:          isNoviBuilder ? false : c.attr( "data-loop" ) !== "false",
				items:         1,
				center:        c.attr( "data-center" ) === "true",
				dotsContainer: c.attr( "data-pagination-class" ) || false,
				navContainer:  c.attr( "data-navigation-class" ) || false,
				mouseDrag:     isNoviBuilder ? false : c.attr( "data-mouse-drag" ) !== "false",
				nav:           c.attr( "data-nav" ) === "true",
				dots:          c.attr( "data-dots" ) === "true",
				dotsEach:      c.attr( "data-dots-each" ) ? parseInt( c.attr( "data-dots-each" ), 10 ) : false,
				animateIn:     c.attr( 'data-animation-in' ) ? c.attr( 'data-animation-in' ) : false,
				animateOut:    c.attr( 'data-animation-out' ) ? c.attr( 'data-animation-out' ) : false,
				responsive:    responsive,
				navText:       function () {
					try {
						return JSON.parse( c.attr( "data-nav-text" ) );
					} catch ( e ) {
						return [];
					}
				}(),
				navClass:      function () {
					try {
						return JSON.parse( c.attr( "data-nav-class" ) );
					} catch ( e ) {
						return [ 'owl-prev', 'owl-next' ];
					}
				}()
			} );
		}

		/**
		 * @desc Attach form validation to elements
		 * @param {object} elements - jQuery object
		 */
		function attachFormValidator(elements) {
			// Custom validator - phone number
			regula.custom({
				name: 'PhoneNumber',
				defaultMessage: 'Invalid phone number format',
				validator: function() {
					if ( this.value === '' ) return true;
					else return /^(\+\d)?[0-9\-\(\) ]{5,}$/i.test( this.value );
				}
			});

			for (var i = 0; i < elements.length; i++) {
				var o = $(elements[i]), v;
				o.addClass("form-control-has-validation").after("<span class='form-validation'></span>");
				v = o.parent().find(".form-validation");
				if (v.is(":last-child")) o.addClass("form-control-last-child");
			}

			elements.on('input change propertychange blur', function (e) {
				var $this = $(this), results;

				if (e.type !== "blur") if (!$this.parent().hasClass("has-error")) return;
				if ($this.parents('.rd-mailform').hasClass('success')) return;

				if (( results = $this.regula('validate') ).length) {
					for (i = 0; i < results.length; i++) {
						$this.siblings(".form-validation").text(results[i].message).parent().addClass("has-error");
					}
				} else {
					$this.siblings(".form-validation").text("").parent().removeClass("has-error")
				}
			}).regula('bind');

			var regularConstraintsMessages = [
				{
					type: regula.Constraint.Required,
					newMessage: "The text field is required."
				},
				{
					type: regula.Constraint.Email,
					newMessage: "The email is not a valid email."
				},
				{
					type: regula.Constraint.Numeric,
					newMessage: "Only numbers are required"
				},
				{
					type: regula.Constraint.Selected,
					newMessage: "Please choose an option."
				}
			];


			for (var i = 0; i < regularConstraintsMessages.length; i++) {
				var regularConstraint = regularConstraintsMessages[i];

				regula.override({
					constraintType: regularConstraint.type,
					defaultMessage: regularConstraint.newMessage
				});
			}
		}

		/**
		 * @desc Check if all elements pass validation
		 * @param {object} elements - object of items for validation
		 * @param {object} captcha - captcha object for validation
		 * @return {boolean}
		 */
		function isValidated(elements, captcha) {
			var results, errors = 0;

			if (elements.length) {
				for (var j = 0; j < elements.length; j++) {

					var $input = $(elements[j]);
					if ((results = $input.regula('validate')).length) {
						for (k = 0; k < results.length; k++) {
							errors++;
							$input.siblings(".form-validation").text(results[k].message).parent().addClass("has-error");
						}
					} else {
						$input.siblings(".form-validation").text("").parent().removeClass("has-error")
					}
				}

				if (captcha) {
					if (captcha.length) {
						return validateReCaptcha(captcha) && errors === 0
					}
				}

				return errors === 0;
			}
			return true;
		}

		/**
		 * @desc Validate google reCaptcha
		 * @param {object} captcha - captcha object for validation
		 * @return {boolean}
		 */
		function validateReCaptcha(captcha) {
			var captchaToken = captcha.find('.g-recaptcha-response').val();

			if (captchaToken.length === 0) {
				captcha
					.siblings('.form-validation')
					.html('Please, prove that you are not robot.')
					.addClass('active');
				captcha
					.closest('.form-wrap')
					.addClass('has-error');

				captcha.on('propertychange', function () {
					var $this = $(this),
						captchaToken = $this.find('.g-recaptcha-response').val();

					if (captchaToken.length > 0) {
						$this
							.closest('.form-wrap')
							.removeClass('has-error');
						$this
							.siblings('.form-validation')
							.removeClass('active')
							.html('');
						$this.off('propertychange');
					}
				});

				return false;
			}

			return true;
		}

		/**
		 * @desc Initialize Google reCaptcha
		 */
		window.onloadCaptchaCallback = function () {
			for (var i = 0; i < plugins.captcha.length; i++) {
				var
					$captcha = $(plugins.captcha[i]),
					resizeHandler = (function() {
						var
							frame = this.querySelector( 'iframe' ),
							inner = this.firstElementChild,
							inner2 = inner.firstElementChild,
							containerRect = null,
							frameRect = null,
							scale = null;

						inner2.style.transform = '';
						inner.style.height = 'auto';
						inner.style.width = 'auto';

						containerRect = this.getBoundingClientRect();
						frameRect = frame.getBoundingClientRect();
						scale = containerRect.width/frameRect.width;

						if ( scale < 1 ) {
							inner2.style.transform = 'scale('+ scale +')';
							inner.style.height = ( frameRect.height * scale ) + 'px';
							inner.style.width = ( frameRect.width * scale ) + 'px';
						}
					}).bind( plugins.captcha[i] );

				grecaptcha.render(
					$captcha.attr('id'),
					{
						sitekey: $captcha.attr('data-sitekey'),
						size: $captcha.attr('data-size') ? $captcha.attr('data-size') : 'normal',
						theme: $captcha.attr('data-theme') ? $captcha.attr('data-theme') : 'light',
						callback: function () {
							$('.recaptcha').trigger('propertychange');
						}
					}
				);

				$captcha.after("<span class='form-validation'></span>");

				if ( plugins.captcha[i].hasAttribute( 'data-auto-size' ) ) {
					resizeHandler();
					window.addEventListener( 'resize', resizeHandler );
				}
			}
		};

		/**
		 * @desc Initialize the gallery with set of images
		 * @param {object} itemsToInit - jQuery object
		 * @param {string} [addClass] - additional gallery class
		 */
		function initLightGallery ( itemsToInit, addClass ) {
			if ( !isNoviBuilder ) {
				$( itemsToInit ).lightGallery( {
					thumbnail: $( itemsToInit ).attr( "data-lg-thumbnail" ) !== "false",
					selector: "[data-lightgallery='item']",
					autoplay: $( itemsToInit ).attr( "data-lg-autoplay" ) === "true",
					pause: parseInt( $( itemsToInit ).attr( "data-lg-autoplay-delay" ) ) || 5000,
					addClass: addClass,
					mode: $( itemsToInit ).attr( "data-lg-animation" ) || "lg-slide",
					loop: $( itemsToInit ).attr( "data-lg-loop" ) !== "false"
				} );
			}
		}

		/**
		 * @desc Initialize the gallery with dynamic addition of images
		 * @param {object} itemsToInit - jQuery object
		 * @param {string} [addClass] - additional gallery class
		 */
		function initDynamicLightGallery ( itemsToInit, addClass ) {
			if ( !isNoviBuilder ) {
				$( itemsToInit ).on( "click", function () {
					$( itemsToInit ).lightGallery( {
						thumbnail: $( itemsToInit ).attr( "data-lg-thumbnail" ) !== "false",
						selector: "[data-lightgallery='item']",
						autoplay: $( itemsToInit ).attr( "data-lg-autoplay" ) === "true",
						pause: parseInt( $( itemsToInit ).attr( "data-lg-autoplay-delay" ) ) || 5000,
						addClass: addClass,
						mode: $( itemsToInit ).attr( "data-lg-animation" ) || "lg-slide",
						loop: $( itemsToInit ).attr( "data-lg-loop" ) !== "false",
						dynamic: true,
						dynamicEl: JSON.parse( $( itemsToInit ).attr( "data-lg-dynamic-elements" ) ) || []
					} );
				} );
			}
		}

		/**
		 * @desc Initialize the gallery with one image
		 * @param {object} itemToInit - jQuery object
		 * @param {string} [addClass] - additional gallery class
		 */
		function initLightGalleryItem ( itemToInit, addClass ) {
			if ( !isNoviBuilder ) {
				$( itemToInit ).lightGallery( {
					selector: "this",
					addClass: addClass,
					counter: false,
					youtubePlayerParams: {
						modestbranding: 1,
						showinfo: 0,
						rel: 0,
						controls: 0
					},
					vimeoPlayerParams: {
						byline: 0,
						portrait: 0
					}
				} );
			}
		}

		// Google ReCaptcha
		if (plugins.captcha.length) {
			$.getScript("//www.google.com/recaptcha/api.js?onload=onloadCaptchaCallback&render=explicit&hl=en");
		}

		// Additional class on html if mac os.
		if ( navigator.platform.match( /(Mac)/i ) ) {
			$html.addClass( "mac-os" );
		}

		// Adds some loosing functionality to IE browsers (IE Polyfills)
		if (isIE) {
			if (isIE === 12) $html.addClass("ie-edge");
			if (isIE === 11) $html.addClass("ie-11");
			if (isIE < 10) $html.addClass("lt-ie-10");
			if (isIE < 11) $html.addClass("ie-10");
		}

		// Stop vioeo in bootstrapModalDialog
		if ( plugins.bootstrapModalDialog.length ) {

			$( '[data-toggle=modal]' ).on( 'click', function () {
				console.log( 321321 );
				$html.addClass( 'html-modal-open' )
			} )

			for ( var i = 0; i < plugins.bootstrapModalDialog.length; i++ ) {
				var modalItem = $( plugins.bootstrapModalDialog[ i ] );

				modalItem.on( 'hidden.bs.modal', $.proxy( function () {
					var activeModal = $( this ),
						rdVideoInside = activeModal.find( 'video' ),
						youTubeVideoInside = activeModal.find( 'iframe' );

					if ( rdVideoInside.length ) {
						rdVideoInside[ 0 ].pause();
					}

					if ( youTubeVideoInside.length ) {
						var videoUrl = youTubeVideoInside.attr( 'src' );

						youTubeVideoInside
							.attr( 'src', '' )
							.attr( 'src', videoUrl );
					}
				}, modalItem ) )
			}
		}

		// Bootstrap tabs
		if ( plugins.bootstrapTabs.length ) {
			for ( var i = 0; i < plugins.bootstrapTabs.length; i++ ) {
				var bootstrapTabsItem = $( plugins.bootstrapTabs[ i ] );

				//If have slick carousel inside tab - resize slick carousel on click
				if ( bootstrapTabsItem.find( '.slick-slider' ).length ) {
					bootstrapTabsItem.find( '.tabs-custom-list > li > a' ).on( 'click', $.proxy( function () {
						var $this = $( this );
						var setTimeOutTime = isNoviBuilder ? 1500 : 300;

						setTimeout( function () {
							$this.find( '.tab-content .tab-pane.active .slick-slider' ).slick( 'setPosition' );
						}, setTimeOutTime );
					}, bootstrapTabsItem ) );
				}
			}
		}

		// Copyright Year (Evaluates correct copyright year)
		if ( plugins.copyrightYear.length ) {
			plugins.copyrightYear.text( initialDate.getFullYear() );
		}

		// Page loader
		if ( plugins.preloader.length ) {
			loaderTimeoutId = setTimeout( function () {
				if ( !windowReady && !isNoviBuilder ) plugins.preloader.removeClass( 'loaded' );
			}, 2000 );
		}

		// Add custom styling options for input[type="radio"]
		if (plugins.radio.length) {
			for (var i = 0; i < plugins.radio.length; i++) {
				$(plugins.radio[i]).addClass("radio-custom").after("<span class='radio-custom-dummy'></span>")
			}
		}

		// Add custom styling options for input[type="checkbox"]
		if (plugins.checkbox.length) {
			for (var i = 0; i < plugins.checkbox.length; i++) {
				$(plugins.checkbox[i]).addClass("checkbox-custom").after("<span class='checkbox-custom-dummy'></span>")
			}
		}

		// UI To Top
		if ( isDesktop && !isNoviBuilder ) {
			$().UItoTop( {
				easingType:     'easeOutQuad',
				containerClass: 'ui-to-top fa fa-angle-up'
			} );
		}

		// lightGallery
		if (plugins.lightGallery.length) {
			for (var i = 0; i < plugins.lightGallery.length; i++) {
				initLightGallery(plugins.lightGallery[i]);
			}
		}

		// lightGallery item
		if (plugins.lightGalleryItem.length) {
			// Filter carousel items
			var notCarouselItems = [];

			for (var z = 0; z < plugins.lightGalleryItem.length; z++) {
				if (!$(plugins.lightGalleryItem[z]).parents('.owl-carousel').length &&
					!$(plugins.lightGalleryItem[z]).parents('.swiper-slider').length &&
					!$(plugins.lightGalleryItem[z]).parents('.slick-slider').length) {
					notCarouselItems.push(plugins.lightGalleryItem[z]);
				}
			}

			plugins.lightGalleryItem = notCarouselItems;

			for (var i = 0; i < plugins.lightGalleryItem.length; i++) {
				initLightGalleryItem(plugins.lightGalleryItem[i]);
			}
		}

		// Dynamic lightGallery
		if (plugins.lightDynamicGalleryItem.length) {
			for (var i = 0; i < plugins.lightDynamicGalleryItem.length; i++) {
				initDynamicLightGallery(plugins.lightDynamicGalleryItem[i]);
			}
		}

		// Owl carousel
		if ( plugins.owl.length ) {
			for ( var i = 0; i < plugins.owl.length; i++ ) {
				var c = $( plugins.owl[ i ] );
				plugins.owl[ i ].owl = c;

				initOwlCarousel( c );
			}
		}

		// RD Navbar
		if ( plugins.rdNavbar.length ) {
			var aliaces, i, j, len, value, values, responsiveNavbar;

			aliaces = [ "-", "-sm-", "-md-", "-lg-", "-xl-", "-xxl-" ];
			values = [ 0, 576, 768, 992, 1200, 1600 ];
			responsiveNavbar = {};

			for ( i = j = 0, len = values.length; j < len; i = ++j ) {
				value = values[ i ];
				if ( !responsiveNavbar[ values[ i ] ] ) {
					responsiveNavbar[ values[ i ] ] = {};
				}
				if ( plugins.rdNavbar.attr( 'data' + aliaces[ i ] + 'layout' ) ) {
					responsiveNavbar[ values[ i ] ].layout = plugins.rdNavbar.attr( 'data' + aliaces[ i ] + 'layout' );
				}
				if ( plugins.rdNavbar.attr( 'data' + aliaces[ i ] + 'device-layout' ) ) {
					responsiveNavbar[ values[ i ] ][ 'deviceLayout' ] = plugins.rdNavbar.attr( 'data' + aliaces[ i ] + 'device-layout' );
				}
				if ( plugins.rdNavbar.attr( 'data' + aliaces[ i ] + 'hover-on' ) ) {
					responsiveNavbar[ values[ i ] ][ 'focusOnHover' ] = plugins.rdNavbar.attr( 'data' + aliaces[ i ] + 'hover-on' ) === 'true';
				}
				if ( plugins.rdNavbar.attr( 'data' + aliaces[ i ] + 'auto-height' ) ) {
					responsiveNavbar[ values[ i ] ][ 'autoHeight' ] = plugins.rdNavbar.attr( 'data' + aliaces[ i ] + 'auto-height' ) === 'true';
				}

				if ( isNoviBuilder ) {
					responsiveNavbar[ values[ i ] ][ 'stickUp' ] = false;
				} else if ( plugins.rdNavbar.attr( 'data' + aliaces[ i ] + 'stick-up' ) ) {
					responsiveNavbar[ values[ i ] ][ 'stickUp' ] = plugins.rdNavbar.attr( 'data' + aliaces[ i ] + 'stick-up' ) === 'true';
				}

				if ( plugins.rdNavbar.attr( 'data' + aliaces[ i ] + 'stick-up-offset' ) ) {
					responsiveNavbar[ values[ i ] ][ 'stickUpOffset' ] = plugins.rdNavbar.attr( 'data' + aliaces[ i ] + 'stick-up-offset' );
				}
			}


			plugins.rdNavbar.RDNavbar( {
				anchorNav:    !isNoviBuilder,
				stickUpClone: (plugins.rdNavbar.attr( "data-stick-up-clone" ) && !isNoviBuilder) ? plugins.rdNavbar.attr( "data-stick-up-clone" ) === 'true' : false,
				responsive:   responsiveNavbar,
				callbacks:    {
					onStuck:        function () {
						var navbarSearch = this.$element.find( '.rd-search input' );

						if ( navbarSearch ) {
							navbarSearch.val( '' ).trigger( 'propertychange' );
						}
					},
					onDropdownOver: function () {
						return !isNoviBuilder;
					},
					onUnstuck:      function () {
						if ( this.$clone === null )
							return;

						var navbarSearch = this.$clone.find( '.rd-search input' );

						if ( navbarSearch ) {
							navbarSearch.val( '' ).trigger( 'propertychange' );
							navbarSearch.trigger( 'blur' );
						}

					}
				}
			} );


			if ( plugins.rdNavbar.attr( "data-body-class" ) ) {
				document.body.className += ' ' + plugins.rdNavbar.attr( "data-body-class" );
			}
		}

		// Swiper
		if ( plugins.swiper.length ) {
			for ( var i = 0; i < plugins.swiper.length; i++ ) {
				var s = $( plugins.swiper[ i ] );
				var pag = s.find( ".swiper-pagination" ),
					next = s.find( ".swiper-button-next" ),
					prev = s.find( ".swiper-button-prev" ),
					bar = s.find( ".swiper-scrollbar" ),
					swiperSlide = s.find( ".swiper-slide" ),
					autoplay = false;

				for ( var j = 0; j < swiperSlide.length; j++ ) {
					var $this = $( swiperSlide[ j ] ),
						url;

					if ( url = $this.attr( "data-slide-bg" ) ) {
						$this.css( {
							"background-image": "url(" + url + ")",
							"background-size":  "cover"
						} )
					}
				}

				swiperSlide.end()
					.find( "[data-caption-animate]" )
					.addClass( "not-animated" )
					.end();

				s.swiper( {
					autoplay:                 s.attr( 'data-autoplay' ) ? s.attr( 'data-autoplay' ) === "false" ? undefined : s.attr( 'data-autoplay' ) : 5000,
					direction:                s.attr( 'data-direction' ) && isDesktop ? s.attr( 'data-direction' ) : "horizontal",
					effect:                   s.attr( 'data-slide-effect' ) ? s.attr( 'data-slide-effect' ) : "slide",
					speed:                    s.attr( 'data-slide-speed' ) ? s.attr( 'data-slide-speed' ) : 600,
					keyboardControl:          s.attr( 'data-keyboard' ) === "true",
					mousewheelControl:        s.attr( 'data-mousewheel' ) === "true",
					mousewheelReleaseOnEdges: s.attr( 'data-mousewheel-release' ) === "true",
					nextButton:               next.length ? next.get( 0 ) : null,
					prevButton:               prev.length ? prev.get( 0 ) : null,
					pagination:               pag.length ? pag.get( 0 ) : null,
					paginationClickable:      pag.length ? pag.attr( "data-clickable" ) !== "false" : false,
					paginationBulletRender:   function ( swiper, index, className ) {
						if ( pag.attr( "data-index-bullet" ) === "true" ) {
							return '<span class="' + className + '">' + (index + 1) + '</span>';
						} else if ( pag.attr( "data-bullet-custom" ) === "true" ) {
							return '<span class="' + className + '"><span></span></span>';
						} else {
							return '<span class="' + className + '"></span>';
						}
					},
					scrollbar:                bar.length ? bar.get( 0 ) : null,
					scrollbarDraggable:       bar.length ? bar.attr( "data-draggable" ) !== "false" : true,
					scrollbarHide:            bar.length ? bar.attr( "data-draggable" ) === "false" : false,
					loop:                     isNoviBuilder ? false : s.attr( 'data-loop' ) !== "false",
					simulateTouch:            s.attr( 'data-simulate-touch' ) && !isNoviBuilder ? s.attr( 'data-simulate-touch' ) === "true" : false,
					onTransitionStart:        function ( swiper ) {
						toggleSwiperInnerVideos( swiper );
					},
					onTransitionEnd:          function ( swiper ) {
						toggleSwiperCaptionAnimation( swiper );
					},
					onInit:                   (function ( s ) {
						return function ( swiper ) {
							toggleSwiperInnerVideos( swiper );
							toggleSwiperCaptionAnimation( swiper );

							var $swiper = $( s );

							var swiperCustomIndex = $swiper.find( '.swiper-pagination__fraction-index' ).get( 0 ),
								swiperCustomCount = $swiper.find( '.swiper-pagination__fraction-count' ).get( 0 );

							if ( swiperCustomIndex && swiperCustomCount ) {
								swiperCustomIndex.innerHTML = formatIndex( swiper.realIndex + 1 );
								if ( swiperCustomCount ) {
									if ( isNoviBuilder ? false : s.attr( 'data-loop' ) !== "false" ) {
										swiperCustomCount.innerHTML = formatIndex( swiper.slides.length - 2 );
									} else {
										swiperCustomCount.innerHTML = formatIndex( swiper.slides.length );
									}
								}
							}
						}
					}( s )),
					onSlideChangeStart:       (function ( s ) {
						return function ( swiper ) {
							var swiperCustomIndex = $( s ).find( '.swiper-pagination__fraction-index' ).get( 0 );

							if ( swiperCustomIndex ) {
								swiperCustomIndex.innerHTML = formatIndex( swiper.realIndex + 1 );
							}
						}
					}( s ))
				} );

				$window.on( "resize", (function ( s ) {
					return function () {
						var mh = getSwiperHeight( s, "min-height" ),
							h = getSwiperHeight( s, "height" );
						if ( h ) {
							s.css( "height", mh ? mh > h ? mh : h : h );
						}
					}
				})( s ) ).trigger( "resize" );
			}
		}

		function formatIndex ( index ) {
			return index < 10 ? '0' + index : index;
		}

		// Isotope
		if ( plugins.isotope.length ) {
			var isogroup = [];
			for ( var i = 0; i < plugins.isotope.length; i++ ) {
				var isotopeItem = plugins.isotope[ i ],
					isotopeInitAttrs = {
						itemSelector: '.isotope-item',
						layoutMode:   isotopeItem.getAttribute( 'data-isotope-layout' ) ? isotopeItem.getAttribute( 'data-isotope-layout' ) : 'masonry',
						filter:       '*'
					};

				if ( isotopeItem.getAttribute( 'data-column-width' ) ) {
					isotopeInitAttrs.masonry = {
						columnWidth: parseFloat( isotopeItem.getAttribute( 'data-column-width' ) )
					};
				} else if ( isotopeItem.getAttribute( 'data-column-class' ) ) {
					isotopeInitAttrs.masonry = {
						columnWidth: isotopeItem.getAttribute( 'data-column-class' )
					};
				}

				var iso = new Isotope( isotopeItem, isotopeInitAttrs );
				isogroup.push( iso );
			}


			setTimeout( function () {
				for ( var i = 0; i < isogroup.length; i++ ) {
					isogroup[ i ].element.className += " isotope--loaded";
					isogroup[ i ].layout();
				}
			}, 200 );

			var resizeTimout;

			$( "[data-isotope-filter]" ).on( "click", function ( e ) {
				e.preventDefault();
				var filter = $( this );
				clearTimeout( resizeTimout );
				filter.parents( ".isotope-filters" ).find( '.active' ).removeClass( "active" );
				filter.addClass( "active" );
				var iso = $( '.isotope[data-isotope-group="' + this.getAttribute( "data-isotope-group" ) + '"]' ),
					isotopeAttrs = {
						itemSelector: '.isotope-item',
						layoutMode:   iso.attr( 'data-isotope-layout' ) ? iso.attr( 'data-isotope-layout' ) : 'masonry',
						filter:       this.getAttribute( "data-isotope-filter" ) === '*' ? '*' : '[data-filter*="' + this.getAttribute( "data-isotope-filter" ) + '"]'
					};
				if ( iso.attr( 'data-column-width' ) ) {
					isotopeAttrs.masonry = {
						columnWidth: parseFloat( iso.attr( 'data-column-width' ) )
					};
				} else if ( iso.attr( 'data-column-class' ) ) {
					isotopeAttrs.masonry = {
						columnWidth: iso.attr( 'data-column-class' )
					};
				}
				iso.isotope( isotopeAttrs );
			} ).eq( 0 ).trigger( "click" )
		}

		// WOW
		if ( $html.hasClass( "wow-animation" ) && plugins.wow.length && !isNoviBuilder && isDesktop ) {
			new WOW().init();
		}

		// RD Input Label
		if (plugins.rdInputLabel.length) {
			plugins.rdInputLabel.RDInputLabel();
		}

		// Regula
		if (plugins.regula.length) {
			attachFormValidator(plugins.regula);
		}

		// RD Mailform
		if (plugins.rdMailForm.length) {
			var i, j, k,
				msg = {
					'MF000': 'Successfully sent!',
					'MF001': 'Recipients are not set!',
					'MF002': 'Form will not work locally!',
					'MF003': 'Please, define email field in your form!',
					'MF004': 'Please, define type of your form!',
					'MF254': 'Something went wrong with PHPMailer!',
					'MF255': 'Aw, snap! Something went wrong.'
				};

			for (i = 0; i < plugins.rdMailForm.length; i++) {
				var $form = $(plugins.rdMailForm[i]),
					formHasCaptcha = false;

				$form.attr('novalidate', 'novalidate').ajaxForm({
					data: {
						"form-type": $form.attr("data-form-type") || "contact",
						"counter": i
					},
					beforeSubmit: function (arr, $form, options) {
						if (isNoviBuilder)
							return;

						var form = $(plugins.rdMailForm[this.extraData.counter]),
							inputs = form.find("[data-constraints]"),
							output = $("#" + form.attr("data-form-output")),
							captcha = form.find('.recaptcha'),
							captchaFlag = true;

						output.removeClass("active error success");

						if (isValidated(inputs, captcha)) {

							// veify reCaptcha
							if (captcha.length) {
								var captchaToken = captcha.find('.g-recaptcha-response').val(),
									captchaMsg = {
										'CPT001': 'Please, setup you "site key" and "secret key" of reCaptcha',
										'CPT002': 'Something wrong with google reCaptcha'
									};

								formHasCaptcha = true;

								$.ajax({
									method: "POST",
									url: "bat/reCaptcha.php",
									data: {'g-recaptcha-response': captchaToken},
									async: false
								})
									.done(function (responceCode) {
										if (responceCode !== 'CPT000') {
											if (output.hasClass("snackbars")) {
												output.html('<p><span class="icon text-middle mdi mdi-check icon-xxs"></span><span>' + captchaMsg[responceCode] + '</span></p>')

												setTimeout(function () {
													output.removeClass("active");
												}, 3500);

												captchaFlag = false;
											} else {
												output.html(captchaMsg[responceCode]);
											}

											output.addClass("active");
										}
									});
							}

							if (!captchaFlag) {
								return false;
							}

							form.addClass('form-in-process');

							if (output.hasClass("snackbars")) {
								output.html('<p><span class="icon text-middle fa fa-circle-o-notch fa-spin icon-xxs"></span><span>Sending</span></p>');
								output.addClass("active");
							}
						} else {
							return false;
						}
					},
					error: function (result) {
						if (isNoviBuilder)
							return;

						var output = $("#" + $(plugins.rdMailForm[this.extraData.counter]).attr("data-form-output")),
							form = $(plugins.rdMailForm[this.extraData.counter]);

						output.text(msg[result]);
						form.removeClass('form-in-process');

						if (formHasCaptcha) {
							grecaptcha.reset();
						}
					},
					success: function (result) {
						if (isNoviBuilder)
							return;

						var form = $(plugins.rdMailForm[this.extraData.counter]),
							output = $("#" + form.attr("data-form-output")),
							select = form.find('select');

						form
							.addClass('success')
							.removeClass('form-in-process');

						if (formHasCaptcha) {
							grecaptcha.reset();
						}

						result = result.length === 5 ? result : 'MF255';
						output.text(msg[result]);

						if (result === "MF000") {
							if (output.hasClass("snackbars")) {
								output.html('<p><span class="icon text-middle mdi mdi-check icon-xxs"></span><span>' + msg[result] + '</span></p>');
							} else {
								output.addClass("active success");
							}
						} else {
							if (output.hasClass("snackbars")) {
								output.html(' <p class="snackbars-left"><span class="icon icon-xxs mdi mdi-alert-outline text-middle"></span><span>' + msg[result] + '</span></p>');
							} else {
								output.addClass("active error");
							}
						}

						form.clearForm();

						if (select.length) {
							select.select2("val", "");
						}

						form.find('input, textarea').trigger('blur');

						setTimeout(function () {
							output.removeClass("active error success");
							form.removeClass('success');
						}, 3500);
					}
				});
			}
		}

		// Custom Toggles
		if ( plugins.customToggle.length ) {
			for ( var i = 0; i < plugins.customToggle.length; i++ ) {
				var $this = $( plugins.customToggle[ i ] );

				$this.on( 'click', $.proxy( function ( event ) {
					event.preventDefault();

					var $ctx = $( this );
					$( $ctx.attr( 'data-custom-toggle' ) ).add( this ).toggleClass( 'active' );
				}, $this ) );

				if ( $this.attr( "data-custom-toggle-hide-on-blur" ) === "true" ) {
					$body.on( "click", $this, function ( e ) {
						if ( e.target !== e.data[ 0 ]
							&& $( e.data.attr( 'data-custom-toggle' ) ).find( $( e.target ) ).length
							&& e.data.find( $( e.target ) ).length === 0 ) {
							$( e.data.attr( 'data-custom-toggle' ) ).add( e.data[ 0 ] ).removeClass( 'active' );
						}
					} )
				}

				if ( $this.attr( "data-custom-toggle-disable-on-blur" ) === "true" ) {
					$body.on( "click", $this, function ( e ) {
						if ( e.target !== e.data[ 0 ] && $( e.data.attr( 'data-custom-toggle' ) ).find( $( e.target ) ).length === 0 && e.data.find( $( e.target ) ).length === 0 ) {
							$( e.data.attr( 'data-custom-toggle' ) ).add( e.data[ 0 ] ).removeClass( 'active' );
						}
					} )
				}
			}
		}

		// jQuery Count To
		if ( plugins.counter.length ) {
			for ( var i = 0; i < plugins.counter.length; i++ ) {
				var $counterNotAnimated = $( plugins.counter[ i ] ).not( '.animated' );
				$document.on( "scroll", $.proxy( function () {
					var $this = this;

					if ( (!$this.hasClass( "animated" )) && (isScrolledIntoView( $this )) ) {
						$this.countTo( {
							refreshInterval: 40,
							from:            0,
							to:              parseInt( $this.text(), 10 ),
							speed:           $this.attr( "data-speed" ) || 1000
						} );
						$this.addClass( 'animated' );
					}
				}, $counterNotAnimated ) )
					.trigger( "scroll" );
			}
		}

		// Material Parallax
		if ( plugins.materialParallax.length ) {
			if ( !isNoviBuilder && !isIE && !isMobile ) {
				plugins.materialParallax.parallax();

				// heavy pages fix
				$window.on( 'load', function () {
					setTimeout( function () {
						$window.scroll();
					}, 500 );
				} );
			} else {
				for ( var i = 0; i < plugins.materialParallax.length; i++ ) {
					var parallax = $( plugins.materialParallax[ i ] ),
						imgPath = parallax.data( "parallax-img" );

					parallax.css( {
						"background-image": 'url(' + imgPath + ')',
						"background-size":  "cover"
					} );
				}
			}
		}

		// particlesJs
		if ( plugins.particlesJs.length ) {
			particlesJS( 'particles-js', {
				"particles":     {
					"number":      {
						"value":   200,
						"density": {
							"enable":     true,
							"value_area": 800
						}
					},
					"color":       {
						"value": "#ffffff"
					},
					"shape":       {
						"type":    "circle",
						"stroke":  {
							"width": 0,
							"color": "#000000"
						},
						"polygon": {
							"nb_sides": 5
						},
						"image":   {
							"src":    "img/github.svg",
							"width":  100,
							"height": 100
						}
					},
					"opacity":     {
						"value":  0.5,
						"random": false,
						"anim":   {
							"enable":      false,
							"speed":       1,
							"opacity_min": 0.1,
							"sync":        false
						}
					},
					"size":        {
						"value":  5,
						"random": true,
						"anim":   {
							"enable":   false,
							"speed":    40,
							"size_min": 0.1,
							"sync":     false
						}
					},
					"line_linked": {
						"enable":   true,
						"distance": 150,
						"color":    "#ffffff",
						"opacity":  0.4,
						"width":    1
					},
					"move":        {
						"enable":    true,
						"speed":     6,
						"direction": "none",
						"random":    true,
						"straight":  false,
						"out_mode":  "out",
						"attract":   {
							"enable":  false,
							"rotateX": 600,
							"rotateY": 1200
						}
					}
				},
				"interactivity": {
					"detect_on": "canvas",
					"events":    {
						"onhover": {
							"enable": true,
							"mode":   "grab"
						},
						"onclick": {
							"enable": true,
							"mode":   "push"
						},
						"resize":  true
					},
					"modes":     {
						"grab":    {
							"distance":    400,
							"line_linked": {
								"opacity": 1
							}
						},
						"bubble":  {
							"distance": 400,
							"size":     40,
							"duration": 2,
							"opacity":  8,
							"speed":    3
						},
						"repulse": {
							"distance": 200
						},
						"push":    {
							"particles_nb": 4
						},
						"remove":  {
							"particles_nb": 2
						}
					}
				},
				"retina_detect": true,
				"config_demo":   {
					"hide_card":           false,
					"background_color":    "#b61924",
					"background_image":    "",
					"background_position": "50% 50%",
					"background_repeat":   "no-repeat",
					"background_size":     "cover"
				}
			} )
		}

		// Google maps
		if ( plugins.maps.length ) {
			lazyInit( plugins.maps, initMaps );
		}

	} );
}());



(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
	/*!
	 * imagesLoaded v3.2.0
	 * JavaScript is all like "You images are done yet or what?"
	 * MIT License
	 */
	
	( function( window, factory ) { 'use strict';
	  // universal module definition
	
	  /*global define: false, module: false, require: false */
	
	  if ( typeof define == 'function' && define.amd ) {
		// AMD
		define( [
		  'eventEmitter/EventEmitter',
		  'eventie/eventie'
		], function( EventEmitter, eventie ) {
		  return factory( window, EventEmitter, eventie );
		});
	  } else if ( typeof module == 'object' && module.exports ) {
		// CommonJS
		module.exports = factory(
		  window,
		  require('wolfy87-eventemitter'),
		  require('eventie')
		);
	  } else {
		// browser global
		window.imagesLoaded = factory(
		  window,
		  window.EventEmitter,
		  window.eventie
		);
	  }
	
	})( window,
	
	// --------------------------  factory -------------------------- //
	
	function factory( window, EventEmitter, eventie ) {
	
	'use strict';
	
	var $ = window.jQuery;
	var console = window.console;
	
	// -------------------------- helpers -------------------------- //
	
	// extend objects
	function extend( a, b ) {
	  for ( var prop in b ) {
		a[ prop ] = b[ prop ];
	  }
	  return a;
	}
	
	var objToString = Object.prototype.toString;
	function isArray( obj ) {
	  return objToString.call( obj ) == '[object Array]';
	}
	
	// turn element or nodeList into an array
	function makeArray( obj ) {
	  var ary = [];
	  if ( isArray( obj ) ) {
		// use object if already an array
		ary = obj;
	  } else if ( typeof obj.length == 'number' ) {
		// convert nodeList to array
		for ( var i=0; i < obj.length; i++ ) {
		  ary.push( obj[i] );
		}
	  } else {
		// array of single index
		ary.push( obj );
	  }
	  return ary;
	}
	
	  // -------------------------- imagesLoaded -------------------------- //
	
	  /**
	   * @param {Array, Element, NodeList, String} elem
	   * @param {Object or Function} options - if function, use as callback
	   * @param {Function} onAlways - callback function
	   */
	  function ImagesLoaded( elem, options, onAlways ) {
		// coerce ImagesLoaded() without new, to be new ImagesLoaded()
		if ( !( this instanceof ImagesLoaded ) ) {
		  return new ImagesLoaded( elem, options, onAlways );
		}
		// use elem as selector string
		if ( typeof elem == 'string' ) {
		  elem = document.querySelectorAll( elem );
		}
	
		this.elements = makeArray( elem );
		this.options = extend( {}, this.options );
	
		if ( typeof options == 'function' ) {
		  onAlways = options;
		} else {
		  extend( this.options, options );
		}
	
		if ( onAlways ) {
		  this.on( 'always', onAlways );
		}
	
		this.getImages();
	
		if ( $ ) {
		  // add jQuery Deferred object
		  this.jqDeferred = new $.Deferred();
		}
	
		// HACK check async to allow time to bind listeners
		var _this = this;
		setTimeout( function() {
		  _this.check();
		});
	  }
	
	  ImagesLoaded.prototype = new EventEmitter();
	
	  ImagesLoaded.prototype.options = {};
	
	  ImagesLoaded.prototype.getImages = function() {
		this.images = [];
	
		// filter & find items if we have an item selector
		for ( var i=0; i < this.elements.length; i++ ) {
		  var elem = this.elements[i];
		  this.addElementImages( elem );
		}
	  };
	
	  /**
	   * @param {Node} element
	   */
	  ImagesLoaded.prototype.addElementImages = function( elem ) {
		// filter siblings
		if ( elem.nodeName == 'IMG' ) {
		  this.addImage( elem );
		}
		// get background image on element
		if ( this.options.background === true ) {
		  this.addElementBackgroundImages( elem );
		}
	
		// find children
		// no non-element nodes, #143
		var nodeType = elem.nodeType;
		if ( !nodeType || !elementNodeTypes[ nodeType ] ) {
		  return;
		}
		var childImgs = elem.querySelectorAll('img');
		// concat childElems to filterFound array
		for ( var i=0; i < childImgs.length; i++ ) {
		  var img = childImgs[i];
		  this.addImage( img );
		}
	
		// get child background images
		if ( typeof this.options.background == 'string' ) {
		  var children = elem.querySelectorAll( this.options.background );
		  for ( i=0; i < children.length; i++ ) {
			var child = children[i];
			this.addElementBackgroundImages( child );
		  }
		}
	  };
	
	  var elementNodeTypes = {
		1: true,
		9: true,
		11: true
	  };
	
	  ImagesLoaded.prototype.addElementBackgroundImages = function( elem ) {
		var style = getStyle( elem );
		// get url inside url("...")
		var reURL = /url\(['"]*([^'"\)]+)['"]*\)/gi;
		var matches = reURL.exec( style.backgroundImage );
		while ( matches !== null ) {
		  var url = matches && matches[1];
		  if ( url ) {
			this.addBackground( url, elem );
		  }
		  matches = reURL.exec( style.backgroundImage );
		}
	  };
	
	  // IE8
	  var getStyle = window.getComputedStyle || function( elem ) {
		return elem.currentStyle;
	  };
	
	  /**
	   * @param {Image} img
	   */
	  ImagesLoaded.prototype.addImage = function( img ) {
		var loadingImage = new LoadingImage( img );
		this.images.push( loadingImage );
	  };
	
	  ImagesLoaded.prototype.addBackground = function( url, elem ) {
		var background = new Background( url, elem );
		this.images.push( background );
	  };
	
	  ImagesLoaded.prototype.check = function() {
		var _this = this;
		this.progressedCount = 0;
		this.hasAnyBroken = false;
		// complete if no images
		if ( !this.images.length ) {
		  this.complete();
		  return;
		}
	
		function onProgress( image, elem, message ) {
		  // HACK - Chrome triggers event before object properties have changed. #83
		  setTimeout( function() {
			_this.progress( image, elem, message );
		  });
		}
	
		for ( var i=0; i < this.images.length; i++ ) {
		  var loadingImage = this.images[i];
		  loadingImage.once( 'progress', onProgress );
		  loadingImage.check();
		}
	  };
	
	  ImagesLoaded.prototype.progress = function( image, elem, message ) {
		this.progressedCount++;
		this.hasAnyBroken = this.hasAnyBroken || !image.isLoaded;
		// progress event
		this.emit( 'progress', this, image, elem );
		if ( this.jqDeferred && this.jqDeferred.notify ) {
		  this.jqDeferred.notify( this, image );
		}
		// check if completed
		if ( this.progressedCount == this.images.length ) {
		  this.complete();
		}
	
		if ( this.options.debug && console ) {
		  console.log( 'progress: ' + message, image, elem );
		}
	  };
	
	  ImagesLoaded.prototype.complete = function() {
		var eventName = this.hasAnyBroken ? 'fail' : 'done';
		this.isComplete = true;
		this.emit( eventName, this );
		this.emit( 'always', this );
		if ( this.jqDeferred ) {
		  var jqMethod = this.hasAnyBroken ? 'reject' : 'resolve';
		  this.jqDeferred[ jqMethod ]( this );
		}
	  };
	
	  // --------------------------  -------------------------- //
	
	  function LoadingImage( img ) {
		this.img = img;
	  }
	
	  LoadingImage.prototype = new EventEmitter();
	
	  LoadingImage.prototype.check = function() {
		// If complete is true and browser supports natural sizes,
		// try to check for image status manually.
		var isComplete = this.getIsImageComplete();
		if ( isComplete ) {
		  // report based on naturalWidth
		  this.confirm( this.img.naturalWidth !== 0, 'naturalWidth' );
		  return;
		}
	
		// If none of the checks above matched, simulate loading on detached element.
		this.proxyImage = new Image();
		eventie.bind( this.proxyImage, 'load', this );
		eventie.bind( this.proxyImage, 'error', this );
		// bind to image as well for Firefox. #191
		eventie.bind( this.img, 'load', this );
		eventie.bind( this.img, 'error', this );
		this.proxyImage.src = this.img.src;
	  };
	
	  LoadingImage.prototype.getIsImageComplete = function() {
		return this.img.complete && this.img.naturalWidth !== undefined;
	  };
	
	  LoadingImage.prototype.confirm = function( isLoaded, message ) {
		this.isLoaded = isLoaded;
		this.emit( 'progress', this, this.img, message );
	  };
	
	  // ----- events ----- //
	
	  // trigger specified handler for event type
	  LoadingImage.prototype.handleEvent = function( event ) {
		var method = 'on' + event.type;
		if ( this[ method ] ) {
		  this[ method ]( event );
		}
	  };
	
	  LoadingImage.prototype.onload = function() {
		this.confirm( true, 'onload' );
		this.unbindEvents();
	  };
	
	  LoadingImage.prototype.onerror = function() {
		this.confirm( false, 'onerror' );
		this.unbindEvents();
	  };
	
	  LoadingImage.prototype.unbindEvents = function() {
		eventie.unbind( this.proxyImage, 'load', this );
		eventie.unbind( this.proxyImage, 'error', this );
		eventie.unbind( this.img, 'load', this );
		eventie.unbind( this.img, 'error', this );
	  };
	
	  // -------------------------- Background -------------------------- //
	
	  function Background( url, element ) {
		this.url = url;
		this.element = element;
		this.img = new Image();
	  }
	
	  // inherit LoadingImage prototype
	  Background.prototype = new LoadingImage();
	
	  Background.prototype.check = function() {
		eventie.bind( this.img, 'load', this );
		eventie.bind( this.img, 'error', this );
		this.img.src = this.url;
		// check if image is already complete
		var isComplete = this.getIsImageComplete();
		if ( isComplete ) {
		  this.confirm( this.img.naturalWidth !== 0, 'naturalWidth' );
		  this.unbindEvents();
		}
	  };
	
	  Background.prototype.unbindEvents = function() {
		eventie.unbind( this.img, 'load', this );
		eventie.unbind( this.img, 'error', this );
	  };
	
	  Background.prototype.confirm = function( isLoaded, message ) {
		this.isLoaded = isLoaded;
		this.emit( 'progress', this, this.element, message );
	  };
	
	  // -------------------------- jQuery -------------------------- //
	
	  ImagesLoaded.makeJQueryPlugin = function( jQuery ) {
		jQuery = jQuery || window.jQuery;
		if ( !jQuery ) {
		  return;
		}
		// set local variable
		$ = jQuery;
		// $().imagesLoaded()
		$.fn.imagesLoaded = function( options, callback ) {
		  var instance = new ImagesLoaded( this, options, callback );
		  return instance.jqDeferred.promise( $(this) );
		};
	  };
	  // try making plugin
	  ImagesLoaded.makeJQueryPlugin();
	
	  // --------------------------  -------------------------- //
	
	  return ImagesLoaded;
	
	});
	
	},{"eventie":2,"wolfy87-eventemitter":3}],2:[function(require,module,exports){
	/*!
	 * eventie v1.0.6
	 * event binding helper
	 *   eventie.bind( elem, 'click', myFn )
	 *   eventie.unbind( elem, 'click', myFn )
	 * MIT license
	 */
	
	/*jshint browser: true, undef: true, unused: true */
	/*global define: false, module: false */
	
	( function( window ) {
	
	'use strict';
	
	var docElem = document.documentElement;
	
	var bind = function() {};
	
	function getIEEvent( obj ) {
	  var event = window.event;
	  // add event.target
	  event.target = event.target || event.srcElement || obj;
	  return event;
	}
	
	if ( docElem.addEventListener ) {
	  bind = function( obj, type, fn ) {
		obj.addEventListener( type, fn, false );
	  };
	} else if ( docElem.attachEvent ) {
	  bind = function( obj, type, fn ) {
		obj[ type + fn ] = fn.handleEvent ?
		  function() {
			var event = getIEEvent( obj );
			fn.handleEvent.call( fn, event );
		  } :
		  function() {
			var event = getIEEvent( obj );
			fn.call( obj, event );
		  };
		obj.attachEvent( "on" + type, obj[ type + fn ] );
	  };
	}
	
	var unbind = function() {};
	
	if ( docElem.removeEventListener ) {
	  unbind = function( obj, type, fn ) {
		obj.removeEventListener( type, fn, false );
	  };
	} else if ( docElem.detachEvent ) {
	  unbind = function( obj, type, fn ) {
		obj.detachEvent( "on" + type, obj[ type + fn ] );
		try {
		  delete obj[ type + fn ];
		} catch ( err ) {
		  // can't delete window object properties
		  obj[ type + fn ] = undefined;
		}
	  };
	}
	
	var eventie = {
	  bind: bind,
	  unbind: unbind
	};
	
	// ----- module definition ----- //
	
	if ( typeof define === 'function' && define.amd ) {
	  // AMD
	  define( eventie );
	} else if ( typeof exports === 'object' ) {
	  // CommonJS
	  module.exports = eventie;
	} else {
	  // browser global
	  window.eventie = eventie;
	}
	
	})( window );
	
	},{}],3:[function(require,module,exports){
	/*!
	 * EventEmitter v4.2.11 - git.io/ee
	 * Unlicense - http://unlicense.org/
	 * Oliver Caldwell - https://oli.me.uk/
	 * @preserve
	 */
	
	;(function () {
		'use strict';
	
		/**
		 * Class for managing events.
		 * Can be extended to provide event functionality in other classes.
		 *
		 * @class EventEmitter Manages event registering and emitting.
		 */
		function EventEmitter() {}
	
		// Shortcuts to improve speed and size
		var proto = EventEmitter.prototype;
		var exports = this;
		var originalGlobalValue = exports.EventEmitter;
	
		/**
		 * Finds the index of the listener for the event in its storage array.
		 *
		 * @param {Function[]} listeners Array of listeners to search through.
		 * @param {Function} listener Method to look for.
		 * @return {Number} Index of the specified listener, -1 if not found
		 * @api private
		 */
		function indexOfListener(listeners, listener) {
			var i = listeners.length;
			while (i--) {
				if (listeners[i].listener === listener) {
					return i;
				}
			}
	
			return -1;
		}
	
		/**
		 * Alias a method while keeping the context correct, to allow for overwriting of target method.
		 *
		 * @param {String} name The name of the target method.
		 * @return {Function} The aliased method
		 * @api private
		 */
		function alias(name) {
			return function aliasClosure() {
				return this[name].apply(this, arguments);
			};
		}
	
		/**
		 * Returns the listener array for the specified event.
		 * Will initialise the event object and listener arrays if required.
		 * Will return an object if you use a regex search. The object contains keys for each matched event. So /ba[rz]/ might return an object containing bar and baz. But only if you have either defined them with defineEvent or added some listeners to them.
		 * Each property in the object response is an array of listener functions.
		 *
		 * @param {String|RegExp} evt Name of the event to return the listeners from.
		 * @return {Function[]|Object} All listener functions for the event.
		 */
		proto.getListeners = function getListeners(evt) {
			var events = this._getEvents();
			var response;
			var key;
	
			// Return a concatenated array of all matching events if
			// the selector is a regular expression.
			if (evt instanceof RegExp) {
				response = {};
				for (key in events) {
					if (events.hasOwnProperty(key) && evt.test(key)) {
						response[key] = events[key];
					}
				}
			}
			else {
				response = events[evt] || (events[evt] = []);
			}
	
			return response;
		};
	
		/**
		 * Takes a list of listener objects and flattens it into a list of listener functions.
		 *
		 * @param {Object[]} listeners Raw listener objects.
		 * @return {Function[]} Just the listener functions.
		 */
		proto.flattenListeners = function flattenListeners(listeners) {
			var flatListeners = [];
			var i;
	
			for (i = 0; i < listeners.length; i += 1) {
				flatListeners.push(listeners[i].listener);
			}
	
			return flatListeners;
		};
	
		/**
		 * Fetches the requested listeners via getListeners but will always return the results inside an object. This is mainly for internal use but others may find it useful.
		 *
		 * @param {String|RegExp} evt Name of the event to return the listeners from.
		 * @return {Object} All listener functions for an event in an object.
		 */
		proto.getListenersAsObject = function getListenersAsObject(evt) {
			var listeners = this.getListeners(evt);
			var response;
	
			if (listeners instanceof Array) {
				response = {};
				response[evt] = listeners;
			}
	
			return response || listeners;
		};
	
		/**
		 * Adds a listener function to the specified event.
		 * The listener will not be added if it is a duplicate.
		 * If the listener returns true then it will be removed after it is called.
		 * If you pass a regular expression as the event name then the listener will be added to all events that match it.
		 *
		 * @param {String|RegExp} evt Name of the event to attach the listener to.
		 * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
		 * @return {Object} Current instance of EventEmitter for chaining.
		 */
		proto.addListener = function addListener(evt, listener) {
			var listeners = this.getListenersAsObject(evt);
			var listenerIsWrapped = typeof listener === 'object';
			var key;
	
			for (key in listeners) {
				if (listeners.hasOwnProperty(key) && indexOfListener(listeners[key], listener) === -1) {
					listeners[key].push(listenerIsWrapped ? listener : {
						listener: listener,
						once: false
					});
				}
			}
	
			return this;
		};
	
		/**
		 * Alias of addListener
		 */
		proto.on = alias('addListener');
	
		/**
		 * Semi-alias of addListener. It will add a listener that will be
		 * automatically removed after its first execution.
		 *
		 * @param {String|RegExp} evt Name of the event to attach the listener to.
		 * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
		 * @return {Object} Current instance of EventEmitter for chaining.
		 */
		proto.addOnceListener = function addOnceListener(evt, listener) {
			return this.addListener(evt, {
				listener: listener,
				once: true
			});
		};
	
		/**
		 * Alias of addOnceListener.
		 */
		proto.once = alias('addOnceListener');
	
		/**
		 * Defines an event name. This is required if you want to use a regex to add a listener to multiple events at once. If you don't do this then how do you expect it to know what event to add to? Should it just add to every possible match for a regex? No. That is scary and bad.
		 * You need to tell it what event names should be matched by a regex.
		 *
		 * @param {String} evt Name of the event to create.
		 * @return {Object} Current instance of EventEmitter for chaining.
		 */
		proto.defineEvent = function defineEvent(evt) {
			this.getListeners(evt);
			return this;
		};
	
		/**
		 * Uses defineEvent to define multiple events.
		 *
		 * @param {String[]} evts An array of event names to define.
		 * @return {Object} Current instance of EventEmitter for chaining.
		 */
		proto.defineEvents = function defineEvents(evts) {
			for (var i = 0; i < evts.length; i += 1) {
				this.defineEvent(evts[i]);
			}
			return this;
		};
	
		/**
		 * Removes a listener function from the specified event.
		 * When passed a regular expression as the event name, it will remove the listener from all events that match it.
		 *
		 * @param {String|RegExp} evt Name of the event to remove the listener from.
		 * @param {Function} listener Method to remove from the event.
		 * @return {Object} Current instance of EventEmitter for chaining.
		 */
		proto.removeListener = function removeListener(evt, listener) {
			var listeners = this.getListenersAsObject(evt);
			var index;
			var key;
	
			for (key in listeners) {
				if (listeners.hasOwnProperty(key)) {
					index = indexOfListener(listeners[key], listener);
	
					if (index !== -1) {
						listeners[key].splice(index, 1);
					}
				}
			}
	
			return this;
		};
	
		/**
		 * Alias of removeListener
		 */
		proto.off = alias('removeListener');
	
		/**
		 * Adds listeners in bulk using the manipulateListeners method.
		 * If you pass an object as the second argument you can add to multiple events at once. The object should contain key value pairs of events and listeners or listener arrays. You can also pass it an event name and an array of listeners to be added.
		 * You can also pass it a regular expression to add the array of listeners to all events that match it.
		 * Yeah, this function does quite a bit. That's probably a bad thing.
		 *
		 * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add to multiple events at once.
		 * @param {Function[]} [listeners] An optional array of listener functions to add.
		 * @return {Object} Current instance of EventEmitter for chaining.
		 */
		proto.addListeners = function addListeners(evt, listeners) {
			// Pass through to manipulateListeners
			return this.manipulateListeners(false, evt, listeners);
		};
	
		/**
		 * Removes listeners in bulk using the manipulateListeners method.
		 * If you pass an object as the second argument you can remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
		 * You can also pass it an event name and an array of listeners to be removed.
		 * You can also pass it a regular expression to remove the listeners from all events that match it.
		 *
		 * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to remove from multiple events at once.
		 * @param {Function[]} [listeners] An optional array of listener functions to remove.
		 * @return {Object} Current instance of EventEmitter for chaining.
		 */
		proto.removeListeners = function removeListeners(evt, listeners) {
			// Pass through to manipulateListeners
			return this.manipulateListeners(true, evt, listeners);
		};
	
		/**
		 * Edits listeners in bulk. The addListeners and removeListeners methods both use this to do their job. You should really use those instead, this is a little lower level.
		 * The first argument will determine if the listeners are removed (true) or added (false).
		 * If you pass an object as the second argument you can add/remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
		 * You can also pass it an event name and an array of listeners to be added/removed.
		 * You can also pass it a regular expression to manipulate the listeners of all events that match it.
		 *
		 * @param {Boolean} remove True if you want to remove listeners, false if you want to add.
		 * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add/remove from multiple events at once.
		 * @param {Function[]} [listeners] An optional array of listener functions to add/remove.
		 * @return {Object} Current instance of EventEmitter for chaining.
		 */
		proto.manipulateListeners = function manipulateListeners(remove, evt, listeners) {
			var i;
			var value;
			var single = remove ? this.removeListener : this.addListener;
			var multiple = remove ? this.removeListeners : this.addListeners;
	
			// If evt is an object then pass each of its properties to this method
			if (typeof evt === 'object' && !(evt instanceof RegExp)) {
				for (i in evt) {
					if (evt.hasOwnProperty(i) && (value = evt[i])) {
						// Pass the single listener straight through to the singular method
						if (typeof value === 'function') {
							single.call(this, i, value);
						}
						else {
							// Otherwise pass back to the multiple function
							multiple.call(this, i, value);
						}
					}
				}
			}
			else {
				// So evt must be a string
				// And listeners must be an array of listeners
				// Loop over it and pass each one to the multiple method
				i = listeners.length;
				while (i--) {
					single.call(this, evt, listeners[i]);
				}
			}
	
			return this;
		};
	
		/**
		 * Removes all listeners from a specified event.
		 * If you do not specify an event then all listeners will be removed.
		 * That means every event will be emptied.
		 * You can also pass a regex to remove all events that match it.
		 *
		 * @param {String|RegExp} [evt] Optional name of the event to remove all listeners for. Will remove from every event if not passed.
		 * @return {Object} Current instance of EventEmitter for chaining.
		 */
		proto.removeEvent = function removeEvent(evt) {
			var type = typeof evt;
			var events = this._getEvents();
			var key;
	
			// Remove different things depending on the state of evt
			if (type === 'string') {
				// Remove all listeners for the specified event
				delete events[evt];
			}
			else if (evt instanceof RegExp) {
				// Remove all events matching the regex.
				for (key in events) {
					if (events.hasOwnProperty(key) && evt.test(key)) {
						delete events[key];
					}
				}
			}
			else {
				// Remove all listeners in all events
				delete this._events;
			}
	
			return this;
		};
	
		/**
		 * Alias of removeEvent.
		 *
		 * Added to mirror the node API.
		 */
		proto.removeAllListeners = alias('removeEvent');
	
		/**
		 * Emits an event of your choice.
		 * When emitted, every listener attached to that event will be executed.
		 * If you pass the optional argument array then those arguments will be passed to every listener upon execution.
		 * Because it uses `apply`, your array of arguments will be passed as if you wrote them out separately.
		 * So they will not arrive within the array on the other side, they will be separate.
		 * You can also pass a regular expression to emit to all events that match it.
		 *
		 * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
		 * @param {Array} [args] Optional array of arguments to be passed to each listener.
		 * @return {Object} Current instance of EventEmitter for chaining.
		 */
		proto.emitEvent = function emitEvent(evt, args) {
			var listenersMap = this.getListenersAsObject(evt);
			var listeners;
			var listener;
			var i;
			var key;
			var response;
	
			for (key in listenersMap) {
				if (listenersMap.hasOwnProperty(key)) {
					listeners = listenersMap[key].slice(0);
					i = listeners.length;
	
					while (i--) {
						// If the listener returns true then it shall be removed from the event
						// The function is executed either with a basic call or an apply if there is an args array
						listener = listeners[i];
	
						if (listener.once === true) {
							this.removeListener(evt, listener.listener);
						}
	
						response = listener.listener.apply(this, args || []);
	
						if (response === this._getOnceReturnValue()) {
							this.removeListener(evt, listener.listener);
						}
					}
				}
			}
	
			return this;
		};
	
		/**
		 * Alias of emitEvent
		 */
		proto.trigger = alias('emitEvent');
	
		/**
		 * Subtly different from emitEvent in that it will pass its arguments on to the listeners, as opposed to taking a single array of arguments to pass on.
		 * As with emitEvent, you can pass a regex in place of the event name to emit to all events that match it.
		 *
		 * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
		 * @param {...*} Optional additional arguments to be passed to each listener.
		 * @return {Object} Current instance of EventEmitter for chaining.
		 */
		proto.emit = function emit(evt) {
			var args = Array.prototype.slice.call(arguments, 1);
			return this.emitEvent(evt, args);
		};
	
		/**
		 * Sets the current value to check against when executing listeners. If a
		 * listeners return value matches the one set here then it will be removed
		 * after execution. This value defaults to true.
		 *
		 * @param {*} value The new value to check for when executing listeners.
		 * @return {Object} Current instance of EventEmitter for chaining.
		 */
		proto.setOnceReturnValue = function setOnceReturnValue(value) {
			this._onceReturnValue = value;
			return this;
		};
	
		/**
		 * Fetches the current value to check against when executing listeners. If
		 * the listeners return value matches this one then it should be removed
		 * automatically. It will return true by default.
		 *
		 * @return {*|Boolean} The current value to check for or the default, true.
		 * @api private
		 */
		proto._getOnceReturnValue = function _getOnceReturnValue() {
			if (this.hasOwnProperty('_onceReturnValue')) {
				return this._onceReturnValue;
			}
			else {
				return true;
			}
		};
	
		/**
		 * Fetches the events object and creates one if required.
		 *
		 * @return {Object} The events storage object.
		 * @api private
		 */
		proto._getEvents = function _getEvents() {
			return this._events || (this._events = {});
		};
	
		/**
		 * Reverts the global {@link EventEmitter} to its previous value and returns a reference to this version.
		 *
		 * @return {Function} Non conflicting EventEmitter class.
		 */
		EventEmitter.noConflict = function noConflict() {
			exports.EventEmitter = originalGlobalValue;
			return EventEmitter;
		};
	
		// Expose the class either via AMD, CommonJS or the global object
		if (typeof define === 'function' && define.amd) {
			define(function () {
				return EventEmitter;
			});
		}
		else if (typeof module === 'object' && module.exports){
			module.exports = EventEmitter;
		}
		else {
			exports.EventEmitter = EventEmitter;
		}
	}.call(this));
	
	},{}],4:[function(require,module,exports){
	(function(root, factory) {
		if (typeof exports === 'object') {
			module.exports = factory();
		} else {
			root.CreateControls = factory();
		}
	})(this, function() {
	
		'use strict';
	
		var CreateControls = {};
	
		var _cssClasses = {
			CONTROLS: 'm-p-g__controls',
			CONTROLS_CLOSE: 'm-p-g__controls-close',
			CONTROLS_ARROW: 'm-p-g__controls-arrow',
			CONTROLS_NEXT: 'm-p-g__controls-arrow--next',
			CONTROLS_PREV: 'm-p-g__controls-arrow--prev',
			CONTROLS_BTN: 'm-p-g__btn'
		};
	
		var controlsCloseSvg = '<svg fill="#FFFFFF" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/><path d="M0 0h24v24H0z" fill="none"/></svg>';
	
		var controlsPrevSvg = '<svg fill="#FFFFFF" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" fill="none"/><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>';
	
		var controlsNextSvg = '<svg fill="#FFFFFF" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>';
	
		function _createEl(el, className, attr) {
			var element = document.createElement(el);
			if (className && typeof className === 'object') {
				className.forEach(function(c) {
					element.classList.add(c);
				});
			} else {
				element.classList.add(className);
			}
			return element;
		}
	
		function init() {
			var controls = _createEl('div', _cssClasses.CONTROLS);
			var close = _createEl('button', _cssClasses.CONTROLS_CLOSE);
			var next = _createEl('button', [_cssClasses.CONTROLS_ARROW, _cssClasses.CONTROLS_NEXT]);
			var prev = _createEl('button', [_cssClasses.CONTROLS_ARROW, _cssClasses.CONTROLS_PREV]);
	
			var childrenControls = [close, next, prev];
	
			for (var i = 0; i < childrenControls.length; i++) {
				controls.appendChild(childrenControls[i]);
			}
	
			var closeBtn = _createEl('span', _cssClasses.CONTROLS_BTN);
			var nextBtn = _createEl('span', _cssClasses.CONTROLS_BTN);
			var prevBtn = _createEl('span', _cssClasses.CONTROLS_BTN);
	
			closeBtn.innerHTML = controlsCloseSvg;
			nextBtn.innerHTML = controlsNextSvg;
			prevBtn.innerHTML = controlsPrevSvg;
	
			close.appendChild(closeBtn);
			next.appendChild(nextBtn);
			prev.appendChild(prevBtn);
	
			return controls;
		}
	
		CreateControls.init = init;
	
		return CreateControls;
	
	});
	},{}],5:[function(require,module,exports){
	// Expose MaterialPhotoGallery to Global Scope
	var MaterialPhotoGallery = require('./material-photo-gallery');
	window.MaterialPhotoGallery = MaterialPhotoGallery;
	
	},{"./material-photo-gallery":6}],6:[function(require,module,exports){
	/**
	 *
	 * Material Photo Gallery v0.0.1
	 * A photo gallery inspired by Google Photos.
	 * http://ettrics.com
	 *
	 * Free to use under the MIT License.
	 *
	 */
	
	(function(root, factory) {
		if (typeof define === 'function' && define.amd) {
			define(factory);
		} else if (typeof exports === 'object') {
			module.exports = factory(
				require('imagesLoaded'),
				require('./vendor/google-image-layout'),
				require('./create-controls')
			);
		} else {
			root.Gallery = factory(
				window.imagesLoaded,
				window.GoogleImageLayout
			);
		}
	})(this, function(imagesLoaded, GoogleImageLayout, CreateControls) {
	
		'use strict';
	
		/**
		 * Class constructor for Gallery component.
		 *
		 * @constructor
		 * @param {HTMLElement} element - The gallery element.
		 */
	
		var Gallery = function(element) {
			this._element = element;
			this._layout();
		};
	
		/**
		 * Detect CSS transform support
		 */
	
		var transform = false,
			transformString = 'transform',
			domPrefixes = 'Webkit Moz ms'.split(' '),
			pfx = '',
			elem = document.createElement('div');
	
		if (elem.style.transform !== undefined) { transform = true; }
	
		if (transform === false) {
		  for (var i = 0; i < domPrefixes.length; i++) {
			if (elem.style[domPrefixes[i] + 'Transform'] !== undefined) {
			  pfx = domPrefixes[i];
			  transformString = pfx + 'Transform';
			  transform = true;
			  break;
			}
		  }
		}
	
		/**
		 * Detect transitionend event support
		 */
	
		var transitions = {
			'transition': 'transitionend',
			'WebkitTransition': 'webkitTransitionEnd',
			'MozTransition': 'transitionend',
			'OTransition': 'otransitionend'
		  },
		  transitionendString,
		  elem = document.createElement('div');
		 
	  for (var t in transitions) {
		if (typeof elem.style[t] !== 'undefined') {
		  transitionendString = transitions[t];
		  break;
		}
	  }
	
	  function debounce(func, wait, immediate) {
		  var timeout;
		  return function() {
			  var context = this, args = arguments;
			  var later = function() {
				  timeout = null;
				  if (!immediate) func.apply(context, args);
			  };
			  var callNow = immediate && !timeout;
			  clearTimeout(timeout);
			  timeout = setTimeout(later, wait);
			  if (callNow) func.apply(context, args);
		  };
	  }
	
		/**
		 * Css class names stored as strings.
		 *
		 * @private
		 */
	
		Gallery.prototype._cssClasses = {
			GALLERY: 'm-p-g',
			THUMBS_BOX: 'm-p-g__thumbs',
			THUMB_IMG: 'm-p-g__thumbs-img',
			FULL_BOX: 'm-p-g__fullscreen',
			FULL_IMG: 'm-p-g__fullscreen-img',
			CONTROLS: 'm-p-g__controls',
			CONTROLS_CLOSE: 'm-p-g__controls-close',
			CONTROLS_NEXT: 'm-p-g__controls-arrow--next',
			CONTROLS_PREV: 'm-p-g__controls-arrow--prev'
		};
	
		/**
		 * Init the Google Image Layout.
		 */
	
		Gallery.prototype._layout = function() {
			var gallery = this;
			gallery._thumbs = [];
			var imgLoad = imagesLoaded(document.querySelector('div[data-google-image-layout]'));
	
			imgLoad.on('progress', function(instance, image) {
			  image.img.setAttribute('data-width', image.img.offsetWidth);
			  image.img.setAttribute('data-height', image.img.offsetHeight);
	
			  gallery._thumbs.push(image.img);
			});
	
			imgLoad.on('done', function(instance) {
			  var g = new GoogleImageLayout().init({
				  after: function() {
					  gallery.init();
					  gallery._loadFullImgs();
				  }
			  });
			});
	
			imgLoad.on('fail', function(instance) {
				var galleryEl = gallery._element;
				var alertBox = document.createElement('div');
				alertBox.className = 'm-p-g__alertBox';
				var alertBoxTitle = document.createElement('h2');
				alertBoxTitle.innerHTML = 'Error';
				var alertBoxMessage = document.createElement('p');
				alertBox.appendChild(alertBoxTitle);
				alertBox.appendChild(alertBoxMessage);
				galleryEl.appendChild(alertBox);
	
				var brokenImages = [];
				instance.images.forEach(function(image) {
					if (!image.isLoaded) {
						brokenImages.push(image.img.currentSrc);
					}
				});
	
				alertBoxMessage.innerHTML = 'Failed to load:' + ' ' + brokenImages;
				
			});
	
			window.onresize = debounce(function() {
			  var g = new GoogleImageLayout().init({
				  after: function() {
					  setTimeout(function() {
						  gallery._handleResize();
					  }, 500);
				  }
			  });
			}, 25);
		};
	
		/**
		 * Init the Gallery component.
		 */
	
		Gallery.prototype.init = function() {
	
			var controls = CreateControls.init();
			this._element.appendChild(controls);
	
			// Root element.
			this._gallery = this._element;
	
			// Container element for thumbnails.
			this._thumbsBox = this._gallery.querySelector('.' + this._cssClasses.THUMBS_BOX);
	
			// Container of full size images.
			this._fullBox = this._gallery.querySelector('.' + this._cssClasses.FULL_BOX);
	
			// Container of controls.
			this._controls = this._gallery.querySelector('.' + this._cssClasses.CONTROLS);
	
			// Close control button.
			this._closeBtn = this._controls.querySelector('.' + this._cssClasses.CONTROLS_CLOSE);
	
			// Prev control button.
			this._prevBtn = this._controls.querySelector('.' + this._cssClasses.CONTROLS_PREV);
	
			// Next control button.
			this._nextBtn = this._controls.querySelector('.' + this._cssClasses.CONTROLS_NEXT);
	
			// Is true when the full size images have been loaded.
			this._fullImgsLoaded = false;
	
			// Is true when a full size image is being viewed.
			this._fullImgOpen = false;
	
			// Bind events to elements.
			this._bindEvents.call(this);
	
		};
	
		/**
		 * Add event listeners to elements.
		 *
		 * @private
		 */
	
		Gallery.prototype._bindEvents = function() {
	
			for (var i = 0, ii = this._thumbs.length; i < ii; i++) {
	
				// Add click event to each thumbnail.
				this._thumbs[i].addEventListener('click', this._handleThumbClick.bind(this));
	
				// Add hover event to each thumbnail.
				this._thumbs[i].addEventListener('mouseover', this._handleThumbHover.bind(this));
			}
	
			// Add click event to close button.
			this._closeBtn.addEventListener('click', this._handleClose.bind(this));
	
			// Add click event to next button.
			this._nextBtn.addEventListener('click', this._handleNext.bind(this));
	
			// Add click event to prev button.
			this._prevBtn.addEventListener('click', this._handlePrev.bind(this));
	
			window.addEventListener('scroll', this._handleScroll.bind(this));
		};
	
		Gallery.prototype._handleScroll = debounce(function() {
			if (this._fullImgsLoaded) this._resetFullImg.call(this);	
		}, 25);
	
		Gallery.prototype._handleResize = function() {
			if (this._fullImgsLoaded) this._resetFullImg.call(this);
		};
	
		/**
		 * Load the full size images from the 'data-full' attribute.
		 *
		 * @private
		 */
	
		Gallery.prototype._loadFullImgs = function() {
	
			var src, img;
	
			for (var i = 0, ii = this._thumbs.length; i < ii; i++) {
	
				// Source of full size image.
				src = this._thumbs[i].getAttribute('data-full');
	
				// Create empty Image object.
				img = new Image();
	
				// Give new Image full size image src value.
				img.src = src;
	
				// Give new Image appropriate class name.
				img.classList.add(this._cssClasses.FULL_IMG);
	
				// Append full size image to full size image container.
				this._fullBox.appendChild(img);
			}
	
			this._loadFullImgsDone.call(this);		
		};
	
		Gallery.prototype._loadFullImgsDone = function() {
	
			var imgLoad = imagesLoaded(this._fullBox);
			
			imgLoad.on('always', function(instance) {
	
				var imgArr = instance.images;
	
				imgArr.forEach(function(img) {
					if (!img.isLoaded) console.error(img.img.src + ' ' + 'failed to load.');
				});
				
				this._fullImgs = [];
				this._fullImgDimensions = [];
				this._fullImgsTransforms = [];
	
				for (var i = 0, ii = imgArr.length; i < ii; i++) {
					var rect = imgArr[i].img.getBoundingClientRect();
					this._fullImgs.push(imgArr[i].img);
					this._positionFullImgs.call(this, imgArr[i].img, i);
					this._fullImgDimensions.push(rect);
				}
				
				this._fullImgsLoaded = true;
			}.bind(this));
		};
	
		Gallery.prototype._positionFullImgs = function(img, i, applyTransform) {
			var transform = this._transformFullImg(img, this._thumbs[i]);
			this._fullImgsTransforms.push(transform);
			
			img.style.marginTop = -img.height / 2 + 'px';
			img.style.marginLeft = -img.width / 2 + 'px';
			if (applyTransform !== false) {
				img.style[transformString] = transform;
			}
		};
	
		/**
		 * Makes the thumbnail transform to the same size and position as the full
		 * size image.
		 *
		 * @private
		 */
	
		Gallery.prototype._transformFullImg = function(fullImg, thumb, fullImgSize) {
	
			var scaleX, scaleY, transX, transY;
	
			fullImg = fullImg.getBoundingClientRect();
			thumb = thumb.getBoundingClientRect();
	
			if (fullImgSize) {
				scaleX = (thumb.width / fullImgSize.width).toFixed(3);
				scaleY = (thumb.height / fullImgSize.height).toFixed(3);
				transX = thumb.left - fullImgSize.left + (fullImgSize.width / 2);
				transY = thumb.top - fullImgSize.top + (fullImgSize.height / 2);
			} else {
				scaleX = (thumb.width / fullImg.width).toFixed(3);
				scaleY = (thumb.height / fullImg.height).toFixed(3);
				transX = thumb.left - fullImg.left + (fullImg.width / 2);
				transY = thumb.top - fullImg.top + (fullImg.height / 2);
			}
	
			var transform = 'translate(' + transX + 'px,' + transY + 'px) scale(' + scaleX + ',' + scaleY + ')';
	
			return transform;
		};
	
		Gallery.prototype._resetFullImg = function() {
	
			this._fullImgsTransforms = [];
	
			for (var i = 0, ii = this._fullImgs.length; i < ii; i++) {
				
				var size = {
					width: this._fullImgDimensions[i].width,
					height: this._fullImgDimensions[i].height,
					left: this._fullImgDimensions[i].left,
					top: this._fullImgDimensions[i].top
				};
	
				if (i === this._thumbIndex && this._fullImgOpen) {
					this._fullImgs[i].removeAttribute('style');
					this._positionFullImgs.call(this, this._fullImgs[i], i, false);
				} else {
					this._fullImgs[i].removeAttribute('style');
					this._positionFullImgs.call(this, this._fullImgs[i], i);
				}
			}
		};
	
		/**
		 * Thumbnail hover event.
		 *
		 * @param {Event} event - The event.
		 * @private
		 */
	
		Gallery.prototype._handleThumbHover = function(event) {
			if (this._fullImgsLoaded && !this._fullImgOpen) {
				this._transformThumbSetup.call(this, event);
			}
		};
	
		/**
		 * Thumbnail click event.
		 *
		 * @param {Event} event - The event.
		 * @private
		 */
	
		Gallery.prototype._handleThumbClick = function(event) {
	
			if (this._thumb != event.target) {
				// Cache the thumb being hovered over.
				this._thumb = event.target;
	
				// Index of thumb.
				this._thumbIndex = this._thumbs.indexOf(this._thumb);
	
				// The full size image of that thumbnail.
				this._fullImg = this._fullImgs[this._thumbIndex];
			}
	
			if (this._setupComplete && this._fullImgsLoaded && !this._fullImgOpen) {
				this._activateFullImg.call(this);
				this._activateControls.call(this);
				this._activateFullBox.call(this);
				this._disableScroll();
			}
		};
	
		/**
		 * Caches the thumbnail and full size image that was just hovered over.
		 * Stores the css transform value so we can use it later.
		 *
		 * @param {Event} event - The event.
		 * @param {Function} fn - An optional callback function.
		 * @private
		 */
	
		Gallery.prototype._transformThumbSetup = function(event, fn) {
	
			this._setupComplete = false;
	
			// Cache the thumb being hovered over.
			this._thumb = event.target;
	
			// Index of thumb.
			this._thumbIndex = this._thumbs.indexOf(this._thumb);
	
			// The full size image of that thumbnail.
			this._fullImg = this._fullImgs[this._thumbIndex];
	
			this._setupComplete = true;
	
			if (fn) fn();	
	
		};
	
		Gallery.prototype._activateFullImg = function() {
			this._thumb.classList.add('hide');
			this._fullImg.classList.add('active');
			this._fullImg.style[transformString] = 'translate3d(0,0,0)';
			this._fullImgOpen = true;
	
			this._fullImgs.forEach(function(img) {
				if (!img.classList.contains('active')) {
					img.classList.add('almost-active');
				}
			});
		};
	
	
		/**
		 * Show the fullBox.
		 *
		 * @private
		 */
	
		Gallery.prototype._activateFullBox = function() {
			this._fullBox.classList.add('active');
		};
	
		/**
		 * Show the controls.
		 *
		 * @private
		 */
	
		Gallery.prototype._activateControls = function() {
			this._controls.classList.add('active');
		};
	
		/**
		 * CloseBtn click event.
		 *
		 * @private
		 */
	
		Gallery.prototype._handleClose = function() {
			if (this._fullImgOpen) {
				this._closeFullImg.call(this);
			}
		};
	
		Gallery.prototype._closeFullImg = function() {
	
			var animation = function() {
				this._fullBox.classList.remove('active');
				this._controls.classList.remove('active');
				this._fullImg.style[transformString] = this._fullImgsTransforms[this._thumbIndex];
				this._thumb.classList.remove('hide');
	
				this._fullImgs.forEach(function(img) {
					img.classList.remove('almost-active');
				});
	
				var fullImgTransEnd = function() {
					this._fullImg.classList.remove('active');
					this._fullImg.removeEventListener(transitionendString, fullImgTransEnd);
	
					this._fullImgOpen = false;
				}.bind(this);
	
				this._fullImg.addEventListener(transitionendString, fullImgTransEnd);
				this._enableScroll();
				
			}.bind(this);
	
			window.requestAnimationFrame(animation);
		};
	
		/**
		 * NextBtn click event.
		 *
		 * @private
		 */
	
		Gallery.prototype._handleNext = function() {
			if (this._fullImgOpen) {
				this._changeImg.call(this, 'next');
			}
		};
	
		/**
		 * PrevBtn click event.
		 *
		 * @private
		 */
	
		Gallery.prototype._handlePrev = function() {
			if (this._fullImgOpen) {
				this._changeImg.call(this, 'prev');
			}
		};
	
		/**
		 * Changes the active full size image and active thumbnail based on which
		 * arrow was click (prev || next).
		 *
		 * @param {String} dir - A string to determine if we're going Prev or Next.
		 * @private
		 */
	
		Gallery.prototype._changeImg = function(dir) {
	
			this._thumbIndex = this._fullImgs.indexOf(this._fullImg);
			dir === 'next' ? this._thumbIndex += 1 : this._thumbIndex -= 1;
	
			this._newFullImg = dir === 'next' ? this._fullImg.nextElementSibling : this._fullImg.previousElementSibling;
	
			if (!this._newFullImg || this._newFullImg.nodeName !== 'IMG') {
				this._newFullImg = dir === 'next' ? this._newFullImg = this._fullImgs[0] : this._newFullImg = this._fullImgs[this._fullImgs.length - 1];
				dir === 'next' ? this._thumbIndex = 0 : this._thumbIndex = this._fullImgs.length - 1;
			}
	
			this._newFullImg.style[transformString] = 'translate3d(0,0,0)';
			this._fullImg.classList.remove('active');
			this._fullImg.style[transformString] = this._fullImgsTransforms[this._thumbIndex-1];
	
			this._fullImg = this._newFullImg;
			this._fullImg.classList.add('active');
		};
	
		/**
		 * Disables scrolling. Activated when a full size image is open.
		 *
		 * @private
		 */
	
		Gallery.prototype._disableScroll = function() {
	
			function preventDefault(e) {
				e = e || window.event;
				if (e.preventDefault) e.preventDefault();
				e.returnValue = false;  
			}
	
			window.onwheel = preventDefault;
			window.ontouchmove  = preventDefault;
		};
	
		/**
		 * Enables scrolling. Activated when a full size image is closed.
		 *
		 * @private
		 */
	
		Gallery.prototype._enableScroll = function() {
			window.onwheel = null; 
			window.ontouchmove = null;
		};
	
		return Gallery;
	});
	
	
	},{"./create-controls":4,"./vendor/google-image-layout":7,"imagesLoaded":1}],7:[function(require,module,exports){
	/**
	 *
	 * Google Image Layout v0.0.1
	 * Description, by Anh Trinh.
	 * http://trinhtrunganh.com
	 *
	 * Free to use under the MIT License.
	 *
	 */
	
	(function (root, factory) {
		if (typeof define === 'function' && define.amd) {
			define(function() {
				return factory(root);
			});
		} else if (typeof exports === 'object') {
			module.exports = factory;
		} else {
			root.GoogleImageLayout = factory(root);
		}
	})(this, function (root) {
	
		'use strict';
	
		var GoogleImageLayout = {};
	
		var HEIGHTS = [], margin = 5;
	
		var turnObjToArray = function(obj) {
			return [].map.call(obj, function(element) {
				return element;
			})
		};
	
		var _debounceOrThrottle = function () {
			if(!useDebounce && !!poll) {
				return;
			}
			clearTimeout(poll);
			poll = setTimeout(function(){
				echo.render();
				poll = null;
			}, delay);
		};
	
		/**
		 * Get the height that make all images fit the container
		 *
		 * width = w1 + w2 + w3 + ... = r1*h + r2*h + r3*h + ...
		 * 
		 * @param  {[type]} images the images to be calculated
		 * @param  {[type]} width  the container witdth
		 * @param  {[type]} margin the margin between each image 
		 * 
		 * @return {[type]}        the height
		 */
		var _getHeigth = function(images, width, margin) {
	
			// width -= images.length * margin;
			// width -= images.length;
	
			var r = 0, img;
	
			for (var i = 0 ; i < images.length; i++) {
				img = images[i];
				r += parseInt(img.getAttribute('data-width')) / parseInt(img.getAttribute('data-height'));
			}
	
			return width / r; //have to round down because Firefox will automatically roundup value with number of decimals > 3
	
		};
	
		var _setHeight = function(images, height) {
	
			// console.log("set height");
	
			HEIGHTS.push(height);
	
			var img;
	
			for (var i = 0 ; i < images.length; i++) {
				img = images[i];
				img.style.width = height * parseInt(img.getAttribute('data-width')) / parseInt(img.getAttribute('data-height')) + 'px';
				img.style.height = height + 'px';
				img.classList.add('layout-completed');
			}
	
		};
	
		GoogleImageLayout.init = function (opts) {
			opts = opts || {};
			var nodes = document.querySelectorAll('div[data-google-image-layout]');
			var length = nodes.length;
			var elem;
	
			for (var i = 0 ; i < length; i++) {
				elem = nodes[i];
				GoogleImageLayout.align(elem);
			}
	
			if (opts.after) opts.after();
		};
	
		GoogleImageLayout.align = function(elem) {
	
			//get the data attribute
			
			var containerWidth = elem.clientWidth,
				maxHeight = parseInt(elem.getAttribute('data-max-height') || 120);
	
			var imgNodes = turnObjToArray(elem.querySelectorAll('img'));
	
			w : while (imgNodes.length > 0) {
	
				for (var i = 1 ; i <= imgNodes.length; i++) {
					var slice = imgNodes.slice(0, i);
					var h = _getHeigth(slice, containerWidth, margin);
	
					if (h < maxHeight) {
						_setHeight(slice, h);
						imgNodes = imgNodes.slice(i);
						continue w;
					}
				}
	
				_setHeight(slice, Math.min(maxHeight, h));
				break;
			}
	
		};
	
		return GoogleImageLayout;
	});
	},{}]},{},[5]);
	
	
	/////////////////////////////////////////////
	// Init MATERIAL PHOTO GALLERY
	/////////////////////////////////////////////
				var elem = document.querySelector('.m-p-g');
	
				document.addEventListener('DOMContentLoaded', function() {
					var gallery = new MaterialPhotoGallery(elem);
				});