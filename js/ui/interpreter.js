/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

 
 // First of all, prevent missing browser functionality from causing errors.
/*
 * If supported by the browser then JS-EDEN will measure how long it takes to
 * execute the user's code each time they press the submit button in the input
 * window and print the result in the JavaScript console.  If the browser
 * doesn't natively support making timing measurements then the functionality is
 * simply disabled.
*/
if (!("time" in console)) {
	console.time = function (timerName) {
		return;
	};
	console.endTime = function (timerName) {
		return;
	};
}



/**
 * Support function to get the caret position within the syntax highlighted
 * div. Used when clicking or selecting the highlighted script.
 */
function getCaretCharacterOffsetWithin(element) {
	var caretOffset = 0;
	var doc = element.ownerDocument || element.document;
	var win = doc.defaultView || doc.parentWindow;
	var sel;
	if (typeof win.getSelection != "undefined") {
	    sel = win.getSelection();
	    if (sel.rangeCount > 0) {
	        var range = win.getSelection().getRangeAt(0);
	        var preCaretRange = range.cloneRange();
	        preCaretRange.selectNodeContents(element);
	        preCaretRange.setEnd(range.endContainer, range.endOffset);
	        caretOffset = preCaretRange.toString().length;
	    }
	} else if ( (sel = doc.selection) && sel.type != "Control") {
	    var textRange = sel.createRange();
	    var preCaretTextRange = doc.body.createTextRange();
	    preCaretTextRange.moveToElementText(element);
	    preCaretTextRange.setEndPoint("EndToEnd", textRange);
	    caretOffset = preCaretTextRange.text.length;
	}
	return caretOffset;
}

if (Cadence.UI === undefined) Cadence.UI = {};



/**
 * Support function to get the start of a selection of the highlighted script.
 */
function getStartCaretCharacterOffsetWithin(element) {
	var caretOffset = 0;
	var doc = element.ownerDocument || element.document;
	var win = doc.defaultView || doc.parentWindow;
	var sel;
	if (typeof win.getSelection != "undefined") {
	    sel = win.getSelection();
	    if (sel.rangeCount > 0) {
	        var range = win.getSelection().getRangeAt(0);
	        var preCaretRange = range.cloneRange();
	        preCaretRange.selectNodeContents(element);
	        preCaretRange.setEnd(range.startContainer, range.startOffset);
	        caretOffset = preCaretRange.toString().length;
	    }
	} else if ( (sel = doc.selection) && sel.type != "Control") {
	    var textRange = sel.createRange();
	    var preCaretTextRange = doc.body.createTextRange();
	    preCaretTextRange.moveToElementText(element);
	    preCaretTextRange.setEndPoint("EndToEnd", textRange);
	    caretOffset = preCaretTextRange.text.length;
	}
	return caretOffset;
}

 
/**
 * JS-Eden Interpreter Window Plugin.
 * Which is better than the one with all the widget cak.
 * @class Input Window Plugin
 */
(function () {
	var me = this;
	

	var closeInput = function(options) {
		var $dialog = options.$dialog;
		$dialog.dialog('close');
		//console.log("CLOSE");
		console.log(options);
	}

	var openInput = function(options) {

		var $dialog = options.$dialog;
		$dialog.dialog('open');
		$(options.editor.getInputField()).focus();
	}
	

	/*$(document.body).delegate(null, 'drop', function(e) {
		var value = e.originalEvent.dataTransfer.getData("agent");
		if (!value || value == "") {
			console.log(e.originalEvent.dataTransfer.files);
			e.preventDefault();
			return;
		}

		var valsplit = value.split("/");
		var viewname = valsplit.join("");
		eden.root.lookup("_view_"+viewname+"_tabs").assign([value], eden.root.scope);
		edenUI.createView(viewname, "ScriptInput");
		eden.root.lookup("_view_"+viewname+"_agent").assign(value, eden.root.scope);
	}).delegate(null, 'dragover', function(e) {
		e.preventDefault();
	});*/



	/**
	 * Common input window view constructor.
	 */
	function createCommon(name, mtitle, code, embedded) {
		var $dialogContents = $('<div class="inputdialogcontent"><div class="inputhider"><textarea autofocus tabindex="1" class="hidden-textarea"></textarea><div class="inputCodeArea"><div spellcheck="false" tabindex="2" contenteditable class="outputcontent"></div></div></div><div class="info-bar"></div><div class="outputbox"></div></div></div>')
		//var $optmenu = $('<ul class="input-options-menu"><li>Mode</li><li>Word-wrap</li><li>Spellcheck</li><li>All Leaves</li><li>All Options</li></ul>');		
		var position = 0;
		var $codearea = $dialogContents.find('.inputCodeArea');
		var codearea = $codearea.get(0);
		var intextarea = $dialogContents.find('.hidden-textarea').get(0);
		var outdiv = $dialogContents.find('.outputcontent').get(0);
		var infobox = $dialogContents.find('.info-bar').get(0);
		var outputbox = $dialogContents.find('.outputbox').get(0);
		//var suggestions = $dialogContents.find('.eden_suggestions');
		//var $tabs = $dialogContents.find('.agent-tabs');
		//var tabs = $tabs.get(0);
		//suggestions.hide();
		$(infobox).hide();

		outdiv.contentEditable = true;

		var gutter = new Cadence.UI.Gutter($codearea.get(0), infobox);

		var $optionsmenu = $('<div class="options-menu noselect"></div>');
		var optionsmenu = $optionsmenu.get(0);
		$optionsmenu.appendTo($dialogContents);

		function createMenuItem(icon, name, action) {
			var item = $('<div class="options-menu-item"><span class="options-menu-icon">'+icon+'</span><span>'+name+'</span></div>');
			$optionsmenu.append(item);
			item.click(action);
		}

		function hideMenu() {
			$optionsmenu.hide("slide", { direction: "down"}, 200);
		}

		function buildMenu() {
			/*while (optionsmenu.firstChild) optionsmenu.removeChild(optionsmenu.firstChild);

			createMenuItem((agent.state[obs_showtabs]) ? "&#xf00c;" : "&#xf00d;", Language.ui.input_window.show_tabs, function(e) { agent.state[obs_showtabs] = !agent.state[obs_showtabs]; buildMenu(); });
			createMenuItem((agent.state[obs_showbuttons]) ? "&#xf00c;" : "&#xf00d;", Language.ui.input_window.show_controls, function(e) { agent.state[obs_showbuttons] = !agent.state[obs_showbuttons]; buildMenu(); });
			createMenuItem("&#xf0c0;", Language.ui.input_window.browse_agents, function(e) { showBrowseDialog(); hideMenu(); });
			createMenuItem("&#xf21b;", Language.ui.input_window.hide_agent, function(e) {
				var tabs = agent.state[obs_tabs];
				var ix = tabs.indexOf(scriptagent.name);
				if (ix >= 0) {
					tabs.splice(ix,1);
					ix--;
					if (ix < 0) ix = 0;
					if (ix < tabs.length) {
						agent.state[obs_agent] = tabs[ix];
					}
					agent.state[obs_tabs] = tabs;
				}
				if (tabs.length == 0) agent.state[obs_agent] = undefined;
				hideMenu();
			});
			createMenuItem("&#xf1da;", Language.ui.input_window.view_history, function(e) { showSubDialog("showHistory", function(status, index, version) {
				if (status) {
					if (version != scriptagent.meta.saveID) {
						scriptagent.changeVersion(version, function() {
							scriptagent.rollback(index);
							updateHistoryButtons();
						});
					} else {
						scriptagent.rollback(index);
					}
				}
			}, scriptagent); hideMenu(); });
			createMenuItem("&#xf0d0;", Language.ui.input_window.insert_temp, function(e) { });*/
		}

		var dragstart = 0;
		var dragvalue = 0;
		var draglast = 0;
		var dragline = -1;
		var dragint = false;
		var rebuildtimer;
		var amtyping = false;
		var rebuildinterval = 10;
		var currentlineno = 1;
		var currentcharno = 0;
		var highlighter = new Cadence.UI.Highlight(outdiv);
		var refreshentire = false;
		var edited = false;
		var dirty = false;
		var tabscrollix = 0;
		var readonly = false;
		var showhidden = false;
		var inspectmode = false;

		var scriptagent;
		var ast = new Cadence.Parser("");
		ast.parse();
		var browseDialog = undefined;



		/*function updateHistoryButtons() {
			var nextbut = $buttonbar.find(".next-input");
			var fastbut = $buttonbar.find(".fastforward-input");
			var rewibut = $buttonbar.find(".rewind-input");
			var prevbut = $buttonbar.find(".previous-input");

			if (readonly || !scriptagent.canRedo()) {
				nextbut.removeClass("control-enabled");
				fastbut.removeClass("control-enabled");
			} else {
				nextbut.addClass("control-enabled");
				fastbut.addClass("control-enabled");
			}

			if (readonly || !scriptagent.canUndo()) {
				prevbut.removeClass("control-enabled");
				rewibut.removeClass("control-enabled");
			} else {
				prevbut.addClass("control-enabled");
				rewibut.addClass("control-enabled");
			}
		}

		updateHistoryButtons();*/


		/**
		 * If the input window is a dialog then set its title.
		 */
		function setTitle(title) {
			if (scriptagent) {
				//scriptagent.setTitle(title);
				//rebuildTabs();
			}

			var p = $dialogContents.get(0).parentNode;
			if (p) {
				p = p.parentNode;
				if (p) {
					$(p).find(".ui-dialog-title").html(title);
				}
			}
		}



		function setSubTitle(text) {
			if (embedded) return;
			var p = $dialogContents.get(0).parentNode;
			if (p) {
				p = p.parentNode;
				if (p) {
					var title = $(p).find(".ui-dialog-subtitle").get(0);
					if (title === undefined) {
						title = document.createElement("span");
						title.className = "ui-dialog-subtitle";
						$(p).find(".ui-dialog-title").get(0).parentNode.appendChild(title);
					}

					if (scriptagent) {
						title.textContent = scriptagent.name + " " + text;
					} else {
						title.textContent = text;
					}
				}
			}
		}


		// Initialise sub title after dialog creation
		setTimeout(function() { if (scriptagent === undefined) setSubTitle("[No Agents]"); }, 0);



		/**
		 * Generate the script text from a list. The list can contain strings
		 * for each line, or a symbol reference to get the current definition.
		 * Used on load and when _script changes.
		 */
		/*function preloadScript(sym, value) {
			var res = "";
			if (value) {

				Eden.Agent.importAgent("view/script/"+name, "default", ["noexec","create"], function(ag,msg) {
					if (ag === undefined) {
						console.error("Could not create agent: view/script/"+name+"@default: "+msg);
						return;
					}
					if (value instanceof Array) {
						for (var i=0; i < value.length; i++) {
							if (typeof value[i] == "string") {
								res += value[i] + "\n";
							} else if (typeof value[i] == "object") {
								res += value[i].eden_definition+"\n";
							}
						}
					}
					ag.setSource(res, false, -1);
					
					agent.state[obs_agent] = "view/script/"+name;
				});
			}
		}*/



		/**
		 * Load a file from the server as the script.
		 */
		/*function loadFile(sym, value) {
			$.get(value, function(data) {
				intextarea.value = data;
				updateEntireHighlight(scriptagent.executed);
			}, "text");
		}*/



		/**
		 * Respond to requests to change the current tab to a particular agent.
		 * This is triggered from the observable _view_[name]_agent which is
		 * set by the UI on tab change etc.
		 */
		/*function changeAgent(sym, value) {
			// A valid and imported agent is given
			if (value && Eden.Agent.agents[value]) {
				// Already the current tab so continue...
				if (scriptagent && value == scriptagent.name) return;
				// Record tab cursor position
				if (scriptagent) tabpositions[scriptagent.name] = intextarea.selectionStart;
				// Release ownership of current tab
				if (readonly == false) scriptagent.setOwned(false);
				// Switch to new tab.
				scriptagent = Eden.Agent.agents[value];
				setTitle(scriptagent.title);

				// Not already owned so we can take ownership
				if (Eden.Agent.agents[value].owned == false) {
					scriptagent.setOwned(true);
					readonly = false;
					setSubTitle("");
					changeClass(outdiv, "readonly", false);
					outdiv.contentEditable = true;
				// Otherwise it needs to be readonly
				} else {
					readonly = true;
					setSubTitle("[readonly]");
					// The readonly class changes colour scheme
					changeClass(outdiv, "readonly", true);
					outdiv.contentEditable = false;
				}

				// We have a parsed source so update contents of script view.
				if (scriptagent.ast) {
					intextarea.value = scriptagent.ast.stream.code;
					if (tabpositions[scriptagent.name]) {
						intextarea.selectionStart = tabpositions[scriptagent.name];
						intextarea.selectionEnd = tabpositions[scriptagent.name];
					}
					highlightContent(scriptagent.ast, -1, (tabpositions[scriptagent.name]) ? tabpositions[scriptagent.name] : 0);
					intextarea.focus();
					checkScroll();
				} else {
					intextarea.value = "";
					intextarea.focus();
					updateEntireHighlight();
				}

				disableInspectMode();
				updateHistoryButtons();

				gutter.setAgent(value);

				// Make sure tab exists
				var tabs = agent.state[obs_tabs];
				if (tabs.indexOf(value) == -1) {
					tabs.push(value);
					agent.state[obs_tabs] = tabs;
				} else {
					rebuildTabs();
				}

			// Otherwise, no valid agent so try and resolve
			} else {
				// Release ownership of any current tab
				if (scriptagent && readonly == false) scriptagent.setOwned(false);
				// Clear and disable the script view
				intextarea.value = "";
				readonly = true;
				outdiv.className = "outputcontent readonly";
				outdiv.contentEditable = false;
				outdiv.innerHTML = "";
				scriptagent = undefined;
				setTitle(Language.ui.input_window.title);
				setSubTitle("[No Agents]");

				gutter.clear();

				// Attempt to import the agent without execution and then
				// update the script view if successful.
				if (value) {
					if (Eden.Agent.agents[value] === undefined) {
						Eden.Agent.importAgent(value, "default", ["noexec"], function(ag) {
							if (ag) {
								changeAgent(undefined, value);
							}
						});
					}
				}
			}
		}*/

		

		/*edenUI.eden.root.addGlobal(function(sym, create) {
			if (highlighter.ast) {
				var whens = highlighter.ast.triggers[sym.name.slice(1)];
				if (whens) {
					//clearExecutedState();
					for (var i=0; i<whens.length; i++) {
						whens[i].execute(eden.root, undefined, highlighter.ast);
					}
					gutter.generate(highlighter.ast,-1);
					clearExecutedState();
				}
			}
		});*/


		var gutterinterval = setInterval(function() {
			if (ast === undefined) return;
			gutter.generate(ast, -1);
			//scriptagent.clearExecutedState();
		}, 50);


		//buildMenu();



		/**
		 * Re-parse the entire script and then re-highlight the current line
		 * (and one line either size).
		 */
		function updateLineHighlight() {
			var lineno = -1; // Note: -1 means update all.
			var pos = -1;
			if (document.activeElement === intextarea) {
				pos = intextarea.selectionEnd;
				lineno = getLineNumber(intextarea);
			}

			ast = new Cadence.Parser(intextarea.value);
			ast.parse();
			//console.log(ast);
			highlighter.ast = ast;

			runScript(lineno);

			highlightContent(ast, lineno, pos);
			//rebuildNotifications();
		}



		/**
		 * Re-highlight the current line without re-parsing the script.
		 * Used when moving around the script without actually causing a code
		 * change that needs a reparse.
		 */
		function updateLineCachedHighlight() {
			var lineno = -1;
			var pos = -1;
			if (document.activeElement === intextarea) {
				pos = intextarea.selectionEnd;
				lineno = getLineNumber(intextarea);
			}

			highlightContent(highlighter.ast, lineno, pos);
		}



		/**
		 * Parse the script and do a complete re-highlight. This is slow but
		 * is required when there are changes across multiple lines (or there
		 * could be such changes), for example when pasting.
		 */
		function updateEntireHighlight(rerun) {
			//if (scriptagent === undefined) return;
			ast = new Cadence.Parser(intextarea.value);
			ast.parse();
			highlighter.ast = ast;
			var pos = -1;
			if (document.activeElement === intextarea) {
				pos = intextarea.selectionEnd;
			}

			if (rerun) {
				runScript(0);
			}

			highlightContent(ast, -1, pos);
		}



		function hideInfoBox() {
			$(infobox).hide("fast");
		}


		/**
		 * Replace a particular line with the given content.
		 * Can be used for autocompletion and number dragging.
		 */
		function replaceLine(lineno, content) {
			var lines = intextarea.value.split("\n");
			lines[lineno] = content;
			intextarea.value = lines.join("\n");
		}



		/**
		 * Insert an array of lines into the script at the given line.
		 * Potentially used when expanding definition filters.
		 * CURRENTLY UNUSED
		 */
		function insertLines(lineno, newlines) {
			var lines = intextarea.value.split("\n");
			for (var i=0; i<newlines.length; i++) {
				lines.splice(lineno, 0, newlines[i]);
			}
			intextarea.value = lines.join("\n");
		}



		/**
		 * Prepend ## to a line to comment it out.
		 * CURRENTLY UNUSED.
		 */
		function commentOutLine(lineno) {
			var lines = intextarea.value.split("\n");
			lines[lineno-1] = "##" + lines[lineno-1];
			intextarea.value = lines.join("\n");
		}



		/**
		 * When clicking or using a syntax highlighted element, find which
		 * source line this corresponds to. Used by number dragging.
		 */
		function findElementLineNumber(element) {
			var el = element;
			while (el.parentNode !== outdiv) el = el.parentNode;

			for (var i=0; i<outdiv.childNodes.length; i++) {
				if (outdiv.childNodes[i] === el) return i;
			}
			return -1;
		}



		/**
		 * Update scroll position if cursor is near to an edge.
		 */
		function checkScroll() {
			// Get the cursor
			var el = $(outdiv).find(".fake-caret").get(0);
			if (el === undefined) return;
			var area = $codearea.get(0);

			// How far from left or right?
			var distleft = el.offsetLeft - area.scrollLeft + 25;
			var distright = area.clientWidth + area.scrollLeft - el.offsetLeft - 25;

			// Need to find the current line element
			while (el.parentNode != outdiv) el = el.parentNode;

			// How far is this line from the top or bottom
			var disttop = el.offsetTop - area.scrollTop + 15;
			var distbottom = area.clientHeight + area.scrollTop - el.offsetTop - 15;

			// Move if needed.
			if (distleft < 80) area.scrollLeft = area.scrollLeft - (80-distleft);
			if (distright < 80) area.scrollLeft = area.scrollLeft + (80-distright);
			if (disttop < 40) area.scrollTop = area.scrollTop - (40-disttop);
			if (distbottom < 40) area.scrollTop = area.scrollTop + (40-distbottom);
		}



		/**
		 * Call the highlighter to generate the new highlight output, and then
		 * post process this to allow for extra warnings and number dragging.
		 */
		function highlightContent(ast, lineno, position) {
			highlighter.highlight(ast, lineno, position);
			gutter.generate(ast,lineno);

			// Process the scripts main doxy comment for changes.
			if (ast.mainDoxyComment && (lineno == -1 || (lineno >= 1 && lineno <= ast.mainDoxyComment.endline))) {
				// Find all doc tags
				var taglines = ast.mainDoxyComment.content.match(/@[a-z]+.*\n/ig);
				if (taglines) {
					for (var i=0; i<taglines.length; i++) {
						// Extract tag and content
						var ix = taglines[i].search(/\s/);
						if (ix >= 0) {
							var tag = taglines[i].substring(0,ix);
							var content = taglines[i].substr(ix).trim();

							// Set title tag found
							if (tag == "@title") {
								setTitle(content);
							}
						}
					}
				}
			}

			// Make sure caret remains inactive if we don't have focus
			if (document.activeElement !== intextarea) {
				$(outdiv).find(".fake-caret").addClass("fake-blur-caret");
			}

			/* Number dragging code, but only if live */
			if (!readonly) {
				$(outdiv).find('.eden-number').draggable({
					helper: function(e) { return $("<div class='eden-drag-helper'></div>"); },
					axis: 'x',
					distance: 5,
					drag: function(e,u) {
						if (readonly) return;
						var newval;
						if (dragint) {
							newval = Math.round(dragvalue + ((u.position.left - dragstart) / 2));
						} else {
							newval = dragvalue + ((u.position.left - dragstart) * 0.005);
							newval = newval.toFixed(4);
						}

						// TODO: this is no good for floats
						if (newval != draglast) {
							draglast = newval;
							e.target.innerHTML = "" + newval;

							var content = e.target.parentNode.textContent;
							if (content.charAt(content.length-1) == "\n") {
								content = content.slice(0,-1);
							}
							replaceLine(dragline, content);

							ast = new Cadence.Parser(intextarea.value);
							ast.parse();
							highlighter.ast = ast;

							//console.log("Dragline: " + dragline);

							// Execute if no errors!
							if (gutter.lines[dragline] && gutter.lines[dragline].live && !ast.hasErrors()) {
								ast.executeLine(dragline);
							}

							highlightContent(ast, dragline, -1);
						}
					},
					start: function(e,u) {
						if (readonly) return;
						edited = true;
						// Calculate the line we are on
						dragline = findElementLineNumber(e.target);
						dragstart = u.position.left;
						var content = e.target.textContent;
						if (content.indexOf(".") == -1) {
							dragvalue = parseInt(content);
							dragint = true;
						} else {
							dragvalue = parseFloat(content);
							dragint = false;
						}
						draglast = dragvalue;

						$(e.target).addClass("eden-select");
						$(outdiv).css("cursor","ew-resize");
					},
					stop: function(e,u) {
						if (readonly) return;
						$(e.target).removeClass("eden-select");
						$(outdiv).css("cursor","text");
						//updateEntireHighlight();
						dragline = -1;
					},
					cursor: 'move',
					cursorAt: {top: -5, left: -5}
				// Following line is hack to allow click through editing...
				}).click(function() { $(this).draggable({disabled: true}); }) .blur(function() { $(this).draggable({disabled: false}); });
			}
		}



		/**
		 * Return the current line. Also, set currentlineno.
		 */
		function getLineNumber(textarea) {
			var lines = textarea.value.substr(0, textarea.selectionStart).split("\n");
			currentlineno = lines.length;
			currentcharno = lines[lines.length-1].length;
			return currentlineno;
		}



		/**
		 * Move the caret of the contenteditable div showing the highlighted
		 * script to be the same location as the fake caret in the highlight
		 * itself. This enables shift selection using the browsers internal
		 * mechanism.
		 */
		function setCaretToFakeCaret() {
			var el = $(outdiv).find(".fake-caret").get(0);
			var range = document.createRange();
			var sel = window.getSelection();
			if (el.nextSibling) el = el.nextSibling;
			range.setStart(el, 0);
			range.collapse(true);
			sel.removeAllRanges();
			sel.addRange(range);
			// Finally, delete the fake caret
			$(outdiv).remove(".fake-caret");
		}



		/* Is this needed???? */
		function selectAll() {
			var range = document.createRange();
			range.selectNodeContents(outdiv);
			var sel = window.getSelection();
			sel.removeAllRanges();
			sel.addRange(range);
		}

		/**
		 * Script contents have changed, so re-parse, re-highlight and
		 * if live, re-execute. Used in a short interval timeout from the
		 * raw input/keyup events.
		 */
		function doRebuild() {
			// Regenerate the AST and highlight the code.
			if (refreshentire) {
				updateEntireHighlight();
				refreshentire = false;
			} else { // if (dirty) {
				updateLineHighlight();
			/*} else {
				updateLineCachedHighlight();*/
			}
			// Adjust scroll position if required
			checkScroll();
			dirty = false;
		}



		function runScript(line) {
			// If we should run the statement (there are no errors)
			if (gutter.lines[line-1] && gutter.lines[line-1].live && !ast.hasErrors()) {
				ast.executeLine(line-1);
			}
		}



		/*function showSubDialog(name, callback, data) {
			if (EdenUI.plugins.ScriptInput.dialogs[name]) {
				EdenUI.plugins.ScriptInput.dialogs[name]($dialogContents, callback, data);
			}
		}*/



		/**
		 * Set the rebuild timeout. Note: rebuildinterval MUST be less that the
		 * keyboard repeat rate or you will not see a change when holding keys
		 * down.
		 */
		function rebuild() {
			edited = true;
			// Using a timer to make rebuild async. Allows input and keyup to
			// trigger a single rebuild which overcomes Chrome input event bug.
			clearTimeout(rebuildtimer);
			rebuildtimer = setTimeout(doRebuild, rebuildinterval);
		}



		/**
		 * Event handler for input change.
		 */
		function onInputChanged(e) {
			dirty = true;

			rebuild();

				/* Suggestions Box */
				//console.log(window.getSelection().getRangeAt(0));
				// Is there an abstract syntax tree node for this line?
				/*var curast = stream.ast.lines[stream.currentline-1];
				if (curast) {
					var pattern = stream.ast.getSource(curast).split("\n")[0];
					//console.log("Fill: " + pattern);

					// Get the current line and its screen position to
					// position the suggestions box correctly.
					var curlineele = $(textarea).find(".eden-currentline");
					var pos = curlineele.position();
					if (pos === undefined) pos = $(textarea).position();
					pos.top += $dialogContents.get(0).scrollTop;
					
					if (curast.type == "definition") {
						var rhs = pattern.split("is")[1].trim();
						//console.log("RHS: " + rhs);
						var sym = eden.root.lookup(curast.lvalue.observable);
						var def = sym.eden_definition;
						if (def) def = def.split("is")[1].trim();
						if (def && def.substr(0,rhs.length) == rhs) {
							//console.log("SUGGEST: " + sym.eden_definition);
							suggestions.text(sym.eden_definition.split("is")[1].trim());
							if (suggestions.is(":visible") == false) {
								suggestions.css("top",""+ (pos.top + 20) +"px");
								suggestions.show("fast");
							}
						} else {
							var regExp = new RegExp("^(" + rhs + ")", "");
							var suggest = "";
							var count = 0;
							var last = "";
							for (var s in eden.root.symbols) {
								if (regExp.test(s)) {
									count++;
									last = s;
									//console.log("SUGGEST: " + s);
									suggest += s + "<br/>";
								}
							}
							if (count > 1 || (count == 1 && rhs.length < last.length)) {
								suggestions.html(suggest);
								if (suggestions.is(":visible") == false) {
									suggestions.css("top",""+ (pos.top + 20) +"px");
									suggestions.show("fast");
								}
							} else {
								suggestions.hide("fast");
							}
						}
					} else {
						suggestions.hide("fast");
					}
				} else {
					suggestions.hide("fast");
				}*/
		}




		/**
		 * Various keys have special actions that require intercepting. Tab key
		 * must insert a tab, shift arrows etc cause selection and require a
		 * focus shift, and adding or deleting lines need to force a full
		 * rehighlight.
		 */
		function onTextKeyDown(e) {
			// Alt and AltGr for inspect mode.
			//if (e.keyCode == 18 || e.keyCode == 225) {
			if (e.altKey && e.keyCode == 73) {
				enableInspectMode();
			} else if (!e.altKey) {
				// Don't allow editing in inspect mode.
				if (inspectmode) {
					e.preventDefault();
					return;
				}

				// If not Ctrl or Shift key then
				if (!e.ctrlKey && e.keyCode != 17 && e.keyCode != 16) {
					// Make TAB key insert TABs instead of changing focus
					if (e.keyCode == 9) {
						e.preventDefault();
						var start = intextarea.selectionStart;
						var end = intextarea.selectionEnd;

						// set textarea value to: text before caret + tab + text after caret
						intextarea.value = intextarea.value.substring(0, start)
									+ "\t"
									+ intextarea.value.substring(end);

						// put caret at right position again
						intextarea.selectionStart =
						intextarea.selectionEnd = start + 1;
						//updateLineHighlight();
						rebuild();
					} else if (e.keyCode == 37 || e.keyCode == 38 || e.keyCode == 39 || e.keyCode == 40 || e.keyCode == 36 || e.keyCode == 35) {
						// Shift arrow selection, move to editable div.
						if (e.shiftKey) {
							setCaretToFakeCaret();
							outdiv.focus();
							return;
						}
					
						// Update fake caret position at key repeat rate
						updateLineCachedHighlight();
						// Adjust scroll position if required
						checkScroll();
					} else if (e.keyCode == 13 || (e.keyCode == 8 && intextarea.value.charCodeAt(intextarea.selectionStart-1) == 10)) {
						// Adding or removing lines requires a full re-highlight at present
						refreshentire = true;
					}

				} else if (e.ctrlKey) {
					if (e.shiftKey) {
						if (e.keyCode == 37 || e.keyCode == 38 || e.keyCode == 39 || e.keyCode == 40 || e.keyCode == 36 || e.keyCode == 35) {
							// Ctrl+Shift arrow selection, move to editable div.
							setCaretToFakeCaret();
							outdiv.focus();
							return;
						}
					} else if (e.keyCode === 38) {
						// up
						onPrevious();
					} else if (e.keyCode === 40) {
						// down
						onNext();
					} else if (e.keyCode === 86) {

					} else if (e.keyCode === 65) {
						// Ctrl+A to select all.
						e.preventDefault();
						outdiv.focus();
						selectAll();
					}
				}
			} else {
				// Alt key is pressed so.....
				if (e.keyCode == 187 || e.keyCode == 61) {
					// Alt+Plus: Zoom in
					//agent.state[obs_zoom]++;
					e.preventDefault();
				} else if (e.keyCode == 189 || e.keyCode == 173) {
					// Alt+Minus: Zoom out
					//agent.state[obs_zoom]--;
					e.preventDefault();
				} else if (e.keyCode == 48) {
					//Alt+0
					//agent.state[obs_zoom] = 0;
					e.preventDefault();
				}
			}
		}



		function onTextPaste(e) {
			refreshentire = true;
		}



		/**
		 * Some keys don't change content but still need a rehighlight. And,
		 * in case the input change event is skipped (Chrome!!), make sure a
		 * rebuild does happen.
		 */
		function onTextKeyUp(e) {
			// Alt and AltGr for disable inspect mode.
			if (e.keyCode == 18 || (e.altKey && e.keyCode == 73)) {
				disableInspectMode();
				e.preventDefault();
			} else if (!e.altKey) {
				if (!e.ctrlKey && (	e.keyCode == 37 ||	//Arrow keys
									e.keyCode == 38 ||
									e.keyCode == 39 ||
									e.keyCode == 40 ||
									e.keyCode == 36 ||	// Home key
									e.keyCode == 35)) {	// End key

					updateLineCachedHighlight();

					// Force a scroll for home and end AFTER key press...
					if (e.keyCode == 36 || e.keyCode == 35) {
						checkScroll();
					}
				} else {
					rebuild();
				}
			}
		}



		/**
		 * When focus is on the output and a key is pressed. This occurs when
		 * text is selected that needs replacing.
		 */
		function onOutputKeyDown(e) {
			// Alt and AltGr for inspect mode.
			if (e.altKey && e.keyCode == 73) {
				enableInspectMode();
			} else if (!e.altKey) {
				if (outdiv.style.cursor == "pointer") outdiv.style.cursor = "initial";
				if (e.keyCode == 16 || e.keyCode == 17 || (e.ctrlKey && e.keyCode == 67)) {
					// Ignore Ctrl and Ctrl+C.
				// If not shift selecting...
				} else if (!(e.shiftKey && (e.keyCode == 37 || e.keyCode == 38 || e.keyCode == 39 || e.keyCode == 40 || e.keyCode == 35 || e.keyCode == 36))) {
					var end = getCaretCharacterOffsetWithin(outdiv);
					var start = getStartCaretCharacterOffsetWithin(outdiv);

					intextarea.focus();
					intextarea.selectionEnd = end;
					intextarea.selectionStart = start;
					if (start != end) refreshentire = true;
				}
			}
		}



		function onOutputPaste(e) {
			intextarea.focus();
			setTimeout(updateEntireHighlight, 0);
		}



		function onOutputKeyUp(e) {
			if (e.keyCode == 18 || (e.altKey && e.keyCode == 73)) {
				//disableInspectMode();
				e.preventDefault();
			}
		}



		/**
		 * Make the caret look invisible. It must still exist to keep record
		 * of current location for selection purposes.
		 */
		function onTextBlur(e) {
			//$(outdiv).find(".fake-caret").addClass("fake-blur-caret");
			// Finally, delete the fake caret
			$(outdiv).find(".fake-caret").remove();
			hideInfoBox();
			//disableInspectMode();
		}



		/**
		 * Make the caret visible.
		 */
		function onTextFocus(e) {
			//$(outdiv).find(".fake-caret").removeClass("fake-blur-caret");
		}


		/**
		 * Clicking on the highlighted script needs to move the cursor position.
		 * Unless a selection is being made, in which case keep the focus on
		 * the highlighted output instead.
		 */
		function onOutputMouseUp(e) {
			hideInfoBox();
			//hideMenu();

			if (inspectmode) {
				var element = e.target;
				if (element.className == "" && element.parentNode.nodeName == "SPAN") {
					element = element.parentNode;
				}
				if (element.className == "eden-path") {
					//console.log();
					//disableInspectMode();
					openTab(element.parentNode.textContent);
				} else if (element.className == "eden-observable") {
					var obs = element.getAttribute("data-observable");
					element.textContent =  Eden.edenCodeForValue(eden.root.lookup(obs).value());
					element.className += " select";
				} else if (element.className == "eden-observable select") {
					var obs = element.getAttribute("data-observable");
					element.textContent = obs;
					element.className = "eden-observable";
				}
				e.preventDefault();
			} else {
				// To prevent false cursor movement when dragging numbers...
				if (document.activeElement === outdiv) {
					var end = getCaretCharacterOffsetWithin(outdiv);
					var start = getStartCaretCharacterOffsetWithin(outdiv);
					if (start != end) {
						// Fix to overcome current line highlight bug on mouse select.
						refreshentire = true;
					} else {
						// Move caret to clicked location
						var curline = currentlineno;
						intextarea.focus();
						intextarea.selectionEnd = end;
						intextarea.selectionStart = end;
						if (highlighter.ast) {		
							highlighter.highlight(highlighter.ast, curline, end);
							updateLineCachedHighlight();
						}
						//checkScroll();
					}
				}
			}
		}


		// Set the event handlers
		$dialogContents
		.on('input', '.hidden-textarea', onInputChanged)
		.on('keydown', '.hidden-textarea', onTextKeyDown)
		.on('keyup', '.hidden-textarea', onTextKeyUp)
		.on('paste', '.hidden-textarea', onTextPaste)
		.on('keydown', '.outputcontent', onOutputKeyDown)
		.on('keyup', '.outputcontent', onOutputKeyUp)
		.on('paste', '.outputcontent', onOutputPaste)
		.on('blur', '.hidden-textarea', onTextBlur)
		.on('focus', '.hidden-textarea', onTextFocus)
		.on('mouseup', '.outputcontent', onOutputMouseUp);



		var viewdata = {
			contents: $dialogContents,
			
			destroy: function() {
				console.log("CLOSE SCRIPT");
				clearInterval(gutterinterval);
				
				ast = undefined;
			},
			resize: function(e,ui) {
				if (ui && ui.size) {
					//maxtabs = Math.floor((ui.size.width - 90) / 160);
				}
			},
			setValue: function (value) { intextarea.value = value; updateEntireHighlight(); },

			execute: function() { var result; if (ast) eval(ast.generate()).call(undefined); return result; }
		}

		// Initialise highlight content
		updateEntireHighlight();

		return viewdata;
	};



	

	Cadence.UI.makeScriptBox = function(container) {
		var content = container.textContent;
		var viewdata = createCommon("noname", "notitle", content, true);
		container.innerHTML = "";
		container.appendChild(viewdata.contents.get(0));
		return viewdata;
	}


})();

