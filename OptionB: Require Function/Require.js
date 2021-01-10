function require(moduleName) {
  const modules = {
    Parent: Parent,
    Child: Child,
  };
  return modules[moduleName]();
}