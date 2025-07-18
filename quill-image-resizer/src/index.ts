import Quill from 'quill';

import './style.css'; // Assuming your base CSS for overlay and handles is here

// Define interfaces for the new prop types
interface OverlayProps {
  className?: string; // Optional class name(s)
  style?: Partial<CSSStyleDeclaration>; // Optional inline styles
}

interface ResizerProps {
  className?: string; // Optional class name(s)
  style?: Partial<CSSStyleDeclaration>; // Optional inline styles
}

// Define an interface for the overall options
interface QuillImageResizerOptions {
  /**
   * Whether to maintain the image's aspect ratio during resizing.
   * @default true
   */
  keepAspectRatio?: boolean;
  /**
   * Properties to apply to the image resize overlay element.
   * Can include `className` (e.g., 'my-custom-overlay') and `style` (inline CSS).
   */
  overlayProps?: OverlayProps;
  /**
   * Properties to apply to the resize handle element.
   * Can include `className` (e.g., 'my-custom-resizer-handle') and `style` (inline CSS).
   */
  resizerProps?: ResizerProps;
}

/**
 * A Quill.js module for resizing and deleting images.
 * It adds an overlay, resize handles, and a delete button when an image is selected.
 */
export default class QuillImageResizer {
  private quill: Quill;
  private options: QuillImageResizerOptions;
  private overlay: HTMLDivElement | null = null;
  private selectedImage: HTMLImageElement | null = null;
  private resizerHandle: HTMLDivElement | null = null;
  private deleteButton: HTMLButtonElement | null = null;

  private isResizing: boolean = false; // Flag to indicate if an image is currently being resized

  /**
   * Initializes the QuillImageResizer module.
   * @param quill The Quill editor instance.
   * @param options Optional configuration for the resizer.
   */
  constructor(quill: Quill, options?: QuillImageResizerOptions) {
    this.quill = quill;
    // Set default options and merge with provided options
    this.options = {
      keepAspectRatio: true,
      ...options
    };

    this.addEventListeners();
  }

  /**
   * Adds all necessary event listeners to the Quill editor and document.
   */
  private addEventListeners() {
    this.quill.root.addEventListener('click', this.handleEditorClick);
    this.quill.root.addEventListener('scroll', this.updateOverlayPosition);
    this.quill.on('editor-blur', this.removeOverlay);
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
      this.removeOverlay();
    }
  };

  /**
   * Selects an image, creates and positions the resize overlay and controls.
   * @param img The HTMLImageElement to be selected.
   */
  private selectImage(img: HTMLImageElement) {
    if (this.selectedImage === img) {
      this.updateOverlayPosition();
      return;
    }

    this.removeOverlay();
    this.selectedImage = img;

    this.createOverlay();
    this.updateOverlayPosition();
    this.addResizeHandle();
    this.addDeleteButton();

    this.selectedImage.setAttribute('draggable', 'false'); // Prevent native image dragging
  }

  /**
   * Creates the main resize overlay div and applies custom props.
   */
  private createOverlay() {
    this.overlay = document.createElement('div');
    // Ensure base class is always present, then add any custom class names
    this.overlay.className = `qir_resize-overlay ${this.options.overlayProps?.className || ''}`.trim();

    // Apply custom inline styles
    if (this.options.overlayProps?.style) {
      Object.assign(this.overlay.style, this.options.overlayProps.style);
    }

    this.quill.root.parentElement!.appendChild(this.overlay);
  }

  /**
   * Adds the resize handle to the overlay and applies custom props.
   */
  private addResizeHandle() {
    if (!this.overlay) return;

    this.resizerHandle = document.createElement('div');
    // Ensure base class is always present, then add any custom class names
    this.resizerHandle.className = `qir_resize-handler ${this.options.resizerProps?.className || ''}`.trim();

    // Apply custom inline styles
    if (this.options.resizerProps?.style) {
      Object.assign(this.resizerHandle.style, this.options.resizerProps.style);
    }

    this.resizerHandle.addEventListener('mousedown', this.onMouseDownResize);

    this.overlay.appendChild(this.resizerHandle);
  }

  /**
   * Handles the mouse down event on the resize handle to start resizing.
   * Respects the `keepAspectRatio` option.
   * Editor boundary checks are removed as requested.
   * @param event The mouse event.
   */
  private onMouseDownResize = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!this.selectedImage) return;

    this.isResizing = true;

    const startX = event.clientX;
    const startY = event.clientY; // Keep for vertical resize when aspect ratio is off
    const startWidth = this.selectedImage.width;
    const startHeight = this.selectedImage.height;

    const initialDisplay = this.selectedImage.style.display;
    this.selectedImage.style.display = 'block';

    const aspectRatio = startHeight / startWidth;

    const MIN_DIMENSION = 10; // Minimum dimension for the image

    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY; // Vertical delta

      let newWidth: number;
      let newHeight: number;

      if (this.options.keepAspectRatio) {
        // Only consider horizontal drag for resizing and maintain aspect ratio
        newWidth = Math.max(MIN_DIMENSION, startWidth + deltaX);
        newHeight = newWidth * aspectRatio;

        // Apply minimum height if calculated height goes below MIN_DIMENSION
        if (newHeight < MIN_DIMENSION) {
            newHeight = MIN_DIMENSION;
            newWidth = MIN_DIMENSION / aspectRatio; // Adjust width to maintain aspect ratio with new minimum height
        }
      } else {
        // Allow independent resizing based on both horizontal and vertical drag
        newWidth = Math.max(MIN_DIMENSION, startWidth + deltaX);
        newHeight = Math.max(MIN_DIMENSION, startHeight + deltaY);
      }

      this.selectedImage!.width = newWidth;
      this.selectedImage!.height = newHeight;

      this.updateOverlayPosition();
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      this.selectedImage!.style.display = initialDisplay;
      this.updateImageBlotDimensions();

      this.isResizing = false;

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
    const containerRect = this.quill.root.getBoundingClientRect(); // Rect of the .ql-editor

    // Position the overlay relative to the Quill editor's root element (.ql-editor)
    // Account for scroll position of the editor's root to keep overlay fixed relative to image in editor view
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

    // Reset draggable attribute on the image if it was set
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

    const button = document.createElement('button');
    button.className = 'qir_delete-button';
    button.title = 'Delete image';
    button.innerHTML = '&times;'; // A simple 'x' for the button content

    button.addEventListener('click', this.deleteImage);

    this.overlay.appendChild(button);
    this.deleteButton = button; // Assign to property for cleanup
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
      // styles or formats, you might need to use quill.formatText.
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