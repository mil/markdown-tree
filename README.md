Markdown Tree
=============

What is it?
-----------
Take a folder with a hierarchy of markdown files and use this script to serve that folder as a live styled site with a built in navigation.

Basically this is a Sinatra script to serve a hierarchy / tree directory of markdown files as a live dynamic site. Use intended for small sites built in markdown.


Why
---
There are many similar scripts done in a static fashion but I couldn't find a minimal system for serving markdown hierarchy based sites that was dynamic.

For that reason I created Markdown Tree. Having a dynamically generated site allows me to not have to worry about regenerating my site every time I make a minor change.

Installation and Usage
-----
- Clone the repo: ```git clone git://github.com/mil/markdown-tree.git```
- Go into the directory: ```cd markdown-tree```
- Install the Sinatra and Redcarpet gems: ```gem install redcarpet sinatra```
- Run the script: ```ruby markdown-tree.rb```
	* Visit http://localhost:4567 to browse your site!

Folder Structure / Customization
--------------------------------
- **markdown-tree.rb** : The ruby script to run which serves your site
- **config.yaml** : 4 option config used by markdown-tree.rb
- **template/** : Contains the default template
	* **template.erb** : ERB template pages are built from
- **content/** : Contains the hierarchy of markdown files for your Sites

Example Sites
-------------
- [Default Example Site](http://markdown-tree.bladdo.net/)
- [My Personal Notes System](http://notes.bladdo.net) (for notes I take in class at Virginia Tech)

Todos
--------------------------------
- Clean up the default template's CSS 
- Add more error handling for reading file

Credits
-------
- Inspiration taken from static site generator mksite [mksite](http://zziplib.sourceforge.net/mksite/)
- Icons are [famfam's silk set](http://www.famfamfam.com/lab/icons/silk/)
