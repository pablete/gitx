/*
 *  reviewboard.js
 *  GitX
 *
 *  Created by Pablo Delgado on 9/15/09.
 *  Copyright 2009 __MyCompanyName__. All rights reserved.
 *
 */

var reviewboard_cookie = function(url, username, password){
  var login = new XMLHttpRequest();
  //Login to ReviewBoard
  login.open('POST', url+'/api/json/accounts/login/',false);
	login.send('username='+username+'&password='+password);
  var cookie = login.getResponseHeader("Set-Cookie");
  return cookie;
}

var reviewboard_repos = function(url, cookie){
  //Get the repositories
  var repos = new XMLHttpRequest();
  repos.open('GET', url+'/api/json/repositories/',false)
  repos.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  repos.setRequestHeader('Accept', 'text/javascript, text/html, application/xml, text/xml, */*');
  repos.setRequestHeader('Content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
  repos.setRequestHeader('Cookie', cookie);
  try {
    repos.send(null);
  } catch(e) {
    notify("Pasting to ReviewBoard failed: " + e, -1);
  }

  json_repositories = eval('(' + repos.responseText + ')');
  var all_repos = json_repositories["repositories"].length;
  var html='';
  while(all_repos--) {
    var repo = json_repositories["repositories"][all_repos];
    html += '<option value="'+repo["id"]+'">'+repo["name"]+'</option>\n';
  }
  return html;
}

var reviewboard_requestnew = function(url, cookie, repository_id) {
  var requestnew = new XMLHttpRequest();
  //Login to ReviewBoard
  requestnew.open('POST', url+'/api/json/reviewrequests/new/',false);
  requestnew.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  requestnew.setRequestHeader('Accept', 'text/javascript, text/html, application/xml, text/xml, */*');
  requestnew.setRequestHeader('Content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
  requestnew.setRequestHeader('Cookie', cookie);
  try {
    requestnew.send('repository_id='+repository_id);
  } catch(e) {
    notify("Pasting to ReviewBoard failed: " + e, -1);
  }
  newreview = eval('(' + requestnew.responseText + ')');
  return newreview["review_request"]["id"]
}

var encode_multipart_formdata = function(boundary, payload) {
  var content = "";
  content += "--" + boundary + "\r\n"
  content += "Content-Disposition: form-data; name=\"path\"; ";
  content += "filename=\"diff\"\r\n";
  content += "\r\n";
  content += payload + "\r\n";
  content += "--" + boundary + "--\r\n";
  content += "\r\n";
  return content;
}

var content_type = function(boundary) {
  return "multipart/form-data; boundary="+boundary;
}

var rb_url;
var rb_username;
var rb_password;
var rb_cookie;