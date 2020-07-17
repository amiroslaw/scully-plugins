const { JSDOM } = require('jsdom');
const { get } = require('axios');
var sizeOf = require('image-size');
const { scullyConfig } = require('@scullyio/scully');
const path = require('path');

const lazyImagesPlugin = async (html, route) => {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  try {
    await makeImageLazyload(doc, route);
    doc.body.append(loadLazyload(doc));
    doc.body.append(createLazyImageScript(doc));
  } catch (err) {
    console.log(err);
  }

  return dom.serialize();
};

const makeImageLazyload = async (doc, route) => {
  var imgEl = doc.getElementsByTagName('img');

  // can be added when loading="lazy" is supported in more browsers
  //   for (var i = 0; i < imgEl.length; i++) {
  //     imgEl[i].setAttribute('loading', 'lazy');
  //   }
  for (var i = 0; i < imgEl.length; i++) {
    const src = imgEl[i].getAttribute('src');
    console.log('make image lazyload', src, route);
    let dimensions;
    if (src) {
      if (src.startsWith('http')) {
        const image = await get(src, {
          responseType: 'arraybuffer',
        });
        dimensions = sizeOf(image.data);
        imgEl[i].setAttribute('height', dimensions.height);
        imgEl[i].setAttribute('width', dimensions.width);
      } else {
        dimensions = sizeOf(path.join(scullyConfig.outDir, src));
        imgEl[i].setAttribute('height', dimensions.height);
        imgEl[i].setAttribute('width', dimensions.width);
      }
      imgEl[i].setAttribute('data-src', src);
      imgEl[i].setAttribute(
        'src',
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${dimensions.width} ${dimensions.height}'%3E%3C/svg%3E`
      );
      imgEl[i].classList.add('lazyload');
    }
  }
};

const loadLazyload = (doc) => {
  const lazyload = doc.createElement('script');
  lazyload.src = 'https://cdn.jsdelivr.net/npm/lazyload@2.0.0-rc.2/lazyload.js';
  return lazyload;
};

const createLazyImageScript = (doc) => {
  const script = doc.createElement('script');
  script.innerHTML = `
    window.addEventListener('AngularReady', lazyloadScript); // also gets triggered after navigation content load
    function lazyloadScript(){
      lazyload();
    }
    `;
  return script;
};

module.exports = {
  lazyImagesPlugin,
};
