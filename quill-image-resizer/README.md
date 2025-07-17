# quill-image-resizer

A lightweight Quill.js plugin to resize images interactively.

## Usage

```js
import QuillImageResizer from 'quill-image-resizer';
Quill.register('modules/imageResizer', QuillImageResizer);
const quill = new Quill('#editor', {
  theme: 'snow',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['image']
    ],
    imageResizer: {}
  }
});