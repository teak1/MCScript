# MCS-MineCraftScript<br/>

**What is MCS?**<br/>
MCS or MineCraftScript is a command "programming" interface that implements some basic operations such as ``for``, ``if``, and functions within a single file.
While it is an ongoing project internally I am releasing this version as version 0 to get feedback on it and see if there is interest in the community.<br/>

**Running MCS.js**<br/>
MCS.js is built for [node.js](https://nodejs.org/) so running it should be simple enough if you know nodejs. If you are not familiar with nodejs then you can use the command line to call ``node [path to MCS.js] -file [filepath of mcs file]`` to get started.<br/>

**arguments**<br/>
``-file [path to build file]`` - points to the file path to build ex(``E:/xample/my_script.mcs``)<br/>
```-build``` - disables lengthening of output file names<br/>
```-namespace [arg0]``` - this is a work in progress argument

**power to the game**<br/>
All functions are called directly to minecraft are initially written in **functions** so that you keep the raw power of manually making everything, with the benifits of things like ``for`` and ``if``.

**my suggestions**
<br/>
At this time I suggest building everything with ``#@lib`` in your file until an issue around namespacing is resolved.

**leaving suggestions & help**<br/>
__``DISCORD GROUP LINK HERE``__

<h1 style="color:red;">IMPORTANT</h1>
<h2>Reserved scoreboard names</h2>
  <ul>
  <li>const</li>
  <li>args</li>
  <li>vars</li>
  </ul>
  <h2>Unlike functions, this does need the " / " to be included</h2>

**Please pardon my messy code**<br/>