class DocFragment extends HTMLObjectElement{
// Define an <object is="doc-fragment"> element that will load a document fragment.
// Created internally by an <a is="include-fragment"> element.
// Destroyed automatically after document is loaded.

	constructor(){
		super();
		this.onload = function(){this.replace()};
	}

	replace(){
		let docFragment = this.contentDocument;

		if(docFragment != null){ // make sure the loaded data is a document fragment

			this.nextSibling.innerHTML = '';

			// If any, add the xml-stylesheets to the document
			for(let i = 0; i < docFragment.styleSheets.length; i++){
				let link = document.createElement("link");
				link.setAttribute('rel', 'stylesheet');
				link.setAttribute('href', docFragment.styleSheets[i].href);
				this.nextSibling.appendChild(link);
			}
			
			// Replace the content of calling <a is="include-fragment"> with the document fragment
			this.nextSibling.insertAdjacentHTML('beforeend', docFragment.documentElement.outerHTML);
		}
		else{ // not a document fragment
			this.nextSibling.resetHyperlink();
		}
		
		this.parentNode.removeChild(this);
	}
}

customElements.define('doc-fragment', DocFragment, { extends: 'object' });

class IncludeDocumentFragment extends HTMLAnchorElement{
// Define an <a is="include-fragment"> anchor element.
// The user agent is expected to download the content of the hyperlink and put it inside the anchor element.
// The hyperlink reference attribute ('href') is transformed into a source attribute ('data-src'), such that the user agent can still refer to it.
// The content of the element should reflect the content of the hyperlink in a way similar to the 'alt' attribute in the <img> element. It is overwritten if the document fragment is correctly loaded.
// 'href' attribute is mandatory.
// User agent will ignore hyperlinks not being document fragments, i.e. only text documents with markup language such as 'html', 'xhtml', 'xml', or 'txt' files. User agents should wrap a 'txt' document inside a <pre> element.
// Document fragment may consist of a single node (XML or XHTML document) or not (HTML document fragment). HTML document fragments may be a simple text node, even an empty string.
// Document fragments can also be nested one into another.
// XML documents can have <xml-stylesheet> elements to transform (XSLT) or style (CSS) its elements.
// An optional 'loading' attribute is available. Just like <img> elements, two possible values: 'eager' (default) or 'lazy'.

	constructor(){
		super();
	}

	connectedCallback(){
		if(this.getAttribute('loading') != 'lazy'){
			this.display();
		}
	}

	display(){

		// Create an <object is="doc-fragment"> to load the hyperlink content and insert it before the <a is="include-fragment"> element
		let object = document.createElement('object');
		object.setAttribute('is', 'doc-fragment');
		object.setAttribute('data', this.href);
		this.insertAdjacentHTML('beforebegin', (new XMLSerializer()).serializeToString(object)); // Must be inserting HTML; does not work if node is inserted

		// Declare the element already parsed
		this.setSource();
	}

	displayLazy(event){
		const bounding = this.getBoundingClientRect();
		const anchorHeight = this.offsetHeight;
		const anchorWidth = this.offsetWidth;

		if (
			event.type == 'beforeprint' // display all included document fragments when printing
			||(
				bounding.top >= -anchorHeight
				&& bounding.left >= -anchorWidth
		       	&& bounding.right <= (window.innerWidth || document.documentElement.clientWidth) + anchorWidth
				&& bounding.bottom <= (window.innerHeight || document.documentElement.clientHeight) + anchorHeight
			) // element is in viewport
		){			
			this.display();
		}
	}

	static update(event){
		// Look for any <a is="include-fragment"> in the document where the document fragment needs to be lazy loaded
		let anchors = document.querySelectorAll("a[is='include-fragment'][href][loading='lazy']");

		anchors.forEach(function(anchor){
			anchor.displayLazy(this);
		}, event);
	}

	setSource(){
		this.setAttribute('data-src', this.getAttribute('href'));
		this.removeAttribute('href');
		this.setAttribute('role', 'none');
	}

	resetHyperlink(){
		this.setAttribute('href', this.getAttribute('data-src'));
		this.removeAttribute('data-src');
		this.removeAttribute('role');		
	}
}

customElements.define('include-fragment', IncludeDocumentFragment, { extends: 'a' });

window.addEventListener('load', IncludeDocumentFragment.update);
window.addEventListener('scroll', IncludeDocumentFragment.update);
window.addEventListener('beforeprint', IncludeDocumentFragment.update);
