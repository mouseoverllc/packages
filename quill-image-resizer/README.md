# quill-image-resizer

A lightweight Quill.js plugin to resize images interactively.

## Usage

```js
import QuillImageResizer from 'quill-image-resizer';

const quill = new Quill('#editor', { theme: 'snow' });
new QuillImageResizer(quill);