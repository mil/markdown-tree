Markdown Tree
=============
A Sinatra script to serve a hierarchy / tree directory of markdown files as a site with a simple hierarchy. Use intended for small sites built in markdown. There are many similar static scripts but I couldn't find a minimal system for a markdown hierarchy based sites that was dynamic. For that reason I created Markdown Tree.

Inspiration taken from [mksite](http://zziplib.sourceforge.net/mksite/) -- which offers a similar tree structure only it generates static files. I wanted a faster solution to managing my sites in markdown. Having a dynamically generated site allows me to not have to worry about regenerating my sites every time I make even a minor change.


Customization
-------------
- config.yaml
	* This is a configuration file with 3 options
		- Changing template-folder and hierarchy-folder allow you to change the folder names where you store your tree /hierarchyj and template
- template/template.erb
	* This is a standard ERB template, feel free to change around the structure of the HTML as much as you want -- reference the erb :template locals to find out what you have you to work with

Example Sites
-------------
- [My Personal Notes System](http://notes.bladdo.net) (for notes I take in class at Virginia Tech)

Todos
--------------------------------
- Clean up the default template's css
- Create example site using same example structure in repo
- Add more error handling for reading file
- Add support for .mkd, .markdown, and more extensions


Credits
-------
- Inspiration taken from static site generator mksite [mksite](http://zziplib.sourceforge.net/mksite/)
- Icons are [famfam's silk set](http://www.famfamfam.com/lab/icons/silk/)
