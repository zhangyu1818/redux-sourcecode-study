/**
 * @param obj The object to inspect.
 * @returns True if the argument appears to be a plain object.
 */
export default function isPlainObject(obj: any): boolean {
  // 不是对象或者是null返回false
  if (typeof obj !== "object" || obj === null) return false;

  // 判断是不是字面量创建的对象
  // 字面量创建的对象的prototype是Object.prototype，即 Object.getPrototypeOf({}) === Object.prototype
  // 而 Object.create(null)的对象，它的prototype就是null
  let proto = obj;
  // 如果是Object.create(null) 创建的对象,就不会进入这个while循环
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  // 如果是字面量这里对比的就是Object.getPrototypeOf(obj) === Object.prototype 返回 true，外面调用会取反为false
  // 如果是Object.create(null) 创建的对象，这里对比的就是 null === {} 返回 false,外面调用会取反为true
  // todo 有什么意义 ？
  return Object.getPrototypeOf(obj) === proto;
}
