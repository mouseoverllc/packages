# Quill Image Resizer Module

A Quill.js module designed to provide intuitive image resizing and deletion directly within the editor. When an image is selected, it displays an interactive overlay with a resize handle and a delete button, enhancing the user experience for image management.

## Getting Started

Follow these steps to install and integrate the Quill Image Resizer module into your Quill editor.

### Installation

First, install the package via npm or yarn:

```bash
npm install @mouseoverllc/quill-image-resizer
# or
yarn add @mouseoverllc/quill-image-resizer
```

### Usage

```js
import Quill from 'quill';

import QuillImageResizer from '@mouseoverllc/quill-image-resizer';
import '@mouseoverllc/quill-image-resizer/dist/style.css';

Quill.register('modules/imageResizer', QuillImageResizer);

const quill = new Quill('#editor', {
  theme: 'snow',
  modules: {
    toolbar: [
      ['image']
    ],
    imageResizer: {
      keepAspectRatio: true
    }
  }
});
```

### Options

| Option            | Type                                | Default | Description     |
| :---------------- | :---------------------------------- | :------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `keepAspectRatio` | `boolean`                           | `true`  | If `true`, the image's original aspect ratio will be maintained during resizing. If `false`, the width and height can be resized independently.                               |
| `overlayProps`    | `{ className?: string; style?: Partial<CSSStyleDeclaration>; }` | `{}`    | Properties for the main resize overlay. `className` for CSS classes, `style` for inline CSS.                                                                              |
| `resizerProps`    | `{ className?: string; style?: Partial<CSSStyleDeclaration>; }` | `{}`    | Properties for the resize handle. `className` for CSS classes, `style` for inline CSS.                                                                                    |
