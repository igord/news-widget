news-widget
=========

Yahoo Pipes news widget

Demo: http://igord.github.io/news-widget/

Usage
---
```js
new IdNews(selector:String, id:String, config:Object);
```
- selector - string containing CSS selectors of the containing div
- id - id of the Yahoo Pipe
- config - configuration object

###Configuration Defaults
```js
// title of the widget, optional
title: '',
// number of news to display per page
limit: 10,
// maximum number of characters in item description
maxDesc: 200,
// dimensions of thumbnail image
imgDim: [80, 50],
// class prefix
prefix: 'id-',
// text to display while feed is loading
loadText: 'Loading News...',
// widget template, li tag is cloned for every item
template: '<div>' +
	        '<span class="title"></span>' +
	        '<span class="pag"></span>' +
              '</div>' +
              '<ul>' +
	            '<li>' +
	                '<div class="head"></div>' +
	                '<div class="content"></div>' +
	            '</li>' +
              '</ul>',
// item animation, delay
fadeDelay: 40,
// item animation, duration
fadeDuration: 300,
// toggle duration
toggleDuration: 200
```
CSS
---
The following classes are used, prefixed with configurable string(default is 'id-')
```
id-news // main
id-title // widget title
id-pag // pagination
id-pb // pagination button
id-head // item title
id-content // item content
id-img // item thumbnail
```

License
----

MIT
