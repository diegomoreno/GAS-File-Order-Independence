# GAS File Order Independence

_This attempts to offer guidance on how to create [Google Apps Script](https://developers.google.com/apps-script) projects that are not reliant on file parse order._

When using the V8 runtime in Google Apps Script, a script file must be parsed before any other file can call the functions it defines. Without proper consideration, the programmer is burdened with ensuring proper file order. However, as noted in the [Google Apps Script documentation](https://developers.google.com/apps-script/guides/v8-runtime/migration#avoid_calling_functions_before_they_are_parsed):

>It's not best practice to rely on a specific file parse order to avoid this issue. The sequence of script file parsing can change if script files are copied, removed, renamed, or otherwise rearranged. It's better to remove any global variable dependency on function calls if possible.

Moreover, ES6 modules are [not supported](https://developers.google.com/apps-script/guides/v8-runtime#modern_ecmascript_syntax) in Apps Script.

## Example

| Load Order | File Code |
| --- | --- |
| 1 | ```class Child extends Parent {}``` |
| 2 | ```class Parent {}``` |

Given the file load order above, the script will fail to execute with a [ReferenceError](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ReferenceError) as the `Child` class attempts to extend `Parent`, which has not yet been declared.

_Originally pulled from the Stack Overflow question ["How to use GAS classes in different files, independent of file load order?"](https://stackoverflow.com/questions/65642470/)_

## Solution

In general terms, _**the solution is to avoid class declarations in the global scope.**_ Practically, this means wrapping each class in its own function and having the wrapper function be available globally (or in the necessary scope).

```
function Parent() {
  return class Parent {};
}
```

From here, the programmer has at least two options for how to proceed:

### Option A: Directly Calling Wrappers

Directly call the functions wrapping the class declarations. 

```
// Code.js
function main() {
  const p = new (ParentWrapper())();
}

// Parent.js
function ParentWrapper() {
  return class Parent {};
}
```

As evidenced by the additional parentheses, this approach introduces some mental overhead as these classes cannot be directly referenced, thus diverging from the [standard class syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes). In an attempt to highlight the difference between a class and its wrapper, an additional naming convention was also introduced.

### Option B: Using a `require()` Function

Implement a NodeJS-like [`require()`](https://nodejs.org/en/knowledge/getting-started/what-is-require/) function, allowing the programmer to "include modules that exist in separate files."

At the expense of having to maintain the "requirable" `modules` object, this option is very easy to understand without extra parentheses or naming conventions. The "require" concept is also very familiar to many programmers, even though this is not an exact duplication of Node's implementation.

```
// Code.js
function main() {
  const Parent = require('Parent');
  const p = new Parent();
}

// Parent.js
function Parent() {
  return class Parent {};
}

// Require.js
function require(moduleName) {
  const modules = {
    Parent: Parent,
  };
  return modules[moduleName]();
}
```

## clasp File Push Order

It should be mentioned that [clasp](https://github.com/google/clasp) offers [`filePushOrder`](https://github.com/google/clasp#filepushorder-optional) configuration setting as a very convenient way to ensure the proper file load order. However, as noted before, it is very easy for the file load order to be changed and it is thus best to avoid reliance on any particular order.

The example projects do use this configuration setting, but only to ensure that files are loaded in an order that would throw an error if order were important.

## Using the provided project files

1. Create an Apps Script project
2. Open the project folder in your console
3. Add the `scriptId` to the `.clasp.json` file in the folder
4. Run `clasp push` to push the files using the specified push order
5. In the Apps Script IDE, run `main()`