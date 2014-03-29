var wp = require("webpage");
var fs = require("fs");
var wd = fs.workingDirectory;

var page = wp.create();

page.open("https://developers.google.com/maps/documentation/javascript/reference", function() {

	// The page has jQuery loaded already.
	var content = page.evaluate(function() {

		var title = $("title");
		var heading = $("h1[itemprop=name]");
		var content = $("div[itemprop=articleBody]"); // This contains all interesting content.
		$("#maps-topnav").remove(); // This unwanted node is present in the content.
		$("link:not([href$='screen-docs.css'])").remove(); // We only need this stylesheet, so remove everything else.

		var index = $("<div />").append(heading).attr("id", "index"); // Content for the index.
		var reference = $("<div />").attr("id", "reference"); // Content for the reference itself.
		var toc = [];

		var headings = 0;
		content.children().each(function () {
			if (this.tagName === "H2") {
				headings += 1;
			}

			switch (headings) {
				case 1:
					// First h2 starts the introduction.
					index.append(this);
					break;
				case 2:
					// Second h2 marks the start of the toc.
					if (this.tagName === "P") {
						var $p = $(this);
						// A p tag identifies a section.
						var section = {
							title: $p.text(),
							// The p is followed by a ul that contains the links we're interested in.
							items: $p.next().find("a").get().map(function (a) {
								var hash = a.href.split("#")[1];
								// Pick up the target of the link. The first part is the name, the second part the type.
								var def = $("#" + hash).text().trim().split("\n");

								var type;
								if (def[1] === "object specification") {
									type = /Event$/.test(def[0]) ? "Event" : "Object";
								} else {
									type = def[1][0].toUpperCase() + def[1].substr(1);
								}

								return {
									name: def[0],
									type: type,
									path: "api.html#" + hash
								};
							})
						};
						toc.push(section);
					}

					break;
				default:
					// Third h2 marks the start of the reference.
					reference.append(this);
					break;
			}

		});

		// Concatenate all stylesheets and place them in an inline style.
		var style = $("<style />").attr("type", "text/css");
		var css = $.makeArray(document.styleSheets).reduce(function (css, styleSheet) {
			if (styleSheet.href) {
				return css + $.makeArray(styleSheet.cssRules).reduce(function (css, cssRule) {
					return css + cssRule.cssText + "\n";
				}, "");
			} else {
				return css;
			}
		}, "");
		style.html(css + "body {margin: 20px !important;}");

		$(document.head).empty().append(title).append(style);
		$(document.body).empty().append(index);

		var indexHtml = document.doctype + document.documentElement.outerHTML;

		$(document.body).empty().append(reference);

		var referenceHtml = document.doctype + document.documentElement.outerHTML;

		return {
			toc: toc,
			index: indexHtml,
			reference: referenceHtml
		};
	});

	fs.write(wd + "/index.html", content.index, "w");
	fs.write(wd + "/api.html", content.reference, "w");

	console.info(JSON.stringify(content.toc));

	phantom.exit();

});