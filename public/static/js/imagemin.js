import imagemin from "imagemin";
import imageminMozjpeg from 'imagemin-mozjpeg';

const PNGImages = 'static/images/*.png';
const JPEGImages = 'public/static/images/*.jpg';
const output = 'public/static/images/build';


const optimiseJPEGImages = () =>
  imagemin([JPEGImages], output, {
    plugins: [
      imageminMozjpeg({
        quality: 70,
      }),
    ]
  });
optimiseJPEGImages()
  .catch(error => console.log(error));

// const imageminPngquant = require('imagemin-pngquant');
// const optimisePNGImages = () =>
//   imagemin([PNGImages], output, {
//     plugins: [
//       imageminPngquant({ quality: '65-80' })
//     ],
//   });
// optimiseJPEGImages()
//   .then(() => optimisePNGImages())
//   .catch(error => console.log(error));