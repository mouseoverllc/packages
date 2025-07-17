import Quill from 'quill';

import './style.css'; // Assuming your CSS for overlay and handles is here

/**
 * A Quill.js module for resizing and deleting images.
 * It adds an overlay, resize handles, and a delete button when an image is selected.
 */
export default class QuillImageResizer {
  private quill: Quill;
  private overlay: HTMLDivElement | null = null;
  private selectedImage: HTMLImageElement | null = null;
  private resizerHandle: HTMLDivElement | null = null;
  private deleteButton: HTMLButtonElement | null = null; // Store delete button reference for cleanup

  private isResizing: boolean = false; // Flag to indicate if an image is currently being resized

  /**
   * Initializes the QuillImageResizer module.
   * @param quill The Quill editor instance.
   */
  constructor(quill: Quill) {
    this.quill = quill;
    this.addEventListeners();
  }

  /**
   * Adds all necessary event listeners to the Quill editor and document.
   */
  private addEventListeners() {
    this.quill.root.addEventListener('click', this.handleEditorClick);
    this.quill.root.addEventListener('scroll', this.updateOverlayPosition);
    // Listen for editor blur to deselect image when focus leaves the editor
    this.quill.on('editor-blur', this.removeOverlay);

    // Use a dedicated handler for text-change to conditionally remove overlay
    this.quill.on('text-change', this.handleTextChange);
  }

  /**
   * Handles text-change events from Quill.
   * The overlay is only removed if resizing is not in progress.
   */
  private handleTextChange = () => {
    if (!this.isResizing) {
      this.removeOverlay();
    }
  };

  /**
   * Handles click events within the Quill editor to select or deselect images.
   * @param event The mouse event.
   */
  private handleEditorClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    if (target && target.tagName === 'IMG') {
      this.selectImage(target as HTMLImageElement);
    } else if (this.overlay && !this.overlay.contains(target)) {
      // If click is outside the image and overlay, remove the overlay
      this.removeOverlay();
    }
  };

  /**
   * Selects an image, creates and positions the resize overlay and controls.
   * @param img The HTMLImageElement to be selected.
   */
  private selectImage(img: HTMLImageElement) {
    // If the same image is clicked, just ensure overlay is positioned correctly
    if (this.selectedImage === img) {
      this.updateOverlayPosition();
      return;
    }

    this.removeOverlay(); // Remove any existing overlays before creating a new one
    this.selectedImage = img;

    this.createOverlay();
    this.updateOverlayPosition(); // Initial positioning
    this.addResizeHandle();
    this.addDeleteButton();

    // Set the selected image as non-draggable to prevent browser's default drag behavior
    this.selectedImage.setAttribute('draggable', 'false');
  }

  /**
   * Creates the main resize overlay div.
   */
  private createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'qir_resize-overlay';
    // Append to the Quill editor's container to ensure correct positioning relative to the editor
    this.quill.root.parentElement!.appendChild(this.overlay);
  }

  /**
   * Adds the resize handle to the overlay.
   */
  private addResizeHandle() {
    if (!this.overlay) return;

    this.resizerHandle = document.createElement('div');
    this.resizerHandle.className = 'qir_resize-handler';

    this.resizerHandle.addEventListener('mousedown', this.onMouseDownResize);

    this.overlay.appendChild(this.resizerHandle);
  }

  /**
   * Handles the mouse down event on the resize handle to start resizing.
   * @param event The mouse event.
   */
  private onMouseDownResize = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation(); // Prevent Quill from handling the click

    if (!this.selectedImage) return;

    this.isResizing = true; // Set flag: we are now resizing

    const startX = event.clientX;
    // const startY = event.clientY; // Not used for aspect ratio based resizing
    const startWidth = this.selectedImage.width;
    const startHeight = this.selectedImage.height;

    const initialDisplay = this.selectedImage.style.display;
    // this.selectedImage.style.display = 'block'; // Ensure image is block for accurate width/height setting

    // Calculate aspect ratio only once
    const aspectRatio = startHeight / startWidth;

    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation(); // Crucial: Stop propagation of mousemove to prevent text-change trigger

      const deltaX = e.clientX - startX;

      let newWidth = Math.max(10, startWidth + deltaX); // Minimum width of 10px
      let newHeight = newWidth * aspectRatio; // Maintain aspect ratio

      // Ensure minimum dimensions
      if (newWidth < 10) newWidth = 10;
      if (newHeight < 10) newHeight = 10;

      this.selectedImage!.width = newWidth;
      this.selectedImage!.height = newHeight;

      this.updateOverlayPosition();
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      this.selectedImage!.style.display = initialDisplay; // Restore original display style
      this.updateImageBlotDimensions(); // Update Quill's internal representation

      this.isResizing = false; // Reset flag: resizing has finished

      // After resize, if the image is still selected, ensure overlay is correctly positioned
      if (this.selectedImage) {
        this.updateOverlayPosition();
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  /**
   * Updates the position and dimensions of the resize overlay to match the selected image.
   * This is called on scroll, resize, and initial selection.
   */
  private updateOverlayPosition = () => {
    if (!this.selectedImage || !this.overlay) return;

    const rect = this.selectedImage.getBoundingClientRect();
    const containerRect = this.quill.root.getBoundingClientRect();

    // Position the overlay relative to the Quill editor's root element
    // Account for scroll position of the editor's root
    this.overlay.style.top = `${rect.top - containerRect.top}px`;
    this.overlay.style.left = `${rect.left - containerRect.left}px`;
    this.overlay.style.width = `${rect.width}px`;
    this.overlay.style.height = `${rect.height}px`;
  };

  /**
   * Removes the resize overlay, handle, and delete button from the DOM.
   */
  private removeOverlay = () => {
    if (this.overlay && this.overlay.parentElement) {
      // Remove event listener from resizer handle before removing element
      if (this.resizerHandle) {
        this.resizerHandle.removeEventListener('mousedown', this.onMouseDownResize);
      }
      // Remove event listener from delete button
      if (this.deleteButton) {
        this.deleteButton.removeEventListener('click', this.deleteImage);
      }
      this.overlay.parentElement.removeChild(this.overlay);
    }
    this.overlay = null;
    this.resizerHandle = null;
    this.deleteButton = null;

    // Reset draggable attribute
    if (this.selectedImage) {
      this.selectedImage.removeAttribute('draggable');
    }
    this.selectedImage = null; // Deselect the image
  };

  /**
   * Deletes the currently selected image from the Quill editor.
   */
  private deleteImage = (event?: MouseEvent) => {
    if (event) {
      event.stopPropagation(); // Prevent the click from propogating to the editor
    }

    if (this.selectedImage) {
      // Get the blot associated with the image and delete it
      const blot = this.quill.scroll.find(this.selectedImage);
      if (blot) {
        const index = this.quill.getIndex(blot);
        this.quill.deleteText(index, blot.length());
      }
    }
    this.removeOverlay(); // Clean up overlay after deletion
  };

  /**
   * Adds a delete button to the overlay.
   */
  private addDeleteButton() {
    if (!this.overlay) return;

    this.deleteButton = document.createElement('button');
    this.deleteButton.className = 'qir_delete-button';
    this.deleteButton.title = 'Delete image';
    this.deleteButton.innerHTML = '&times;'; // A simple 'x' for the button content

    this.deleteButton.addEventListener('click', this.deleteImage);

    this.overlay.appendChild(this.deleteButton);
  }

  /**
   * Updates the dimensions of the image within Quill's internal blot representation.
   * This ensures that Quill is aware of the new size, which can be important for
   * serializing content or for other modules that rely on blot dimensions.
   */
  private updateImageBlotDimensions() {
    if (!this.selectedImage) return;

    const blot = this.quill.scroll.find(this.selectedImage);
    if (blot && blot.domNode instanceof HTMLImageElement) {
      // Using setAttribute is generally reliable for standard img elements
      blot.domNode.setAttribute('width', `${this.selectedImage.width}`);
      blot.domNode.setAttribute('height', `${this.selectedImage.height}`);

      // If you're using a custom Quill blot for images that relies on
      // styles or formats, you might need to use quill.formatText
      // Example (assuming a custom 'image' blot that accepts width/height formats):
      // const index = this.quill.getIndex(blot);
      // this.quill.formatText(index, 1, {
      //   width: `${this.selectedImage.width}px`,
      //   height: `${this.selectedImage.height}px`
      // }, 'silent'); // 'silent' prevents triggering text-change again
    }
  }

  /**
   * Destroys the module, removing all event listeners and overlays.
   * This should be called when the Quill editor is destroyed or this module is no longer needed.
   */
  destroy() {
    this.removeOverlay(); // Ensure overlay is removed
    this.quill.root.removeEventListener('click', this.handleEditorClick);
    this.quill.root.removeEventListener('scroll', this.updateOverlayPosition);
    this.quill.off('editor-blur', this.removeOverlay);
    this.quill.off('text-change', this.handleTextChange); // Remove the specific handler
  }
}