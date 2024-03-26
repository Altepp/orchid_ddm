!(function (exports) {
  'use strict';

  if (!('OrchidJS' in window)) {
    exports.OrchidJS = {};
  }

  if ('Scrollbar' in window) {
    Scrollbar.use(OverscrollPlugin);
  }

  const PageController = {
    panels: null,

    previousPanelId: '',
    currentPanelId: '',
    isKeyDown: false,

    UNDRAGGABLE_ELEMENTS: ['A', 'BUTTON', 'INPUT', 'IMG', 'UL', 'LI', 'WEBVIEW'],

    /**
     * Initialize the page controller.
     *
     * This function initializes the page controller by
     * - setting up the panels and their index
     * - binding the scroll events
     * - setting up the keydown and keyup event listeners
     * - setting up the page button event listeners
     */
    init: function () {
      this.panels = document.querySelectorAll('[role="panel"]');

      // Bind scroll events to the panels
      this.bindScrollEvents();

      // Add keydown and keyup event listeners
      document.addEventListener('keydown', this.handleKeyDown.bind(this));
      document.addEventListener('keyup', this.handleKeyUp.bind(this));

      // Set up page button event listeners
      const pageButtons = document.querySelectorAll('[data-page-id]');
      pageButtons.forEach((button) => {
        button.addEventListener('click', () => this.handlePageButtonClick(button));
        button.addEventListener('keyup', (event) => {
          if (event.key === 'Enter') {
            this.handlePageButtonClick(button);
          }
        });
      });

      const panels = document.querySelectorAll('[role="panel"]');
      panels.forEach((panel, index) => {
        panel.dataset.index = index;
        panel.classList.add('next');
      });

      const url = window.location.search;
      // Parse the URL to extract query parameters
      const urlParams = new URLSearchParams(url);
      // Get the value of the "panel" parameter
      const panelValue = urlParams.get('panel');

      const selectedButtons = document.querySelectorAll('.selected');
      const selectableButtons = document.querySelectorAll('[data-page-id]');
      const selectedPanel = document.querySelector('[role="panel"].visible');

      if (panelValue && selectedPanel.id !== panelValue) {
        window.addEventListener('load', () =>
          this.togglePanelVisibility(selectedPanel.id, panelValue));

        if (selectedButtons) {
          selectedButtons.forEach((selectedButton) => {
            selectedButton.classList.remove('selected');
          });
        }

        if (selectableButtons) {
          selectableButtons.forEach((selectableButton) => {
            if (panelValue !== selectableButton.dataset.pageId) {
              return;
            }
            selectableButton.classList.add('selected');
          });
        }
      }
    },

    /**
     * Refresh the page controller.
     *
     * This function refreshes the page controller by
     * - setting up the page button event listeners
     *   for click and Enter keyup.
     */
    refresh: function () {
      const pageButtons = document.querySelectorAll('[data-page-id]');
      pageButtons.forEach((button) => {
        button.addEventListener('click', () => this.handlePageButtonClick(button));
        button.addEventListener('keyup', (event) => {
          if (event.key === 'Enter') {
            this.handlePageButtonClick(button);
          }
        });
      });
    },

    /**
     * Binds scroll events to panels
     */
    bindScrollEvents: function () {
      this.panels.forEach((panel) => {
        // Query elements for each panel
        const header = panel.querySelector(':scope > header:first-child');
        const backButton = panel.querySelector(':scope > header:first-child .back-button');
        const content = panel.querySelector(':scope > section');

        // Ignore panel if it doesn't have a content section
        if (!content) {
          return;
        }

        // Set back button width on localized event
        document.addEventListener('localized', () => {
          setTimeout(() => {
            if (backButton) {
              header.style.setProperty('--back-button-width', backButton.scrollWidth + 15 + 'px');
            }
          }, 1000);
        });

        // Set transition delays on children
        const children = content.querySelectorAll(':scope > *');
        children.forEach((child, index) => {
          child.style.transitionDelay = 300 + index * 30 + 'ms';
        });

        // Initialize Scrollbar if available
        if ('Scrollbar' in window) {
          const scrollbar = Scrollbar.init(content, {
            plugins: {
              overscroll: {
                /**
                 * Custom overscroll effect
                 * @param {Object} params - Scrollbar params
                 */
                onScroll: (params) => {
                  // Ignore if there's no overscroll
                  if (params.y >= 0) {
                    return;
                  }

                  const scrollPosition = params.y * -1;
                  let progress = scrollPosition / 300;
                  if (progress >= 1) {
                    progress = 1;
                  }

                  if (backButton) {
                    header.style.setProperty('--back-button-width', backButton.scrollWidth + 15 + 'px');
                  }

                  this.setOverscrollProgress(panel, progress);
                }
              }
            }
          });

          // Scrollbar listener
          scrollbar.addListener(() => {
            const scrollPosition = scrollbar.offset.y;
            let progress = scrollPosition / 40;
            if (progress >= 1) {
              progress = 1;
            }

            if (backButton) {
              header.style.setProperty('--back-button-width', backButton.scrollWidth + 15 + 'px');
            }

            this.setProgress(panel, progress);
            this.setOverscrollProgress(panel, 0);
          });
        }

        // Scroll event listener
        content.addEventListener('scroll', () => {
          const scrollPosition = content.scrollTop;
          let progress = scrollPosition / 80;
          if (progress >= 1) {
            progress = 1;
          }

          if (backButton) {
            header.style.setProperty('--back-button-width', backButton.scrollWidth + 15 + 'px');
          }
          this.setProgress(panel, progress);
        });

        // Mouse wheel event listener
        ['wheel', 'pointerdown', 'pointermove', 'pointerup'].forEach((eventType) => {
          content.addEventListener(eventType, () => {
            if (backButton) {
              header.style.setProperty('--back-button-width', backButton.scrollWidth + 15 + 'px');
            }
          });
        });
      });
    },

    // Set progress value on the header bar
    setProgress: function (panel, progress) {
      panel.style.setProperty('--panel-progress', progress);
      panel.style.setProperty('--panel-progress-expo', this.cubicBezier(progress, 0, 0, 0, 1));
    },

    setOverscrollProgress: function (panel, progress) {
      panel.style.setProperty('--panel-progress-overscroll', progress);
    },

    cubicBezier: function (t, p0, p1, p2, p3) {
      const u = 1 - t;
      const tt = t * t;
      const uu = u * u;
      const uuu = uu * u;
      const ttt = tt * t;

      const p = uuu * p0 + 3 * uu * t * p1 + 3 * u * tt * p2 + ttt * p3;

      return p;
    },

    handleKeyDown: function (event) {
      if (this.isKeyDown) {
        return;
      }

      if (event.key === 'Escape') {
        const selectedButton = document.querySelector('.selected');
        if (selectedButton) {
          selectedButton.classList.remove('selected');
        }

        if (this.previousPanelId && this.currentPanelId) {
          this.togglePanelVisibility(this.currentPanelId, this.previousPanelId);
          this.isKeyDown = true;
        }
      }
    },

    handleKeyUp: function (event) {
      this.isKeyDown = false;
    },

    handlePageButtonClick: function (button) {
      if ('SpatialNavigation' in window) {
        SpatialNavigation.makeFocusable();
      }

      const id = button.dataset.pageId;
      const selectedButtons = document.querySelectorAll('.selected');
      const selectableButtons = document.querySelectorAll('[data-page-id]');
      const selectedPanel = document.querySelector('[role="panel"].visible');

      if (selectedButtons) {
        selectedButtons.forEach((selectedButton) => {
          selectedButton.classList.remove('selected');
        });
      }

      if (selectableButtons) {
        selectableButtons.forEach((selectableButton) => {
          if (id !== selectableButton.dataset.pageId) {
            return;
          }
          selectableButton.classList.add('selected');
        });
      }

      this.togglePanelVisibility(selectedPanel.id, id);
    },

    togglePanelVisibility: function (selectedPanelId, targetPanelId) {
      if (selectedPanelId !== targetPanelId) {
        this.previousPanelId = selectedPanelId || 'root';
        this.currentPanelId = targetPanelId;
      } else {
        return;
      }

      const url = new URL(location);
      url.searchParams.set('panel', targetPanelId);
      history.pushState({}, '', url);

      const selectedPanel = document.getElementById(selectedPanelId);
      const selectedPanels = document.querySelectorAll('[role="panel"].visible');
      const targetPanel = document.getElementById(targetPanelId);
      if (!selectedPanel) {
        return;
      }

      if (targetPanel.dataset.previousPageId) {
        this.previousPanelId = targetPanel.dataset.previousPageId;
      }

      selectedPanels.forEach((panel) => {
        panel.classList.remove('visible');
      });
      selectedPanel.classList.toggle('previous', selectedPanel.dataset.index <= targetPanel.dataset.index);
      selectedPanel.classList.toggle('next', selectedPanel.dataset.index >= targetPanel.dataset.index);

      targetPanel.classList.toggle('visible');
      targetPanel.classList.toggle('previous', selectedPanel.dataset.index <= targetPanel.dataset.index);
      targetPanel.classList.toggle('next', selectedPanel.dataset.index >= targetPanel.dataset.index);

      const selectedPageCode = selectedPanel.dataset.pageObject;
      if (selectedPageCode) {
        const selectedPageBootstrap = selectedPageCode.split('.')[0];
        const selectedPageObject = selectedPageCode.split('.')[1];

        if (selectedPageObject in window) {
          try {
            if (selectedPageObject) {
              window[selectedPageBootstrap][selectedPageObject].hide();
            } else {
              window[selectedPageBootstrap].hide();
            }
          } catch (error) {
            // console.error(error);
          }
        }
      }

      const targetPageCode = targetPanel.dataset.pageObject;
      if (targetPageCode) {
        const targetPageBootstrap = targetPageCode.split('.')[0];
        const targetPageObject = targetPageCode.split('.')[1];

        if (targetPageBootstrap in window) {
          if (targetPageObject) {
            if (window[targetPageBootstrap][targetPageObject] && !window[targetPageBootstrap][targetPageObject].isLoaded) {
              window[targetPageBootstrap][targetPageObject].init();
              window[targetPageBootstrap][targetPageObject].isLoaded = true;
            }
          } else {
            if (window[targetPageBootstrap] && !window[targetPageBootstrap].isLoaded) {
              window[targetPageBootstrap].init();
              window[targetPageBootstrap].isLoaded = true;
            }
          }

          try {
            if (targetPageObject) {
              window[targetPageBootstrap][targetPageObject].show();
            } else {
              window[targetPageBootstrap].show();
            }
          } catch (error) {
            // console.error(error);
          }
        }
      }
    }
  };

  OrchidJS.PageController = PageController;
})(window);
