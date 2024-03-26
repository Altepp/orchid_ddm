!(function (exports) {
  'use strict';

  if (!('OrchidJS' in window)) {
    exports.OrchidJS = {};
  }

  const Vividus2D = {
    children: [],
    worldBrightness: 1,

    /**
     * Checks if two boxes intersect.
     *
     * @param {Object} box1 First box to check. Must have 'x', 'y', 'width', and 'height' properties.
     * @param {Element} viewport The viewport element to check against.
     * @returns {boolean} True if the boxes intersect, false otherwise.
     */
    areaIntersects: function(box1, box2) {
      // Checks if the boxes intersect by comparing their corners
      return !(
        box1.x > box2.x + box2.width || // right of viewport
        box1.x + box1.width < box2.x || // left of viewport
        box1.y > box2.y + box2.height || // below viewport
        box1.y + box1.height < box2.y // above viewport
      );
    },

    /**
     * Sets the world brightness, which affects the color of all sprites
     * rendered by the canvas renderer. The brightness value ranges from 0 to
     * 1, where 0 is completely black and 1 is the original color.
     *
     * @param {number} brightness The new world brightness value.
     */
    setWorldBrightness: function (brightness) {
      /**
       * The current world brightness, which is used to modify the color of all
       * sprites rendered by the canvas renderer.
       * @type {number}
       */
      this.worldBrightness = brightness;
    }
  };

  class CanvasRenderer {
    /**
     * Constructs a new CanvasRenderer instance.
     *
     * @param {HTMLCanvasElement} canvas The canvas element to render to
     */
    constructor(canvas) {
      /**
       * The canvas element that this renderer renders to.
       * @type {HTMLCanvasElement}
       */
      this.canvas = canvas;

      /**
       * The 2D rendering context of the canvas.
       * @type {CanvasRenderingContext2D}
       */
      this.context = this.canvas?.getContext('2d', { alpha: false });

      /**
       * The current render instance that the canvas renderer is using.
       * @type {CanvasRenderer}
       */
      this.renderInstance = this;

      /**
       * The width of the canvas in pixels.
       * @type {number}
       */
      this.width = 0;

      /**
       * The height of the canvas in pixels.
       * @type {number}
       */
      this.height = 0;

      /**
       * The current X coordinate of the mouse in the canvas.
       * @type {number}
       */
      this.clientX = 0;

      /**
       * The current Y coordinate of the mouse in the canvas.
       * @type {number}
       */
      this.clientY = 0;

      this.init();
    }

    /**
     * Initializes the canvas renderer.
     *
     * This is called automatically when the CanvasRenderer is created. It sets
     * the canvas's width and height, scales the context by the device pixel
     * ratio, and adds a "pointermove" event listener to the document.
     */
    init() {
      if (!this.canvas) {
        return;
      }

      /**
       * The device pixel ratio, which determines how much the canvas renderer
       * should scale the canvas to match the display's resolution.
       * @type {number}
       */
      const devicePixelRatio = window.devicePixelRatio || 1;

      /**
       * The width of the canvas in pixels.
       * @type {number}
       */
      this.width = window.innerWidth;

      /**
       * The height of the canvas in pixels.
       * @type {number}
       */
      this.height = window.innerHeight;

      /**
       * The width of the canvas in physical pixels, taking into account the
       * device pixel ratio.
       * @type {number}
       */
      this.canvas.width = this.width * devicePixelRatio;

      /**
       * The height of the canvas in physical pixels, taking into account the
       * device pixel ratio.
       * @type {number}
       */
      this.canvas.height = this.height * devicePixelRatio;

      /**
       * The 2D rendering context of the canvas.
       * @type {CanvasRenderingContext2D}
       */
      this.context?.scale(devicePixelRatio, devicePixelRatio);

      /**
       * Initializes the canvas renderer.
       *
       * This is called automatically when the canvas renderer is created.
       */
      this.initialize();

      /**
       * The "pointermove" event listener bound to the renderer instance.
       * @type {EventListener}
       */
      const handlePointerMove = this.handlePointerMove.bind(this);

      /**
       * Adds a "pointermove" event listener to the document.
       */
      document.addEventListener('pointermove', handlePointerMove);
    }

    /**
     * Handles the pointer move event and stores the clientX and clientY
     * coordinates for use in rendering.
     * @param {MouseEvent} event The event being handled
     */
    handlePointerMove(event) {
      /**
       * The clientX coordinate of the mouse pointer
       * @type {number}
       */
      this.clientX = event.clientX;

      /**
       * The clientY coordinate of the mouse pointer
       * @type {number}
       */
      this.clientY = event.clientY;
    }

    /**
     * Sets the instance to use for rendering
     * @param {Object} instance The instance to use for rendering
     */
    setInstance(instance) {
      if (!this.renderInstance) {
        return;
      }
      this.renderInstance = instance;
      /**
       * Initialize the instance
       *
       * This is called by the renderer to initialize the instance for rendering
       */
      this.renderInstance.initialize();
    }

    /**
     * Draws a rectangle on the canvas
     * @param {string} fillStyle The fill style of the rectangle
     * @param {number} x The X coordinate of the rectangle
     * @param {number} y The Y coordinate of the rectangle
     * @param {number} width The width of the rectangle
     * @param {number} height The height of the rectangle
     */
    drawRect(fillStyle, x, y, width, height) {
      if (!this.context) {
        return;
      }

      this.context.fillStyle = fillStyle;
      this.context.fillRect(x, y, width, height);
    }

    /**
     * Draws an image on the canvas
     * @param {string} imageUrl The URL of the image to draw
     * @param {number} x The X coordinate of the image
     * @param {number} y The Y coordinate of the image
     * @param {number} width The width of the image
     * @param {number} height The height of the image
     */
    drawImageRect(imageUrl, x, y, width, height) {
      if (!this.context) {
        return;
      }
      const image = new Image();
      image.src = imageUrl;
      this.context.drawImage(image, x, y, width, height);
    }

    /**
     * Draws a string on the canvas
     * @param {string} text The text to draw
     * @param {string} fillStyle The fill style of the string
     * @param {string|number} fontStyle The font style of the string
     * @param {number} x The X coordinate of the string
     * @param {number} y The Y coordinate of the string
     * @param {number} width The width of the string
     */
    drawString(text, fillStyle, fontStyle, x, y, width) {
      if (!this.context) {
        return;
      }
      this.context.fillStyle = fillStyle;
      if (typeof fontStyle === 'string') {
        this.context.font = fontStyle;
      } else {
        this.context.font = `${fontStyle}px`;
      }
      // Set the textBaseline to 'top' to avoid issues with different browsers'
      // default behaviour (e.g. Firefox)
      this.context.textBaseline = 'top';
      this.context.fillText(text, x, y, width);
      // Reset the font to the default system font
      this.context.font = '16px system-ui';
    }

    /**
     * Draws a string with a shadow on the canvas
     * @param {string} text The text to draw
     * @param {string} fillStyle The fill style of the string
     * @param {string|number} fontStyle The font style of the string
     * @param {number} x The X coordinate of the string
     * @param {number} y The Y coordinate of the string
     * @param {number} width The width of the string
     */
    drawStringWithShadow(text, fillStyle, fontStyle, x, y, width) {
      if (!this.context) {
        return;
      }
      // Draw the string with a slight offset to create a shadow effect
      this.blend('drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.5))');
      // Draw the string with the original fill style
      this.drawString(text, fillStyle, fontStyle, x, y, width);
      // Reset the font to the default system font
      this.blend('none');
    }

    /**
     * Sets the blend mode of the canvas
     * @param {string} filter The CSS filter to apply to the canvas
     */
    blend(filter) {
      if (!this.context) {
        return;
      }
      this.context.filter = filter;
    }

    /**
     * Translates the canvas by the given X and Y coordinates
     * @param {number} x The X coordinate to translate by
     * @param {number} y The Y coordinate to translate by
     */
    translate(x, y) {
      if (!this.context) {
        return;
      }
      this.context.translate(x, y);
    }

    /**
     * Rotates the canvas by the given number of degrees
     * @param {number} deg The number of degrees to rotate the canvas by
     */
    rotate(deg) {
      if (!this.context) {
        return;
      }
      this.context.rotate(deg); // Rotates the canvas by the given number of degrees
    }

    /**
     * Sets the alpha value of the canvas
     * @param {number} alpha The alpha value to set, between 0.0 and 1.0
     */
    setAlpha(alpha) {
      if (!this.context) {
        return;
      }
      /**
       * The alpha value of the canvas.
       *
       * @type {number}
       * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalAlpha
       */
      this.context.globalAlpha = alpha;
    }

    /**
     * Initializes the renderer.
     *
     * This is called by the game loop and is responsible for setting up the
     * renderer, ready for the first render call.
     *
     * It is called once, when the renderer is first created.
     */
    initialize() {
      // Overridable function
      return;
    }

    /**
     * Draws the screen.
     *
     * This is called by the game loop and is responsible for drawing the
     * contents of the canvas.
     *
     * It is called repeatedly, at the game's refresh rate.
     */
    drawScreen() {
      // Overridable function, do your drawing here
      return;
    }

    /**
     * Renders the screen.
     *
     * This is called by the game loop and is responsible for rendering the
     * contents of the canvas.
     *
     * It is called repeatedly, at the game's refresh rate.
     */
    render() {
      if (!this.context || !this.renderInstance) {
          return;
        }

      // Clear the canvas with a black background
      this.context.translate(0, 0);
      const devicePixelRatio = window.devicePixelRatio || 1;
      this.context.globalAlpha = 1;
      this.context.clearRect(0, 0, this.width * devicePixelRatio, this.height * devicePixelRatio);

      if (/KAIOS|B2G/i.test(navigator.userAgent)) {
        // Draw a black rectangle to cover the screen
        this.drawRect('#101214', 0, 0, this.width, this.height);

        // Draw the "Unsupported platform" message
        this.drawString('Unsupported platform', '#ffffff', 20, 30, 30, this.width - 60);

        // Draw a message explaining that the user cannot run Vividus in this app
        this.drawString('Visit https://orchid.thats-the.name/support/platforms to learn more', '#858585', 14, 30, 50, this.width - 60);

        // Draw a message explaining that the user cannot run Vividus in this app
        this.drawString('You cannot run Vividus in any B2G OS for security and safety reasons', '#ffffff', 16, 30, 100, this.width - 60);
      } else {
        // Draw the game's contents
        this.renderInstance.drawScreen();
      }

      // Restore the default transformation matrix
      this.context?.transform(1, 0, 0, 1, 0, 0);
    }
  }

  Vividus2D.CanvasRenderer = CanvasRenderer;

  OrchidJS.Vividus2D = Vividus2D;
})(window);

