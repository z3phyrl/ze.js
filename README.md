
# ze.js

i love how ejs work. but i don't like how ejs *work*.
so i make this super simple and probably insecure and inefficient ejs like library.

## how to use
use <&>...javascript...</&>

use exec(str, context) to evaluate a string.
```js

const { exec } = require("ze.js");

const str = '<div><&> return "Hello," + hello </&></div>';
const ctx = { hello: "World!" };

console.log(exec(str, ctx));
// > "<div>Hello, World!<'div>"


```
it just eval the js and replace with return output.

use exec\_file(path, context) to eval a file.
```html
<!-- in hello_world.html -->

<div>
    <&> return "Hello," + hello </&>
</div>

```
```js

exec_file("hello_world.html", { hello: "World!" });
// returns "
//  <div>
//      Hello, World!
//  </div>
// "

```

spawn a worker pool to execute file asyncly.
```js

const zewp = require("ze.js").wp;

let wp = zewp(1); // default pool size is 3

wp.exec_file("hello_world.html", { hello: "World!" }).then((res) => {
    console.log(res);
});
// it do the same thing as above just async now. yay!


```

to include other html just use exec\_file.
```html
<!-- in a.html -->

<li> return index </li>

```
```html
<!-- in b.html -->

<ul>
    <&>
        for (let i = 0; i < 5; i++) {
            join(exec_file("a.html", { index: i }));
            // join(str) is a built-in function. it just join strings.
            // it automatically return joined string when you don't return anything

            // there is also json(obj).
            // it's just an alias for JSON.stringify(obj).
        }
    </&>
</ul>
```
it'll return something like
```

<ul>
    <li>0</li>
    <li>1</li>
    <li>2</li>
    <li>3</li>
    <li>4</li>
</ul>

```
the formatting might be different idk.  
it'll work in the browser anyways.

it's just a simple find, run, and replace.  
so it'll work with anything not just html.
for example...
```
in file 1

hello world!
```
```
in file 2
<&> return exec_file("file1.txt") </&>
```
it'll output
```
in file 2
in file 1

hello world!
```

if you need debugging you can edit the ze.js file in /src to turn on DBG.  
it just going to console.log() the context on each exec.
and you can also edit the open and close tag if you want. 

that's pretty much it!  
super simple... i think.  
