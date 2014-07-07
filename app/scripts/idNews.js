'use strict';
/*global moment, sdata, pagination */

function IdNews(sel, id, cnf) {
    // merge config with default values
    this.cnf = $.extend({
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
	toggleDuration: 200
    }, cnf || {});
    
    // find container and disaply loading text
    this.$c = $(sel).addClass(this.cnf.prefix + 'news');
    this.$c.append('<div class="' + this.cnf.prefix + 'title">' + this.cnf.loadText + '</div>');

    this.$c.width(this.cnf.width).height(this.cnf.height);
    //this.onLoad(sdata);
    this.load(id);
}

$.extend(IdNews.prototype, {
    load: function(id) {
	$.ajax({
	    url: 'http://pipes.yahoo.com/pipes/pipe.run',
	    crossDomain: true,
	    dataType: 'jsonp',
	    jsonp: '_callback',
	    data: {_render: 'json', _id: id},
	    context: this,
	    success: function(data, sus, x) {
		if (sus === 'success') {
		    this.onLoad(data);
		} else {
		    console.log(sus, x);
		}
	    }
	});
    },
    onLoad: function(data) {
	this.$c.empty().append(this.cnf.template);

	// parse template and add prefix to class names
	this.$title = this.$c.find('.title').attr('class', this.cnf.prefix + 'title');
	this.$p = this.$c.find('.pag').attr('class', this.cnf.prefix + 'pag');
	this.$ul = this.$c.find('ul');
	this.$li = this.$c.find('li').detach();

	// extract needed data from the feed and fix dates and descriptions
	this.parse(data);
	this.$title.text(this.cnf.title || this.data.title);
	this.$title.click($.proxy(this.showPage, this)).click();
    },
    showPage: function(n) {
	if (typeof n !== 'number') n = 0;
	this.$ul.empty();
	var i, $c, d,
	    from = n * this.cnf.limit,
	    until = from + this.cnf.limit;

	for (i = from; i < until; i++) {
	    d = this.data.items[i];
	    if (!d) break;
	    $c = this.$li.clone();
	    this.renderItem($c, d);
	    this.$ul.append($c);
	    // add fade in
	    $c.css({
		opacity: 0
	    }).delay(this.cnf.fadeDelay * (i%this.cnf.limit)).animate({
		opacity: 1
	    }, this.cnf.fadeDuration);
	}
	this.setPagination(n + 1);
    },
    setPagination: function(page) {
	this.$p.empty();
	var t = this,
	    p = pagination({
		page: page,
		links: 5,
		rows: this.cnf.limit,
		total: this.data.items.length
	    }),
	    i, $b;

	for (i = 0; i < p.length; i++) {
	    $b = $('<span class="' + this.cnf.prefix + 'pb">');
	    if (p[i].active || p[i].page) $b.append(p[i].index);
	    else if (p[i].next) $b.append('>');
	    else if (p[i].last) $b.append('>>');
	    else if (p[i].prev) $b.append('<');
	    else if (p[i].first) $b.append('<<');
	    $b.data('index', p[i].index - 1);

	    if (!p[i].active) {
		$b.click(function() {
		    t.showPage($(this).data('index'));
		});
	    } else {
		$b.css('font-weight', 'bold');
	    }
	    this.$p.append($b);
	}
    },
    renderItem: function($c, d) {
	var $head = $c.find('.head').attr('class', this.cnf.prefix + 'head'),
	    $con = $c.find('.content').attr('class', this.cnf.prefix + 'content'),
	    t = this, b;

	$head.html(d.title)
	     .click(function() {
		b = false;
		if (t.toggled) {
		    t.toggled.toggle(t.cnf.toggleDuration);
		    if (t.toggled === $con) t.toggled = undefined;
		    else t.toggled = $con.toggle(t.cnf.toggleDuration);
		} else {
		    t.toggled = $con.toggle(t.cnf.toggleDuration);
		}
	     });
	$con.append('<span class="' + this.cnf.prefix + 'date">' + d.moment.fromNow() + '</span><br>', d.description);
	if (d.img) {
	    $con.prepend(this.getImg(d.img));
	}
	$con.hide();
    },
    // returns container with img tag
    // we need to check orientation and dimensions
    // resize it according to that and the image parameters
    // and mask it
    getImg: function(o) {
	var $i = $('<img>'),
	    $c = $('<div class="' + this.cnf.prefix + 'img">'),
	    w = this.cnf.imgDim[0],
	    h = this.cnf.imgDim[1],
	    ratio = o.w / o.h,
	    mp = (ratio <= 1)? w/o.w : h/o.h;
	$i.attr({
	    src: o.url,
	    width: o.w * mp || w,
	    height: o.h * mp || h,
	    align: 'left'
	});
	$c.width(w).height(h);
	return $c.append($i);
    },
    // parse dates from RSS feeds to normalize data
    parse: function(d) {
	this.data = {
	    title: d.value.title,
	    items: []
	};
	var i = d.value.items.length,
	    v, m, item, media;
	while (i--) {
	    v = d.value.items[i];
	    // try RFC 882 format first...
	    m = moment(v.pubDate, 'ddd, DD MMM YYYY HH:mm:ss ZZ');
	    // ... or unix format
	    if (!m.isValid()) m = moment(v.pubDate);
	    // if pubDate in RSS feed is valid, add item
	    if (m.isValid()) {
		item = {
		    moment: m,
		    ms: +m,
		    title: v.title,
		    link: v.link,
		    description: this.prepare(v.description, v.link)
		};
		media = v['media:thumbnail'] || v['media:content'];
		if (media) {
		    item.img = {
			url: media.url,
			w: parseInt(media.width, 10),
			h: parseInt(media.height, 10)
		    };
		}
		this.data.items.push(item);
	    }
	}
	// sort items on date
	this.data.items.sort(function(a, b) {
	    return b.ms - a.ms;
	});
    },
    // RSS description is often messy and too long, so clean...
    prepare: function(s, link) {
	if (s) {
	    s = s.replace(/(<([^>]+)>)/ig, '');
	    var c = (this.cnf.maxDesc <= s.length)? ' ' : '.';
	    s = s.substring(0, s.lastIndexOf(c, this.cnf.maxDesc));
	    if (s.length) s += '...';
	}
        s += '<a href="' + link + '" target="_blank">read more</a>';
	return s;
    }
});
