let hTagBase = 100;	//+0 - <p> +1,2,3 ... - <h*>

let tags = []; //tags stack
let preview = ""; //Output text
let source = ""; //inner text with highlighted markdown syntax

//variables for marking text
let markTags = "`**__"; //markdown tags
let markFlags = [1, 3, 3, 3, 3];  //1-only single char, 3-single or double, 2-only double
let htmlTags = ["code", "em", "strong", "em", "strong"]; //html tags

let isParagraphClosed = true;
let currentWord = "";

function closeParagraph() {
    if (tags.length) {
        let ctag = tags.pop();
        if (ctag.tag == hTagBase) {
            preview += "</p>";
            isParagraphClosed = true;
        }
    }
}

function replaceSub(str, from, to, newText) {
  return str.substring(0, from) + newText + str.substring(to);
}

function cleanSingleTags() { //Replace unclosed single *_ with initial symbols
    while (tags.length) {
        let stored = tags[tags.length - 1];
        if (stored.tag == 1 || stored.tag == 3) { //Unpaired -> replace
            preview = replaceSub(preview, stored.pos, stored.pos + 4 ,
                              markTags.substring(stored.tag, stored.tag + 1));
            tags.pop();
        }
        else
            return;
    }
}

let htmlSpecial = "<>&";
let htmlReplace = ["&lt;", "&gt;", "&amp;"];

function isSpecial(c) { //replacing special symbols so that they are not html tags
    let e = htmlSpecial.indexOf(c);
    if (e >= 0)	{	//Special symbol &<>
        preview += htmlReplace[e];
        return true;
    }
    return false;
}

function isAlpha(c) {
	return c.toLowerCase() != c.toUpperCase();
}

function parseMarkdown(input) {
    //variables for current opened tags
    let isPrevLineEmpty = false;
    let isHeading = 0;
    let isList = 0;
	let isQuote = false;
	let nEmpty = 0;
    preview = "";
    source = "";
    let array = input.split("\n");
    for (let str = 0; str < array.length; str++) {
        currentWord = "";
        if (str > 0) {
            if(nEmpty < 2) {
				source += "<br>";
			}
            if (!isHeading && !isList && (!isParagraphClosed || !isPrevLineEmpty)) { //if it's heading or list it will make an empty string automatically
                preview += "<br>";
            } else {
                isHeading = 0;
            }
        }

        let s = array[str];
        let ns = 0;  //Current index in s
        //closing current lists
        if (isList > 1 && (s.length == 0 || s[0] != "+" || s[0] != "-")) {
            preview += "</ul>";
            isList = 0;
        }

        if (isList == 1 && (s.length == 0 || !(s[ns] >= '0' && s[ns] <= '9'))) {
            preview += "</ol>";
            isList = 0;
        }
        //unordered lists
        if (s.length > 0 && ns == 0) {
			nEmpty = 0;
            if (s[0] == "+") {
                if (isList != 2 && isList != 0) {
                    isList = 0;
                    preview += "</ul>";
                } else {
                    if (!isList) {
                        preview += "<ul>";
                        isList = 2;
                    }
                    preview += "<li>";
                    source += ("<font color = 'blue'>" + "+" + "</font>");
                    ns++;
                }
            }
            if (s[0] == "-") {
                if (isList != 3 && isList != 0) {
                    isList = 0;
                    preview += "</ul>";
                } else {
                    if (!isList) {
                        preview += "<ul>";
                        isList = 3;
                    }
                    preview += "<li>";
                    source += ("<font color = 'blue'>" + "-" + "</font>");
                    ns++;
                }
            }
        }
        //ordered lists
        while (ns < s.length && s[ns] >= '0' && s[ns] <= '9') {
            source += ("<font color = 'blue'>" + s[ns] + "</font>");
            ns++;
            if (s[ns] == '.') {
                source += ("<font color = 'blue'>" + s[ns] + "</font>");
                if (!isList) {
                    preview += "<ol>";
                    isList = 1;
                }
                preview += "<li>";
                ns++;
            }
        }
        //closing paragraph and tags if it's an empty string
        if (s.trim().length == 0) {
            cleanSingleTags();
            closeParagraph();
            isPrevLineEmpty = true;
            if (isQuote) {
                isQuote = false;
                preview += "</blockquote>";
            }
			nEmpty++;
            continue;
        }
        //headings
        if (ns == 0) {
            while (ns < s.length && s[ns] == '#') {
                ns++;
            }
            if (s[ns] > ' ') {
                ns = 0;		//<p> tag
            }
            if (ns == 0) {
                tags.push({
                    tag: (ns + hTagBase),
                    pos: preview.length
                });
            }
            if (ns > 0) {
                isHeading = ns;
                let tmp = "";
                for (let i = 0; i < ns; i++) {
                    tmp += "#";
                }
                preview += ("<h" + ns + ">");
                ns++; //Skip separating space after ###
                source += ("<font color = '#f08080'>" + tmp + " ");
            } else if (isPrevLineEmpty) {
                preview += "<p>";
                isParagraphClosed = false;
            }
        }
        //blockquotes
        if (ns == 0 && s.length > 0) {
            if (s[ns] == ">") {
                if (!isQuote) {
                    preview += "<blockquote>";
                    isQuote = true;
                }
                ns++;
                source += ("<font color = '#add8e6'>></font>");
            } else {
                if (isQuote) {
                    isQuote = false;
                    preview += "</blockquote>";
                }
            }
        }
        isPrevLineEmpty = false;
        //processing other markdown symbols
        while (ns < s.length) {
            let c = s[ns++];
            //links and images
            if (c == "[") {
                let next = s.indexOf("](", ns);
                if (next >= 0) {
                    let text = s.substring(ns, next);
                    let next1 = next + 1;
                        next = s.indexOf(")", next1);
                        if (next >= 0) {
                            let lnk = s.substring(next1 + 1, next);
                            if (ns > 1 && s[ns - 2] == "!") {
                                preview = preview.substring(0, preview.length - 1);
                                preview += ("<img src = '" + lnk + "' alt = '" + text + "'>");
                            } else {
                                preview += ("<a href = '" + lnk + "'>" + text + "</a>");
                            }
                            source += ("[<font color = 'green'>" + text +"</font>" +"](" + "<u>" + lnk + "</u>)");
                            ns = next + 1;
                            continue;
                        }
                    }
                }
            //changing special symbols
            if (isSpecial(c)) {
                source += c;
                continue;
            }
            //checking for paired markdown symbols
            let t = markTags.indexOf(c);
            let nch = 1; //number of symbols
            if (ns < s.length && c == s[ns]) {
                nch = 2;		//Next char is the same
            }
            if (t >= 0 && (markFlags[t] & nch) > 0) {	//Markdown tags + supported number of chars
                if (markFlags[t] == 3 && nch == 2) {
                    t++;	//Take next code for double char, if single is also possible
                }
                ns += nch - 1;  //Skip also 2nd char, if double
                let tg = markTags[t];
                if(nch == 2)
                    tg += markTags[t];
                if (tags[tags.length - 1].tag == t) {  //Close tag
                    tags.pop();
                    preview += ("</" + htmlTags[t] + ">");
                    source += ("<font color = 'brown'>" + tg + "</font>");
                    continue;
                }
                tags.push({tag : t,
                           pos : preview.length});
                preview += ("<" + htmlTags[t] + ">");
                source += ("<font color = 'brown'>" + tg + "</font>");
                continue;
            }
            if (c == '\\') {
                c = s.charAt(ns++);  //Keep only next symbol after
            }
            //if character isn't special add it as text
	
			if(isAlpha(c)) {
				let word=c;
				while( ns < s.length ) {
					let nc = s[ns++];
					if( !isAlpha(nc)) {
						ns--;
						break;
					}
					else
						word += nc;
				}
				let spell = word.length > 1 ? spellCheck(word) : true;
				if(!spell) source += "<font color = 'red'><u>";
				source += word;
				preview += word;
				if(!spell) source += "</u></font>";
			}
			else {
				preview += c;
				source += c;
			}
        }
        //closing heading tag and list item tag in the end of the string
        if (isHeading) {
            preview += ("</h" + isHeading + ">");
            source += "</font>";
        }
        if (isList) {
            preview += "</li>";
        }
    }
    //close tags and paragraph at the end
    cleanSingleTags();
    closeParagraph();
    //alert(source + "\n\n" + preview + "\n\n" +array[0] + "\n\n" + array[1]);
    return {txt : source,
            preview : preview};
}