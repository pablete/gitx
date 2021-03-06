var commit;
var Commit = function(obj) {
	this.object = obj;

	this.refs = obj.refs();
	this.author_name = obj.author;
	this.sha = obj.realSha();
	this.parents = obj.parents;
	this.subject = obj.subject;

	// TODO:
	// this.author_date instant

	// This all needs to be async
	this.loadedRaw = function(details) {
		this.raw = details;

		var diffStart = this.raw.indexOf("\ndiff ");
		var messageStart = this.raw.indexOf("\n\n") + 2;

		if (diffStart > 0) {
			this.message = this.raw.substring(messageStart, diffStart).replace(/^    /gm, "").escapeHTML();
			this.diff = this.raw.substring(diffStart);
		} else {
			this.message = this.raw.substring(messageStart).replace(/^    /gm, "").escapeHTML();
			this.diff = "";
		}
		this.header = this.raw.substring(0, messageStart);

		var match = this.header.match(/\nauthor (.*) <(.*@.*|.*)> ([0-9].*)/);
		if (!(match[2].match(/@[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/)))
			this.author_email = match[2];

		this.author_date = new Date(parseInt(match[3]) * 1000);

		match = this.header.match(/\ncommitter (.*) <(.*@.*|.*)> ([0-9].*)/);
		this.committer_name = match[1];
		this.committer_email = match[2];
		this.committer_date = new Date(parseInt(match[3]) * 1000);		
	}

	this.reloadRefs = function() {
		this.refs = this.object.refs();
	}

};


var confirm_gist = function(confirmation_message) {
	if (!Controller.isFeatureEnabled_("confirmGist")) {
		gistie();
		return;
	}

	// Set optional confirmation_message
	confirmation_message = confirmation_message || "Yes. Paste this commit.";
	var deleteMessage = Controller.getConfig_("github.token") ? " " : "You might not be able to delete it after posting.<br>";
	var publicMessage = Controller.isFeatureEnabled_("publicGist") ? "<b>public</b>" : "private";
	// Insert the verification links into div#notification_message
	var notification_text = 'This will create a ' + publicMessage + ' paste of your commit to <a href="http://gist.github.com/">http://gist.github.com/</a><br>' +
	deleteMessage +
	'Are you sure you want to continue?<br/><br/>' +
	'<a href="#" onClick="hideNotification();return false;" style="color: red;">No. Cancel.</a> | ' +
	'<a href="#" onClick="gistie();return false;" style="color: green;">' + confirmation_message + '</a>';

	notify(notification_text, 0);
	// Hide img#spinner, since it?s visible by default
	$("spinner").style.display = "none";
}

var gistie = function() {
	notify("Uploading code to Gistie..", 0);

	parameters = {
		"file_ext[gistfile1]":      "patch",
		"file_name[gistfile1]":     commit.object.subject.replace(/[^a-zA-Z0-9]/g, "-") + ".patch",
		"file_contents[gistfile1]": commit.object.patch(),
	};

	// TODO: Replace true with private preference
	token = Controller.getConfig_("github.token");
	login = Controller.getConfig_("github.user");
	if (token && login) {
		parameters.login = login;
		parameters.token = token;
	}
	if (!Controller.isFeatureEnabled_("publicGist"))
		parameters.private = true;

	var params = [];
	for (var name in parameters)
		params.push(encodeURIComponent(name) + "=" + encodeURIComponent(parameters[name]));
	params = params.join("&");

	var t = new XMLHttpRequest();
	t.onreadystatechange = function() {
		if (t.readyState == 4 && t.status >= 200 && t.status < 300) {
			if (m = t.responseText.match(/gist: ([a-f0-9]+)/))
				notify("Code uploaded to gistie <a target='_new' href='http://gist.github.com/" + m[1] + "'>#" + m[1] + "</a>", 1);
			else {
				notify("Pasting to Gistie failed :(.", -1);
				Controller.log_(t.responseText);
			}
		}
	}

	t.open('POST', "http://gist.github.com/gists");
	t.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
	t.setRequestHeader('Accept', 'text/javascript, text/html, application/xml, text/xml, */*');
	t.setRequestHeader('Content-type', 'application/x-www-form-urlencoded;charset=UTF-8');

	try {
		t.send(params);
	} catch(e) {
		notify("Pasting to Gistie failed: " + e, -1);
	}
}

var reviewboard_it = function(confirmation_message) {
  var notification_text;
  if (Controller.isFeatureEnabled_("reviewBoard")) {
    rb_url      = Controller.getConfigPreference_("reviewBoardUrl");
    rb_username = Controller.getConfigPreference_("reviewBoardUsername");
    rb_password = Controller.getConfigPreference_("reviewBoardPassword");
    rb_cookie = reviewboard_cookie(rb_url, rb_username, rb_password);
    Controller.log_("------");
    Controller.log_(rb_cookie);
    if (rb_cookie == null) {
      notification_text = '<span style="background: red;color:white;">Sorry, there is a problem authenticating to ReviewBoard. Go to Preferences and check your credentials.</span>';
    }
    else {
      notification_text = 'This will create a reviewboard diff of your commit<br>' +
      'Are you sure you want to continue?<br/><br/>' +
      '<form id="reviewboard">' +
      '<select name="repository_id">'+reviewboard_repos(rb_url, rb_cookie)+'</select> ' +
      '</form>' +
      '<a href="#" onClick="reviewboard_post();return false;" style="color: green;">Post to ReviewBoard.</a> | ' +
      '<a href="#" onClick="hideNotification();return false;" style="color: red;">Cancel.</a>';
    }
  }
  else {
    notification_text = '<span style="background: red;color:white;">Sorry, ReviewBoard is not enabled. Go to Preferences and enable it.</span>'
  }
   notify(notification_text, 0);
  // Hide img#spinner, since it?s visible by default
  $("spinner").style.display = "none";
}

var reviewboard_post = function(rb_repository_id) {
  var rb_repository_id =  $('reviewboard').elements[0].value;
	notify("Uploading code to ReviewBoard..", 0);
  var rb_review_request_id = reviewboard_requestnew(rb_url, rb_cookie, rb_repository_id);
  var rb_payload = commit.object.patch();
  var rb_boundary = hex_md5(rb_review_request_id);
  var rb_content = encode_multipart_formdata(rb_boundary, rb_payload);
	var upload = new XMLHttpRequest();
  upload.onreadystatechange = function() {
    if (upload.readyState == 4 && upload.status >= 200 && upload.status < 300) {
      notify("Diff uploaded to ReviewBoard <a target='_new' href='"+rb_url+'/r/'+rb_review_request_id+"'>#"+rb_review_request_id+"</a>", 1);
    }
    else {
      notify("Pasting to ReviewBoard failed :(.", -1);
      Controller.log_(upload.responseText);
    }
  }
	upload.open('POST', rb_url+'/api/json/reviewrequests/'+rb_review_request_id+'/diff/new/',false);
  upload.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  upload.setRequestHeader('Content-type', content_type(rb_boundary));
  upload.setRequestHeader('Content-Length', rb_content.length);
  upload.setRequestHeader('Cookie', rb_cookie);
	try {
		upload.send(rb_content);
	} catch(e) {
		notify("Pasting to ReviewBoard failed: " + e, -1);
	}
}

var setGravatar = function(email, image) {
	if (Controller && !Controller.isReachable_("www.gravatar.com"))
		return;

	if(Controller && !Controller.isFeatureEnabled_("gravatar")) {
		image.src = "";
		return;
	}

	if (!email) {
		image.src = "http://www.gravatar.com/avatar/?d=wavatar&s=60";
		return;
	}

	image.src = "http://www.gravatar.com/avatar/" +
		hex_md5(commit.author_email.toLowerCase().replace(/ /g, "")) + "?d=wavatar&s=60";
}

var selectCommit = function(a) {
	Controller.selectCommit_(a);
}

var reload = function() {
	$("notification").style.display = "none";
	commit.reloadRefs();
	showRefs();
}

var showRefs = function() {
	var refs = $("refs");
	if (commit.refs) {
		refs.parentNode.style.display = "";
		refs.innerHTML = "";
		for (var i = 0; i < commit.refs.length; i++) {
			var ref = commit.refs[i];
			refs.innerHTML += '<span class="refs ' + ref.type() + (commit.currentRef == ref.ref ? ' currentBranch' : '') + '">' + ref.shortName() + '</span>';
		}
	} else
		refs.parentNode.style.display = "none";
}

var loadCommit = function(commitObject, currentRef) {
	// These are only the things we can do instantly.
	// Other information will be loaded later by loadExtendedCommit
	commit = new Commit(commitObject);
	Controller.callSelector_onObject_callBack_("details", commitObject,
		function(data) { commit.loadedRaw(data); loadExtendedCommit(commit); });
	commit.currentRef = currentRef;

	notify("Loading commit…", 0);

	$("commitID").innerHTML = commit.sha;
	$("authorID").innerHTML = commit.author_name;
	$("subjectID").innerHTML = commit.subject.escapeHTML();
	$("diff").innerHTML = ""
	$("message").innerHTML = ""
	$("files").innerHTML = ""
	$("date").innerHTML = ""
	showRefs();

	for (var i = 0; i < $("commit_header").rows.length; ++i) {
		var row = $("commit_header").rows[i];
		if (row.innerHTML.match(/Parent:/)) {
			row.parentNode.removeChild(row);
			--i;
		}
	}

	// Scroll to top
	scroll(0, 0);

	if (!commit.parents)
		return;

	for (var i = 0; i < commit.parents.length; i++) {
		var newRow = $("commit_header").insertRow(-1);
		newRow.innerHTML = "<td class='property_name'>Parent:</td><td>" +
			"<a href='' onclick='selectCommit(this.innerHTML); return false;'>" +
			commit.parents[i] + "</a></td>";
	}
}

var showDiff = function() {
	var newfile = function(name1, name2, id, mode_change, old_mode, new_mode) {
		var button = document.createElement("div");
		var p = document.createElement("p");
		var link = document.createElement("a");
		link.setAttribute("href", "#" + id);
		p.appendChild(link);
		var buttonType = "";
		var finalFile = "";
		if (name1 == name2) {
			buttonType = "changed"
			finalFile = name1;
			if (mode_change)
				p.appendChild(document.createTextNode(" mode " + old_mode + " -> " + new_mode));
		}
		else if (name1 == "/dev/null") {
			buttonType = "created";
			finalFile = name2;
		}
		else if (name2 == "/dev/null") {
			buttonType = "deleted";
			finalFile = name1;
		}
		else {
			buttonType = "renamed";
			finalFile = name2;
			p.insertBefore(document.createTextNode(name1 + " -> "), link);
		}

		link.appendChild(document.createTextNode(finalFile));
		button.setAttribute("representedFile", finalFile);
		link.setAttribute("representedFile", finalFile);

		button.setAttribute("class", "button " + buttonType);
		button.appendChild(document.createTextNode(buttonType));
		$("files").appendChild(button);
		$("files").appendChild(p);
	}

	var binaryDiff = function(filename) {
		if (filename.match(/\.(png|jpg|icns|psd)$/i))
			return '<a href="#" onclick="return showImage(this, \'' + filename + '\')">Display image</a>';
		else
			return "Binary file differs";
	}
	
	highlightDiff(commit.diff, $("diff"), { "newfile" : newfile, "binaryFile" : binaryDiff });
}

var showImage = function(element, filename)
{
	element.outerHTML = '<img src="GitX://' + commit.sha + '/' + filename + '">';
	return false;
}

var enableFeature = function(feature, element)
{
	if(!Controller || Controller.isFeatureEnabled_(feature)) {
		element.style.display = "";
	} else {
		element.style.display = "none";
	}
}

var enableFeatures = function()
{
	enableFeature("gist", $("gist"))
	if(commit)
		setGravatar(commit.author_email, $("gravatar"));
	enableFeature("gravatar", $("gravatar"))
}

var loadExtendedCommit = function(commit)
{
	var formatEmail = function(name, email) {
		return email ? name + " &lt;<a href='mailto:" + email + "'>" + email + "</a>&gt;" : name;
	}

	$("authorID").innerHTML = formatEmail(commit.author_name, commit.author_email);

	if (commit.committer_name != commit.author_name) {
		$("committerID").parentNode.style.display = "";
		$("committerID").innerHTML = formatEmail(commit.committer_name, commit.committer_email);

		$("committerDate").parentNode.style.display = "";
		$("committerDate").innerHTML = commit.committer_date;
	} else {
		$("committerID").parentNode.style.display = "none";
		$("committerDate").parentNode.style.display = "none";
	}

	$("date").innerHTML = commit.author_date;
	$("message").innerHTML = commit.message.replace(/\n/g,"<br>");

	if (commit.diff.length < 200000)
		showDiff();
	else
		$("diff").innerHTML = "<a class='showdiff' href='' onclick='showDiff(); return false;'>This is a large commit. Click here or press 'v' to view.</a>";

	hideNotification();
	enableFeatures();
}
