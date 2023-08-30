import imagemin from 'imagemin';
import imageminJpegtran from 'imagemin-jpegtran';
import imageminPngquant from 'imagemin-pngquant';


const files = await imagemin(['images/*.{jpg,png}'], {
	destination: 'build/images',
	plugins: [
		imageminJpegtran(),
		imageminPngquant({
			quality: [0.6, 0.8]
		})
	]
});

console.log(files);

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