# Extending the HTML Anchor Element

Following the discussion [Client side include feature for HTML](https://github.com/whatwg/html/issues/2791), this is an attempt for a proper solution that could be implemented in the HTML specification to accomplish the desired feature. The objective of this project is to fulfill the following demand in [this comment](https://github.com/whatwg/html/issues/2791#issuecomment-311365657):

> I'd encourage anyone interested in this to create a custom element that implements this functionality and try to get broad adoption. If it gets broad adoption we can consider building it into the platform, as we have done with other things like jQuery -> querySelectorAll.

## New Attribute for the Anchor Element

The concept is simple:

- When an anchor element has a predefined attribute and an `href` attribute linking to a document fragment, the content of the anchor element should be replaced by the content of the linked document;
- Ideally, user agents should implement such method natively such that *javascript* is not required;
- The method should degrade gracefully such that user agents which cannot accomplish the task can still present all the relevant information to the user.

## Typical Use

Here's an example HTML document:

```html
<!doctype html>
<html>
<head>
<title>My document</title>
<script src="loadDocFragment.js"></script>
</head>
<body>
Get to know me:

<a is="include-fragment" href ="mystats.html">My personal stats</a>
</body>
</html>
```

Where the file *mystats.html* would contain:

```html
<table>
<tbody>
<tr><th>First Name</th><td>John</td></tr>
<tr><th>Last Name</th><td>Doe</td></tr>
<tr><th>Age</th><td><a is="include-fragment" href ="myage.html">My age</a></td></tr>
<tr><th>Favorite Pet</th><td>Dog</td></tr>
</tbody>
</table>
```

Where the file *myage.html* would simply contain:

```html
32
```


The original document would automatically transform to:

```html
<!doctype html>
<html>
<head>
<title>My document</title>
<script src="loadDocFragment.js"></script>
</head>
<body>
Get to know me:

<a is="include-fragment" data-src ="mystats.html" role="none">
<table>
<tbody>
<tr><th>First Name</th><td>John</td></tr>
<tr><th>Last Name</th><td>Doe</td></tr>
<tr><th>Age</th><td>32</td></tr>
<tr><th>Favorite Pet</th><td>Dog</td></tr>
</tbody>
</table>
</a>
</body>
</html>
```

The anchor is now a transparent element without an hyperlink but with the source of the inserted document. A user agent could use this information to offer a *'Save Link As...'* or *'Open Link in New Tab'* option.

Server-side, the file *mystats.html* would be a template served with a long `max-age` caching criterion, and *myage.html* would have a `no-store` criterion to force fetching the data every time. This would efficiently manage the quantity of data requested to the server on subsequent requests.

Note that if the user agent cannot do the transformation (including the ones not using *javascript*), the hyperlinks are still valid and the user can follow them to retrieve the information. The initial content of the anchor element should be thought as the equivalent of the `alt` attribute in an `<img>` element, as it will be disposed of once the document fragment is loaded.

To further minimize data transmission and speed up page load, the actual proposition uses an additional `loading` attribute, similar to the one available with an `<img>` element, that can have the same two values:

- `eager` (default)
- `lazy`

## How it Works

Once the user agent encounters an *include-fragment* anchor element, it fetches the document with an `<object>` element it created. Once loaded, if it is a document fragment, it sets the content of the document as the content of the anchor element; and the `<object>` element is deleted.

Typical user agents can load the following document fragments that can be used within an HTML document:

- HTML (no `<html>`, `<head>`or `<body>` elements, just the document fragment itself)
- simple XML (elements might not be named according to HTML specs, but still works)
- XML with CSS stylesheet (this method includes the stylesheets along the document fragment as linked document `<link>`)
- XML with XSLT stylesheet
- text/* (usually loaded within a `<pre>` element)

Simply put, the method rejects objects without a `contentDocument` property (an image or a video, for example), thus leaving the original hyperlink.
