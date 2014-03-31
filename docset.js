var fs = require("fs");
var exec = require("child_process").exec;
var sqlite3 = require("sqlite3");

exec("phantomjs " + __dirname + "/scrape.js", function (error, stdout, stderr) {

	fs.writeFileSync(process.cwd() + "/GoogleMaps.docset/Contents/Info.plist", fs.readFileSync(__dirname + "/Info.plist"));
	fs.writeFileSync(process.cwd() + "/GoogleMaps.docset/icon.png", fs.readFileSync(__dirname + "/Icon.png"));

	var toc = JSON.parse(stdout);
	var db = new sqlite3.Database(process.cwd() + "/GoogleMaps.docset/Contents/Resources/docSet.dsidx", function (error) {


		db.serialize(function () {
			db.exec("CREATE TABLE searchIndex(id INTEGER PRIMARY KEY, name TEXT, type TEXT, path TEXT);");
			db.exec("CREATE UNIQUE INDEX anchor ON searchIndex (name, type, path);");

			toc.forEach(function (section) {
				section.items.forEach(function (entry) {
					db.exec("INSERT OR IGNORE INTO searchIndex(name, type, path) VALUES ('" + entry.name + "', '" + entry.type + "', '" + entry.path + "');");
				});
			});

			db.close();
		})
	});

});