function Urls() {
	this.GetMeta = "/api/msg/get?meta";
	this.Post = "/api/msg/post";
}

Urls.prototype.GetChunk = function(cid) {
	return "/api/msg/get?chunk="+cid.toString();
}

function PostMsg() {
	this.nkn = undefined;
	this.eml = undefined;
	this.txt = undefined;
}

PostMsg.prototype.Set = function(Nkn, eml, Txt) {
	this.nkn = Nkn;
	this.eml = eml;
	this.txt = Txt;
	return this;
}

PostMsg.prototype.Legal = function() {
	var whiteStr = function (s) {
		for (var i = 0; i < s.length; i += 1) {
			if (!(
				s[i] === '\t' ||
				s[i] === '\n' ||
				s[i] === '\v' ||
				s[i] === '\f' ||
				s[i] === '\r' ||
				s[i] === ' '
			)) return false;
		}
		return true;
	}
	if (this.nkn.length >= 64) {
		return "Nickname too long.";
	}
	if (this.nkn.length === 0 || whiteStr(this.nkn)) {
		return "Nickname cannot be white string."
	}
	if (this.eml.length >= 1024) {
		return "Email too long."
	}
	if (this.txt.length >= 32768) {
		return "Text too long."
	}
	if (this.txt.length === 0 || whiteStr(this.txt)) {
		return "Text cannot be white string."
	}
	return "";
}

PostMsg.prototype.ToObject = function() {
	return {
		"type":"postmsg",
		"Nkn":this.nkn,
		"Ref":"0",
		"eml":this.eml,
		"Txt":this.txt
	}
}

PostMsg.prototype.ToJSON = function() {
	return JSON.stringify(this.ToObject())
}

function Ui(postmsg_ctor) {
	this.postmsg = new postmsg_ctor();

	this.msgList = document.getElementById("id_MsgList");
	this.msgGetStatus = document.getElementById("id_MsgGetStatus");
	this.loadMore = document.getElementById("id_LoadMore");
	this.postDiv = document.getElementById("id_PostDiv");
	this.inputNkn = document.getElementById("id_Nickname");
	this.inputeml = document.getElementById("id_Email");
	this.inputTxt = document.getElementById("id_PostText");
	this.submit = document.getElementById("id_Submit");
	this.msgPostStatus = document.getElementById("id_PostStatus");
}

Ui.prototype.ScrollTop = function() {
	window.scrollTo(0, 0);
}

Ui.prototype.SetMsgGetStatus = function(st) {
	this.msgGetStatus.innerText = st.toString();
}

Ui.prototype.SetMsgPostStatus = function(st) {
	this.msgPostStatus.innerText = st.toString();
}

Ui.prototype.ShowLoadMore = function() {
	this.loadMore.style.display = "block";
}

Ui.prototype.HideLoadMore = function() {
	this.loadMore.style.display = "none";
}

Ui.prototype.ShowSubmit = function() {
	this.submit.style.display = "block";
}

Ui.prototype.HideSubmit = function() {
	this.submit.style.display = "none";
}

Ui.prototype.ShowPostDiv = function() {
	this.postDiv.style.display = "block";
}

Ui.prototype.HidePostDiv = function() {
	this.postDiv.style.display = "none";
}

Ui.prototype.ClearInputs = function() {
	this.inputNkn.value = "";
	this.inputeml.value = "";
	this.inputTxt.value = "";
}

Ui.prototype.OnLoadMore = function(fn) {
	this.loadMore.onclick = fn;
}

Ui.prototype.GetPostMsg = function() {
	return this.postmsg.Set(
		this.inputNkn.value,
		this.inputeml.value,
		this.inputTxt.value
	)
}

Ui.prototype.OnSubmit = function(fn) {
	this.submit.onclick = fn;
}

Ui.prototype.PutMsg = function(id, postmsg) {
	var date = new Date();
	var yyyy = date.getFullYear();
	var mm = (date.getMonth()+1).toString();
	if (mm.length < 2) {
		mm = "0" + mm;
	}
	var dd = date.getDate();
	if (dd.length < 2) {
		dd = "0" + dd;
	}
	var dateStr = yyyy + "-" + mm + "-" + dd;
	var msg = this.msgNode(id, postmsg.nkn, dateStr, postmsg.txt);
	// XXX : consider empty situation:
	this.msgList.insertBefore(msg, this.msgList.childNodes[0]); 
}

Ui.prototype.msgNode = function(id, nkn, date, txt) {
	var msg = document.createElement('div')
	msg.setAttribute('class', 'message')
	var msg_header = document.createElement('div')
	msg_header.setAttribute('class', 'message-header')
	var nkn_el = document.createElement('b')
	nkn_el.appendChild(document.createTextNode(nkn.toString()))
	msg_header.appendChild(document.createTextNode('#' + id.toString() + ' '))
	msg_header.appendChild(nkn_el)
	msg_header.appendChild(document.createTextNode(' on '+date.toString()+' says:'))
	var msg_txt = document.createElement('div')
	msg_txt.setAttribute('class', 'message-text')
	msg_txt.appendChild(document.createTextNode(txt.toString()))
	msg.appendChild(msg_header)
	msg.appendChild(msg_txt)
	return msg
}

Ui.prototype.RenderChunk = function(chunk_object) {
	var arr = chunk_object['Array'];
	for (var i = arr.length - 1; i >= 0; i--) {
		var m = arr[i];
		this.msgList.appendChild(this.msgNode(m.Id, m.Nkn, m.Date, m.Txt));
	}
}

// JSON HTTP Request
function Jhr() {
	var jhr = this; // for closure
	jhr.onerr_cb = function(err, rspcode, x){}
	jhr.onget_cbs = {
		"blame": function(j){},
		"chunk": function(j){},
		"good":  function(j){},
		"meta":  function(j){},
	};
	jhr.xhr = new XMLHttpRequest();
	jhr.xhr.onreadystatechange = function() {
		if (this.readyState === 4) {
			try {
				rsp_json = JSON.parse(this.responseText); // XXX catch
			} catch (e) {
				jhr.onerr_cb(
					"jhr.xhr.onreadystatechange:JSON.parse :: parse error. ",
					this.status,
					"rsp err == " + this.responseText + e.toString()
				);
				return
			}
			if (
				rsp_json['type'] !== undefined &&
				jhr.onget_cbs[rsp_json['type']] !== undefined
			) {
				jhr.onget_cbs[rsp_json['type']](rsp_json);
			} else {
				jhr.onerr_cb("", this.status, rsp_json);
			}
		}
	}
}

Jhr.prototype.Get = function(url) {
	this.xhr.open('GET', url, true);
	this.xhr.send();
}

Jhr.prototype.Post = function(url, postmsg_string) {
	this.xhr.open('POST', url, true);
	console.log("Jhr.Post :: " + postmsg_string);
	this.xhr.send(postmsg_string);
}

Jhr.prototype.OnErr = function(fn) {
	this.onerr_cb = fn;
}

Jhr.prototype.OnGet = function(rsp_json_type, fn) {
	this.onget_cbs[rsp_json_type.toString()] = fn;
}

function Main(postmsg_ctor, ui_ctor, jhr_ctor, urls_ctor) {
	this.ui = new ui_ctor(postmsg_ctor);
	this.jhr = new jhr_ctor();
	this.urls = new urls_ctor();

	this.msgNum = undefined;
	this.chunkTotal = undefined;
	this.nextChunkId = undefined;

	this.bindUiEvents();
	this.bindJhrEvents();
	this.run();
}

Main.prototype.bindUiEvents = function() {
	var main = this;

	main.ui.OnLoadMore(function() {
		main.ui.HideLoadMore();
		main.jhr.Get(main.urls.GetChunk(main.nextChunkId));
	});

	main.ui.OnSubmit(function() {
		main.ui.HideSubmit();
		main.ui.SetMsgPostStatus("Posting...");
		var postmsg = main.ui.GetPostMsg();
		var err = postmsg.Legal();
		if (err === "") {
			main.jhr.Post(main.urls.Post, postmsg.ToJSON());
		} else {
			main.ui.SetMsgPostStatus(err);
			main.ui.ShowSubmit();
		}
	});
}

Main.prototype.bindJhrEvents = function() {
	var main = this;

	main.jhr.OnGet('meta', function(j) {
		console.log("main.jhr.onGet[meta] :: " + j)
		main.msgNum = j.MsgNum;
		main.chunkTotal = Math.ceil(j.MsgNum / 50);
		main.nextChunkId = main.chunkTotal - 1;
		if (j.MsgNum > 0) {
			main.jhr.Get(main.urls.GetChunk(main.nextChunkId));
		} else {
			main.ui.SetMsgGetStatus("No message has being posted yet.");
			main.ui.ShowPostDiv();
		}
	});

	main.jhr.OnGet('chunk', function(j) {
		console.log("main.jhr.onGet[chunk] :: " + j)
		main.ui.RenderChunk(j)
		main.ui.ShowPostDiv();
		main.ui.SetMsgGetStatus("");
		main.ui.SetMsgPostStatus("");
		main.nextChunkId -= 1;
		if (main.nextChunkId !== -1) {
			main.ui.ShowLoadMore();
		}
	})

	// Refresh and scroll to the top automatically
	// It is like I am cheating the poster
	main.jhr.OnGet('good', function(j) {
		console.log("main.jhr.onGet[good] :: " + j)
		if (j.hint === "post success") {
			main.ui.SetMsgGetStatus("");
			main.ui.SetMsgPostStatus("");
			main.ui.PutMsg(main.msgNum, main.ui.GetPostMsg());
			main.ui.ClearInputs();
			main.ui.ScrollTop();
			main.ui.ShowSubmit();
		}
	})

	main.jhr.OnGet('blame', function(j) {
		console.log("main.jhr.onGet[blame] :: " + JSON.stringify(j))
	})

	// the logic here is too poor.
	// TODO : analyze the problem and show the suifficient
	// description and solution.
	main.jhr.OnErr(function(err, code, x) {
		console.log("main.jhr.OnErr :: " + err + code + " " + x)
		main.ui.SetMsgGetStatus("Sorry, the server is not running.");
		main.ui.SetMsgPostStatus("Therefore no user can get or post message.");
	})
}

Main.prototype.run = function() {
	this.ui.HideLoadMore();
	this.ui.HidePostDiv();
	this.jhr.Get(this.urls.GetMeta);
}

/* var MAIN = */ new Main(PostMsg, Ui, Jhr, Urls);
