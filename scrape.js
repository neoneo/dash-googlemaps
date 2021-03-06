var wp = require("webpage");
var fs = require("fs");
var wd = fs.workingDirectory;

var page = wp.create();

page.open("https://developers.google.com/maps/documentation/javascript/reference", function () {

	// The page has jQuery loaded already.
	var content = page.evaluate(function() {

		var heading = $("h1[itemprop=name]");
		var content = $("div[itemprop=articleBody]"); // This contains all interesting content.
		$("#maps-topnav").remove(); // This unwanted node is present in the content.
		$("link:not([href$='screen-docs.css'])").remove(); // We only need this stylesheet, so remove everything else.

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
					reference.append(this);
					break;
				case 2:
					// Second h2 marks the start of the toc.
					if (this.tagName === "P") {
						// A p tag identifies a section.
						var $p = $(this);
						var title = $p.text();
						// Create a Dash style anchor for the section. It will be inserted in the first item in this section.
						var sectionAnchor = $("<a />").attr("name", "//dash_ref/DashTOCSection/" + $p.text() + "/1").addClass("dashAnchor");
						var sectionInserted = false;

						var section = {
							title: title,
							// The p is followed by a ul that contains the links we're interested in.
							items: $p.next().find("a").get().map(function (a) {
								// Pick up the target of the link.
								// jQuery doesn't find elements if the id contains a dot.
								var $target = $(document.getElementById(a.href.split("#")[1]));
								// The first part of the text content is the name, the second part the type.
								var def = $target.text().trim().split("\n");

								// To keep overview, only take the last part of the name.
								var type, name = def[0].split(".").pop();
								if (def[1] === "object specification") {
									type = /Event$/.test(def[0]) ? "Event" : "Object";
								} else if (def[1] === "typedef") {
									type = "Type";
								} else {
									type = def[1][0].toUpperCase() + def[1].substr(1);
								}

								// Insert a Dash anchor for the entry.
								var hash = "//dash_ref/" + type + "/" + name + "/0";
								var anchor = $("<a />").attr("name", hash).addClass("dashAnchor");
								$target.prepend(anchor);

								if (!sectionInserted) {
									$target.prepend(sectionAnchor);
									sectionInserted = true;
								}

								return {
									name: name,
									type: type,
									path: "index.html#" + hash
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

		// Concatenate all stylesheets.
		var css = $.makeArray(document.styleSheets).reduce(function (css, styleSheet) {
			if (styleSheet.href) {
				return css + $.makeArray(styleSheet.cssRules).reduce(function (css, cssRule) {
					return css + cssRule.cssText + "\n";
				}, "");
			} else {
				return css;
			}
		}, "body {margin: 20px !important;}");

		var link = $("<link />").attr("rel", "stylesheet").attr("type", "text/css").attr("href", "style.css");
		var meta = $("meta[charset]");
		$(document.head).empty().append(meta).append($("<title />").text("Google Maps")).append(link);
		$(document.body).empty().append(reference);
		// Fix any relative link that doesn't target an anchor.
		$("a[href^='/']").each(function () {
			this.href = this.href;
		});

		return {
			toc: toc,
			reference: "<!DOCTYPE html>" + document.documentElement.outerHTML,
			css: css
		};
	});

	var dir = wd + "/Google_Maps.docset/Contents/Resources/Documents";
	fs.makeTree(dir);
	fs.write(dir + "/index.html", content.reference, "w");
	fs.write(dir + "/style.css", content.css, "w");

	// Return the toc to node.
	console.info(JSON.stringify(content.toc));

	phantom.exit();

});