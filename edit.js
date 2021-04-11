
var prevText = "";

//updating preview with 0.5s interval
function timer() {
	let txdiv = document.getElementById("cet");
	let cont = txdiv.innerText;
	if(cont != prevText) {
		prevText = cont;
		let commonPos = getCaretPos(txdiv);
		let p = parseMarkdown(cont);
		document.getElementById("cet").innerHTML = p.txt;
		document.getElementById("pview").innerHTML = p.preview;
		setCaretPos(txdiv, commonPos);
	}
	setTimeout(timer, 500);
}

setTimeout(timer, 500);

//Restore caret position after div content update
function setCaretPos(el, commonPos)
{
	let charIndex = 0, range = document.createRange();
	range.setStart(el, 0);
	range.collapse(true);
	let nodeStack = [el], node, start = false, stop = false;
    //Count input text strings length to find line index and set caret position inside
	while (!stop && (node = nodeStack.pop())) {
		if (node.nodeType == 3) {
			let nextCharIndex = charIndex + node.length;
			if (!start && commonPos >= charIndex && (commonPos < nextCharIndex || nodeStack.length == 0 || charIndex + node.length >= commonPos)) {
				let indx = commonPos - charIndex < node.length ? commonPos - charIndex : node.length;
				range.setStart(node, indx);
				start = true;
			}
			if (start && commonPos >= charIndex && commonPos <= nextCharIndex) {
				range.setEnd(node, commonPos - charIndex);
				stop = true;
			}
			charIndex = nextCharIndex;
		} else {
			let i = node.childNodes.length;
			while (i--) {
				nodeStack.push(node.childNodes[i]);
			}
		}
	}
	selection = window.getSelection();
	selection.removeAllRanges();
	selection.addRange(range);
}

//Get absolute caret position inside source text
function getCaretPos(el) {
	if (el.isContentEditable) {
		el.focus()
		let _range = document.getSelection().getRangeAt(0)
		let range = _range.cloneRange()
		range.selectNodeContents(el)
		range.setEnd(_range.endContainer, _range.endOffset)
		return range.toString().length;
	}
	return el.selectionStart
}

function loadSamplecode() {
document.getElementById("cet").innerHTML = 
"## Header 2<br>#### Header 4<br>** Bold text ** _ Italic text _<br><br>[Link to Google](https://www.google.com)   ![Icon image](Off.png)<br>" + 
"1. List A<br>2. List B<br>3. List C<br> > Blockquotes <br> `Code block`";
}