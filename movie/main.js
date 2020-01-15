const caché = require('../data/caché');
const fUtil = require('../fileUtil');
const fs = require('fs');

module.exports = {
	async save(movieZip, thumbZip, mId, preId = mId) {
		const thumbFile = fUtil.getNextFile('thumb-', 'png');
		thumbZip && fs.writeFileSync(thumbFile, thumbZip);
		await caché.saveMovie(movieZip, preId, mId);
		return mId;
	},
	load(movieId) {
		return caché.loadMovie(movieId);
	},
	thumb(movieId) {
		return new Promise((res, rej) => {
			if (!movieId.toLowerCase().startsWith('m-')) return;
			const n = Number.parseInt(movieId.substr(2));
			const fn = fUtil.getFileIndex('thumb-', 'png', n);
			isNaN(n) ? rej() : res(fs.readFileSync(fn));
		});
	},
	list() {
		return fUtil.getValidFileIndicies('movie-', 'xml').map(v => `m-${v}`);
	},
	meta(movieId) {
		return new Promise((res, rej) => {
			if (!movieId.toLowerCase().startsWith('m-')) return;
			const n = Number.parseInt(movieId.substr(2));
			const fn = fUtil.getFileIndex('movie-', 'xml', n);

			const fd = fs.openSync(fn, 'r');
			const buffer = Buffer.alloc(127);
			fs.readSync(fd, buffer, 0, 127, 0);
			const begTitle = buffer.indexOf('<title>') + 16;
			const endTitle = buffer.indexOf(']]></title>');
			const title = buffer.slice(begTitle, endTitle).toString().trim();

			const begDuration = buffer.indexOf('duration="') + 10;
			const endDuration = buffer.indexOf('"', begDuration);
			const duration = Number.parseFloat(
				buffer.slice(begDuration, endDuration));
			const min = ('' + ~~(duration / 60)).padStart(2, '0');
			const sec = ('' + ~~(duration % 60)).padStart(2, '0');
			const durationStr = `${min}:${sec}`;

			fs.closeSync(fd);
			res({
				date: fs.statSync(fn).mtime,
				durationString: durationStr,
				duration: duration,
				title: title,
				id: movieId,
			});
		});
	},
}